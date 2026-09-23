import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/director.js';

const body={
  action:'chat',url:'https://openrouter.ai/api/v1/chat/completions',
  model:'openrouter/free',apiKey:'sk-or-v1-testtoken-not-a-real-key',
  prompt:'¿Qué negocios pueden colaborar en LINK?',mode:'strict-zero',
  context:{strategy:'Cooperación',cell:'Lama Travelers',mission:'DEMO'}
};
const invoke=async(data,method='POST')=>{
  const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},
    end(raw){this.result=JSON.parse(raw);}};
  await handler({method,headers:{origin:'https://link-world-delta.vercel.app'},body:data},res);
  return res;
};
test('GET documents unlimited LOCAL attempts and no global billing cap',async()=>{
  const r=await invoke(null,'GET');
  assert.equal(r.statusCode,200);
  assert.equal(r.result.appDailyCap,null);
  assert.equal(r.result.providerQuotaApplies,true);
  assert.equal(r.result.serverGlobalHardCap,false);
});
test('paid models and arbitrary URLs are refused without provider requests',async()=>{
  const before=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;throw Error('should not fetch');};
  try{
    for(const model of ['openrouter/auto','anthropic/claude-sonnet-4','openai/gpt-4o']){
      const r=await invoke({...body,model});
      assert.equal(r.statusCode,403);
    }
    assert.equal((await invoke({...body,url:'https://evil.test/chat'})).statusCode,403);
    assert.equal(calls,0);
  }finally{global.fetch=before;}
});
test('key verification uses GET /api/v1/key and generates no tokens',async()=>{
  const before=global.fetch,seen=[];
  global.fetch=async(url,opts)=>{
    seen.push({url,opts});
    return {ok:true,status:200,json:async()=>({data:{label:'test',is_free_tier:true}})};
  };
  try{
    const r=await invoke({...body,action:'check'});
    assert.equal(r.statusCode,200);
    assert.equal(r.result.connected,true);
    assert.equal(r.result.modelVerified,false);
    assert.equal(seen.length,1);
    assert.equal(seen[0].url,'https://openrouter.ai/api/v1/key');
    assert.equal(seen[0].opts.method,'GET');
  }finally{global.fetch=before;}
});
test('only one capped free-model request with bounded scoped context',async()=>{
  const before=global.fetch;let calls=0,received;
  global.fetch=async(url,options)=>{
    calls++;received={url,options};
    return {ok:true,status:200,json:async()=>({model:'nvidia/test:free',
      choices:[{message:{content:'Datos, alternativas y próxima acción.'}}],
      usage:{prompt_tokens:60,completion_tokens:18}})};
  };
  try{
    const r=await invoke({...body,context:{approvedAppSnapshot:'{"businesses":[]}',appDataStatus:'Usuario autorizado'}});
    assert.equal(r.statusCode,200);assert.equal(calls,1);
    assert.equal(received.url,'https://openrouter.ai/api/v1/chat/completions');
    const request=JSON.parse(received.options.body);
    assert.equal(request.model,'openrouter/free');
    assert.equal(request.max_tokens,1100);
    assert.equal(request.models,undefined);
    assert.match(request.messages[0].content,/NO CONFIABLES/);
    assert.equal(r.result.answer,'Datos, alternativas y próxima acción.');
  }finally{global.fetch=before;}
});
test('rate-limit stops after one attempt with no paid fallback',async()=>{
  const before=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return {ok:false,status:429};};
  try{
    const r=await invoke(body);
    assert.equal(r.statusCode,429);assert.equal(calls,1);
  }finally{global.fetch=before;}
});
test('oversized context fails before external request',async()=>{
  const before=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;throw Error('should not fetch');};
  try{
    const r=await invoke({...body,context:{approvedAppSnapshot:'x'.repeat(9000)}});
    assert.equal(r.statusCode,413);assert.equal(calls,0);
  }finally{global.fetch=before;}
});
