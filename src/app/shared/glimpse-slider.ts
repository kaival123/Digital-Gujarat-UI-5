import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';

export interface GlimpseItem { title: string; img: string; }

/**
 * Glimpses carousel — a 3D coverflow on a navy "hologram" stage.
 * The photos are small, so they are shown as cards (never stretched full-bleed): the active card faces the viewer,
 * its neighbours tilt back in perspective. Caption, arrows, progress line and thumbnails sit beside the cards.
 * Autoplay is a single timer restarted on every change; it stops while hovered/focused, paused, or when autoplay is off.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-glimpse-slider',
  host: { '[class.is-paused]': 'paused() || hover()', '[class.no-auto]': '!autoplay()' },
  template: `
    <div class="gs" role="region" aria-roledescription="carousel" aria-label="Glimpses of Gujarat" tabindex="0"
      (keydown.arrowleft)="step(-1)" (keydown.arrowright)="step(1)"
      (mouseenter)="hover.set(true)" (mouseleave)="hover.set(false)" (focusin)="hover.set(true)" (focusout)="hover.set(false)"
      (pointerdown)="down($event)" (pointerup)="up($event)" (pointercancel)="startX = null">
      <span class="gs-grid" aria-hidden="true"></span>

      <div class="gs-info">
        <span class="gs-kicker"><i aria-hidden="true"></i> Glimpses of Gujarat</span>
        <h3 class="gs-title" aria-live="polite" [attr.key]="active()">{{ items()[active()].title }}</h3>
        <p class="gs-count" aria-hidden="true"><b>{{ pad(active() + 1) }}</b><span>/ {{ pad(items().length) }}</span></p>
        <button type="button" class="gs-view" (click)="view.emit(items()[active()])"><i class="pi pi-expand" aria-hidden="true"></i><span>View photo</span></button>

        <div class="gs-nav">
          <button type="button" class="gs-arrow" aria-label="Previous photo" (click)="step(-1)"><i class="pi pi-arrow-left" aria-hidden="true"></i></button>
          <div class="gs-dots" role="tablist" aria-label="Choose a photo">
            @for (g of items(); track g.title; let i = $index) {
              <button type="button" role="tab" [class.on]="i === active()" [attr.aria-selected]="i === active()" [attr.aria-label]="'Show ' + g.title" (click)="go(i)"><i></i></button>
            }
          </div>
          <button type="button" class="gs-arrow" aria-label="Next photo" (click)="step(1)"><i class="pi pi-arrow-right" aria-hidden="true"></i></button>
        </div>
      </div>

      <div class="gs-stage">
        @for (g of items(); track g.title; let i = $index) {
          <figure class="gs-card" [attr.data-pos]="pos(i)" [attr.aria-hidden]="i !== active()" (click)="i === active() ? view.emit(g) : go(i)">
            <img [src]="g.img" [alt]="g.title" [attr.loading]="i === 0 ? 'eager' : 'lazy'" draggable="false">
            <figcaption>{{ g.title }}</figcaption>
          </figure>
        }
        <span class="gs-floor" aria-hidden="true"></span>
      </div>

      <div class="gs-progress" aria-hidden="true"><i #line [attr.key]="active()"></i></div>
    </div>
  `,
})
export class GlimpseSlider {
  items = input.required<GlimpseItem[]>();
  /** true while something else (e.g. the lightbox) wants the slider to hold still */
  paused = input(false);
  /** false for reduced-motion / "pause animation" users: no timer */
  autoplay = input(true);
  view = output<GlimpseItem>();

  active = signal(0);
  hover = signal(false);
  startX: number | null = null;
  private timer?: ReturnType<typeof setTimeout>;
  readonly ms = 6000;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    effect((onCleanup) => {
      this.active();
      clearTimeout(this.timer);
      if (!this.autoplay() || this.paused() || this.hover() || this.items().length < 2) return;
      this.timer = setTimeout(() => this.step(1), this.ms);
      onCleanup(() => clearTimeout(this.timer));
    });
  }

  pad(n: number) { return n < 10 ? '0' + n : '' + n; }

  /** offset from the active card, wrapped to the shortest direction: -1 left, 0 front, 1 right, ±2 parked */
  pos(i: number) {
    const n = this.items().length;
    let o = (((i - this.active()) % n) + n) % n;
    if (o > n / 2) o -= n;
    return Math.abs(o) > 2 ? (o < 0 ? -2 : 2) : o;
  }
  step(d: number) { const n = this.items().length; this.active.set((this.active() + d + n) % n); }
  go(i: number) { this.active.set(i); }

  down(e: PointerEvent) { this.startX = e.pointerType === 'mouse' ? null : e.clientX; }
  up(e: PointerEvent) {
    if (this.startX === null) return;
    const dx = e.clientX - this.startX;
    this.startX = null;
    if (Math.abs(dx) > 40) this.step(dx < 0 ? 1 : -1);
  }
}
