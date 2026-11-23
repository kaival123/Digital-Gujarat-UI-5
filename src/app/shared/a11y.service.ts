import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from './search.service';

/** Accessibility tools modelled on the UX4G accessibility widget (https://www.ux4g.gov.in/resources/accessibility-widget). */
export interface A11yPrefs {
  // colour
  gray: boolean;       // Monochrome
  satHigh: boolean;    // High Saturate
  satLow: boolean;     // Low Saturate
  invert: boolean;     // Invert Color
  contrast: boolean;   // High Contrast
  // content
  dyslexia: boolean;   // Dyslexia Friendly
  links: boolean;      // Highlight Link
  spacing: number;     // Text Spacing   0 | 1 | 2
  lineh: number;       // Line Height    0 | 1 | 2
  cursor: number;      // Cursor Size    0 | 1 | 2
  magnify: boolean;    // Text Magnify
  // orientation
  focus: boolean;      // Keyboard focus ring
  focusMode: boolean;  // Focus Mode (spotlight on hover)
  guide: boolean;      // Reading Guides
  images: boolean;     // Hide Images
  motion: boolean;     // Pause Animation
  lite: boolean;       // Light mode (data saver)
  reader: boolean;     // Screen Reader
  voice: boolean;      // Voice Support
}

export type A11yFlag = { [K in keyof A11yPrefs]: A11yPrefs[K] extends boolean ? K : never }[keyof A11yPrefs];
export type A11yLevel = 'spacing' | 'lineh' | 'cursor';
export interface A11yProfile { key: string; name: string; hint: string; icon: string; prefs: Partial<A11yPrefs>; text?: number }
interface NetInfo extends EventTarget { effectiveType?: string; saveData?: boolean }
interface Rec { lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null; start(): void; stop(): void }

const KEY = 'dg-a11y';
const FLAG_CLASS: Record<A11yFlag, string> = {
  gray: 'a11y-gray', satHigh: 'a11y-sat-high', satLow: 'a11y-sat-low', invert: 'a11y-invert', contrast: 'a11y-contrast', dyslexia: 'a11y-dyslexia', links: 'a11y-links',
  magnify: 'a11y-magnify', focus: 'a11y-focus', focusMode: 'a11y-focusmode', guide: 'a11y-guide', images: 'a11y-noimg', motion: 'a11y-nomotion',
  lite: 'lite', reader: 'a11y-reader', voice: 'a11y-voice',
};
const FLAGS = Object.keys(FLAG_CLASS) as A11yFlag[];

export const A11Y_PROFILES: A11yProfile[] = [
  { key: 'seizure', icon: 'svg:brain', name: 'Seizure Safe Profile', hint: 'No motion or flashing, calmer colours', prefs: { motion: true, satLow: true, lite: true } },
  { key: 'colorblind', icon: 'svg:shades', name: 'Color Blindness Profile', hint: 'Stronger colours, highlighted links', prefs: { satHigh: true, links: true, focus: true } },
  { key: 'lowvision', icon: 'pi-eye', name: 'Low Vision Profile', hint: 'High contrast, bigger text and cursor', prefs: { contrast: true, links: true, cursor: 2, spacing: 1, lineh: 1 }, text: 130 },
  { key: 'senior', icon: 'svg:cane', name: 'Senior Citizens', hint: 'Bigger text, clear links, more space', prefs: { links: true, spacing: 1, lineh: 1 }, text: 120 },
  { key: 'visual', icon: 'svg:glasses-sound', name: 'Visually Impaired Profile', hint: 'Screen reader, high contrast, big text', prefs: { reader: true, contrast: true, links: true, focus: true, cursor: 2 }, text: 130 },
  { key: 'motor', icon: 'svg:hand', name: 'Motor Impairment Profile', hint: 'Voice support, big cursor, strong focus', prefs: { voice: true, cursor: 2, focus: true, motion: true } },
  { key: 'dyslexia', icon: 'Df', name: 'Dyslexia Profile', hint: 'Dyslexia friendly font, spacing and guide', prefs: { dyslexia: true, spacing: 1, lineh: 2, guide: true } },
  { key: 'adhd', icon: 'svg:puzzle', name: 'Cognitive Disability / ADHD Profile', hint: 'No motion, focus mode, reading guide', prefs: { motion: true, focusMode: true, guide: true, lineh: 1 } },
];

const defaults = (): A11yPrefs => ({
  gray: false, satHigh: false, satLow: false, invert: false, contrast: false, dyslexia: false, links: false, spacing: 0, lineh: 0, cursor: 0, magnify: false,
  focus: false, focusMode: false, guide: false, images: false, motion: matchMedia('(prefers-reduced-motion: reduce)').matches, lite: false, reader: false, voice: false,
});

const BLOCKS = 'p, li, h1, h2, h3, h4, h5, h6, dt, dd, label, td, th, blockquote, figcaption, article, figure, fieldset, button, a, .service-card, .svc-card, .video-card, .promo-card, .manual, .trend-card, .stat, .p-card';
const VOICE_ROUTES: [RegExp, string][] = [
  [/\b(home|main page)\b/, '/'], [/\babout\b/, '/about-us'], [/\bsugam\b/, '/sugam-digital-gujarat'], [/\bcitizen\b/, '/services/citizen'],
  [/\bvideos?\b/, '/videos'], [/\bfaq|questions\b/, '/faq'], [/\bhelp\b/, '/help-desk'], [/\bfeedback\b/, '/feedback'], [/\blatest|updates?|news\b/, '/latest-update'],
  [/\bmanual\b/, '/user-manual'], [/\bcampaign\b/, '/promotional-campaign'], [/\bsitemap\b/, '/sitemap'],
];

/** User accessibility + data-saver preferences, persisted locally and applied as classes / filters on <html>. */
@Injectable({ providedIn: 'root' })
export class A11yService {
  private router = inject(Router);
  private search = inject(SearchService);

  /** Connection quality reported by the browser ("4g", "3g", "2g", "slow-2g", or "unknown"). */
  readonly connection = signal('unknown');
  readonly saveData = signal(false);
  /** Vertical position (px) of the reading guide bar. */
  readonly guideY = signal(-100);
  /** Element currently lit by Focus Mode. */
  readonly spot = signal<{ x: number; y: number; w: number; h: number } | null>(null);
  /** Enlarged text shown by Text Magnify. */
  readonly magnified = signal<{ text: string; x: number; y: number } | null>(null);
  /** Last message from Voice Support / Screen Reader, shown inside the panel. */
  readonly status = signal('');
  readonly voiceSupported = !!(window as unknown as Record<string, unknown>)['SpeechRecognition'] || !!(window as unknown as Record<string, unknown>)['webkitSpeechRecognition'];
  readonly speechSupported = 'speechSynthesis' in window;

  private readonly saved = this.read();
  readonly prefs = signal<A11yPrefs>({ ...defaults(), ...this.saved });
  /** True when motion should be off for any reason (user choice, OS setting or light mode). */
  readonly motionOff = computed(() => this.prefs().motion || this.prefs().lite);
  /** True when the browser says the connection is slow or Save-Data is on. */
  readonly slowNetwork = computed(() => this.saveData() || ['slow-2g', '2g', '3g'].includes(this.connection()));

  constructor() {
    const root = document.documentElement;
    effect(() => {
      const p = this.prefs();
      for (const k of FLAGS) root.classList.toggle(FLAG_CLASS[k], p[k]);
      root.classList.remove('a11y-sp-1', 'a11y-sp-2', 'a11y-lh-1', 'a11y-lh-2', 'a11y-cur-1', 'a11y-cur-2');
      if (p.cursor) root.classList.add(`a11y-cur-${p.cursor}`);
      if (p.spacing) root.classList.add(`a11y-sp-${p.spacing}`);
      if (p.lineh) root.classList.add(`a11y-lh-${p.lineh}`);
      // colour filters compose on the root element so fixed-position UI keeps working
      const f = [p.gray && 'grayscale(1)', p.satHigh && 'saturate(1.9)', p.satLow && 'saturate(0.45)', p.invert && 'invert(1) hue-rotate(180deg)'].filter(Boolean).join(' ');
      root.style.filter = f;
    });

    // reading guide follows the pointer / finger
    effect((onCleanup) => {
      if (!this.prefs().guide) return;
      const move = (e: MouseEvent | TouchEvent) => this.guideY.set('touches' in e ? e.touches[0].clientY : e.clientY);
      window.addEventListener('mousemove', move, { passive: true });
      window.addEventListener('touchmove', move, { passive: true });
      onCleanup(() => { window.removeEventListener('mousemove', move); window.removeEventListener('touchmove', move); });
    });

    // Focus Mode + Text Magnify share one pointer listener
    effect((onCleanup) => {
      const { focusMode, magnify } = this.prefs();
      if (!focusMode && !magnify) { this.spot.set(null); this.magnified.set(null); return; }
      const over = (e: MouseEvent) => {
        const t = e.target as Element | null;
        const el = t?.closest?.(BLOCKS);
        if (!el || el.closest('.ax-drawer, .ax-fab, .reading-guide')) { this.spot.set(null); this.magnified.set(null); return; }
        if (focusMode) {
          const b = (el.closest('li, p, h1, h2, h3, h4, h5, h6, article, figure, fieldset, .service-card, .svc-card, .video-card, .promo-card, .manual, .stat, .p-card') ?? el).getBoundingClientRect();
          this.spot.set({ x: b.left - 8, y: b.top - 8, w: b.width + 16, h: b.height + 16 });
        }
        if (magnify) {
          const text = ((el.getAttribute('aria-label') || (el as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim()).slice(0, 180);
          this.magnified.set(text ? { text, x: e.clientX, y: e.clientY } : null);
        }
      };
      const leave = () => { this.spot.set(null); this.magnified.set(null); };
      document.addEventListener('mouseover', over, { passive: true });
      document.addEventListener('mousemove', over, { passive: true });
      document.addEventListener('mouseleave', leave);
      onCleanup(() => { document.removeEventListener('mouseover', over); document.removeEventListener('mousemove', over); document.removeEventListener('mouseleave', leave); });
    });

    // Screen Reader: read the element you click, tab to or tap
    effect((onCleanup) => {
      if (!this.prefs().reader || !this.speechSupported) { if (this.speechSupported) speechSynthesis.cancel(); return; }
      const say = (el: Element | null) => {
        if (!el || el.closest('.ax-drawer')) return;
        const block = el.closest(BLOCKS) ?? el;
        const text = ((block.getAttribute('aria-label') || (block as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim()).slice(0, 400);
        if (text) this.speak(text);
      };
      const click = (e: Event) => say(e.target as Element);
      const focus = (e: Event) => say(e.target as Element);
      document.addEventListener('click', click, true);
      document.addEventListener('focusin', focus);
      this.speak('Screen reader on. Click or tab to any text to hear it.');
      onCleanup(() => { document.removeEventListener('click', click, true); document.removeEventListener('focusin', focus); speechSynthesis.cancel(); });
    });

    // Voice Support: simple spoken navigation commands
    effect((onCleanup) => {
      if (!this.prefs().voice) return;
      const Ctor = (window as unknown as Record<string, new () => Rec>)['SpeechRecognition'] ?? (window as unknown as Record<string, new () => Rec>)['webkitSpeechRecognition'];
      if (!Ctor) { this.status.set('Voice support is not available in this browser.'); return; }
      const rec = new Ctor();
      rec.lang = 'en-IN'; rec.continuous = true; rec.interimResults = false;
      let alive = true;
      rec.onresult = (e) => {
        const r = e.results[e.resultIndex];
        if (r?.isFinal) this.command(r[0].transcript.toLowerCase().trim());
      };
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { alive = false; this.status.set('Microphone permission was blocked. Allow it in the browser to use Voice Support.'); this.patch({ voice: false }); }
      };
      rec.onend = () => { if (alive) { try { rec.start(); } catch { /* already started */ } } };
      try { rec.start(); this.status.set('Listening… try “scroll down”, “go to videos”, “open search”, “go back”, “stop voice”.'); } catch { /* ignore */ }
      onCleanup(() => { alive = false; rec.onend = null; try { rec.stop(); } catch { /* ignore */ } this.status.set(''); });
    });

    const conn = (navigator as Navigator & { connection?: NetInfo }).connection;
    if (conn) {
      const sync = () => {
        this.connection.set(conn.effectiveType ?? 'unknown');
        this.saveData.set(!!conn.saveData);
        // Only auto-enable light mode when the visitor has never chosen either way.
        if (this.slowNetwork() && this.saved.lite === undefined) this.prefs.update((p) => ({ ...p, lite: true }));
      };
      sync();
      conn.addEventListener('change', sync);
    }
  }

  toggle(key: A11yFlag) {
    if (key === 'voice' && !this.prefs().voice && !this.voiceSupported) { this.status.set('Voice support is not available in this browser (try Chrome or Edge).'); return; }
    if (key === 'reader' && !this.prefs().reader && !this.speechSupported) { this.status.set('Screen reader is not available in this browser.'); return; }
    this.patch({ [key]: !this.prefs()[key] } as Partial<A11yPrefs>);
  }

  /** Saturation levels are mutually exclusive. */
  setSaturation(kind: 'satHigh' | 'satLow') {
    const on = !this.prefs()[kind];
    this.patch({ satHigh: kind === 'satHigh' ? on : false, satLow: kind === 'satLow' ? on : false });
  }

  cycle(key: A11yLevel) { this.patch({ [key]: (this.prefs()[key] + 1) % 3 } as Partial<A11yPrefs>); }

  applyProfile(p: A11yProfile) {
    const next = { ...defaults(), ...p.prefs };
    if (next.voice && !this.voiceSupported) next.voice = false;
    if (next.reader && !this.speechSupported) next.reader = false;
    this.patch(next);
  }

  reset() {
    for (const k of Object.keys(this.saved) as (keyof A11yPrefs)[]) delete this.saved[k];
    this.prefs.set(defaults());
    this.status.set('');
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  }

  get anyActive() {
    const p = this.prefs();
    return FLAGS.some((k) => k !== 'motion' && p[k]) || p.spacing > 0 || p.lineh > 0 || p.cursor > 0 || (p.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  private speak(text: string) {
    if (!this.speechSupported) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = document.documentElement.lang === 'gu' ? 'gu-IN' : 'en-IN';
    speechSynthesis.speak(u);
  }

  private command(said: string) {
    this.status.set(`Heard: “${said}”`);
    if (/stop (voice|listening)|voice off/.test(said)) { this.patch({ voice: false }); return; }
    if (/scroll (down|more)|page down/.test(said)) { window.scrollBy({ top: innerHeight * 0.8, behavior: 'smooth' }); return; }
    if (/scroll up|page up/.test(said)) { window.scrollBy({ top: -innerHeight * 0.8, behavior: 'smooth' }); return; }
    if (/(go to |scroll to )?(the )?top/.test(said)) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (/(go to |scroll to )?(the )?(bottom|end)/.test(said)) { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }); return; }
    if (/go back|back/.test(said)) { history.back(); return; }
    if (/search|find/.test(said)) { this.search.show(); return; }
    if (/(go to|open|show|take me to)/.test(said)) {
      for (const [re, path] of VOICE_ROUTES) if (re.test(said)) { void this.router.navigateByUrl(path); return; }
    }
  }

  private patch(change: Partial<A11yPrefs>) {
    this.prefs.update((p) => ({ ...p, ...change }));
    Object.assign(this.saved, change);
    this.write();
  }

  private read(): Partial<A11yPrefs> {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<A11yPrefs>; } catch { return {}; }
  }

  private write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.saved)); } catch { /* storage unavailable */ }
  }
}
