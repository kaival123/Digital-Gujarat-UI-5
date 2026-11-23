import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Reveals an element with a CSS animation the first time it scrolls into view.
 * Usage: <div appReveal="up" [revealDelay]="120">
 */
@Directive({ selector: '[appReveal]', host: { class: 'reveal', '[attr.data-reveal]': 'variant() || "up"' } })
export class Reveal implements OnInit, OnDestroy {
  variant = input<'up' | 'down' | 'left' | 'right' | 'zoom' | ''>('', { alias: 'appReveal' });
  revealDelay = input(0);
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private io?: IntersectionObserver;
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    const delay = this.revealDelay();
    this.el.style.transitionDelay = delay + 'ms';
    if (typeof IntersectionObserver === 'undefined') { this.show(delay); return; }
    this.io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { this.show(delay); this.io?.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    this.io.observe(this.el);
  }

  /** Play the entrance, then drop the delay so later hover/tilt transitions respond instantly. */
  private show(delay: number) {
    this.el.classList.add('in');
    this.timer = setTimeout(() => { this.el.style.transitionDelay = '0ms'; this.el.classList.add('done'); }, delay + 800);
  }
  ngOnDestroy() { this.io?.disconnect(); clearTimeout(this.timer); }
}

/** Counts up to a number when it scrolls into view. Usage: <span [appCounter]="486718029"> */
@Directive({ selector: '[appCounter]' })
export class Counter implements OnInit, OnDestroy {
  appCounter = input.required<number>();
  duration = input(1600);
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private io?: IntersectionObserver;
  private raf = 0;

  ngOnInit() {
    const target = this.appCounter();
    this.el.textContent = '0';
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof IntersectionObserver === 'undefined' || reduce) { this.el.textContent = target.toLocaleString('en-IN'); return; }
    this.io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      this.io?.disconnect();
      const t0 = performance.now(), d = this.duration();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / d);
        this.el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN');
        if (p < 1) this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    this.io.observe(this.el);
  }
  ngOnDestroy() { this.io?.disconnect(); cancelAnimationFrame(this.raf); }
}

/** Subtle 3D tilt that follows the pointer. Usage: <article appTilt> */
@Directive({ selector: '[appTilt]', host: { '(pointermove)': 'move($event)', '(pointerleave)': 'leave()' } })
export class Tilt {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  move(e: PointerEvent) {
    if (e.pointerType === 'touch') return;
    const r = this.el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    this.el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    this.el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
    this.el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(0)}%`);
    this.el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(0)}%`);
  }
  leave() { this.el.style.setProperty('--rx', '0deg'); this.el.style.setProperty('--ry', '0deg'); }
}
