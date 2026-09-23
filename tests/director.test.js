import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/director.js';

const body={
  url:'https://openrouter.ai/api/v1/chat/completions',
  model:'openrouter/free',
  apiKey:'sk-or-v1-testtoken-not-a-real-key',
  prompt:'Ayúdame a explorar opciones para una célula LINK.',
  mode:'strict-zero',context:{strategy:'Demanda',cell:'Lama Travelers',mission:'DEMO'}
};
const invoke=async(data,method='POST')=>{
  const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k]=v;},end(raw){this.result=JSON.parse(raw);}};
  await handler({method,headers:{origin:'https://link-world-delta.vercel.app'},body:data},res);
  return res;
};
test('GET documents client limit without claiming a global billing ceiling',async()=>{
  const r=await invoke(null,'GET');
  assert.equal(r.statusCode,200);
  assert.equal(r.result.serverGlobalHardCap,false);
  assert.equal(r.result.requestsPerBrowserDay,5);
});
test('paid models are blocked without external fetch',async()=>{
  const previous=global.fetch;let called=0;
  global.fetch=async()=>{called++;throw new Error('should not fetch');};
  try {
    for(const model of ['anthropic/claude-sonnet-4','openrouter/auto','openai/gpt-4o']){
      const r=await invoke({...body,model});
      assert.equal(r.statusCode,403);
      assert.match(r.result.error,/free/i);
    }
    assert.equal(called,0);
  }finally{global.fetch=previous;}
});
test('arbitrary endpoints are blocked without external fetch',async()=>{
  const previous=global.fetch;let called=0;
  global.fetch=async()=>{called++;throw new Error('should not fetch');};
  try{
    const r=await invoke({...body,url:'https://example.com/redirect'});
    assert.equal(r.statusCode,403);
    assert.equal(called,0);
  }finally{global.fetch=previous;}
});
test('free model receives capped single OpenRouter request, no paid fallbacks',async()=>{
  const previous=global.fetch;let called=0,external;
  global.fetch=async(url,options)=>{
    called++;external={url,options};
    return {ok:true,status:200,json:async()=>({model:'openrouter/free',choices:[{message:{content:'Dos opciones y una acción verificable.'}}],usage:{prompt_tokens:34,completion_tokens:18}})};
  };
  try{
    const r=await invoke(body);
    assert.equal(r.statusCode,200);
    assert.equal(called,1);
    assert.equal(external.url,'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(JSON.parse(external.options.body).model,'openrouter/free');
    assert.equal(JSON.parse(external.options.body).max_tokens,700);
    assert.equal(JSON.parse(external.options.body).models,undefined);
    assert.equal(r.result.status,'proposal_only');
    assert.equal(r.result.answer,'Dos opciones y una acción verificable.');
  }finally{global.fetch=previous;}
});
test('OpenRouter rate limit does not retry or select a paid model',async()=>{
  const previous=global.fetch;let called=0;
  global.fetch=async()=>{called++;return {ok:false,status:429};};
  try{
    const r=await invoke(body);
    assert.equal(r.statusCode,429);assert.equal(called,1);
  }finally{global.fetch=previous;}
});
