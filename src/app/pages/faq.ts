import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { RouterLink } from '@angular/router';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { ButtonDirective } from 'primeng/button';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import faq from '../data/faq.json';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-faq',
  imports: [FormsModule, IconField, InputIcon, InputText, RouterLink, Accordion, AccordionPanel, AccordionHeader, AccordionContent, ButtonDirective, PageHero, Reveal],
  template: `
    <app-page-hero title="Frequently Asked Questions" subtitle="Quick answers about Digital Gujarat." icon="pi pi-question-circle" [chips]="[items.length + ' answers']" />
    <section class="section" data-main tabindex="-1">
      <div class="container faq-wrap">
        <div class="faq-main">
        <p class="lead-in">Digital Gujarat is an online portal launched by the Government of Gujarat to provide various digital services to its citizens — scholarships, income certificates, caste certificates, residence certificates and other essential documents.</p>
        <p-iconfield class="faq-search">
          <p-inputicon class="pi pi-search" />
          <input pInputText type="search" autocomplete="off" [ngModel]="q()" (ngModelChange)="q.set($event)" placeholder="Search questions…" aria-label="Search questions" />
        </p-iconfield>
        @if (!shown().length) { <p class="empty"><i class="pi pi-search"></i> No questions match “{{ q() }}”.</p> }
        <p-accordion [value]="0" appReveal="up">
          @for (f of shown(); track f.q) {
            <p-accordion-panel [value]="$index">
              <p-accordion-header>{{ f.q }}</p-accordion-header>
              <p-accordion-content>
                @for (a of f.a; track $index) { <p>{{ a }}</p> }
              </p-accordion-content>
            </p-accordion-panel>
          }
        </p-accordion>
        </div>
        <aside class="help-card sticky" appReveal="up">
          <span class="hc-ic"><i class="pi pi-headphones"></i></span>
          <h3>Still have a question?</h3>
          <p>Our helpdesk is available 10 AM – 6 PM, seven days a week.</p>
          <a pButton routerLink="/help-desk">Contact helpdesk <i class="pi pi-arrow-right"></i></a>
        </aside>
      </div>
    </section>
  `,
})
export class FaqPage {
  items = faq;
  q = signal('');
  shown = computed(() => {
    const t = this.q().trim().toLowerCase();
    return t ? this.items.filter((f) => (f.q + ' ' + f.a.join(' ')).toLowerCase().includes(t)) : this.items;
  });
}
