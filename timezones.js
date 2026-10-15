/**
 * Calendar-aware timezone utilities. The IANA zone database in the browser
 * handles Australian daylight saving transitions automatically.
 */
const offsetFormatters = new Map();
const timeFormatters = new Map();
const dateFormatters = new Map();

export function getOffsetMinutes(timeZone, at = new Date()) {
  let formatter = offsetFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' });
    offsetFormatters.set(timeZone, formatter);
  }
  const part = formatter.formatToParts(at).find(piece => piece.type === 'timeZoneName');
  const value = part?.value ?? '';
  if (value === 'GMT') return 0;
  const match = /^GMT([+-])(\d{1,2}):?(\d{2})?$/.exec(value);
  if (!match) throw new Error(`Unrecognised timezone offset for ${timeZone}: ${value}`);
  return (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] || 0));
}

export function getAbbreviation(timeZone, offsetMinutes) {
  switch (timeZone) {
    case 'Australia/Perth': return 'AWST';
    case 'Australia/Darwin': return 'ACST';
    case 'Australia/Adelaide': return offsetMinutes === 630 ? 'ACDT' : 'ACST';
    case 'Australia/Brisbane': return 'AEST';
    case 'Asia/Tokyo': return 'JST';
    case 'Australia/Sydney':
    case 'Australia/Canberra': return offsetMinutes === 660 ? 'AEDT' : 'AEST';
    default: throw new Error(`Unsupported zone: ${timeZone}`);
  }
}

export function getUTCLabel(offsetMinutes) {
  const sign = offsetMinutes < 0 ? '-' : '+';
  const positive = Math.abs(offsetMinutes);
  return `UTC${sign}${String(Math.floor(positive / 60)).padStart(2, '0')}:${String(positive % 60).padStart(2, '0')}`;
}

export function getDifference(offsetMinutes, referenceOffsetMinutes, referenceLabel = 'Perth', isReference = false) {
  const delta = offsetMinutes - referenceOffsetMinutes;
  if (isReference) return { value: 'BASE', label: 'Reference' };
  if (delta === 0) return { value: 'SAME', label: `Same time as ${referenceLabel}` };
  const absDelta = Math.abs(delta);
  const hours = Math.floor(absDelta / 60);
  const minutes = absDelta % 60;
  const amount = `${delta > 0 ? '+' : '−'}${hours ? `${hours}h` : ''}${hours && minutes ? ' ' : ''}${minutes ? `${minutes}m` : ''}`;
  return { value: amount, label: `${delta > 0 ? 'Ahead of' : 'Behind'} ${referenceLabel}` };
}

export function getTimeParts(timeZone, at = new Date()) {
  let formatter = timeFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-AU', {
      timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    timeFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(at);
  const value = kind => parts.find(part => part.type === kind)?.value ?? '00';
  return { clock: `${value('hour')}:${value('minute')}`, seconds: `:${value('second')}` };
}

export function getLocalDate(timeZone, at = new Date()) {
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-AU', {
      timeZone, weekday: 'long', day: 'numeric', month: 'long'
    });
    dateFormatters.set(timeZone, formatter);
  }
  return formatter.format(at);
}
