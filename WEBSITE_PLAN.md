# Website Plan — Agugagatada Travel

## Product framing

A family with a baby in Munich needs to know if a destination is worth the drive — before committing to it. This site answers that question through curated routes, honest baby logistics, and the hikes that make a place more than a series of stops.

Hikes are a first-class feature. They are not footnotes. A good hike — stroller-friendly, with a river and a view — can be the reason to pick one destination over another.

Design register: editorial, adult, minimal. No emoji. No score badges. No decoration that doesn't earn its place.

---

## Phases

- **A** — Foundation: CSS tokens, shared layout shell
- **B** — Index page: the 7 destination cards
- **C** — Destination page: map + stops + hikes + hotels
- **D** — Map interaction: scroll-linked stop highlighting
- **E** — All 7 destinations wired up
- **F** — Mobile polish

Each step is independent and shippable. Each has a Claude Code prompt ready to paste.

---

## Step A1 — CSS design tokens

**What**: Create `/preview/style.css` — the single source of truth for all visual decisions. No inline styles anywhere after this point.

**Deliverable**: One CSS file with custom properties, typography scale, spacing scale, and utility classes for the two-column map/content layout.

**Prompt:**
```
Create /preview/style.css for a minimalist travel editorial site.

Design constraints:
- No emoji anywhere in any file
- No box shadows on cards — use spacing and 1px borders
- No gradients
- Warm off-white background: #F7F5F2
- Near-black text: #1A1A1A
- Single accent color: #1B3A5C (deep navy)
- Map accent / route line: #1B3A5C at 70% opacity
- One typeface: system-ui, -apple-system, "Segoe UI", sans-serif
- Serif for pull-quote highlights only: Georgia, serif

Define CSS custom properties for:
  --color-bg, --color-surface, --color-text, --color-text-secondary,
  --color-accent, --color-border
  --space-xs (4px), --space-sm (8px), --space-md (16px), --space-lg (24px),
  --space-xl (40px), --space-2xl (64px)
  --text-sm (13px), --text-base (16px), --text-md (18px), --text-lg (24px),
  --text-xl (32px), --text-2xl (48px)
  --radius (4px)

Also define:
- .page-shell — max-width 1200px, centered, horizontal padding
- .two-col — CSS grid: 480px map column (sticky) + 1fr content column, gap 48px
- .stop-number — tabular numerals, --text-sm, --color-text-secondary, letter-spacing 0.1em
- .drive-connector — a thin 1px dashed vertical line between stops, 24px tall, --color-border
- .tag — small inline label: 11px, uppercase, letter-spacing 0.08em, border 1px solid --color-border, padding 2px 8px, border-radius 2px
- .expand-btn — no background, no border, cursor pointer, --color-accent, --text-sm
- .card-grid — CSS grid, auto-fill, minmax(280px, 1fr), gap --space-lg

No component styles yet. Only tokens and layout primitives.
```

---

## Step A2 — Shared HTML shell

**What**: Create `/preview/shell.html` — a reference template that all pages extend. Contains head, nav, and footer markup. All subsequent pages copy this shell.

**Prompt:**
```
Create /preview/shell.html — a minimal HTML5 template for all pages on this site.

Requirements:
- Link to /preview/style.css
- No inline styles
- Nav: site name "Agugagatada" left-aligned in --text-md weight 500, no logo image,
  no hamburger menu, no links yet. Just the name. Border-bottom 1px --color-border.
- Footer: one line, centered — "Munich-based, hand-curated." in --text-sm --color-text-secondary
- Body background: --color-bg
- Add placeholder <main id="content"></main> between nav and footer
- No JavaScript yet
- Valid HTML5, semantic tags (nav, main, footer)
- Meta viewport and charset
- Title: "Agugagatada — Day trips from Munich"

This is a reference file. Do not add any content inside <main>.
```

---

## Step B1 — Destination index page

**What**: `/preview/index.html` — the 7 destination cards. The first thing a user sees.

**Design intent**: Each card shows the destination name, drive time, and the one sentence from the intro that makes you want to click. Nothing else. Clicking goes to `/preview/[id].html`.

**Prompt:**
```
Create /preview/index.html — the destination gallery page.

Read these files first to extract destination data:
- /preview/shell.html (copy the HTML shell structure)
- /Users/igorkochman/claude_projects/agugagatada_travel/data/berchtesgaden.json
- /Users/igorkochman/claude_projects/agugagatada_travel/data/bodensee.json
- /Users/igorkochman/claude_projects/agugagatada_travel/data/regensburg.json
- /Users/igorkochman/claude_projects/agugagatada_travel/data/nuremberg.json
- /Users/igorkochman/claude_projects/agugagatada_travel/data/eichstaett.json
- /Users/igorkochman/claude_projects/agugagatada_travel/data/bamberg.json
- /Users/igorkochman/claude_projects/agugagatada_travel/data/passau.json

Page layout:
- Page title section: "Day trips from Munich" in --text-2xl, below it "7 drives worth the detour"
  in --text-md --color-text-secondary. Top padding --space-2xl.
- Destination grid using .card-grid class from style.css

Each destination card:
- White background (#FFFFFF), border 1px --color-border, border-radius --radius
- Padding --space-lg
- Top line: destination name in --text-lg font-weight 600
- Second line: drive time formatted as "1h 50 min" in .tag class
- If duration_days > 1: add a second .tag "2 days" next to the drive time tag
- Spacer of --space-sm
- One sentence of editorial text: extract the FIRST sentence of the "intro" field from the JSON
  (end at the first period that ends a complete thought)
- Bottom: a plain text link "See the route" in --color-accent --text-sm, pointing to
  [id].html (e.g., berchtesgaden.html)
- Hover state: border-color --color-accent, transition 150ms

Card order (by drive time, shortest first):
1. eichstaett (75 min)
2. regensburg (95 min)
3. nuremberg (100 min)
4. passau (110 min)
5. berchtesgaden (90 min — use actual value from JSON)
6. bodensee
7. bamberg

No emoji. No star ratings. No score badges. No images.
Link style.css from the same preview directory.
```

---

## Step C1 — Destination page: structure and stops

**What**: Build the destination page for one destination first — use Regensburg as the proof of concept. Two-column layout: sticky map left, scrolling stops right.

**Prompt:**
```
Create /preview/regensburg.html — the destination detail page for Regensburg.

Read these files first:
- /preview/shell.html
- /preview/style.css
- /Users/igorkochman/claude_projects/agugagatada_travel/data/regensburg.json

Page structure (top to bottom):

1. HERO SECTION (full-width, no two-col layout):
   - Destination name ("Regensburg") in --text-2xl, font-weight 700
   - Tagline from JSON in --text-md --color-text-secondary, max-width 600px
   - Two tags side by side: drive time ("1h 35 min") and duration ("1 day")
   - A thin 1px --color-border horizontal rule below

2. INTRO PARAGRAPH:
   - Full intro text from JSON, --text-md, line-height 1.7, max-width 680px
   - No special styling — just good readable prose

3. TWO-COLUMN LAYOUT (use .two-col class):
   LEFT COLUMN — Map (480px, sticky, top: 24px):
   - Leaflet.js map, height 560px
   - CARTO Positron tiles (greyscale): https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
   - Draw dashed polyline Munich→Regensburg using route_polyline from JSON, color --color-accent opacity 0.4
   - Draw solid polyline connecting all stop lat/lon coords in sequence, color --color-accent
   - Each stop: a small filled circle marker (8px, --color-accent fill, white stroke 2px)
     labeled with the stop sequence number
   - Map bounds: fit all markers with padding 40px
   - No Leaflet default blue markers — custom CircleMarker only

   RIGHT COLUMN — Stops:
   For each stop in days[0].stops (and days[1].stops if exists):
   - Stop number: "01", "02" etc. in .stop-number class
   - Stop name in --text-lg font-weight 600
   - Stop subtitle in --text-base --color-text-secondary
   - Two inline tags: visit duration ("45 min") and category
   - Highlight sentence in italic, Georgia serif, --color-text, border-left 3px solid --color-accent,
     padding-left --space-md, margin --space-md 0
   - Three expandable sections (collapsed by default):
       "About this place" / "Hidden gems" / "Visiting with a baby"
     Each is a <button class="expand-btn"> that toggles a <div> with the relevant JSON field
     (about / hidden_gems / baby_logistics). The text is --text-base line-height 1.7.
   - .drive-connector between stops (except after last stop)

No hotels or hikes section yet — that is Step C2.
No emoji. No score badges anywhere.
Use vanilla JavaScript only for the expand/collapse. Keep it under 30 lines.
```

---

## Step C2 — Hikes section

**What**: Add the hikes section to the destination page. Hikes are a first-class feature — they get their own prominent section, not buried at the bottom.

**Design intent**: A hike is often the reason to pick a destination. Show enough detail to make the decision — distance, elevation, surface, stroller/carrier flag — without overwhelming.

**Prompt:**
```
Add a hikes section to /preview/regensburg.html.

Read /Users/igorkochman/claude_projects/agugagatada_travel/data/regensburg.json for hike data.

Position: between the stops section and the hotels section (which doesn't exist yet).
Add a full-width section break (--space-2xl padding top) after the two-column layout ends.

Section heading: "On foot" in --text-xl font-weight 600. Below it in --color-text-secondary --text-sm:
"Walks and hikes from this base"

Layout: .card-grid (same grid as index page)

Each hike card:
- White background, border 1px --color-border, border-radius --radius, padding --space-lg
- Hike name in --text-md font-weight 600
- Area / location in --text-sm --color-text-secondary
- Row of tags (use .tag class) showing:
    - Distance: "5 km"
    - Elevation: "+10 m" (only show if > 0)
    - Difficulty: "easy" / "moderate" (capitalize)
    - "stroller-friendly" tag — only if pushchair_friendly is true
    - "carrier" tag — only if baby_carrier_feasible is true AND pushchair_friendly is false
- Description text in --text-sm line-height 1.6, --color-text, margin-top --space-sm
- Practical tip (from practical_tip field) in --text-sm --color-text-secondary, italic,
  margin-top --space-sm. Prefix with "Tip — " in font-weight 500.

Visual hierarchy: the "stroller-friendly" tag should use a slightly darker border
(--color-accent at 30% opacity) to distinguish it from generic tags. This is the
most important signal for a parent scanning quickly.

No emoji. No icons. Tags only.
```

---

## Step C3 — Hotels section

**What**: Add the hotels section below hikes.

**Prompt:**
```
Add a hotels section to /preview/regensburg.html, below the hikes section.

Read /Users/igorkochman/claude_projects/agugagatada_travel/data/regensburg.json for hotel data.

Section heading: "Where to stay" in --text-xl font-weight 600.

Layout: .card-grid

Each hotel card:
- White background, border 1px --color-border, border-radius --radius, padding --space-lg
- Hotel name in --text-md font-weight 600
- Hotel type + area in --text-sm --color-text-secondary (e.g. "Boutique Hotel — Regensburg old town")
- Price range as a .tag
- Tags row: "crib available" tag if has_crib true, "parking" tag if has_parking true
- why_recommended field as the main descriptive text — this is the editorial voice,
  --text-sm line-height 1.6, margin-top --space-sm
- Do NOT show the description field — why_recommended is more useful

No booking links yet. No external links. Static only.
```

---

## Step C4 — Practical notes

**What**: Add the practical notes block. These prevent bad days. They deserve prominence, not a footnote.

**Prompt:**
```
Add a practical notes section to /preview/regensburg.html, below hotels.

Read the practical_notes array from /Users/igorkochman/claude_projects/agugagatada_travel/data/regensburg.json

Section heading: "Before you go" in --text-xl font-weight 600.

Layout: a single block, background #FFFFFF, border 1px --color-border, border-radius --radius,
padding --space-xl, max-width 680px.

Each note: a plain <p> tag, --text-sm, line-height 1.8. Separate notes with a thin 1px --color-border
horizontal rule.

No bullet points. No icons. Just clean prose lines.

Place this section with --space-2xl padding-top above it. This is the last section before the footer.
```

---

## Step D1 — Scroll-linked map interaction

**What**: As the user scrolls through stops, the map updates — the active stop marker changes color and the map pans to focus on it. This is the core interaction.

**Prompt:**
```
Add scroll-linked map interaction to /preview/regensburg.html.

Using the Intersection Observer API (no external libraries):

1. Add a data-stop-id attribute to each stop's container div, matching the stop id
   from the JSON (e.g., data-stop-id="porta-praetoria")

2. Create an object mapping stop id to its Leaflet CircleMarker instance

3. When a stop scrolls into the viewport (threshold 0.5):
   - Change that stop's CircleMarker fillColor to --color-accent (#1B3A5C), radius 10
   - Change all other stops' CircleMarkers to fillColor #CCCCCC, radius 7
   - Pan the map (map.panTo) to that stop's coordinates, with animate: true

4. The solid polyline between stops should remain visible at all times — do not redraw it

5. On page load, activate the first stop by default

Requirements:
- Vanilla JavaScript only
- Total JS added: under 40 lines
- No flicker — use requestAnimationFrame if needed for smooth transitions
- The map column is sticky (already set in CSS) — do not change the CSS
```

---

## Step D2 — Day tabs (Nuremberg only — 2-day trip)

**What**: Nuremberg has 2 days. Add a simple tab switcher that shows Day 1 or Day 2 stops and updates the map accordingly.

**Prompt:**
```
Create /preview/nuremberg.html following the same structure as /preview/regensburg.html.

Read these files:
- /preview/regensburg.html (as structural reference)
- /preview/style.css
- /Users/igorkochman/claude_projects/agugagatada_travel/data/nuremberg.json

This destination has 2 days. Add a day switcher:
- Two plain text buttons: "Day 1 — Kaiserburg + Old Town + Dürer"
                          "Day 2 — Documentation Center + Trials"
  styled as .tag but clickable — active day gets border-color --color-accent,
  color --color-accent, font-weight 500
- When switching day, hide the other day's stops and redraw the map
  showing only that day's stop markers and connecting polyline
- The Munich→Nuremberg dashed polyline is always visible regardless of day

Keep all other sections (hikes, hotels, practical notes) outside the day switcher — they apply to the full trip.

Use vanilla JavaScript only. Under 50 lines total for the tab interaction.
```

---

## Step E — Remaining destination pages

**What**: Generate the remaining 5 destination pages. Each reuses the same structure.

**Prompt (run once per destination, substituting the destination name and JSON path):**
```
Create /preview/[DESTINATION].html for [DESTINATION NAME].

Read these files:
- /preview/regensburg.html (as the structural and style reference — copy its structure exactly)
- /preview/style.css
- /Users/igorkochman/claude_projects/agugagatada_travel/data/[DESTINATION].json

Follow the exact same structure as regensburg.html:
1. Hero section (name, tagline, tags)
2. Intro paragraph
3. Two-column layout: sticky map + scrolling stops with expand/collapse
4. Hikes section ("On foot")
5. Hotels section ("Where to stay")
6. Practical notes ("Before you go")
7. Scroll-linked map interaction (Intersection Observer)

Destination-specific adjustments:
- [PASSAU]: The map should show the three rivers visually — draw three short lines
  from the stop "dreifluesseeck" in blue-grey (#8FA8C0), green-grey (#7A9E87),
  and dark grey (#555555) to represent the Danube, Inn, and Ilz respectively
- [BAMBERG]: No multi-day tabs needed — single day only
- [EICHSTAETT]: No multi-day tabs needed — single day only
- [BERCHTESGADEN]: 2-day trip — add day tabs same as Nuremberg
- [BODENSEE]: 2-day trip — add day tabs same as Nuremberg

Update /preview/index.html to link each card to the correct .html file.
```

Destinations to run this for (in order):
1. `passau`
2. `bamberg`
3. `eichstaett`
4. `berchtesgaden`
5. `bodensee`

---

## Step F — Mobile polish

**What**: The two-column layout breaks on mobile. Fix it without adding a framework.

**Prompt:**
```
Add mobile responsive styles to /preview/style.css and verify they apply correctly
to /preview/regensburg.html.

Mobile breakpoint: max-width 768px

Changes at mobile breakpoint:
- .two-col: switch from CSS grid to single column (grid-template-columns: 1fr)
- Map column: height 320px, position static (not sticky), width 100%,
  border-bottom 1px --color-border, margin-bottom --space-xl
- .card-grid: grid-template-columns: 1fr (single column)
- --text-2xl: reduce to 32px
- --text-xl: reduce to 24px
- .page-shell: horizontal padding --space-md (reduce from desktop value)
- Day switcher tabs (if present): allow wrapping, gap --space-sm

Do not add any JavaScript for mobile. CSS only.
Do not use any CSS framework.
After updating style.css, open /preview/regensburg.html and verify
the layout renders correctly at 375px width.
```

---

## Step G — Index page map thumbnail (optional enhancement)

**What**: Add a small static map thumbnail to each destination card on the index page showing the drive from Munich. Makes the cards more spatial and scannable.

**Prompt:**
```
Add a small map thumbnail to each destination card on /preview/index.html.

For each card, add a Leaflet map instance (height 120px, width 100%, no zoom controls,
no attribution, non-interactive — use map.dragging.disable() and all interaction disabled).

Each thumbnail shows:
- CARTO Positron greyscale tiles
- Dashed polyline from Munich (48.1351, 11.5820) to destination coordinates from JSON
  using route_polyline array, color --color-accent, opacity 0.5, dashArray "4 6"
- A small filled circle at the destination point only (no marker at Munich)
- Fit bounds to the polyline with padding 20px

Place the map thumbnail at the top of each card, above the destination name.
Border-radius --radius at top corners only, overflow hidden.

Use a single shared initMap(containerId, polylineCoords, destLat, destLon) function
to avoid code duplication. Call it once per card after the DOM is ready.

Total JavaScript: under 60 lines for all 7 maps.
```

---

## Delivery sequence summary

| Step | File(s) touched | Prompt to use |
|------|----------------|---------------|
| A1 | `preview/style.css` (new) | Step A1 |
| A2 | `preview/shell.html` (new) | Step A2 |
| B1 | `preview/index.html` (new) | Step B1 |
| C1 | `preview/regensburg.html` (new) | Step C1 |
| C2 | `preview/regensburg.html` | Step C2 |
| C3 | `preview/regensburg.html` | Step C3 |
| C4 | `preview/regensburg.html` | Step C4 |
| D1 | `preview/regensburg.html` | Step D1 |
| D2 | `preview/nuremberg.html` (new) | Step D2 |
| E | 5× destination pages | Step E (×5) |
| F | `preview/style.css` | Step F |
| G | `preview/index.html` | Step G (optional) |

Each step produces a working, openable HTML file. No build step. No Node.js. No dependencies beyond Leaflet (CDN).

---

## Notes on using these prompts

- Always run steps in order within a destination — C1 before C2 before C3
- After each step, open the HTML file in a browser and check before moving to the next
- If a step produces something off, correct it before proceeding — later steps reference earlier ones
- Step E prompts are intentionally repetitive — that repetition ensures consistent output
- The map interaction in D1 can be added to all destination pages by referencing regensburg.html as the working example
