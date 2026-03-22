# Agugagatada Travel

AI-powered family travel route planner — built for a family from Munich with a young baby who loves history, castles, science museums, and non-touristy places.

Enter a destination, get a curated itinerary with historical narrative, hidden gems, family-friendly hotels, and hike recommendations. Baby-friendly throughout.

## What's here

| File | Purpose |
|---|---|
| `CLAUDE.md` | Architecture, tech stack, coding conventions |
| `PLAN.md` | 5-phase implementation plan with task checklists |
| `PROMPTS.md` | Full AI prompt scripts for all generation steps |
| `data/` | Structured trip JSON files (Berchtesgaden, Bodensee) |
| `preview/` | HTML previews — Komoot-style trip pages + Route Composer UI |

## Previews

Open any file in `preview/` directly in a browser — no build step needed.

- `berchtesgaden.html` — full trip plan, interactive map
- `bodensee.html` — full trip plan, interactive map
- `route-composer.html` — interactive route builder with detour cards

## Stack (planned)

Next.js · TypeScript · Tailwind · tRPC · PostgreSQL + PostGIS · Redis · Mapbox · Claude API

## Domain

[agugagatada.travel](https://agugagatada.travel)
