import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMicelioModel,layoutMicelio,reachable,localNeighborhood} from '../src/world/micelioModel.js';

const fixture={
  businesses:[
    {id:'b1',global_id:'LNK-BIZ-001',name:'Hotel Experience',sector:'Hospitalidad',verification_status:'verified',evidence:[{kind:'record'}]},
    {id:'b2',global_id:'LNK-BIZ-002',name:'Taxi Hotel',sector:'Transporte',verification_status:'needs_review'}
  ],
  clients:[{id:'c1',global_id:'LNK-CLI-001',business_id:'b1',name:'Cliente Uno',role:'Contraparte',relationship_state:'active'}],
  products:[{id:'p1',global_id:'LNK-PRD-001',business_id:'b1',client_id:'c1',name:'Experiencia',category:'Servicio',stage:'active',economic_state:'active'}],
  entities:[{id:'control',global_id:'LNK-CTL-001',entity_type:'control',updated_at:'2026-09-27T00:00:00Z'}],
  entityRelations:[
    {id:'r1',source_global_id:'LNK-BIZ-001',target_global_id:'LNK-CLI-001',relation:'works_with',label:'trabaja con',state:'active'},
    {id:'r2',source_global_id:'LNK-CLI-001',target_global_id:'LNK-BIZ-001',relation:'counterparty_of',label:'contraparte de',state:'active'},
    {id:'r3',source_global_id:'LNK-BIZ-001',target_global_id:'LNK-CTL-001',relation:'governed_by',label:'gobernado por',state:'active'}
  ],
  businessRelations:[{id:'proposal',source_business_id:'b2',target_business_id:'b1',relation_type:'transport_provider_candidate',state:'proposed',rationale:'Puede prestar transporte si existe acuerdo.'}],
  events:[{global_id:'LNK-BIZ-001',event_type:'gesture.updated',occurred_at:'2026-09-27T00:00:00Z'}]
};

test('Micelio keeps canonical routes, drops inverse duplicates and separates proposals',()=>{
  const model=buildMicelioModel(fixture,{member:true,capturedAt:'2026-09-27T01:00:00Z'});
  assert.equal(model.mode,'member');
  assert.ok(model.nodes.some(node=>node.id==='LNK-CTL-001'&&node.type==='control'));
  assert.equal(model.edges.filter(edge=>edge.relation==='counterparty_of').length,0);
  assert.equal(model.edges.filter(edge=>edge.id==='proposal')[0].state,'proposed');
  assert.match(model.edges.find(edge=>edge.id==='proposal').reason,/acuerdo/i);
  assert.equal(model.nodes.find(node=>node.id==='LNK-BIZ-001').signal.total,1);
});

test('Micelio derives missing fiche routes from real foreign keys without inventing evidence',()=>{
  const model=buildMicelioModel({...fixture,entityRelations:[]},{member:false});
  const clientRoute=model.edges.find(edge=>edge.relation==='owns_client');
  const productRoute=model.edges.find(edge=>edge.relation==='owns_product');
  const association=model.edges.find(edge=>edge.relation==='client_product');
  assert.equal(clientRoute.origin,'foreign_key');
  assert.equal(clientRoute.evidenceCount,0);
  assert.equal(productRoute.source,'LNK-BIZ-001');
  assert.equal(association.source,'LNK-CLI-001');
});

test('Circular layout is deterministic and reachability follows edge direction',()=>{
  const model=buildMicelioModel(fixture,{member:true});
  const one=layoutMicelio(model,1100,760),two=layoutMicelio(model,1100,760);
  assert.deepEqual(one.get('LNK-BIZ-001'),two.get('LNK-BIZ-001'));
  assert.ok(one.get('LNK-BIZ-001').r>one.get('LNK-CLI-001').r);
  const downstream=reachable(model,'LNK-BIZ-001','downstream');
  assert.ok(downstream.nodes.has('LNK-CLI-001'));
  assert.ok(downstream.nodes.has('LNK-PRD-001'));
  const upstream=reachable(model,'LNK-CLI-001','upstream');
  assert.ok(upstream.nodes.has('LNK-BIZ-001'));
});


test('local graph expands by depth and keeps only registered neighborhood',()=>{
  const model=buildMicelioModel(fixture,{member:true});
  const depth1=localNeighborhood(model,'LNK-CTL-001',1);
  assert.ok(depth1.nodes.has('LNK-BIZ-001'));
  assert.ok(!depth1.nodes.has('LNK-CLI-001'));
  assert.ok(!depth1.nodes.has('LNK-PRD-001'));
  const depth2=localNeighborhood(model,'LNK-CTL-001',2);
  assert.ok(depth2.nodes.has('LNK-CLI-001'));
  assert.ok(depth2.nodes.has('LNK-PRD-001'));
  assert.ok(depth2.edges.size>=depth1.edges.size);
});

test('force layout makes referenced nodes larger while staying deterministic',()=>{
  const model=buildMicelioModel(fixture,{member:true});
  const one=layoutMicelio(model,900,640),two=layoutMicelio(model,900,640);
  assert.deepEqual(one.get('LNK-BIZ-001'),two.get('LNK-BIZ-001'));
  assert.ok(one.get('LNK-BIZ-001').r>=one.get('LNK-CLI-001').r);
});
