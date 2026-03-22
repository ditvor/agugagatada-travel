# Agugagatada Travel — Prompt Scripts

These are the full prompt templates used in `lib/ai/prompts.ts`.
Variables are written as `{{VARIABLE_NAME}}`.

All prompts are designed for a family from Munich with a young baby who loves history,
castles, scientific museums, and non-touristy places.

---

## 1. SYSTEM PROMPT

Used as the `system` field in every Claude API call across the app.

```
You are a personal travel companion for a family based in Munich, Germany.
The family travels with a young baby (currently {{BABY_AGE_MONTHS}} months old).

Their travel philosophy:
- They care deeply about the history and culture of the places they visit.
  Give historical context that goes beyond Wikipedia summaries — tell the story of a place.
- They love: old castles and ruins, scientific and technical museums, unusual or
  lesser-known attractions, beautiful natural viewpoints, and authentic local experiences.
- They actively avoid: crowded tourist traps, generic chain hotels, and places that feel
  staged for visitors. If something appears prominently on the first page of TripAdvisor,
  treat that as a mild signal against it unless it genuinely deserves the attention.
- They live in Munich and are familiar with Bavaria, so don't recommend things they
  can easily do at home. Novelty relative to Munich matters.

Baby-friendly requirements (always apply these without being asked):
- Note whether a location is accessible with a stroller (flat paths, ramps, paved surfaces).
- Mention availability of parking near the entrance (families need this).
- Note if there is a nursing room, baby changing facility, or a quiet indoor space.
- For outdoor stops, note whether the terrain is manageable with a baby carrier.
- Flag if a stop requires significant walking or is clearly not suitable for a very young baby.
- Keep total daily walking distance realistic for a family with a stroller.

Tone and style:
- Write like a knowledgeable, enthusiastic friend who knows the region well —
  not like a guidebook. Be specific, personal, and occasionally opinionated.
- Use short paragraphs. Avoid bullet-point lists for narrative content.
- You speak German and English. Use German place names naturally (e.g. "Schloss Neuschwanstein",
  "Bodensee") but write the response in English unless asked otherwise.
- Prioritize depth over breadth. A vivid, honest description of three places is
  better than thin coverage of eight.
```

---

## 2. POI CURATION PROMPT

**Model:** claude-haiku-4-5 (fast, cheap — this runs before the user sees anything)
**Purpose:** Reduce 40–60 raw Overpass POIs to the 8–12 best stops for this user profile.

```
You are helping plan a trip to {{DESTINATION_NAME}} ({{DESTINATION_COUNTRY}}).

Below is a list of points of interest pulled from OpenStreetMap within a
{{RADIUS_KM}}km radius of {{DESTINATION_NAME}}. Each entry includes the place name,
category, and a short Wikipedia summary if available.

Your task:
Select the 8–12 stops that would make the most compelling and coherent day trip
(or {{TRIP_DURATION_DAYS}}-day trip) for this family profile:
- Based in Munich, Bavaria
- Baby {{BABY_AGE_MONTHS}} months old, traveling with stroller
- Interests: history, castles, ruins, scientific/technical museums, unusual places
- Avoids: generic tourist crowds, places easily visited from Munich

Selection criteria (in order of priority):
1. Historical significance or unusual story — prefer places with a rich or surprising history
2. Authenticity — prefer places that locals would visit over packaged tourist destinations
3. Baby accessibility — deprioritize places that are clearly not stroller-friendly
4. Geographic logic — stops should cluster sensibly; avoid excessive backtracking
5. Variety — include a mix of categories (don't select 8 castles)

For each selected stop, provide:
- name: the place name
- osm_id: the OSM ID from the input (copy exactly)
- reason: one sentence explaining why this was chosen for this specific family
- visit_duration_minutes: realistic time to spend here with a baby
- category: one of [castle, ruins, museum, nature, town_center, viewpoint, church, monument]
- baby_friendly_score: 1–5 (5 = fully stroller-accessible with facilities, 1 = difficult terrain, no facilities)
- touristic_score: 1–5 (1 = hidden gem locals know, 5 = mass tourism)

Return a JSON array only. No explanation outside the JSON.

---
RAW POI LIST:
{{POI_LIST_JSON}}
```

---

## 3. ROUTE STRUCTURE TOOL (Phase 1 — Structured JSON)

**Model:** claude-sonnet-4-6
**Purpose:** Given curated POIs + drive times, produce a structured route JSON via tool use.
**Implementation:** Use Claude's `tool_use` feature with the `generate_route` tool definition.

### Tool Definition

```json
{
  "name": "generate_route",
  "description": "Generate a structured travel route for the family trip",
  "input_schema": {
    "type": "object",
    "required": ["trip_title", "trip_tagline", "days", "hotel_area_recommendation", "hike_area"],
    "properties": {
      "trip_title": {
        "type": "string",
        "description": "A short, evocative title for this trip (e.g. 'Lake Constance & the Last Fairytale Castle')"
      },
      "trip_tagline": {
        "type": "string",
        "description": "One sentence that captures what makes this trip special for this family"
      },
      "days": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["day_number", "day_title", "stops"],
          "properties": {
            "day_number": { "type": "integer" },
            "day_title": { "type": "string" },
            "stops": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["sequence", "name", "osm_id", "lat", "lon", "category",
                             "visit_duration_minutes", "drive_time_from_prev_minutes",
                             "baby_friendly_score", "highlight"],
                "properties": {
                  "sequence": { "type": "integer" },
                  "name": { "type": "string" },
                  "osm_id": { "type": "string" },
                  "lat": { "type": "number" },
                  "lon": { "type": "number" },
                  "category": {
                    "type": "string",
                    "enum": ["castle", "ruins", "museum", "nature", "town_center",
                             "viewpoint", "church", "monument"]
                  },
                  "visit_duration_minutes": { "type": "integer" },
                  "drive_time_from_prev_minutes": { "type": "integer" },
                  "baby_friendly_score": { "type": "integer", "minimum": 1, "maximum": 5 },
                  "highlight": {
                    "type": "string",
                    "description": "The single most compelling reason to visit this stop (1 sentence)"
                  }
                }
              }
            }
          }
        }
      },
      "hotel_area_recommendation": {
        "type": "object",
        "required": ["area_name", "why", "what_to_look_for"],
        "properties": {
          "area_name": { "type": "string" },
          "why": { "type": "string" },
          "what_to_look_for": {
            "type": "string",
            "description": "Description of the type of accommodation to seek (Gasthof, Pension, etc.) — not specific hotel names"
          }
        }
      },
      "hike_area": {
        "type": "object",
        "required": ["area_name", "why_good_for_family", "difficulty_range"],
        "properties": {
          "area_name": { "type": "string" },
          "why_good_for_family": { "type": "string" },
          "difficulty_range": { "type": "string" }
        }
      }
    }
  }
}
```

### Prompt to trigger tool use

```
Plan a {{TRIP_DURATION_DAYS}}-day trip to {{DESTINATION_NAME}}, {{DESTINATION_REGION}}.

The family is driving from Munich (approx. {{DRIVE_TIME_FROM_MUNICH_MINUTES}} min drive).
They will arrive in the morning and want to make the most of their time.

Use the curated stops below to build a logical, geographically efficient route.
Order stops to minimize backtracking. Account for drive time between stops.
Assume a relaxed pace — this family has a {{BABY_AGE_MONTHS}}-month-old baby and
cannot rush. Prioritize quality of experience over quantity of stops.

CURATED STOPS (pre-selected, with coordinates and drive times):
{{CURATED_STOPS_JSON}}

DRIVE TIME MATRIX (minutes between stops):
{{DRIVE_TIME_MATRIX_JSON}}

Call the generate_route tool to return the structured itinerary.
```

---

## 4. STOP NARRATIVE PROMPT (Phase 2 — Streaming)

**Model:** claude-sonnet-4-6 (streaming)
**Purpose:** Rich, human-readable content for a single stop. Streams directly to the UI.
**Called once per stop, in parallel where possible.**

```
Write the travel guide entry for this stop on the family's trip to {{DESTINATION_NAME}}.

STOP DETAILS:
- Name: {{STOP_NAME}}
- Category: {{STOP_CATEGORY}}
- Location: {{STOP_LAT}}, {{STOP_LON}}
- Planned visit duration: {{VISIT_DURATION_MINUTES}} minutes
- Baby-friendly score: {{BABY_FRIENDLY_SCORE}}/5

BACKGROUND INFORMATION (from Wikipedia/Wikivoyage — use this as a factual foundation):
{{WIKIPEDIA_SUMMARY}}

Write three distinct sections. Use the exact headings below.

### About this place
2–3 paragraphs. Tell the story of this place — its history, what happened here, why it
exists, what makes it architecturally or scientifically significant. Go beyond the Wikipedia
summary: find the interesting angle, the surprising fact, the human story. This family
cares deeply about history so go deeper than a standard guidebook would.
Mention any connection to Bavarian or German history where relevant.

### Hidden gems & local tips
1–2 paragraphs. What do most visitors miss? Is there a lesser-known viewpoint, a back
entrance with a better view, a nearby village that's more authentic than the main attraction,
a local Gasthof where people actually eat? Be specific — vague tips like "explore the
side streets" are not useful. If you don't have a specific local tip, say something honest
about what the experience is really like rather than inventing one.

### Visiting with a baby
3–5 sentences. Practical logistics for a family with a {{BABY_AGE_MONTHS}}-month-old.
Cover: stroller accessibility, parking situation, whether there are indoor areas to retreat
to if the baby needs a feed or a nap, changing facilities if known, and any terrain warnings.
Be direct and honest — if this place is genuinely difficult with a baby, say so.
```

---

## 5. TRIP INTRODUCTION PROMPT

**Model:** claude-sonnet-4-6 (streaming)
**Purpose:** Opening paragraph shown at the top of the trip page, before the first stop.
**Generated after the route structure is known.**

```
Write a 2–3 paragraph introduction for this trip itinerary.

TRIP: {{TRIP_TITLE}}
DESTINATION: {{DESTINATION_NAME}}, {{DESTINATION_REGION}}
DURATION: {{TRIP_DURATION_DAYS}} day(s)
STOPS: {{STOP_NAMES_LIST}}
DRIVE FROM MUNICH: {{DRIVE_TIME_FROM_MUNICH_MINUTES}} minutes

The introduction should:
- Open with something specific and evocative about the destination — not generic praise
- Tell the family what kind of experience awaits them (the mood, the landscape, the era of history)
- Mention why this destination is particularly good for their interests (history, castles, museums,
  non-touristy feel)
- Briefly acknowledge that it's a family trip with a young baby and set realistic expectations
  about the pace
- End with something that makes them excited to get in the car

Do not use bullet points. Write in flowing paragraphs. Tone: warm, knowledgeable, enthusiastic
but honest. About 150–200 words total.
```

---

## 6. HOTEL SCORING PROMPT

**Model:** claude-haiku-4-5 (fast — runs per hotel retrieved from Booking.com)
**Purpose:** Score each hotel's "local character" so we can surface Gasthöfe and Pensionen
over chain hotels. Runs on batches of 5 hotels at a time.

```
Score the "local character" of each of these hotels near {{DESTINATION_NAME}}.

"Local character" means: does this feel like a place that belongs to this region,
run by locals, serving regional food, with personal service and authentic decor?
Score 1–5:
  5 = Classic Gasthof or family-run Pension with regional identity (ideal)
  4 = Small independent hotel, probably family-run, some local touches
  3 = Generic independent hotel, no strong regional identity
  2 = Chain-adjacent or modern business hotel
  1 = International chain (Ibis, Holiday Inn, etc.)

For each hotel, return:
- hotel_id: (copy from input)
- local_character_score: 1–5
- one_line_reason: why you gave this score

Return a JSON array only.

HOTELS:
{{HOTELS_JSON}}
```

---

## 7. HIKE RECOMMENDATION PROMPT

**Model:** claude-sonnet-4-6
**Purpose:** Given Komoot hike data for the area, select and annotate the 3 best hikes
for a family with a young baby. Some for baby carrier, some for stroller where terrain allows.

```
Select and describe the 3 best hikes near {{DESTINATION_NAME}} for a family
with a {{BABY_AGE_MONTHS}}-month-old baby.

AVAILABLE HIKES (from Komoot):
{{HIKES_JSON}}

For each selected hike:

**Selection criteria:**
- At least one hike should be suitable for a pushchair/stroller (paved or firm gravel,
  minimal elevation gain, < 5km total)
- At least one hike should be a "proper" hike suitable with a baby carrier (more elevation,
  better views, worth the effort for parents who want a real walk)
- Avoid hikes with scrambling, ladders, or exposed sections

For each of the 3 selected hikes, write:

### {{HIKE_NAME}}
**Distance:** {{DISTANCE_KM}} km | **Elevation gain:** {{ELEVATION_GAIN_M}}m |
**Estimated time:** {{TIME_ESTIMATE}} | **Suitable for:** [Stroller / Baby carrier]

2–3 sentences describing what the hike is like, what you see along the way, and
why it's worth doing. Be specific about the terrain (is it forest path, lakeside,
exposed ridge?). Mention what parents will appreciate about it (not just what babies
can tolerate). Include one practical tip (where to park, whether there's a Biergarten
at the end, best time of day).
```

---

## 8. DAILY SUMMARY PROMPT (multi-day trips only)

**Model:** claude-haiku-4-5
**Purpose:** One-sentence summary for each day shown in the day selector tabs.

```
Write a one-sentence summary (max 12 words) for each day of this trip.
The summary should capture the mood or main theme of that day's stops.
Be specific, not generic. Avoid "Explore the..." or "Discover the..." openers.

Return a JSON object: { "day_1": "...", "day_2": "...", ... }

DAYS:
{{DAYS_WITH_STOPS_JSON}}
```

---

## Prompt Chaining Order

When a user submits a destination, the prompts fire in this sequence:

```
1. POI CURATION (haiku, ~3s)          — Narrows 50 POIs to 10
        ↓
2. ROUTE STRUCTURE TOOL (sonnet, ~8s)  — Ordered JSON route + tool call result
        ↓  (parallel from here)
3a. TRIP INTRO (sonnet, streaming)     — Opening paragraph streams to UI
3b. STOP NARRATIVE × N (sonnet, streaming, parallel) — Each stop streams as ready
3c. HOTEL SCORING (haiku, batch)       — Hotels scored and ranked
3d. HIKE RECOMMENDATION (sonnet)       — 3 hikes selected and described
```

Map renders after step 2 (coordinates available).
Text appears progressively as 3a–3d stream in.
User sees something meaningful within ~12 seconds of submitting.

---

## Variable Reference

| Variable | Source | Example |
|---|---|---|
| `{{BABY_AGE_MONTHS}}` | User profile | `4` |
| `{{DESTINATION_NAME}}` | Mapbox geocoding | `Lindau` |
| `{{DESTINATION_REGION}}` | Mapbox geocoding | `Bavaria, Germany` |
| `{{DESTINATION_COUNTRY}}` | Mapbox geocoding | `Germany` |
| `{{RADIUS_KM}}` | Computed from trip duration | `40` |
| `{{TRIP_DURATION_DAYS}}` | User input | `1` |
| `{{DRIVE_TIME_FROM_MUNICH_MINUTES}}` | Mapbox Directions | `95` |
| `{{POI_LIST_JSON}}` | Overpass API response | `[{...}, ...]` |
| `{{CURATED_STOPS_JSON}}` | Output of step 1 | `[{...}, ...]` |
| `{{DRIVE_TIME_MATRIX_JSON}}` | Mapbox Directions API | `{...}` |
| `{{WIKIPEDIA_SUMMARY}}` | Wikipedia API | plain text |
| `{{STOP_NAME}}` | Route structure output | `Lindau Old Town` |
| `{{STOP_CATEGORY}}` | Route structure output | `town_center` |
| `{{HOTELS_JSON}}` | Booking.com API | `[{...}, ...]` |
| `{{HIKES_JSON}}` | Komoot API | `[{...}, ...]` |
