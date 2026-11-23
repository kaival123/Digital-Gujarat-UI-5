/** Runs `cb` once the first-paint loader (html.al-loading) has gone, so entrance animations are seen rather than played behind it. */
export function whenAppReady(cb: () => void): () => void {
  const el = document.documentElement;
  if (!el.classList.contains('al-loading')) { cb(); return () => {}; }
  const obs = new MutationObserver(() => { if (!el.classList.contains('al-loading')) { obs.disconnect(); cb(); } });
  obs.observe(el, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}
