/**
 * Minimal GPX parser — extracts trackpoints, distance, duration, bbox.
 * Decimates to keep the output file size reasonable.
 */
(function (global) {
  'use strict';

  const NS = (global.Builder = global.Builder || {});

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
            + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  function decimate(points, targetCount) {
    if (points.length <= targetCount) return points;
    const step = points.length / targetCount;
    const out = [];
    for (let i = 0; i < targetCount; i++) {
      out.push(points[Math.floor(i * step)]);
    }
    out.push(points[points.length - 1]);
    return out;
  }

  async function parse(file) {
    const text = await file.text();
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) throw new Error('GPX file is not valid XML.');

    const trkpts = Array.from(doc.getElementsByTagName('trkpt'));
    if (trkpts.length === 0) throw new Error('GPX file has no <trkpt> elements.');

    const raw = trkpts.map(pt => {
      const lat = parseFloat(pt.getAttribute('lat'));
      const lon = parseFloat(pt.getAttribute('lon'));
      const timeEl = pt.getElementsByTagName('time')[0];
      const ts = timeEl ? new Date(timeEl.textContent).toISOString() : null;
      return { lat, lon, ts };
    }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

    if (raw.length < 2) throw new Error('GPX file has fewer than 2 usable trackpoints.');

    let distKm = 0;
    for (let i = 1; i < raw.length; i++) {
      distKm += haversineKm(raw[i-1].lat, raw[i-1].lon, raw[i].lat, raw[i].lon);
    }

    let durationMin = null;
    const firstTs = raw.find(p => p.ts)?.ts;
    const lastTs  = [...raw].reverse().find(p => p.ts)?.ts;
    if (firstTs && lastTs && firstTs !== lastTs) {
      durationMin = Math.round((new Date(lastTs) - new Date(firstTs)) / 60000);
    }

    const points = decimate(raw.map(p => [p.lat, p.lon]), 200);
    const lats = raw.map(p => p.lat);
    const lons = raw.map(p => p.lon);
    const bbox = [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];

    return {
      points,
      distance_km: Math.round(distKm * 10) / 10,
      duration_min: durationMin,
      bbox,
      trackpoint_count: raw.length
    };
  }

  NS.Gpx = { parse };
})(window);
