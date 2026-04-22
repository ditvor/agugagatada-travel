/**
 * Image pipeline — decode once, apply EXIF orientation, produce TWO outputs:
 *
 *   embed  — ≤1600 px max edge, JPEG q75, base64 data URL. Inlined into the
 *            output HTML for the reader.
 *   vision — ≤768 px max edge, JPEG q75, raw base64 string. Sent to Claude as
 *            an image content block so captions can be written from what the
 *            model actually sees.
 *
 * Canvas does NOT honour EXIF orientation automatically — rotations are applied
 * manually before scaling.
 */
(function (global) {
  'use strict';

  const NS = (global.Builder = global.Builder || {});
  const EMBED_MAX = 1600;
  const VISION_MAX = 768;
  const JPEG_Q = 0.75;

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to decode image.')); };
      img.src = url;
    });
  }

  function applyOrientation(ctx, img, orientation) {
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
      default: break;
    }
    ctx.drawImage(img, 0, 0);
  }

  function dimsAfterOrientation(w, h, orientation) {
    return (orientation >= 5 && orientation <= 8) ? [h, w] : [w, h];
  }

  function scaleTo(srcCanvas, maxEdge) {
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    const edge = Math.max(sw, sh);
    const scale = edge > maxEdge ? maxEdge / edge : 1;
    const w = Math.round(sw * scale);
    const h = Math.round(sh * scale);
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(srcCanvas, 0, 0, w, h);
    return out;
  }

  /** Strip the "data:image/...;base64," prefix from a data URL. */
  function stripDataUrlPrefix(dataUrl) {
    const i = dataUrl.indexOf(',');
    return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  }

  async function process(blob, exifOrientation) {
    const img = await loadImageFromBlob(blob);

    // Decode + rotate once into an upright full-size canvas.
    const [uprightW, uprightH] = dimsAfterOrientation(img.naturalWidth, img.naturalHeight, exifOrientation);
    const upright = document.createElement('canvas');
    upright.width = uprightW;
    upright.height = uprightH;
    applyOrientation(upright.getContext('2d'), img, exifOrientation);

    // Derive the two outputs from the upright canvas.
    const embedCanvas = scaleTo(upright, EMBED_MAX);
    const embedDataUrl = embedCanvas.toDataURL('image/jpeg', JPEG_Q);

    const visionCanvas = scaleTo(upright, VISION_MAX);
    const visionDataUrl = visionCanvas.toDataURL('image/jpeg', JPEG_Q);

    const orientation = embedCanvas.width >= embedCanvas.height ? 'landscape' : 'portrait';

    return {
      embed: {
        dataUrl: embedDataUrl,
        width: embedCanvas.width,
        height: embedCanvas.height,
        orientation
      },
      vision: {
        base64: stripDataUrlPrefix(visionDataUrl),
        mediaType: 'image/jpeg',
        width: visionCanvas.width,
        height: visionCanvas.height
      }
    };
  }

  NS.Image = { process, EMBED_MAX, VISION_MAX, JPEG_Q };
})(window);
