# Agugagatada

Two small things for families travelling with young children. Both written by hand, both open in any browser, both work without apps, accounts, or algorithms.

## 1. Journal builder — the current work

### The real problem

You come back from a day trip with 40 photos, no energy, and family on three continents. Instagram is a time cost — and in Russia it's blocked; Telegram is restricted. WhatsApp photo dumps fade into the chat stream. Google Photos albums look generic. A proper blog is an hour's work.

What's missing: a five-minute way to turn *today* into a keepsake you can send to grandma on any platform, in any country, that she can open without installing anything.

### What this is

A browser tool that takes:

- a messy description of what happened (typos fine),
- a GPX track from your watch,
- 1–50 photos (HEIC OK),

and produces a single self-contained HTML journal — photos embedded, editorial text in EN/RU/DE, a map of the walk — that opens anywhere, needs no account, and can be shared by email, WhatsApp, AirDrop, or anything else.

Open: `docs/builder.html`

### Editorial laws

- **Never invent facts.** If the user didn't say it, the GPX doesn't show it, and it isn't visible in a photo, it doesn't appear on the page.
- **Keep the user's voice.** Polish ≠ rewrite into magazine prose.
- **User sees the output before sharing.** Review is load-bearing, not a nice-to-have.

### Previewing the template without an LLM run

`docs/journal-preview.html` — renders the template against an inline fixture. Useful for iterating on layout, captions, and trilingual copy without burning tokens.

For end-to-end runs with real photos: drop them into `fixtures/` (gitignored) and pick them via the builder form. Nothing in `fixtures/` is tracked.

## 2. Destination guides — the older half

Eight hand-curated day trips from Munich with walking routes, history notes, hikes, and family-friendly hotels.

| Destination | Drive from Munich |
|---|---|
| Bamberg | ~2h 10m |
| Berchtesgaden | ~1h 45m |
| Bodensee | ~1h 50m |
| Eichstätt | ~1h 15m |
| Nuremberg | ~1h 40m |
| Passau | ~1h 50m |
| Regensburg | ~1h 35m |
| Rothenburg ob der Tauber | ~2h 30m |

Open: `docs/index.html`.
Hosted at [agugagatada.travel](https://agugagatada.travel) via GitHub Pages.

## Project structure

```
data/         # Destination JSON — one file per trip
docs/         # All static HTML — served by GitHub Pages
  builder/      # Journal builder modules (GPX, EXIF, HEIC, LLM, prompts)
  *.html        # Destination pages + index + journal builder + preview
scripts/      # Dev tooling (JSON schema check, snapshot helper)
fixtures/     # Gitignored — personal photos, GPX, local preview output
```

## Stack

Vanilla HTML · CSS custom properties · Leaflet.js · JSON. No frameworks, no npm, no build step.

The journal builder adds Anthropic Claude (user supplies an API key locally in `docs/builder/.key.js`, gitignored), browser-native EXIF/HEIC decoding, and client-side GPX parsing.

## Contributing

Codebase conventions live in `CLAUDE.md`.
