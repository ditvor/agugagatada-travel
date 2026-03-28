# Agugagatada Travel — Claude Code Guide

## What this project is

A static travel guide — hand-curated day trips from Munich for a family with a young baby. No backend, no API keys, no build step. Everything runs in the browser.

**Target user:** Family based in Munich with a young baby. Interests: history, castles, science museums, non-touristy places.

---

## Stack

| Layer | Choice |
|---|---|
| Pages | Vanilla HTML files in `preview/` |
| Styling | CSS custom properties in `preview/style.css` |
| Maps | [Leaflet.js](https://leafletjs.com/) loaded from CDN, OpenStreetMap/CartoDB tiles |
| Data | JSON files in `data/` — one per destination |

No build step. Open any file in `preview/` directly in a browser.

---

## Project structure

```
agugagatada_travel/
├── data/                    # One JSON file per destination
│   ├── bamberg.json
│   ├── berchtesgaden.json
│   └── ...
└── preview/                 # Static HTML pages
    ├── index.html           # Destination cards landing page
    ├── style.css            # Shared design tokens + components
    ├── bamberg.html
    ├── berchtesgaden.html
    └── ...
```

---

## Page structure

Every destination page follows the same section order:

1. `<nav>` — site name
2. **Hero** — destination title, tagline, drive time + duration tags
3. **Intro** — 2–3 paragraph editorial overview
4. **Route section** — two-column layout: sticky Leaflet map (left) + scrollable stops (right)
5. **Detours section** — 1–2 nearby places worth a side trip
6. **Hikes section** — 3 hike cards with difficulty, distance, elevation
7. **Hotels section** — 3 hotel cards with price range and family notes
8. **Notes section** — practical "before you go" tips
9. `<footer>`

---

## CSS conventions

Design tokens are defined in `preview/style.css` as CSS custom properties:

| Token | Usage |
|---|---|
| `--color-bg` | Page background |
| `--color-surface` | Card backgrounds |
| `--color-text` | Primary text |
| `--color-text-secondary` | Captions, metadata |
| `--color-accent` | `#1B3A5C` — links, markers, polylines |
| `--color-border` | Card and section borders |
| `--space-xs/sm/md/lg/xl/2xl` | Spacing scale |
| `--text-sm/md/lg/xl/2xl` | Type scale |
| `--radius` | Border radius |

BEM-like class naming: `.stop`, `.stop__header`, `.stop__name`, `.hike-card`, `.hotel-card`, `.detour-card`, `.tag`, `.tag--accent`, `.expand-btn`, `.drive-connector`, `.stop-number`.

---

## Data format

Each `data/*.json` file has this shape:

```json
{
  "destination": "Name",
  "drive_time": "1h 35 min",
  "duration": "1 day",
  "coordinates": { "lat": 49.01, "lon": 12.10 },
  "route_polyline": [[48.13, 11.58], ...],
  "stops": [
    {
      "id": 1,
      "name": "Stop Name",
      "subtitle": "One-line description",
      "lat": 49.01, "lon": 12.10,
      "tags": ["tag"],
      "highlight": "Blockquote sentence.",
      "about": "Paragraph.",
      "hidden_gems": "Paragraph.",
      "baby_notes": "Paragraph."
    }
  ],
  "detours": [ { "name": "", "distance_from_destination": "", "why": "", "best_for": "" } ],
  "hikes": [ { "name": "", "difficulty": "easy|moderate|hard", "distance_km": 0, "elevation_gain_m": 0, "duration": "", "description": "", "baby_carrier_feasible": true, "pushchair_friendly": false, "trailhead": "" } ],
  "hotels": [ { "name": "", "price_range": "", "vibe": "", "why_families": "", "location_note": "", "booking_search": "" } ],
  "practical_notes": [ { "heading": "", "body": "" } ]
}
```

---

## Adding a new destination

1. Create `data/{destination}.json` following the schema above.
2. Copy an existing `preview/*.html` page and update all content.
3. Add a card to `preview/index.html`: one `<article class="dest-card">` and one `initMap(...)` call.
4. Update the subtitle count in `preview/index.html` (`"N drives worth the detour"`).

---

## Map implementation

Each destination page uses Leaflet with:
- A dashed polyline from Munich to the destination (`color: #1B3A5C, dashArray: '4 6'`)
- CircleMarkers for each stop (radius 7, filled `#1B3A5C`)
- Permanent tooltip labels (`stop-label` CSS class) showing the stop number
- `IntersectionObserver` to pan the map to the active stop as the user scrolls
- A separate route-overview IIFE map in the hero area with detour hover effects

---

## Coding conventions

- No JavaScript frameworks. No npm. No build step.
- All page-specific styles go in an inline `<style>` block at the top of each HTML file. Shared styles only go in `style.css`.
- Keep the inline `<style>` block identical across all destination pages — don't diverge styles per-page.
- Each destination page is self-contained: copy–paste the template, fill in the data.
- The trailing `<style>` block at the bottom of each page (after `</script>`) is for Leaflet tooltip overrides only — do not add other styles there.
