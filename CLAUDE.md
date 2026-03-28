# Agugagatada Travel — Claude Code Guide

## What this project is

A static travel guide — hand-curated day trips from Munich for a family with a young baby. No backend, no API keys, no build step. Everything runs in the browser.

**Target user:** Family based in Munich with a young baby. Interests: history, castles, science museums, non-touristy places.

---

## Stack

| Layer | Choice |
|---|---|
| Pages | Vanilla HTML files in `docs/` |
| Styling | CSS custom properties in `docs/style.css` |
| Maps | [Leaflet.js](https://leafletjs.com/) loaded from CDN, OpenStreetMap/CartoDB tiles |
| Data | JSON files in `data/` — one per destination |

No build step. Open any file in `docs/` directly in a browser.

---

## Project structure

```
agugagatada_travel/
├── data/                    # One JSON file per destination
│   ├── bamberg.json
│   ├── berchtesgaden.json
│   └── ...
└── docs/                 # Static HTML pages
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

Design tokens are defined in `docs/style.css` as CSS custom properties:

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
  "id": "destination-daytrip",
  "title": "Destination — Long editorial title",
  "tagline": "One-sentence hook for the destination",
  "destination": {
    "name": "Destination Name",
    "region": "Bavaria, Germany",
    "lat": 49.01,
    "lon": 12.10
  },
  "origin": {
    "name": "Munich",
    "lat": 48.1351,
    "lon": 11.582
  },
  "drive_time_from_origin_minutes": 95,
  "duration_days": 1,
  "generated_at": "YYYY-MM-DD",
  "stats": {
    "total_stops": 5,
    "baby_friendly_score": 4,
    "history_depth_score": 5,
    "touristic_score": 2,
    "drive_total_km": 150
  },
  "intro": "Editorial overview paragraph.",
  "route_polyline": [[48.13, 11.58], [49.01, 12.10]],
  "days": [
    {
      "day_number": 1,
      "title": "Day title",
      "theme": "Short theme phrase",
      "summary": "One-sentence summary",
      "stops": [
        {
          "id": "stop-slug",
          "sequence": 1,
          "name": "Stop Name",
          "subtitle": "One-line description",
          "lat": 49.01,
          "lon": 12.10,
          "category": "church|museum|monument|town_center|nature|hike",
          "visit_duration_minutes": 60,
          "drive_time_from_prev_minutes": 10,
          "baby_friendly_score": 5,
          "highlight": "Blockquote sentence.",
          "about": "Editorial paragraph.",
          "hidden_gems": "Paragraph.",
          "baby_logistics": "Stroller/carrier notes.",
          "tier": 1,
          "skip_if_rushed": false
        }
      ]
    }
  ],
  "hotels": [
    {
      "id": "hotel-slug",
      "name": "Hotel Name",
      "area": "Neighborhood or description",
      "type": "Boutique Hotel|Gasthof|Historic Hotel",
      "local_character_score": 4,
      "price_range": "€80–120/night",
      "has_crib": true,
      "has_parking": false,
      "description": "Editorial paragraph.",
      "why_recommended": "One-line recommendation reason."
    }
  ],
  "hikes": [
    {
      "id": "hike-slug",
      "name": "Hike Name",
      "area": "Area description",
      "distance_km": 6.0,
      "elevation_gain_m": 80,
      "estimated_time_minutes": 90,
      "difficulty": "easy|moderate|hard",
      "pushchair_friendly": true,
      "baby_carrier_feasible": true,
      "surface": "paved|gravel|trail",
      "description": "Editorial paragraph.",
      "practical_tip": "Trailhead and logistics."
    }
  ],
  "practical_notes": [
    "Plain string tip — no heading/body nesting."
  ],
  "detour_stops": [
    {
      "id": "detour-slug",
      "name": "Detour Name",
      "tagline": "One-sentence hook",
      "position": "en_route|nearby",
      "lat": 48.77,
      "lon": 11.43,
      "detour_from_route_minutes": 15,
      "visit_duration_minutes": 60,
      "best_time": "any|morning|afternoon",
      "category": "history|nature|museum",
      "baby_friendly_score": 4,
      "highlight": "Blockquote sentence.",
      "description": "Editorial paragraph.",
      "practical": "Parking, prices, access notes."
    }
  ]
}
```

**Key differences from the old flat schema:**
- `destination` is now an object `{name, region, lat, lon}`, not a string
- `stops` are nested under `days[].stops`, not at the top level
- Stop fields: `baby_logistics` (not `baby_notes`), `hidden_gems`, `tier`, `skip_if_rushed`, `visit_duration_minutes`, `drive_time_from_prev_minutes`, `baby_friendly_score`, `category`, `sequence`
- Hotel fields: `id`, `area`, `type`, `local_character_score`, `has_crib`, `has_parking`, `why_recommended` (not `vibe`/`why_families`/`booking_search`)
- Hike fields: `id`, `area`, `estimated_time_minutes`, `surface`, `practical_tip` (not `duration`/`trailhead`)
- `practical_notes` is a flat array of strings (not `[{heading, body}]`)
- `detour_stops` (not `detours`) has richer fields: `position`, `detour_from_route_minutes`, `best_time`, `baby_friendly_score`, `highlight`, `practical`

---

## Adding a new destination

1. Create `data/{destination}.json` following the schema above.
2. Copy an existing `docs/*.html` page and update all content.
3. Add a card to `docs/index.html`: one `<article class="dest-card">` and one `initMap(...)` call.
4. Update the subtitle count in `docs/index.html` (`"N drives worth the detour"`).

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
- Destination page styles live in `style.css`. Do not add inline `<style>` blocks to destination pages.
- `index.html`, `shell.html`, and `route-composer.html` have their own separate inline styles — leave those alone.
- Each destination page is self-contained: copy–paste the template, fill in the data.
