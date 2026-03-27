# Agugagatada Travel — Claude Code Guide

## Project Overview

**Agugagatada Travel** is an AI-powered travel route planner for curious families. The user enters a destination and receives a curated itinerary with historical context, hidden gems, hotel recommendations, and hike suggestions — all baby-friendly aware.

**Target user:** Family based in Munich with a young baby. Interests: history, scientific museums, old castles, non-touristy places.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Server components + streaming SSE support |
| Styling | Tailwind CSS + shadcn/ui | Fast iteration, accessible components |
| Maps | Mapbox GL JS | Custom styling, route polylines, free tier |
| State | Zustand | Lightweight trip state across panels |
| API layer | tRPC | End-to-end type safety, streaming support |
| Database | PostgreSQL + PostGIS + Prisma | Geospatial queries (radius search, route snapping) |
| Cache / Queue | Redis + BullMQ | Cache Claude responses, async job queue for generation |
| AI | Anthropic Claude API | Route curation + streaming narrative content |
| Deployment | Vercel (frontend) + Railway/Render (Postgres + Redis) | |

---

## Architecture

### Two-Phase Claude Generation

Route generation uses Claude in two distinct phases:

1. **Structured Phase** — Claude receives assembled context (POIs from Overpass, drive times from Mapbox, Wikipedia summaries) and returns a **JSON route** via tool use. This defines stop ordering, timing, baby-friendly scores.

2. **Narrative Phase** — Claude streams rich human-readable content for each stop: historical overview, hidden gems, local tips. Streams directly to the frontend via SSE.

### External APIs

| API | Purpose |
|---|---|
| Mapbox | Geocoding, Directions, Isochrone, Static Maps |
| Overpass (OpenStreetMap) | Free POI discovery — castles, museums, historic sites |
| Wikipedia/Wikivoyage | Historical context injected into Claude prompts |
| OpenStreetMap Overpass API | Hiking routes (route=hiking relations) with difficulty (sac_scale), distance, elevation |
| OpenTopoData | Elevation profiles for hiking routes — EU-DEM dataset, free |
| Booking.com Affiliate | Hotel recommendations filtered for families |
| Open-Meteo | Free weather data for the destination |

### Data Flow

```
User input: "Lindau" + dates
    → Mapbox geocode
    → Overpass POI query (30-50km radius)
    → Wikipedia summaries for top POIs
    → Mapbox drive-time matrix between POIs
    → Claude Phase 1: curate + structure JSON route
    → Claude Phase 2: stream narrative per stop
    → Parallel: Overpass hiking routes + Booking.com hotels
    → Persist trip to PostgreSQL
    → Stream results to frontend via SSE
```

---

## Project Structure

```
agugagatada_travel/
├── app/                        # Next.js App Router
│   ├── (home)/                 # Landing page
│   ├── trip/[id]/              # Trip detail page
│   └── api/
│       ├── trpc/[trpc]/        # tRPC entry point
│       └── generate/           # SSE streaming endpoint
├── components/
│   ├── map/                    # Mapbox GL components
│   ├── trip/                   # Trip cards, stop details
│   └── ui/                     # shadcn/ui base components
├── lib/
│   ├── ai/
│   │   ├── orchestrator.ts     # Two-phase Claude logic
│   │   ├── prompts.ts          # System + generation prompts
│   │   └── tools.ts            # Claude tool definitions
│   ├── apis/
│   │   ├── mapbox.ts
│   │   ├── overpass.ts
│   │   ├── wikipedia.ts
│   │   ├── opentopodata.ts
│   │   └── booking.ts
│   ├── queue/
│   │   └── jobs.ts             # BullMQ job definitions
│   └── cache/
│       └── redis.ts
├── prisma/
│   └── schema.prisma
├── server/
│   └── trpc/                   # tRPC routers
├── store/                      # Zustand stores
└── types/                      # Shared TypeScript types
```

---

## Database Schema (Key Tables)

- **users** — id, home_city, preferences (JSONB with interests, baby_age_months, languages)
- **trips** — id, user_id, destination_name, destination_coords (PostGIS POINT), share_token, status
- **stops** — id, trip_id, sequence_order, name, coords, category, baby_friendly_score, narrative_content, hidden_gems_content
- **pois** — id, osm_id, name, coords, category, wikipedia_summary, raw_tags — cached Overpass/Wikipedia data
- **hike_routes** — id, trip_id, difficulty, pushchair_friendly, baby_carrier_feasible
- **hotels** — id, trip_id, name, has_crib, has_parking, local_character_score

---

## Claude API Usage

### Model Selection
- **claude-sonnet-4-6** — narrative generation (streaming, long-form)
- **claude-haiku-4-5** — fast tasks: POI curation, categorization, scoring

### Prompt Scripts

The prompts used are (implement in `lib/ai/prompts.ts`):

| Prompt | Model | Purpose |
|---|---|---|
| `SYSTEM_PROMPT` | all calls | User profile, tone, baby-friendly rules |
| `POI_CURATION` | haiku | 50 raw POIs → 10 curated stops |
| `ROUTE_STRUCTURE_TOOL` | sonnet | Structured JSON route via tool use |
| `STOP_NARRATIVE` | sonnet (streaming) | Per-stop historical narrative + local tips |
| `TRIP_INTRODUCTION` | sonnet (streaming) | Opening paragraph for the trip page |
| `HOTEL_SCORING` | haiku | Local character score for Booking.com hotels |
| `HIKE_RECOMMENDATION` | sonnet | 3 hikes selected + annotated for family |
| `DAILY_SUMMARY` | haiku | One-line day summaries for multi-day trips |

Implementation: `lib/ai/prompts.ts` exports each as a typed function that accepts variables and returns the filled string.

### Response Caching
Claude responses are cached in Redis keyed by `{destination_hash}:{user_profile_hash}` with a 7-day TTL. Never regenerate what's already been generated for the same destination + profile combination.

### Cost Controls
- Use haiku for POI curation (50+ POIs → top 8-12)
- Cache aggressively — popular destinations regenerate expensively
- Rate limit: 5 route generations per user per day

---

## Coding Conventions

- All API clients go in `lib/apis/` as singleton modules
- All Claude prompts are centralized in `lib/ai/prompts.ts` — never inline prompts in components
- All geospatial operations use PostGIS; never do radius math in application code
- External API responses are always cached in Redis before use
- TypeScript strict mode — no `any`, no `as unknown as`
- Server components by default; only use `"use client"` when necessary (map, interactive forms)
- Environment variables validated at startup via `zod` in `lib/env.ts`

---

## Environment Variables

```env
# Anthropic
ANTHROPIC_API_KEY=

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=
MAPBOX_SECRET_TOKEN=

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Booking.com
BOOKING_AFFILIATE_ID=
BOOKING_API_KEY=

# Outdooractive (optional commercial alternative for hiking content)
# OUTDOORACTIVE_API_KEY=
```

---

## Phase Reference

Five phases, each delivering a working, demonstrable product:

- **Phase 1** — Skeleton + Mapbox geocoding
- **Phase 2** — Overpass + Wikipedia data pipeline
- **Phase 3** — Claude AI integration (core feature)
- **Phase 4** — Hotels, hikes, UI polish
- **Phase 5** — Multi-day trips, user accounts, production hardening
