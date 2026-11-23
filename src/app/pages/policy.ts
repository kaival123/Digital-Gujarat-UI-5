import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import policies from '../data/policies.json';

interface Block { t: 'h' | 'p' | 'li'; x: string; }

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-policy',
  imports: [RouterLink, RouterLinkActive, PageHero, Reveal],
  template: `
    <app-page-hero [title]="title()" subtitle="Policies and statements for the Digital Gujarat portal." icon="pi pi-shield" [trail]="[{ label: 'Policies' }]" />
    <section class="section" data-main tabindex="-1">
      <div class="container policy">
      <aside class="policy-rail">
        <p class="policy-title">Policies</p>
        @for (p of links; track p.route) { <a [routerLink]="p.route" routerLinkActive="on">{{ p.label }} <i class="pi pi-arrow-right go"></i></a> }
      </aside>
      <article class="prose" appReveal="up">
        @for (b of blocks(); track $index) {
          @switch (b.t) {
            @case ('h') { <h2>{{ b.x }}</h2> }
            @case ('li') { <p class="bullet"><i class="pi pi-check-circle"></i><span>{{ b.x }}</span></p> }
            @default { <p>{{ b.x }}</p> }
          }
        }
      </article>
      </div>
    </section>
  `,
})
export class PolicyPage {
  readonly links = [
    { label: 'Terms & Conditions', route: '/terms-conditions' }, { label: 'Privacy Policy', route: '/privacy-policy' }, { label: 'Copyright Policy', route: '/copyright-policy' },
    { label: 'Disclaimer', route: '/disclaimer' }, { label: 'Hyperlinking Policy', route: '/hyperlinking-policy' }, { label: 'Accessibility Statement', route: '/accessibility-statement' },
  ];
  private data = toSignal(inject(ActivatedRoute).data, { requireSync: true });
  title = computed<string>(() => this.data()['title']);
  blocks = computed<Block[]>(() => (policies as Record<string, Block[]>)[this.data()['key']] ?? []);
}
