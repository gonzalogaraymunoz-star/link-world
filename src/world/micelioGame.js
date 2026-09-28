const slugify=value=>String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const daysSince=value=>{
  if(!value)return null;
  const t=new Date(value).getTime();
  if(!Number.isFinite(t))return null;
  return Math.max(0,Math.floor((Date.now()-t)/86400000));
};

const money=value=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(Number(value)||0);

function acceptedKeys(requests=[]){
  const keys=[];
  for(const r of requests){
    if(['completed','closed','done','cancelled'].includes(String(r.status||'').toLowerCase()))continue;
    const evidence=Array.isArray(r.evidence)?r.evidence:(r.evidence?[r.evidence]:[]);
    for(const item of evidence)if(item?.game_key)keys.push(item.game_key);
  }
  return new Set(keys);
}

function portfolioRows({businesses=[],portfolio=[],evolution=[],conversions=[],gameStates=[]}={}){
  const evoById=new Map(evolution.map(row=>[String(row.businessId),row]));
  const gameById=new Map(gameStates.map(row=>[String(row.business_id),row]));
  const bySlug=new Map();

  for(const b of businesses){
    const slug=b.slug||slugify(b.name);
    const evo=evoById.get(String(b.id))||{};
    const gs=gameById.get(String(b.id))||{};
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
      opportunities:Number(evo.opportunities||0),
      temperature:Number(gs.temperature||0),
      conversionPercent:Number(gs.conversion_percent||0),
      gameState:gs.game_state||'frozen',
      gameStateLabel:gs.game_state_label||'Congelado',
      nextActionDueAt:gs.next_action_due_at||null,
      overdue:Boolean(gs.overdue),
      awaitingEvidence:Number(gs.awaiting_evidence_count||0),
      lastVerifiedActionAt:gs.last_verified_action_at||null,
      lastActionTitle:gs.last_action_title||null,
      suggestedAction:gs.suggested_action||null,
      suggestedPrompt:gs.suggested_prompt||null,
      attentionMode:gs.attention_mode||null,
      panelTone:gs.panel_tone||null,
      hoursRemaining:gs.hours_remaining==null?null:Number(gs.hours_remaining),
      urgencyHours:gs.urgency_hours==null?null:Number(gs.urgency_hours)
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
      opportunities:0,
      temperature:0,
      conversionPercent:0,
      gameState:'frozen',
      gameStateLabel:'Fuera del tablero',
      nextActionDueAt:null,
      overdue:false,
      awaitingEvidence:0,
      lastVerifiedActionAt:null,
      lastActionTitle:null,
      suggestedAction:null,
      suggestedPrompt:null,
      attentionMode:'reactivate',
      panelTone:'cold',
      hoursRemaining:null,
      urgencyHours:null
    });
  }

  const rows=[...bySlug.values()];
  const byPortfolioId=new Map(rows.filter(x=>x.portfolioId).map(x=>[String(x.portfolioId),x]));
  const byBusinessId=new Map(rows.filter(x=>x.linkWorldId).map(x=>[String(x.linkWorldId),x]));
  for(const c of conversions){
    if(c.business_id)continue; // LINK WORLD businesses already count these in buildEvolution.
    const row=c.metadata?.client_id&&byPortfolioId.get(String(c.metadata.client_id));
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


function goalScore({proximity=0,margin=0,ease=0,reuse=0,evidence=0}={}){
  return Math.round(proximity*.35+margin*.25+ease*.20+reuse*.10+evidence*.10);
}

function recBase({key,business,businessId=null,title,recommendation,why,unlock,prompt,metrics={},kind='commercial',lane='Vender',accepted=false,category='organize'}){
  const score=goalScore(metrics);
  return {
    key,kind,lane,business,businessId,title,recommendation,why,unlock,prompt,category,
    accepted,priority:score,
    proximity:metrics.proximity||0,margin:metrics.margin||0,ease:metrics.ease||0,reuse:metrics.reuse||0,evidence:metrics.evidence||0,
    moneyLabel:(metrics.proximity||0)>=90?'Dinero muy cerca':(metrics.proximity||0)>=70?'Dinero cerca':'Construye venta',
    marginLabel:(metrics.margin||0)>=85?'Margen fuerte':(metrics.margin||0)>=65?'Margen favorable':'Margen por validar',
    effortLabel:(metrics.ease||0)>=85?'Esfuerzo bajo':(metrics.ease||0)>=65?'Esfuerzo medio-bajo':'Requiere trabajo',
    executorLabel:'Trabajémoslo',
    explanation:why,
    action:recommendation,
    source:{type:'game_recommendation',id:key}
  };
}

function buildRecommendations(rows,portfolio,accepted){
  const businesses=rows.businesses||[];
  const products=rows.products||[];
  const transactions=rows.transactions||[];
  const recs=[];
  const bySlug=new Map(businesses.map(b=>[b.slug,b]));

  for(const b of businesses){
    const pending=transactions.filter(t=>String(t.business_id)===String(b.id)&&String(t.status||'').toLowerCase()==='pending_payment');
    const pendingAmount=pending.reduce((sum,t)=>sum+Number(t.amount||0),0);
    if(pendingAmount>0){
      const key='rec:verify-income:'+b.id;
      recs.push(recBase({
        key,business:b.name,businessId:b.id,title:'Verifica ingresos que ya están cerca del banco',category:'financial_reconciliation',
        recommendation:'Revisa si los '+pending.length+' ingresos pendientes están realmente impagos o solo sin conciliar. Confirma evidencia y actualiza el estado antes de buscar más venta.',
        why:'Cobrar o conciliar dinero ya generado suele requerir menos esfuerzo que captar una venta nueva.',
        unlock:'Ingresos verificados + caja real + mejor lectura de margen',
        metrics:{proximity:100,margin:88,ease:92,reuse:55,evidence:94},
        accepted:accepted.has(key),
        prompt:'Audita los ingresos pendientes de '+b.name+' en LINK WORLD. No asumas que están impagos: revisa evidencia, separa lo cobrado de lo no cobrado, calcula el monto realmente pendiente y dime la acción mínima para cerrar o conciliar cada caso. Prioriza caja real con el menor esfuerzo y deja el resultado persistido.'
      }));
    }

    const contract=b.owned_facts?.active_contract||b.owned_facts?.sold_product||null;
    const contractAmount=Number(contract?.monthly_fee_clp||contract?.agreed_price_clp||0);
    const paymentState=String(contract?.payment_status||contract?.financial_state?.payment_status||'').toLowerCase();
    if(contractAmount>0&&['','unknown_not_inferred','unverified','pending','pending_payment_evidence'].includes(paymentState)){
      const key='rec:contract-cash:'+b.id;
      recs.push(recBase({
        key,business:b.name,businessId:b.id,title:'Cierra el ciclo económico del contrato activo',category:'financial_reconciliation',
        recommendation:'Confirma facturación y pago del acuerdo vigente de '+money(contractAmount)+'. Si ya fue pagado, vincula la evidencia; si no, prepara el cobro.',
        why:'El servicio ya está vendido. Convertir acuerdo activo en caja verificada es más eficiente que abrir una venta nueva.',
        unlock:'Contrato → cobro → margen medible',
        metrics:{proximity:98,margin:90,ease:88,reuse:70,evidence:95},
        accepted:accepted.has(key),
        prompt:'Trabajemos el ciclo económico del contrato activo de '+b.name+' por '+money(contractAmount)+'. Revisa lo que LINK ya sabe sobre facturación, pago y evidencia. No inventes cobros. Dime qué puedes verificar tú, qué dato o comprobante necesito aportar yo y deja el contrato con un estado financiero claro y persistente.'
      }));
    }
  }

  const hotel=bySlug.get('hotel-experience');
  if(hotel){
    const network=hotel.owned_facts?.observed_network||{};
    const leads=Number(network.leads||0),productsCount=Number(network.active_catalog_products||0),partners=Number(network.hotel_partner_records||0);
    if(leads>0){
      const key='rec:hotel-existing-demand';
      recs.push(recBase({
        key,business:hotel.name,businessId:hotel.id,title:'Vende primero a la demanda que ya existe',category:'lead_qualified',
        recommendation:'Prioriza los '+leads+' leads existentes antes de captar más. Separa intención alta, cotiza lo más simple de operar y mueve primero los productos con ruta de ejecución clara.',
        why:'La adquisición ya ocurrió. Trabajar demanda existente reduce esfuerzo comercial y evita gastar en captar antes de convertir.',
        unlock:'Primeros cierres medibles usando '+productsCount+' productos y '+partners+' hoteles/canales ya observados',
        metrics:{proximity:92,margin:82,ease:82,reuse:86,evidence:92},
        accepted:accepted.has(key),
        prompt:'Analiza HOTEL EXPERIENCE con foco en vender con mejor margen y menor esfuerzo. Parte por los '+leads+' leads existentes y el catálogo ya disponible. Diseña un orden de ataque: qué leads revisar primero, qué productos son más simples de operar y qué siguiente acción concreta debemos ejecutar. No inventes margen si no hay costo suficiente; identifica qué dato falta para calcularlo.'
      }));
    }
  }

  const taxi=bySlug.get('taxi-hotel');
  if(taxi){
    const remaining=taxi.owned_facts?.entry_stabilization?.remaining||[];
    if(remaining.includes('payment_provider_wiring')){
      const key='rec:taxi-payment';
      recs.push(recBase({
        key,business:taxi.name,businessId:taxi.id,title:'Conecta el cobro al flujo que ya captura reservas',category:'checkout',
        recommendation:'Termina el proveedor de pago después de la confirmación operativa. La venta ya tiene web, pricing y reserva persistente; falta convertir la confirmación en pago.',
        why:'Es un cuello de botella muy cercano al dinero: no exige crear otro producto ni otra web.',
        unlock:'Reserva confirmada → pago → operación → evidencia económica',
        metrics:{proximity:96,margin:72,ease:72,reuse:92,evidence:94},
        accepted:accepted.has(key),
        prompt:'Toma TAXI HOTEL y llévalo del flujo actual de reserva confirmada al cobro real, respetando la regla de cobrar solo después de confirmar disponibilidad. Audita lo ya construido, reutiliza Mercado Pago si corresponde, evita duplicar lógica y define la implementación mínima que desbloquea pago verificable.'
      }));
    }
    const he=hotel;
    if(he){
      const key='rec:taxi-hotel-experience-bridge';
      recs.push(recBase({
        key,business:'TAXI HOTEL × HOTEL EXPERIENCE',businessId:taxi.id,title:'Prueba un canal existente antes de buscar clientes nuevos',category:'agreement',
        recommendation:'Valida si TAXI HOTEL puede venderse como producto de transporte dentro de HOTEL EXPERIENCE y sus hoteles/canales. Haz una prueba pequeña antes de formalizar la relación.',
        why:'Combina un servicio ya operativo con una casa comercial que ya observa hoteles, leads y una categoría de transporte.',
        unlock:'Canal de distribución nuevo sin construir una audiencia desde cero',
        metrics:{proximity:84,margin:76,ease:78,reuse:96,evidence:84},
        accepted:accepted.has(key),
        prompt:'Evalúa una prueba comercial entre TAXI HOTEL y HOTEL EXPERIENCE. No asumas que existe convenio. Verifica compatibilidad de producto, precio, responsabilidad, operación y comisión. Diseña un piloto mínimo con un hotel o canal y define qué evidencia demostraría que vale la pena formalizarlo.'
      }));
    }
  }

  const coupons=bySlug.get('link-cupones');
  if(coupons){
    const p=products.find(x=>String(x.business_id)===String(coupons.id));
    if(p){
      const salesEnabled=p.metadata?.commercial_status?.sales_enabled===true;
      const agreement=String(p.metadata?.commercial_status?.agreement_status||'').toLowerCase();
      if(!salesEnabled||agreement==='pending'||p.acquisition_price==null){
        const key='rec:cupones-unit-economics:'+p.id;
        recs.push(recBase({
          key,business:coupons.name,businessId:coupons.id,title:'No vendas antes de cerrar el margen del producto',category:'agreement',
          recommendation:'Completa costo de adquisición, convenio y participación mínima de LINK para '+p.name+' ('+money(p.public_price||0)+' público). Luego habilita ventas.',
          why:'El producto tiene precio visible, pero todavía no tiene economía vigente suficiente para asegurar que vender más mejore el margen.',
          unlock:'Producto vendible con margen protegido',
          metrics:{proximity:78,margin:96,ease:84,reuse:88,evidence:88},
          accepted:accepted.has(key),
          prompt:'Cierra la economía de '+p.name+' en LINK Cupones. Precio público actual: '+money(p.public_price||0)+'. Revisa el antecedente económico solo como referencia histórica, identifica costos y convenio que siguen pendientes, define el margen mínimo de LINK y deja una regla de venta que impida activar el producto si el margen no está protegido.'
        }));
      }
    }
  }

  const caracol=bySlug.get('caracol');
  if(caracol){
    const key='rec:caracol-efficiency';
    recs.push(recBase({
      key,business:caracol.name,businessId:caracol.id,title:'Haz que el contenido cueste menos producir sin perder resultado',category:'automation',
      recommendation:'Usa LINK RRSS para identificar formatos y piezas que mejor responden y convierte esos patrones en una biblioteca reutilizable. Reduce producción que no genera aprendizaje.',
      why:'CARACOL ya tiene contrato recurrente. Mejorar eficiencia de producción aumenta margen sin tener que subir precio ni vender más horas.',
      unlock:'Más margen por el mismo contrato + sistema reusable para otros clientes',
      metrics:{proximity:70,margin:92,ease:80,reuse:94,evidence:76},
      accepted:accepted.has(key),
      prompt:'Analiza CARACOL con LINK RRSS y el contrato actual de contenido. Identifica qué formatos, hooks, rostros o ritmos de publicación conviene repetir y qué trabajo podemos eliminar. El objetivo es mantener o mejorar resultado con menos horas de producción. Devuélveme una rutina reusable y qué evidencia debemos guardar para saber si el margen mejora.'
    }));
  }

  for(const row of portfolio.filter(x=>!x.modeled)){
    const key='rec:incorporate:'+row.slug;
    recs.push(recBase({
      key,business:row.name,businessId:row.linkWorldId||null,title:'Decide si este negocio merece entrar al tablero ahora',category:'integration',
      recommendation:'Audita su vigencia y potencial actual. Si está vivo, incorpóralo con una célula mínima; si está obsoleto, archívalo para no gastar atención.',
      why:'Un juego divertido también elimina ruido. No todo negocio conocido merece consumir energía hoy.',
      unlock:'Portafolio más limpio o nueva célula lista para vender',
      metrics:{proximity:58,margin:68,ease:76,reuse:82,evidence:64},
      accepted:accepted.has(key),
      prompt:'Revisa '+row.name+' antes de incorporarlo a LINK WORLD. Determina si sigue vigente, cuál es su oferta real, qué evidencia actual existe y si merece una célula activa. Si no está vigente, propón archivarlo; si sí, crea la estructura mínima y el primer objetivo comercial.'
    }));
  }

  const capCount=(rows.skillCapabilities||[]).length;
  if(capCount){
    const key='rec:capability-leverage';
    recs.push(recBase({
      key,business:'LINK',businessId:null,title:'Mejora una capacidad solo si reduce trabajo o aumenta conversión',category:'capability',
      recommendation:'Compara las '+capCount+' capacidades existentes con los cuellos de botella de mayor prioridad y evoluciona solo la capacidad que quite más esfuerzo repetitivo o acerque más ventas.',
      why:'Crear más herramientas por sí mismo no mejora el juego. La evolución debe ahorrar trabajo o producir una ruta comercial mejor.',
      unlock:'Una capacidad reusable con retorno claro',
      metrics:{proximity:62,margin:84,ease:74,reuse:100,evidence:84},
      accepted:accepted.has(key),
      prompt:'Cruza las capacidades actuales de LINK con los cuellos de botella comerciales del ecosistema. No propongas una skill nueva si una existente puede resolverlo. Elige una sola mejora que reduzca trabajo repetitivo o aumente conversión en más de un negocio, define su prueba de éxito y aplícala de forma reusable.'
    }));
  }

  const stateByBusiness=new Map((rows.gameStates||[]).map(s=>[String(s.business_id),s]));
  const policies=new Map((rows.actionPolicies||[]).map(p=>[p.category,p]));
  const enriched=recs.map(rec=>{
    const gs=rec.businessId?stateByBusiness.get(String(rec.businessId)):null;
    const policy=policies.get(rec.category)||{base_heat:12};
    const weighted=goalScore({proximity:rec.proximity,margin:rec.margin,ease:rec.ease,reuse:rec.reuse,evidence:rec.evidence});
    const projectedHeat=Math.round(Number(policy.base_heat||12)*(0.50+weighted/200)*10)/10;
    const urgencyBonus=gs?.game_state==='critical_frozen'?20:gs?.game_state==='red_close'?16:gs?.game_state==='frozen'?7:gs?.overdue?8:0;
    const currentTemperature=Number(gs?.temperature||0);
    const conversion=Number(gs?.conversion_percent||0);
    const evidenceInstruction=rec.businessId
      ? ' Esta misión solo modifica temperatura o conversión cuando la acción queda comprobada. Si yo no puedo verificarla con herramientas, te pediré captura, comprobante, archivo, correo o enlace y no registraré avance hasta validarlo.'
      : '';
    return {
      ...rec,
      priority:Math.min(100,rec.priority+urgencyBonus),
      currentTemperature,
      currentConversion:conversion,
      gameState:gs?.game_state||null,
      gameStateLabel:gs?.game_state_label||null,
      projectedHeat,
      projectedTemperature:Math.min(100,Math.round((currentTemperature+projectedHeat)*10)/10),
      evidenceInstruction,
      prompt:rec.prompt+evidenceInstruction
    };
  });
  const ranked=enriched.sort((a,b)=>b.priority-a.priority).map((rec,index)=>({...rec,priorityRank:index+1}));
  const firstByBusiness=[],rest=[],seen=new Set();
  for(const rec of ranked){
    const group=rec.business||'LINK';
    if(!seen.has(group)){seen.add(group);firstByBusiness.push(rec);}
    else rest.push(rec);
  }
  return [...firstByBusiness,...rest];
}

export function buildMicelioGame(rows={},evolution=[]){
  const businesses=rows.businesses||[];
  const portfolio=portfolioRows({businesses,portfolio:rows.portfolio||[],evolution,conversions:rows.conversions||[],gameStates:rows.gameStates||[]});
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

  const recommendations=buildRecommendations(rows,portfolio,accepted);
  const allMissions=[...commercial,...integrations,capability,bridge,replicate,...recommendations];
  const realized=evolution.reduce((sum,row)=>sum+Number(row.realized||0),0);
  const activeLights=evolution.reduce((sum,row)=>sum+Number(row.activeLights||0),0);
  const detectedLights=evolution.reduce((sum,row)=>sum+Number(row.detectedLights||0),0);
  const activeRequests=(rows.requests||[]).filter(r=>r.evidence?.game_key&&!['completed','closed','done','cancelled'].includes(String(r.status||'').toLowerCase())).length;

  const stateByBusiness=Object.fromEntries((rows.gameStates||[]).map(row=>[String(row.business_id),row]));
  return {
    stateByBusiness,
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
    recommendations,
    missions:allMissions,
    ideas:[bridge,replicate,capability],
    moneyLabel:realized>0?money(realized):'Sin ventas verificadas',
    capabilitySentence:activeLights
      ? activeLights+' capacidades ya conectadas a células del ecosistema'
      : capabilities.length+' capacidades disponibles para trabajar'
  };
}
