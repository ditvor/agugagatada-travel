# Agugagatada — Product Plan

**Last updated:** 2026-03-23
**Status of preview site:** All 7 destinations live. Steps A–G complete.

---

## The problem, honestly framed

A parent with a baby in Munich wants to do a day trip. The problem is not finding destinations — Google has that covered. The problem is everything that happens *after* you pick a destination:

- **How do I time the drive around nap time?** A sleeping baby in the car is free time. An awake, bored baby in the car is chaos. This timing question alone can make or break the day.
- **Which stops actually matter if I only have 3 hours?** Not "which stops are interesting" — that's the editorial question. "Which 2 stops do I skip if baby gets fussy at noon?"
- **What do I do when the plan falls apart?** Baby is crying at stop 2 of 5. It's 1pm. Do I push through, bail to the car, or pivot to something softer? No travel app answers this.
- **What's 10 minutes off this road that's worth the detour?** Not a major destination — a ruined castle, a viewpoint, a half-hour walk. The thing that turns a drive into a memory.

The static site we've built answers the *discovery and planning* question well. The gap is everything that happens **on the day** — on the road, at a stop, with a tired baby and a changed plan.

---

## Two modes, two different products

This distinction is fundamental. Don't conflate them.

### Mode 1 — Planning (what we have)

**When**: The evening before the trip. At the kitchen table. On a phone during lunch.
**User state**: Unhurried. Browsing. Making a decision.
**Job to be done**: Is this destination worth going to? What will we actually do there? Is it baby-friendly?
**Format**: Editorial. Desktop-capable. Rich text + map.
**What we built**: The 7-destination static site. This is good. Keep improving it.

### Mode 2 — Trip (what we don't have)

**When**: The morning of the trip. In the car. Standing outside a café at stop 2.
**User state**: One hand on a stroller. One eye on a sleepy baby. Limited attention.
**Job to be done**: What do I do *right now*?
**Format**: Mobile-first. Minimal reading. Fast answers. Big tap targets.
**What we need to build**: Trip Mode.

---

## Status of what's been built

| Feature | Status |
|---------|--------|
| Design system (CSS tokens) | Done |
| Index page with 7 destination cards + map thumbnails | Done |
| All 7 destination editorial pages | Done |
| Stops with expand/collapse, scroll-linked map | Done |
| Hikes section (stroller/carrier tags) | Done |
| Hotels section | Done |
| Practical notes section | Done |
| Day-switcher for 2-day destinations | Done (Nuremberg, Berchtesgaden, Bodensee) |
| Mobile responsive layout | **Not done** |
| Dynamic rendering from JSON | Not done |
| Time-based trip planner | Not done |
| Baby sleep optimizer | Not done |
| Plan B / trip tiers | Not done |
| Trip Mode (mobile, active) | Not done |
| Detour engine | Not done |

---

## Feature 1 — Mobile responsive layout

**Priority: High. This is blocking everything else that matters.**

The two-column layout collapses on phones. The planning experience is mostly desktop, but Trip Mode is entirely mobile. Nothing else in this roadmap works without fixing this first.

**Prompt for Claude Code:**
```
Add mobile responsive styles to /preview/style.css.

Breakpoint: max-width 768px

At mobile:
- .two-col: grid-template-columns: 1fr (single column). Map column comes first, full width.
- .two-col__map: position static (not sticky), height 300px, border-bottom 1px var(--color-border)
- .card-grid: grid-template-columns: 1fr
- .page-shell: padding-inline var(--space-md)
- --text-2xl: reduce to 32px
- --text-xl: reduce to 24px
- Day switcher (.day-btn row): flex-wrap wrap

CSS only. No JavaScript.
```

---

## Feature 2 — Stop tiers (data layer for everything else)

**Priority: High. Required before Plan B or Trip Mode.**

The current JSON has `baby_friendly_score` (1–5) and `visit_duration_minutes` per stop. What's missing is an explicit **tier** that encodes priority for time-constrained visits.

Add a `tier` field to every stop in every JSON:

| Tier | Meaning | Rule of thumb |
|------|---------|---------------|
| 1 | Essential — the one unmissable thing | `baby_friendly_score >= 4` AND best historical/visual payoff |
| 2 | Full day — the curated experience | Default plan |
| 3 | Bonus — only if everything's going well | `baby_friendly_score <= 2` OR logistically awkward |

Also add `skip_if_rushed: true/false` as a convenience alias for tier 3.

**What to update:** All 7 JSON files. 2–3 stops per destination get tier=1, the rest tier=2 or tier=3.

---

## Feature 3 — Time-based trip planner on destination pages

**Priority: Medium. Quick win once tiers exist.**

A simple control at the top of each destination page: "How much time do you have?"

```
[ 2 hours ]  [ Half day ]  [ Full day ]
```

- **2 hours**: Show only tier=1 stops. Hikes hidden. Hotels hidden. Practical notes condensed to 2 most critical points.
- **Half day**: Show tier=1 and tier=2 stops. Full hikes section. Hotels hidden.
- **Full day**: Default view — everything.

No backend. JS reads the `tier` field from each stop element's `data-tier` attribute and toggles visibility.

This also shows estimated total time: "~3.5 hours including drive time" — calculated from `visit_duration_minutes` per visible stop + `drive_time_from_origin_minutes`.

**Prompt for Claude Code:**
```
Add a time-mode selector to each destination page.

Place three buttons immediately before the two-column layout section:
  "2 hours"   "Half day"   "Full day"
styled as .tag but clickable. Active state: border-color var(--color-accent).

Each stop div gets a data-tier attribute (1, 2, or 3) from the JSON tier field.

On "2 hours": hide stops where data-tier > 1. Show a note: "Showing X essential stops only."
On "Half day": hide stops where data-tier > 2.
On "Full day": show all stops (default).

Below the buttons, show total estimated time:
"Approx. Xh Ym at destination + 1h 35 min drive each way"
Calculated: sum of visit_duration_minutes for visible stops + drive_time_from_origin_minutes × 2.

Vanilla JS only. The tier data lives in data-tier HTML attributes. Under 30 lines.
```

---

## Feature 4 — Baby sleep optimizer

**Priority: Medium. Highest novelty. Nothing else does this.**

This is the insight no travel app has built: **a baby sleeping in a car is free travel time.** If you time your departure to coincide with nap time, you cover 90–100 minutes of driving while the baby sleeps, and arrive just as they wake up — fresh, fed, ready for 1.5–2 hours of active sightseeing.

At 4 months, a baby typically:
- Has a wake window of ~1.5–2 hours before needing to sleep
- Naps ~45–60 minutes at a stretch
- Falls asleep in a moving car within 10–20 minutes of being tired

The optimizer is simple arithmetic, not AI:

```
Given:
  last_nap_ended_at = T
  baby_wake_window = 90 min (adjustable)
  car_sleep_onset = 15 min (car motion triggers sleep)
  drive_time = D minutes

Optimal departure:
  Leave at T + (wake_window - car_sleep_onset - 10 min buffer)
  = T + 65 min

Result:
  Baby falls asleep ~15 min into drive (T+80)
  Arrives at destination at T+80+D
  Baby wakes approximately at T+80+45 (nap end)
  → If D ≈ 45–70 min: baby wakes as you arrive. Perfect window.
```

**Implementation**: A small standalone widget — a `<div>` on the destination page (or a floating modal on the index page). Two inputs: "Last nap ended at" (time picker) + destination drive time (pre-filled). Output: "Leave at 9:15am. Baby will likely sleep through the drive and wake up ~10 minutes after you arrive. You'll have approximately 1h 30m of happy-baby time before the next nap."

This should be a standalone `preview/nap-calculator.js` widget included on every destination page.

---

## Feature 5 — Plan B (fallback routes)

**Priority: High. The core of the "detour" concept.**

Plan B is not a detour in the geographical sense. It's a *schedule detour* — what you do when the plan falls apart.

Every destination needs three versions of the day:

**Plan A** — The full curated day (tier 1 + 2 stops, full hikes, hotels, everything)
**Plan B** — The 3-hour version (tier 1 stops only + one hike if stroller-friendly)
**Plan C** — The graceful exit (one tier-1 stop, find a café, head home)

Plan B and C are derivable from the tier system. No new data needed.

**On the destination page**: A small persistent pill at the bottom of the page (or a swipe-up drawer on mobile): "Running short on time?" → expands to show Plan B.

**In Trip Mode** (see below): Plan B is offered automatically when baby state is "fussy" or "tired."

---

## Feature 6 — Trip Mode

**Priority: High. The product's second chapter.**

Trip Mode is a separate page — `/preview/trip/[destination].html` — with a completely different UX from the editorial page. It's designed to be used one-handed, while standing, with a stroller in front of you.

### Layout
- Full-height mobile layout
- **Top strip**: destination name + time remaining (editable)
- **Middle**: current stop card (big, readable at arm's length)
- **Bottom drawer**: next stop + baby state controls

### Baby state machine

Four states, toggled with large buttons:

| State | Emoji-free label | Map color | Action offered |
|-------|-----------------|-----------|----------------|
| Sleeping | Sleeping | Grey (don't interrupt) | "Stay in car 15 more min?" |
| Awake + happy | Happy | Navy (full attention) | Show full stop detail |
| Getting tired | Fussy | Amber | "Shorten this stop?" |
| Needs stop NOW | Needs stop | Red | Plan C immediately |

### What it shows per state

**Sleeping**: "Don't stop yet. Next stop is X min away. Baby likely wakes in ~Y min."
**Happy**: Current stop full card. Next stop preview. Estimated time.
**Fussy**: "Shorten stop to 15 min? Skip to [best remaining stop]?" → Plan B prompt.
**Needs stop NOW**: Plan C. "One thing worth doing: [tier-1 stop, 20 min]. Then a café, then home."

### Time budget

A persistent "time remaining" counter (editable by user). As you complete stops, time decrements. When time gets tight, Trip Mode warns: "At this pace you'll miss [stop X]. Skip it?"

### No backend needed for MVP

Location comes from browser `navigator.geolocation`. All stop data is already in JSON. Distance calculations are client-side (Haversine formula). No server.

**Prompt for Claude Code (Phase 5, after mobile CSS and tier data are in place):**
```
Create /preview/trip/regensburg.html — the Trip Mode page for Regensburg.

Read /data/regensburg.json for stop data.

Requirements:
- Full-height mobile layout (100dvh), no two-column, no sticky map
- Small map at top (200px) showing current position dot + remaining stops
- Large card in center showing current stop: name, highlight sentence, visit_duration_minutes
- Four baby-state buttons at bottom: "Sleeping" / "Awake" / "Getting tired" / "Stop needed"
- Baby state changes the card's recommended action:
    Sleeping → "Stay in car. Next stop: [name], X min away."
    Awake → Full stop card with about text
    Getting tired → "Cut visit short. Skip to [tier-1 remaining stop]?"
    Stop needed → "Best quick stop: [tier-1, shortest duration]. Then head home."
- Time remaining shown at top right, tappable to edit
- "Next stop →" button advances to next stop in sequence
- On advance: map pans to next stop, card updates, time remaining decrements
- All logic in vanilla JS. Under 80 lines.
```

---

## Feature 7 — Detours

**Priority: High. Planning-time discovery, not crisis management.**

See **`DETOUR_PLAN.md`** for the full plan, curated detour research, data model, and implementation prompts.

**Summary:** A "Worth a detour" section on each destination page, positioned after the intro and before the main stops. Shows 2–3 hand-curated stops that are either en route or near the destination — the kind of thing you'd add to your day if you knew about it. Accompanied by a non-interactive route overview strip map showing the full drive with detour markers.

This is a planning feature, not a Trip Mode feature. The principle: tell people their options before they leave, not while they're driving.

---

## Feature 8 — Dynamic rendering (technical foundation)

**Priority: Medium. Enables long-term maintainability.**

Right now: 7 HTML files × 700 lines = content duplicated from JSON.
Problem: Update a stop's `about` text in JSON → have to also update the HTML file manually.
Worse: The Plan B / time planner / Trip Mode features all need to read from the same data source.

**Solution**: Replace hardcoded HTML content with JavaScript rendering from JSON.

```
preview/
  render.js          — renders a destination page from JSON
  trip-render.js     — renders a trip mode page from JSON
  [dest].html        — thin shell: loads render.js + passes dest ID
```

Each destination HTML becomes:
```html
<script>
  const DEST_ID = 'regensburg';
</script>
<script src="../render.js"></script>
```

All editorial content (stop about text, hike descriptions, hotel copy) stays in JSON. The HTML is structural only.

**Important**: Do this destination by destination. Regensburg first, verify it looks identical, then roll out to the other 6. Never break the editorial look.

---

## Architecture decision: stay static or go dynamic?

**Recommendation: Stay static until Trip Mode proves the concept.**

The static site has zero infrastructure cost, zero deployment complexity, and no failure modes beyond "the CDN is down." For a side project in validation phase, that's the right tradeoff.

**When to add a backend:**
- When the emergency stop finder needs live POI data (Overpass API)
- When users want to save and share trips
- When the sleep optimizer needs to send push notifications ("baby probably waking up — find parking now")
- When we want to generate new destinations via Claude (the original PLAN.md vision)

Until then: everything runs client-side. JSON files are the database. The browser is the compute.

---

## Phase breakdown

### Phase A — Done ✓
CSS design system, shell, index page, 7 destination pages, scroll interaction, day tabs, map thumbnails.

### Phase B — Immediate next steps

**B1: Mobile CSS** (1 session)
Unblocks everything. Without this, Trip Mode is unusable.

**B2: Add tier field to JSON** (1 session)
Update all 7 JSON files. 2 min per destination once the pattern is clear.

**B3: Time-mode selector on destination pages** (1 session)
2h / Half day / Full day buttons. Filters stops by tier. Shows estimated total time.

### Phase C — Trip Mode MVP

**C1: Nap calculator widget** (1 session)
Standalone JS widget. Input: last nap time. Output: optimal departure time. Include on all destination pages.

**C2: Trip Mode — Regensburg** (1–2 sessions)
Build `/preview/trip/regensburg.html` as the proof of concept. Mobile-first. Baby state machine. Plan B on fussy.

**C3: Plan B drawer** (1 session)
Add a "Running short?" drawer to all destination editorial pages. Shows tier-1 stops only with total time.

### Phase D — Detour engine

**D1: Add detour_stops + emergency_stops to JSON** (1 session)
2–3 detour stops per destination, 2 emergency stops per route. Manual curation.

**D2: Detour prompts in Trip Mode** (1 session)
When geolocation is within 10 km of a detour stop: show the prompt.

**D3: Emergency stop mode** (1 session)
"Needs stop NOW" state triggers emergency stop display. Shows nearest 2 options with distance, has_changing_table, open/closed (static for now).

### Phase E — Dynamic rendering

**E1: Build render.js** (2 sessions)
Renders a full destination page from JSON. Tested against Regensburg — must look identical to current HTML.

**E2: Convert all 7 destination pages** (1 session)
Replace hardcoded content with `render.js` call. Content now lives only in JSON.

### Phase F — Trip Mode rollout

**F1: Roll Trip Mode to all 7 destinations** (1 session, once render.js exists)
Trivial once the architecture is in place.

### Phase G — Backend (when needed)

- Live emergency stop finder via Overpass API
- Save/share trips
- Push notifications for nap timing
- Custom destination generation via Claude (see PLAN.md)

---

## The one sentence product vision

> A family trip companion that tells you *where to go* the night before and *what to do next* while you're standing on the cobblestones with a fussy baby.

The first half is solved. The second half is what makes this worth building.

---

## Files to keep / archive

| File | Status |
|------|--------|
| `PRODUCT_PLAN.md` | This file — active |
| `PLAN.md` | Keep — original full-stack vision for Phase G |
| `PROMPTS.md` | Keep — Claude prompts for AI route generation |
| `WEBSITE_PLAN.md` | **Delete** — all steps complete |
| `README.md` | Keep |
