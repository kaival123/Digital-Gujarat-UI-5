import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { abs } from '../shared/site';
import manuals from '../data/manuals.json';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-manual',
  imports: [PageHero, Reveal],
  template: `
    <app-page-hero icon="pi pi-book" title="Sugam User Manual" subtitle="Download step-by-step guides for every Sugam service." [trail]="[{ label: 'Sugam Digital Gujarat', routerLink: '/sugam-digital-gujarat' }]" />
    <section class="section" data-main tabindex="-1">
      <div class="container">
        @for (g of groups; track g.title) {
          <h2 class="group-title" appReveal="left">{{ g.title }}</h2>
          <div class="manual-grid">
            @for (l of g.links; track l.url; let i = $index) {
              <a class="manual" [appReveal]="'up'" [revealDelay]="(i % 3) * 70" [href]="l.url" target="_blank" rel="noopener">
                <i class="pi pi-file-pdf"></i>
                <span>{{ l.label }}</span>
                <i class="pi pi-download dl"></i>
              </a>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class UserManualPage {
  groups = manuals.map((g) => ({ title: g.title, links: g.links.map((l) => ({ label: l.label, url: abs(l.url) })) }));
}
