# Journal Builder — MVP Execution Plan

**The idea in one sentence:** a page where the user uploads photos, a GPX track, and a short story — one LLM call turns it into a polished journal styled like `docs/journal-mockup.html`, downloaded as a single HTML file.

See `BUILDER_PLAN.md` for deep rationale, edge-case discussion, and post-MVP roadmap. This file is the execution layer — what we build *now*.

---

## 1. Goal

Ship one real Bad Tölz journal to mom in Russia over Telegram. She opens it on iPad, switches to Russian, reads to the end. That's validation. Everything below serves that test.

**Done when all five hold:**
- One form → one "Generate" click → one downloaded HTML file.
- Output file ≤ 10 MB, self-contained (only Leaflet + Google Fonts from CDN).
- Opens cleanly in Chrome, Safari, iOS Safari, iOS Telegram in-app browser.
- EN / RU / DE language switch in the output works.
- Polished prose, not raw input; not translationese in RU.

---

## 2. Locked decisions

- **Design:** `docs/journal-mockup.html` is canonical. Fraunces + Inter, cream `#FAF6F0`, navy `#1B3A5C`, warm `#B8623C`. `journal/badtoelz_fieldnotes.html` is a design reference, not a second template.
- **Validation trip:** Bad Tölz. Text already drafted in `journal/badtoelz_fieldnotes.html`.
- **API key:** hardcoded in a gitignored `docs/builder/.key.js` for MVP. Proxy backend for future users comes post-MVP, once the product works.

---

## 3. The flow

```
┌──────────────────┐
│  docs/builder    │
│     .html        │   1. User fills form: title, location, date,
│                  │      family context, story, photos, GPX.
│   (one form)     │
└────────┬─────────┘
         │  2. Client-side: HEIC → JPEG → downscale → base64;
         │     read EXIF timestamps + GPS; parse GPX;
         │     compute distance/duration/polyline.
         ▼
┌──────────────────┐
│  ONE Claude call │   3. Sonnet 4.6. Input: text + photo metadata
│  (Sonnet 4.6)    │      (timestamps, GPS, filenames — NOT pixels)
│                  │      + family context. Returns structured JSON:
│                  │      polished opening/closing/tagline, per-photo
│                  │      captions + chapter assignment, "about this
│                  │      place", RU + DE translations of everything.
└────────┬─────────┘
         │  4. Client-side: plug JSON + photos + track into
         │     renderJournal(data) → full HTML string.
         ▼
┌──────────────────┐
│  Download .html  │   5. Blob download. User sends it over Telegram.
└──────────────────┘
```

No proxy. No preview iframe. No per-field buttons. No diff UI. No draft autosave (single session; if the browser crashes, refill the form — MVP).

---

## 4. The LLM call — the contract

One call, structured JSON in and out. Model: `claude-sonnet-4-6`. Expected cost: ~$0.10–0.15 per journal.

### Input the frontend sends

```json
{
  "trip": {
    "title": "A morning in Bad Tölz",
    "location": "Bad Tölz, Bavaria",
    "date": "2026-04-19",
    "source_lang": "en"
  },
  "family": {
    "who_came": "the three of us + Oma",
    "carrier": true,
    "stroller": false,
    "raw_notes": "kid got tired around 2pm, ate ice cream at the market"
  },
  "story_raw": "we hiked in bad tōlz on saturday. wax fugures were waiting for us...",
  "photos": [
    { "id": "p01", "filename": "IMG_1234.heic", "timestamp": "2026-04-19T09:42:00", "coord": [47.76, 11.56] },
    { "id": "p02", "filename": "IMG_1235.heic", "timestamp": "2026-04-19T10:15:00", "coord": null }
  ],
  "track": { "distance_km": 6.2, "duration_min": 145 }
}
```

### Structured JSON Claude returns

```json
{
  "tagline":  { "en": "...", "ru": "...", "de": "..." },
  "opening":  { "en": "...", "ru": "...", "de": "..." },
  "closing":  { "en": "...", "ru": "...", "de": "..." },
  "family_notes": {
    "en": ["Pushchair-friendly until the market steps", "..."],
    "ru": [...],
    "de": [...]
  },
  "about_place": { "en": "...", "ru": "...", "de": "..." },
  "photos": [
    { "id": "p01", "chapter": "early",  "caption": { "en": "...", "ru": "...", "de": "..." } },
    { "id": "p02", "chapter": "midday", "caption": { "en": "...", "ru": "...", "de": "..." } }
  ]
}
```

### System prompt (v1, captured in `docs/builder/prompts.js`)

Key instructions:
- Warm editorial register. Preserve author's voice and facts. Never invent people, places, or events.
- Fix typos, tighten run-ons. Small editorial colour only where strongly implied.
- Keep proper nouns untranslated (Bad Tölz, Marktstraße, Walchensee).
- RU must read as native Russian, not translationese. DE the same.
- `chapter` ∈ `early | midday | afternoon | evening`, derived from photo timestamps.
- Captions ≤ 120 chars. Family notes as a flat list of short strings.
- Return **only** the JSON object, no preamble.

Validation on response: required keys present; photo array length + ids match input; retry once on malformed JSON.

---

## 5. What we reuse

| Asset | Used as |
|---|---|
| `docs/journal-mockup.html` | Source for `renderJournal(data)`. |
| `docs/gpx/*.gpx` | Parser test fixtures. |
| Leaflet / CDN pattern from destination pages | Reused in `renderJournal` map section. |
| `scripts/snapshot.sh` | Pre-edit safety before risky refactors. |

Nothing else is imported from the static site. Builder has its own styles; journal has its own palette.

---

## 6. Phase 1 — build (one branch, one PR)

**Branch:** `feat-builder-mvp`, off `origin/main`. First commit: stage `BUILDER_PLAN.md`, `MVP_EXECUTION.md`, `docs/journal-mockup.html`, `journal/badtoelz_fieldnotes.html` as baseline.

**Sub-tasks, in order:**

**1a. Extract template (~2–3 hrs).** Move markup + CSS from `docs/journal-mockup.html` into `docs/journal-template.js` exporting `window.renderJournal(data)` → full HTML string. Regenerate the mockup from a sample fixture; must render visually unchanged.

**1b. Build form page (~2–3 hrs).** `docs/builder.html` + `docs/builder.css` (utilitarian styles) + `docs/builder.js`. Fields: title, location, date, source-language picker (EN/RU/DE), family context (who came, carrier/stroller toggles, raw notes), story textarea, multi-photo upload, GPX upload. "Generate" button, disabled until required fields filled.

**1c. Wire the pipeline (~3–4 hrs).** Client-side modules in `docs/builder/`:
- `heic.js` — lazy-load `heic2any`, convert if needed.
- `exif.js` — `exifr` for timestamp/GPS/orientation.
- `image.js` — canvas downscale with manual orientation rotation → 1600px max edge → JPEG q75 → base64.
- `gpx.js` — hand-rolled XML parse → distance (haversine) + duration + ≤200-point decimated polyline.
- `llm.js` — one `generate(input)` function. Reads key from `.key.js`. Calls Sonnet 4.6 directly with `anthropic-dangerous-direct-browser-access: true`. Returns parsed JSON.
- `prompts.js` — versioned system prompt + input-JSON template.

On "Generate": run photos through pipeline sequentially (not parallel — mobile Safari OOM risk), parse GPX, build the input JSON, call `llm.generate()`, merge response with photos + track data, call `renderJournal()`, Blob download as `journal-{slug}-{date}.html`.

**1d. Smoke test (~1 hr).** Run the real Bad Tölz text from `journal/badtoelz_fieldnotes.html` + a small set of test photos + a GPX from `docs/gpx/`. Open output file in Chrome. Confirm: journal renders, language switch works, map renders, no broken layout.

**Key constraints:**
- Process photos sequentially. Release Blob URLs after base64 conversion.
- Running file-size meter in form header; soft-warn at 8 MB, hard-stop at 15 MB.
- `.key.js` is gitignored. Format: `window.CLAUDE_API_KEY = 'sk-ant-...';`. Loaded before `builder.js`.
- CORS header `anthropic-dangerous-direct-browser-access: true` on the Claude call. Noted: key is visible in DevTools. Fine for personal MVP use; replaced by proxy post-MVP.

**Acceptance for Phase 1:** form fills → Generate → downloaded file opens in Chrome, looks like the mockup with Bad Tölz content, RU/DE switch works.

### Claude Code command

> Task: build the journal builder MVP per `MVP_EXECUTION.md` §6. Read that section, `BUILDER_PLAN.md` §4 (data model), and `docs/journal-mockup.html` (the design to preserve) before touching code.
>
> Before any code: create branch `feat-builder-mvp` off `origin/main`, stage and commit `BUILDER_PLAN.md`, `MVP_EXECUTION.md`, `docs/journal-mockup.html`, and `journal/badtoelz_fieldnotes.html` as the baseline. Add `docs/builder/.key.js` to `.gitignore`.
>
> Execute sub-tasks 1a → 1d sequentially, committing at each boundary:
> - 1a: template extraction. Commit: "feat(builder): extract journal template into renderJournal()". Regenerated `journal-mockup.html` must be visually identical to the committed baseline.
> - 1b: form page. Commit: "feat(builder): form UI".
> - 1c: the pipeline + LLM glue. Commit: "feat(builder): photo/GPX pipeline + Claude generate call".
> - 1d: smoke test with Bad Tölz. Commit the test fixture used.
>
> Process photos sequentially, not in parallel. Lazy-load `heic2any`. Use raw `fetch()` for the Claude call, not the SDK. The `generate()` function returns parsed JSON; validate photo-id match + required keys; retry once on malformed JSON. Report total tokens + cost after smoke test.
>
> Do not add a live-preview iframe, per-field polish buttons, draft autosave, or any stale-tracking UI. One form → one Generate → one download.
>
> When done, push the branch and open a PR. The PR body should list: final file-size of a Bad Tölz output, total LLM cost for one generate call, any fixture in `docs/gpx/` that didn't parse cleanly.

---

## 7. Phase 2 — real-trip validation (not a coding phase)

1. Run the builder with the Bad Tölz GPX, real HEIC photos, and your raw text.
2. Open the downloaded file on: Chrome desktop, Safari desktop, iOS Safari, iOS Telegram in-app browser.
3. Send over Telegram to mom. Don't pre-warn her.
4. Later, ask an open question. Note if she forwards it.

**Write up** in a short `FEEDBACK.md`: wall-clock to generate, any photo rotated wrong, any RU translationese she flagged, file size, anything confusing in the form. That list defines post-MVP priorities.

---

## 8. Risks worth tracking

| Risk | Mitigation |
|---|---|
| RU output reads as translationese. | Prompt emphasises native editorial register. If it still reads clunky after Bad Tölz run, escalate: add a second "RU editor" pass, or swap to a Russian-native-speaker prompt. |
| Claude invents a fact (a specific museum name, a dish). | Prompt forbids it + acceptance test explicitly checks. User eyeballs every output before sending. |
| HEIC conversion OOM on mobile Safari. | Sequential processing, Blob URL release. Hard-cap 50 photos. |
| CARTO tiles blocked for mom in Russia → blank map. | Known risk; accept for MVP. Post-MVP lever: pre-rendered static-image map. |
| API key extractable from DevTools. | Fine for personal MVP use. Post-MVP: proxy backend before sharing the URL beyond your own machines. |
| Claude returns invalid JSON or mismatched photo-ids. | One retry; on second failure, show a clear error to the user with a "copy raw response" button for debugging. |

---

## 9. Post-MVP levers (deferred)

Only if Phase 2 validation succeeds:

- **Proxy backend** (Cloudflare Worker, ~50 lines) so friends can use it without your key leaking.
- **Instagram carousel pack** (1080×1350 slides + cover image, zipped) — same data, different renderer.
- **Drag-to-position photos** for shots without EXIF GPS.
- **GPX privacy trim** — slider to cut home-address leakage at track start/end.
- **Offline map snapshot mode** — zero external requests at view time; solves Russia-tile risk.
- **Browser-side Gemma 4 / TranslateGemma** — only if Claude costs ever flip (they won't at realistic usage).

All documented in `BUILDER_PLAN.md` §6 M2–M3.
