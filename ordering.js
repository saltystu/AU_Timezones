import { getOffsetMinutes } from './timezones.js';

// Stable tie-breakers keep the dashboard predictable where UTC offsets match.
export const REGION_ZONES = [
  'Australia/Perth',
  'Australia/Darwin',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Canberra',
  'Australia/Sydney'
];

export function sortByCurrentUTC(zones, at = new Date()) {
  return [...zones].sort((a, b) =>
    getOffsetMinutes(a, at) - getOffsetMinutes(b, at) || REGION_ZONES.indexOf(a) - REGION_ZONES.indexOf(b)
  );
}

export function validateSavedOrder(saved, zones) {
  if (!Array.isArray(saved) || saved.length !== zones.length || new Set(saved).size !== zones.length) return null;
  if (saved.some(zone => !zones.includes(zone))) return null;
  return [...saved];
}

// Move the dragged zone into the dropped-on slot; keep every other zone's order.
export function moveZoneBeforeOrAfter(zones, moving, target) {
  const result = [...zones];
  const from = result.indexOf(moving);
  const to = result.indexOf(target);
  if (from < 0 || to < 0 || from === to) return result;
  result.splice(from, 1);
  result.splice(to, 0, moving);
  return result;
}
