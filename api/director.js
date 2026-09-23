import { readFileSync } from 'node:fs';
// LINK WORLD Director IA · Vercel Function.
// One Markdown policy is the runtime source of truth; the reusable skill routes here.
const INSTRUCTIONS = readFileSync(new URL('./LINK_DIRECTOR_SYSTEM.md', import.meta.url),'utf8');
// Deliberately fail-closed: free-tier-only, no generic arbitrary-URL proxy,
// no automatic billing fallback, no persistent API keys or conversations.
const PUBLIC_ORIGIN = process.env.PUBLIC_SITE_ORIGIN || 'https://link-world-delta.vercel.app';
const FREE_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_INPUT_CHARS = 1800;
const MAX_OUTPUT_TOKENS = 700;

function send(res, status, data) {
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.end(JSON.stringify(data));
}
function sanitizeText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0,max) : '';
}
export default async function handler(req,res) {
  if (req.method==='GET') return send(res,200,{
    enabled:true,mode:'free-account-only',requestsPerBrowserDay:5,outputTokenCap:MAX_OUTPUT_TOKENS,
    inputCharCap:MAX_INPUT_CHARS,endpoints:[FREE_ENDPOINT],serverGlobalHardCap:false
  });
  if(req.method!=='POST') return send(res,405,{error:'Método no permitido.'});
  const origin=req.headers.origin || '';
  if(origin!==PUBLIC_ORIGIN) return send(res,403,{error:'Origen no autorizado.'});
  let raw=req.body;
  if(typeof raw==='string') {
    if(raw.length>16000) return send(res,413,{error:'Solicitud demasiado extensa.'});
    try {raw=JSON.parse(raw);}catch{return send(res,400,{error:'JSON inválido.'});}
  }
  if(!raw || typeof raw!=='object' || JSON.stringify(raw).length>16000) return send(res,413,{error:'Solicitud demasiado extensa.'});
  if(raw.freeAccountConfirmed!==true) return send(res,403,{error:'Confirma que tu cuenta está en el plan Free y sin facturación de pago.'});
  if(raw.mode!=='strict-zero') return send(res,403,{error:'Sólo está disponible el modo $0.'});
  const url=sanitizeText(raw.url,250).replace(/\/$/,'');
  if(url!==FREE_ENDPOINT) return send(res,403,{
    error:'Modo $0: este servidor sólo permite Groq Free. URL personalizada requiere revisión y autorización explícita; no se envió ninguna solicitud.'
  });
  const key=sanitizeText(raw.apiKey,256);
  if(key.length<15 || /[\s\x00-\x1f]/.test(key)) return send(res,400,{error:'Clave inválida. No se ha enviado nada.'});
  const model=sanitizeText(raw.model,100);
  if(!/^[a-zA-Z0-9._/-]{3,100}$/.test(model)) return send(res,400,{error:'Nombre de modelo inválido.'});
  const userPrompt=sanitizeText(raw.prompt,MAX_INPUT_CHARS+1);
  if(userPrompt.length<3 || userPrompt.length>MAX_INPUT_CHARS) return send(res,400,{error:'La solicitud debe tener entre 3 y 1800 caracteres.'});
  const ownContext=raw.context && typeof raw.context==='object' ? raw.context : {};
  const strategy=sanitizeText(ownContext.strategy,70);
  const cell=sanitizeText(ownContext.cell,100);
  const mission=sanitizeText(ownContext.mission,100);
  const system=INSTRUCTIONS+'\n\nContexto LINK propio (no información de Google Places): '+JSON.stringify({strategy,cell,mission}).slice(0,500);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),13000);
  try {
    const response=await fetch(FREE_ENDPOINT,{
      method:'POST',redirect:'manual',signal:controller.signal,
      headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({
        model,messages:[{role:'system',content:system},{role:'user',content:userPrompt}],
        temperature:0.3,max_completion_tokens:MAX_OUTPUT_TOKENS,stream:false
      })
    });
    if(response.status===429) return send(res,429,{error:'El proveedor alcanzó su cuota gratuita. LINK no reintenta ni cambia a pago.'});
    if(response.status===401||response.status===403) return send(res,401,{error:'Proveedor rechazó la clave o el acceso al modelo. No se cobró nada desde LINK.'});
    if(!response.ok) return send(res,502,{error:'El proveedor no aceptó la solicitud. Revisa plan Free, URL, modelo y cuota; no hay cambio a pago.'});
    const result=await response.json();
    const answer=result?.choices?.[0]?.message?.content;
    if(typeof answer!=='string'||!answer.trim()) return send(res,502,{error:'No se recibió una respuesta de texto.'});
    const usage=result?.usage || {};
    return send(res,200,{
      answer:answer.slice(0,6500),
      model:sanitizeText(result.model||model,100),
      usage:{inputTokens:Math.max(0,Number(usage.prompt_tokens)||0),outputTokens:Math.max(0,Number(usage.completion_tokens)||0)},
      status:'proposal_only',source:'IA externa; no verificada',
      reminder:'No se ejecutó ninguna operación real.'
    });
  }catch(error){
    return send(res,error?.name==='AbortError'?504:502,{
      error:error?.name==='AbortError'?'Tiempo de respuesta agotado. No se reintenta.':'No se pudo contactar al proveedor. No se reintenta ni cambia a pago.'
    });
  }finally{clearTimeout(timeout);}
}
