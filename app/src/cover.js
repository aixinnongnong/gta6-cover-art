// The cover engine: draws a GTA-style multi-panel poster cover onto any canvas.
// Everything is deterministic (seeded grain, no wall clock), so the same state
// always renders the same pixels. Lettering uses the vendored Anton and
// Bebas Neue fonts — never any Rockstar logo, artwork or font.
import { gradeById } from './grades.js';
import { layoutById } from './layouts.js';

export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  story: { w: 1080, h: 1350, label: 'Story 1080 x 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noiseCache = new Map();
function grainCanvas(w, h) {
  const key = `${w}x${h}`;
  if (noiseCache.has(key)) return noiseCache.get(key);
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.ceil(w / 2));
  c.height = Math.max(2, Math.ceil(h / 2));
  const nctx = c.getContext('2d');
  const img = nctx.createImageData(c.width, c.height);
  const rnd = mulberry32(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (rnd() * 255) | 0;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  noiseCache.set(key, c);
  return c;
}

function fitFont(ctx, text, family, startSize, maxWidth) {
  let size = startSize;
  ctx.font = `400 ${size}px ${family}, sans-serif`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `400 ${size}px ${family}, sans-serif`;
  }
  return size;
}

function drawPhotoCover(ctx, img, px, py, pw, ph, slot, grade) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = Math.max(0.2, slot.zoom || 1);
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  const dx = px + (pw - dw) * (slot.ox ?? 0.5);
  const dy = py + (ph - dh) * (slot.oy ?? 0.5);
  ctx.save();
  ctx.filter = `saturate(${grade.sat}) contrast(${grade.con})`;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  const wash = ctx.createLinearGradient(px, py, px, py + ph);
  for (const [stop, color] of grade.wash) wash.addColorStop(stop, color);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

function drawPlaceholderPanel(ctx, px, py, pw, ph) {
  ctx.fillStyle = '#241335';
  ctx.fillRect(px, py, pw, ph);
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = Math.max(2, pw * 0.01);
  for (let x = -ph; x < pw + ph; x += pw * 0.09) {
    ctx.beginPath();
    ctx.moveTo(px + x, py + ph);
    ctx.lineTo(px + x + ph, py);
    ctx.stroke();
  }
  ctx.restore();
  const size = fitFont(ctx, 'ADD A PHOTO', 'Bebas Neue', Math.min(pw, ph) * 0.14, pw * 0.8);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', px + pw / 2, py + ph / 2);
  void size;
}

function drawPanel(ctx, panel, slot, state, W, H, highlight) {
  const px = panel.x * W, py = panel.y * H, pw = panel.w * W, ph = panel.h * H;
  const grade = gradeById(state.grade);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = W * 0.012;
  ctx.shadowOffsetY = W * 0.004;
  if (panel.polaroid) {
    const pad = pw * 0.035, padB = ph * 0.13;
    ctx.fillStyle = '#fdf8ef';
    ctx.fillRect(px - pad, py - pad, pw + 2 * pad, ph + pad + padB);
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const cx = px + pw / 2, cy = py + ph / 2;
  ctx.translate(cx, cy);
  if (panel.rot) ctx.rotate((panel.rot * Math.PI) / 180);
  ctx.translate(-cx, -cy);
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (panel.badgeCell) {
    drawBadgeCell(ctx, px, py, pw, ph, state);
  } else if (slot && state.photos[slot.photo]) {
    drawPhotoCover(ctx, state.photos[slot.photo].img, px, py, pw, ph, slot, grade);
  } else {
    drawPlaceholderPanel(ctx, px, py, pw, ph);
  }
  ctx.restore();
  ctx.save();
  ctx.translate(cx, cy);
  if (panel.rot) ctx.rotate((panel.rot * Math.PI) / 180);
  ctx.translate(-cx, -cy);
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.strokeStyle = panel.bleed ? 'rgba(255,255,255,0)' : '#fdf8ef';
  if (!panel.bleed) ctx.strokeRect(px, py, pw, ph);
  ctx.lineWidth = Math.max(1, W * 0.0015);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeRect(px + W * 0.004, py + W * 0.004, pw - W * 0.008, ph - W * 0.008);
  if (highlight) {
    ctx.lineWidth = Math.max(3, W * 0.006);
    ctx.strokeStyle = '#37e0ff';
    ctx.strokeRect(px - W * 0.004, py - W * 0.004, pw + W * 0.008, ph + W * 0.008);
  }
  ctx.restore();
}

function drawBadgeCell(ctx, px, py, pw, ph, state) {
  const grade = gradeById(state.grade);
  ctx.fillStyle = '#12061c';
  ctx.fillRect(px, py, pw, ph);
  const cx = px + pw / 2, cy = py + ph / 2;
  ctx.fillStyle = grade.glow;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const starSize = fitFont(ctx, '★★★★★', 'Anton', pw * 0.13, pw * 0.8);
  ctx.fillText('★★★★★', cx, cy - ph * 0.22);
  void starSize;
  const labelSize = fitFont(ctx, state.badge || 'VOL. VI', 'Bebas Neue', pw * 0.16, pw * 0.85);
  ctx.fillStyle = '#ffffff';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${labelSize * 0.25}px`;
  ctx.fillText((state.badge || 'VOL. VI').toUpperCase(), cx, cy + ph * 0.14);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.strokeStyle = grade.glow;
  ctx.lineWidth = Math.max(1, pw * 0.008);
  ctx.strokeRect(px + pw * 0.08, py + ph * 0.08, pw * 0.84, ph * 0.84);
}

function drawHalftoneBand(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const step = Math.max(6, h * 0.11);
  let row = 0;
  for (let yy = y + step * 0.6; yy < y + h; yy += step, row++) {
    const t = (yy - y) / h;
    const r = step * (0.14 + 0.30 * t);
    for (let xx = x + step * 0.6 + (row % 2 ? step / 2 : 0); xx < x + w; xx += step) {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.10 + 0.30 * t;
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawTitleBand(ctx, state, W, H, layout) {
  const tb = layout.titleBand;
  const bandY = H * (1 - tb);
  const grade = gradeById(state.grade);
  if (layout.id === 'fullbleed') {
    const scrim = ctx.createLinearGradient(0, H * 0.55, 0, H);
    scrim.addColorStop(0, 'rgba(10,4,18,0)');
    scrim.addColorStop(1, 'rgba(10,4,18,0.88)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
  } else {
    ctx.fillStyle = '#12061c';
    ctx.fillRect(0, bandY, W, H - bandY);
    drawHalftoneBand(ctx, 0, bandY, W, H - bandY, grade.glow);
    ctx.fillStyle = '#fdf8ef';
    ctx.fillRect(0, bandY, W, Math.max(2, H * 0.004));
  }
  const caption = (state.caption || 'SUNSET HEIST').trim().toUpperCase();
  const capY = bandY + (H - bandY) * 0.44;
  const capSize = fitFont(ctx, caption, 'Anton', H * 0.105, W * 0.92);
  const grad = ctx.createLinearGradient(0, capY - capSize * 0.6, 0, capY + capSize * 0.5);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#ffd76b');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160a24';
  ctx.lineWidth = capSize * 0.09;
  ctx.strokeText(caption, W / 2, capY);
  ctx.fillStyle = grad;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = capSize * 0.25;
  ctx.fillText(caption, W / 2, capY);
  ctx.restore();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (subtitle) {
    const subSize = fitFont(ctx, subtitle, 'Bebas Neue', H * 0.036, W * 0.8);
    const subY = bandY + (H - bandY) * 0.84;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${subSize * 0.4}px`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = subSize * 0.6;
    ctx.fillText(subtitle, W / 2, subY);
    ctx.restore();
  }
}

function drawBadgeRibbon(ctx, state, W, H) {
  const badge = (state.badge || '').trim();
  if (!badge) return;
  const grade = gradeById(state.grade);
  const text = badge.toUpperCase();
  const rh = Math.max(20, H * 0.042);
  const size = fitFont(ctx, text, 'Bebas Neue', rh * 0.62, W * 0.3);
  const tw = ctx.measureText(text).width;
  const bw = tw + rh * 1.1;
  const bx = W * 0.985 - bw;
  const by = H * 0.018;
  ctx.save();
  ctx.fillStyle = grade.glow;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = W * 0.008;
  ctx.shadowOffsetY = W * 0.002;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, rh, rh / 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#160a24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * 0.2}px`;
  ctx.font = `400 ${size}px 'Bebas Neue', sans-serif`;
  ctx.fillText(text, bx + bw / 2, by + rh * 0.54);
  ctx.restore();
}

function drawTiltBackdrop(ctx, state, W, H) {
  const grade = gradeById(state.grade);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1a0b2e');
  sky.addColorStop(0.55, '#7a2360');
  sky.addColorStop(0.8, '#ff7a3d');
  sky.addColorStop(1, '#12061c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const sx = W * 0.5, sy = H * 0.42, sr = W * 0.20;
  const halo = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.2);
  halo.addColorStop(0, 'rgba(255,200,110,0.55)');
  halo.addColorStop(1, 'rgba(255,200,110,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  void grade;
}

/** Draws the whole cover for `state` onto `canvas` at its own size.
 *  `highlight` is a panel-slot index to outline (editor only), or null. */
export function drawCover(canvas, state, highlight = null) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const layout = layoutById(state.layout);
  ctx.fillStyle = '#14081f';
  ctx.fillRect(0, 0, W, H);
  if (layout.id === 'tilt') drawTiltBackdrop(ctx, state, W, H);
  const panels = layout.panels(W, H);
  panels.forEach((panel, i) => {
    const slot = state.slots[i] || { photo: i, zoom: 1, ox: 0.5, oy: 0.5 };
    drawPanel(ctx, panel, slot, state, W, H, highlight === i);
  });
  drawTitleBand(ctx, state, W, H, layout);
  drawBadgeRibbon(ctx, state, W, H);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grainCanvas(W, H), 0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
