import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const JSON_HEADERS = {"Content-Type":"application/json","Cache-Control":"no-store"};
const MAX_BODY_CHARS = 16000;
const MAX_PAYLOAD_CHARS = 10000;
const FORBIDDEN_KEYS = new Set([
  "full_name","first_name","last_name","email","phone","whatsapp",
  "document_number","document_type","passport","rut","medical_notes",
  "dietary_restrictions","contacto","payment_link","account_number",
  "bank_name","card_number","cvv","birth_date","address","hotel_room"
]);

function reply(status:number, data:Record<string,unknown>) {
  return new Response(JSON.stringify(data), {status, headers: JSON_HEADERS});
}

function text(value:unknown, max=300) {
  return typeof value === "string" ? value.trim().slice(0,max) : "";
}

async function sha256Hex(value:string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

function timingSafeEqual(a:string,b:string) {
  if(a.length!==b.length) return false;
  let diff=0;
  for(let i=0;i<a.length;i++) diff |= a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}

function findForbiddenKey(value:unknown, path="payload"):string|null {
  if(Array.isArray(value)) {
    for(let i=0;i<value.length;i++) {
      const hit=findForbiddenKey(value[i], path+"["+i+"]");
      if(hit) return hit;
    }
    return null;
  }
  if(value && typeof value==="object") {
    for(const [key,child] of Object.entries(value as Record<string,unknown>)) {
      const normalized=key.toLowerCase().replace(/[^a-z0-9]+/g,"_");
      if(FORBIDDEN_KEYS.has(normalized)) return path+"."+key;
      const hit=findForbiddenKey(child,path+"."+key);
      if(hit) return hit;
    }
  }
  return null;
}

function secretKey() {
  const modern=Deno.env.get("SUPABASE_SECRET_KEYS");
  if(modern) {
    try {
      const parsed=JSON.parse(modern);
      if(typeof parsed?.default==="string" && parsed.default) return parsed.default;
    } catch {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

function adminHeaders(key:string, extra:Record<string,string>={}) {
  const headers:Record<string,string>={
    "apikey":key,
    "Content-Type":"application/json",
    ...extra
  };
  if(!key.startsWith("sb_secret_")) headers["Authorization"]="Bearer "+key;
  return headers;
}

async function patchConnection(base:string,key:string,id:string,patch:Record<string,unknown>) {
  await fetch(base+"/rest/v1/integration_connections?id=eq."+encodeURIComponent(id),{
    method:"PATCH",
    headers:adminHeaders(key,{"Prefer":"return=minimal"}),
    body:JSON.stringify({...patch,updated_at:new Date().toISOString()})
  });
}

Deno.serve(async (req:Request) => {
  if(req.method!=="POST") return reply(405,{ok:false,error:"method_not_allowed"});

  const rawToken=text(req.headers.get("x-link-bridge-token"),512);
  if(rawToken.length<32) return reply(401,{ok:false,error:"unauthorized"});

  let rawText="";
  try {
    rawText=await req.text();
    if(rawText.length>MAX_BODY_CHARS) return reply(413,{ok:false,error:"body_too_large"});
  } catch {
    return reply(400,{ok:false,error:"invalid_body"});
  }

  let body:Record<string,unknown>;
  try {
    body=JSON.parse(rawText);
  } catch {
    return reply(400,{ok:false,error:"invalid_json"});
  }

  const cellGlobalId=text(body.cell_global_id,120);
  const sourceProjectId=text(body.source_project_id,120);
  const eventType=text(body.event_type,120);
  const aggregateType=text(body.aggregate_type,120);
  const aggregateId=text(body.aggregate_id,80);
  const dedupeKey=text(body.dedupe_key,240);
  const occurredAt=text(body.occurred_at,80) || new Date().toISOString();
  const payload=(body.payload && typeof body.payload==="object" && !Array.isArray(body.payload))
    ? body.payload as Record<string,unknown> : null;

  if(!/^LNK-BIZ-[A-Z0-9]+$/.test(cellGlobalId)) return reply(400,{ok:false,error:"invalid_cell_global_id"});
  if(!sourceProjectId || !eventType || !aggregateType || !aggregateId || !dedupeKey || !payload)
    return reply(400,{ok:false,error:"missing_required_fields"});
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(aggregateId))
    return reply(400,{ok:false,error:"invalid_aggregate_id"});
  if(JSON.stringify(payload).length>MAX_PAYLOAD_CHARS) return reply(413,{ok:false,error:"payload_too_large"});

  const forbidden=findForbiddenKey(payload);
  if(forbidden) return reply(422,{ok:false,error:"sensitive_field_rejected",field:forbidden});

  const supabaseUrl=Deno.env.get("SUPABASE_URL") || "";
  const key=secretKey();
  if(!supabaseUrl || !key) return reply(500,{ok:false,error:"server_configuration_error"});

  const connUrl=supabaseUrl+"/rest/v1/integration_connections"+
    "?provider=eq.operational_house"+
    "&connection_key=eq."+encodeURIComponent(cellGlobalId)+
    "&status=eq.active"+
    "&select=id,webhook_token_hash,metadata"+
    "&limit=1";

  let connection:any;
  try {
    const response=await fetch(connUrl,{headers:adminHeaders(key)});
    if(!response.ok) return reply(502,{ok:false,error:"connection_lookup_failed"});
    const rows=await response.json();
    connection=Array.isArray(rows)?rows[0]:null;
  } catch {
    return reply(502,{ok:false,error:"connection_lookup_failed"});
  }

  if(!connection?.id || !connection?.webhook_token_hash)
    return reply(401,{ok:false,error:"unauthorized"});

  const tokenHash=await sha256Hex(rawToken);
  if(!timingSafeEqual(tokenHash,String(connection.webhook_token_hash)))
    return reply(401,{ok:false,error:"unauthorized"});

  const meta=connection.metadata && typeof connection.metadata==="object" ? connection.metadata : {};
  const allowed=Array.isArray(meta.allowed_event_types) ? meta.allowed_event_types : [];
  if(meta.source_project_id!==sourceProjectId) {
    await patchConnection(supabaseUrl,key,connection.id,{status:"warning",last_error:"source_project_mismatch"});
    return reply(403,{ok:false,error:"source_project_mismatch"});
  }
  if(!allowed.includes(eventType)) {
    await patchConnection(supabaseUrl,key,connection.id,{status:"warning",last_error:"event_type_not_allowed"});
    return reply(422,{ok:false,error:"event_type_not_allowed"});
  }

  const eventRow={
    source_provider: text(meta.source_provider,120) || "operational_house",
    event_type: eventType,
    entity_type: "business",
    global_id: cellGlobalId,
    external_id: aggregateType+":"+aggregateId,
    correlation_id: sourceProjectId,
    dedupe_key: dedupeKey,
    payload: {
      source_project_id: sourceProjectId,
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      event: payload
    },
    occurred_at: occurredAt
  };

  try {
    const insert=await fetch(
      supabaseUrl+"/rest/v1/event_bus?on_conflict=dedupe_key",
      {
        method:"POST",
        headers:adminHeaders(key,{
          "Prefer":"resolution=ignore-duplicates,return=representation"
        }),
        body:JSON.stringify(eventRow)
      }
    );
    if(!insert.ok) {
      const detail=(await insert.text()).slice(0,240);
      await patchConnection(supabaseUrl,key,connection.id,{status:"warning",last_error:"event_insert_failed:"+insert.status});
      return reply(502,{ok:false,error:"event_insert_failed",status:insert.status,detail});
    }

    const rows=await insert.json().catch(()=>[]);
    await patchConnection(supabaseUrl,key,connection.id,{
      status:"active",
      last_seen_at:new Date().toISOString(),
      last_error:null
    });
    return reply(200,{
      ok:true,
      accepted:true,
      deduped:!Array.isArray(rows) || rows.length===0,
      event_id:Array.isArray(rows)&&rows[0]?.id?rows[0].id:null
    });
  } catch {
    await patchConnection(supabaseUrl,key,connection.id,{status:"warning",last_error:"event_transport_exception"});
    return reply(502,{ok:false,error:"event_transport_exception"});
  }
});
