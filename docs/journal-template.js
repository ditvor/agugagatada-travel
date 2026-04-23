/**
 * Journal output renderer.
 *
 * Takes a structured journal-data object and returns a complete, self-contained
 * HTML document as a string. Output depends only on Leaflet + Google Fonts CDN;
 * everything else (photos as base64, track as inline JS array) is inlined.
 *
 * Usage (browser):
 *   const html = renderJournal(data);
 *   const blob = new Blob([html], { type: 'text/html' });
 *   // ...trigger download
 *
 * Data shape: see the FIXTURE in docs/journal-preview.html for a full example.
 */

(function (global) {
  'use strict';

  // ── Inlined stylesheet (copied from docs/journal-mockup.html baseline) ────
  const STYLES = `
    /* --------- Design tokens --------- */
    :root {
      --bg: #FAF6F0;
      --surface: #FFFFFF;
      --ink: #1A1A1A;
      --ink-soft: #3A3A3A;
      --muted: #7A7A7A;
      --rule: #E5DFD4;
      --accent: #1B3A5C;
      --warm: #B8623C;
      --serif: 'Fraunces', Georgia, 'Times New Roman', serif;
      --sans: 'Inter', system-ui, -apple-system, sans-serif;
      --measure: 38rem;
      --gutter: clamp(1.25rem, 4vw, 2.5rem);
    }

    *, *::before, *::after { box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--serif);
      font-size: 19px;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    img { max-width: 100%; display: block; }

    /* --------- Sticky mini-nav --------- */
    .page-nav {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(250, 246, 240, 0.85);
      backdrop-filter: saturate(140%) blur(10px);
      -webkit-backdrop-filter: saturate(140%) blur(10px);
      border-bottom: 1px solid var(--rule);
    }
    .nav-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0.75rem var(--gutter);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: var(--sans);
      font-size: 0.875rem;
    }
    .nav-back {
      color: var(--ink-soft);
      text-decoration: none;
      letter-spacing: 0.01em;
    }
    .nav-back:hover { color: var(--accent); }

    .lang-switch {
      display: inline-flex;
      gap: 0.25rem;
      background: var(--surface);
      border: 1px solid var(--rule);
      border-radius: 999px;
      padding: 3px;
    }
    .lang-switch button {
      font-family: var(--sans);
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      color: var(--muted);
      background: transparent;
      border: 0;
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .lang-switch button.active {
      background: var(--ink);
      color: var(--bg);
    }
    .lang-switch button:not(.active):hover { color: var(--ink); }

    .nav-share {
      font-family: var(--sans);
      font-size: 0.8125rem;
      color: var(--ink-soft);
      background: transparent;
      border: 1px solid var(--rule);
      border-radius: 999px;
      padding: 0.4rem 0.9rem;
      cursor: pointer;
    }
    .nav-share:hover { border-color: var(--ink); }

    /* --------- Hero --------- */
    .hero {
      position: relative;
      height: clamp(60vh, 75vh, 720px);
      width: 100%;
      overflow: hidden;
      background: linear-gradient(180deg, #2c4858 0%, #4d6b7c 35%, #8fa8b8 65%, #d4c4a8 100%);
    }
    .hero-image {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
    }
    .hero::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%);
      pointer-events: none;
    }
    .hero-content {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 0 var(--gutter) clamp(2rem, 5vw, 3.5rem);
      color: #fff;
      z-index: 2;
      max-width: 1100px;
      margin: 0 auto;
    }
    .hero-meta {
      font-family: var(--sans);
      font-size: 0.8125rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.92;
      margin-bottom: 0.75rem;
    }
    .hero-title {
      font-family: var(--serif);
      font-weight: 500;
      font-size: clamp(2.5rem, 6vw, 4.75rem);
      line-height: 1.05;
      margin: 0 0 0.85rem;
      letter-spacing: -0.02em;
      max-width: 16ch;
    }
    .hero-tagline {
      font-family: var(--serif);
      font-style: italic;
      font-size: clamp(1.05rem, 1.6vw, 1.25rem);
      line-height: 1.45;
      max-width: 38ch;
      opacity: 0.95;
      margin: 0;
    }

    /* --------- Stat strip --------- */
    .stat-strip {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.75rem var(--gutter);
      display: flex;
      flex-wrap: wrap;
      gap: clamp(1.5rem, 4vw, 3rem);
      justify-content: center;
      border-bottom: 1px solid var(--rule);
      font-family: var(--sans);
    }
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
    }
    .stat-value {
      font-family: var(--serif);
      font-weight: 500;
      font-size: 1.35rem;
      color: var(--ink);
      letter-spacing: -0.01em;
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    /* --------- Prose container --------- */
    .prose {
      max-width: var(--measure);
      margin: 0 auto;
      padding: clamp(2.5rem, 6vw, 4rem) var(--gutter);
    }
    .prose p {
      margin: 0 0 1.25rem;
      color: var(--ink-soft);
    }
    .prose p:first-child::first-letter {
      font-size: 3.6rem;
      float: left;
      font-weight: 600;
      line-height: 0.85;
      padding: 0.4rem 0.6rem 0 0;
      color: var(--accent);
      font-family: var(--serif);
    }
    .prose p:last-child { margin-bottom: 0; }

    /* --------- Section title --------- */
    .section {
      max-width: 1100px;
      margin: 0 auto;
      padding: clamp(2rem, 5vw, 3.5rem) var(--gutter);
    }
    .section--narrow {
      max-width: var(--measure);
    }
    .section + .section { padding-top: 0; }

    .section-eyebrow {
      font-family: var(--sans);
      font-size: 0.75rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--warm);
      margin-bottom: 0.5rem;
    }
    .section-title {
      font-family: var(--serif);
      font-weight: 500;
      font-size: clamp(1.75rem, 3.5vw, 2.5rem);
      line-height: 1.15;
      letter-spacing: -0.015em;
      margin: 0 0 0.5rem;
      color: var(--ink);
    }
    .section-caption {
      font-family: var(--sans);
      font-size: 0.9375rem;
      color: var(--muted);
      margin: 0 0 1.75rem;
    }

    /* --------- Map --------- */
    .map-strip {
      max-width: 1100px;
      margin: 0 auto;
      padding: clamp(1.5rem, 4vw, 2.5rem) var(--gutter) clamp(2rem, 5vw, 3rem);
    }
    #map {
      height: 420px;
      width: 100%;
      border-radius: 6px;
      border: 1px solid var(--rule);
      background: var(--surface);
    }
    .map-caption {
      max-width: var(--measure);
      margin: 1rem auto 0;
      font-family: var(--sans);
      font-size: 0.9375rem;
      line-height: 1.55;
      color: var(--muted);
      text-align: center;
    }

    /* --------- Photo journey --------- */
    .chapter {
      margin: 0 auto;
      max-width: var(--measure);
      padding-top: 2.5rem;
    }
    .chapter:first-of-type { padding-top: 0.5rem; }

    .chapter-time {
      font-family: var(--sans);
      font-size: 0.75rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--warm);
      text-align: center;
      margin: 0 0 1.5rem;
      position: relative;
    }
    .chapter-time::before,
    .chapter-time::after {
      content: "";
      display: inline-block;
      width: 2.5rem;
      height: 1px;
      background: var(--rule);
      vertical-align: middle;
      margin: 0 0.85rem;
    }

    .photo-card {
      margin: 0 0 2rem;
    }
    .photo-card .photo {
      width: 100%;
      aspect-ratio: 4 / 3;
      background-color: var(--rule);
      background-size: cover;
      background-position: center;
      border-radius: 4px;
    }
    .photo-card .photo--tall { aspect-ratio: 3 / 4; }
    .photo-card figcaption {
      font-family: var(--sans);
      font-style: italic;
      font-size: 0.9375rem;
      color: var(--muted);
      margin-top: 0.65rem;
      padding: 0 0.25rem;
      line-height: 1.5;
    }

    .photo-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }
    .photo-pair .photo-card { margin-bottom: 0; }

    /* --------- About this place --------- */
    .about-place {
      background: var(--surface);
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
      padding: clamp(2.5rem, 5vw, 3.5rem) var(--gutter);
    }
    .about-place .inner {
      max-width: var(--measure);
      margin: 0 auto;
    }
    .about-place p {
      margin: 0 0 1.1rem;
      color: var(--ink-soft);
    }
    .about-place p:last-child { margin-bottom: 0; }

    /* --------- Closing --------- */
    .closing {
      max-width: var(--measure);
      margin: 0 auto;
      padding: clamp(3rem, 6vw, 4.5rem) var(--gutter);
      text-align: center;
    }
    .closing-photo {
      width: 100%;
      aspect-ratio: 16 / 10;
      background-color: var(--rule);
      background-size: cover;
      background-position: center;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }
    .closing-line {
      font-family: var(--serif);
      font-style: italic;
      font-size: 1.35rem;
      color: var(--ink);
      line-height: 1.4;
      margin: 0;
    }

    /* --------- Footer --------- */
    .page-footer {
      border-top: 1px solid var(--rule);
      padding: 2rem var(--gutter);
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
      font-family: var(--sans);
      font-size: 0.8125rem;
      color: var(--muted);
    }
    .page-footer .credit { margin: 0; }
    .page-footer .credit strong { color: var(--ink); font-weight: 600; }

    /* --------- Leaflet overrides --------- */
    .leaflet-container {
      font-family: var(--sans);
      background: #f0e8d8;
    }
    .photo-marker {
      background: var(--warm);
      width: 16px !important;
      height: 16px !important;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }

    /* --------- Language switching --------- */
    [data-i18n] [lang]:not([data-active]) { display: none; }

    /* --------- Responsive --------- */
    @media (max-width: 640px) {
      body { font-size: 17px; }
      .photo-pair { grid-template-columns: 1fr; }
      .nav-share { display: none; }
      #map { height: 360px; }
    }
  `;

  // ── Utilities ─────────────────────────────────────────────────────────────

  const LANGS = ['en', 'ru', 'de'];

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function pickLang(obj, lang) {
    if (!obj) return '';
    return obj[lang] ?? obj.en ?? Object.values(obj)[0] ?? '';
  }

  // Render EN/RU/DE <span lang="..."> variants from a {en,ru,de} object.
  function i18n(obj, sourceLang, tag = 'span') {
    if (!obj) return '';
    return LANGS.map(lang => {
      const active = lang === sourceLang ? ' data-active' : '';
      return `<${tag} lang="${lang}"${active}>${esc(obj[lang] || '')}</${tag}>`;
    }).join('');
  }

  // Same as i18n but computed per-lang via a function (for locale-specific formatting).
  function i18nCompute(fn, sourceLang, tag = 'span') {
    return LANGS.map(lang => {
      const active = lang === sourceLang ? ' data-active' : '';
      return `<${tag} lang="${lang}"${active}>${esc(fn(lang))}</${tag}>`;
    }).join('');
  }

  // Same as i18n but content is already safe HTML (for inline <strong> etc.).
  function i18nRaw(obj, sourceLang, tag = 'span') {
    if (!obj) return '';
    return LANGS.map(lang => {
      const active = lang === sourceLang ? ' data-active' : '';
      return `<${tag} lang="${lang}"${active}>${obj[lang] || ''}</${tag}>`;
    }).join('');
  }

  // ── Locale formatting ─────────────────────────────────────────────────────

  function localeFor(lang) {
    return lang === 'ru' ? 'ru-RU' : lang === 'de' ? 'de-DE' : 'en-GB';
  }

  function fmtDistance(km, lang) {
    const nf = new Intl.NumberFormat(localeFor(lang), { maximumFractionDigits: 1 });
    return `${nf.format(km)} km`;
  }

  function fmtDuration(minutes, lang) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hS = { en: 'h', ru: 'ч', de: 'Std.' }[lang] || 'h';
    const mS = { en: 'm', ru: 'мин', de: 'Min.' }[lang] || 'm';
    if (h === 0) return `${m} ${mS}`;
    if (m === 0) return `${h} ${hS}`;
    return `${h} ${hS} ${m} ${mS}`;
  }

  function fmtDate(isoDate, lang) {
    const d = new Date(`${isoDate}T12:00:00`);
    return new Intl.DateTimeFormat(localeFor(lang), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(d);
  }

  // ── Chapter helpers ───────────────────────────────────────────────────────

  const CHAPTER_LABELS = {
    early:     { en: 'Early morning', ru: 'Раннее утро',  de: 'Früher Morgen' },
    midday:    { en: 'Midday',        ru: 'Полдень',       de: 'Mittag' },
    afternoon: { en: 'Afternoon',     ru: 'После полудня', de: 'Nachmittag' },
    evening:   { en: 'Evening',       ru: 'Вечер',         de: 'Abend' }
  };
  const CHAPTER_ORDER = ['early', 'midday', 'afternoon', 'evening'];

  function groupPhotosByChapter(photos) {
    const groups = {};
    for (const p of photos) {
      const ch = CHAPTER_LABELS[p.chapter] ? p.chapter : 'midday';
      (groups[ch] ||= []).push(p);
    }
    return CHAPTER_ORDER
      .filter(ch => groups[ch] && groups[ch].length > 0)
      .map(ch => ({ chapter: ch, photos: groups[ch] }));
  }

  // Pair two consecutive portraits into a .photo-pair block.
  function layoutPhotos(photos) {
    const out = [];
    let i = 0;
    while (i < photos.length) {
      const a = photos[i];
      const b = photos[i + 1];
      if (a.orientation === 'portrait' && b && b.orientation === 'portrait') {
        out.push({ type: 'pair', photos: [a, b] });
        i += 2;
      } else {
        out.push({ type: 'single', photo: a });
        i += 1;
      }
    }
    return out;
  }

  // ── Stat-strip helpers ────────────────────────────────────────────────────

  function carrierStatValue(family, lang) {
    const L = {
      both:     { en: 'Both',     ru: 'Оба',        de: 'Beide' },
      carrier:  { en: 'Carrier',  ru: 'Переноска',  de: 'Trage' },
      stroller: { en: 'Stroller', ru: 'Коляска',    de: 'Kinderwagen' },
      foot:     { en: 'On foot',  ru: 'Пешком',     de: 'Zu Fuß' }
    };
    if (family.carrier && family.stroller) return L.both[lang];
    if (family.carrier) return L.carrier[lang];
    if (family.stroller) return L.stroller[lang];
    return L.foot[lang];
  }

  function carrierStatLabel(family, lang) {
    const L = {
      nostr:  { en: 'no stroller',        ru: 'без коляски',        de: 'kein Kinderwagen' },
      nocar:  { en: 'no carrier',         ru: 'без переноски',      de: 'keine Trage' },
      both:   { en: 'carrier + stroller', ru: 'переноска + коляска', de: 'Trage + Wagen' },
      foot:   { en: 'on foot',            ru: 'пешком',             de: 'zu Fuß' }
    };
    if (family.carrier && !family.stroller) return L.nostr[lang];
    if (family.stroller && !family.carrier) return L.nocar[lang];
    if (family.carrier && family.stroller)  return L.both[lang];
    return L.foot[lang];
  }

  function getParty(data) {
    return data.trip.party || { en: 'Family', ru: 'Семья', de: 'Familie' };
  }
  function getPartyLabel(data) {
    return data.trip.party_label || { en: 'on the walk', ru: 'в походе', de: 'unterwegs' };
  }

  // ── Section renderers ─────────────────────────────────────────────────────

  function renderHead(data) {
    const titleText = pickLang(data.trip.title, data.trip.source_lang);
    const pageTitle = `${titleText} — ${data.trip.location}`;
    return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(pageTitle)}</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${STYLES}</style>`;
  }

  function renderNav(data) {
    const src = data.trip.source_lang;
    const back  = { en: '← All trips', ru: '← Все поездки', de: '← Alle Ausflüge' };
    const share = { en: 'Share',       ru: 'Поделиться',    de: 'Teilen' };
    return `  <header class="page-nav">
    <div class="nav-inner">
      <a href="#" class="nav-back" data-i18n>${i18n(back, src)}</a>
      <div class="lang-switch" role="group" aria-label="Language">
        <button data-lang="en"${src === 'en' ? ' class="active"' : ''}>EN</button>
        <button data-lang="ru"${src === 'ru' ? ' class="active"' : ''}>RU</button>
        <button data-lang="de"${src === 'de' ? ' class="active"' : ''}>DE</button>
      </div>
      <button class="nav-share" data-i18n>${i18n(share, src)}</button>
    </div>
  </header>`;
  }

  function renderHero(data) {
    const src = data.trip.source_lang;
    const heroSrc = data.trip.hero_src || (data.photos[0] && data.photos[0].src) || '';
    const heroPos = data.trip.hero_position || 'center';
    const meta = (lang) => `${data.trip.location} · ${fmtDate(data.trip.date, lang)}`;
    return `  <section class="hero">
    <div class="hero-image" style="background-image: url('${esc(heroSrc)}'); background-position: ${esc(heroPos)};"></div>
    <div class="hero-content">
      <div class="hero-meta" data-i18n>${i18nCompute(meta, src)}</div>
      <h1 class="hero-title" data-i18n>${i18n(data.trip.title, src)}</h1>
      <p class="hero-tagline" data-i18n>${i18n(data.trip.tagline, src)}</p>
    </div>
  </section>`;
  }

  function renderStatStrip(data) {
    const src = data.trip.source_lang;
    const family = data.family || {};
    const walked = { en: 'walked', ru: 'пройдено', de: 'gelaufen' };
    const pace   = { en: 'at a baby pace', ru: 'в детском темпе', de: 'im Babytempo' };

    // Distance + duration are rendered once (numeric), i18n only on labels.
    const km = fmtDistance(data.track.distance_km, 'en');
    const dur = fmtDuration(data.track.duration_min, 'en');

    return `  <section class="stat-strip">
    <div class="stat">
      <span class="stat-value">${esc(km)}</span>
      <span class="stat-label" data-i18n>${i18n(walked, src)}</span>
    </div>
    <div class="stat">
      <span class="stat-value">${esc(dur)}</span>
      <span class="stat-label" data-i18n>${i18n(pace, src)}</span>
    </div>
    <div class="stat">
      <span class="stat-value" data-i18n>${i18nCompute(l => carrierStatValue(family, l), src)}</span>
      <span class="stat-label" data-i18n>${i18nCompute(l => carrierStatLabel(family, l), src)}</span>
    </div>
    <div class="stat">
      <span class="stat-value" data-i18n>${i18n(getParty(data), src)}</span>
      <span class="stat-label" data-i18n>${i18n(getPartyLabel(data), src)}</span>
    </div>
  </section>`;
  }

  function renderProseBlock(obj, sourceLang) {
    return LANGS.map(lang => {
      const active = lang === sourceLang ? ' data-active' : '';
      const text = (obj && obj[lang]) || '';
      const paras = text
        .split(/\n\n+/)
        .filter(p => p.trim().length)
        .map(p => `<p>${esc(p.trim())}</p>`)
        .join('\n          ');
      return `<div lang="${lang}"${active}>
          ${paras}
        </div>`;
    }).join('\n        ');
  }

  function renderOpening(data) {
    const src = data.trip.source_lang;
    return `  <article class="prose">
    <div data-i18n>
        ${renderProseBlock(data.story && data.story.opening, src)}
    </div>
  </article>`;
  }

  function renderMapSection(data) {
    const src = data.trip.source_lang;
    const story = data.story && data.story.track_story;
    const captionHtml = (story && (story.en || story.ru || story.de))
      ? `    <p class="map-caption" data-i18n>${i18n(story, src)}</p>\n`
      : '';
    return `  <section class="map-strip">
    <div id="map"></div>
${captionHtml}  </section>`;
  }

  function renderPhotoCard(photo, src, forceTall) {
    const tall = forceTall || photo.orientation === 'portrait';
    const tallClass = tall ? ' photo--tall' : '';
    return `<figure class="photo-card">
      <div class="photo${tallClass}" style="background-image: url('${esc(photo.src)}')"></div>
      <figcaption data-i18n>${i18n(photo.caption, src)}</figcaption>
    </figure>`;
  }

  function renderPhotoJourney(data) {
    const src = data.trip.source_lang;
    const eyebrow = { en: 'The morning, in order', ru: 'Утро по порядку',     de: 'Der Morgen, der Reihe nach' };
    const title   = { en: 'What we saw',           ru: 'Что мы увидели',      de: 'Was wir gesehen haben' };
    const groups = groupPhotosByChapter(data.photos || []);

    const chaptersHtml = groups.map(group => {
      const items = layoutPhotos(group.photos);
      const itemsHtml = items.map(item => {
        if (item.type === 'pair') {
          return `<div class="photo-pair">
      ${item.photos.map(p => renderPhotoCard(p, src, true)).join('\n      ')}
    </div>`;
        }
        return renderPhotoCard(item.photo, src, false);
      }).join('\n\n    ');
      return `  <div class="chapter">
    <p class="chapter-time" data-i18n>${i18n(CHAPTER_LABELS[group.chapter], src)}</p>

    ${itemsHtml}
  </div>`;
    }).join('\n\n');

    return `  <section class="section section--narrow">
    <div class="section-eyebrow" data-i18n>${i18n(eyebrow, src)}</div>
    <h2 class="section-title" data-i18n>${i18n(title, src)}</h2>
  </section>

${chaptersHtml}`;
  }

  function renderAboutPlace(data) {
    if (!data.about_place) return '';
    const src = data.trip.source_lang;
    const eyebrow = { en: 'A little about the place', ru: 'Немного о месте', de: 'Ein wenig über den Ort' };
    const locTitle = data.trip.location_title || {
      en: data.trip.location, ru: data.trip.location, de: data.trip.location
    };
    return `  <section class="about-place">
    <div class="inner">
      <div class="section-eyebrow" data-i18n>${i18n(eyebrow, src)}</div>
      <h2 class="section-title" data-i18n>${i18n(locTitle, src)}</h2>
      <div data-i18n>
        ${renderProseBlock(data.about_place, src)}
      </div>
    </div>
  </section>`;
  }

  function renderClosing(data) {
    const src = data.trip.source_lang;
    const closingSrc = data.trip.closing_src
      || (data.photos.length ? data.photos[data.photos.length - 1].src : '');
    const closing = (data.story && data.story.closing) || { en: '', ru: '', de: '' };
    const photoBlock = closingSrc
      ? `<div class="closing-photo" style="background-image: url('${esc(closingSrc)}')"></div>`
      : '';
    return `  <section class="closing">
    ${photoBlock}
    <p class="closing-line" data-i18n>${i18n(closing, src)}</p>
  </section>`;
  }

  function renderFooter(data) {
    const src = data.trip.source_lang;
    const credit = {
      en: 'Made with <strong>Agugagatada</strong>',
      ru: 'Сделано в <strong>Agugagatada</strong>',
      de: 'Erstellt mit <strong>Agugagatada</strong>'
    };
    return `  <footer class="page-footer">
    <p class="credit" data-i18n>${i18nRaw(credit, src)}</p>
    <div class="lang-switch" role="group" aria-label="Language">
      <button data-lang="en"${src === 'en' ? ' class="active"' : ''}>English</button>
      <button data-lang="ru"${src === 'ru' ? ' class="active"' : ''}>Русский</button>
      <button data-lang="de"${src === 'de' ? ' class="active"' : ''}>Deutsch</button>
    </div>
  </footer>`;
  }

  function renderScripts(data) {
    const src = data.trip.source_lang;
    const points = (data.track && data.track.points) || [];
    const markers = (data.photos || [])
      .filter(p => p.coord)
      .map(p => ({ coord: p.coord }));
    return `  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      const track = ${JSON.stringify(points)};
      const photoStops = ${JSON.stringify(markers)};

      if (track.length > 0) {
        const map = L.map('map', { scrollWheelZoom: false, zoomControl: true });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        L.polyline(track, { color: '#1B3A5C', weight: 4, opacity: 0.85, lineJoin: 'round' }).addTo(map);

        photoStops.forEach(p => {
          L.marker(p.coord, {
            icon: L.divIcon({ className: 'photo-marker', iconSize: [16, 16] })
          }).addTo(map);
        });

        map.fitBounds(L.latLngBounds(track), { padding: [40, 40] });
      } else {
        const mapEl = document.getElementById('map');
        if (mapEl && mapEl.parentElement) mapEl.parentElement.style.display = 'none';
      }

      const langButtons = document.querySelectorAll('.lang-switch button');
      function setLang(lang) {
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(group => {
          group.querySelectorAll('[lang]').forEach(el => {
            if (el.getAttribute('lang') === lang) {
              el.style.display = '';
              el.setAttribute('data-active', '');
            } else {
              el.style.display = 'none';
              el.removeAttribute('data-active');
            }
          });
        });
        document.querySelectorAll('.lang-switch button').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-lang') === lang);
        });
      }
      langButtons.forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
      });
      setLang(${JSON.stringify(src)});
    })();
  </script>`;
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  function renderJournal(data) {
    const src = (data.trip && data.trip.source_lang) || 'en';
    // Normalise the data a touch so callers can skip source_lang.
    data.trip = { ...data.trip, source_lang: src };
    return `<!DOCTYPE html>
<html lang="${src}">
<head>
${renderHead(data)}
</head>
<body>

${renderNav(data)}

${renderHero(data)}

${renderStatStrip(data)}

${renderOpening(data)}

${renderPhotoJourney(data)}

${renderMapSection(data)}

${renderAboutPlace(data)}

${renderClosing(data)}

${renderFooter(data)}

${renderScripts(data)}
</body>
</html>`;
  }

  global.renderJournal = renderJournal;
})(typeof window !== 'undefined' ? window : globalThis);
