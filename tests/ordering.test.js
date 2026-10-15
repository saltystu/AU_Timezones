import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION_ZONES, sortByCurrentUTC, validateSavedOrder, moveZoneBeforeOrAfter } from '../ordering.js';

const [wa, nt, sa, qld, tokyo, nswAct] = REGION_ZONES;

test('summer UTC sorting orders Tokyo between Perth and Darwin', () => {
  assert.deepEqual(sortByCurrentUTC(REGION_ZONES, new Date('2026-10-15T02:00:00Z')), [wa, tokyo, nt, qld, sa, nswAct]);
});

test('winter UTC sorting places Tokyo first after Perth, with SA and NT tied', () => {
  assert.deepEqual(sortByCurrentUTC(REGION_ZONES, new Date('2026-07-15T02:00:00Z')), [wa, tokyo, nt, sa, qld, nswAct]);
});

test('UTC order accounts for Australian daylight saving boundaries', () => {
  const before = new Date('2026-10-03T15:00:00Z');
  const after = new Date('2026-10-03T17:00:00Z');
  assert.deepEqual(sortByCurrentUTC(REGION_ZONES, before), [wa, tokyo, nt, sa, qld, nswAct]);
  assert.deepEqual(sortByCurrentUTC(REGION_ZONES, after), [wa, tokyo, nt, qld, sa, nswAct]);
});

test('manual card moves preserve every card', () => {
  const initial = [wa, tokyo, nt, qld, sa, nswAct];
  assert.deepEqual(moveZoneBeforeOrAfter(initial, wa, nswAct), [tokyo, nt, qld, sa, nswAct, wa]);
  assert.deepEqual(moveZoneBeforeOrAfter(initial, nswAct, tokyo), [wa, nswAct, tokyo, nt, qld, sa]);
  assert.deepEqual(moveZoneBeforeOrAfter(initial, wa, wa), initial);
});

test('saved card ordering requires six unique supported zones', () => {
  assert.deepEqual(validateSavedOrder([sa, nt, wa, tokyo, qld, nswAct], REGION_ZONES), [sa, nt, wa, tokyo, qld, nswAct]);
  assert.equal(validateSavedOrder([wa, nt, nt, sa, tokyo, nswAct], REGION_ZONES), null);
  assert.equal(validateSavedOrder([wa, nt, sa, qld, 'Australia/Canberra', nswAct], REGION_ZONES), null);
  assert.equal(validateSavedOrder('bad', REGION_ZONES), null);
});
