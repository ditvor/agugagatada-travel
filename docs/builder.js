/**
 * Journal builder — orchestrator.
 * Three user-facing inputs: description, GPX, photos.
 * Everything else (location, date, title, tagline, party, family notes,
 * source language, per-photo captions, per-photo chapters) is derived
 * from those three inputs by one Claude call with photo vision.
 */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const form        = $('#builder-form');
  const generateBtn = $('#generate-btn');
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

  let currentGpxFile = null;
  let currentPhotoFiles = [];
  let lastBlobUrl = null;
  let lastFilename = null;

  // ── Inline file info updates ─────────────────────────────────────────────

  form.elements.gpx.addEventListener('change', (e) => {
    const file = e.target.files[0];
    currentGpxFile = file || null;
    gpxInfo.className = 'inline-info';
    gpxInfo.textContent = file ? `${file.name} (${formatSize(file.size)})` : '';
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

      setStatus('running', 'Parsing GPX…');
      const track = await window.Builder.Gpx.parse(values.gpxFile);
      logOk(`Track: ${track.distance_km} km, ${track.duration_min ?? '—'} min, ${track.trackpoint_count} points → ${track.points.length} after decimation. ${track.has_timestamps ? 'Has timestamps.' : 'No timestamps.'}`);

      setStatus('running', 'Processing photos…');
      const processed = await processPhotos(values.photoFiles);
      logOk(`Processed ${processed.length} photo${processed.length === 1 ? '' : 's'}.`);

      // Interpolate GPS coords from GPX for photos without their own.
      const interpolated = interpolateMissingCoords(processed, track);
      if (interpolated > 0) {
        logOk(`Recovered ${interpolated} photo coord${interpolated === 1 ? '' : 's'} from GPX by timestamp.`);
      }

      // Sort photos by timestamp (fall back to upload order).
      processed.sort(comparePhotoTime);

      // Derive date: GPX first timestamp > first photo timestamp > today.
      const derivedDate = deriveDate(track, processed);
      logOk(`Date: ${derivedDate}.`);

      setStatus('running', `Calling Claude with ${processed.length} photo vision thumbnails (may take 30–90s)…`);
      const llmInput = {
        description: values.description,
        track: {
          date: derivedDate,
          start_coord: track.start.coord,
          distance_km: track.distance_km,
          duration_min: track.duration_min
        },
        photos: processed.map(p => ({
          id: p.id,
          timestamp: p.timestamp,
          coord: p.coord,
          coord_source: p.coord_source,
          vision: p.vision
        }))
      };
      const llmResult = await window.Builder.Llm.generate(llmInput);
      const usage = llmResult.usage || {};
      logOk(`Claude OK · in ${usage.input_tokens ?? '?'} / out ${usage.output_tokens ?? '?'} tokens · model ${llmResult.model || window.Builder.Llm.MODEL}`);

      setStatus('running', 'Writing journal…');
      const journalData = mergeJournalData(values, processed, track, derivedDate, llmResult.journal);
      const html = window.renderJournal(journalData);

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
      const titleSlug = llmResult.journal.title && (llmResult.journal.title.en || '');
      lastFilename = `journal-${slugify(titleSlug || 'trip')}-${derivedDate}.html`;
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
      description: (fd.get('description') || '').toString().trim(),
      gpxFile:     currentGpxFile,
      photoFiles:  currentPhotoFiles
    };
  }

  function validateForm(v) {
    if (v.description.length < 20) throw new Error('Description is too short (≥20 chars). A few sentences is enough.');
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
      src: image.embed.dataUrl,
      width: image.embed.width,
      height: image.embed.height,
      orientation: image.embed.orientation,
      vision: image.vision,                 // { base64, mediaType, width, height }
      timestamp: exif.timestamp,
      coord: exif.coord,
      coord_source: exif.coord ? 'exif' : null,
      uploadIndex
    };
  }

  function interpolateMissingCoords(photos, track) {
    let recovered = 0;
    for (const p of photos) {
      if (p.coord || !p.timestamp) continue;
      const c = window.Builder.Gpx.interpolateCoord(p.timestamp, track);
      if (c) {
        p.coord = c;
        p.coord_source = 'gpx-interpolated';
        recovered++;
      }
    }
    return recovered;
  }

  function comparePhotoTime(a, b) {
    if (a.timestamp && b.timestamp) return a.timestamp.localeCompare(b.timestamp);
    if (a.timestamp) return -1;
    if (b.timestamp) return 1;
    return a.uploadIndex - b.uploadIndex;
  }

  // ── Derivation helpers ───────────────────────────────────────────────────

  function deriveDate(track, photos) {
    if (track.start.ts)    return track.start.ts.slice(0, 10);
    const firstPhotoTs = photos.find(p => p.timestamp)?.timestamp;
    if (firstPhotoTs)      return firstPhotoTs.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  }

  // ── Merge LLM output + processed data into renderJournal's data shape ────

  function mergeJournalData(values, photos, track, date, llm) {
    const byId = Object.fromEntries((llm.photos || []).map(p => [p.id, p]));
    const mergedPhotos = photos.map(p => {
      const l = byId[p.id] || {};
      return {
        id: p.id,
        src: p.src,
        width: p.width,
        height: p.height,
        orientation: p.orientation,
        timestamp: p.timestamp,
        coord: p.coord,
        chapter: l.chapter || inferChapter(p.timestamp, p.uploadIndex, photos.length),
        caption: l.caption || { en: '', ru: '', de: '' }
      };
    });
    const srcLang = (llm.source_lang === 'ru' || llm.source_lang === 'de') ? llm.source_lang : 'en';
    const locationTitle = llm.location_title || { en: '', ru: '', de: '' };
    return {
      trip: {
        title:          llm.title,
        tagline:        llm.tagline,
        location:       locationTitle[srcLang] || locationTitle.en || '',
        location_title: locationTitle,
        date,
        source_lang:    srcLang,
        party:          llm.party,
        party_label:    llm.party_label
      },
      family: {
        who_came: '',
        carrier:  llm.family ? Boolean(llm.family.carrier)  : true,
        stroller: llm.family ? Boolean(llm.family.stroller) : false
      },
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
    return (s || '').toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 40) || 'trip';
  }
})();
