// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// ?shot=editor shows the editor with a sample photo loaded. Query parameters:
// photo (skyline|beach), caption, subtitle, badge, layout, grade, size.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  await apply({
    photo: query.get('photo') ?? 'skyline',
    caption: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Neon Coast',
    badge: query.get('badge') ?? 'Vol. VI',
    layout: query.get('layout') ?? 'hero3',
    grade: query.get('grade') ?? 'vice',
    size: query.get('size') ?? 'square',
  });
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
