import { bootstrapApplication } from '@angular/platform-browser';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/*
 * First-paint loader (markup + styles live in index.html so it shows before this bundle arrives).
 * It stays up until ALL of these are true, then fades out and is removed:
 *   1. the Angular app has bootstrapped and its first route has rendered
 *   2. the window "load" event fired (stylesheets, scripts, fonts requested at load, in-page images)
 *   3. web fonts are ready
 *   4. images visible in the first screen are loaded and decoded
 *   5. it has been visible for at least MIN_MS (so a fast/cached load never flashes it)
 * A MAX_MS safety timer guarantees it can never get stuck. Timers are used instead of requestAnimationFrame
 * so it also completes in background tabs.
 */
const MIN_MS = 450;
const MAX_MS = 12000;
const IMG_MS = 4000; // one slow or broken image never holds the page for longer than this

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const windowLoaded = () =>
  new Promise<void>((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', () => r(), { once: true })));

/** Drives the loader's progress bar (0–1) and status text; never moves backwards. */
let progress = 0.06;
function setProgress(p: number, text?: string) {
  progress = Math.max(progress, Math.min(1, p));
  const el = document.getElementById('app-loader');
  if (!el) return;
  el.style.setProperty('--al-p', progress.toFixed(3));
  el.querySelector('.al-bar')?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  const t = document.getElementById('al-text');
  if (t && text) t.textContent = text;
}
const fontsReady = () => (document.fonts?.ready ?? Promise.resolve()).then(() => undefined, () => undefined);

/** Images that are on screen right now (not the off-screen carousel clones, not lazy images far below the fold). */
function firstScreenImages(): HTMLImageElement[] {
  return Array.from(document.images).filter((img) => {
    if (img.closest('#app-loader')) return false;
    const r = img.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  });
}
/** Resolves when an image is decoded, has failed, or IMG_MS has passed — whichever comes first. */
const settle = (img: HTMLImageElement) =>
  img.complete && img.naturalWidth > 0
    ? Promise.resolve()
    : Promise.race([img.decode().catch(() => undefined), wait(IMG_MS)]).then(() => undefined);
const imagesReady = () => {
  const imgs = firstScreenImages();
  let done = 0;
  return Promise.all(imgs.map((img) => settle(img).then(() => setProgress(0.7 + 0.25 * (++done / imgs.length))))).then(() => undefined);
};

function hideLoader() {
  const el = document.getElementById('app-loader');
  const root = document.querySelector('app-root');
  const release = () => {
    document.documentElement.classList.remove('al-loading'); // lets the page's own entrance animations start as the loader fades
    root?.removeAttribute('inert');
    root?.removeAttribute('aria-busy');
  };
  if (!el) { release(); return; }
  let removed = false;
  const remove = () => { if (!removed) { removed = true; el.remove(); performance.mark('loader-removed'); } };
  el.addEventListener('transitionend', (e) => { if (e.target === el && (e as TransitionEvent).propertyName === 'opacity') remove(); });
  release();
  performance.mark('loader-hide-start');
  el.classList.add('al-hide');
  setTimeout(remove, 1200); // fallback if transitionend never fires (background tabs)
}

async function whenReady(router: Router) {
  // 1. first navigation finished (page component created)
  if (!router.navigated) {
    await new Promise<void>((resolve) => {
      const sub = router.events.subscribe((e) => {
        if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) { sub.unsubscribe(); resolve(); }
      });
    });
  }
  setProgress(0.45, 'Preparing services…');
  await wait(60); // let the first render settle so first-screen images exist in the DOM
  // 2-4. everything the first screen needs
  await Promise.all([
    windowLoaded().then(() => setProgress(0.6)),
    fontsReady().then(() => setProgress(0.7, 'Almost there…')),
    imagesReady(),
  ]);
  setProgress(1, 'Ready');
  // 5. never flash: keep it up for at least MIN_MS since navigation start
  await wait(Math.max(0, MIN_MS - performance.now()));
}

bootstrapApplication(App, appConfig)
  .then((appRef) => {
    setProgress(0.3);
    const router = appRef.injector.get(Router);
    return Promise.race([whenReady(router), wait(MAX_MS)]);
  })
  .then(hideLoader)
  .catch((err) => {
    console.error(err);
    const t = document.querySelector('#app-loader .al-text');
    if (t) t.textContent = 'Something went wrong. Please refresh the page.';
  });
