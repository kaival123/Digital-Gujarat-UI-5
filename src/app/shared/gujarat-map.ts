import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, signal, viewChild } from '@angular/core';
import { whenAppReady } from './app-ready';
import { HUBS } from './gujarat-geo';
import { GujaratScene } from './gujarat-scene';

/** Interactive 3D hologram of Gujarat. Loaded lazily (@defer) from the home hero. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-gujarat-map',
  template: `
    <div class="gm" #wrap role="group" aria-label="Interactive 3D map of Gujarat showing connected digital service hubs"
         (pointermove)="move($event)" (pointerleave)="leave()" (pointerdown)="down($event)">
      <canvas #cv aria-hidden="true"></canvas>
      <div class="gm-tip" #tip hidden aria-hidden="true"><b></b><span></span></div>
      @if (!ok()) { <p class="gm-fallback">Interactive map unavailable on this device.</p> }
    </div>
    <ul class="gm-chips" aria-label="Key hubs on the Digital Gujarat network">
      @for (h of chips; track h.id) {
        <li>
          <button type="button" [class.on]="active() === h.id" [attr.aria-pressed]="active() === h.id"
                  (mouseenter)="hint(h.id)" (mouseleave)="hint(null)" (focus)="hint(h.id)" (blur)="hint(null)" (click)="pick(h.id)">
            <i aria-hidden="true"></i>{{ h.name }}
          </button>
        </li>
      }
    </ul>`,
})
export class GujaratMap implements OnDestroy {
  readonly chips = HUBS.filter((h) => h.major);
  readonly ok = signal(true);
  readonly active = signal<string | null>(null);
  private pinned: string | null = null;

  private wrap = viewChild.required<ElementRef<HTMLElement>>('wrap');
  private cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private tip = viewChild.required<ElementRef<HTMLElement>>('tip');
  private scene?: GujaratScene;
  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private visible = true;
  private ready = false;
  private cancelReady = () => {};
  private onVis = () => this.sync();

  constructor() {
    afterNextRender(() => {
      const canvas = this.cv().nativeElement;
      if (!canvas.getContext) { this.ok.set(false); return; }
      const root = document.documentElement.classList;
      const still = matchMedia('(prefers-reduced-motion: reduce)').matches || root.contains('a11y-nomotion') || root.contains('lite');
      this.scene = new GujaratScene(canvas, this.tip().nativeElement, { onHover: (id) => { if (!this.pinned) this.active.set(id); } }, !still);
      const wrap = this.wrap().nativeElement;
      this.ro = new ResizeObserver(() => { const r = wrap.getBoundingClientRect(); this.scene?.resize(r.width, r.height); });
      this.ro.observe(wrap);
      this.io = new IntersectionObserver((e) => { this.visible = e.some((x) => x.isIntersecting); this.sync(); }, { threshold: 0.05 });
      this.io.observe(wrap);
      document.addEventListener('visibilitychange', this.onVis);
      const r = wrap.getBoundingClientRect(); this.scene.resize(r.width, r.height);
      this.cancelReady = whenAppReady(() => { this.ready = true; this.sync(); });
    });
  }

  private sync() { if (this.ready && this.visible && !document.hidden) this.scene?.start(); else this.scene?.stop(); }

  private local(e: PointerEvent) { const r = this.wrap().nativeElement.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  move(e: PointerEvent) { if (e.pointerType !== 'touch') this.scene?.setPointer(this.local(e)); }
  leave() { this.scene?.setPointer(null); }
  down(e: PointerEvent) {
    if (e.pointerType !== 'touch') return;
    this.scene?.setPointer(this.local(e));
    const id = this.scene?.hoveredId() ?? null;
    this.pinned = id; this.active.set(id); this.scene?.setActive(id);
  }
  hint(id: string | null) { if (!this.pinned) { this.active.set(id); this.scene?.setActive(id); } }
  pick(id: string) {
    this.pinned = this.pinned === id ? null : id;
    this.active.set(this.pinned); this.scene?.setActive(this.pinned);
  }

  ngOnDestroy() {
    this.cancelReady(); this.scene?.destroy(); this.ro?.disconnect(); this.io?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
  }
}
