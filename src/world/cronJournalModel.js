import {readableValue} from './presentation.js';

const arrayify=value=>{
  if(value==null||value==='')return [];
  if(Array.isArray(value))return value.filter(item=>item!=null&&item!=='');
  if(typeof value==='object'){
    // A structured event is one record; splitting its values loses labels and evidence.
    if(['fact','ref','code','note','title','real_movement','test_amount_clp'].some(key=>Object.hasOwn(value,key)))return [value];
    return Object.values(value).filter(item=>item!=null&&item!=='');
  }
  return [value];
};

const textify=value=>readableValue(value,{maxMeta:6});

const pick=(...values)=>values.find(value=>value!=null&&value!=='');

const statusMap={
  NOT_STARTED:'NOT_STARTED',
  IN_PROGRESS:'IN_PROGRESS',
  BLOCKED:'BLOCKED',
  COMPLETED:'COMPLETED',
  COMPLETE:'COMPLETED',
  PARTIAL:'PARTIAL',
  PARCIAL:'PARTIAL',
  NOT_COMPLETED:'NOT_COMPLETED',
  NO_COMPLETADA:'NOT_COMPLETED',
  NO_COMPLETADO:'NOT_COMPLETED'
};

export function normalizeStatus(value){
  const key=String(value||'').trim().toUpperCase().replaceAll(' ','_');
  return statusMap[key]||key||'UNKNOWN';
}

export function normalizeCronExecution(row={}){
  const s=row.structured_data||{};
  const meta=row.metadata||{};
  const handoff=s.handoff_to_night_memory||{};
  const date=pick(
    s.date,
    meta.date,
    /^link_daily_mission:(\d{4}-\d{2}-\d{2})$/.exec(row.memory_key||'')?.[1],
    row.updated_at?.slice?.(0,10)
  )||'Sin fecha';
  const mission=pick(s.mission,s.mision,s.opening_decision,s.thesis_del_dia,'Sin misión persistida');
  const stateFrom=pick(
    s.estado_inicial,
    s.night_current_state,
    handoff.opening_assumption,
    s.opening_assumption
  );
  const closingState=pick(s.closing_state,s.estado_final,handoff.closing_state);
  const nextState=pick(s.next_state,s.siguiente_estado,handoff.next_state);
  const rawStatus=pick(s.status,s.resultado_final,handoff.mission_result,s.mission_result);
  const status=normalizeStatus(rawStatus);
  const evidence=arrayify(pick(s.evidence,s.evidencias));
  const blockers=[
    ...arrayify(pick(s.blockers,s.bloqueos)),
    ...arrayify(s.blocker)
  ].filter((value,index,self)=>self.indexOf(value)===index);
  const decisions=arrayify(pick(s.decisions_today,s.decisions,s.decisiones));
  const money=arrayify(pick(s.money_movement,s.money_events,handoff.money_events));
  const operational=arrayify(pick(s.operational_change,s.operational_events,handoff.operational_events));
  const learning=arrayify(pick(s.ecosystem_learning,s.learning_of_day,s.aprendizajes));
  const persistence=arrayify(pick(s.persistence_debt_today,s.persistence_debt,handoff.persistence_debt));
  const progress=pick(s.progress_14h,s.avance_14h);
  const criterion=pick(s.criterio_de_terminado,s.done_criteria);
  const firstBlock=pick(s.first_block,s.primer_bloque);
  const question=pick(s.question_for_tomorrow,s.pregunta_para_manana,s.pregunta_para_mañana,handoff.question_for_tomorrow);
  const isClosed=Boolean(
    closingState||
    s.learning_of_day||
    s.resultado_final||
    ['COMPLETED','PARTIAL','NOT_COMPLETED'].includes(status)
  );

  return {
    id:row.id,
    memoryKey:row.memory_key,
    kind:row.kind,
    source:row.source,
    date,
    mission:textify(mission),
    status,
    stateFrom:textify(stateFrom),
    closingState:textify(closingState),
    nextState:textify(nextState),
    criterion:textify(criterion),
    firstBlock:textify(firstBlock),
    priority2:textify(pick(s.priority_2,s.prioridad_2)),
    priority3:textify(pick(s.priority_3,s.prioridad_3)),
    progress:textify(progress),
    evidence:evidence.map(textify),
    blockers:blockers.map(textify),
    money:money.map(textify),
    operational:operational.map(textify),
    learning:learning.map(textify),
    decisions:decisions.map(textify),
    persistence:persistence.map(textify),
    question:textify(question),
    title:textify(pick(s.title,s.titulo,s.titulo_editorial,s.thesis_del_dia)),
    isClosed,
    updatedAt:row.updated_at||null,
    raw:s
  };
}

export function executionMatchesCron(execution,cron){
  if(cron.source_kind&&execution.kind!==cron.source_kind)return false;
  if(cron.source_system&&execution.source&&execution.source!==cron.source_system)return false;
  const pattern=String(cron.memory_key_pattern||'');
  const prefix=pattern.includes('YYYY')?pattern.split('YYYY')[0]:pattern;
  if(prefix&&execution.memoryKey&&!execution.memoryKey.startsWith(prefix))return false;
  return true;
}

export function fallbackRegistry(){
  return [{
    cron_id:'link_daily_direction',
    label:'LINK · DIRECCIÓN DIARIA',
    source:'deep_memories',
    source_kind:'daily_operating_mission',
    memory_key_pattern:'link_daily_mission:YYYY-MM-DD',
    source_system:'link_daily_cron',
    daily_views:[
      {phase:'opening',time:'08:00',view:'COMMAND'},
      {phase:'control',time:'14:00',view:'TRAJECTORY'},
      {phase:'closing',time:'21:00',view:'EVOLUTION'}
    ]
  }];
}

export function buildCronJournal({architecture,rows=[]}={}){
  const configured=architecture?.structured_data?.registered_crons;
  const registry=Array.isArray(configured)&&configured.length?configured:fallbackRegistry();
  const executions=rows.map(normalizeCronExecution).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const groups=registry.map(cron=>{
    const items=executions.filter(item=>executionMatchesCron(item,cron));
    return {...cron,items};
  });
  const active=groups.flatMap(group=>group.items);
  return {
    registry,
    groups,
    executions:active,
    summary:{
      cronCount:groups.length,
      executionCount:active.length,
      closedCount:active.filter(item=>item.isClosed).length,
      blockedCount:active.filter(item=>item.status==='BLOCKED').length
    }
  };
}

export function statusLabel(status){
  return ({
    NOT_STARTED:'No iniciada',
    IN_PROGRESS:'En progreso',
    BLOCKED:'Bloqueada',
    COMPLETED:'Completada',
    PARTIAL:'Parcial',
    NOT_COMPLETED:'No completada',
    UNKNOWN:'Sin cierre'
  })[normalizeStatus(status)]||String(status||'Sin estado');
}
