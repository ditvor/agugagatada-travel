/**
 * Image pipeline — apply EXIF orientation rotation, downscale to 1600px max
 * edge, encode as JPEG q75, return base64 data URL.
 *
 * Canvas does NOT honour EXIF orientation automatically. We apply the
 * rotation/flip manually.
 */
(function (global) {
  'use strict';

  const NS = (global.Builder = global.Builder || {});
  const MAX_EDGE = 1600;
  const JPEG_Q = 0.75;

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(new Error('Failed to decode image.')); };
      img.src = url;
    });
  }

  // Map EXIF orientation (1-8) to (swapWH, drawCanvas) instructions.
  function applyOrientation(ctx, canvas, img, orientation) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    switch (orientation) {
      case 2: ctx.transform(-1, 0, 0, 1, w, 0); break;
      case 3: ctx.transform(-1, 0, 0, -1, w, h); break;
      case 4: ctx.transform(1, 0, 0, -1, 0, h); break;
      case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.transform(0, 1, -1, 0, h, 0); break;
      case 7: ctx.transform(0, -1, -1, 0, h, w); break;
      case 8: ctx.transform(0, -1, 1, 0, 0, w); break;
      default: break; // 1 or null = no-op
    }
    ctx.drawImage(img, 0, 0);
  }

  function dimsAfterOrientation(w, h, orientation) {
    return (orientation >= 5 && orientation <= 8) ? [h, w] : [w, h];
  }

  function fitScale(w, h, max) {
    const edge = Math.max(w, h);
    return edge > max ? max / edge : 1;
  }

  /**
   * Downscale + rotate → base64 JPEG data URL.
   * Returns { dataUrl, width, height, orientation: 'landscape'|'portrait' }.
   */
  async function process(blob, exifOrientation) {
    const img = await loadImageFromBlob(blob);

    // Step 1: rotate into a canvas at full size
    const [uprightW, uprightH] = dimsAfterOrientation(img.naturalWidth, img.naturalHeight, exifOrientation);
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = uprightW;
    rotCanvas.height = uprightH;
    const rotCtx = rotCanvas.getContext('2d');
    applyOrientation(rotCtx, rotCanvas, img, exifOrientation);

    // Step 2: downscale the upright canvas
    const scale = fitScale(uprightW, uprightH, MAX_EDGE);
    const outW = Math.round(uprightW * scale);
    const outH = Math.round(uprightH * scale);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext('2d');
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(rotCanvas, 0, 0, outW, outH);

    const dataUrl = outCanvas.toDataURL('image/jpeg', JPEG_Q);
    const orientation = outW >= outH ? 'landscape' : 'portrait';
    return { dataUrl, width: outW, height: outH, orientation };
  }

  NS.Image = { process, MAX_EDGE, JPEG_Q };
})(window);
