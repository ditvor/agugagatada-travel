# Journal Builder — Implementation Plan

A small web tool that turns one day's hike or outing into a beautiful, self-contained HTML page that can be shared with family or friends.

**Inputs:** GPX track + photos + a few paragraphs of writing + family context (who came, stroller/carrier).
**Output:** A single static HTML file the user can host or send by link.
**Output design:** Already validated — see `docs/journal-mockup.html` and `feedback_journal_design` in memory.

> Plan version 2 — incorporates web research on Gemma 4 (released April 2026), Anthropic CORS browser access, HEIC handling, IndexedDB constraints, and other gotchas surfaced after deeper review.

---

## 1. North star

One personal validation question first: **would the user, and a handful of other young families, actually use this after a real trip?**

Concrete success criteria for MVP:
- User produces one journal in **under 30 minutes** from a real trip (15 min target).
- Output file is **under 10 MB** (sendable on Telegram, WhatsApp, email).
- Mom in Russia opens the file from a Telegram message on iPad Safari → renders correctly, language switch works.
- User wants to make a second one within two weeks.
- One friend asks "how did you make that?" within four weeks.

---

## 2. Architecture overview

| Layer | Choice |
|---|---|
| Builder UI | Single static HTML page in `docs/builder.html` |
| Output | One self-contained HTML file (download, no hosting required) |
| Build step | None |
| Backend | None |
| Photo storage | Browser memory only; base64-inlined into output |
| Photo conversion | HEIC→JPEG via `heic2any` (~600 KB), client-side |
| EXIF reading | `exifr` (~10 KB) for timestamp / GPS / orientation |
| Image downscale | `<canvas>` to 1600 px max edge, JPEG q75, with manual orientation rotation |
| GPX parsing | Hand-rolled (~50 lines), pure XML walk |
| Map (builder + output) | Leaflet from CDN at view time + GPX track inlined as JS array |
| LLM (translation) | Hosted Claude Haiku 4.5, user key in browser |
| LLM (location context) | Hosted Claude Sonnet 4.6, user key in browser |
| Draft persistence | **IndexedDB** (NOT localStorage — photos exceed 5–10 MB localStorage cap) |
| Locale formatting | `Intl.NumberFormat` and `Intl.DateTimeFormat` (built into browsers) |

**Key constraint that drives everything:** the output is *one HTML file*. Photos must be downscaled aggressively before base64-inlining. Realistic budget: 25 photos × ~250 KB each ≈ 6 MB. Under Telegram's 2 GB limit and any email cap of 25 MB.

---

## 3. Project structure (new files)

```
agugagatada_travel/
├── docs/
│   ├── builder.html              # builder UI
│   ├── builder.css               # builder styles (separate from style.css)
│   ├── builder.js                # form, photo handling, GPX, LLM calls
│   ├── builder/
│   │   ├── exif.js               # exifr wrapper + orientation rotation
│   │   ├── heic.js               # heic2any wrapper, lazy-loaded only when needed
│   │   ├── gpx.js                # GPX parser
│   │   ├── image.js              # downscale, JPEG encode, base64
│   │   ├── llm.js                # Claude API calls (translate + describePlace)
│   │   ├── storage.js            # IndexedDB wrapper for drafts
│   │   └── i18n.js               # locale formatting helpers
│   ├── journal-template.js       # one function: data → full HTML string for output
│   ├── journal-mockup.html       # already exists — visual reference (will be regenerated from template)
│   └── ...existing files
├── BUILDER_PLAN.md               # this file
└── CLAUDE.md                     # update with builder conventions when MVP ships
```

The builder is its own self-contained tool, separate from the destination guide pages. It lives in the same repo because (a) it shares the design language, (b) GitHub Pages can serve both, (c) we can cross-link.

---

## 4. Data model

The structured data the builder collects, that gets fed into `journal-template.js`:

```js
{
  schemaVersion: 1,                   // for future migrations of saved drafts
  trip: {
    title:        string,             // "A morning by the lake"
    tagline:      string,             // one-line italic under title
    location:     string,             // "Walchensee, Bavaria"
    date:         "YYYY-MM-DD",
    sourceLang:   "en" | "ru" | "de", // language the user wrote in
    targetLangs:  ["ru", "de"],       // additional languages to render in output
  },
  family: {
    whoCame:      string,             // free-text: "three of us", "us and Oma"
    carrier:      boolean,
    stroller:     boolean,
    notes:        string[],           // bullet list of practical notes
  },
  story: {
    opening:      { en, ru, de },     // 1–3 paragraphs, source-lang filled, others LLM-translated
    closing:      { en, ru, de },     // single italic line
  },
  location_context: {                 // LLM-generated, all 3 langs in one call
    body:         { en, ru, de },     // 1–2 paragraphs about the place
  },
  track: {
    points:       [[lat, lon, ts], ...],  // parsed from GPX, decimated to ~200 points
    distance_km:  number,             // computed
    duration_min: number,             // computed from timestamps
    bbox:         [[s, w], [n, e]],
  },
  photos: [
    {
      id:         string,             // stable id within the page
      dataUrl:    string,             // base64 JPEG, downscaled, EXIF-rotated
      width:      number,             // post-rotation
      height:     number,             // post-rotation
      timestamp:  ISO string | null,  // from EXIF DateTimeOriginal
      coord:      [lat, lon] | null,  // from EXIF GPS, or set via drag-to-position (M2)
      caption:    { en, ru, de },     // optional, LLM-translated if sourceLang differs
      chapter:    "early" | "midday" | "afternoon" | "evening", // auto from timestamp
      orientation: "landscape" | "portrait",
      stale:      { ru: boolean, de: boolean },  // true if source caption edited after translation
    }
  ],
  translationStatus: {                // for UI hints
    opening:     { ru: "ok"|"stale"|"missing", de: "ok"|"stale"|"missing" },
    closing:     { ru: "...", de: "..." },
  },
}
```

---

## 5. LLM strategy — UPDATED with Gemma 4 findings

The user asked: real LLM, or something like Gemma running locally?

### Landscape as of April 2026

**Gemma 4** was released April 2, 2026 ([Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/gemma-4-available-on-google-cloud), [Hugging Face](https://huggingface.co/blog/gemma4)). Four sizes: 2B (edge), and up to 31B Dense / 26B MoE. 256K context, native vision/audio, 140+ languages, Apache 2.0. The 31B model competes with frontier closed models. Crucially, the **2B edge variant** is designed to run on-device — quantized, ~700 MB–1.2 GB.

**TranslateGemma** (Google, January 2026) — a translation-specialized family built on Gemma 3 (4B/12B/27B). Covers 55 languages including Russian. The 12B model outperforms Gemma 3 27B on WMT24++ — high-quality translation at edge-runnable size.

**Anthropic API browser access** is now supported via the `anthropic-dangerous-direct-browser-access: true` header ([Simon Willison, Aug 2024](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/)). The "dangerous" name is honest: anyone with access to the page or its network traffic can read the API key. For BYOK personal-use tools this is fine.

### Four real options now

| Option | Quality | Friction | Privacy | First-load weight | When |
|---|---|---|---|---|---|
| A. Hosted Claude (Haiku translate, Sonnet describe) | Best for editorial RU | Need API key | Story/captions sent | Zero | MVP |
| B. Hosted Gemini (Google's hosted Gemma) | Comparable to Claude | Need API key | Story/captions sent | Zero | Alternative MVP |
| C. Browser Gemma 4 2B (general) | Decent for translation, weaker for editorial register | None after first load | Full — text never leaves device | ~1 GB once | M3 |
| D. Browser TranslateGemma 4B (translation-only) | Excellent for translation | None after first load | Full | ~2 GB once | M3 |

### Recommendation

**MVP: Option A (hosted Claude with user-supplied key).** Reasoning:

1. **Russian editorial register is the load-bearing test.** Mom in Russia reading clunky machine-translated paragraphs erases the entire wedge. Claude (and TranslateGemma for translation specifically) handle this; small general-purpose browser models like Gemma 4 2B are noticeably weaker. We can ship Claude in 1 day; we can't ship browser TranslateGemma 4B in 1 day.
2. **The user himself is the first validation target.** He has API access already. Zero friction for him.
3. **The LLM is behind a 2-function interface (`translate()`, `describePlace()`).** Either backend can plug in later.

**Post-MVP: Option C or D as "no-key mode" for friend onboarding.** Once we want non-developer friends to try the tool without setting up an Anthropic key:

- **Option D (TranslateGemma 4B in browser)** is the strongest fit — purpose-built for translation, will produce excellent Russian, ~2 GB one-time download is acceptable for "make journals weekly" frequency. Privacy story is genuinely strong: "your photos and stories never leave your device."
- Pair with **Option C (Gemma 4 2B)** for the location-context generation, where some quality drop is tolerable.

This makes the privacy claim load-bearing for the brand: *"Your trip stays on your device."*

### Cost (Option A, per journal)

- Sonnet 4.6 for location context: 1 call, ~200 input + ~900 output × 3 langs in one response ≈ **~$0.05**
- Haiku 4.5 for translation (opening + closing + 25 captions, batched, × 2 target langs): ~4 calls ≈ **~$0.005**
- **~$0.06 per journal.** Negligible for personal use.

---

## 6. Phases of work

### M-1 — Template extraction (half day)

Goal: extract the visual template into a function so the rest of the work has a stable target.

Steps:
1. Move HTML/CSS/JS from `docs/journal-mockup.html` into `docs/journal-template.js` as a function `renderJournal(data) → htmlString`.
2. Regenerate `journal-mockup.html` from a sample data object — must be byte-identical (visually) to the current mockup.
3. Add a tiny `tests/template.html` page that calls `renderJournal()` with several sample data shapes (no photos / many photos / no GPS / portrait + landscape mix) — manual visual smoke test.

Acceptance: the existing mockup looks identical, but is now data-driven.

### M0 — Skeleton builder (no LLM, single language, ~2–3 days)

Goal: end-to-end builder that produces a real, beautiful, single-language journal. Validates the input UX and the file-generation pipeline.

Steps:
1. `docs/builder.html` skeleton — two-pane layout: form on left, live preview iframe on right.
2. Form fields: title, tagline, location, date, source-language picker, story (opening + closing), family context (who came, carrier/stroller toggles, notes).
3. **GPX upload** → parse → compute distance, duration, bbox → decimate to ~200 points → render small map preview in builder.
4. **Photo upload**:
   - HEIC detection → if HEIC, lazy-load `heic2any` → convert to JPEG.
   - Read EXIF (timestamp, GPS, orientation) via `exifr`.
   - Sort by EXIF timestamp (fallback: file modified date, then upload order).
   - **Manual EXIF orientation rotation** before downscale (canvas does NOT auto-rotate).
   - Downscale via `<canvas>` to 1600 px max edge, JPEG q75 → base64.
   - Show as thumbnails in builder.
5. **Photo reorder** — up/down arrows on each thumbnail (touch-friendly, simple). True drag-and-drop deferred to M2.
6. Per-photo caption fields (one textarea per photo, scrollable list).
7. Auto-chapter assignment (early / midday / afternoon / evening) from EXIF timestamps; user can override.
8. Live preview: re-render template into iframe via `srcdoc` on form change (debounced 500 ms).
9. **Locale-aware formatting** in template — `5.2 km` (en-GB) vs `5,2 km` (de-DE / ru-RU); date formatting via `Intl`.
10. "Download HTML" button — serializes template output, triggers blob download.
11. **Autosave draft to IndexedDB** on change (debounced 2 s); restore on load. One draft slot for MVP.
12. Big red "Clear draft" button with confirmation.

Acceptance: user takes a real GPX + 8 photos from a recent walk, fills the form, downloads the file, opens it locally, sends it over Telegram, opens it on phone — looks beautiful.

### M0.5 — Real-photo robustness (half day)

Run the builder against three real photo sets and fix what breaks:

1. iPhone HEIC photos exported via Photos app
2. Mixed JPEG / HEIC from a phone + a camera
3. Photos forwarded over WhatsApp (EXIF stripped)

Likely fixes:
- HEIC conversion edge cases
- EXIF orientation tag values 5–8 (mirrored rotations)
- No-EXIF photos → fall back to upload order, allow manual chapter assignment
- File size cap warning when total exceeds 8 MB

### M1 — LLM integration (1–2 days)

Steps:
1. **API key entry UI** — modal on first use, paste key, save to IndexedDB. Disclose: "Your key is stored only in your browser. Story text and captions are sent to Anthropic for translation. Photos are not." Format-validate `sk-ant-…`.
2. `llm.translate(text, from, to)` — Haiku 4.5 call with system prompt enforcing editorial register and paragraph preservation. Returns translated string.
3. `llm.translateBatch(items, from, to)` — for captions; sends a JSON list, validates response length matches input, retries on mismatch.
4. `llm.describePlace(name, date)` — Sonnet 4.6 call, returns `{ en, ru, de }` in a single response with structured output (saves 2 roundtrips).
5. UI: "Translate now" button per field; per-field "Regenerate" button. Spinner while in flight.
6. **Stale-translation handling** — if user edits a source field after translation, mark `translationStatus[field][lang] = "stale"` and show a small badge. Re-translate on demand.
7. Network-failure handling — retries with exponential backoff (3 attempts), clear error messages, never silently fail.
8. CORS header set on every request: `anthropic-dangerous-direct-browser-access: true`.
9. Output file gets the language switch we already designed in the mockup.

Acceptance: same trip as M0, now with full RU and DE versions. Mom in Russia receives the file, opens it, switches to Russian, reads → no clunky machine-translation feel.

### M2 — Magic + polish (3–5 days)

Steps:
1. **Drag-to-position photos on map** for shots without EXIF GPS. Photo strip below the map; drag a thumbnail onto the polyline. Desktop only.
2. **GPS auto-place** photos with EXIF GPS coordinates onto the map.
3. **True drag-and-drop reorder** of photo thumbnails (replaces the M0 up/down arrows; up/down arrows stay as fallback for touch).
4. **Photo lightbox** in the output — click any photo opens it full-screen with caption.
5. **Marker-to-photo navigation** in the output — clicking a map marker scrolls to that photo and vice versa.
6. **GPX privacy trim** — sliders to cut N metres from start/end of the track (avoids leaking home address).
7. **Map snapshot mode** (alternative to live tiles) — pre-render the map as a static SVG/PNG embedded in the output, no external requests at view time.
8. **Image quality presets** — small / medium / large with file-size estimate.
9. **"Publish to URL"** option — upload generated HTML to GitHub Gist or similar; return short shareable link. Solves the "Telegram file viewer is awkward" problem and gives non-Russia recipients an even smoother flow. (Confirm Russia accessibility before relying on it.)

Acceptance: the page feels *magical* the second time the user makes one — the photos snap into place by themselves, the chapters are right, the file is small, and a single "Share link" button gets the page to anyone.

### M3 — Browser-side LLM "no-key mode" (5–8 days, post-validation)

Only if M0–M2 prove the product works.

- Integrate WebLLM or Transformers.js
- Bundle TranslateGemma 4B (translation) and Gemma 4 2B (location context) as optional backends
- Add a model-download progress UI ("First-time setup, ~2 GB, one time only")
- Make this the default for new users; existing users keep their hosted key if set
- Brand line: **"Your trip stays on your device."**

### Post-MVP (M4+)

- Instagram export pack (1080×1350 carousel slides + cover image as zip)
- Theme/season variants
- Multi-day trips
- Embedded video clips
- Mobile/touch builder (separate problem)
- PDF export

---

## 7. Validations

| Field | Rule | If fails |
|---|---|---|
| GPX file | Valid XML; ≥ 1 `<trkpt>`; ≤ 5 MB | Reject with clear message |
| GPX timestamps | Warn if missing | Continue, disable auto-chapter |
| Photo file | Image MIME or HEIC; ≤ 20 MB pre-downscale | Reject with clear message |
| Photo total count | ≤ 50 | Reject 51st with message |
| Photo total (post-downscale) | Soft warn at 8 MB inlined, hard cap at 15 MB | Show running size meter |
| Title | 1–100 chars | Inline error |
| Tagline | 0–200 chars | Inline error |
| Location | 1–80 chars | Inline error |
| Date | Valid ISO date, not future, not before 2000 | Inline error |
| Story opening | 50–3000 chars | Inline character counter |
| Story closing | 0–200 chars | Inline counter |
| Captions | 0–200 chars each | Inline counter |
| API key | Format check `sk-ant-…`; length ≥ 40 | Inline error |
| Draft on load | If `schemaVersion` mismatch → migrate or warn | Don't crash |

All file processing happens client-side; reject + clear error message rather than silently dropping.

---

## 8. Security & privacy

This is a tool families use with photos of their children. Privacy is part of the brand promise.

| Concern | Decision |
|---|---|
| **Photos** | Never leave the browser. Base64-inlined into output file the user controls. |
| **GPX coordinates** | Stay in browser, embedded into output file. M2 adds privacy trim slider for home-address leakage at track endpoints. |
| **Story text** | Sent to Claude API for translation. Disclose explicitly in builder UI. |
| **API key** | Stored in IndexedDB only. Never logged. Never written into output HTML. Never sent to any server other than `api.anthropic.com`. |
| **Output HTML** | No analytics, no API keys, no third-party scripts other than Leaflet CDN + map tiles. |
| **Map tiles in output** | Output page loads tiles from CARTO at view time → recipients' IPs hit CARTO. Disclose. M2 offers fully offline alternative. |
| **No telemetry** | The builder collects nothing. Period. |
| **CSP-friendly output** | The output uses inline scripts/styles by necessity (single-file). Document this so users hosting on strict-CSP domains know. |
| **Source viewable** | Output is human-readable HTML — anyone receiving the file can inspect it, see what it loads, see there are no hidden trackers. This is a feature. |
| **CORS "dangerous" header** | We set `anthropic-dangerous-direct-browser-access: true`. Disclose in API key UI: "This tool sends translation requests directly from your browser to Anthropic. Your API key is visible to your browser's network tools — that's expected and normal for this kind of personal tool, but don't use this on a shared computer." |
| **Output never contains the API key** | Hard rule. Code review + automated check on output before download. |
| **Subresource Integrity for Leaflet** | Output should pin Leaflet to a specific version with SRI hash, so a compromised CDN can't inject scripts into recipients' viewing. |

A short **"What gets sent where"** disclosure will live as a visible link in the builder footer. Mom-tested wording.

---

## 9. Edge cases & gotchas

These are the things that bite when building this kind of tool. Calling them out so we don't trip on them.

### iPhone photos — HEIC

iPhones default to HEIC ("High Efficiency"). Browsers other than Safari can't decode it. iOS Safari auto-converts on `<input type="file">` upload (since iOS 14), but desktop Safari and all other desktop browsers do not. **MVP must include `heic2any` and convert client-side.**

### EXIF orientation rotation

Photos arrive with an Orientation tag (1–8). Browsers honour it for `<img>` tags, but `<canvas>.drawImage()` does NOT. Without manual rotation, every portrait photo from an iPhone gets downscaled rotated 90°. We must read the orientation tag and apply rotation in the canvas pipeline. Tested via: portrait iPhone shot → confirm output portrait orientation.

### EXIF stripping in messaging apps

Photos forwarded via WhatsApp / Telegram / Signal often have EXIF removed, including timestamp. Auto-sort by timestamp falls back gracefully to upload order. Auto-chapter assignment becomes manual. **Communicate this in the builder UI** so users understand why some photos can't be auto-placed.

### iOS Safari + Telegram in-app browser

Mom on iPad → tap .html attachment in Telegram → opens in Telegram's WKWebView. JS runs, CSS works, external resources load. **But** the first load is in-app, and some users may need to tap "Open in Safari" for full feature parity. Include a small "best viewed in Safari" hint at the top of the output for first-time recipients.

### localStorage size cap (~5–10 MB)

Photos blow this immediately. Use **IndexedDB** (typically ≥ 50% of free disk).

### Caption batching for translation

Naive: 25 captions × 2 langs = 50 API calls. Batched: 2 calls (one per target lang), each sending a JSON list, returning a JSON list. Validate response length matches input length; retry on mismatch.

### Stale translation marking

User edits source after translating → translations are now drift. Mark stale, prompt to re-translate. Don't auto-re-translate (token cost + race conditions).

### Locale-aware number/date formatting

Numbers: `5.2 km` (en) vs `5,2 km` (de/ru). Dates: `April 18, 2026` vs `18. April 2026` vs `18 апреля 2026`. Use `Intl.NumberFormat` and `Intl.DateTimeFormat` — built-in, zero deps.

### GPX with no timestamps

Some apps strip timestamps from GPX (privacy / file size). Auto-derived "duration" becomes unavailable. Show distance only. UI must handle this gracefully.

### GPX with thousands of points

A 50 km GPX may have 5,000+ trackpoints. Rendering all of them inline in the output is wasteful. **Decimate to ~200 points** with a Douglas-Peucker simplification (or just every-Nth-point). Visually identical, dramatically smaller file.

### CARTO basemap + Russia

CARTO is hosted on Cloudflare. Generally accessible from Russia, but not guaranteed. **Hard recommendation: build M2's offline-map mode early enough that we can swap it in if a recipient reports a blank map.**

### "Share link" via Gist + Russia

GitHub is intermittently restricted in Russia. Test from Russia before promising this as the primary distribution channel. The HTML file path stays as primary; the link path is a convenience layer.

### Race conditions

User edits while LLM call in flight: store the source text alongside the translation; if source changed by the time response arrives, mark stale rather than overwriting current state silently.

### Anthropic SDK vs raw fetch

The SDK adds ~50 KB. We need ~5 endpoints' worth of code. **Use raw `fetch()`** — fewer dependencies, easier to inspect, less attack surface for the API key.

---

## 10. Testing strategy

This is a static no-build project, so testing is mostly manual scenarios. Track them in a checklist file.

### Test matrix

| Scenario | Why |
|---|---|
| 8 iPhone JPEGs, all with GPS + timestamps | Happy path |
| 25 iPhone HEIC photos, mixed orientations | HEIC conversion + rotation |
| Mix of camera JPEG + phone HEIC + WhatsApp-stripped photos | Mixed-source resilience |
| Single photo, no GPS, no EXIF date | Worst-case input |
| 50-photo limit | Boundary check |
| GPX with no timestamps | Graceful degradation |
| GPX with 5,000 points | Decimation |
| GPX where start ≠ end (point-to-point hike) | Bbox correctness |
| Empty captions, partial captions | Output still looks good |
| Network failure mid-translation | Error recovery |
| Refresh during edit | Draft restoration |
| Export → re-open in Chrome / Safari / Firefox | Output portability |
| Export → open in iOS Telegram → in-app browser | Real delivery scenario |
| Export → open from iCloud Drive on iPad | Alternative delivery |
| Translate to RU → mom reads → asks "what does this mean" | Quality smoke test |

### Test runner

A simple `tests/template.html` that imports `journal-template.js`, renders 8–10 fixture data sets side-by-side. Manual visual diff. ~half a day to set up; saves hours later.

---

## 11. Browser support

| Target | Reason | Min version |
|---|---|---|
| Chrome 110+ | Builder primary | Modern CSS, IndexedDB, FileReader |
| Safari 16+ | Builder + output viewing on Mac/iPad | aspect-ratio, backdrop-filter |
| iOS Safari 16+ | Output viewing on iPhone/iPad (the actual delivery target) | Same |
| Firefox 110+ | Builder | Same |
| Telegram WebView (iOS/Android) | Output viewing in-message | Inherits from system browser |

WebGPU is **not** required for MVP (only for M3 browser-side LLM).

---

## 12. Cost estimate per journal

| Item | Tokens | Cost |
|---|---|---|
| Sonnet 4.6 — describe place (1 call, 3-lang response) | ~200 in + ~900 out | ~$0.05 |
| Haiku 4.5 — translate opening (×2 langs) | ~600 in + ~600 out total | ~$0.002 |
| Haiku 4.5 — translate captions batched (×2 langs) | ~1500 in + ~1500 out total | ~$0.005 |
| Haiku 4.5 — translate closing + family notes (×2 langs) | ~400 in + ~400 out total | ~$0.001 |
| **Total per journal** | | **~$0.06** |

For a user making 2 journals per month: ~$1.50/year. Negligible.

For a "no-key mode" with us paying via proxy (rejected, but for reference): 100 users × 2/month × $0.06 = $144/month. Not crazy, but kills static-site ethos.

---

## 13. Things explicitly NOT in MVP

- User accounts / cloud sync / sharing dashboard
- Editing an existing journal after download (you re-run the builder; draft is in IndexedDB)
- Mobile-first builder (desktop-only — parents make these on Sunday evening)
- Touch drag-and-drop
- Print / PDF export
- Strava / Komoot import
- Multi-day trips
- Video
- Multiple drafts in flight
- Browser-side LLM (M3, post-validation)

---

## 14. Open questions for the user

1. **Tool name.** Currently using "Agugagatada" placeholder. Defer — not blocking.
2. **Languages.** EN / RU / DE confirmed. Always all three, or user-pickable per journal? (Recommend: pickable, default all three.)
3. **First validation trip.** Which real trip will be the M0 test? Useful to size photos against real data and pre-test HEIC paths.
4. **API key UX.** OK to require pasting it once, stored in IndexedDB? (Alternative: prompt every session — annoying but safer on shared computers. Recommend: store, with clear visible "this is on your computer only" disclosure.)
5. **Map snapshot vs live tiles in output.** Live tiles look better, recipients' IPs hit CARTO. Pre-rendered image is fully offline. Could be user-toggleable. Recommend: live for M0/M1, build offline mode in M2 in case any Russia recipient reports a blank map.
6. **iPhone or DSLR / Android?** What's your typical photo source? Drives whether HEIC handling is critical from day one or can be deferred a sprint.
7. **GitHub Gist publishing — viable from Russia?** Worth confirming before relying on it as a distribution path.

---

## 15. Suggested order of execution

1. Confirm M-1 + M0 scope with user; pick first validation trip.
2. M-1: extract template into a function (half day).
3. Build M0 in one focused session — branch `feat-builder-m0`.
4. M0.5: run M0 against three real photo sets, fix the breakage.
5. User makes one real journal in their dominant language. Send to mom (English first; she'll read it). Watch what breaks.
6. Iterate on M0 based on real-use feedback.
7. Once M0 feels solid → M1 (LLM with proper Russian translation).
8. Send Russian version to mom. Watch what breaks.
9. Once mom-validation passes → M2 (magic + polish, including Gist publishing).
10. Decide on M3 (browser-side LLM) priorities based on whether other families are interested, and whether the friction of API keys is real.

---

## Sources

- [Gemma 4 — Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/gemma-4-available-on-google-cloud)
- [Welcome Gemma 4 — Hugging Face](https://huggingface.co/blog/gemma4)
- [Google DeepMind Releases Gemma 4 — AI Haven](https://aihaven.com/news/gemma-4-launches-april-2026/)
- [Google Introduces TranslateGemma — InfoQ (Jan 2026)](https://www.infoq.com/news/2026/01/google-translategemma-models/)
- [TranslateGemma technical report — arXiv](https://arxiv.org/abs/2601.09012)
- [Gemma 3 — DeepMind](https://deepmind.google/models/gemma/gemma-3/)
- [Anthropic API browser CORS — Simon Willison](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/)
- [dangerouslyAllowBrowser — anthropic-sdk-typescript issue](https://github.com/anthropics/anthropic-sdk-typescript/issues/248)
