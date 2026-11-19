// Sunset / neon colour grades for the cover engine. A grade is a wash (a vertical
// gradient painted over the photo with soft-light, then overlay), a faint multiply
// tint, and a saturation / contrast lift applied while the photo is drawn.
// All colours are original; no Rockstar artwork, logo or font is used anywhere.
export const GRADES = [
  {
    id: 'vice', name: 'Vice Sunset', glow: '#ff9a3d',
    wash: [[0, 'rgba(255,110,60,0)'], [0.55, 'rgba(255,90,120,0.22)'], [1, 'rgba(150,30,160,0.40)']],
    tint: 'rgba(255,120,40,0.10)', sat: 1.30, con: 1.08,
  },
  {
    id: 'neon', name: 'Neon Nights', glow: '#37e0ff',
    wash: [[0, 'rgba(40,220,255,0.18)'], [0.5, 'rgba(120,60,255,0.24)'], [1, 'rgba(255,40,160,0.36)']],
    tint: 'rgba(90,40,255,0.10)', sat: 1.35, con: 1.10,
  },
  {
    id: 'gold', name: 'Golden Hour', glow: '#ffc46b',
    wash: [[0, 'rgba(255,220,120,0.12)'], [1, 'rgba(255,140,40,0.32)']],
    tint: 'rgba(255,180,60,0.08)', sat: 1.25, con: 1.05,
  },
  {
    id: 'noir', name: 'Noir Pink', glow: '#ff5e8a',
    wash: [[0, 'rgba(20,10,40,0.32)'], [1, 'rgba(255,60,140,0.30)']],
    tint: 'rgba(40,10,60,0.12)', sat: 1.15, con: 1.15,
  },
  {
    id: 'teal', name: 'Ocean Drive', glow: '#2fe8d8',
    wash: [[0, 'rgba(0,200,190,0.20)'], [1, 'rgba(255,120,80,0.28)']],
    tint: 'rgba(0,120,140,0.08)', sat: 1.30, con: 1.06,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}
