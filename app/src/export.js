// Renders a cover at an exact post size and downloads it as a PNG.
import { drawCover, SIZES } from './cover.js';

/** Renders `state` at the named size and returns the canvas. */
export function renderCover(state, sizeId) {
  const size = SIZES[sizeId] || SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state);
  return canvas;
}

/** Downloads the canvas as a PNG file. */
export function downloadPNG(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

/** Renders and downloads one size. */
export function exportSize(state, sizeId) {
  const size = SIZES[sizeId] || SIZES.square;
  const canvas = renderCover(state, sizeId);
  downloadPNG(canvas, `neon-coast-cover-${size.w}x${size.h}.png`);
  return canvas;
}
