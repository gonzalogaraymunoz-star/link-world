const asArray=value=>Array.isArray(value)?value:[];

const evidenceCount=value=>Array.isArray(value)?value.length:(value&&typeof value==='object'?1:0);

const forwardRelations=new Set(['governed_by','works_with','contains_product','associated_product','governs_agent','supervises_stage_director','governs_process','hands_off_to']);

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
    client_product:'La relación se deriva directamente de link_world_products.client_id.',
    governs_agent:'CONTROL CENTRAL gobierna este agente mediante una relación canónica.',
    supervises_stage_director:'LINK Director tutela este Director transversal de etapa.',
    governs_process:'El Director de etapa custodia este proceso transversal del Customer Journey.',
    hands_off_to:'Handoff canónico entre etapas consecutivas del Customer Journey LINK.',
    stage_operates_on:'Existe una misión real que conecta este proceso con la célula indicada.'
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
  const skills=asArray(data.skills),stageProcesses=asArray(data.stageProcesses),agentMissions=asArray(data.agentMissions);
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
  const skillById=new Map(skills.map(row=>[String(row.id),row]));
  for(const entity of entities.filter(row=>row.entity_type==='agent')){
    const skill=skillById.get(String(entity.owner_record_id));
    if(!skill)continue;
    const metadata={...(skill.metadata||{}),...(entity.metadata||{})};
    const role=metadata.role||((skill.slug==='link-director')?'link_director':'agent');
    nodes.push({
      id:entity.global_id,type:'agent',label:skill.name||metadata.label||skill.slug,
      sublabel:role==='stage_director'?'Director de etapa':role==='link_director'?'Dirección del organismo':'Agente LINK',
      status:normalizeState(entity.status||skill.status),stage:metadata.stage_key||'governance',
      stageKey:metadata.stage_key||null,stageNumber:Number(metadata.stage_number)||null,
      agentSlug:skill.slug,agentRole:role,evidenceCount:0,ownerRecordId:skill.id,businessId:null,
      summary:skill.description||'',updatedAt:entity.updated_at||skill.updated_at,signal:signals.get(entity.global_id)||null,
      bindings:[],raw:{entity,skill}
    });
  }

  const processGlobalByStage=new Map();
  for(const process of stageProcesses){
    const entity=entities.find(row=>row.entity_type==='process'&&String(row.owner_record_id)===String(process.id));
    if(!entity)continue;
    processGlobalByStage.set(process.stage_key,entity.global_id);
    nodes.push({
      id:entity.global_id,type:'process',label:process.name,sublabel:'Proceso '+process.stage_number+' / 6',
      status:normalizeState(process.status),stage:process.stage_key,stageKey:process.stage_key,stageNumber:Number(process.stage_number),
      directorSlug:process.director_slug,evidenceCount:0,ownerRecordId:process.id,businessId:null,
      summary:process.description||'',updatedAt:process.updated_at,signal:signals.get(entity.global_id)||null,
      bindings:[],raw:process
    });
  }

  const edges=[];
  for(const row of dedupeRelations(data.entityRelations)){
    edges.push({id:String(row.id||`entity:${edges.length}`),source:row.source_global_id,target:row.target_global_id,relation:row.relation||'related_to',label:row.label||row.relation||'relación',state:normalizeState(row.state),rawState:row.state||'unknown',evidenceCount:evidenceCount(row.evidence),origin:'entity_relations',reason:relationReason(row),createdAt:row.created_at,raw:row});
  }
  for(const mission of agentMissions){
    if(['cancelled','verified'].includes(String(mission.status||'').toLowerCase()))continue;
    const source=processGlobalByStage.get(mission.stage_key);
    const target=mission.business_global_id;
    if(!source||!target)continue;
    edges.push({
      id:'mission:'+mission.id,source,target,relation:'stage_operates_on',
      label:mission.title||('Misión '+mission.stage_key),
      state:normalizeState(mission.status==='blocked'?'blocked':mission.status==='proposed'?'proposed':'active'),
      rawState:mission.status||'unknown',evidenceCount:0,origin:'agent_mission',
      reason:'Misión '+mission.mission_code+' · '+(mission.problem_statement||'restricción registrada'),
      createdAt:mission.created_at,raw:mission
    });
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
    businesses:businesses.length,clients:clients.length,products:products.length,
    agents:nodes.filter(node=>node.type==='agent').length,
    processes:nodes.filter(node=>node.type==='process').length,
    missions:agentMissions.filter(row=>!['cancelled','verified'].includes(String(row.status||'').toLowerCase())).length,
    relations:validEdges.length,
    rawRelations:asArray(data.entityRelations).length+asArray(data.businessRelations).length,
    organelles:bindings.length,activity:asArray(data.activity).length,events:asArray(data.events).length,
    transactions:asArray(data.transactions).length,documents:asArray(data.documents).length,calendar:asArray(data.calendar).length,
    conversions:asArray(data.conversions).length,integrations:asArray(data.integrations).length
  };
  return {schemaVersion:'link-micelio/v1',mode:options.member?'member':'open',capturedAt:options.capturedAt||new Date().toISOString(),nodes,edges:validEdges,totals,warnings:asArray(options.warnings),daily:asArray(data.daily),organelleTypes:asArray(data.organelleTypes),houses:asArray(data.houses)};
}

export function layoutMicelio(model,width=1100,height=780){
  const nodes=model.nodes||[],edges=model.edges||[],center={x:width/2,y:height/2};
  const degree=new Map(nodes.map(node=>[node.id,0]));
  for(const edge of edges){
    degree.set(edge.source,(degree.get(edge.source)||0)+1);
    degree.set(edge.target,(degree.get(edge.target)||0)+1);
  }
  const seed=value=>{
    let h=2166136261;
    for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
    return (h>>>0)/4294967295;
  };
  const stageX=stageNumber=>{
    const n=Math.max(1,Math.min(6,Number(stageNumber)||1));
    return width*(.09+((n-1)/5)*.82);
  };
  const anchorFor=node=>{
    if(node.type==='control')return {x:center.x,y:46,strength:.12};
    if(node.type==='agent'&&node.agentRole==='link_director')return {x:center.x,y:112,strength:.11};
    if(node.type==='agent'&&node.stageNumber)return {x:stageX(node.stageNumber),y:194,strength:.10};
    if(node.type==='process'&&node.stageNumber)return {x:stageX(node.stageNumber),y:306,strength:.11};
    if(node.type==='business')return {x:width*(.12+.76*seed(node.id+'bx')),y:450+70*seed(node.id+'by'),strength:.035};
    if(node.type==='client')return {x:width*(.10+.80*seed(node.id+'cx')),y:545+55*seed(node.id+'cy'),strength:.02};
    if(node.type==='product')return {x:width*(.10+.80*seed(node.id+'px')),y:600+25*seed(node.id+'py'),strength:.018};
    return {x:center.x,y:center.y,strength:.01};
  };
  const point=new Map();
  nodes.forEach((node,index)=>{
    const anchor=anchorFor(node);
    const a=seed(node.id)*Math.PI*2;
    const refs=degree.get(node.id)||0;
    const floor=node.type==='control'?29:node.type==='agent'?22:node.type==='process'?20:node.type==='business'?18:node.type==='client'?13:11;
    const ceiling=node.type==='control'?46:node.type==='agent'?36:node.type==='process'?32:40;
    const r=Math.min(ceiling,floor+Math.sqrt(refs)*4.2);
    const jitter=node.type==='control'||node.type==='agent'||node.type==='process'?4:32;
    point.set(node.id,{x:anchor.x+Math.cos(a)*jitter,y:anchor.y+Math.sin(a)*jitter,vx:0,vy:0,r,angle:a,index,anchor});
  });
  const iterations=Math.min(240,100+nodes.length*2);
  const repelBase=Math.max(1200,Math.min(7200,175000/Math.max(8,nodes.length)));
  const linkDistance=Math.max(70,Math.min(142,118-Math.min(50,nodes.length)*.6));
  for(let tick=0;tick<iterations;tick++){
    const alpha=1-tick/iterations;
    const list=[...point.entries()];
    for(let i=0;i<list.length;i++){
      const [,a]=list[i];
      for(let j=i+1;j<list.length;j++){
        const [,b]=list[j];
        let dx=b.x-a.x,dy=b.y-a.y;
        const d2=Math.max(120,dx*dx+dy*dy),d=Math.sqrt(d2);
        const strength=repelBase/d2*alpha;
        dx/=d;dy/=d;
        a.vx-=dx*strength;b.vx+=dx*strength;
        a.vy-=dy*strength;b.vy+=dy*strength;
      }
    }
    for(const edge of edges){
      const a=point.get(edge.source),b=point.get(edge.target);if(!a||!b)continue;
      let dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));
      const structural=['supervises_stage_director','governs_process','hands_off_to'].includes(edge.relation);
      const target=structural?Math.max(62,(a.r+b.r)*1.45):linkDistance+(a.r+b.r)*.55;
      const spring=(d-target)*(structural?.022:.010)*alpha*(edge.state==='proposed'?.65:1);
      dx/=d;dy/=d;
      a.vx+=dx*spring;b.vx-=dx*spring;
      a.vy+=dy*spring;b.vy-=dy*spring;
    }
    for(const node of nodes){
      const p=point.get(node.id);if(!p)continue;
      p.vx+=(p.anchor.x-p.x)*p.anchor.strength*alpha;
      p.vy+=(p.anchor.y-p.y)*p.anchor.strength*alpha;
      p.vx*=.82;p.vy*=.82;
      p.x+=p.vx;p.y+=p.vy;
      const pad=p.r+18;
      p.x=Math.max(pad,Math.min(width-pad,p.x));
      p.y=Math.max(pad,Math.min(height-pad,p.y));
    }
  }
  return new Map([...point.entries()].map(([id,p])=>[id,{x:p.x,y:p.y,r:p.r,angle:p.angle}]));
}

export function localNeighborhood(model,origin,depth=1){
  const limit=Math.max(1,Math.min(3,Number(depth)||1));
  const nodes=new Set(origin?[origin]:[]),edges=new Set();
  if(!origin)return {nodes,edges};
  let frontier=new Set([origin]);
  for(let level=0;level<limit;level++){
    const next=new Set();
    for(const edge of model.edges||[]){
      if(frontier.has(edge.source)||frontier.has(edge.target)){
        edges.add(edge.id);
        if(!nodes.has(edge.source)){nodes.add(edge.source);next.add(edge.source);}
        if(!nodes.has(edge.target)){nodes.add(edge.target);next.add(edge.target);}
      }
    }
    frontier=next;
    if(!frontier.size)break;
  }
  return {nodes,edges};
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
