import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { SITE } from '../shared/site';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-help-desk',
  imports: [RouterLink, PageHero, Reveal],
  template: `
    <app-page-hero title="Helpdesk Support" subtitle="Our support team is here to help you with any service." icon="pi pi-headphones" [chips]="['10 AM – 6 PM', '7 days a week']" />
    <section class="section hd" data-main tabindex="-1">
      <span class="hd-blob hd-blob-a" aria-hidden="true"></span>
      <span class="hd-blob hd-blob-b" aria-hidden="true"></span>
      <div class="container">

        <div class="hd-top">
          <div class="hd-copy" appReveal="left">
            <span class="hd-tag"><i class="pi pi-info-circle"></i> Helpdesk Support</span>
            <h2>Need support for any <span class="accent">service?</span></h2>
            <p>The support team is available to assist you from <b>10:00 AM to 6:00 PM, Monday through Sunday</b>. Please feel free to reach out during these hours for any assistance you may need.</p>
            <div class="hd-actions">
              <a class="hd-call" href="tel:18002335500"><span class="hd-ring"><i class="pi pi-phone"></i></span><span><small>Toll Free</small><b>1800 233 5500</b></span></a>
              <a class="hd-call hd-mail" href="mailto:dss-support@gujarat.gov.in"><span class="hd-ring"><i class="pi pi-envelope"></i></span><span><small>Support Email ID</small><b>dss-support&#64;gujarat.gov.in</b></span></a>
            </div>
            <p class="hd-hours" [class.open]="open()"><i class="pi pi-clock"></i> <span class="hd-dot"></span> {{ open() ? 'Support desk is open now' : 'Support desk is closed now — opens 10:00 AM' }}</p>
          </div>
          <div class="hd-art" appReveal="zoom">
            <img src="assets/img/support.svg" alt="Helpdesk illustration" width="447" height="331">
            <span class="hd-chip hd-chip-1"><i class="pi pi-headphones"></i> 7 days a week</span>
            <span class="hd-chip hd-chip-2"><i class="pi pi-clock"></i> 10 AM – 6 PM</span>
          </div>
        </div>

        <div class="hd-head" appReveal="up">
          <h3>Our support team can help you resolve queries related to</h3>
        </div>
        <ul class="hd-topics">
          @for (t of topics; track t.label; let i = $index) {
            <li appReveal="up" [style.--d.ms]="i * 60"><span class="hd-ti"><i class="pi" [class]="t.icon"></i></span><span>{{ t.label }}</span></li>
          }
        </ul>

        <div class="hd-more" appReveal="up">
          <a routerLink="/faq"><i class="pi pi-question-circle"></i><span><b>FAQ</b><small>Quick answers to common questions</small></span></a>
          <a routerLink="/feedback"><i class="pi pi-comments"></i><span><b>Feedback</b><small>Tell us how we can improve</small></span></a>
          <a routerLink="/user-manual"><i class="pi pi-book"></i><span><b>Sugam User Manual</b><small>Step-by-step guide</small></span></a>
          <a [href]="site + 'Download/User_Manual_on_CSP_v1.1.pdf'" target="_blank" rel="noopener"><i class="pi pi-download"></i><span><b>User Manual (English)</b><small>PDF download</small></span></a>
          <a [href]="site + 'Download/GUser_Manual_on_CSP_v1.1.pdf'" target="_blank" rel="noopener"><i class="pi pi-download"></i><span><b>User Manual (Gujarati)</b><small>PDF download</small></span></a>
          <a href="https://swagat.gujarat.gov.in/" target="_blank" rel="noopener"><i class="pi pi-megaphone"></i><span><b>Write to Grievance (Swagat)</b><small>Raise a grievance</small></span></a>
        </div>
      </div>
    </section>
  `,
})
export class HelpDeskPage {
  readonly site = SITE;
  topics = [
    { label: 'Application Related Issue', icon: 'pi-file-edit' },
    { label: 'Scholarship Service Related Issue', icon: 'pi-graduation-cap' },
    { label: 'Sugam Service Related Issue', icon: 'pi-th-large' },
    { label: 'Janseva Service Related Issue', icon: 'pi-users' },
    { label: 'Payment Related Issue', icon: 'pi-wallet' },
    { label: 'Payment Failed Related Issue', icon: 'pi-times-circle' },
    { label: 'Payment Refund Related Issue', icon: 'pi-replay' },
    { label: 'Payment Related Other Issue', icon: 'pi-credit-card' },
  ];
  open = signal(this.isOpen());
  private isOpen() { const h = new Date().getHours(); return h >= 10 && h < 18; }
}
