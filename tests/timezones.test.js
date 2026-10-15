import test from 'node:test';
import assert from 'node:assert/strict';
import { getOffsetMinutes, getAbbreviation, getUTCLabel, getDifference, getTimeParts } from '../timezones.js';

const zones = ['Australia/Perth', 'Australia/Darwin', 'Australia/Adelaide', 'Asia/Tokyo', 'Australia/Brisbane', 'Australia/Sydney'];
for (const [season, instant, expected] of [
  ['summer', '2026-10-15T01:00:00.000Z', [480, 570, 630, 540, 600, 660]],
  ['winter', '2026-07-15T01:00:00.000Z', [480, 570, 570, 540, 600, 600]]
]) {
  test(`${season} offsets correctly account for daylight saving (Japan stays JST)`, () => {
    const when = new Date(instant);
    assert.deepEqual(zones.map(zone => getOffsetMinutes(zone, when)), expected);
  });
}

test('labels and time differences display correctly', () => {
  assert.equal(getAbbreviation('Australia/Darwin', 570), 'ACST');
  assert.equal(getAbbreviation('Australia/Adelaide', 630), 'ACDT');
  assert.equal(getAbbreviation('Australia/Adelaide', 570), 'ACST');
  assert.equal(getAbbreviation('Asia/Tokyo', 540), 'JST');
  assert.equal(getAbbreviation('Australia/Sydney', 660), 'AEDT');
  assert.equal(getAbbreviation('Australia/Sydney', 600), 'AEST');
  assert.equal(getUTCLabel(540), 'UTC+09:00');
  assert.deepEqual(getDifference(540, 480), { value: '+1h', label: 'Ahead of Perth' });
  assert.deepEqual(getDifference(540, 600, 'Brisbane'), { value: '−1h', label: 'Behind Brisbane' });
  assert.deepEqual(getDifference(630, 540, 'Tokyo'), { value: '+1h 30m', label: 'Ahead of Tokyo' });
  assert.deepEqual(getDifference(540, 540, 'Tokyo', true), { value: 'BASE', label: 'Reference' });
  assert.deepEqual(getDifference(570, 570, 'Darwin'), { value: 'SAME', label: 'Same time as Darwin' });
});

test('all six clocks render local times from a single instant', () => {
  const instant = new Date('2026-10-15T01:00:00.000Z');
  assert.deepEqual(zones.map(zone => getTimeParts(zone, instant).clock), ['09:00','10:30','11:30','10:00','11:00','12:00']);
});

test('NSW, Victoria and ACT use same timezone for daylight saving and standard time', () => {
  for (const at of [new Date('2026-10-15T01:00:00.000Z'), new Date('2026-07-15T01:00:00.000Z')]) {
    assert.equal(getOffsetMinutes('Australia/Canberra', at), getOffsetMinutes('Australia/Sydney', at));
    assert.equal(getOffsetMinutes('Australia/Melbourne', at), getOffsetMinutes('Australia/Sydney', at));
  }
});
