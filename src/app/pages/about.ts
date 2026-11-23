import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { IMG } from '../shared/site';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import citizen from '../data/citizen.json';
import sugam from '../data/sugam.json';
import dss from '../data/dss.json';
import janseva from '../data/janseva.json';
import linked from '../data/linked.json';
import { A11yService } from '../shared/a11y.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-about',
  imports: [RouterLink, ButtonDirective, Card, PageHero, Reveal],
  template: `
    <app-page-hero title="About Us" subtitle="An e-governance platform of the Government of Gujarat." icon="pi pi-info-circle" />
    <section class="section" data-main tabindex="-1">
      <div class="container">
        <div class="kpi-row" appReveal="up">
          @for (k of kpis; track k.label) { <div class="kpi"><span class="kpi-ic"><i [class]="k.icon"></i></span><b>{{ k.value }}</b><small>{{ k.label }}</small></div> }
        </div>
      </div>
      <div class="container about">
        <div class="cf" appReveal="left" role="region" aria-roledescription="carousel" aria-label="Digital Gujarat in action" tabindex="0"
          (keydown.arrowleft)="step(-1)" (keydown.arrowright)="step(1)" (mouseenter)="hover = true" (mouseleave)="hover = false" (focusin)="hover = true" (focusout)="hover = false"
          (pointerdown)="down($event)" (pointerup)="up($event)" (pointercancel)="startX = null">
          <div class="cf-stage">
            @for (p of photos; track p.src; let i = $index) {
              <figure class="cf-card" [attr.data-pos]="pos(i)" [attr.aria-hidden]="pos(i) !== 0" (click)="go(i)">
                <img [src]="p.src" [alt]="p.alt" loading="lazy" draggable="false">
              </figure>
            }
          </div>
          <button type="button" class="cf-nav prev" aria-label="Previous photo" (click)="step(-1)"><i class="pi pi-chevron-left" aria-hidden="true"></i></button>
          <button type="button" class="cf-nav next" aria-label="Next photo" (click)="step(1)"><i class="pi pi-chevron-right" aria-hidden="true"></i></button>
          <div class="cf-dots">
            @for (p of photos; track p.src; let i = $index) {
              <button type="button" [class.on]="i === active()" [attr.aria-label]="'Show photo ' + (i + 1)" [attr.aria-current]="i === active()" (click)="go(i)"></button>
            }
          </div>
        </div>
        <div class="about-copy" appReveal="right">
          <h2>Digital <span class="accent">Gujarat</span></h2>
          <p>Digital Gujarat is an e-governance platform by the Government of Gujarat, providing streamlined access to essential services like certificates, scholarships, and welfare schemes. It aims to bridge the digital divide and enhance transparency and efficiency in government services.</p>
          <p>With a user-friendly design, the portal brings services directly to citizens, eliminating the need for physical visits to offices. Digital Gujarat empowers residents to access and track government resources anytime, anywhere.</p>
          <div class="hero-actions">
            <a pButton routerLink="/sugam-digital-gujarat">Explore Sugam services <i class="pi pi-arrow-right"></i></a>
            <a pButton variant="text" routerLink="/help-desk"><i class="pi pi-phone"></i> Contact support</a>
          </div>
        </div>
      </div>
      <div class="container feature-row">
        @for (f of features; track f.title; let i = $index) {
          <p-card [appReveal]="'up'" [revealDelay]="i * 110">
            <ng-template #header><span class="perk-icon big"><i [class]="f.icon"></i></span></ng-template>
            <h3>{{ f.title }}</h3>
            <p>{{ f.text }}</p>
          </p-card>
        }
      </div>
    </section>
  `,
})

export class AboutPage {
  kpis = [
    { icon: 'pi pi-th-large', value: citizen.length + sugam.length + dss.length + janseva.length, label: 'Online services' },
    { icon: 'pi pi-link', value: linked.rows.length, label: 'Linked department services' },
    { icon: 'pi pi-briefcase', value: 4, label: 'Service channels' },
  ];
  photos = [
    { src: IMG + 'assets/img/about/011.png', alt: 'Two farmers looking at a laptop together in a green field' },
    { src: IMG + 'assets/img/about/022.png', alt: 'A smiling man using a mobile phone' },
    { src: IMG + 'assets/img/about/033.png', alt: 'A young man working on a laptop near a village cattle shed' },
  ];
  active = signal(0);
  hover = false;
  startX: number | null = null;
  private a11y = inject(A11yService);
  private timer = setInterval(() => { if (!this.hover && !this.a11y.motionOff()) this.step(1); }, 4500);
  private _stop = inject(DestroyRef).onDestroy(() => clearInterval(this.timer));

  /** Position of slide i relative to the front card: 0 = front, 1 and 2 = stacked behind it (further back), anything else is parked out of sight. */
  pos(i: number) {
    const n = this.photos.length, r = (i - this.active() + n) % n;
    return r > 2 ? 'far' : r;
  }
  step(d: number) { this.active.update((a) => (a + d + this.photos.length) % this.photos.length); }
  go(i: number) { this.active.set(i); }
  down(e: PointerEvent) { this.startX = e.clientX; }
  up(e: PointerEvent) {
    if (this.startX === null) return;
    const dx = e.clientX - this.startX;
    this.startX = null;
    if (Math.abs(dx) > 40) this.step(dx < 0 ? 1 : -1);
  }
  features = [
    { icon: 'pi pi-file-check', title: 'Essential services', text: 'Certificates, scholarships and welfare schemes through a single portal.' },
    { icon: 'pi pi-eye', title: 'Transparent & efficient', text: 'Bridging the digital divide and making government services more transparent.' },
    { icon: 'pi pi-clock', title: 'Anytime, anywhere', text: 'Access and track government resources without visiting an office.' },
  ];
}
