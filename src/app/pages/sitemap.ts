import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { abs, routeFor } from '../shared/site';
import sitemap from '../data/sitemap.json';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sitemap',
  imports: [RouterLink, Card, PageHero, Reveal],
  template: `
    <app-page-hero title="Site Map" subtitle="Every section of Digital Gujarat at a glance." icon="pi pi-sitemap" />
    <section class="section" data-main tabindex="-1">
      <div class="container sitemap-grid">
        @for (g of groups; track g.title; let i = $index) {
          <p-card [header]="g.title" [appReveal]="'up'" [revealDelay]="(i % 3) * 90">
            <ul class="link-list">
              @for (l of g.links; track $index) {
                <li>
                  @if (l.route) { <a [routerLink]="l.route">{{ l.label }}</a> }
                  @else { <a [href]="l.url" target="_blank" rel="noopener">{{ l.label }}</a> }
                </li>
              }
            </ul>
          </p-card>
        }
      </div>
    </section>
  `,
})
export class SitemapPage {
  groups = sitemap.map((g) => ({ title: g.title, links: g.links.map((l) => ({ label: l.label, route: routeFor(l.url), url: abs(l.url) })) }));
}
