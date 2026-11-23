import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';

/** Mirrors the official Services/ServiceDetails.aspx page, which is a "Coming Soon" placeholder. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-service-coming-soon',
  imports: [RouterLink, PageHero, Reveal],
  template: `
    <app-page-hero icon="pi pi-cog" title="Services" subtitle="Service details" [trail]="[{ label: 'Services' }]" />
    <section class="section cs" data-main tabindex="-1">
      <span class="cs-blob cs-blob-a" aria-hidden="true"></span>
      <span class="cs-blob cs-blob-b" aria-hidden="true"></span>
      <div class="container">
        <article class="cs-card" appReveal="zoom">
          <div class="cs-art" aria-hidden="true">
            <span class="cs-gear cs-gear-1"><i class="pi pi-cog"></i></span>
            <span class="cs-gear cs-gear-2"><i class="pi pi-cog"></i></span>
            <span class="cs-badge"><i class="pi pi-wrench"></i></span>
          </div>
          <p class="cs-kicker">Message</p>
          <h2>Coming Soon<span class="cs-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></h2>
          <p class="cs-text">This page is under construction.</p>
          <div class="cs-bar" role="presentation"><i></i></div>
          <hr>
          <p class="cs-back">Go back to <a routerLink="/">Home page</a> and try with your user credentials.</p>
          <div class="cs-actions">
            <a class="cs-btn cs-btn-main" routerLink="/"><i class="pi pi-home"></i> Home page</a>
            <a class="cs-btn" routerLink="/services/citizen"><i class="pi pi-th-large"></i> Browse services</a>
            <a class="cs-btn" routerLink="/citizen-login"><i class="pi pi-sign-in"></i> Citizen login</a>
          </div>
        </article>
      </div>
    </section>
  `,
})
export class ServiceComingSoonPage {}
