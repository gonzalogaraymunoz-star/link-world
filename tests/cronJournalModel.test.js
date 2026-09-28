import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCronJournal,normalizeCronExecution,statusLabel} from '../src/world/cronJournalModel.js';

test('normalizes current daily mission fields without inventing a close',()=>{
  const item=normalizeCronExecution({
    id:'d1',memory_key:'link_daily_mission:2026-09-27',kind:'daily_operating_mission',source:'link_daily_cron',
    updated_at:'2026-09-27T17:00:00Z',
    structured_data:{
      date:'2026-09-27',status:'IN_PROGRESS',mission:'Validar scanner',
      estado_inicial:'Light Engine conceptual',criterio_de_terminado:'Cadena recorrida',
      progress_14h:'Scanner aplicado',evidence:['HE observado'],blockers:['Falta contrato']
    }
  });
  assert.equal(item.date,'2026-09-27');
  assert.equal(item.status,'IN_PROGRESS');
  assert.equal(item.evidence.length,1);
  assert.equal(item.blockers.length,1);
  assert.equal(item.isClosed,false);
});

test('normalizes legacy Spanish closing fields into evolution data',()=>{
  const item=normalizeCronExecution({
    id:'d2',memory_key:'link_daily_mission:2026-09-26',kind:'daily_operating_mission',source:'link_daily_cron',
    structured_data:{
      mision:'Construir diccionario canónico',estado_inicial:'Sin detector',
      resultado_final:'PARCIAL',evidencias:['Luz definida'],bloqueos:['Sin motor'],
      aprendizajes:['Una célula se codifica por lo que sabe hacer'],
      siguiente_estado:'Catálogo canónico disponible'
    }
  });
  assert.equal(item.status,'PARTIAL');
  assert.equal(item.isClosed,true);
  assert.match(item.nextState,/Catálogo/);
  assert.equal(statusLabel(item.status),'Parcial');
});

test('journal uses persisted registry and groups matching executions',()=>{
  const architecture={structured_data:{registered_crons:[{
    cron_id:'link_daily_direction',label:'LINK · DIRECCIÓN DIARIA',
    source_kind:'daily_operating_mission',source_system:'link_daily_cron',
    memory_key_pattern:'link_daily_mission:YYYY-MM-DD'
  }]}};
  const model=buildCronJournal({architecture,rows:[
    {id:'1',memory_key:'link_daily_mission:2026-09-27',kind:'daily_operating_mission',source:'link_daily_cron',structured_data:{status:'BLOCKED'}},
    {id:'2',memory_key:'other:2026-09-27',kind:'daily_operating_mission',source:'other',structured_data:{}}
  ]});
  assert.equal(model.groups.length,1);
  assert.equal(model.groups[0].items.length,1);
  assert.equal(model.summary.blockedCount,1);
});


test('renders structured evidence and blockers as human-readable text',()=>{
  const item=normalizeCronExecution({
    id:'d3',memory_key:'link_daily_mission:2026-09-28',kind:'daily_operating_mission',source:'link_daily_cron',
    structured_data:{
      status:'BLOCKED',
      evidence:[{ref:'HE:SOL-2609-004',fact:'Cotización aceptada por 49.980 CLP.',type:'source_transaction'}],
      blockers:[{code:'MP_TEST_CREDENTIALS_MISSING',fact:'Falta la credencial sandbox de Mercado Pago.'}],
      money_movement:{note:'Monto reversible de prueba.',real_movement:false,test_amount_clp:49980}
    }
  });
  assert.equal(item.evidence.length,1);
  assert.match(item.evidence[0],/Cotización aceptada/);
  assert.match(item.evidence[0],/Referencia: HE:SOL-2609-004/);
  assert.doesNotMatch(item.evidence[0],/[{}]/);
  assert.match(item.blockers[0],/Código: MP_TEST_CREDENTIALS_MISSING/);
  assert.doesNotMatch(item.blockers[0],/[{}]/);
  assert.match(item.money[0],/Movimiento real: No/);
  assert.match(item.money[0],/49\.980/);
});
