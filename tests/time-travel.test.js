import test from 'node:test';
import assert from 'node:assert/strict';
import { getZonedFields, resolveLocalTime } from '../time-travel.js';
import { getOffsetMinutes, getTimeParts } from '../timezones.js';

const zones = [
  'Australia/Perth', 'Australia/Adelaide', 'Australia/Darwin',
  'Asia/Tokyo', 'Australia/Brisbane', 'Australia/Sydney'
];

for (const [zone, date, time, expected] of [
  ['Australia/Perth', '2026-10-15', '09:00', '2026-10-15T01:00:00.000Z'],
  ['Australia/Adelaide', '2026-10-15', '11:30', '2026-10-15T01:00:00.000Z'],
  ['Australia/Adelaide', '2026-07-15', '10:30', '2026-07-15T01:00:00.000Z'],
  ['Australia/Darwin', '2026-10-15', '10:30', '2026-10-15T01:00:00.000Z'],
  ['Asia/Tokyo', '2026-10-15', '10:00', '2026-10-15T01:00:00.000Z'],
  ['Australia/Brisbane', '2026-10-15', '11:00', '2026-10-15T01:00:00.000Z'],
  ['Australia/Sydney', '2026-10-15', '12:00', '2026-10-15T01:00:00.000Z'],
  ['Australia/Sydney', '2026-07-15', '11:00', '2026-07-15T01:00:00.000Z'],
]) {
  test(`${zone}: ${date} ${time} converts to the correct UTC instant`, () => {
    const result = resolveLocalTime(zone, date, time);
    assert.equal(result.instant.toISOString(), expected);
    assert.equal(result.ambiguous, false);
    assert.deepEqual(getZonedFields(zone, result.instant), { date, time });
  });
}

test('the chosen instant yields all six clocks correctly', () => {
  const { instant } = resolveLocalTime('Australia/Perth', '2026-10-15', '09:00');
  assert.deepEqual(zones.map(z => getTimeParts(z, instant).clock), ['09:00', '11:30', '10:30', '10:00', '11:00', '12:00']);
});

test('date rollover when referencing Tokyo near midnight', () => {
  const { instant } = resolveLocalTime('Asia/Tokyo', '2026-10-16', '00:15');
  assert.deepEqual(getZonedFields('Australia/Perth', instant), { date: '2026-10-15', time: '23:15' });
});

test('Sydney daylight-saving spring skip is rejected', () => {
  assert.throws(() => resolveLocalTime('Australia/Sydney', '2026-10-04', '02:30'), /does not exist/);
});

test('Sydney daylight-saving fall repeated time chooses first occurrence and flags ambiguity', () => {
  const result = resolveLocalTime('Australia/Sydney', '2026-04-05', '02:30');
  assert.equal(result.ambiguous, true);
  assert.equal(result.instant.toISOString(), '2026-04-04T15:30:00.000Z');
  assert.equal(getOffsetMinutes('Australia/Sydney', result.instant), 660);
});

test('invalid calendar dates and time are rejected', () => {
  assert.throws(() => resolveLocalTime('Australia/Perth', '2026-02-30', '12:00'), /valid calendar date/);
  assert.throws(() => resolveLocalTime('Australia/Perth', '2026-10-15', '24:00'), /valid date and time/);
});
