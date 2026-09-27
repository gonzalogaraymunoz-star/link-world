const asArray=value=>Array.isArray(value)?value:[];

const evidenceCount=value=>Array.isArray(value)?value.length:(value&&typeof value==='object'?1:0);

const forwardRelations=new Set(['governed_by','works_with','contains_product','associated_product']);

function normalizeState(value){
  const raw=String(value||'unknown').toLowerCase();
  if(['active','ready','connected','verified','healthy','complete'].includes(raw))return 'active';
  if(['proposed','proposal','planned','conversation','detected','pending'].includes(raw))return 'proposed';
  if(['blocked','error','failed','paused','incomplete','degraded','unhealthy'].includes(raw))return 'attention';
  return 'unknown';
}

function relationReason(relation){
  if(relation.rationale)return relation.rationale;
  const reasons={
    governed_by:'La célula comparte identidad y gobierno transversal con Control Central. Es una relación arquitectónica; no demuestra una venta ni una operación ejecutada.',
    works_with:'La contraparte está registrada en la ficha empresarial de esta célula. Relación activa y convenio económico son estados distintos.',
    contains_product:'El producto pertenece a la ficha empresarial de la célula. Su etapa y estado económico deben leerse por separado.',
    associated_product:'El producto está asociado a esta contraparte mediante su identidad canónica. La asociación no prueba ejecución ni pago.',
    counterparty_of:'La entidad está registrada como contraparte de la célula.',
    belongs_to:'La ficha de producto referencia a esta célula como propietaria.',
    provided_by:'La ficha de producto referencia a esta contraparte.',
    owns_client:'La relación se deriva directamente de link_world_clients.business_id.',
    owns_product:'La relación se deriva directamente de link_world_products.business_id.',
    client_product:'La relación se deriva directamente de link_world_products.client_id.'
  };
  return reasons[relation.relation]||'Relación registrada en el modelo vigente de LINK WORLD.';
}

function dedupeRelations(relations){
  const seen=new Set();
  const all=asArray(relations).filter(row=>row?.source_global_id&&row?.target_global_id);
  const direct=new Set(all.map(row=>`${row.source_global_id}|${row.target_global_id}|${row.relation}`));
  const inverse={counterparty_of:'works_with',belongs_to:'contains_product',provided_by:'associated_product'};
  return all.filter(row=>{
    const forward=inverse[row.relation];
    if(forward&&direct.has(`${row.target_global_id}|${row.source_global_id}|${forward}`))return false;
    if(!forwardRelations.has(row.relation)&&forward)return true;
    const key=`${row.source_global_id}|${row.target_global_id}|${row.relation}`;
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
}

function signalIndex(data,recordToGlobal){
  const index=new Map();
  const touch=(globalId,kind,row)=>{
    if(!globalId)return;
    if(!index.has(globalId))index.set(globalId,{total:0,kinds:{},latest:null,items:[]});
    const item=index.get(globalId);item.total++;item.kinds[kind]=(item.kinds[kind]||0)+1;
    const at=row?.occurred_at||row?.created_at||row?.updated_at||row?.imported_at||row?.assessed_at||null;
    if(at&&(!item.latest||new Date(at)>new Date(item.latest)))item.latest=at;
    if(item.items.length<8)item.items.push({kind,at,label:row?.event_type||row?.action||row?.title||row?.transaction_type||row?.document_type||kind});
  };
  for(const row of asArray(data.activity))touch(recordToGlobal.get(String(row.target_id)),`activity:${row.action||'change'}`,row);
  for(const row of asArray(data.events))touch(row.global_id,'event',row);
  for(const row of asArray(data.transactions))touch(row.business_global_id,'transaction',row);
  for(const row of asArray(data.documents))touch(row.business_global_id,'document',row);
  for(const row of asArray(data.calendar))touch(row.business_global_id,'calendar',row);
  for(const row of asArray(data.conversions))touch(recordToGlobal.get(String(row.business_id)),'conversion',row);
  return index;
}

export function buildMicelioModel(data={},options={}){
  const businesses=asArray(data.businesses),clients=asArray(data.clients),products=asArray(data.products);
  const entities=asArray(data.entities),cells=asArray(data.cells),bindings=asArray(data.bindings);
  const recordToGlobal=new Map();
  for(const row of [...businesses,...clients,...products])if(row?.id&&row?.global_id)recordToGlobal.set(String(row.id),row.global_id);
  const cellByEntity=new Map(cells.map(row=>[String(row.entity_id),row]));
  const entityByGlobal=new Map(entities.map(row=>[row.global_id,row]));
  const bindingsByEntity=new Map();
  for(const row of bindings){
    const key=String(row.cell_entity_id);if(!bindingsByEntity.has(key))bindingsByEntity.set(key,[]);bindingsByEntity.get(key).push(row);
  }
  const signals=signalIndex(data,recordToGlobal);
  const nodes=[];
  for(const business of businesses){
    const entity=entityByGlobal.get(business.global_id),cell=entity?cellByEntity.get(String(entity.id)):null;
    nodes.push({id:business.global_id,type:'business',label:business.name,sublabel:business.sector||business.city||'Célula LINK',status:normalizeState(cell?.health_status||business.verification_status),stage:cell?.lifecycle_stage||business.verification_status,evidenceCount:evidenceCount(business.evidence),ownerRecordId:business.id,businessId:business.id,summary:business.summary||'',updatedAt:business.updated_at,signal:signals.get(business.global_id)||null,bindings:entity?(bindingsByEntity.get(String(entity.id))||[]):[],raw:business});
  }
  for(const client of clients){
    nodes.push({id:client.global_id,type:'client',label:client.name,sublabel:client.role||'Contraparte',status:normalizeState(client.relationship_state),stage:client.relationship_state,evidenceCount:evidenceCount(client.evidence),ownerRecordId:client.id,businessId:client.business_id,summary:client.summary||'',updatedAt:client.updated_at,signal:signals.get(client.global_id)||null,bindings:[],raw:client});
  }
  for(const product of products){
    nodes.push({id:product.global_id,type:'product',label:product.name,sublabel:product.category||'Producto',status:normalizeState(product.economic_state||product.stage),stage:product.stage,evidenceCount:evidenceCount(product.evidence),ownerRecordId:product.id,businessId:product.business_id,clientId:product.client_id,summary:product.responsibility_notes||product.agreement_notes||'',updatedAt:product.updated_at,signal:signals.get(product.global_id)||null,bindings:[],raw:product});
  }

  const edges=[];
  for(const row of dedupeRelations(data.entityRelations)){
    edges.push({id:String(row.id||`entity:${edges.length}`),source:row.source_global_id,target:row.target_global_id,relation:row.relation||'related_to',label:row.label||row.relation||'relación',state:normalizeState(row.state),rawState:row.state||'unknown',evidenceCount:evidenceCount(row.evidence),origin:'entity_relations',reason:relationReason(row),createdAt:row.created_at,raw:row});
  }
  const businessById=new Map(businesses.map(row=>[String(row.id),row]));
  for(const row of asArray(data.businessRelations)){
    const source=businessById.get(String(row.source_business_id))?.global_id,target=businessById.get(String(row.target_business_id))?.global_id;
    if(!source||!target)continue;
    edges.push({id:String(row.id||`business:${edges.length}`),source,target,relation:row.relation_type||'business_relation',label:row.relation_type||'propuesta',state:normalizeState(row.state),rawState:row.state||'proposed',evidenceCount:evidenceCount(row.evidence),origin:'link_world_relations',reason:relationReason(row),createdAt:row.created_at,raw:row});
  }
  const pair=new Set(edges.map(edge=>`${edge.source}|${edge.target}`));
  const addStructural=(source,target,relation,label)=>{
    if(!source||!target||pair.has(`${source}|${target}`))return;
    const row={relation};edges.push({id:`fk:${source}:${target}:${relation}`,source,target,relation,label,state:'active',rawState:'recorded',evidenceCount:0,origin:'foreign_key',reason:relationReason(row),createdAt:null,raw:null});pair.add(`${source}|${target}`);
  };
  for(const client of clients)addStructural(businessById.get(String(client.business_id))?.global_id,client.global_id,'owns_client','ficha de cliente');
  for(const product of products){
    addStructural(businessById.get(String(product.business_id))?.global_id,product.global_id,'owns_product','ficha de producto');
    if(product.client_id)addStructural(recordToGlobal.get(String(product.client_id)),product.global_id,'client_product','producto asociado');
  }
  const known=new Set(nodes.map(node=>node.id));
  const controlIds=new Set();
  for(const edge of edges)for(const id of [edge.source,edge.target])if(!known.has(id)&&String(id).startsWith('LNK-CTL'))controlIds.add(id);
  for(const entity of entities)if(entity.entity_type==='control'||String(entity.global_id).startsWith('LNK-CTL'))controlIds.add(entity.global_id);
  for(const id of controlIds)nodes.push({id,type:'control',label:'Control Central',sublabel:'Gobierno del organismo',status:'active',stage:'governance',evidenceCount:0,ownerRecordId:entityByGlobal.get(id)?.owner_record_id||null,businessId:null,summary:'Identidad, gobierno y observación transversal del ecosistema.',updatedAt:entityByGlobal.get(id)?.updated_at||null,signal:signals.get(id)||null,bindings:[],raw:entityByGlobal.get(id)||null});
  const nodeIds=new Set(nodes.map(node=>node.id));
  const validEdges=edges.filter(edge=>nodeIds.has(edge.source)&&nodeIds.has(edge.target));
  const totals={
    businesses:businesses.length,clients:clients.length,products:products.length,relations:validEdges.length,
    rawRelations:asArray(data.entityRelations).length+asArray(data.businessRelations).length,
    organelles:bindings.length,activity:asArray(data.activity).length,events:asArray(data.events).length,
    transactions:asArray(data.transactions).length,documents:asArray(data.documents).length,calendar:asArray(data.calendar).length,
    conversions:asArray(data.conversions).length,integrations:asArray(data.integrations).length
  };
  return {schemaVersion:'link-micelio/v1',mode:options.member?'member':'open',capturedAt:options.capturedAt||new Date().toISOString(),nodes,edges:validEdges,totals,warnings:asArray(options.warnings),daily:asArray(data.daily),organelleTypes:asArray(data.organelleTypes),houses:asArray(data.houses)};
}

export function layoutMicelio(model,width=1100,height=780){
  const center={x:width/2,y:height/2+12},positions=new Map();
  const control=model.nodes.find(node=>node.type==='control');if(control)positions.set(control.id,{...center,r:52});
  const businesses=model.nodes.filter(node=>node.type==='business');
  const inner=Math.min(width,height)*.285,outer=Math.min(width,height)*.43;
  const ownerGlobal=new Map(businesses.map(node=>[String(node.businessId),node.id]));
  businesses.forEach((node,index)=>{
    const angle=(-135+(360/Math.max(1,businesses.length))*index)*Math.PI/180;
    positions.set(node.id,{x:center.x+Math.cos(angle)*inner,y:center.y+Math.sin(angle)*inner,r:44,angle});
  });
  const childrenByBusiness=new Map();
  for(const node of model.nodes.filter(node=>node.type==='client'||node.type==='product')){
    const owner=ownerGlobal.get(String(node.businessId))||'orphan';if(!childrenByBusiness.has(owner))childrenByBusiness.set(owner,[]);childrenByBusiness.get(owner).push(node);
  }
  for(const [owner,children] of childrenByBusiness){
    const parent=positions.get(owner),base=parent?.angle??Math.PI/2;
    children.sort((a,b)=>a.type.localeCompare(b.type)||a.label.localeCompare(b.label));
    children.forEach((node,index)=>{
      const spread=Math.min(Math.PI*.72,.22*Math.max(0,children.length-1));
      const angle=base-spread/2+(children.length===1?0:(spread*index/(children.length-1)));
      const ring=outer+(index%2)*28;
      positions.set(node.id,{x:center.x+Math.cos(angle)*ring,y:center.y+Math.sin(angle)*ring,r:node.type==='product'?25:27,angle});
    });
  }
  return positions;
}

export function reachable(model,origin,direction='downstream'){
  const nodes=new Set([origin]),edges=new Set(),queue=[origin];
  while(queue.length){
    const current=queue.shift();
    for(const edge of model.edges){
      const matches=direction==='upstream'?edge.target===current:edge.source===current;
      if(!matches)continue;edges.add(edge.id);
      const next=direction==='upstream'?edge.source:edge.target;
      if(!nodes.has(next)){nodes.add(next);queue.push(next);}
    }
  }
  return {nodes,edges};
}

export {normalizeState,relationReason};
