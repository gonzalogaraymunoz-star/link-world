const TOKEN_LABELS={
  source_transaction:'Transacción fuente',
  financial_core_policy:'Política del núcleo financiero',
  controlled_rollback_test:'Prueba controlada con rollback',
  rollback_verification:'Verificación posterior al rollback',
  needs_credentials:'Faltan credenciales',
  business_collects:'El negocio cobra',
  link_collects:'LINK cobra',
  partner_collects:'El partner cobra',
  external:'Externo',
  pending_definition:'Por definir',
  verified:'Verificado',
  unverified:'Sin verificar',
  proposed:'Propuesto',
  active:'Activo',
  inactive:'Inactivo',
  connected:'Conectado',
  blocked:'Bloqueado',
  completed:'Completado',
  in_progress:'En progreso',
  waiting:'En espera',
  draft:'Borrador',
  true:'Sí',
  false:'No'
};

const KEY_LABELS={
  fact:'Hecho',
  ref:'Referencia',
  code:'Código',
  type:'Tipo',
  note:'Nota',
  title:'Título',
  label:'Etiqueta',
  name:'Nombre',
  description:'Descripción',
  reason:'Motivo',
  action:'Acción',
  change:'Cambio',
  movement:'Movimiento',
  status:'Estado',
  state:'Estado',
  source:'Origen',
  target:'Destino',
  relation:'Relación',
  evidence:'Evidencia',
  amount:'Monto',
  currency:'Moneda',
  real_movement:'Movimiento real',
  test_amount_clp:'Monto de prueba',
  gross_amount:'Monto bruto',
  net_amount:'Monto neto',
  payment_status:'Estado de pago',
  allocation_status:'Asignación',
  provider:'Proveedor',
  owner:'Responsable',
  business_id:'Negocio',
  created_at:'Creado',
  updated_at:'Actualizado'
};

const PRIMARY_KEYS=['fact','message','title','label','name','description','note','summary','reason','action','change','movement','current_state','state'];

function parseMaybe(value){
  if(typeof value!=='string')return value;
  const trimmed=value.trim();
  if(!trimmed || !((trimmed.startsWith('{')&&trimmed.endsWith('}'))||(trimmed.startsWith('[')&&trimmed.endsWith(']'))))return value;
  try{return JSON.parse(trimmed);}catch{return value;}
}

export function labelizeKey(key=''){
  const raw=String(key||'').trim();
  if(!raw)return 'Dato';
  if(KEY_LABELS[raw])return KEY_LABELS[raw];
  return raw
    .replace(/([a-z0-9])([A-Z])/g,'$1 $2')
    .replaceAll('_',' ')
    .replaceAll('-',' ')
    .replace(/\s+/g,' ')
    .trim()
    .replace(/^./,m=>m.toUpperCase());
}

export function humanizeToken(value){
  if(value==null||value==='')return '—';
  if(typeof value==='boolean')return value?'Sí':'No';
  if(typeof value==='number')return new Intl.NumberFormat('es-CL').format(value);
  const raw=String(value).trim();
  const key=raw.toLowerCase();
  if(TOKEN_LABELS[key])return TOKEN_LABELS[key];
  if(/^[a-z0-9]+(?:[_-][a-z0-9]+)+$/i.test(raw)){
    return labelizeKey(raw);
  }
  return raw;
}

function formatByKey(key,value){
  if(value==null||value==='')return '—';
  if(typeof value==='number' && /(?:_clp|amount_clp)$/i.test(key)){
    return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value);
  }
  if(typeof value==='number' && /(?:percent|rate)$/i.test(key))return humanizeToken(value)+'%';
  if(typeof value==='boolean')return value?'Sí':'No';
  return humanizeToken(value);
}

export function describeValue(input,{maxMeta=6}={}){
  const value=parseMaybe(input);
  if(value==null||value==='')return {primary:'',meta:[]};
  if(Array.isArray(value)){
    const rows=value.filter(v=>v!=null&&v!=='').map(v=>describeValue(v,{maxMeta:3}));
    return {
      primary:rows.map(r=>r.primary).filter(Boolean).join(' · '),
      meta:rows.flatMap(r=>r.meta).slice(0,maxMeta)
    };
  }
  if(typeof value!=='object')return {primary:humanizeToken(value),meta:[]};

  const entries=Object.entries(value).filter(([,v])=>v!=null&&v!=='');
  const primaryKey=PRIMARY_KEYS.find(key=>value[key]!=null&&value[key]!=='');
  const primary=primaryKey?describeValue(value[primaryKey],{maxMeta:2}).primary:'';
  const meta=[];
  for(const [key,raw] of entries){
    if(key===primaryKey)continue;
    if(meta.length>=maxMeta)break;
    const parsed=parseMaybe(raw);
    if(Array.isArray(parsed)){
      const preview=parsed.slice(0,3).map(v=>describeValue(v,{maxMeta:1}).primary).filter(Boolean).join(' · ');
      meta.push({label:labelizeKey(key),value:preview+(parsed.length>3?' · +'+(parsed.length-3):'')});
      continue;
    }
    if(parsed&&typeof parsed==='object'){
      const nested=describeValue(parsed,{maxMeta:2});
      const nestedText=[nested.primary,...nested.meta.map(x=>x.label+': '+x.value)].filter(Boolean).join(' · ');
      meta.push({label:labelizeKey(key),value:nestedText||Object.keys(parsed).length+' datos'});
      continue;
    }
    meta.push({label:labelizeKey(key),value:formatByKey(key,parsed)});
  }
  return {
    primary:primary||meta.shift()?.value||'Registro',
    meta
  };
}

export function readableValue(value,options={}){
  const d=describeValue(value,options);
  return [d.primary,...d.meta.map(x=>x.label+': '+x.value)].filter(Boolean).join(' · ');
}
