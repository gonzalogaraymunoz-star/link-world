import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MP_API="https://api.mercadopago.com";
const MAX_BODY_CHARS=32000;
const SIGNATURE_TOLERANCE_SECONDS=300;

function allowedOrigin(req:Request){
  const origin=req.headers.get("origin")||"";
  const configured=(Deno.env.get("MERCADO_PAGO_ALLOWED_ORIGINS")||"https://link-world-delta.vercel.app,http://localhost:5173")
    .split(",").map(x=>x.trim()).filter(Boolean);
  return configured.includes(origin)?origin:configured[0]||"https://link-world-delta.vercel.app";
}

function headers(req:Request){
  return {
    "Content-Type":"application/json",
    "Cache-Control":"no-store",
    "Access-Control-Allow-Origin":allowedOrigin(req),
    "Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info, x-signature, x-request-id",
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Vary":"Origin"
  };
}

function reply(req:Request,status:number,data:Record<string,unknown>){
  return new Response(JSON.stringify(data),{status,headers:headers(req)});
}

function clean(value:unknown,max=300){
  return typeof value==="string"?value.trim().slice(0,max):"";
}

function secretKey(){
  const modern=Deno.env.get("SUPABASE_SECRET_KEYS");
  if(modern){
    try{
      const parsed=JSON.parse(modern);
      if(typeof parsed?.default==="string"&&parsed.default)return parsed.default;
    }catch{}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
}

function serviceHeaders(key:string,extra:Record<string,string>={}){
  const result:Record<string,string>={apikey:key,"Content-Type":"application/json",...extra};
  if(!key.startsWith("sb_secret_"))result.Authorization="Bearer "+key;
  return result;
}

async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function hmacHex(secret:string,value:string){
  const key=await crypto.subtle.importKey(
    "raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]
  );
  const signature=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function timingSafeEqual(a:string,b:string){
  if(a.length!==b.length)return false;
  let diff=0;
  for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}

async function memberAuthorized(req:Request,supabaseUrl:string){
  const authorization=req.headers.get("authorization")||"";
  const anonKey=Deno.env.get("SUPABASE_ANON_KEY")||"";
  if(!authorization.toLowerCase().startsWith("bearer ")||!anonKey)return false;
  const response=await fetch(supabaseUrl+"/rest/v1/rpc/link_world_is_member",{
    method:"POST",
    headers:{apikey:anonKey,Authorization:authorization,"Content-Type":"application/json"},
    body:"{}"
  });
  return response.ok&&(await response.json().catch(()=>false))===true;
}

async function rpc(
  supabaseUrl:string,
  key:string,
  name:string,
  body:Record<string,unknown>,
  userAuthorization?:string
){
  const rpcHeaders=userAuthorization
    ? {apikey:Deno.env.get("SUPABASE_ANON_KEY")||"",Authorization:userAuthorization,"Content-Type":"application/json"}
    : serviceHeaders(key);
  const response=await fetch(supabaseUrl+"/rest/v1/rpc/"+name,{
    method:"POST",headers:rpcHeaders,body:JSON.stringify(body)
  });
  if(!response.ok){
    const problem=await response.json().catch(()=>({}));
    throw new Error(clean(problem?.message||problem?.hint||"database_operation_failed",500));
  }
  return await response.json();
}

function accessToken(environment:string){
  return environment==="test"
    ? Deno.env.get("MERCADO_PAGO_TEST_ACCESS_TOKEN")||""
    : Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")||"";
}

async function mercadoPago(path:string,token:string,init:RequestInit={}){
  if(!token)throw new Error("mercado_pago_credentials_missing");
  const response=await fetch(MP_API+path,{
    ...init,
    headers:{Authorization:"Bearer "+token,"Content-Type":"application/json",...(init.headers||{})}
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
    const requestId=response.headers.get("x-request-id")||null;
    const error=new Error(clean(data?.message||data?.error||"mercado_pago_request_failed",300));
    (error as Error&{requestId?:string|null}).requestId=requestId;
    throw error;
  }
  return data;
}

function parseSignature(value:string){
  const parts:Record<string,string>={};
  for(const item of value.split(",")){
    const [key,...rest]=item.trim().split("=");
    if(key&&rest.length)parts[key]=rest.join("=").trim();
  }
  return {timestamp:parts.ts||"",signature:(parts.v1||"").toLowerCase()};
}

async function verifyWebhook(req:Request,dataId:string){
  const secret=Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET")||"";
  const requestId=clean(req.headers.get("x-request-id"),300);
  const parsed=parseSignature(req.headers.get("x-signature")||"");
  if(!secret||!requestId||!parsed.timestamp||!/^[0-9a-f]{64}$/.test(parsed.signature))return false;
  const timestamp=Number(parsed.timestamp);
  if(!Number.isFinite(timestamp)||Math.abs(Math.floor(Date.now()/1000)-timestamp)>SIGNATURE_TOLERANCE_SECONDS)return false;
  const manifest="id:"+dataId.toLowerCase()+";request-id:"+requestId+";ts:"+parsed.timestamp+";";
  const expected=await hmacHex(secret,manifest);
  return timingSafeEqual(expected,parsed.signature);
}

async function webhook(req:Request,raw:string,body:Record<string,unknown>,supabaseUrl:string,key:string){
  const url=new URL(req.url);
  const bodyData=body.data&&typeof body.data==="object"?body.data as Record<string,unknown>:{};
  const dataId=clean(url.searchParams.get("data.id")||bodyData.id,120);
  if(!dataId)return reply(req,400,{ok:false,error:"missing_payment_id"});
  if(!await verifyWebhook(req,dataId))return reply(req,401,{ok:false,error:"invalid_webhook_signature"});

  const environment=body.live_mode===false?"test":"production";
  let payment:any;
  try{
    payment=await mercadoPago("/v1/payments/"+encodeURIComponent(dataId),accessToken(environment));
  }catch(error){
    return reply(req,502,{ok:false,error:"payment_verification_failed",request_id:(error as any)?.requestId||null});
  }

  const sanitized={
    id:String(payment.id||dataId),
    status:clean(payment.status,80),
    status_detail:clean(payment.status_detail,160),
    external_reference:clean(payment.external_reference,180),
    transaction_amount:Number(payment.transaction_amount),
    currency_id:clean(payment.currency_id,12),
    date_approved:clean(payment.date_approved,80)||null,
    date_last_updated:clean(payment.date_last_updated,80)||new Date().toISOString(),
    money_release_date:clean(payment.money_release_date,80)||null,
    payment_method_id:clean(payment.payment_method_id,80),
    payment_type_id:clean(payment.payment_type_id,80),
    transaction_details:{net_received_amount:Number(payment.transaction_details?.net_received_amount??payment.transaction_amount)},
    fee_details:Array.isArray(payment.fee_details)
      ? payment.fee_details.slice(0,20).map((fee:any)=>({type:clean(fee?.type,80),amount:Number(fee?.amount||0)}))
      : []
  };
  const eventKey="payment:"+sanitized.id+":"+sanitized.status+":"+sanitized.date_last_updated;

  try{
    const result=await rpc(supabaseUrl,key,"link_ingest_mercado_pago_payment_v1",{
      p_payment:sanitized,
      p_event_key:eventKey,
      p_signature_verified:true,
      p_request_id:clean(req.headers.get("x-request-id"),300)||null,
      p_payload_digest:await sha256Hex(raw)
    });
    return reply(req,200,{ok:true,accepted:true,duplicate:Boolean(result?.duplicate)});
  }catch{
    return reply(req,422,{ok:false,error:"payment_event_rejected"});
  }
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:headers(req)});
  if(req.method!=="POST")return reply(req,405,{ok:false,error:"method_not_allowed"});

  const supabaseUrl=Deno.env.get("SUPABASE_URL")||"";
  const key=secretKey();
  if(!supabaseUrl||!key)return reply(req,500,{ok:false,error:"server_configuration_error"});

  let raw="";
  let body:Record<string,unknown>={};
  try{
    raw=await req.text();
    if(raw.length>MAX_BODY_CHARS)return reply(req,413,{ok:false,error:"body_too_large"});
    body=raw?JSON.parse(raw):{};
    if(!body||typeof body!=="object"||Array.isArray(body))throw new Error();
  }catch{
    return reply(req,400,{ok:false,error:"invalid_json"});
  }

  const action=clean(new URL(req.url).searchParams.get("action")||body.action,80);
  if(action==="webhook")return webhook(req,raw,body,supabaseUrl,key);

  let isMember=false;
  try{isMember=await memberAuthorized(req,supabaseUrl);}catch{}
  if(!isMember)return reply(req,401,{ok:false,error:"link_member_session_required"});

  if(action==="verify_connection"){
    const businessId=clean(body.business_id,80);
    const environment=clean(body.environment,20)||"test";
    if(!/^[0-9a-f-]{36}$/i.test(businessId)||!["test","production"].includes(environment))
      return reply(req,400,{ok:false,error:"invalid_connection_request"});
    try{
      const account=await mercadoPago("/users/me",accessToken(environment));
      const result=await rpc(supabaseUrl,key,"link_verify_mercado_pago_account_v1",{
        p_business_id:businessId,p_environment:environment,p_external_merchant_id:String(account.id||"")
      });
      return reply(req,200,{ok:true,...result});
    }catch(error){
      return reply(req,422,{ok:false,error:"connection_verification_failed",request_id:(error as any)?.requestId||null});
    }
  }

  if(action==="create_checkout"){
    const reservationId=clean(body.reservation_id,80);
    const salesQuoteId=clean(body.sales_quote_id,80);
    const environment=clean(body.environment,20)||"test";
    const reservationValid=/^[0-9a-f-]{36}$/i.test(reservationId);
    const quoteValid=/^[0-9a-f-]{36}$/i.test(salesQuoteId);
    if((reservationValid===quoteValid)||!["test","production"].includes(environment))
      return reply(req,400,{ok:false,error:"invalid_checkout_request",hint:"provide exactly one reservation_id or sales_quote_id"});

    let prepared:any;
    try{
      prepared=reservationValid
        ? await rpc(
            supabaseUrl,key,"link_prepare_mercado_pago_checkout_v1",
            {p_reservation_id:reservationId,p_environment:environment}
          )
        : await rpc(
            supabaseUrl,key,"link_prepare_mercado_pago_quote_checkout_v1",
            {p_sales_quote_id:salesQuoteId,p_environment:environment}
          );
      if(prepared?.checkout_url)return reply(req,200,{ok:true,...prepared});

      const returnBase=Deno.env.get("MERCADO_PAGO_RETURN_BASE_URL")||"https://link-world-delta.vercel.app";
      const returnUrl=new URL(returnBase);
      returnUrl.searchParams.set("payment_intent",String(prepared.payment_intent_id));
      const notificationUrl=supabaseUrl+"/functions/v1/mercado-pago?action=webhook";
      const preference=await mercadoPago("/checkout/preferences",accessToken(environment),{
        method:"POST",
        headers:{"X-Idempotency-Key":String(prepared.payment_intent_id)},
        body:JSON.stringify({
          items:[{
            id:String(prepared.service_code||prepared.product_key||"link-service"),
            title:prepared.reservation_code
              ? "Traslado Taxi Hotel · "+String(prepared.reservation_code)
              : String(prepared.business_name||"LINK")+" · "+String(prepared.quote_number||"cotización"),
            quantity:1,currency_id:String(prepared.currency||"CLP"),unit_price:Number(prepared.gross_amount)
          }],
          external_reference:String(prepared.external_reference),
          notification_url:notificationUrl,
          back_urls:{success:returnUrl.toString(),pending:returnUrl.toString(),failure:returnUrl.toString()},
          auto_return:"approved",
          statement_descriptor:"LINK",
          metadata:{
            payment_intent_id:String(prepared.payment_intent_id),environment,
            business_slug:String(prepared.business_slug||"taxi-hotel"),
            sales_quote_id:salesQuoteId||null,
            reservation_id:reservationId||null
          }
        })
      });
      const recorded=await rpc(supabaseUrl,key,"link_record_mercado_pago_preference_v1",{
        p_payment_intent_id:prepared.payment_intent_id,
        p_preference_id:String(preference.id||""),
        p_checkout_url:clean(preference.init_point,1000)||null,
        p_sandbox_checkout_url:clean(preference.sandbox_init_point,1000)||null,
        p_expires_at:clean(preference.expiration_date_to,80)||null
      });
      return reply(req,200,{ok:true,...recorded,environment,amount:prepared.gross_amount,currency:prepared.currency});
    }catch(error){
      if(prepared?.payment_intent_id){
        try{await rpc(supabaseUrl,key,"link_fail_mercado_pago_checkout_v1",{
          p_payment_intent_id:prepared.payment_intent_id,p_error:clean((error as Error)?.message,500)||"checkout_failed"
        });}catch{}
      }
      const message=clean((error as Error)?.message,300);
      const safeError=message.includes("credentials")?"mercado_pago_credentials_missing"
        :message.includes("tax profile")?"verified_tax_profile_required"
        :message.includes("safety latch")?"production_charges_disabled"
        :message.includes("financial policy")?"financial_policy_not_ready"
        :message.includes("collection model")?"collection_model_not_supported"
        :message.includes("route is not configured")?"payment_route_not_configured"
        :message.includes("confirmed availability")?"availability_confirmation_required"
        :message.includes("quote")?"sales_quote_not_ready"
        :"checkout_creation_failed";
      return reply(req,422,{ok:false,error:safeError,request_id:(error as any)?.requestId||null});
    }
  }

  return reply(req,400,{ok:false,error:"unsupported_action"});
});
