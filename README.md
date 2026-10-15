# Team Time Zones — Australia & Tokyo

A responsive, static Vercel dashboard with six live clocks, selectable comparisons, manual drag-and-drop order, automatic UTC sorting, a UTC clock, DST-aware date/time previews for team scheduling, and System / Light / Dark themes.

| Clock | IANA timezone | Abbreviation |
|---|---|---|
| WA — Perth | Australia/Perth | AWST (UTC+8) |
| Tokyo — Carla | Asia/Tokyo | JST (UTC+9, no daylight saving) |
| NT — Darwin | Australia/Darwin | ACST (UTC+9:30, no daylight saving) |
| SA — Steve | Australia/Adelaide | ACST / ACDT (daylight saving) |
| QLD — Daniel | Australia/Brisbane | AEST (UTC+10, no daylight saving) |
| NSW / VIC / ACT | Australia/Sydney | AEST / AEDT (daylight saving) |

The six cards appear in ascending *current* UTC offset by default, wrapping across three columns on desktop, two columns on tablets, and one on phones. During daylight saving the order is **WA, Tokyo, NT, QLD, SA, NSW/VIC/ACT**; in Australian winter it is **WA, Tokyo, NT, SA, QLD, NSW/VIC/ACT**.

Drag the grip in any clock, or focus it and use arrow keys, to reorder cards. Custom ordering persists within the same browser. **Sort by UTC** clears the custom order. The **BASED ON** dropdown selects any clock as the comparison reference; every card shows its difference from that clock. The small UTC clock updates every second while live. Timezone and DST information comes from your browser's IANA timezone database via `Intl.DateTimeFormat`.

## Preview a meeting time (v6)

The unobtrusive **Check another time** controls sit immediately beneath the UTC clock. **Date** and **Time** default to the current date and time in the region selected by **BASED ON**. Editing either field switches all six clocks and UTC to the same selected instant and pauses live ticking. The header changes to **PREVIEW MODE** so a preview can't be mistaken for the live time.

For example, setting **BASED ON: WA** and **2026-10-15 09:00** shows Tokyo **10:00**, NT **10:30**, QLD **11:00**, SA **11:30**, NSW/VIC/ACT **12:00**, and UTC **01:00**. The fields are interpreted in the selected region, *not* in the viewer's computer timezone. Changing the reference region while previewing preserves the absolute moment, while re-expressing the date/time inputs in that region. A **Reset to now** button next to the fields restores all live clocks.

Dates across daylight-saving changes work correctly; nonexistent spring-forward local times are rejected and an ambiguous fall-back time uses its first occurrence with a notice. The preview itself is not persisted, so the dashboard starts live on reload. Automatic UTC sorting uses the offsets at the selected date during a preview; saved manual order remains unchanged.

The **Appearance** selector offers **System** (default), **Light**, and **Dark**. System follows OS light/dark changes live; selecting Light or Dark persists in `localStorage`, like the comparison reference and clock order.

Existing settings from v3/v4 are migrated when possible: a previous ACT reference becomes NSW/VIC/ACT, and an ACT card position in a saved manual order is assigned to Tokyo.

## Deploy the update to an existing Vercel project

If you're already using Vercel CLI from a linked project folder, replace the source files with this release and run:

```sh
npx vercel --prod
```

For a new project, run `npx vercel --prod` from the extracted folder, selecting **Other** framework with no build command. The entry point is `index.html` and the static output directory is `.`.

## Local verification

Node.js 20+:

```sh
npm test
npm run dev
```

Open http://localhost:3000. No dependencies, API keys or runtime build process required.
