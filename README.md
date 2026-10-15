# Australian Team Time Zones

A responsive, static Vercel dashboard with six live Australian clocks, adjustable comparisons, drag-and-drop ordering, and a UTC clock.

- **WA:** Perth — AWST (UTC+08:00), initial comparison reference.
- **NT:** Darwin — ACST (UTC+09:30) year-round.
- **SA / Steve:** Adelaide — ACST or ACDT depending on daylight saving.
- **ACT:** Canberra — AEST or AEDT depending on daylight saving.
- **QLD / Daniel:** Brisbane — AEST (UTC+10:00) year-round.
- **NSW / VIC:** Sydney / Melbourne — AEST or AEDT depending on daylight saving.

## Clock ordering

Cards are **sorted by current UTC offset (ascending) by default**, including daylight saving. During Australian daylight saving (October–April), the three-column/two-row desktop layout is:

| | | |
|---|---|---|
| WA | NT | QLD |
| SA | ACT | NSW / VIC |

During the standard-time months, UTC sorting changes the order as necessary. Where two regions share the same offset, the tie-breaker is stable and deterministic. All clock cards use a normal CSS grid; on tablet/mobile they reflow into two columns or a single column.

**Drag the six-dot grip** in a card to manually reposition it (works with mouse and touch/pointer input). With keyboard focus on the grip, arrow keys move the card one position or row. Custom ordering persists across page reloads in the same browser via `localStorage`. Press **Sort by UTC** to remove the custom order and return to DST-aware automatic sorting.

## Clock comparison

The **BASED ON** dropdown sets any of the six clocks as the reference. Their differences update immediately and the choice is remembered in the same browser. The selected reference card shows `BASE`, and another card with the same offset shows `SAME`. The small **Current UTC Time** clock below the cards also updates every second.

Local clock times and UTC offsets come from `Intl.DateTimeFormat` using the browser's IANA timezone data. No hard-coded DST dates, servers, API keys, frameworks, or dependencies required.

## Deploy to Vercel

1. Import the folder into Vercel from GitHub, or run `npx vercel --prod` from the project folder.
2. Choose **Other** as framework with no build command. Output directory is project root (`.`).
3. Deploy. The entry point is `index.html`.

## Local development / verification

Requires Node.js 20+.

```bash
npm run dev
npm test
```

Open http://localhost:3000.

For text and labels edit `index.html`, for appearance edit `styles.css`, for behavior edit `clock.js`, and for the UTC sorting rules edit `ordering.js`.
