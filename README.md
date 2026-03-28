# Agugagatada Travel

Hand-curated day trips from Munich — built for a family with a young baby who loves history, castles, and non-touristy places.

Eight itineraries, each with a walking route, historical narrative, hidden gems, hike recommendations, and family-friendly hotels. No app, no accounts, no algorithms — just good trips, written by hand.

## Destinations

| Destination | Drive from Munich | Theme |
|---|---|---|
| Bamberg | ~2h 10m | UNESCO old town, smoky beer, prince-bishops |
| Berchtesgaden | ~1h 45m | Alpine drama, Eagle's Nest, salt mines |
| Bodensee | ~1h 50m | Three-country lake, island monastery, apple country |
| Eichstätt | ~1h 15m | Baroque bishop's seat, dinosaur fossils, Altmühltal |
| Nuremberg | ~1h 40m | Imperial city, medieval crime museum, Albrecht Dürer |
| Passau | ~1h 50m | Three-river city, organ capital, fortress on a cliff |
| Regensburg | ~1h 35m | Rome on the Danube, Holy Roman Empire parliament, Walhalla |
| Rothenburg ob der Tauber | ~2h 30m | Germany's most intact medieval walled town, Riemenschneider altar, Meistertrunk legend |

## What's here

| File/Dir | Purpose |
|---|---|
| `data/` | Structured trip data as JSON — one file per destination |
| `docs/` | Static HTML pages — served by GitHub Pages, open in any browser |
| `scripts/` | Dev tooling — `validate.js` checks JSON schema + file consistency |

## Running it

Open `docs/index.html` in a browser. That's it.

Hosted at [agugagatada.travel](https://agugagatada.travel) via GitHub Pages (served from `docs/` on `main`).

All maps use [Leaflet](https://leafletjs.com/) with OpenStreetMap tiles — no API keys needed.

## Stack

Vanilla HTML · CSS custom properties · Leaflet.js · JSON data files
