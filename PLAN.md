# Agugagatada Travel — Implementation Plan

**Project:** AI-powered family travel route planner
**User:** Munich family, baby 3.5 months, loves history / castles / science museums / non-touristy places
**Goal:** Enter a destination, receive a curated itinerary with historical overviews, hidden gems, hotels, and hikes — baby-friendly throughout

---

## Phase 1 — Foundation & Map Skeleton

**Goal:** Working Next.js app where a user can type a destination, see it on a map, and the entire project skeleton is in place for subsequent phases.

### Tasks

- [ ] Initialize Next.js 14 project with TypeScript, Tailwind CSS, ESLint, and shadcn/ui
- [ ] Set up tRPC with a basic `tripRouter` stub
- [ ] Configure Prisma + PostgreSQL with PostGIS extension enabled
- [ ] Create initial Prisma schema: `users`, `trips`, `stops`, `pois`, `hike_routes`, `hotels`
- [ ] Set up Redis client (`lib/cache/redis.ts`)
- [ ] Set up BullMQ worker skeleton (`lib/queue/jobs.ts`)
- [ ] Integrate Mapbox GL JS — display a map centered on Bavaria
- [ ] Build destination search input with Mapbox Geocoding autocomplete
- [ ] On destination select: fly map to location, drop a pin
- [ ] Create `lib/env.ts` with Zod validation of all environment variables
- [ ] Create `.env.example` documenting all required keys
- [ ] Deploy skeleton to Vercel (CI/CD pipeline established)

**Deliverable:** User types "Lindau", sees autocomplete suggestions, selects it, map flies to Lake Constance. Nothing else happens yet. Foundation is solid.

---

## Phase 2 — Data Aggregation Pipeline

**Goal:** Given a destination, the system fetches raw POIs, Wikipedia summaries, and drive-time data. No AI yet — pure data plumbing.

### Tasks

- [ ] Build `lib/apis/overpass.ts`:
  - Radius query for POIs around a coordinate (30-50km)
  - Filter tags: `historic=castle`, `historic=ruins`, `tourism=museum`, `historic=monument`, `leisure=nature_reserve`, `amenity=theatre`
  - Return typed `OverpassPOI[]` with OSM ID, name, coords, tags
- [ ] Build `lib/apis/wikipedia.ts`:
  - Given a place name, fetch the Wikipedia summary section
  - Also fetch Wikivoyage article if it exists
  - Cache results in Redis (TTL: 7 days)
- [ ] Build `lib/apis/mapbox.ts`:
  - Geocoding function: place name → coordinates + bounding box
  - Directions function: ordered list of coordinates → route polyline + leg durations
  - Isochrone function: origin + duration → reachability polygon
  - Static map image URL generator for stop thumbnails
- [ ] Store fetched POIs in PostgreSQL `pois` table (upsert by osm_id)
- [ ] Create tRPC procedure `trip.getPOIsForDestination` — returns raw POI list with Wikipedia summaries
- [ ] Display raw POIs as markers on the map (no curation yet)
- [ ] Add drive-time display between destination and each POI

**Deliverable:** For "Lindau", the system retrieves 40-60 raw POIs (castles, museums, historic sites) with Wikipedia summaries, displayed as markers on the map with drive times.

---

## Phase 3 — Claude AI Integration (Core Feature)

**Goal:** Claude transforms raw data into a curated, narrated route. This is the heart of the product.

### Tasks

**Orchestration Layer**
- [ ] Build `lib/ai/orchestrator.ts` with two-phase generation:
  - Phase 1: structured JSON route via Claude tool use
  - Phase 2: streaming narrative content per stop
- [ ] Build `lib/ai/prompts.ts`:
  - System prompt with user profile (Munich, baby, history/castle/museum interests, non-touristy)
  - POI curation prompt (input: 50 POIs → output: top 8-12 with ordering rationale)
  - Per-stop narrative prompt (historical overview, hidden gems, local tips, baby logistics)
  - Hotel area recommendation prompt
- [ ] Build `lib/ai/tools.ts` — Claude tool definitions:
  - `generate_route` tool: enforces typed JSON schema for the full route structure
  - `score_poi` tool: scores POI baby-friendliness and touristic-ness
- [ ] Use `claude-sonnet-4-6` for narrative generation (streaming)
- [ ] Use `claude-haiku-4-5` for POI curation (fast, cheap)

**API & Streaming**
- [ ] Build `app/api/generate/route.ts` — SSE endpoint that:
  1. Enqueues BullMQ job
  2. Streams job progress events back to client
  3. Streams Claude narrative chunks as they arrive
- [ ] BullMQ job: orchestrates Phase 1 + Phase 2, writes result to PostgreSQL
- [ ] Redis caching: key = `{destination_hash}:{user_profile_hash}`, TTL 7 days
- [ ] Rate limiting: 5 generations per user per day

**Frontend**
- [ ] "Generate Trip" button triggers SSE stream
- [ ] Progress indicator while generating (map loads first, then cards stream in)
- [ ] Stop cards with: name, category badge, visit duration, baby score, narrative text
- [ ] "Hidden Gems" section with distinct card style for insider tips
- [ ] Route polyline drawn on map connecting all stops in order
- [ ] Stop markers on map; click marker to jump to its card

**Persistence**
- [ ] Save generated trip to `trips` + `stops` tables
- [ ] Generate `share_token` UUID for each trip
- [ ] `trip/[id]` page — view a saved trip by its UUID (for shared links)

**Deliverable:** Full AI-generated route for "Lindau" with historical narrative, hidden gems, and baby logistics — streamed in real time. Trip is saveable and shareable via URL.

---

## Phase 4 — Hotels, Hikes, and UI Polish

**Goal:** Complete the feature set. Add practical travel logistics and make the UI compelling.

### Tasks

**Hotels**
- [ ] Build `lib/apis/booking.ts`:
  - Search hotels near destination coordinates
  - Filter: `crib_available`, `parking`, sorted by `property_type` (prefer Gasthöfe, Pension, boutique)
  - Return typed `Hotel[]` with price, coordinates, amenities
- [ ] Claude scores each hotel's "local character" from its description (1-5) via haiku
- [ ] Display hotel cards in a dedicated section: name, price, baby amenities, local character badge
- [ ] Map markers for recommended hotels (distinct style from POI markers)

**Hikes**
- [ ] Build `lib/apis/komoot.ts`:
  - Search hikes within 25km of destination
  - Return: name, distance, elevation gain, difficulty, surface type
- [ ] Flag hikes as `pushchair_friendly` (paved/gravel, < 5% grade) or `baby_carrier_feasible` (< moderate difficulty)
- [ ] Display hike cards with difficulty, distance, elevation, baby-compatibility badge
- [ ] Link to Komoot route page

**UI Polish**
- [ ] Mobile-responsive layout (375px breakpoint — parents use phones)
- [ ] Swipeable stop cards on mobile
- [ ] Print stylesheet — clean A4 itinerary layout
- [ ] PDF export button (React-PDF or browser print)
- [ ] Map style toggle: satellite vs streets
- [ ] Weather widget for destination dates (Open-Meteo API)
- [ ] Skeleton loaders during generation (not a blank screen)
- [ ] Error states with retry for each section
- [ ] Open Graph meta tags for shared trip URLs

**Deliverable:** Feature-complete Agugagatada Travel. User can plan a full trip to Lindau with curated stops, historical narrative, hidden gems, family-friendly hotels, and annotated hike recommendations.

---

## Phase 5 — Multi-Day Trips, User Accounts, Production Hardening

**Goal:** Expand beyond day trips, add user accounts, harden for real usage.

### Tasks

**Multi-Day Planning**
- [ ] UI: trip duration selector (1 day / weekend / 3-5 days)
- [ ] Orchestrator extension: group stops into days with logical geographic clustering
- [ ] Day-by-day itinerary view with per-day map focus
- [ ] Accommodation suggestions between days (not just at destination)

**User Accounts**
- [ ] Auth with NextAuth.js (Google + email magic link)
- [ ] User profile page: set home city, interests, baby age
- [ ] "My Trips" page — saved itineraries
- [ ] Feedback on stops: thumbs up/down, "too touristy", "loved this"
- [ ] Feedback stored in DB; future generations for same user deprioritize disliked categories

**Production Hardening**
- [ ] Sentry error tracking (frontend + backend)
- [ ] Structured logging with Pino
- [ ] Retry logic with exponential backoff for all external API calls
- [ ] Circuit breaker pattern: if Overpass is down, degrade gracefully
- [ ] Rate limit UI feedback: "You've used 5/5 generations today"
- [ ] Cost dashboard: track Claude API spend per trip generation
- [ ] Cloudflare CDN for static map images
- [ ] Database connection pooling with PgBouncer
- [ ] E2E tests with Playwright for the happy path (destination → generated trip)
- [ ] Load test: 10 concurrent generations

**Deliverable:** Production-ready application. User accounts, multi-day trips, feedback loop, monitoring, error handling.

---

## API Keys Needed Before Starting

Before Phase 1, obtain:
1. **Anthropic API key** — https://console.anthropic.com
2. **Mapbox token** — https://account.mapbox.com (free tier: 50k geocodes/mo)
3. **PostgreSQL** — Railway or Supabase (PostGIS support required)
4. **Redis** — Railway or Upstash

Before Phase 4, obtain:
5. **Booking.com Affiliate** — apply at booking.com affiliate program
6. **Komoot** — check their developer docs for API access

---

## Key Architecture Decisions

1. **Two-phase Claude** (structured JSON → streaming narrative) — the route structure is machine-readable for the map; the narrative is human-readable for the cards. Never mix them.

2. **Overpass API as POI backbone** — it has the long tail of obscure castles and local museums that commercial POI databases miss. This is what enables non-touristy recommendations.

3. **PostGIS for spatial queries** — never do radius math in JavaScript. `ST_DWithin` is the right tool.

4. **Cache Claude aggressively** — the Munich-to-Lindau route will be requested many times. Generate once, serve many times. 7-day TTL is appropriate since POI data doesn't change frequently.

5. **Baby-friendliness is a first-class concern** — not a filter or badge added at the end, but scored at the Claude phase and present in every stop card, hike card, and hotel card from the start.

---

## Definition of Done (per phase)

A phase is complete when:
- All tasks above are checked off
- The feature works end-to-end for the "Lindau" test destination
- No TypeScript errors (`tsc --noEmit` passes)
- The app is deployed to Vercel and accessible
- Environment variables are documented in `.env.example`
