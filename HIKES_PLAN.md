# Hike Guides — Implementation Plan

Adds a dedicated hike guide page to every destination. Pattern established with Regensburg.
All hike data lives in the destination JSON files. HTML pages are generated from that data.

---

## Architecture decisions

| Question | Decision |
|---|---|
| Altmühltal hikes on multiple pages? | Yes — repeat with destination-specific framing, no cross-links |
| Hike data location | Extended `hikes[]` array in each `data/*.json` |
| Filter tabs | Visual only (no JS filtering) |
| Index page changes | None |
| GPX files | `docs/gpx/{destination}-hike-{n}.gpx` |

---

## Extended hike schema

Add these fields to every entry in the `hikes[]` array. Update `data/schema.json` accordingly.

```json
{
  "id": "donaudurchbruch-gorge",
  "name": "Donaudurchbruch Gorge Trail",
  "area": "Kelheim · 25 min from Regensburg",
  "type": "near_destination",
  "distance_km": 4.0,
  "elevation_gain_m": 60,
  "estimated_time_minutes": 110,
  "difficulty": "easy",
  "pushchair_friendly": false,
  "baby_carrier_feasible": true,
  "surface": "forest path and stone steps",
  "season": "April–October",
  "trailhead_lat": 48.9169,
  "trailhead_lon": 11.8673,
  "gpx_file": "gpx/regensburg-hike-1.gpx",
  "highlight": "The gorge walls rise 70 meters above the water — vertical limestone, the Danube threading through",
  "description": "Full editorial paragraph...",
  "practical_tip": "Take the boat in from Kelheim Schiffslände...",
  "hutte": {
    "name": "Weltenburg Abbey Klosterschänke",
    "open_months": "April–October"
  }
}
```

**New fields vs existing schema:**

| Field | Type | Notes |
|---|---|---|
| `type` | enum | `en_route` / `near_destination` / `in_destination` |
| `season` | string | e.g. `"April–October"` or `"year-round"` |
| `trailhead_lat` | number | Start of hike |
| `trailhead_lon` | number | Start of hike |
| `gpx_file` | string | Relative path from `docs/`, e.g. `gpx/regensburg-hike-1.gpx` |
| `highlight` | string | One-sentence blockquote (same pattern as stops) |
| `hutte` | object \| null | `{ name, open_months }` — null if no Hütte |

Existing fields `pushchair_friendly`, `baby_carrier_feasible`, `surface`, `practical_tip` stay as-is.
Existing field `description` gets expanded to full editorial paragraph (currently short).

---

## Execution order

| # | Destination | Drive | Hike focus | Hikes |
|---|---|---|---|---|
| 0 | Schema + Regensburg backfill | — | Foundation | — |
| 1 | **Berchtesgaden** | 1h 45m | Alpine, Hütte-heavy | 6–7 |
| 2 | **Eichstätt** | 1h 15m | Nature park, fossils | 5 |
| 3 | **Bodensee** | 1h 50m | Lake + alpine | 5 |
| 4 | **Bamberg** | 2h 10m | Fränkische Schweiz | 5 |
| 5 | **Passau** | 1h 50m | Gorges, forest | 5 |
| 6 | **Nuremberg** | 1h 40m | Urban + Altmühltal | 4 |
| 7 | **Rothenburg** | 2h 30m | Valley + en-route hill | 4 |

---

## Steps per destination (repeat for each)

```
Step 1 — Research hike data → update JSON
Step 2 — Download GPX files → docs/gpx/
Step 3 — Generate hike HTML page
Step 4 — Add teaser to main destination page
Step 5 — Validate, commit, push, PR
```

---

## Phase 0 — Schema extension + Regensburg backfill

**One-time setup. Do this before starting any destination.**

### Step 0.1 — Extend schema.json

> **Claude prompt:**
> ```
> Read data/schema.json. Add the following new fields to the hikes array item
> definition:
>   - type: enum ["en_route", "near_destination", "in_destination"], required
>   - season: string, required (e.g. "year-round" or "April–October")
>   - trailhead_lat: number, required
>   - trailhead_lon: number, required
>   - gpx_file: string, optional
>   - highlight: string, required
>   - hutte: object { name: string, open_months: string } or null, required
>
> Update data/schema.json with these additions. Keep all existing fields unchanged.
> ```

### Step 0.2 — Backfill regensburg.json

> **Claude prompt:**
> ```
> Read docs/regensburg-hikes.html and data/regensburg.json.
>
> The hikes array in regensburg.json currently has 3 short entries (Danube
> Riverside Path, Weltenburg Gorge, Walhalla Approach). The HTML hike guide
> has 5 richer hike entries.
>
> Do two things:
> 1. Extend the 3 existing JSON entries to include the new schema fields
>    (type, season, trailhead_lat, trailhead_lon, gpx_file, highlight, hutte).
>    Use the content already in regensburg-hikes.html as the source.
> 2. Add the remaining 2 hike entries (Essing + Randeck, Befreiungshalle) to
>    the hikes array, extracting the data from regensburg-hikes.html.
>
> GPX filenames follow the pattern in docs/gpx/ — match them to the right hike.
> Write the updated hikes array back to data/regensburg.json.
> ```

### Step 0.3 — Rename GPX files to consistent pattern

> **Claude prompt:**
> ```
> The current GPX files in docs/gpx/ have descriptive names from the OSM
> sourcing process (e.g. hike1_donaudurchbruch_south_bank.gpx).
>
> Rename them to a consistent pattern: {destination}-hike-{n}.gpx
> e.g. regensburg-hike-1.gpx through regensburg-hike-5.gpx.
>
> Update the gpx_file field in data/regensburg.json and the JS references
> in docs/regensburg-hikes.html to match the new filenames.
> ```

---

## Phase 1 — Berchtesgaden

**Most content-rich destination. Alpine, 6–7 hikes, multiple Hütten.**

### Hike candidates

| # | Name | Type | Notes |
|---|---|---|---|
| 1 | Hintersee lake loop | near_destination | Flat, stroller-viable, stunning alpine lake, 2h |
| 2 | Almbachklamm gorge walk | near_destination | Narrow gorge, wooden walkways, carrier essential, 2.5h |
| 3 | Malerwinkel trail | in_destination | Flat Königssee shore, famous viewpoint, pushchair, 1.5h |
| 4 | Jenner plateau walk | near_destination | Cable car up, plateau walk, Hütte at top, 1h walking |
| 5 | Obersee via Königssee | near_destination | Boat + walk to second lake + waterfall, carrier, 3h |
| 6 | Rossfeld Panoramastrasse | near_destination | High-altitude road walk, views into Austria, carrier, 2h |
| 7 | Chiemsee — Herreninsel | en_route | Boat to island, flat garden walk, stroller, 1.5h |

### Step 1.1 — Research hike data + update JSON

> **Claude prompt:**
> ```
> I'm building a hike guide for Berchtesgaden (data/berchtesgaden.json).
>
> Research the following 7 hikes and produce a complete hikes[] array entry
> for each, following the schema in data/schema.json exactly:
>
> 1. Hintersee lake loop (near Ramsau bei Berchtesgaden)
> 2. Almbachklamm gorge walk (Marktschellenberg)
> 3. Malerwinkel trail (Königssee shore, south end)
> 4. Jenner plateau walk (cable car from Schönau am Königssee)
> 5. Obersee hike via Königssee boat (St. Bartholomä to Obersee)
> 6. Rossfeld Panoramastrasse walk (above Berchtesgaden town)
> 7. Chiemsee — Herreninsel walk (en route from Munich, A8)
>
> For each: write a full editorial description paragraph (4–6 sentences,
> personal and specific), a practical_tip, a highlight blockquote sentence,
> accurate stats (distance_km, elevation_gain_m, estimated_time_minutes),
> correct trailhead coordinates, hutte info where applicable, and season.
> Mark type as en_route / near_destination / in_destination as appropriate.
>
> Append the completed hikes[] array to data/berchtesgaden.json (replace
> the existing shorter hikes array). Do not change any other fields.
> ```

### Step 1.2 — Download GPX files

> **Claude prompt:**
> ```
> Download GPX track files for the 7 hikes now listed in data/berchtesgaden.json.
>
> For each hike:
> 1. Use the trailhead_lat/lon and hike name to search the Waymarked Trails API:
>    https://hiking.waymarkedtrails.org/api/v1/list/search?query={name}&lang=de
> 2. If found, fetch the route detail and extract track geometry.
> 3. If not found, try the Overpass API with a bounding box around the trailhead.
> 4. Save the GPX file to docs/gpx/berchtesgaden-hike-{n}.gpx
> 5. Update the gpx_file field in data/berchtesgaden.json to match.
>
> Report: which hikes got real OSM tracks, which needed approximate geometry,
> and any gaps.
> ```

### Step 1.3 — Generate hike HTML page

> **Claude prompt:**
> ```
> Read data/berchtesgaden.json (hikes array) and docs/regensburg-hikes.html
> (as the structural template).
>
> Generate docs/berchtesgaden-hikes.html. Requirements:
> - Same page structure as regensburg-hikes.html
> - Hero: title "Berchtesgaden — On Foot", write a new tagline appropriate
>   to the alpine landscape (gorges, lake shores, high plateaus)
> - Intro paragraph: 3–4 sentences about the hiking landscape around
>   Berchtesgaden — distinct from the city intro in berchtesgaden.html
> - Overview Leaflet map: Munich → Berchtesgaden dashed route (use
>   route_polyline from berchtesgaden.json) + all trailhead pins numbered
> - One hike card per hike using hike-card-full layout, content from JSON
> - Each card has a mini Leaflet map loading its gpx_file
> - Filter tabs visual only: All / En route / Near Berchtesgaden / With Hütte
> - Nav breadcrumb links back to berchtesgaden.html
> - Before you go: practical notes relevant to Berchtesgaden hiking
>   (cable car times, boat schedules, seasonal closures)
>
> Do not add any inline <style> blocks. All styles are in style.css.
> ```

### Step 1.4 — Add teaser to main page

> **Claude prompt:**
> ```
> Read docs/berchtesgaden.html and data/berchtesgaden.json.
>
> Add a hike-list teaser block to the hikes-section, below the existing
> hike cards. Follow the exact pattern used in docs/regensburg.html
> (the .hike-list-teaser block with .hike-list items).
>
> List all hikes from the JSON by: name | type (as human label) | difficulty
> | estimated time formatted as hours | "Hütte" if hutte is not null |
> "Stroller OK" if pushchair_friendly is true.
>
> Section link text: "Explore on foot →" → href="berchtesgaden-hikes.html"
> ```

### Step 1.5 — Validate, commit, PR

> **Claude prompt:**
> ```
> Run node scripts/validate.js to check all data files pass schema validation.
> Fix any issues found.
>
> Then:
> - Create branch: feat-berchtesgaden-hikes
> - Stage: data/berchtesgaden.json, docs/berchtesgaden-hikes.html,
>   docs/berchtesgaden.html, docs/gpx/berchtesgaden-hike-*.gpx
> - Commit with message: "feat: add Berchtesgaden hike guide with GPX trail maps"
> - Push and create a PR against main with a summary of what was added.
> ```

---

## Phase 2 — Eichstätt

### Hike candidates

| # | Name | Type | Notes |
|---|---|---|---|
| 1 | Altmühl fossil cliff trail | in_destination | Limestone path, exposed fossils, carrier, 2h |
| 2 | Willibaldsburg hill circuit | in_destination | Castle above town, forest loop, Hütte, 1.5h |
| 3 | Beilngries canal walk | near_destination | Ludwig-Danube-Main canal, flat, stroller, 2h |
| 4 | Dollnstein gorge | near_destination | Narrow limestone side valley, carrier, 2h |
| 5 | Essing + Randeck Castle | en_route | Same as Regensburg guide, reframe for A9 from Munich |

### Steps 2.1–2.5

Use the same 5-step prompts as Phase 1, substituting `eichstaett` for `berchtesgaden`
and the hike candidates above for the hike list.

> **Note for Step 2.3 (generate page):** The intro should emphasise that Eichstätt sits
> inside the nature park — the hikes are not "near" the destination, they are
> the destination's landscape. Adjust the hero tagline accordingly.

---

## Phase 3 — Bodensee

### Hike candidates

| # | Name | Type | Notes |
|---|---|---|---|
| 1 | Rhine delta nature reserve | near_destination | Flat wetland, birds, stroller, Bregenz, 1.5h |
| 2 | Pfänder ridge walk | near_destination | Cable car from Bregenz, ridge trail, Hütte, 1.5h walking |
| 3 | Insel Reichenau loop | near_destination | Flat loop around the UNESCO island, stroller, 2h |
| 4 | Mainau island walk | near_destination | Flat garden island, stroller-only viable, 1h |
| 5 | Allgäu hills — Grünten | en_route | Carrier alpine hike, Hütte at summit, 3h, en route A96 |

### Steps 3.1–3.5

Use the same 5-step prompts, substituting `bodensee`.

> **Note for Step 3.3:** The page covers three countries (Germany, Austria, Switzerland).
> Hero tagline and intro should reflect this.

---

## Phase 4 — Bamberg

### Hike candidates

| # | Name | Type | Notes |
|---|---|---|---|
| 1 | Staffelberg summit loop | near_destination | Flat-topped hill 45 min from Bamberg, 533m, carrier, 2h |
| 2 | Fränkische Schweiz — Tüchersfeld | en_route | Sandstone towers, castle ruins, carrier, 2h, off A70 |
| 3 | Fränkische Schweiz — Streitberg | en_route | Binghöhle cave + valley walk, carrier, 2h |
| 4 | Steigerwald beech forest | near_destination | Gentle hills, beech, Hütte at Ebrach monastery, 2h |
| 5 | Regnitz valley south of Bamberg | in_destination | Flat riverside, stroller-viable, 1.5h |

### Steps 4.1–4.5

Use the same 5-step prompts, substituting `bamberg`.

> **Note for Step 4.3:** Fränkische Schweiz is the headline. The intro should
> contrast the dramatic rock formations of the Schweiz with the gentle
> Steigerwald — two completely different landscapes within 30 min of the city.

---

## Phase 5 — Passau

### Hike candidates

| # | Name | Type | Notes |
|---|---|---|---|
| 1 | Ilztal gorge walk | near_destination | Narrow canyon, Ilz river, very quiet, carrier, 2h |
| 2 | Dreiflüsseeck forest circuit | in_destination | Above the three-river confluence, views over city, 1.5h |
| 3 | Fürstenstein castle ruins | near_destination | Forested hill above Inn valley, carrier, 2h |
| 4 | Inn riverside path | en_route | Flat, en route from Munich A94, stroller, 1.5h |
| 5 | Bayerischer Wald — Lusen | near_destination | Proper forest hike for a 2-day trip, Hütte, 3h |

### Steps 5.1–5.5

Use the same 5-step prompts, substituting `passau`.

> **Note:** Ilztal is the headline hike — the gorge is genuinely extraordinary
> and almost unknown outside the region. Step 5.3 should open the page with this.

---

## Phase 6 — Nuremberg

### Hike candidates

| # | Name | Type | Notes |
|---|---|---|---|
| 1 | Fränkische Schweiz — Pottenstein | near_destination | Closest FS entry from Nuremberg, rock towers, carrier, 2h |
| 2 | Altmühltal — Essing + Randeck | en_route | Same as Regensburg, valid here too (A9 corridor) |
| 3 | Nürnberger Reichswald | in_destination | Large forest south of city, stroller loop, 2h |
| 4 | Rednitz valley trail | in_destination | Flat riverside south of the old town, stroller, 1.5h |

### Steps 6.1–6.5

Use the same 5-step prompts, substituting `nuremberg`. Only 4 hikes — adjust card count.

> **Note for Step 6.3:** This is the most urban destination. Hero should frame
> the page as "escapes from the city" rather than destination hiking.

---

## Phase 7 — Rothenburg

### Hike candidates

| # | Name | Type | Notes |
|---|---|---|---|
| 1 | Taubertal — Detwang loop | in_destination | Flat romantic valley walk, stroller, 2h |
| 2 | Hesselberg summit | en_route | Highest hill in Franconia, A7 exit, easy carrier loop, 2h |
| 3 | Romantic Road vineyard path | near_destination | Flat, vine terraces south of Rothenburg, stroller, 1.5h |
| 4 | Burggraben wall walk | in_destination | Moat path circling the town walls, easy, 1h |

### Steps 7.1–7.5

Use the same 5-step prompts, substituting `rothenburg`. Only 4 hikes.

> **Note for Step 7.3:** Hesselberg is the en-route gem — very few people stop
> there despite it being a straightforward A7 exit. Give it the Essing treatment
> (surprise, underrated, easy to add to the drive).

---

## Reusable Claude prompts (reference)

### Research + JSON

```
I'm building a hike guide for [DESTINATION] (data/[destination].json).

Research the following [N] hikes and produce a complete hikes[] array entry
for each, following the schema in data/schema.json exactly:

[LIST HIKES WITH LOCATIONS]

For each: write a full editorial description (4–6 sentences, specific and
personal), practical_tip, highlight blockquote sentence, accurate stats,
correct trailhead coordinates, hutte object or null, season string, and
gpx_file placeholder "[destination]-hike-{n}.gpx".

Append the completed hikes[] array to data/[destination].json.
Do not change any other fields in the file.
```

### Download GPX

```
Download GPX tracks for all hikes in data/[destination].json.

For each hike with a gpx_file field:
1. Search Waymarked Trails: https://hiking.waymarkedtrails.org/api/v1/list/search?query={hike name}&lang=de
2. If found: fetch route geometry, build GPX, save to docs/gpx/{gpx_file value}
3. If not found: try Overpass API bounding box around trailhead_lat/trailhead_lon
4. Update gpx_file in JSON to the actual filename saved

Report results: found / approximate / not found for each hike.
```

### Generate hike page

```
Read data/[destination].json (hikes array) and docs/regensburg-hikes.html
as the structural template.

Generate docs/[destination]-hikes.html:
- Same structure as regensburg-hikes.html
- Hero: "[Destination] — On Foot", write a tagline for this specific landscape
- Intro: 3–4 sentences about the hiking landscape (not the city)
- Overview map: route from data/[destination].json route_polyline + trailhead pins
- One hike-card-full per hike, content from JSON
- Mini Leaflet map per card loading the gpx_file
- Filter tabs: All / En route / Near [Destination] / With Hütte
- Nav breadcrumb back to [destination].html
- Before you go: 4–5 practical notes for this specific destination

No inline <style> blocks. All styles already exist in style.css.
```

### Add teaser to main page

```
Read docs/[destination].html and data/[destination].json.

Add a hike-list teaser block inside the hikes-section, immediately after
the closing </div> of the card-grid, following the pattern in regensburg.html.

Each list item should show:
- hike name
- human-readable type label (En route / Near [city] / In [city])
- difficulty
- estimated_time_minutes formatted as Xh or X.Xh
- "Hütte" if hutte is not null
- "Stroller OK" if pushchair_friendly is true

Link text: "Explore on foot →" pointing to [destination]-hikes.html
```

### Validate + commit + PR

```
Run node scripts/validate.js. Fix any schema validation errors in
data/[destination].json before proceeding.

Then create branch feat-[destination]-hikes, stage all changed and new files
for this destination (JSON, HTML, GPX files), commit with message
"feat: add [Destination] hike guide with GPX trail maps", push, and open a PR.
```

---

## File naming conventions

| File | Pattern | Example |
|---|---|---|
| Hike page | `docs/{destination}-hikes.html` | `docs/bamberg-hikes.html` |
| GPX tracks | `docs/gpx/{destination}-hike-{n}.gpx` | `docs/gpx/bamberg-hike-1.gpx` |
| JSON data | `data/{destination}.json` (extended) | `data/bamberg.json` |

---

## Completion checklist

- [ ] Phase 0 — Schema + Regensburg backfill
- [ ] Phase 1 — Berchtesgaden
- [ ] Phase 2 — Eichstätt
- [ ] Phase 3 — Bodensee
- [ ] Phase 4 — Bamberg
- [ ] Phase 5 — Passau
- [ ] Phase 6 — Nuremberg
- [ ] Phase 7 — Rothenburg
