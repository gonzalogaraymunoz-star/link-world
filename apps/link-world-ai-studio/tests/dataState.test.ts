import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consolidateSummary, errorStatus, filterBusinesses } from '../src/services/dataState.ts';

test('consolidates numeric database strings and preserves zero net after costs', () => {
  const summary = consolidateSummary([{income_collected: '100', net_real: '25'}, {income_collected: '50', net_real: '-25'}]);
  assert.equal(summary.income_collected, 150);
  assert.equal(summary.net_real, 0);
  assert.equal(consolidateSummary([]), null);
});
test('network and schema failures are not presented as missing permissions', () => {
  assert.equal(errorStatus({code: '42501'}), 'unauthorized');
  assert.equal(errorStatus({code: 'PGRST301'}), 'unauthorized');
  assert.equal(errorStatus({code: '42P01', message: 'relation does not exist'}), 'error');
  assert.equal(errorStatus({message: 'Failed to fetch'}), 'error');
});
test('search matches accented cities and summaries, and retains source identities', () => {
  const businesses = [{name:'Lama Travelers', slug:'lama-travelers',city:'San Pedro',summary:'Turismo'}, {name:'Café Roots',slug:'roots',city:'São Paulo'}];
  assert.deepEqual(filterBusinesses(businesses, 'sao'), [businesses[1]]);
  assert.deepEqual(filterBusinesses(businesses, 'TURISMO'), [businesses[0]]);
  assert.deepEqual(filterBusinesses(businesses, 'missing'), []);
});
