# Agugagatada Travel

AI-powered family travel route planner — built for a family from Munich with a young baby who loves history, castles, science museums, and non-touristy places.

Enter a destination, get a curated itinerary with historical narrative, hidden gems, family-friendly hotels, and hike recommendations. Baby-friendly throughout.

## What's here

| File/Dir | Purpose |
|---|---|
| `CLAUDE.md` | Architecture, tech stack, coding conventions |
| `data/` | Structured trip JSON files (7 destinations) |
| `preview/` | Static HTML previews — Komoot-style trip pages |

## Destinations

Eight day-trip itineraries from Munich, all with stops, hikes, hotels, and detour recommendations:

| Destination | Drive from Munich | Theme |
|---|---|---|
| Bamberg | ~2h | UNESCO old town, smoky beer, prince-bishops |
| Berchtesgaden | ~2h | Alpine drama, Eagle's Nest, salt mines |
| Bodensee | ~2h | Three-country lake, island monastery, apple country |
| Eichstätt | ~1h 30m | Baroque bishop's seat, dinosaur fossils, Altmühltal |
| Nuremberg | ~1h | Imperial city, medieval crime museum, Albrecht Dürer |
| Passau | ~2h 15m | Three-river city, organ capital, fortress on a cliff |
| Regensburg | ~1h 30m | Rome on the Danube, Holy Roman Empire parliament, Walhalla |
| Rothenburg ob der Tauber | ~2h 30m | Germany's most intact medieval walled town, Riemenschneider altar, Meistertrunk legend |

## Previews

Open any file in `preview/` directly in a browser — no build step needed.

- `index.html` — destination cards landing page
- `bamberg.html`, `berchtesgaden.html`, `bodensee.html` … — full trip pages with interactive maps
- `route-composer.html` — interactive route builder mockup

## Stack (planned)

Next.js · TypeScript · Tailwind · tRPC · PostgreSQL + PostGIS · Redis · Mapbox · Claude API

## Domain

[agugagatada.travel](https://agugagatada.travel)
