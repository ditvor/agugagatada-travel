/**
 * HEIC → JPEG converter. Lazy-loads heic2any only when needed.
 */
(function (global) {
  'use strict';

  const NS = (global.Builder = global.Builder || {});

  let heic2anyLoader = null;

  function loadHeic2any() {
    if (global.heic2any) return Promise.resolve(global.heic2any);
    if (heic2anyLoader) return heic2anyLoader;
    heic2anyLoader = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
      s.onload  = () => resolve(global.heic2any);
      s.onerror = () => reject(new Error('Failed to load heic2any library.'));
      document.head.appendChild(s);
    });
    return heic2anyLoader;
  }

  function isHeic(file) {
    const name = (file.name || '').toLowerCase();
    const type = (file.type || '').toLowerCase();
    return name.endsWith('.heic') || name.endsWith('.heif')
        || type === 'image/heic' || type === 'image/heif';
  }

  async function toJpegBlob(file) {
    const convert = await loadHeic2any();
    const blob = await convert({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    return Array.isArray(blob) ? blob[0] : blob;
  }

  NS.Heic = { isHeic, toJpegBlob };
})(window);
