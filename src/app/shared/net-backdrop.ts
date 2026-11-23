import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, inject, viewChild } from '@angular/core';
import { whenAppReady } from './app-ready';

/**
 * Lightweight "connected network" backdrop for banners: ~36 slow-drifting nodes joined by faint lines.
 * One 2D canvas, pauses when off-screen/hidden, draws a single still frame under reduced motion.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-net-backdrop',
  template: '<canvas #cv aria-hidden="true"></canvas>',
  host: { 'aria-hidden': 'true', class: 'net-backdrop' },
})
export class NetBackdrop implements OnDestroy {
  private cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private raf = 0; private running = false; private visible = true; private ready = false;
  private w = 0; private h = 0; private dpr = 1; private last = 0; private t = 0; private still = false;
  private pts: { x: number; y: number; vx: number; vy: number }[] = [];
  private ro?: ResizeObserver; private io?: IntersectionObserver; private cancel = () => {};
  private vis = () => this.sync();

  constructor() {
    afterNextRender(() => {
      const root = document.documentElement.classList;
      this.still = matchMedia('(prefers-reduced-motion: reduce)').matches || root.contains('a11y-nomotion') || root.contains('lite');
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.host);
      this.io = new IntersectionObserver((e) => { this.visible = e.some((x) => x.isIntersecting); this.sync(); });
      this.io.observe(this.host);
      document.addEventListener('visibilitychange', this.vis);
      this.resize();
      this.cancel = whenAppReady(() => { this.ready = true; this.sync(); });
    });
  }

  private resize() {
    const r = this.host.getBoundingClientRect();
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.dpr = Math.min(devicePixelRatio || 1, 1.75);
    const c = this.cv().nativeElement;
    c.width = Math.round(this.w * this.dpr); c.height = Math.round(this.h * this.dpr);
    const n = Math.round(Math.min(46, Math.max(14, (this.w * this.h) / 14000)));
    let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    this.pts = Array.from({ length: n }, () => ({ x: rnd() * this.w, y: rnd() * this.h, vx: (rnd() - 0.5) * 9, vy: (rnd() - 0.5) * 9 }));
    this.draw();
  }
  private sync() {
    const go = this.ready && this.visible && !document.hidden && !this.still;
    if (go && !this.running) { this.running = true; this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
    else if (!go) { this.running = false; cancelAnimationFrame(this.raf); }
  }
  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.t += dt;
    for (const p of this.pts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0 || p.x > this.w) p.vx *= -1;
      if (p.y < 0 || p.y > this.h) p.vy *= -1;
    }
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };
  private rgb = '125,200,255';
  private draw() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--cyan-rgb').trim();
    this.rgb = /^\d+\s*,\s*\d+\s*,\s*\d+$/.test(v) ? v.replace(/\s/g, '') : '125,200,255';
    const c = this.cv().nativeElement.getContext('2d'); if (!c) return;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.w, this.h);
    const max = Math.min(170, this.w * 0.22), pts = this.pts;
    c.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < max) { c.strokeStyle = `rgba(${this.rgb},${(0.2 * (1 - d / max)).toFixed(3)})`; c.beginPath(); c.moveTo(pts[i].x, pts[i].y); c.lineTo(pts[j].x, pts[j].y); c.stroke(); }
      }
    }
    for (const p of pts) { c.fillStyle = `rgba(${this.rgb},0.6)`; c.beginPath(); c.arc(p.x, p.y, 1.6, 0, 6.283); c.fill(); }
  }
  ngOnDestroy() { this.running = false; cancelAnimationFrame(this.raf); this.ro?.disconnect(); this.io?.disconnect(); this.cancel(); document.removeEventListener('visibilitychange', this.vis); }
}

