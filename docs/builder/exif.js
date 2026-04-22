/**
 * EXIF reader — wrapper around exifr. Pulls timestamp, GPS, orientation.
 */
(function (global) {
  'use strict';

  const NS = (global.Builder = global.Builder || {});

  let exifrLoader = null;

  function loadExifr() {
    if (global.exifr) return Promise.resolve(global.exifr);
    if (exifrLoader) return exifrLoader;
    exifrLoader = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/full.umd.js';
      s.onload  = () => resolve(global.exifr);
      s.onerror = () => reject(new Error('Failed to load exifr library.'));
      document.head.appendChild(s);
    });
    return exifrLoader;
  }

  /**
   * @returns { timestamp: ISO|null, coord: [lat,lon]|null, orientation: 1-8|null }
   */
  async function read(fileOrBlob) {
    const exifr = await loadExifr();
    try {
      const meta = await exifr.parse(fileOrBlob, {
        pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude', 'Orientation']
      });
      if (!meta) return { timestamp: null, coord: null, orientation: null };
      const date = meta.DateTimeOriginal || meta.CreateDate || null;
      const ts = date ? new Date(date).toISOString() : null;
      const coord = (meta.latitude != null && meta.longitude != null)
        ? [meta.latitude, meta.longitude]
        : null;
      return { timestamp: ts, coord, orientation: meta.Orientation || null };
    } catch (e) {
      return { timestamp: null, coord: null, orientation: null };
    }
  }

  NS.Exif = { read };
})(window);
