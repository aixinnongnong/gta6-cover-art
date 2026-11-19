// Multi-panel cover layouts. Every layout returns panel rectangles in unit
// coordinates (fractions of the cover width / height) plus the fraction of the
// height the title band takes at the bottom. Panels are numbered in reading
// order; panel slots keep their own photo, zoom and pan, so switching layouts
// never loses a crop. `badgeCell` marks a panel that renders a badge block
// instead of a photo (the 3x3 grid's centre cell).
export const LAYOUTS = [
  {
    id: 'hero3', name: 'Hero + Three', titleBand: 0.17,
    panels(W, H) {
      const m = 0.025, g = 0.012, tb = 0.17;
      const top = m, bottom = 1 - tb - 0.01;
      const ch = bottom - top;
      const heroW = 0.60;
      const colX = m + heroW + g;
      const colW = 1 - m - colX;
      const ph = (ch - 2 * g) / 3;
      return [
        { x: m, y: top, w: heroW, h: ch },
        { x: colX, y: top, w: colW, h: ph },
        { x: colX, y: top + ph + g, w: colW, h: ph },
        { x: colX, y: top + 2 * (ph + g), w: colW, h: ph },
      ];
    },
  },
  {
    id: 'grid4', name: 'Four Panel', titleBand: 0.17,
    panels(W, H) {
      const m = 0.025, g = 0.012, tb = 0.17;
      const top = m, bottom = 1 - tb - 0.01;
      const cw = (1 - 2 * m - g) / 2, ch = (bottom - top - g) / 2;
      return [
        { x: m, y: top, w: cw, h: ch },
        { x: m + cw + g, y: top, w: cw, h: ch },
        { x: m, y: top + ch + g, w: cw, h: ch },
        { x: m + cw + g, y: top + ch + g, w: cw, h: ch },
      ];
    },
  },
  {
    id: 'fullbleed', name: 'Full Bleed', titleBand: 0.20,
    panels() {
      return [{ x: 0, y: 0, w: 1, h: 1, bleed: true }];
    },
  },
  {
    id: 'grid9', name: 'Nine Panel', titleBand: 0.17,
    panels(W, H) {
      const m = 0.025, g = 0.012, tb = 0.17;
      const top = m, bottom = 1 - tb - 0.01;
      const cw = (1 - 2 * m - 2 * g) / 3, ch = (bottom - top - 2 * g) / 3;
      const cells = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const cell = { x: m + c * (cw + g), y: top + r * (ch + g), w: cw, h: ch };
          if (r === 1 && c === 1) cell.badgeCell = true;
          cells.push(cell);
        }
      }
      return cells;
    },
  },
  {
    id: 'tilt', name: 'Tilted Snapshots', titleBand: 0.17,
    panels(W, H) {
      return [
        { x: 0.05, y: 0.09, w: 0.40, h: 0.56, rot: -7, polaroid: true },
        { x: 0.32, y: 0.05, w: 0.42, h: 0.62, rot: 2, polaroid: true },
        { x: 0.60, y: 0.11, w: 0.36, h: 0.54, rot: 7, polaroid: true },
      ];
    },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
