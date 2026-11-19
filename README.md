# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/aixinnongnong/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/aixinnongnong/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Coast Cover Studio — an offline web app that turns your photos and a caption into GTA-style multi-panel poster art, exported as a PNG to share. Five layouts (Hero + Three, Four Panel, Full Bleed, Nine Panel, Tilted Snapshots), five sunset / neon colour grades, per-panel crop and positioning (drag to pan, scroll to zoom), bold display lettering in vendored Anton and Bebas Neue, a halftone title band, badge ribbon, grain and vignette — with one-click PNG export at 1080 x 1080, 1080 x 1350 and 1920 x 1080. Everything runs in the browser: your photos never leave your machine, and there is no watermark. All art, lettering and sample photos are original; nothing here uses Rockstar Games artwork, logos or fonts.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — load a photo (or try the Skyline / Beach samples), pick a layout and a grade, type a caption, and export.

## How it works

- `app/index.html` + `app/style.css` — the editor page (dark studio theme).
- `app/src/main.js` — wires the editor: photo loading, pickers, per-panel crop, export buttons, `?shot=` scenes.
- `app/src/cover.js` — the cover engine: panels, grades, lettering, halftone title band, badge ribbon, grain, vignette. Deterministic — the same state always renders the same pixels.
- `app/src/layouts.js` — the five multi-panel layouts (unit-coordinate panel geometry).
- `app/src/grades.js` — the five sunset / neon grades (wash, tint, saturation, contrast).
- `app/src/export.js` — renders a cover at an exact post size and downloads it as a PNG.
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=cover` / `?shot=editor`).
- `app/samples/` — two original procedural sample photos (neon sunset skyline, beach at dusk).
- `app/fonts/` — vendored Anton and Bebas Neue (OFL, free to use).
- `main.ts` — the entry program (Node 22, stdlib only): copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — tiny static server for local testing.

## Screenshots

`screenshots/` holds the four entry screenshots: the wide exported cover first, then the editor with a photo loaded, then the square and story covers.

---

<sub>Entered on [make.fun](https://make.fun/?ref=xhh2wh2q&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
