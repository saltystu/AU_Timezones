import test from 'node:test';
import assert from 'node:assert/strict';
import { getOffsetMinutes, getAbbreviation, getUTCLabel, getDifference, getTimeParts } from '../timezones.js';

for (const [season, instant, expected] of [
  ['summer', '2026-10-15T01:00:00.000Z', [480, 570, 630, 660, 600, 660]],
  ['winter', '2026-07-15T01:00:00.000Z', [480, 570, 570, 600, 600, 600]]
]) {
  test(`${season} timezone offsets account for daylight saving`, () => {
    const when = new Date(instant);
    const zones = ['Australia/Perth', 'Australia/Darwin', 'Australia/Adelaide', 'Australia/Canberra', 'Australia/Brisbane', 'Australia/Sydney'];
    assert.deepEqual(zones.map(zone => getOffsetMinutes(zone, when)), expected);
  });
}

test('labels and differences change correctly', () => {
  assert.equal(getAbbreviation('Australia/Darwin', 570), 'ACST');
  assert.equal(getAbbreviation('Australia/Adelaide', 630), 'ACDT');
  assert.equal(getAbbreviation('Australia/Adelaide', 570), 'ACST');
  assert.equal(getAbbreviation('Australia/Canberra', 660), 'AEDT');
  assert.equal(getAbbreviation('Australia/Canberra', 600), 'AEST');
  assert.equal(getAbbreviation('Australia/Sydney', 660), 'AEDT');
  assert.equal(getAbbreviation('Australia/Sydney', 600), 'AEST');
  assert.equal(getUTCLabel(630), 'UTC+10:30');
  assert.deepEqual(getDifference(630, 480), { value: '+2h 30m', label: 'Ahead of Perth' });
  assert.deepEqual(getDifference(570, 480), { value: '+1h 30m', label: 'Ahead of Perth' });
  assert.deepEqual(getDifference(600, 480), { value: '+2h', label: 'Ahead of Perth' });
  assert.deepEqual(getDifference(660, 480), { value: '+3h', label: 'Ahead of Perth' });
  assert.deepEqual(getDifference(480, 480, 'Perth', true), { value: 'BASE', label: 'Reference' });
});

test('all clocks render the correct instant', () => {
  const instant = new Date('2026-10-15T01:00:00.000Z');
  assert.equal(getTimeParts('Australia/Perth', instant).clock, '09:00');
  assert.equal(getTimeParts('Australia/Darwin', instant).clock, '10:30');
  assert.equal(getTimeParts('Australia/Adelaide', instant).clock, '11:30');
  assert.equal(getTimeParts('Australia/Brisbane', instant).clock, '11:00');
  assert.equal(getTimeParts('Australia/Sydney', instant).clock, '12:00');
  assert.equal(getTimeParts('Australia/Canberra', instant).clock, '12:00');
});

test('reference can be any state and equal offsets remain distinct from the selected reference', () => {
  assert.deepEqual(getDifference(480, 600, 'Brisbane'), { value: '−2h', label: 'Behind Brisbane' });
  assert.deepEqual(getDifference(570, 600, 'Brisbane'), { value: '−30m', label: 'Behind Brisbane' });
  assert.deepEqual(getDifference(630, 600, 'Brisbane'), { value: '+30m', label: 'Ahead of Brisbane' });
  assert.deepEqual(getDifference(600, 600, 'Brisbane', true), { value: 'BASE', label: 'Reference' });
  assert.deepEqual(getDifference(600, 600, 'Brisbane'), { value: 'SAME', label: 'Same time as Brisbane' });
  assert.deepEqual(getDifference(570, 570, 'Darwin'), { value: 'SAME', label: 'Same time as Darwin' });
});

test('ACT and NSW/VIC are distinct selectable regions despite sharing a timezone offset', () => {
  assert.deepEqual(getDifference(660, 660, 'Canberra', true), { value: 'BASE', label: 'Reference' });
  assert.deepEqual(getDifference(660, 660, 'Canberra'), { value: 'SAME', label: 'Same time as Canberra' });
  assert.deepEqual(getDifference(660, 660, 'Sydney / Melbourne'), { value: 'SAME', label: 'Same time as Sydney / Melbourne' });
});
