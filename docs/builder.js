/**
 * Journal builder — orchestrator.
 * Wires form submission through: photo pipeline → GPX parse → Claude call →
 * renderJournal → Blob download.
 */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const form        = $('#builder-form');
  const generateBtn = $('#generate-btn');
  const hint        = $('#generate-hint');
  const gpxInfo     = $('#gpx-info');
  const photosInfo  = $('#photos-info');
  const meter       = $('#filesize-meter');

  const statusPanel = $('#status-panel');
  const statusDot   = $('#status-dot');
  const statusText  = $('#status-text');
  const statusLog   = $('#status-log');
  const statusError = $('#status-error');
  const downloadActions = $('#download-actions');
  const downloadLink    = $('#download-link');
  const previewBtn      = $('#preview-btn');

  const MAX_PHOTOS = 50;
  const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
  const HARD_CAP_HTML = 15 * 1024 * 1024;
  const SOFT_CAP_HTML = 8 * 1024 * 1024;

  let processedPhotos = null;   // [{ id, src, ... }]
  let parsedTrack = null;
  let currentGpxFile = null;
  let currentPhotoFiles = [];
  let lastHtml = null;
  let lastBlobUrl = null;
  let lastFilename = null;

  // ── Inline file info updates ─────────────────────────────────────────────

  form.elements.gpx.addEventListener('change', (e) => {
    const file = e.target.files[0];
    currentGpxFile = file || null;
    gpxInfo.className = 'inline-info';
    gpxInfo.textContent = file ? `${file.name} (${formatSize(file.size)})` : '';
    parsedTrack = null;
  });

  form.elements.photos.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    currentPhotoFiles = files;
    if (files.length === 0) {
      photosInfo.textContent = '';
    } else if (files.length > MAX_PHOTOS) {
      photosInfo.className = 'inline-info error';
      photosInfo.textContent = `Too many: ${files.length} photos (max ${MAX_PHOTOS}).`;
    } else {
      const bad = files.filter(f => f.size > MAX_PHOTO_BYTES);
      const total = files.reduce((a, f) => a + f.size, 0);
      photosInfo.className = bad.length ? 'inline-info warn' : 'inline-info';
      photosInfo.textContent = bad.length
        ? `${files.length} selected — ${bad.length} over 20 MB will fail.`
        : `${files.length} selected · ${formatSize(total)} raw`;
    }
    processedPhotos = null;
  });

  // ── Submit ────────────────────────────────────────────────────────────────

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusError.hidden = true;
    downloadActions.hidden = true;
    statusLog.innerHTML = '';
    statusPanel.hidden = false;

    try {
      const values = readForm();
      validateForm(values);

      setStatus('running', 'Processing photos…');
      processedPhotos = await processPhotos(values.photoFiles);
      logOk(`Processed ${processedPhotos.length} photo${processedPhotos.length === 1 ? '' : 's'}.`);

      setStatus('running', 'Parsing GPX…');
      parsedTrack = await window.Builder.Gpx.parse(values.gpxFile);
      logOk(`Track: ${parsedTrack.distance_km} km, ${parsedTrack.duration_min ?? '—'} min, ${parsedTrack.trackpoint_count} points → ${parsedTrack.points.length} after decimation.`);

      setStatus('running', 'Calling Claude (may take 20–60s)…');
      const llmInput = buildLlmInput(values, processedPhotos, parsedTrack);
      const llmResult = await window.Builder.Llm.generate(llmInput);
      const usage = llmResult.usage || {};
      logOk(`Claude OK · in ${usage.input_tokens ?? '?'} / out ${usage.output_tokens ?? '?'} tokens · model ${llmResult.model || window.Builder.Llm.MODEL}`);

      setStatus('running', 'Writing journal…');
      const journalData = mergeJournalData(values, processedPhotos, parsedTrack, llmResult.journal);
      const html = window.renderJournal(journalData);
      lastHtml = html;

      const bytes = new Blob([html]).size;
      if (bytes > HARD_CAP_HTML) {
        throw new Error(`Output too large: ${formatSize(bytes)}. Reduce photo count or quality.`);
      }
      if (bytes > SOFT_CAP_HTML) {
        logWarn(`Output is ${formatSize(bytes)} — above 8 MB soft cap but under 15 MB hard cap.`);
      }
      meter.textContent = formatSize(bytes);

      const blob = new Blob([html], { type: 'text/html' });
      if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
      lastBlobUrl = URL.createObjectURL(blob);
      lastFilename = `journal-${slugify(values.title || 'trip')}-${values.date}.html`;
      downloadLink.href = lastBlobUrl;
      downloadLink.download = lastFilename;
      downloadLink.textContent = `Download ${lastFilename} (${formatSize(bytes)})`;
      downloadActions.hidden = false;

      setStatus('done', 'Done — download ready.');
    } catch (err) {
      console.error(err);
      setStatus('error', 'Failed.');
      statusError.hidden = false;
      statusError.textContent = err.message || String(err);
    }
  });

  previewBtn.addEventListener('click', () => {
    if (!lastBlobUrl) return;
    window.open(lastBlobUrl, '_blank');
  });

  // ── Form reading + validation ────────────────────────────────────────────

  function readForm() {
    const fd = new FormData(form);
    return {
      title:       (fd.get('title') || '').toString().trim(),
      tagline:     (fd.get('tagline') || '').toString().trim(),
      location:    (fd.get('location') || '').toString().trim(),
      date:        (fd.get('date') || '').toString().trim(),
      source_lang: (fd.get('source_lang') || 'en').toString(),
      who_came:    (fd.get('who_came') || '').toString().trim(),
      carrier:     fd.get('carrier') === 'on',
      stroller:    fd.get('stroller') === 'on',
      story_raw:        (fd.get('story_raw') || '').toString().trim(),
      closing_raw:      (fd.get('closing_raw') || '').toString().trim(),
      family_notes_raw: (fd.get('family_notes_raw') || '').toString().trim(),
      gpxFile:    currentGpxFile,
      photoFiles: currentPhotoFiles
    };
  }

  function validateForm(v) {
    if (!v.title) throw new Error('Title is required.');
    if (!v.location) throw new Error('Location is required.');
    if (!v.date) throw new Error('Date is required.');
    if (!v.who_came) throw new Error('"Who came" is required.');
    if (v.story_raw.length < 30) throw new Error('Story opening is too short (≥30 chars).');
    if (!v.gpxFile) throw new Error('GPX file is required.');
    if (v.photoFiles.length === 0) throw new Error('At least one photo is required.');
    if (v.photoFiles.length > MAX_PHOTOS) throw new Error(`Too many photos (max ${MAX_PHOTOS}).`);
    const tooBig = v.photoFiles.find(f => f.size > MAX_PHOTO_BYTES);
    if (tooBig) throw new Error(`Photo too big: ${tooBig.name} (${formatSize(tooBig.size)}, max 20 MB).`);
  }

  // ── Photo pipeline ───────────────────────────────────────────────────────

  async function processPhotos(files) {
    const out = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setStatus('running', `Processing photo ${i + 1} of ${files.length}: ${f.name}`);
      try {
        const photo = await processOne(f, i);
        out.push(photo);
      } catch (e) {
        logError(`${f.name} — ${e.message}`);
      }
    }
    if (out.length === 0) throw new Error('No photos survived processing.');
    // Sort by EXIF timestamp (fallback to upload order).
    out.sort((a, b) => {
      if (a.timestamp && b.timestamp) return a.timestamp.localeCompare(b.timestamp);
      if (a.timestamp) return -1;
      if (b.timestamp) return 1;
      return a.uploadIndex - b.uploadIndex;
    });
    return out;
  }

  async function processOne(file, uploadIndex) {
    let blob = file;
    if (window.Builder.Heic.isHeic(file)) {
      blob = await window.Builder.Heic.toJpegBlob(file);
    }
    const exif  = await window.Builder.Exif.read(blob);
    const image = await window.Builder.Image.process(blob, exif.orientation);
    return {
      id: `p${String(uploadIndex + 1).padStart(2, '0')}`,
      filename: file.name,
      src: image.dataUrl,
      width: image.width,
      height: image.height,
      orientation: image.orientation,
      timestamp: exif.timestamp,
      coord: exif.coord,
      uploadIndex
    };
  }

  // ── LLM input + merge ────────────────────────────────────────────────────

  function buildLlmInput(v, photos, track) {
    return {
      trip: {
        title: v.title,
        tagline: v.tagline || null,
        location: v.location,
        date: v.date,
        source_lang: v.source_lang
      },
      family: {
        who_came: v.who_came,
        carrier: v.carrier,
        stroller: v.stroller
      },
      story_raw: v.story_raw,
      closing_raw: v.closing_raw || null,
      family_notes_raw: v.family_notes_raw
        ? v.family_notes_raw.split('\n').map(s => s.trim()).filter(Boolean)
        : [],
      photos: photos.map(p => ({
        id: p.id,
        filename: p.filename,
        timestamp: p.timestamp,
        coord: p.coord
      })),
      track: {
        distance_km: track.distance_km,
        duration_min: track.duration_min
      }
    };
  }

  function mergeJournalData(v, photos, track, llm) {
    // Map LLM photo entries by id for merging chapter + caption back onto the full photo objects.
    const byId = Object.fromEntries((llm.photos || []).map(p => [p.id, p]));
    const mergedPhotos = photos.map(p => {
      const l = byId[p.id] || {};
      return {
        ...p,
        chapter: l.chapter || inferChapter(p.timestamp, p.uploadIndex, photos.length),
        caption: l.caption || { en: '', ru: '', de: '' }
      };
    });
    return {
      trip: {
        title:          llm.title,
        tagline:        llm.tagline,
        location:       v.location,
        location_title: llm.location_title,
        date:           v.date,
        source_lang:    v.source_lang,
        party:          llm.party,
        party_label:    llm.party_label
      },
      family: { who_came: v.who_came, carrier: v.carrier, stroller: v.stroller },
      story: {
        opening: llm.opening,
        closing: llm.closing
      },
      about_place:  llm.about_place,
      family_notes: llm.family_notes,
      track: {
        points:       track.points,
        distance_km:  track.distance_km,
        duration_min: track.duration_min
      },
      photos: mergedPhotos
    };
  }

  function inferChapter(ts, idx, total) {
    if (ts) {
      const h = new Date(ts).getHours();
      if (h < 10) return 'early';
      if (h < 14) return 'midday';
      if (h < 17) return 'afternoon';
      return 'evening';
    }
    // No timestamp: spread across chapters by position.
    const q = idx / Math.max(1, total - 1);
    if (q < 0.33) return 'early';
    if (q < 0.66) return 'midday';
    return 'afternoon';
  }

  // ── Status helpers ───────────────────────────────────────────────────────

  function setStatus(kind, text) {
    statusDot.classList.remove('done', 'error');
    if (kind === 'done')  statusDot.classList.add('done');
    if (kind === 'error') statusDot.classList.add('error');
    statusText.textContent = text;
  }

  function logOk(s)    { addLog(s, 'ok'); }
  function logWarn(s)  { addLog(s, 'warn'); }
  function logError(s) { addLog(s, 'error'); }
  function addLog(s, cls) {
    const line = document.createElement('div');
    line.className = cls;
    line.textContent = s;
    statusLog.appendChild(line);
    statusLog.scrollTop = statusLog.scrollHeight;
  }

  // ── Utilities ────────────────────────────────────────────────────────────

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  function slugify(s) {
    return s.toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 40) || 'trip';
  }

  // Default the date to today.
  if (!form.elements.date.value) {
    form.elements.date.value = new Date().toISOString().slice(0, 10);
  }
})();
