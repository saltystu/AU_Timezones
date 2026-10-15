import { getOffsetMinutes, getAbbreviation, getUTCLabel, getDifference, getTimeParts, getLocalDate } from './timezones.js';
import { sortByCurrentUTC, validateSavedOrder, moveZoneBeforeOrAfter } from './ordering.js';

const grid = document.querySelector('.clock-grid');
const cards = Array.from(grid.querySelectorAll('.clock-card[data-zone]'));
const cardByZone = new Map(cards.map(card => [card.dataset.zone, card]));
const allZones = cards.map(card => card.dataset.zone);
const zonePicker = document.querySelector('#reference-zone');
const referenceLabel = document.querySelector('[data-reference-label]');
const resetOrderButton = document.querySelector('#reset-order');
const orderStatus = document.querySelector('#order-status');
const reorderAnnouncement = document.querySelector('#reorder-announcement');
const utcClock = document.querySelector('#utc-clock');
const utcDate = document.querySelector('#utc-date');
const zoneLabels = {
  'Australia/Perth': 'WA',
  'Australia/Darwin': 'NT',
  'Australia/Adelaide': 'SA',
  'Asia/Tokyo': 'JAPAN',
  'Australia/Brisbane': 'QLD',
  'Australia/Sydney': 'NSW / VIC / ACT'
};
const cityLabels = {
  'Australia/Perth': 'Perth',
  'Australia/Darwin': 'Darwin',
  'Australia/Adelaide': 'Adelaide',
  'Asia/Tokyo': 'Tokyo',
  'Australia/Brisbane': 'Brisbane',
  'Australia/Sydney': 'Sydney / Melbourne / Canberra'
};

let customOrder = null;
let isDragging = false;
let displayedOrder = allZones;
try {
  const stored = localStorage.getItem('au-clock-reference');
  if (stored === 'Australia/Canberra') zonePicker.value = 'Australia/Sydney';
  else if (Object.hasOwn(zoneLabels, stored)) zonePicker.value = stored;
  const savedOrder = localStorage.getItem('au-clock-card-order');
  if (savedOrder) {
    const parsed = JSON.parse(savedOrder);
    // Migrate v3/v4's removed ACT card to Tokyo, retaining the other positions.
    const migrated = Array.isArray(parsed) ? parsed.map(zone => zone === 'Australia/Canberra' ? 'Asia/Tokyo' : zone) : parsed;
    customOrder = validateSavedOrder(migrated, allZones);
    if (customOrder && JSON.stringify(parsed) !== JSON.stringify(customOrder))
      localStorage.setItem('au-clock-card-order', JSON.stringify(customOrder));
  }
} catch { /* Local storage is optional. */ }

function applyOrder(order) {
  if (order.length !== cards.length || order.some(zone => !cardByZone.has(zone))) return;
  if (displayedOrder.join('|') !== order.join('|')) {
    for (const zone of order) grid.appendChild(cardByZone.get(zone));
  }
  displayedOrder = [...order];
  const manual = customOrder !== null;
  orderStatus.textContent = manual ? 'CUSTOM ORDER' : 'UTC OFFSET ORDER';
  resetOrderButton.disabled = !manual;
  resetOrderButton.title = manual ? 'Restore ascending UTC offset order' : 'Already sorted by current UTC offset';
}

function saveManualOrder(order) {
  customOrder = [...order];
  try { localStorage.setItem('au-clock-card-order', JSON.stringify(customOrder)); } catch { /* Optional. */ }
  applyOrder(customOrder);
  reorderAnnouncement.textContent = `Custom order: ${customOrder.map(zone => zoneLabels[zone]).join(', ')}.`;
}

function render() {
  // Render every region from one instant; UTC offsets update correctly as DST changes.
  const now = new Date();
  if (!customOrder && !isDragging) applyOrder(sortByCurrentUTC(allZones, now));
  const selectedZone = zonePicker.value;
  const selectedOffset = getOffsetMinutes(selectedZone, now);
  const selectedAbbr = getAbbreviation(selectedZone, selectedOffset);
  referenceLabel.textContent = `${zoneLabels[selectedZone]} (${selectedAbbr})`;

  for (const card of cards) {
    const timeZone = card.dataset.zone;
    const offset = getOffsetMinutes(timeZone, now);
    const time = getTimeParts(timeZone, now);
    const isReference = timeZone === selectedZone;
    const difference = getDifference(offset, selectedOffset, cityLabels[selectedZone], isReference);

    card.classList.toggle('is-reference', isReference);
    card.querySelector('[data-clock-time]').textContent = time.clock;
    card.querySelector('[data-clock-seconds]').textContent = time.seconds;
    card.querySelector('[data-local-date]').textContent = getLocalDate(timeZone, now);
    card.querySelector('[data-zone-abbr]').textContent = getAbbreviation(timeZone, offset);
    card.querySelector('[data-utc-offset]').textContent = getUTCLabel(offset);
    card.querySelector('[data-difference]').textContent = difference.value;
    card.querySelector('[data-difference-label]').textContent = difference.label;
    card.querySelector('time').dateTime = now.toISOString();
  }

  // Native UTC is fixed year-round and never observes daylight saving.
  const utcParts = getTimeParts('UTC', now);
  utcClock.textContent = utcParts.clock + utcParts.seconds;
  utcClock.dateTime = now.toISOString();
  utcDate.textContent = getLocalDate('UTC', now);

  for (const option of zonePicker.options) {
    const abbreviation = getAbbreviation(option.value, getOffsetMinutes(option.value, now));
    option.textContent = `${zoneLabels[option.value]} (${abbreviation})`;
  }
}

zonePicker.addEventListener('change', () => {
  try { localStorage.setItem('au-clock-reference', zonePicker.value); } catch { /* Optional. */ }
  render();
});

resetOrderButton.addEventListener('click', () => {
  customOrder = null;
  try { localStorage.removeItem('au-clock-card-order'); } catch { /* Optional. */ }
  applyOrder(sortByCurrentUTC(allZones));
  reorderAnnouncement.textContent = 'Cards restored to UTC offset order.';
});

function installReorderHandle(card) {
  const handle = card.querySelector('.drag-handle');
  handle.setAttribute('aria-label', `Reorder ${zoneLabels[card.dataset.zone]} clock. Drag to move or use arrow keys`);
  let drag = null;

  function moveGhost(x, y) {
    if (!drag?.ghost) return;
    drag.ghost.style.transform = `translate3d(${x - drag.startX}px, ${y - drag.startY}px, 0)`;
  }

  function stopDrag(event, cancelled = false) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    window.removeEventListener('pointermove', pointerMove);
    window.removeEventListener('pointerup', pointerUp);
    window.removeEventListener('pointercancel', pointerCancel);
    if (drag.ghost) drag.ghost.remove();
    drag.card.classList.remove('is-dragging');
    document.body.classList.remove('reordering');
    isDragging = false;
    if (drag.started) {
      if (cancelled) applyOrder(drag.initialOrder);
      else if (drag.initialOrder.join('|') !== displayedOrder.join('|')) saveManualOrder(displayedOrder);
    }
    drag = null;
  }

  function startGhost(event) {
    const rect = card.getBoundingClientRect();
    drag.started = true;
    isDragging = true;
    drag.ghost = card.cloneNode(true);
    drag.ghost.classList.add('drag-ghost');
    drag.ghost.classList.remove('is-dragging');
    drag.ghost.style.width = `${rect.width}px`;
    drag.ghost.style.height = `${rect.height}px`;
    drag.ghost.style.left = `${rect.left}px`;
    drag.ghost.style.top = `${rect.top}px`;
    card.classList.add('is-dragging');
    document.body.classList.add('reordering');
    document.body.appendChild(drag.ghost);
    moveGhost(event.clientX, event.clientY);
  }

  function pointerMove(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.started && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 7) startGhost(event);
    if (!drag.started) return;
    if (event.cancelable) event.preventDefault();
    moveGhost(event.clientX, event.clientY);
    const overCard = document.elementFromPoint(event.clientX, event.clientY)?.closest('.clock-card');
    if (!overCard || overCard === card || !grid.contains(overCard)) return;
    const nextOrder = moveZoneBeforeOrAfter(displayedOrder, card.dataset.zone, overCard.dataset.zone);
    applyOrder(nextOrder);
  }

  function pointerUp(event) { stopDrag(event); }
  function pointerCancel(event) { stopDrag(event, true); }

  handle.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (event.cancelable) event.preventDefault();
    drag = {
      pointerId: event.pointerId,
      card,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
      ghost: null,
      initialOrder: [...displayedOrder]
    };
    window.addEventListener('pointermove', pointerMove, { passive: false });
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointercancel', pointerCancel);
  });

  // Keyboard reorder: arrow keys shift a card one slot at a time.
  handle.addEventListener('keydown', event => {
    const stride = window.matchMedia('(max-width: 650px)').matches ? 1 :
      window.matchMedia('(max-width: 1060px)').matches ? 2 : 3;
    const delta = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -stride,
      ArrowDown: stride
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    const at = displayedOrder.indexOf(card.dataset.zone);
    const dest = Math.max(0, Math.min(displayedOrder.length - 1, at + delta));
    if (dest === at) return;
    const nextOrder = [...displayedOrder];
    nextOrder.splice(at, 1);
    nextOrder.splice(dest, 0, card.dataset.zone);
    saveManualOrder(nextOrder);
    handle.focus({ preventScroll: true });
  });
}

for (const card of cards) installReorderHandle(card);
if (customOrder) applyOrder(customOrder);

function tick() {
  render();
  setTimeout(tick, Math.max(50, 1000 - Date.now() % 1000 + 12));
}
tick();
