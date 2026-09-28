const slugify=value=>String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const daysSince=value=>{
  if(!value)return null;
  const t=new Date(value).getTime();
  if(!Number.isFinite(t))return null;
  return Math.max(0,Math.floor((Date.now()-t)/86400000));
};

const money=value=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Number(value)||0);

function acceptedKeys(requests=[]){
  return new Set(requests.filter(r=>!['completed','closed','done','cancelled'].includes(String(r.status||'').toLowerCase()))
    .map(r=>r.evidence?.game_key).filter(Boolean));
}

function portfolioRows({businesses=[],portfolio=[],evolution=[],conversions=[]}={}){
  const evoById=new Map(evolution.map(row=>[String(row.businessId),row]));
  const bySlug=new Map();

  for(const b of businesses){
    const slug=b.slug||slugify(b.name);
    const evo=evoById.get(String(b.id))||{};
    bySlug.set(slug,{
      key:'business:'+slug,
      name:b.name,
      slug,
      status:b.verification_status||'draft',
      source:'link_world',
      modeled:true,
      linkWorldId:b.id,
      portfolioId:null,
      activeLights:Number(evo.activeLights||0),
      detectedLights:Number(evo.detectedLights||0),
      realized:Number(evo.realized||0),
      potential:Number(evo.potential||0),
      opportunities:Number(evo.opportunities||0)
    });
  }

  for(const c of portfolio){
    if(c.archived_at)return;
    const slug=c.slug||slugify(c.name);
    const linked=c.metadata?.link_world_business_id||null;
    const current=bySlug.get(slug);
    if(current){
      current.portfolioId=c.id;
      current.portfolioStatus=c.status;
      if(linked&&!current.linkWorldId)current.linkWorldId=linked;
      continue;
    }
    bySlug.set(slug,{
      key:'portfolio:'+slug,
      name:c.name,
      slug,
      status:c.status||'active',
      source:'control_central',
      modeled:Boolean(linked),
      linkWorldId:linked,
      portfolioId:c.id,
      activeLights:0,
      detectedLights:0,
      realized:0,
      potential:0,
      opportunities:0
    });
  }

  const rows=[...bySlug.values()];
  const byPortfolioId=new Map(rows.filter(x=>x.portfolioId).map(x=>[String(x.portfolioId),x]));
  const byBusinessId=new Map(rows.filter(x=>x.linkWorldId).map(x=>[String(x.linkWorldId),x]));
  for(const c of conversions){
    const row=(c.business_id&&byBusinessId.get(String(c.business_id)))||
      (c.metadata?.client_id&&byPortfolioId.get(String(c.metadata.client_id)));
    if(row)row.opportunities+=1;
  }
  return rows.sort((a,b)=>a.name.localeCompare(b.name,'es'));
}

function commercialMission(row,portfolio,accepted){
  const owner=portfolio.find(p=>String(p.linkWorldId||'')===String(row.business_id||''))||
    portfolio.find(p=>String(p.portfolioId||'')===String(row.metadata?.client_id||''));
  const age=daysSince(row.source_updated_at||row.assessed_at);
  const stale=age!=null&&age>=7;
  const name=owner?.name||'Ecosistema LINK';
  const title=(stale?'Revalidar · ':'')+(row.title||'Mover oportunidad comercial');
  const action=stale
    ? 'Confirma primero si esta oportunidad sigue vigente. Si sigue viva, mueve el siguiente paso y registra evidencia nueva.'
    : (row.recommended_action||'Define y ejecuta el siguiente movimiento verificable.');
  const prompt=[
    'Quiero trabajar esta misión comercial de LINK WORLD:',
    '"'+(row.title||title)+'" para '+name+'.',
    stale?'La señal está antigua; antes de actuar verifica con datos actuales si sigue vigente.':'Usa los datos actuales antes de actuar.',
    'Prioridad registrada: '+Math.round(Number(row.priority_score)||0)+' / 100.',
    'Objetivo: '+action,
    'Dime primero qué puedes hacer tú directamente, qué requiere una acción mía o externa, y avancemos hasta dejar evidencia persistida en LINK.'
  ].join(' ');
  return {
    key:'conversion:'+row.id,
    kind:'commercial',
    lane:'Vender',
    title,
    business:name,
    businessId:owner?.linkWorldId||row.business_id||null,
    explanation:stale?'Hay intención comercial registrada, pero necesita una señal reciente antes de gastar energía.':(row.conversion_reason||'Existe una oportunidad comercial que puede moverse.'),
    action,
    unlock:stale?'Oportunidad vigente o descartada con evidencia':'Un paso más cerca de reserva, pago o cierre',
    executor:'shared',
    executorLabel:'Lo trabajamos juntos',
    priority:Number(row.priority_score)||0,
    stale,
    ageDays:age,
    accepted:accepted.has('conversion:'+row.id),
    prompt,
    source:{type:'conversion_assessment',id:row.id}
  };
}

function integrationMission(row,accepted){
  const prompt=[
    'Quiero digitalizar e incorporar '+row.name+' al organismo de LINK WORLD.',
    'Empieza auditando lo que ya existe en Control Central y otras fuentes conectadas para no duplicar datos.',
    'Construye la célula mínima útil, identifica capacidades reales, conexiones y fuente de verdad.',
    'Después propón el primer ciclo comercial medible y deja todo persistido en Supabase.'
  ].join(' ');
  return {
    key:'integration:'+row.slug,
    kind:'digitalization',
    lane:'Digitalizar',
    title:'Incorporar '+row.name+' al juego',
    business:row.name,
    businessId:row.linkWorldId||null,
    explanation:'Control Central ya reconoce este negocio, pero todavía no tiene una célula completa dentro de LINK WORLD.',
    action:'Crear su ficha canónica, mapear capacidades y conectar su primer ciclo útil.',
    unlock:'Nueva célula jugable + mapa de capacidades + siguiente misión comercial',
    executor:'assistant',
    executorLabel:'Puedo construirlo contigo',
    priority:88,
    stale:false,
    accepted:accepted.has('integration:'+row.slug),
    prompt,
    source:{type:'portfolio_gap',id:row.portfolioId||row.slug}
  };
}

function capabilityMission(capabilityCount,skillCount,accepted){
  const key='system:capability-gap';
  return {
    key,
    kind:'capability',
    lane:'Evolucionar LINK',
    title:'Encontrar la próxima capacidad que falta',
    business:'Todo el ecosistema',
    businessId:null,
    explanation:'LINK ya tiene '+capabilityCount+' capacidades en '+skillCount+' skills. El siguiente salto no es agregar por agregar: es detectar el vacío que más desbloquea ventas o digitalización.',
    action:'Comparar las misiones abiertas con las capacidades actuales y detectar un vacío real antes de proponer una nueva skill.',
    unlock:'Una mejora reusable para todos los negocios, o la confirmación de que ya existe una capacidad suficiente',
    executor:'assistant',
    executorLabel:'Esto es trabajo ideal para mí',
    priority:84,
    stale:false,
    accepted:accepted.has(key),
    prompt:'Audita las misiones y oportunidades actuales de LINK WORLD contra las skills y capacidades registradas. Detecta el vacío de capacidad que más desbloquea ventas, automatización o digitalización. Antes de crear algo nuevo, comprueba si ya existe una skill suficiente. Si falta de verdad, diseña la evolución mínima, su evidencia de éxito y cómo se reutilizará en otros negocios.',
    source:{type:'capability_gap',id:key}
  };
}

function bridgeMission(accepted){
  const key='system:commercial-bridge';
  return {
    key,
    kind:'connection',
    lane:'Conectar',
    title:'Encontrar una conexión comercial nueva',
    business:'Todo el ecosistema',
    businessId:null,
    explanation:'El valor de LINK aumenta cuando una solución fuerte de un negocio resuelve un problema real de otro o del territorio.',
    action:'Buscar una conexión verificable entre dos células, sin asumir acuerdos que no existen.',
    unlock:'Nueva ruta comercial, producto transversal o colaboración para probar',
    executor:'assistant',
    executorLabel:'Puedo investigar y proponer',
    priority:72,
    stale:false,
    accepted:accepted.has(key),
    prompt:'Mira todo el ecosistema LINK WORLD y busca una conexión comercial útil entre dos negocios, capacidades o necesidades reales. Usa solo evidencia disponible. Explica quién aporta qué, quién se beneficia, qué habría que validar y diseña una prueba pequeña antes de convertirlo en una relación formal.',
    source:{type:'ecosystem_connection',id:key}
  };
}

function replicateMission(accepted){
  const key='system:replicate-solution';
  return {
    key,
    kind:'productize',
    lane:'Escalar',
    title:'Convertir una solución fuerte en algo replicable',
    business:'Todo el ecosistema',
    businessId:null,
    explanation:'Cada negocio puede enseñar una capacidad reutilizable. El juego crece cuando una solución deja de ser artesanal y puede ayudar a otra célula.',
    action:'Detectar una solución ya demostrada, separar su núcleo reusable y proponer dónde probarla después.',
    unlock:'Nuevo producto, módulo o patrón reutilizable de LINK',
    executor:'assistant',
    executorLabel:'Puedo hacer la ingeniería inversa',
    priority:68,
    stale:false,
    accepted:accepted.has(key),
    prompt:'Analiza las capacidades demostradas en LINK WORLD y elige una solución que ya funcione en un negocio y tenga potencial de repetirse. Haz ingeniería inversa de su núcleo, separa qué depende del contexto y qué es reusable, y propón un segundo negocio donde probarla con un experimento pequeño y medible.',
    source:{type:'replication',id:key}
  };
}

export function buildMicelioGame(rows={},evolution=[]){
  const businesses=rows.businesses||[];
  const portfolio=portfolioRows({businesses,portfolio:rows.portfolio||[],evolution,conversions:rows.conversions||[]});
  const accepted=acceptedKeys(rows.requests||[]);
  const skills=rows.skills||[];
  const capabilities=rows.skillCapabilities||[];
  const conversions=(rows.conversions||[]).slice().sort((a,b)=>(Number(b.priority_score)||0)-(Number(a.priority_score)||0));
  const commercial=conversions.map(row=>commercialMission(row,portfolio,accepted));
  const integrations=portfolio.filter(row=>!row.modeled).map(row=>integrationMission(row,accepted));
  const capability=capabilityMission(capabilities.length,skills.length,accepted);
  const bridge=bridgeMission(accepted);
  const replicate=replicateMission(accepted);

  const freshCommercial=commercial.filter(m=>!m.stale);
  const commercialPick=freshCommercial[0]||commercial[0]||null;
  const integrationPick=integrations[0]||null;
  const featured=[commercialPick,integrationPick,capability].filter(Boolean);
  if(featured.length<3&&!featured.some(x=>x.key===bridge.key))featured.push(bridge);
  if(featured.length<3)featured.push(replicate);

  const allMissions=[...commercial,...integrations,capability,bridge,replicate];
  const realized=evolution.reduce((sum,row)=>sum+Number(row.realized||0),0);
  const activeLights=evolution.reduce((sum,row)=>sum+Number(row.activeLights||0),0);
  const detectedLights=evolution.reduce((sum,row)=>sum+Number(row.detectedLights||0),0);
  const activeRequests=(rows.requests||[]).filter(r=>!['completed','closed','done','cancelled'].includes(String(r.status||'').toLowerCase())).length;

  return {
    stats:{
      knownBusinesses:portfolio.length,
      modeledBusinesses:portfolio.filter(x=>x.modeled).length,
      pendingBusinesses:portfolio.filter(x=>!x.modeled).length,
      skills:skills.length,
      capabilities:capabilities.length,
      opportunities:conversions.length,
      missions:activeRequests,
      realized,
      activeLights,
      detectedLights
    },
    portfolio,
    featured:featured.slice(0,3),
    missions:allMissions,
    ideas:[bridge,replicate,capability],
    moneyLabel:realized>0?money(realized):'Sin ventas verificadas',
    capabilitySentence:activeLights
      ? activeLights+' capacidades ya conectadas a células del ecosistema'
      : capabilities.length+' capacidades disponibles para trabajar'
  };
}
