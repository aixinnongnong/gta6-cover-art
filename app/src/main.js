// Wires the Neon Coast Cover Studio editor: photos, layouts, grades, caption,
// per-panel crop (drag to pan, scroll to zoom, click to select) and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, SIZES } from './cover.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { exportSize, renderCover } from './export.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const badgeInput = document.getElementById('badge');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panelLabel');
const panelPhoto = document.getElementById('panelPhoto');
const panelZoom = document.getElementById('panelZoom');
const panelZoomVal = document.getElementById('panelZoomVal');

const state = {
  size: 'square',
  layout: 'hero3',
  grade: 'vice',
  caption: 'Sunset Heist',
  subtitle: 'Neon Coast',
  badge: 'Vol. VI',
  photos: [], // { img, name }
  slots: Array.from({ length: 9 }, (_, i) => ({ photo: i % 2, zoom: 1, ox: 0.5, oy: 0.5 })),
};
let selectedPanel = 0;
let shotMode = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhoto(url, name) {
  const img = await loadImage(url);
  state.photos.push({ img, name });
  return state.photos.length - 1;
}

function currentSize() {
  return SIZES[state.size] || SIZES.square;
}

function redraw() {
  const size = currentSize();
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state, shotMode === 'cover' ? null : selectedPanel);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function syncPanelControls() {
  const slot = state.slots[selectedPanel];
  const layout = layoutById(state.layout);
  const count = layout.panels(1, 1).length;
  panelLabel.textContent = `Panel ${selectedPanel + 1} of ${count}`;
  panelPhoto.innerHTML = '';
  state.photos.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = p.name;
    panelPhoto.appendChild(opt);
  });
  panelPhoto.value = String(slot.photo ?? 0);
  panelZoom.value = String(slot.zoom || 1);
  panelZoomVal.textContent = `${(slot.zoom || 1).toFixed(2)}x`;
}

function syncPickerButtons(rowId, value) {
  document.querySelectorAll(`#${rowId} button`).forEach((b) => {
    b.classList.toggle('active', b.dataset.value === value);
  });
}

function syncAllControls() {
  captionInput.value = state.caption;
  subtitleInput.value = state.subtitle;
  badgeInput.value = state.badge;
  syncPickerButtons('layoutRow', state.layout);
  syncPickerButtons('gradeRow', state.grade);
  syncPickerButtons('sizeRow', state.size);
  syncPanelControls();
}

// --- photo loading -------------------------------------------------------
document.getElementById('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  for (const file of files) {
    await addPhoto(URL.createObjectURL(file), file.name.replace(/\.[^.]+$/, ''));
  }
  setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} loaded. Pick a panel, then choose its photo.`);
  syncPanelControls();
  redraw();
});

async function loadSample(name) {
  if (state.photos.some((p) => p.name === name)) return;
  await addPhoto(`samples/${name}.jpg`, name === 'skyline' ? 'Skyline' : 'Beach');
}

document.getElementById('sampleSkyline').addEventListener('click', async () => {
  await loadSample('skyline');
  setStatus('Skyline sample loaded.');
  syncPanelControls();
  redraw();
});
document.getElementById('sampleBeach').addEventListener('click', async () => {
  await loadSample('beach');
  setStatus('Beach sample loaded.');
  syncPanelControls();
  redraw();
});

// --- text, layout, grade, size -------------------------------------------
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
badgeInput.addEventListener('input', () => { state.badge = badgeInput.value; redraw(); });

document.getElementById('layoutRow').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-value]');
  if (!b) return;
  state.layout = b.dataset.value;
  selectedPanel = 0;
  syncPickerButtons('layoutRow', state.layout);
  syncPanelControls();
  redraw();
});
document.getElementById('gradeRow').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-value]');
  if (!b) return;
  state.grade = b.dataset.value;
  syncPickerButtons('gradeRow', state.grade);
  redraw();
});
document.getElementById('sizeRow').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-value]');
  if (!b) return;
  state.size = b.dataset.value;
  syncPickerButtons('sizeRow', state.size);
  redraw();
});

// --- per-panel crop -------------------------------------------------------
panelPhoto.addEventListener('change', () => {
  state.slots[selectedPanel].photo = Number(panelPhoto.value);
  redraw();
});
panelZoom.addEventListener('input', () => {
  state.slots[selectedPanel].zoom = Number(panelZoom.value);
  panelZoomVal.textContent = `${Number(panelZoom.value).toFixed(2)}x`;
  redraw();
});
document.getElementById('panelReset').addEventListener('click', () => {
  const slot = state.slots[selectedPanel];
  state.slots[selectedPanel] = { photo: slot.photo, zoom: 1, ox: 0.5, oy: 0.5 };
  syncPanelControls();
  redraw();
});
document.getElementById('panelFillAll').addEventListener('click', () => {
  const photo = state.slots[selectedPanel].photo;
  state.slots.forEach((s) => { s.photo = photo; });
  setStatus('All panels now use this photo.');
  redraw();
});

// --- canvas hit-testing, drag to pan, scroll to zoom ----------------------
function panelRects() {
  const layout = layoutById(state.layout);
  return layout.panels(canvas.width, canvas.height).map((p) => ({
    x: p.x * canvas.width, y: p.y * canvas.height,
    w: p.w * canvas.width, h: p.h * canvas.height, rot: p.rot || 0,
  }));
}

function hitPanel(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const rects = panelRects();
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const a = (-(r.rot || 0) * Math.PI) / 180;
    const dx = x - cx, dy = y - cy;
    const ux = dx * Math.cos(a) - dy * Math.sin(a) + cx;
    const uy = dx * Math.sin(a) + dy * Math.cos(a) + cy;
    if (ux >= r.x && ux <= r.x + r.w && uy >= r.y && uy <= r.y + r.h) return i;
  }
  return -1;
}

function photoDrawSize(img, pw, ph, zoom) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  return { dw: iw * scale, dh: ih * scale };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = hitPanel(e.clientX, e.clientY);
  if (i < 0) return;
  selectedPanel = i;
  syncPanelControls();
  redraw();
  const slot = state.slots[i];
  drag = { x: e.clientX, y: e.clientY, ox: slot.ox, oy: slot.oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const kx = canvas.width / rect.width, ky = canvas.height / rect.height;
  const r = panelRects()[selectedPanel];
  const slot = state.slots[selectedPanel];
  const photo = state.photos[slot.photo];
  if (!photo) return;
  const { dw, dh } = photoDrawSize(photo.img, r.w, r.h, slot.zoom || 1);
  const dx = (e.clientX - drag.x) * kx;
  const dy = (e.clientY - drag.y) * ky;
  if (dw > r.w) slot.ox = Math.min(1, Math.max(0, drag.ox + dx / (r.w - dw)));
  if (dh > r.h) slot.oy = Math.min(1, Math.max(0, drag.oy + dy / (r.h - dh)));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const i = hitPanel(e.clientX, e.clientY);
  if (i < 0) return;
  selectedPanel = i;
  const slot = state.slots[i];
  slot.zoom = Math.min(3.5, Math.max(1, (slot.zoom || 1) * Math.exp(-e.deltaY * 0.0012)));
  syncPanelControls();
  redraw();
}, { passive: false });

// --- export ---------------------------------------------------------------
function exportOne(sizeId) {
  const size = SIZES[sizeId];
  exportSize(state, sizeId);
  setStatus(`Saved neon-coast-cover-${size.w}x${size.h}.png`);
}
document.getElementById('exportSquare').addEventListener('click', () => exportOne('square'));
document.getElementById('exportStory').addEventListener('click', () => exportOne('story'));
document.getElementById('exportWide').addEventListener('click', () => exportOne('wide'));
document.getElementById('exportAll').addEventListener('click', () => {
  ['square', 'story', 'wide'].forEach((id, k) => setTimeout(() => exportOne(id), k * 400));
  setStatus('Exporting all three sizes…');
});

// --- boot -----------------------------------------------------------------
async function boot() {
  try { await document.fonts.load('400 100px Anton'); } catch { /* fall back to sans */ }
  try { await document.fonts.load('400 100px "Bebas Neue"'); } catch { /* fall back */ }
  const query = new URLSearchParams(location.search);
  shotMode = query.get('shot');
  if (shotMode) {
    await runShot(shotMode, query, async (scene) => {
      state.caption = scene.caption;
      state.subtitle = scene.subtitle;
      state.badge = scene.badge;
      state.layout = scene.layout;
      state.grade = scene.grade;
      state.size = scene.size;
      await loadSample('skyline');
      await loadSample('beach');
      state.slots = state.slots.map((s, i) => ({ ...s, photo: i % 2 }));
      selectedPanel = 0;
      syncAllControls();
      redraw();
    });
  } else {
    await loadSample('skyline');
    await loadSample('beach');
    syncAllControls();
    redraw();
    await document.fonts.ready;
    redraw();
  }
}

// Test hooks for the screenshot / verification scripts (not part of the UI).
window.__cover = { state, renderCover, drawCover, SIZES, LAYOUTS, GRADES, redraw };

boot();
