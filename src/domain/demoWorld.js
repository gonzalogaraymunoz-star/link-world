// LINK WORLD · isolated deterministic demonstration.
// Never imports Google Places, Supabase or commercial operations.
// No persistence: a new page load starts a fresh, explicitly fictional session.
export const DEMO_CELLS = [
  { id: 'lama', name: 'Lama Travelers', sector: 'Turismo', monogram: 'LT', color: '#d0c6a8',
    purpose: 'Experiencias turísticas para viajeros de Atacama y Brasil.',
    genes: ['Tours', 'Cotizaciones', 'Itinerarios', 'Riesgo', 'Proveedores'], organelles: ['Agenda · proyectada', 'Reservas · por conectar'] },
  { id: 'hotel', name: 'Hotel Experience', sector: 'Hotelería', monogram: 'HE', color: '#bdcdb3',
    purpose: 'Intermediación hotelera y coordinación de experiencias.',
    genes: ['Reservas', 'Pasajeros', 'Itinerario', 'Alimentación', 'Riesgo'], organelles: ['Sistema operativo · por conectar', 'Ventas · por conectar'] },
  { id: 'taxi', name: 'TaxiHotel', sector: 'Transporte', monogram: 'TX', color: '#d9bfa8',
    purpose: 'Coordinación de traslados, flota y disponibilidad.',
    genes: ['Flota', 'Traslados', 'Horarios', 'Asignaciones'], organelles: ['Despacho · por conectar'] },
  { id: 'caracol', name: 'Caracol', sector: 'Gastronomía', monogram: 'CA', color: '#d1afa3',
    purpose: 'Experiencia gastronómica, música y contenidos.',
    genes: ['Eventos', 'Contenido', 'Campañas', 'Reservas'], organelles: ['Marketing · por conectar'] },
  { id: 'wellness', name: 'Wellness', sector: 'Bienestar', monogram: 'WE', color: '#bacbd5',
    purpose: 'Prestadores y sesiones de bienestar.',
    genes: ['Solicitudes', 'Matching', 'Agenda', 'Sesiones'], organelles: ['Prestadores · por conectar'] }
];
export const STRATEGIES = [
  {id:'demand',name:'Demanda',short:'Detectar necesidades',detail:'Registrar una señal y comprobar si existe una necesidad real.'},
  {id:'capability',name:'Capacidades',short:'Resolver fricciones',detail:'Investigar un proceso repetido y proponer una capacidad compartida.'},
  {id:'alliance',name:'Cooperación',short:'Conectar aliados',detail:'Proponer relaciones sin asumir que ya existen acuerdos.'},
  {id:'recurrence',name:'Recurrencia',short:'Dar continuidad',detail:'Crear nuevas opciones después de un servicio y con consentimiento.'},
  {id:'territory',name:'Territorio',short:'Explorar cobertura',detail:'Observar zonas sin confundir pines con demanda comprobada.'},
  {id:'evidence',name:'Evidencia',short:'Verificar resultados',detail:'Distinguir hechos, suposiciones y aprendizajes pendientes.'},
  {id:'incubation',name:'Incubación',short:'Replicar capacidades',detail:'Probar un modelo antes de proponer nuevas células.'}
];
export const DEMO_STEPS = ['Observar','Interpretar','Decidir','Actuar','Verificar','Aprender'];
const EVENT_MESSAGES = {
  hypothesis_recorded:'Se registró una oportunidad ficticia para estudiar.',
  relation_proposed:'Se propuso una sinapsis DEMO entre Hotel Experience y Lama Travelers.',
  relation_deferred:'Se eligió reprogramar: la misión queda bloqueada hasta revisar capacidad.',
  relation_declined:'Se decidió no intervenir. La demostración termina sin operación.',
  availability_simulated:'Se simuló capacidad disponible: no representa una confirmación real.',
  operation_simulated:'Se simuló la ejecución de una experiencia: NO es una venta ni servicio real.',
  lesson_proposed:'Se propuso un aprendizaje en memoria DEMO. Queda pendiente de revisión real.',
  reset:'Se reinició la demostración.'
};
function initial() {
  return { phase:0, decision:null, relation:'conceptual', mission:'borrador', blocked:null, demoExecution:false,
    hypothesis:false, availability:false, lesson:false, finished:false, events:[] };
}
const makeEvent = (type, number, extra={}) => ({
  id: 'demo-event-' + number, type, source:'DEMO FICTICIA', verification_state:'simulado',
  occurred_at: new Date().toISOString(), ...extra
});
export function createDemoEngine(notify=()=>{}) {
  let state = initial();
  let version = 0;
  function get() { return structuredClone(state); }
  function emit(type, extra) {
    version += 1;
    state.events = [...state.events, makeEvent(type, version, extra)];
    notify(get());
    return { ok:true, state:get() };
  }
  function dispatch(command) {
    if (command === 'reset') {
      state = initial(); version = 0;
      return emit('reset');
    }
    if (state.finished) return {ok:false,error:'Esta partida de demostración terminó. Puedes reiniciarla.'};
    if (command === 'observe' && state.phase===0) {
      Object.assign(state, {phase:1, hypothesis:true, mission:'lista'});
      return emit('hypothesis_recorded');
    }
    if (command === 'coordinate' && state.phase===1) {
      Object.assign(state,{phase:2,decision:'coordinate',relation:'propuesta',mission:'activa'});
      return emit('relation_proposed');
    }
    if (command === 'defer' && state.phase===1) {
      Object.assign(state,{phase:2,decision:'defer',relation:'conceptual',mission:'bloqueada',blocked:'Capacidad y fecha sin confirmar'});
      return emit('relation_deferred');
    }
    if (command === 'decline' && state.phase===1) {
      Object.assign(state,{phase:5,decision:'decline',mission:'cancelada',finished:true});
      return emit('relation_declined');
    }
    if (command === 'revise' && state.phase===2 && state.decision==='defer') {
      Object.assign(state,{phase:1,decision:null,mission:'lista',blocked:null});
      return emit('hypothesis_recorded',{note:'Revisar opciones, sin operación.'});
    }
    if (command === 'simulate_availability' && state.phase===2 && state.decision==='coordinate') {
      Object.assign(state,{phase:3,availability:true,relation:'acordada (simulación)',mission:'activa'});
      return emit('availability_simulated');
    }
    if (command === 'simulate_execution' && state.phase===3 && state.availability) {
      Object.assign(state,{phase:4,demoExecution:true,relation:'ejercida (simulación)',mission:'en revisión'});
      return emit('operation_simulated');
    }
    if (command === 'record_lesson' && state.phase===4 && state.demoExecution) {
      Object.assign(state,{phase:5,lesson:true,finished:true,mission:'completada (DEMO)'});
      return emit('lesson_proposed');
    }
    return {ok:false,error:'Acción no disponible en el estado actual. Revisa los pasos y bloqueos.'};
  }
  return {get,dispatch};
}
export function demoProjection(state) {
  return {
    mission: state.mission,
    relation: state.relation,
    opportunity: state.hypothesis ? 'hipótesis DEMO' : 'sin registrar',
    evidence: state.demoExecution ? 'resultado ficticio, no verificado' : 'no existe',
    next: state.phase===0 ? 'Observar un caso ficticio'
      : state.phase===1 ? 'Elegir estrategia de respuesta'
      : state.phase===2 && state.decision==='defer' ? 'Revisar capacidad o detener'
      : state.phase===2 ? 'Comprobar disponibilidad hipotética'
      : state.phase===3 ? 'Simular ejecución'
      : state.phase===4 ? 'Proponer un aprendizaje'
      : 'Reiniciar otra partida',
    blocked: state.blocked,
    events: state.events.map(e=>({ ...e, label: EVENT_MESSAGES[e.type] || e.type })),
    stage: state.phase,
    finished: state.finished
  };
}
