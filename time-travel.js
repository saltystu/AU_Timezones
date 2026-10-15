/**
 * A selected wall-clock date/time must be interpreted in the selected team's
 * IANA zone, not in the visitor's browser/system timezone.
 */
import { getOffsetMinutes } from './timezones.js';

const partsFormatters = new Map();

export function getZonedFields(zone, instant) {
  let formatter = partsFormatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, calendar: 'gregory', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
    partsFormatters.set(zone, formatter);
  }
  const pieces = Object.fromEntries(formatter.formatToParts(instant).map(p => [p.type, p.value]));
  return { date: `${pieces.year}-${pieces.month}-${pieces.day}`, time: `${pieces.hour}:${pieces.minute}` };
}

export function resolveLocalTime(zone, date, time) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) throw new Error('Enter a valid date and time.');
  const year = +d[1], month = +d[2], day = +d[3];
  const hour = +t[1], minute = +t[2];
  if (year < 1970 || year > 2100 || hour > 23 || minute > 59) throw new Error('Enter a valid date and time (1970–2100).');
  const localAsUTC = Date.UTC(year, month - 1, day, hour, minute);
  const checked = new Date(localAsUTC);
  if (checked.getUTCFullYear() !== year || checked.getUTCMonth() + 1 !== month || checked.getUTCDate() !== day)
    throw new Error('Enter a valid calendar date.');

  // Probe around possible transitions; both standard and daylight offsets are
  // considered, so we detect skipped and duplicated local times accurately.
  const offsets = new Set([-24, -12, 0, 12, 24].map(hours =>
    getOffsetMinutes(zone, new Date(localAsUTC + hours * 3600000))));
  const possible = [...offsets]
    .map(offset => new Date(localAsUTC - offset * 60000))
    .filter(candidate => {
      const local = getZonedFields(zone, candidate);
      return local.date === date && local.time === time;
    })
    .sort((a, b) => a - b);

  if (!possible.length) throw new Error('This local time does not exist because clocks jump forward for daylight saving. Choose another time.');
  return { instant: possible[0], ambiguous: possible.length > 1 };
}
