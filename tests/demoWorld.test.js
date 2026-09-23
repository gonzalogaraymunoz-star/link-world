import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoEngine, demoProjection, DEMO_CELLS, STRATEGIES } from '../src/domain/demoWorld.js';

test('The demo is isolated, fictitious and starts without commercial facts', () => {
  const app = createDemoEngine();
  const s = app.get();
  assert.equal(s.phase, 0);
  assert.equal(s.events.length, 0);
  assert.equal(s.demoExecution, false);
  assert.equal(demoProjection(s).opportunity, 'sin registrar');
  assert.equal(DEMO_CELLS.length, 5);
  assert.equal(STRATEGIES.length, 7);
});

test('A complete simulated loop coherently changes mission, relation, evidence and memory', () => {
  const app = createDemoEngine();
  for (const cmd of ['observe', 'coordinate', 'simulate_availability', 'simulate_execution', 'record_lesson'])
    assert.equal(app.dispatch(cmd).ok, true, cmd);
  const s = app.get(), projection = demoProjection(s);
  assert.equal(s.finished, true);
  assert.equal(s.events.length, 5);
  assert.equal(s.relation, 'ejercida (simulación)');
  assert.equal(projection.evidence, 'resultado ficticio, no verificado');
  assert.equal(projection.mission, 'completada (DEMO)');
  assert.ok(projection.events.every(e => e.source==='DEMO FICTICIA' && e.verification_state==='simulado'));
  assert.equal(app.dispatch('simulate_execution').ok, false);
});

test('A defer branch blocks mission and cannot silently execute an operation', () => {
  const app=createDemoEngine();
  app.dispatch('observe');
  app.dispatch('defer');
  const s=app.get();
  assert.equal(s.mission,'bloqueada');
  assert.equal(s.relation,'conceptual');
  assert.equal(app.dispatch('simulate_execution').ok,false);
  assert.equal(app.dispatch('revise').ok,true);
  assert.equal(app.get().phase,1);
});

test('Rejecting and resetting never invents a fulfilled relationship', () => {
  const app=createDemoEngine();
  app.dispatch('observe');
  app.dispatch('decline');
  assert.equal(app.get().mission,'cancelada');
  assert.equal(app.get().demoExecution,false);
  app.dispatch('reset');
  assert.equal(app.get().phase,0);
  assert.equal(app.get().relation,'conceptual');
  assert.equal(app.get().events.length,1);
});

test('Snapshots cannot mutate the engine state',()=>{
  const app=createDemoEngine();
  const copy=app.get();
  copy.phase=5;
  copy.events.push({type:'fake'});
  assert.equal(app.get().phase,0);
  assert.equal(app.get().events.length,0);
});
