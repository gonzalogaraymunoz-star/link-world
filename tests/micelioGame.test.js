import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMicelioGame} from '../src/world/micelioGame.js';

test('game merges Control Central portfolio with LINK WORLD without duplicating businesses',()=>{
  const rows={
    businesses:[
      {id:'b1',name:'CARACOL',slug:'caracol',verification_status:'verified'},
      {id:'b2',name:'TAXI HOTEL',slug:'taxi-hotel',verification_status:'verified'}
    ],
    portfolio:[
      {id:'c1',name:'CARACOL',slug:'caracol',status:'active',metadata:{link_world_business_id:'b1'}},
      {id:'c2',name:'FLASH BOTOX',slug:'flash-botox',status:'active',metadata:{}}
    ],
    conversions:[],
    skills:[{id:'s1'}],
    skillCapabilities:[{id:'cap1'},{id:'cap2'}],
    requests:[]
  };
  const game=buildMicelioGame(rows,[
    {businessId:'b1',activeLights:7,detectedLights:12,realized:0,potential:0,opportunities:0},
    {businessId:'b2',activeLights:8,detectedLights:13,realized:0,potential:0,opportunities:0}
  ]);
  assert.equal(game.stats.knownBusinesses,3);
  assert.equal(game.stats.modeledBusinesses,2);
  assert.equal(game.stats.pendingBusinesses,1);
  assert.ok(game.missions.some(m=>m.key==='integration:flash-botox'));
});

test('commercial signals become understandable missions and preserve stale caution',()=>{
  const old=new Date(Date.now()-12*86400000).toISOString();
  const rows={
    businesses:[],
    portfolio:[{id:'c2',name:'FLASH BOTOX',slug:'flash-botox',status:'active',metadata:{}}],
    conversions:[{
      id:'x1',business_id:null,title:'Cerrar meta de 3 ventas',priority_score:100,
      conversion_reason:'Busca cierre verificable.',
      recommended_action:'Confirmar pago y registrar resultado.',
      source_updated_at:old,
      assessed_at:new Date().toISOString(),
      metadata:{client_id:'c2'}
    }],
    skills:[],skillCapabilities:[],requests:[]
  };
  const game=buildMicelioGame(rows,[]);
  const mission=game.missions.find(m=>m.key==='conversion:x1');
  assert.equal(mission.business,'FLASH BOTOX');
  assert.equal(mission.stale,true);
  assert.match(mission.title,/Revalidar/);
  assert.match(mission.prompt,/verifica/i);
});

test('saved game requests mark a mission as accepted',()=>{
  const rows={
    businesses:[],portfolio:[],conversions:[],
    skills:[{id:'s1'}],skillCapabilities:[{id:'c1'}],
    requests:[{status:'pending',evidence:{game_key:'system:capability-gap'}}]
  };
  const game=buildMicelioGame(rows,[]);
  assert.equal(game.missions.find(m=>m.key==='system:capability-gap').accepted,true);
  assert.equal(game.stats.missions,1);
});
