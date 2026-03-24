# Detour Feature — Product Plan

**Last updated:** 2026-03-24
**Status:** Planning

---

## Reframing the problem

The previous plan framed detours as a reactive crisis feature — baby crying, emergency stop needed. That's the wrong model. Detours are a **planning-time discovery feature**: when you're looking at the Regensburg page the evening before, you should be able to see that Weltenburg Gorge is 20 minutes off your route and ask yourself whether to add it. You want options before you leave, not emergency prompts while you're driving.

The right framing: **detours as route enrichment**. You're already committing to a 95-minute drive. What else is worth building into that day? What's along the road that most people miss?

The editorial voice here is: "We drove this route and this is what we'd stop for." Not a POI database. Not algorithmic suggestions. Hand-curated, with a genuine reason why.

---

## What a detour is — precisely

A detour is a stop that is:
1. **Not part of the destination's main circuit** — it's off the local walking route
2. **Geographically along or near the drive** — en route or a short diversion from the destination
3. **Self-contained in 20–120 minutes** — enough to justify stopping, not so long it becomes a second destination
4. **Worth the deviation on its own merits** — not just "it's nearby"

Two subtypes:

**En route** — you pass within 15–20 minutes of it on the drive from Munich. Best added at the start of the day (outbound) or on the return.

**Near destination** — within 20–30 minutes of the destination. Best added as a morning warm-up, an afternoon extension, or a next-morning add-on for 2-day trips.

---

## The map problem — and a better solution

Currently each destination page has one map: a sticky local map showing the walking circuit at the destination (stops, local polyline, dashed Munich→destination polyline in the corner).

There is no map showing the **drive itself** — where you're going, what you pass, what's nearby. The dashed polyline on the local map gives no real spatial sense of the journey.

The proposed solution is a new map layer: a **route overview strip** — a horizontal, non-interactive map (full content width, ~200px tall) positioned at the top of the "Worth a detour" section. It shows:
- Munich (labelled start point)
- The full drive polyline (same dashed line, but now the focus)
- Destination (labelled end point)
- Detour markers positioned geographically along or near the route

This map fills a genuine gap. It makes the drive legible. When you look at the Berchtesgaden page and see that Chiemsee is right on the A8 at the halfway point, you understand it spatially in a way you can't from a text description.

**Visual language:**
- Regular stops: filled navy circle (what we have now)
- Detour markers: hollow navy circle with a lighter stroke, slightly smaller
- A short dotted line from the nearest route point to the detour marker (for near-destination detours that are off the main drive line)
- On hover over a detour card: the corresponding map marker highlights

---

## Curated detours — all 7 routes

Research per route. 2–3 detours each, with honest editorial reasoning.

---

### Regensburg (A9/A93 north, 95 min)

**Weltenburg Abbey + Danube Gorge** — near destination
- Position: 20 min south of Regensburg, at Kelheim
- Detour: +20 min driving from the destination
- Visit: 90 min (including boat ride)
- Lat/lon: 48.9025, 11.9763
- Why: A small electric boat winds through vertical limestone walls 100 feet high to deliver you at Europe's oldest monastery brewery. The gorge is one of the most dramatic 20 minutes in Bavaria. The abbey has been brewing dark beer since 1050 AD and you can drink it in the courtyard. This is genuinely world-class — the kind of thing that becomes the story of the trip.
- Practical: Boat runs April–October, daily. €7 per adult, free for babies. Stroller fits on the boat with folding. Park at the Kelheim Schiffslände. Best in the morning (less crowded, better light in the gorge).
- Baby-friendly: 4/5. Flat boat, flat courtyard. The gorge walls are high enough to be exciting, not frightening.

**Landshut** — en route
- Position: 50 min from Munich, on the A92 northeast variant
- Detour: 10 min off the direct route
- Visit: 45–60 min
- Lat/lon: 48.5400, 12.1540
- Why: St. Martin's Church has the tallest brick tower in the world (130m, completed 1500) and almost nobody outside Germany knows it exists. The old town's Altstadt is one of the finest medieval streets in Bavaria — long, wide, arcaded, almost perfectly intact. Combine with a coffee at one of the Altstadt cafés.
- Practical: Free to walk. Tower visits require some steps — stroller stays at the base. Parking in the Altstadt car park.
- Baby-friendly: 5/5. Flat Altstadt, wide pavements, excellent for strollers.

---

### Nuremberg (A9 north, 100 min)

**Ingolstadt** — en route
- Position: Right on the A9, 45 min from Munich
- Detour: 15 min off the direct A9 (exit and park)
- Visit: 60 min
- Lat/lon: 48.7665, 11.4257
- Why: Ingolstadt is on the A9 whether you want it or not — the question is whether to stop. You should. The Liebfrauenmünster (the white Minster of Our Lady, originally the mausoleum of the Wittelsbacher dukes) is one of the finest late-Gothic churches in Germany, and its square is beautiful. The old town is compact and strollable. For car people: the Audi Museum is here too, though it's a separate visit.
- Practical: Old town is free. Audi Museum €7, under 6 free. Plenty of parking near the Altstadt.
- Baby-friendly: 5/5. Mostly flat old town, good pram surfaces.

**Weissenburg in Bayern** — en route
- Position: On the A9, 70% of the way to Nuremberg (75 min from Munich)
- Detour: 15 min off the A9
- Visit: 45 min
- Lat/lon: 49.0331, 10.9720
- Why: Weissenburg is a small Roman town on the limes (the northern frontier wall of the Roman Empire), and it still looks the part. The Roman baths (Ellinger Bad) are the largest north of the Alps and well-preserved. The medieval town wall is nearly complete. Almost no tourists. It pairs naturally with the Roman theme of Nuremberg's Documentation Center — you can frame the day as "Rome to the Third Reich, 2,000 years of German history."
- Practical: Roman baths museum €4, closed Mondays. Town wall walk is free. Stroller-accessible.
- Baby-friendly: 4/5. Roman bath is museum format, stroller stays outside main excavation.

---

### Berchtesgaden (A8 east → A10/B305, 105 min)

**Chiemsee + Herrenchiemsee Palace** — en route
- Position: On the A8 at the 55-minute mark, near Prien am Chiemsee
- Detour: 15 min off the A8
- Visit: 2–2.5h (including boat ride)
- Lat/lon: 47.8564, 12.3956
- Why: Ludwig II built his copy of Versailles on an island in Bavaria's largest lake. You reach it by a 10-minute boat ride from Prien. The Hall of Mirrors is longer than the original Versailles. Unlike Neuschwanstein, it's significantly less crowded. Add a walk along the Prien lakeshore and you have one of the most beautiful 2 hours in Bavaria.
- Practical: Boat €8 return per adult, under 6 free. Palace €10, children free. Boats run April–October. Stroller fits on the boat. Park at Prien harbour.
- Baby-friendly: 4/5. Flat boat, flat lakeshore. Palace interior has many rooms but all accessible.

**Bad Reichenhall** — near destination
- Position: 20 min north of Berchtesgaden on the B20
- Detour: 20 min from Berchtesgaden, 0 min if coming via Salzburg
- Visit: 45 min
- Lat/lon: 47.7250, 12.8760
- Why: Bad Reichenhall is where the Berchtesgaden salt trade actually began — the original royal saline was here, and the Alte Saline from 1834 is still standing and visitable. It's the forerunner of the Berchtesgaden mine you visit on Day 2. Architecturally it's more dramatic (massive turbine hall, Romanesque revival, designed by Leo von Klenze). Few people know it exists. Best as a warm-up before heading to Berchtesgaden, or a quiet morning on Day 2.
- Practical: Saline tours €8, under 6 free. Tours run daily except Sundays in winter. Stroller accessible.
- Baby-friendly: 4/5. Tour is level, not underground.

---

### Passau (A92 east, 110 min)

**Landshut** — en route
- Position: On the A92, 50 min from Munich
- Detour: 10 min off the direct route
- Visit: 45–60 min
- Lat/lon: 48.5400, 12.1540
- Why: Same as the Regensburg entry — tallest brick tower in the world, finest arcaded medieval main street in Bavaria, unknown to most visitors. If you're going to Passau (130 min total drive) it makes perfect sense to stop here at the halfway mark. Stretch your legs, see something genuinely extraordinary.
- Practical: Free. Wide streets, excellent for strollers.
- Baby-friendly: 5/5.

**Straubing** — en route
- Position: On the A92, 80 min from Munich
- Detour: 15 min off route
- Visit: 45 min
- Lat/lon: 48.8792, 12.5713
- Why: Straubing is the kind of place guidebooks skip but locals know. The Gäubodenmuseum has the finest collection of Roman military equipment found anywhere in the world — the Straubing Treasure (a cache of decorated ceremonial armour discovered in 1950, still on display exactly as found). The old town's main square (Theresienplatz) is long, wide, and lined with intact medieval and baroque buildings. This is the "hidden gems" philosophy of the whole site applied to a detour.
- Practical: Museum €4. Closed Mondays. Town centre is stroller-friendly.
- Baby-friendly: 4/5.

---

### Bodensee (A96 southwest → B12, 110 min)

**Wieskirche** — en route (scenic variant)
- Position: 30 min south of the A96 via Steingaden, adds ~35 min to the drive
- Detour: +35 min driving if you take the B17 scenic variant instead of staying on A96
- Visit: 30 min
- Lat/lon: 47.6807, 10.8928
- Why: A UNESCO World Heritage rococo church standing alone in a meadow. One of the most ornate interiors in German Baroque — ceiling frescoes, gold altarpieces, every surface decorated. From the outside it looks modest. The moment you step inside is one of the great architectural surprises of Bavaria. 30 min visit. Worth the detour entirely on its own.
- Practical: Free to enter. Open daily. Parking in the meadow (small fee in summer). Stroller-accessible, though the pews make the main aisle narrow.
- Baby-friendly: 4/5.

**Neuschwanstein + Füssen** — en route (scenic variant)
- Position: On the B17 Romantische Straße, 75 min from Munich via the scenic route
- Detour: +45 min if taking scenic B17 instead of A96 — or this IS the scenic route to Bodensee via Füssen
- Visit: 2–3h
- Lat/lon: 47.5576, 10.7498
- Why: Neuschwanstein is the world's most recognisable castle and also genuinely spectacular in person in a way that the photographs don't prepare you for. It was unfinished when Ludwig II died — less than half of the planned rooms were completed — which makes it stranger and more interesting than the guidebooks suggest. The walk up is 30 min; with a baby use the horse carriage or bus. The views from the Marienbrücke bridge are the money shot.
- Practical: Timed entry tickets must be booked online weeks ahead. €16 adults, under 18 free. Carriage up: €7. Park in the village (P1, €8/day).
- Baby-friendly: 3/5. The walk up is steep. Carrier preferred over stroller for the actual castle approach.

---

### Bamberg (A9 north → A73, 130 min)

**Ingolstadt** — en route
- Position: On the A9, 45 min from Munich
- Detour: 15 min
- Visit: 60 min
- Same as Nuremberg entry above. On the same road; same logic.

**Weissenburg in Bayern** — en route
- Position: On the A9, 75 min from Munich
- Detour: 15 min
- Visit: 45 min
- Same as Nuremberg entry above. Bamberg is a longer drive; Weissenburg falls at a natural break point.

---

### Eichstätt (B13 + Altmühltal, 75 min)

**Ingolstadt** — en route
- Position: On the B13 / A9 south of Eichstätt, 45 min from Munich
- Detour: 15 min
- Visit: 45–60 min
- Same as above. Ingolstadt is on the way to Eichstätt regardless of whether you take the autobahn or the B13.

**Pfünz Roman Fort (Vetoniana)** — near destination
- Position: 5 min from Solnhofen, near the quarries
- Detour: 10 min from Solnhofen, essentially zero if you're already at the quarries
- Visit: 20–30 min
- Lat/lon: 48.8622, 11.2583
- Why: A reconstructed Roman auxiliary fort on the limes, the northernmost military frontier of the empire. The walls are partially rebuilt to height; you can walk the perimeter and see the gate towers. It's tiny, free, and almost entirely unknown. After spending the morning at the Jura Museum learning that Eichstätt was Roman legionary territory for 300 years, walking through an actual Roman fort gate 5 minutes away closes the circle perfectly. This is the kind of thing that makes a trip feel curated rather than accidental.
- Practical: Free, always open. Parking at the site. Stroller-accessible on the gravel paths.
- Baby-friendly: 5/5. Outdoors, flat, gravel paths.

---

## Data model

Add `detour_stops` array to each destination JSON at the top level:

```json
"detour_stops": [
  {
    "id": "weltenburg-abbey",
    "name": "Weltenburg Abbey + Danube Gorge",
    "tagline": "A boat ride through a limestone gorge to Europe's oldest monastery brewery",
    "position": "near_destination",
    "lat": 48.9025,
    "lon": 11.9763,
    "detour_from_route_minutes": 20,
    "visit_duration_minutes": 90,
    "best_time": "morning",
    "category": "nature",
    "baby_friendly_score": 4,
    "highlight": "The boat winds through vertical limestone walls 100 feet high — you arrive at the monastery from the water",
    "description": "A small electric boat...",
    "practical": "Boat runs April–October. €7 per adult, free for babies. Stroller fits. Park at Kelheim Schiffslände."
  }
]
```

Fields:
- `position`: `"en_route"` (on the drive from Munich) or `"near_destination"` (short diversion from the destination itself)
- `detour_from_route_minutes`: extra one-way driving time from the nearest point on the main route
- `best_time`: `"morning"` / `"afternoon"` / `"any"` / `"return_journey"`
- `highlight`: one sentence in italic Georgia — the editorial money line (same pattern as stop highlights)
- `practical`: parking, cost, hours, accessibility — brief and honest

---

## Page design — "Worth a detour" section

**Position:** After the intro paragraph, before the time-mode selector.

This makes the section a planning consideration — you see your options before you decide how to structure the day, not after you've already committed to the stops.

**Section header:** `"Worth a detour"` in `--text-xl` weight 600. Below it in `--color-text-secondary --text-sm`: `"Stops worth building into this route"`

**Layout:** `.card-grid` (same as hikes and hotels) — 2–3 cards per destination, 280px minimum

**Detour card anatomy:**
```
┌─────────────────────────────────────┐
│ [en route] or [near destination]    │  ← small .tag
│                                     │
│ Weltenburg Abbey + Danube Gorge     │  ← name, --text-md font-600
│ +20 min · 90 min visit              │  ← drive + visit tags
│                                     │
│ "The boat winds through vertical    │  ← highlight in Georgia italic
│  limestone walls 100 feet high..."  │    navy left-border (same as stops)
│                                     │
│ Boat runs April–Oct. Stroller fits. │  ← practical, --text-sm secondary
└─────────────────────────────────────┘
```

The card does NOT have a "See the route" link — detours are informational, not linked pages. The practical line covers what you need to know to decide.

**Visual distinction from stop cards:** The cards are the same width and use the same border/surface/radius, but the left-border highlight is slightly thinner (2px vs 3px) and the overall density is lighter. Detours are suggestions, not itinerary items.

---

## Map treatment — route overview strip

A new map instance added just above the "Worth a detour" cards — or integrated as the section's visual header.

**Dimensions:** Full content width (same as the `.intro` text), 200px tall.

**What it shows:**
- Full drive polyline Munich → destination (same dashed navy line, but now it's the focus)
- A labelled dot at Munich (start)
- A labelled dot at the destination (end)
- Detour markers: hollow circle in `--color-accent` at 60% opacity
- Thin dotted line from the nearest route point to the detour marker (for near-destination detours)
- Map is non-interactive (no zoom, no drag) — it's editorial context, not a navigation tool

**On hover / tap of a detour card:** the corresponding map marker fills in (opacity 100%, radius increases slightly). A small label appears. This is the only interaction.

**Bounds:** fitBounds to all detour markers + route polyline endpoints, padding 30px.

---

## Implementation phases

### Phase D1 — Populate detour data in JSON (1 session)

Add `detour_stops` to all 7 JSON files using the curated research above.
2–3 per destination. All fields populated.

**Prompt for Claude Code:**
```
Add detour_stops to all 7 destination JSON files in /data/.

Read this document (/DETOUR_PLAN.md) for the complete curated list.

For each destination, add a top-level "detour_stops" array.
Each entry must have: id, name, tagline, position, lat, lon,
detour_from_route_minutes, visit_duration_minutes, best_time,
category, baby_friendly_score, highlight, description, practical.

Do not modify any existing fields. Only add detour_stops at the top level.
Verify all 7 files after writing.
```

### Phase D2 — "Worth a detour" section on destination pages (1 session)

Add the section to all 7 destination HTML pages. Data comes from the JSON (but
since pages are currently static HTML, use a small JS fetch of the JSON file
or inject via the existing Python patching pattern used for tiers).

**Prompt for Claude Code:**
```
Add a "Worth a detour" section to all 7 destination HTML pages.

Read the detour_stops from each destination's JSON file.
Position: after the .intro section, before the #time-selector div.

Section structure:
<section class="detours-section">
  <h2>Worth a detour</h2>
  <p class="section-sub">Stops worth building into this route</p>
  <div class="card-grid">
    <!-- one card per detour_stop -->
  </div>
</section>

Each card:
- .tag for position ("En route" / "Near destination")
- name in --text-md font-600
- tags row: "+X min drive" and "Y min visit" using .tag
- highlight in italic Georgia with navy left-border (same as stop highlights)
- practical text in --text-sm --color-text-secondary

Use the same Python patching approach used for tiers —
read JSON, inject HTML into each destination file.
```

### Phase D3 — Route overview strip map (1 session)

Add the non-interactive strip map above the detour cards.

**Prompt for Claude Code:**
```
Add a route overview map strip to each destination page, above the detour cards.

Map container: full width of .intro, height 200px, border-radius var(--radius),
overflow hidden. id="route-map" per page.

This is a separate Leaflet instance from the main destination map.

Show:
1. CARTO Positron tiles (same as main map)
2. Full drive polyline (from route_polyline in JSON — same dashed navy line, opacity 0.5)
3. Detour markers: L.circleMarker at each detour stop lat/lon, radius 7,
   color --color-accent, fillColor 'transparent', weight 2 (hollow circle)
4. A short dotted line from the nearest route waypoint to each detour marker
   (use the closest point in route_polyline array as the anchor)
5. fitBounds to all markers + polyline, padding [24, 24]

Non-interactive: disable all controls and interactions.

On detour card mouseenter: find the matching marker by data-detour-id attribute,
set fillColor to --color-accent, radius to 10.
On mouseleave: reset to transparent fill, radius 7.
```

### Phase D4 — Update PRODUCT_PLAN.md

Replace the old emergency-stop framing in Feature 7 with a reference to this document.

---

## What this is not

- Not a real-time navigation feature
- Not an "emergency stop" finder (that's a separate concern, lower priority)
- Not algorithmic — every detour is hand-curated with an editorial voice
- Not a second destination — each detour is self-contained in under 2 hours

The principle: the site tells you what to do before you leave. Once you're in the car, you've already made your decisions. The planning experience is the product.
