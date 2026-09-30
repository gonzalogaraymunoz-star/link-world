import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './world/connection.js';
import './businessIntake.css';

const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

const app=document.querySelector('#app');
document.documentElement.lang='es';
document.body.classList.add('li-body');
document.title='ADN LINK · Conectar negocio';

const leadRef=new URLSearchParams(window.location.search).get('ref')||'';

const sectors=[
  ['hotel','Hotel / alojamiento','Ej. hotel boutique, hostal, glamping'],
  ['restaurant','Restaurante / bar','Ej. restaurante, café, bar'],
  ['tourism','Turismo / experiencias','Ej. tours, excursiones, guías'],
  ['wellness','Salud / bienestar','Ej. estética, masajes, wellness'],
  ['transport','Transporte','Ej. transfer, taxi, logística'],
  ['commerce','Comercio','Ej. tienda, retail, e-commerce'],
  ['creative','Eventos / creativo','Ej. productora, música, contenido'],
  ['services','Servicios','Ej. estudio, consultora, mantenimiento'],
  ['technology','Tecnología','Ej. software, plataforma, app'],
  ['other','Otro','Cuéntanos con tus palabras']
];

const goals=[
  ['sell_more','Vender más','Ej. Booking: más reservas y conversión'],
  ['organize','Ordenar la operación','Ej. Notion: saber qué ocurre y quién hace qué'],
  ['automate','Automatizar','Ej. Uber: menos coordinación manual'],
  ['alliances','Conseguir alianzas','Ej. una red de partners que se complementan'],
  ['new_product','Crear algo nuevo','Ej. Spotify o Airbnb: una nueva lógica de producto'],
  ['experience','Mejorar la experiencia','Ej. Apple: menos fricción, más claridad']
];

const adaptive={
  sell_more:{
    title:'¿Dónde se corta hoy la venta?',
    subtitle:'Elige uno o dos puntos. Esto define la ruta comercial.',
    options:[
      ['captacion','Conseguir interesados','Ej. dependemos de Instagram'],
      ['respuesta','Responder a tiempo','Ej. WhatsApp se acumula'],
      ['cotizacion','Cotizar / explicar','Ej. cada cotización parte de cero'],
      ['pago','Cerrar y cobrar','Ej. preguntan, pero no terminan pagando'],
      ['seguimiento','Hacer seguimiento','Ej. los leads quedan olvidados'],
      ['recompra','Lograr que vuelvan','Ej. vendemos una vez y perdemos el contacto']
    ]
  },
  organize:{
    title:'¿Qué parte te cuesta más controlar?',
    subtitle:'Piensa en el punto donde hoy aparecen errores o desorden.',
    options:[
      ['agenda','Agenda / reservas','Ej. cambios por WhatsApp'],
      ['tasks','Tareas','Ej. nadie sabe qué sigue'],
      ['team','Equipo','Ej. responsabilidades poco claras'],
      ['providers','Proveedores','Ej. todo depende de mensajes'],
      ['inventory','Inventario / recursos','Ej. no sabemos qué queda'],
      ['documents','Documentos / datos','Ej. información en muchas planillas']
    ]
  },
  automate:{
    title:'¿Qué repites demasiado?',
    subtitle:'La mejor automatización empieza por una tarea repetitiva.',
    options:[
      ['reply','Responder lo mismo','Ej. precios, horarios, preguntas frecuentes'],
      ['schedule','Agendar','Ej. reservar y confirmar horas'],
      ['charge','Cobrar','Ej. enviar datos y confirmar pagos'],
      ['confirm','Confirmar','Ej. recordar reservas o servicios'],
      ['report','Reportar','Ej. recopilar métricas manualmente'],
      ['route','Derivar solicitudes','Ej. pasar cada caso a la persona correcta']
    ]
  },
  alliances:{
    title:'¿Qué te gustaría conseguir de otros negocios?',
    subtitle:'Esto ayuda a LINK a buscar una contraparte útil.',
    options:[
      ['clients','Clientes','Ej. huéspedes, pasajeros, compradores'],
      ['distribution','Distribución','Ej. que otros puntos recomienden mi oferta'],
      ['operation','Capacidad operativa','Ej. transporte, producción, soporte'],
      ['providers','Proveedores','Ej. mejores opciones o cobertura'],
      ['spaces','Espacios','Ej. hoteles, locales, salas'],
      ['experiences','Experiencias','Ej. gastronomía, tours, eventos']
    ]
  },
  new_product:{
    title:'¿Qué tipo de lógica te gustaría construir?',
    subtitle:'No es elegir un diseño: es elegir cómo debería funcionar.',
    options:[
      ['membership','Membresía','Ej. Spotify / gimnasio'],
      ['marketplace','Marketplace','Ej. Airbnb / Mercado Libre'],
      ['booking','Reserva','Ej. Booking / Calendly'],
      ['subscription','Suscripción','Ej. Netflix / software mensual'],
      ['community','Comunidad','Ej. membresía con beneficios'],
      ['ondemand','On-demand','Ej. Uber: pedir, asignar, completar, pagar']
    ]
  },
  experience:{
    title:'¿Dónde quieres que se sienta mejor el negocio?',
    subtitle:'Elegimos el momento de la experiencia que primero vamos a mejorar.',
    options:[
      ['discover','Descubrirte','Ej. encontrarte y entender qué haces'],
      ['quote','Cotizar','Ej. pedir precio sin fricción'],
      ['buy','Comprar / reservar','Ej. completar en pocos pasos'],
      ['delivery','Recibir el servicio','Ej. saber qué pasa y cuándo'],
      ['aftercare','Postventa','Ej. seguimiento después de comprar'],
      ['loyalty','Volver','Ej. beneficios, membresía, recompra']
    ]
  }
};

const toolOptions=[
  ['instagram','Instagram'],['whatsapp','WhatsApp'],['website','Website'],
  ['calendar','Google Calendar'],['payments','Pagos online'],['crm','CRM'],
  ['sheets','Planillas'],['booking','Sistema de reservas'],['none','Nada formal todavía']
];

const capabilityOptions=[
  ['audience','Clientes / audiencia','Ej. huéspedes, comunidad, seguidores'],
  ['space','Espacio físico','Ej. hotel, local, sala, terreno'],
  ['transport','Transporte','Ej. vehículos, logística'],
  ['production','Producción','Ej. eventos, audiovisual, operación'],
  ['food','Gastronomía','Ej. cocina, bar, catering'],
  ['lodging','Alojamiento','Ej. habitaciones, camas, estadías'],
  ['technology','Tecnología','Ej. software, automatización, data'],
  ['content','Contenido / difusión','Ej. RRSS, comunidad, medios'],
  ['service','Servicio especializado','Ej. salud, turismo, consultoría']
];

const needOptions=[
  ['clients','Clientes'],['sales','Ventas'],['marketing','Marketing'],
  ['organization','Organización'],['payments','Pagos'],['providers','Proveedores'],
  ['technology','Tecnología'],['automation','Automatización'],
  ['distribution','Distribución'],['alliances','Alianzas']
];

const associationOptions=[
  ['receive_clients','Recibir clientes','Ej. otro negocio me recomienda'],
  ['refer_clients','Derivar clientes','Ej. completar su experiencia con otro negocio'],
  ['shared_benefit','Compartir beneficios','Ej. LINK Cupones'],
  ['b2b','Vender a otros negocios','Ej. hotel compra mi servicio'],
  ['operate','Operar para terceros','Ej. transporte, producción, wellness'],
  ['joint_product','Crear producto conjunto','Ej. hotel + experiencia + traslado']
];

const cloneOptions=[
  ['visual','Diseño visual','Ej. Apple'],
  ['flow','Flujo / experiencia','Ej. Uber'],
  ['booking','Reserva / compra','Ej. Booking'],
  ['marketplace','Marketplace','Ej. Airbnb'],
  ['membership','Membresía','Ej. Spotify'],
  ['dashboard','Dashboard','Ej. Metricool'],
  ['automation','Automatización','Ej. Zapier'],
  ['business_model','Modelo comercial','Ej. comisión / suscripción'],
  ['mobile','Experiencia móvil','Ej. app simple, pocos pasos']
];

const labels={
  sell_more:'Vender más',organize:'Ordenar la operación',automate:'Automatizar',
  alliances:'Conseguir alianzas',new_product:'Crear algo nuevo',experience:'Mejorar la experiencia'
};

const adapterMap={
  sell_more:{path:'sales',title:'Ruta comercial',steps:['Mapear captación','Mejorar conversión','Cerrar y cobrar','Medir ventas']},
  organize:{path:'operations',title:'Ruta operativa',steps:['Mapear proceso','Definir responsables','Centralizar información','Medir cumplimiento']},
  automate:{path:'automation',title:'Ruta de automatización',steps:['Detectar repetición','Elegir herramienta','Automatizar flujo','Comprobar resultado']},
  alliances:{path:'associative',title:'Ruta asociativa',steps:['Definir necesidad','Encontrar contraparte','Pilotear conexión','Medir valor compartido']},
  new_product:{path:'product',title:'Ruta de producto',steps:['Definir propuesta','Prototipar lógica','Validar con usuarios','Operar y aprender']},
  experience:{path:'experience',title:'Ruta de experiencia',steps:['Mapear journey','Detectar fricción','Conectar capacidad','Medir mejora']}
};

const state={
  step:0,
  businessName:'',
  sector:'',
  businessSummary:'',
  goal:'',
  adaptive:[],
  tools:[],
  capabilities:[],
  needs:[],
  associations:[],
  references:['','',''],
  cloneAspects:[]
};

function esc(v=''){
  return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function chip(value,label,example,selected=false,kind='single'){
  return `<button type="button" class="li-cloud ${selected?'selected':''}" data-kind="${kind}" data-value="${esc(value)}"><b>${esc(label)}</b>${example?`<small>${esc(example)}</small>`:''}</button>`;
}
function progress(){
  return Math.round((state.step/6)*100);
}

function render(){
  app.innerHTML=`
  <main class="li-shell">
    <header class="li-top">
      <a class="li-brand" href="/"><img src="/link-world-mark.svg" alt=""><span><b>LINK.</b> ADN</span></a>
      <div class="li-progress-wrap"><span>${String(Math.min(state.step+1,7)).padStart(2,'0')} / 07</span><div class="li-progress"><i style="width:${progress()}%"></i></div></div>
      <a class="li-explain" href="/que-es-link/">¿Qué es LINK? ↗</a>
    </header>
    <section class="li-stage" id="li-stage"></section>
  </main>`;
  const stage=document.querySelector('#li-stage');
  if(state.step===0) renderIdentity(stage);
  if(state.step===1) renderGoal(stage);
  if(state.step===2) renderAdaptive(stage);
  if(state.step===3) renderTools(stage);
  if(state.step===4) renderExchange(stage);
  if(state.step===5) renderReferences(stage);
  if(state.step===6) renderSummary(stage);
  bindCommon();
}

function frame(kicker,title,copy,body,actions=''){
  return `
  <div class="li-question">
    <span class="li-kicker">${kicker}</span>
    <h1>${title}</h1>
    <p>${copy}</p>
  </div>
  <div class="li-answer-zone">${body}</div>
  <div class="li-actions">${state.step>0?'<button type="button" class="li-back" id="li-back">← Atrás</button>':'<span></span>'}${actions}</div>`;
}

function renderIdentity(stage){
  const clouds=sectors.map(([v,l,e])=>chip(v,l,e,state.sector===v)).join('');
  stage.innerHTML=frame(
    '01 · IDENTIDAD',
    '¿Qué negocio estamos conectando?',
    'Lo básico. El resto lo aprenderemos después.',
    `<div class="li-form-card">
      <label><span>Nombre del negocio</span><input id="li-business-name" value="${esc(state.businessName)}" placeholder="Ej. Hotel Aurora"></label>
      <label><span>Explícalo en una frase</span><input id="li-business-summary" value="${esc(state.businessSummary)}" placeholder="Ej. hotel boutique para viajeros que buscan experiencias locales"></label>
    </div>
    <div class="li-cloud-head"><span>¿A qué se parece más?</span><small>Elige una categoría aproximada.</small></div>
    <div class="li-clouds">${clouds}</div>`,
    '<button type="button" class="li-next" id="li-next">Continuar →</button>'
  );
}

function renderGoal(stage){
  stage.innerHTML=frame(
    '02 · OBJETIVO',
    '¿Qué quieres que cambie en 90 días?',
    'Elige la transformación principal. Esto define qué pregunta viene después.',
    `<div class="li-clouds li-clouds-large">${goals.map(([v,l,e])=>chip(v,l,e,state.goal===v)).join('')}</div>`,
    '<button type="button" class="li-next" id="li-next">Continuar →</button>'
  );
}

function renderAdaptive(stage){
  const q=adaptive[state.goal]||adaptive.sell_more;
  stage.innerHTML=frame(
    '03 · ADAPTADOR',
    q.title,
    q.subtitle,
    `<div class="li-clouds li-clouds-large">${q.options.map(([v,l,e])=>chip(v,l,e,state.adaptive.includes(v),false,'multi')).join('')}</div>
     <p class="li-hint">Puedes elegir hasta 2.</p>`,
    '<button type="button" class="li-next" id="li-next">Continuar →</button>'
  );
}

function renderTools(stage){
  stage.innerHTML=frame(
    '04 · CAPACIDADES ACTUALES',
    '¿Con qué ya trabajas?',
    'No buscamos perfección. Sólo saber qué piezas ya existen.',
    `<div class="li-clouds">${toolOptions.map(([v,l])=>chip(v,l,'',state.tools.includes(v),'multi')).join('')}</div>`,
    '<button type="button" class="li-next" id="li-next">Continuar →</button>'
  );
}

function renderExchange(stage){
  stage.innerHTML=frame(
    '05 · INTERCAMBIO',
    '¿Qué puede dar y qué necesita tu negocio?',
    'Esto alimenta el matching futuro del Micelio.',
    `<div class="li-dual">
      <section><span class="li-mini-title">PUEDE APORTAR</span><div class="li-clouds li-clouds-compact">${capabilityOptions.map(([v,l,e])=>chip(v,l,e,state.capabilities.includes(v),'multi')).join('')}</div></section>
      <section><span class="li-mini-title">NECESITA</span><div class="li-clouds li-clouds-compact">${needOptions.map(([v,l])=>chip(v,l,'',state.needs.includes(v),'multi')).join('')}</div></section>
    </div>
    <div class="li-cloud-head"><span>¿Qué tipo de asociación te interesa?</span><small>Opcional, pero ayuda a LINK a buscar conexiones.</small></div>
    <div class="li-clouds li-clouds-compact">${associationOptions.map(([v,l,e])=>chip(v,l,e,state.associations.includes(v),'multi')).join('')}</div>`,
    '<button type="button" class="li-next" id="li-next">Continuar →</button>'
  );
}

function renderReferences(stage){
  stage.innerHTML=frame(
    '06 · REFERENCIAS',
    '¿Qué te gustaría tomar de otros productos?',
    'Pega hasta 3 referencias. Puede ser una web o simplemente un nombre conocido.',
    `<div class="li-reference-card">
      <label><span>Referencia 1</span><input data-ref="0" value="${esc(state.references[0])}" placeholder="Ej. spotify.com o Spotify"></label>
      <label><span>Referencia 2</span><input data-ref="1" value="${esc(state.references[1])}" placeholder="Ej. airbnb.com o Airbnb"></label>
      <label><span>Referencia 3</span><input data-ref="2" value="${esc(state.references[2])}" placeholder="Ej. metricool.com"></label>
    </div>
    <div class="li-cloud-head"><span>¿Qué quieres tomar de esas referencias?</span><small>No necesariamente su estética.</small></div>
    <div class="li-clouds li-clouds-compact">${cloneOptions.map(([v,l,e])=>chip(v,l,e,state.cloneAspects.includes(v),'multi')).join('')}</div>`,
    '<button type="button" class="li-next" id="li-next">Ver ADN →</button>'
  );
}

function method(){
  return adapterMap[state.goal]||adapterMap.sell_more;
}
function selectedLabels(values,source){
  const map=new Map(source.map(row=>[row[0],row[1]]));
  return values.map(v=>map.get(v)||v);
}
function dna(){
  const q=adaptive[state.goal]||adaptive.sell_more;
  return {
    business:state.businessName,
    sector:selectedLabels([state.sector],sectors)[0]||state.sector,
    summary:state.businessSummary,
    goal:labels[state.goal]||state.goal,
    friction:selectedLabels(state.adaptive,q.options),
    tools:selectedLabels(state.tools,toolOptions),
    capabilities:selectedLabels(state.capabilities,capabilityOptions),
    needs:selectedLabels(state.needs,needOptions),
    associations:selectedLabels(state.associations,associationOptions),
    references:state.references.filter(Boolean),
    clone_aspects:selectedLabels(state.cloneAspects,cloneOptions)
  };
}

function renderSummary(stage){
  const d=dna();
  const m=method();
  stage.innerHTML=frame(
    '07 · ADN LINK',
    'Así entendimos tu negocio.',
    'Todavía no entra al Micelio. Primero queda en Vault para revisión y verificación.',
    `<div class="li-result-grid">
      <article class="li-result-card">
        <span>ADN INICIAL</span>
        <h3>${esc(state.businessName||'Negocio')}</h3>
        <dl>
          <div><dt>Objetivo</dt><dd>${esc(d.goal||'—')}</dd></div>
          <div><dt>Fricción</dt><dd>${esc(d.friction.join(' · ')||'Por revisar')}</dd></div>
          <div><dt>Tiene</dt><dd>${esc(d.tools.join(' · ')||'Por mapear')}</dd></div>
        </dl>
      </article>
      <article class="li-result-card">
        <span>MAPA DE CONEXIÓN</span>
        <h3>Necesita ↔ Puede aportar</h3>
        <dl>
          <div><dt>Necesita</dt><dd>${esc(d.needs.join(' · ')||'Por definir')}</dd></div>
          <div><dt>Aporta</dt><dd>${esc(d.capabilities.join(' · ')||'Por definir')}</dd></div>
          <div><dt>Asociaciones</dt><dd>${esc(d.associations.join(' · ')||'A descubrir')}</dd></div>
        </dl>
      </article>
      <article class="li-result-card li-result-method">
        <span>PRIMER MÉTODO DE ACCIÓN</span>
        <h3>${esc(m.title)}</h3>
        <ol>${m.steps.map((s,i)=>`<li><b>${String(i+1).padStart(2,'0')}</b><span>${esc(s)}</span></li>`).join('')}</ol>
      </article>
    </div>
    <div class="li-reference-summary"><span>REFERENCIAS</span><b>${esc(d.references.join(' · ')||'Sin referencias aún')}</b><small>${esc(d.clone_aspects.join(' · ')||'Se definirán en la siguiente conversación.')}</small></div>
    <div class="li-vault-note"><i></i><div><b>Destino: Prospect Vault</b><span>El negocio queda fuera del Micelio hasta que LINK verifique este ADN.</span></div></div>
    <div class="li-submit-status" id="li-submit-status" role="status"></div>`,
    '<button type="button" class="li-save" id="li-save">Guardar en Vault →</button>'
  );
}

function bindCommon(){
  document.querySelector('#li-back')?.addEventListener('click',()=>{state.step=Math.max(0,state.step-1);render();});

  document.querySelectorAll('.li-cloud').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const value=btn.dataset.value;
      const multi=btn.dataset.kind==='multi';
      if(state.step===0){state.sector=value;render();}
      else if(state.step===1){state.goal=value;state.adaptive=[];render();}
      else if(state.step===2){
        if(state.adaptive.includes(value)) state.adaptive=state.adaptive.filter(v=>v!==value);
        else if(state.adaptive.length<2) state.adaptive=[...state.adaptive,value];
        render();
      }
      else if(state.step===3){
        if(value==='none') state.tools=state.tools.includes('none')?[]:['none'];
        else{
          state.tools=state.tools.filter(v=>v!=='none');
          state.tools=state.tools.includes(value)?state.tools.filter(v=>v!==value):[...state.tools,value];
        }
        render();
      }
      else if(state.step===4){
        const cap=capabilityOptions.some(x=>x[0]===value);
        const need=needOptions.some(x=>x[0]===value);
        const assoc=associationOptions.some(x=>x[0]===value);
        const key=cap?'capabilities':need?'needs':assoc?'associations':null;
        if(key) state[key]=state[key].includes(value)?state[key].filter(v=>v!==value):[...state[key],value];
        render();
      }
      else if(state.step===5){
        state.cloneAspects=state.cloneAspects.includes(value)?state.cloneAspects.filter(v=>v!==value):[...state.cloneAspects,value];
        render();
      }
    });
  });

  if(state.step===0){
    const name=document.querySelector('#li-business-name');
    const summary=document.querySelector('#li-business-summary');
    name?.addEventListener('input',e=>state.businessName=e.target.value);
    summary?.addEventListener('input',e=>state.businessSummary=e.target.value);
  }

  if(state.step===5){
    document.querySelectorAll('[data-ref]').forEach(input=>input.addEventListener('input',e=>{
      state.references[Number(e.target.dataset.ref)]=e.target.value.trim();
    }));
  }

  document.querySelector('#li-next')?.addEventListener('click',()=>{
    if(state.step===0 && (state.businessName.trim().length<2 || !state.sector)) return flash('Escribe el negocio y elige una categoría.');
    if(state.step===1 && !state.goal) return flash('Elige la transformación principal.');
    if(state.step===2 && state.adaptive.length===0) return flash('Elige al menos un punto.');
    if(state.step===4 && state.capabilities.length===0 && state.needs.length===0) return flash('Marca al menos algo que aporta o necesita.');
    state.step=Math.min(6,state.step+1);render();
  });

  document.querySelector('#li-save')?.addEventListener('click',saveToVault);
}

function flash(message){
  let box=document.querySelector('.li-inline-error');
  if(!box){
    box=document.createElement('div');
    box.className='li-inline-error';
    document.querySelector('.li-actions')?.prepend(box);
  }
  box.textContent=message;
}

async function saveToVault(){
  const button=document.querySelector('#li-save');
  const status=document.querySelector('#li-submit-status');
  if(!button||!status) return;
  button.disabled=true;
  button.textContent='Guardando…';
  status.dataset.state='loading';
  status.textContent='Creando ADN y moviendo el negocio al Prospect Vault.';

  const d=dna();
  const m=method();
  const q=adaptive[state.goal]||adaptive.sell_more;
  const refs=state.references.filter(Boolean).map(value=>({value}));

  const payload={
    p_business_name:state.businessName.trim(),
    p_sector:d.sector||'sin_clasificar',
    p_business_summary:state.businessSummary.trim()||null,
    p_primary_goal:state.goal,
    p_adaptive_answer:{selected:state.adaptive,labels:selectedLabels(state.adaptive,q.options)},
    p_current_tools:state.tools,
    p_capabilities:state.capabilities,
    p_needs:state.needs,
    p_association_interests:state.associations,
    p_reference_items:refs,
    p_clone_aspects:state.cloneAspects,
    p_answers:{
      sector:state.sector,
      goal:state.goal,
      adaptive:state.adaptive,
      tools:state.tools,
      capabilities:state.capabilities,
      needs:state.needs,
      associations:state.associations,
      references:refs,
      clone_aspects:state.cloneAspects
    },
    p_adapter_path:m.path,
    p_action_method:{title:m.title,steps:m.steps},
    p_dna_summary:d,
    p_contact_name:null,
    p_email:null,
    p_instagram:null,
    p_lead_reference:leadRef||null
  };

  const {data,error}=await db.rpc('link_world_submit_prospect_vault',payload);
  if(error){
    button.disabled=false;
    button.textContent='Guardar en Vault →';
    status.dataset.state='error';
    status.textContent=error.message||'No pudimos guardar el ADN.';
    return;
  }

  const row=Array.isArray(data)?data[0]:data;
  status.dataset.state='success';
  status.innerHTML=`<b>Guardado en Prospect Vault.</b><span>Referencia ${esc(row?.reference_code||'—')} · pendiente de verificación antes de entrar al Micelio.</span>`;
  button.textContent='Guardado ✓';
  document.querySelector('.li-actions')?.insertAdjacentHTML('beforeend','<a class="li-finish" href="/?space=vault">Abrir Vault →</a>');
}

render();
