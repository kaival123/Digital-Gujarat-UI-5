import { Component, HostListener, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommandPalette } from './shared/command-palette';
import { SearchService } from './shared/search.service';
import { A11yService, A11Y_PROFILES, A11yProfile } from './shared/a11y.service';

interface A11yTile { label: string; icon: string; on: () => boolean; run: () => void; level?: () => number; badge?: boolean }
import { FormsModule } from '@angular/forms';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { Menubar } from 'primeng/menubar';
import { ScrollTop } from 'primeng/scrolltop';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { IMPORTANT_LINKS, LOGIN_MENU, NAV, QUICK_LINKS, SITE, SOCIAL } from './shared/site';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommandPalette, FormsModule, RouterLink, RouterOutlet, ButtonDirective, Menu, Menubar, ScrollTop, Select, ToggleSwitch, Tooltip,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly site = SITE;
  readonly year = new Date().getFullYear();
  readonly nav = NAV;
  readonly loginMenu = LOGIN_MENU;
  readonly quickLinks = QUICK_LINKS;
  readonly importantLinks = IMPORTANT_LINKS;
  readonly social = SOCIAL;

  search = inject(SearchService);
  progress = signal(0);
  scrolled = signal(false);

  private ticking = false;

  navigating = signal(false);

  private loginTimer?: ReturnType<typeof setTimeout>;
  private loginHover = false;

  /** Login menu opens on mouse hover (and stays open while the pointer is on the button or the menu); touch and keyboard still use click. */
  loginEnter(m: Menu, e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    this.loginHover = true; clearTimeout(this.loginTimer);
    if (!m.visible) m.show(e);
  }
  loginLeave(m: Menu, e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(this.loginTimer);
    this.loginTimer = setTimeout(() => { this.loginHover = false; m.hide(); }, 200);
  }
  loginClick(m: Menu, e: Event) {
    if (this.loginHover && m.visible) return;
    m.toggle(e);
  }
  /** Keep the menu open while the pointer is over the overlay itself. */
  loginShown(m: Menu) {
    const el = document.querySelector<HTMLElement>('.p-menu-overlay');
    if (!el || el.dataset['hover']) return;
    el.dataset['hover'] = '1';
    el.addEventListener('pointerenter', () => clearTimeout(this.loginTimer));
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') this.loginLeave(m, e); });
  }

  constructor() {
    let navTimer: ReturnType<typeof setTimeout> | undefined;
    inject(Router).events.subscribe((e) => {
      // only show the bar if a navigation is still pending after 150ms, so fast page changes never flash it
      if (e instanceof NavigationStart) { clearTimeout(navTimer); navTimer = setTimeout(() => this.navigating.set(true), 150); }
      else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) { clearTimeout(navTimer); this.navigating.set(false); }
    });
    document.addEventListener('click', (e) => {
      const li = this.hoverOpened;
      if (li && (e.target as Element).closest?.('.p-menubar-item-content') && li.contains(e.target as Node) && li.getAttribute('aria-expanded') === 'true') { e.stopPropagation(); this.hoverOpened = null; }
    }, true);
    try { const k = localStorage.getItem('dg-theme'); const t = this.themes.find((x) => x.key === k); if (t && t.key !== 'navy') this.setTheme(t); } catch { /* storage unavailable */ }
    // Passive + rAF-throttled: scrolling never blocks, and signals only change when the value does.
    window.addEventListener('scroll', () => {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => { this.ticking = false; this.onScroll(); });
    }, { passive: true });
  }

  private onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
    if (Math.abs(p - this.progress()) > 0.002) this.progress.set(p);
    const s = h.scrollTop > 60;
    if (s !== this.scrolled()) this.scrolled.set(s);
  }


  // Desktop nav: open a submenu on hover, close it shortly after the pointer leaves (PrimeNG menubar is click-only).
  private navTimer: ReturnType<typeof setTimeout> | undefined;
  private hoverOpened: Element | null = null;
  private static readonly ROOT = '.main-nav .p-menubar-root-list > li';

  @HostListener('document:mouseover', ['$event'])
  onNavHover(e: MouseEvent) {
    if (!matchMedia('(hover: hover)').matches) return;
    const li = (e.target as Element | null)?.closest?.(App.ROOT) ?? null;
    const open = document.querySelector(`${App.ROOT}[aria-expanded="true"]`);
    const toggle = (el: Element) => el.querySelector<HTMLElement>('.p-menubar-item-content')?.click();
    clearTimeout(this.navTimer);
    if (li?.hasAttribute('aria-haspopup')) {
      if (open && open !== li) { this.hoverOpened = null; toggle(open); }
      if (li.getAttribute('aria-expanded') === 'false') { this.hoverOpened = li; this.navTimer = setTimeout(() => toggle(li), 70); }
    } else if (open && open !== li) {
      this.navTimer = setTimeout(() => { this.hoverOpened = null; if (open.getAttribute('aria-expanded') === 'true') toggle(open); }, 220);
    }
  }
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? '');
    if (e.ctrlKey && e.key === 'F2') { e.preventDefault(); this.toggleA11yByKey(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.search.open.update((o) => !o); }
    else if (e.key === '/' && !typing) { e.preventDefault(); this.search.show(); }
  }



  a11y = inject(A11yService);
  a11yOpen = signal(false);
  a11yView = signal<'grid' | 'list'>('grid');
  a11yOpenSections = signal<Record<string, boolean>>({ profile: false, color: true, content: true, orient: true });
  readonly profiles = A11Y_PROFILES;
  private a11yTrigger: HTMLElement | null = null;

  openA11y(e: Event) {
    e.stopPropagation();
    if (this.a11yOpen()) { this.closeA11y(); return; }
    this.a11yTrigger = e.currentTarget as HTMLElement;
    this.themeOpen.set(false);
    this.a11yOpen.set(true);
    setTimeout(() => document.querySelector<HTMLElement>('.ax-close')?.focus(), 60);
  }
  closeA11y() { this.a11yOpen.set(false); this.a11yTrigger?.focus(); }
  toggleA11yByKey() {
    if (this.a11yOpen()) { this.closeA11y(); return; }
    this.a11yTrigger = document.activeElement as HTMLElement | null;
    this.themeOpen.set(false);
    this.a11yOpen.set(true);
    setTimeout(() => document.querySelector<HTMLElement>('.ax-close')?.focus(), 60);
  }
  toggleSection(k: string) { this.a11yOpenSections.update((s) => ({ ...s, [k]: !s[k] })); }
  activeProfile = signal<string | null>(null);
  applyProfile(p: A11yProfile) {
    if (this.activeProfile() === p.key) { this.resetA11y(); return; } // tapping the active profile turns it off
    this.a11y.applyProfile(p); this.setFontScale(p.text ?? 100); this.activeProfile.set(p.key);
  }
  resetA11y() { this.activeProfile.set(null); this.a11y.reset(); this.setFontScale(100); if (this.dark()) this.toggleDark(false); }

  /** 0 = normal, 1 = 115 %, 2 = 130 % */
  textLevel = computed(() => (this.fontScale() >= 130 ? 2 : this.fontScale() >= 115 ? 1 : 0));
  cycleText() { this.setFontScale([115, 130, 100][this.textLevel()]); }

  private tile(label: string, icon: string, on: () => boolean, run: () => void, level?: () => number): A11yTile { return { label, icon, on, run, level }; }
  readonly colorTiles: A11yTile[] = [
    this.tile('Monochrome', 'svg:drop-dots', () => this.a11y.prefs().gray, () => this.a11y.toggle('gray')),
    this.tile('High Saturate', 'svg:drop-half', () => this.a11y.prefs().satHigh, () => this.a11y.setSaturation('satHigh')),
    this.tile('Low Saturate', 'svg:drop-fade', () => this.a11y.prefs().satLow, () => this.a11y.setSaturation('satLow')),
    this.tile('Dark Mode', 'pi-moon', () => this.dark(), () => this.toggleDark(!this.dark())),
    this.tile('Invert Color', 'pi-sync', () => this.a11y.prefs().invert, () => this.a11y.toggle('invert')),
    this.tile('High Contrast', 'pi-eye', () => this.a11y.prefs().contrast, () => this.a11y.toggle('contrast')),
  ];
  readonly contentTiles: A11yTile[] = [
    this.tile('Bigger Text', 'A+', () => this.textLevel() > 0, () => this.cycleText(), () => this.textLevel()),
    this.tile('Line Height', 'svg:lineh', () => this.a11y.prefs().lineh > 0, () => this.a11y.cycle('lineh'), () => this.a11y.prefs().lineh),
    this.tile('Text Spacing', 'svg:spacing', () => this.a11y.prefs().spacing > 0, () => this.a11y.cycle('spacing'), () => this.a11y.prefs().spacing),
    this.tile('Highlight Links', 'pi-link', () => this.a11y.prefs().links, () => this.a11y.toggle('links')),
    this.tile('Dyslexia Friendly', 'Df', () => this.a11y.prefs().dyslexia, () => this.a11y.toggle('dyslexia')),
    { ...this.tile('Text Magnify', 'pi-search-plus', () => this.a11y.prefs().magnify, () => this.a11y.toggle('magnify')), badge: true },
    this.tile('Cursor Size', 'pi-arrow-up-left', () => this.a11y.prefs().cursor > 0, () => this.a11y.cycle('cursor'), () => Math.min(2, this.a11y.prefs().cursor)),
  ];
  readonly orientTiles: A11yTile[] = [
    this.tile('Screen Reader', 'pi-volume-up', () => this.a11y.prefs().reader, () => this.a11y.toggle('reader')),
    this.tile('Voice Support', 'pi-microphone', () => this.a11y.prefs().voice, () => this.a11y.toggle('voice')),
    this.tile('Pause Animation', 'pi-pause', () => this.a11y.prefs().motion, () => this.a11y.toggle('motion')),
    this.tile('Hide Images', 'pi-image', () => this.a11y.prefs().images, () => this.a11y.toggle('images')),
    this.tile('Focus Mode', 'pi-bullseye', () => this.a11y.prefs().focusMode, () => this.a11y.toggle('focusMode')),
    this.tile('Reading Guides', 'pi-align-justify', () => this.a11y.prefs().guide, () => this.a11y.toggle('guide')),
    this.tile('Focus Ring', 'pi-stop', () => this.a11y.prefs().focus, () => this.a11y.toggle('focus')),
    this.tile('Light Mode', 'pi-wifi', () => this.a11y.prefs().lite, () => this.a11y.toggle('lite')),
  ];

  setLanguage(code: string) { document.documentElement.lang = code; }
  readonly themes = [
    { key: 'navy', name: 'Govt Blue', main: '#1e40af', a2: '#2563eb', a3: '#bfdbfe' },
    { key: 'jade', name: 'Teal Green', main: '#0f766e', a2: '#059669', a3: '#99f6e4' },
    { key: 'indigo', name: 'Indigo', main: '#4f46e5', a2: '#8b5cf6', a3: '#c4b5fd' },
    { key: 'sky', name: 'Sky', main: '#0284c7', a2: '#38bdf8', a3: '#bae6fd' },
    { key: 'emerald', name: 'Emerald', main: '#059669', a2: '#34d399', a3: '#a7f3d0' },
    { key: 'rose', name: 'Rose', main: '#e11d48', a2: '#fb7185', a3: '#fecdd3' },
    { key: 'amber', name: 'Amber', main: '#d97706', a2: '#fbbf24', a3: '#fde68a' },
    { key: 'tricolour', name: 'Tricolour', main: '#06038d', a2: '#ff9933', a3: '#ffdcb8', dot: 'linear-gradient(135deg,#ff9933 0 34%,#fff 34% 66%,#138808 66%)' },
    { key: 'saffron', name: 'Saffron', main: '#c2410c', a2: '#ff9933', a3: '#ffe0c2' },
    { key: 'indiagreen', name: 'India Green', main: '#138808', a2: '#22a516', a3: '#c8f7bf' },
    { key: 'chakra', name: 'Chakra Blue', main: '#06038d', a2: '#3f3fd1', a3: '#c9c9ff' },
  ];
  theme = signal(this.themes[0]);
  themeOpen = signal(false);

  setTheme(t: (typeof this.themes)[number]) {
    this.theme.set(t);
    const s = document.documentElement.style;
    const n = parseInt(t.main.slice(1), 16);
    s.setProperty('--brand', t.main);
    s.setProperty('--brand-rgb', `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`);
    s.setProperty('--brand-2', t.a2);
    s.setProperty('--brand-3', t.a3);
    // banner highlight (the "cyan" accent) follows the theme: a lightened secondary colour; the default Govt Blue keeps true cyan
    const hl = t.key === 'navy' ? [34, 211, 238] : [0, 1, 2].map((k) => Math.round(((parseInt(t.a2.slice(1), 16) >> (16 - 8 * k)) & 255) * 0.62 + 255 * 0.38));
    s.setProperty('--cyan', 'rgb(' + hl.join(',') + ')');
    s.setProperty('--cyan-rgb', hl.join(', '));
    s.setProperty('--brand-2-rgb', [0, 1, 2].map((k) => (parseInt(t.a2.slice(1), 16) >> (16 - 8 * k)) & 255).join(', '));
    try { localStorage.setItem('dg-theme', t.key); } catch { /* storage unavailable */ }
  }

  @HostListener('document:click')
  closeThemePicker() { if (this.themeOpen()) this.themeOpen.set(false); }

  @HostListener('document:keydown.escape')
  escThemePicker() { this.themeOpen.set(false); if (this.a11yOpen()) this.closeA11y(); }
  dark = signal(false);
  fontScale = signal(100);

  languages = [
    { label: 'English', code: 'en' },
    { label: 'ગુજરાતી', code: 'gu' },
  ];
  language = this.languages[0];

  toggleDark(on: boolean) {
    this.dark.set(on);
    document.documentElement.classList.toggle('app-dark', on);
  }

  setFontScale(v: number) { this.fontScale.set(v); document.documentElement.style.fontSize = v + '%'; }

  setFont(delta: number) {
    const v = delta === 0 ? 100 : Math.min(130, Math.max(85, this.fontScale() + delta));
    this.fontScale.set(v);
    document.documentElement.style.fontSize = v + '%';
  }

  /** Jump past the banner/breadcrumb to the first real content block of the current page. */
  skipToMain(e: Event) {
    e.preventDefault();
    const el = document.querySelector<HTMLElement>('[data-main]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el?.focus({ preventScroll: true });
  }
}
