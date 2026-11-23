import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { IMG, SOCIAL } from '../shared/site';
import videos from '../data/videos.json';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-videos',
  imports: [ButtonDirective, Dialog, PageHero, Reveal],
  template: `
    <app-page-hero title="Videos" subtitle="Step-by-step video tutorials for Digital Gujarat services." icon="pi pi-video" [chips]="[items.length + ' tutorials']" />
    <section class="section" data-main tabindex="-1">
      <div class="container">
        <div class="video-grid">
          @for (v of items; track v.id; let i = $index) {
            <button type="button" class="video-card" [appReveal]="'up'" [revealDelay]="(i % 4) * 70" (click)="open(v)" [attr.aria-label]="'Play ' + v.title">
              <span class="thumb">
                <img [src]="v.thumb" alt="" loading="lazy" (error)="fallback($event, v.id)">
                <span class="play"><i class="pi pi-play"></i></span>
              </span>
              <h3>{{ v.title }}</h3>
            </button>
          }
        </div>
        <div class="hero-actions">
          <a pButton [outlined]="true" [href]="yt" target="_blank" rel="noopener"><i class="pi pi-youtube"></i> More on YouTube</a>
        </div>
      </div>
    </section>
    <p-dialog [header]="current()?.title ?? ''" [visible]="visible()" (visibleChange)="visible.set($event)" [modal]="true" [dismissableMask]="true" [style]="{ width: 'min(900px, 94vw)' }" (onHide)="stop()">
      @if (visible() && src(); as s) {
        <div class="video-frame"><iframe [src]="s" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
      }
    </p-dialog>
  `,
})
export class VideosPage {
  private san = inject(DomSanitizer);
  yt = SOCIAL[2].url;
  items = videos.map((v) => ({ ...v, thumb: v.img ? IMG + encodeURI(v.img) : `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` }));
  visible = signal(false);
  current = signal<(typeof this.items)[number] | null>(null);
  src = signal<SafeResourceUrl | null>(null);

  open(v: (typeof this.items)[number]) {
    this.current.set(v);
    this.src.set(this.san.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${v.id}?autoplay=1`));
    this.visible.set(true);
  }
  stop() { this.src.set(null); }
  /** If a local thumbnail is ever missing, fall back to the YouTube still once. */
  fallback(e: Event, id: string) {
    const img = e.target as HTMLImageElement, yt = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    if (img.src !== yt) img.src = yt;
  }
}
