import test from 'node:test';
import assert from 'node:assert/strict';
import { REGION_ZONES, sortByCurrentUTC, validateSavedOrder, moveZoneBeforeOrAfter } from '../ordering.js';

const [wa, nt, sa, qld, act, nsw] = REGION_ZONES;

test('summer UTC sorting produces WA/SA, NT/ACT, QLD/NSW-VIC three-column pairs', () => {
  assert.deepEqual(sortByCurrentUTC(REGION_ZONES, new Date('2026-10-15T02:00:00Z')), [wa, nt, qld, sa, act, nsw]);
});

test('winter UTC sorting places NT/SA ahead of QLD/ACT/NSW/VIC', () => {
  assert.deepEqual(sortByCurrentUTC(REGION_ZONES, new Date('2026-07-15T02:00:00Z')), [wa, nt, sa, qld, act, nsw]);
});

test('UTC sort accounts for onset and end of DST', () => {
  const before = new Date('2026-10-03T15:00:00Z');
  const after = new Date('2026-10-03T17:00:00Z');
  assert.deepEqual(sortByCurrentUTC(REGION_ZONES, before), [wa, nt, sa, qld, act, nsw]);
  assert.deepEqual(sortByCurrentUTC(REGION_ZONES, after), [wa, nt, qld, sa, act, nsw]);
});

test('manual card moves preserve other cards and are not confused with UTC ordering', () => {
  const initial = [wa, nt, qld, sa, act, nsw];
  assert.deepEqual(moveZoneBeforeOrAfter(initial, wa, nsw), [nt, qld, sa, act, nsw, wa]);
  assert.deepEqual(moveZoneBeforeOrAfter(initial, nsw, nt), [wa, nsw, nt, qld, sa, act]);
  assert.deepEqual(moveZoneBeforeOrAfter(initial, wa, wa), initial);
});

test('localStorage restore accepts only a complete permutation of regions', () => {
  assert.deepEqual(validateSavedOrder([sa, nt, wa, act, qld, nsw], REGION_ZONES), [sa, nt, wa, act, qld, nsw]);
  assert.equal(validateSavedOrder([wa, nt, nt, sa, act, nsw], REGION_ZONES), null);
  assert.equal(validateSavedOrder([wa, nt, sa, qld, act], REGION_ZONES), null);
  assert.equal(validateSavedOrder('bad', REGION_ZONES), null);
});
