/**
 * Minimal GPX parser — extracts trackpoints, distance, duration, bbox.
 *
 * Returns:
 *   points:       decimated (≤200 points) [[lat,lon], …] for map rendering
 *   raw:          full-resolution [{lat, lon, ts|null}, …] for photo-coord
 *                 interpolation by timestamp
 *   distance_km:  haversine sum of the full track
 *   duration_min: last ts - first ts in minutes (null if no timestamps)
 *   bbox:         [[south, west], [north, east]]
 *   start:        { coord: [lat,lon], ts: ISO|null }
 *   end:          { coord: [lat,lon], ts: ISO|null }
 *   trackpoint_count: original count
 *   has_timestamps: boolean
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
      let ts = null;
      if (timeEl) {
        const d = new Date(timeEl.textContent);
        if (!Number.isNaN(d.getTime())) ts = d.toISOString();
      }
      return { lat, lon, ts };
    }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

    if (raw.length < 2) throw new Error('GPX file has fewer than 2 usable trackpoints.');

    let distKm = 0;
    for (let i = 1; i < raw.length; i++) {
      distKm += haversineKm(raw[i-1].lat, raw[i-1].lon, raw[i].lat, raw[i].lon);
    }

    const firstTs = raw.find(p => p.ts)?.ts || null;
    const lastTs  = [...raw].reverse().find(p => p.ts)?.ts || null;
    const durationMin = (firstTs && lastTs && firstTs !== lastTs)
      ? Math.round((new Date(lastTs) - new Date(firstTs)) / 60000)
      : null;

    const points = decimate(raw.map(p => [p.lat, p.lon]), 200);
    const lats = raw.map(p => p.lat);
    const lons = raw.map(p => p.lon);
    const bbox = [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];

    return {
      points,
      raw,
      distance_km:      Math.round(distKm * 10) / 10,
      duration_min:     durationMin,
      bbox,
      start:            { coord: [raw[0].lat, raw[0].lon],       ts: raw[0].ts },
      end:              { coord: [raw[raw.length-1].lat, raw[raw.length-1].lon], ts: raw[raw.length-1].ts },
      trackpoint_count: raw.length,
      has_timestamps:   Boolean(firstTs)
    };
  }

  /**
   * Given a photo timestamp (ISO string), find the closest-in-time GPX point
   * and return its [lat, lon]. Returns null if the track has no timestamps or
   * the photo falls too far outside the track's time window.
   *
   * "Too far" = > 30 minutes from the nearest point; we refuse to interpolate
   * beyond that to avoid placing a museum photo on an unrelated hike segment.
   */
  function interpolateCoord(photoTsIso, parsedTrack, maxDriftMinutes = 30) {
    if (!parsedTrack.has_timestamps || !photoTsIso) return null;
    const photoMs = new Date(photoTsIso).getTime();
    if (Number.isNaN(photoMs)) return null;

    let bestPt = null;
    let bestDiff = Infinity;
    for (const pt of parsedTrack.raw) {
      if (!pt.ts) continue;
      const diff = Math.abs(new Date(pt.ts).getTime() - photoMs);
      if (diff < bestDiff) { bestDiff = diff; bestPt = pt; }
    }
    if (!bestPt) return null;
    if (bestDiff > maxDriftMinutes * 60000) return null;
    return [bestPt.lat, bestPt.lon];
  }

  NS.Gpx = { parse, interpolateCoord };
})(window);
