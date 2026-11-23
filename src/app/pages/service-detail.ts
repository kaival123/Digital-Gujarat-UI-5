import { Component, DestroyRef, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { IMG, SITE } from '../shared/site';
import { CONFIG, Item } from './service-list';
import details from '../data/service-details.json';

const LISTS: Record<string, { label: string; route: string }> = {
  citizen: { label: 'Citizen Services', route: '/services/citizen' },
  sugam: { label: 'Sugam Digital Gujarat', route: '/sugam-digital-gujarat' },
  dss: { label: 'Digital SevaSetu Services', route: '/services/digital-sevasetu' },
  janseva: { label: 'Janseva Services', route: '/services/janseva' },
};

interface Link { t: string; u: string; }
interface Line { t: string; l?: Link[]; }
interface Seg { text: string; url?: string; }
interface InfoSet { h: string; p: string; l: Line[]; }
const DATA = details as unknown as { sets: InfoSet[]; svc: Record<string, [number, string]> };

/** Split an instruction into plain text and link segments, e.g. "...please <Click Here>". */
function segments(line: Line): Seg[] {
  let rest = line.t;
  const out: Seg[] = [];
  for (const l of line.l ?? []) {
    const i = rest.indexOf(l.t);
    if (i < 0) continue;
    if (i > 0) out.push({ text: rest.slice(0, i) });
    out.push({ text: l.t, url: l.u.startsWith('http') || l.u.startsWith('mailto:') ? l.u : SITE + l.u.replace(/^(\.\.\/)+/, '').replace(/^\//, '') });
    rest = rest.slice(i + l.t.length);
  }
  if (rest) out.push({ text: rest });
  return out;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-service-detail',
  imports: [RouterLink, PageHero, Reveal, Dialog],
  template: `
    @if (svc(); as s) {
      <app-page-hero [title]="s.title" [subtitle]="list().label" [trail]="trail()" icon="pi pi-file-check" />
      <section class="section sd" data-main tabindex="-1">
        <span class="sd-blob" aria-hidden="true"></span>
        <div class="container sd-grid">

          <aside class="sd-side">
            <div class="sd-box sd-actions" appReveal="left">
              <span class="sd-img"><img [src]="img(s.img)" alt="" width="96" height="96"></span>
              @if (info()?.[1]; as pdf) {
                <a class="sd-act" [href]="pdf" target="_blank" rel="noopener"><span class="sd-ai"><i class="pi pi-file-pdf"></i></span> Download Form <i class="pi pi-external-link sd-go"></i></a>
              }
              <button type="button" class="sd-act" (click)="payOpen.set(true)"><span class="sd-ai"><i class="pi pi-wallet"></i></span> Payment Terms &amp; Condition <i class="pi pi-arrow-up-right sd-go"></i></button>
              <a class="sd-act sd-act-main" routerLink="/citizen-login"><span class="sd-ai"><i class="pi pi-globe"></i></span> Apply Online <i class="pi pi-arrow-right sd-go"></i></a>
              <button type="button" class="sd-save" (click)="toggleSave()" [attr.aria-pressed]="saved()"><i class="pi" [class.pi-heart-fill]="saved()" [class.pi-heart]="!saved()"></i> {{ saved() ? 'Saved' : 'Save service' }}</button>
            </div>

            <div class="sd-box" appReveal="left">
              <h3><i class="pi pi-headphones"></i> Need help?</h3>
              <p>Call the common service portal help-line.</p>
              <a class="sd-call" href="tel:18002335500">1800 233 5500</a>
              <a class="sd-link" routerLink="/help-desk">Helpdesk support <i class="pi pi-arrow-right"></i></a>
              <a class="sd-link" routerLink="/faq">Frequently asked questions <i class="pi pi-arrow-right"></i></a>
            </div>
          </aside>

          <article class="sd-main" appReveal="right">
            <header class="sd-acc-head">
              <button type="button" class="sd-acc-btn" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="sd-ins">
                <span>{{ heading() }}</span><i class="pi pi-chevron-up" [class.flip]="!open()"></i>
              </button>
              @if (canSpeak) {
                <button type="button" class="sd-read" (click)="read()" [class.on]="speaking()" [attr.aria-pressed]="speaking()">
                  <i class="pi" [class.pi-volume-up]="!speaking()" [class.pi-stop-circle]="speaking()"></i> {{ speaking() ? 'Stop' : 'Read' }}
                </button>
              }
            </header>
            <div class="sd-acc" [class.open]="open()" id="sd-ins">
              <div class="sd-acc-in">
                @if (lines().length || set()?.p) {
                  @if (set()?.p; as intro) { <p class="sd-intro">{{ intro }}</p> }
                  <ul class="sd-list">
                    @for (ln of lines(); track $index) {
                      <li [style.--d.ms]="$index * 70"><i class="pi pi-check"></i>
                        <span>@for (g of segs(ln); track $index) { @if (g.url) { <a [href]="g.url" target="_blank" rel="noopener">{{ g.text }}</a> } @else { {{ g.text }} } }</span></li>
                    }
                  </ul>
                } @else {
                  <ol class="sd-steps">
                    @for (st of steps; track st.t; let i = $index) {
                      <li [style.--d.ms]="i * 80"><span class="sd-n">{{ i + 1 }}</span><div><b>{{ st.t }}</b><p>{{ st.d }}</p></div></li>
                    }
                  </ol>
                  <p class="sd-note"><i class="pi pi-info-circle"></i> Detailed instructions for this service are shown on the official portal when you start the application.</p>
                }
              </div>
            </div>
          </article>
        </div>

        <div class="container sd-pn" aria-label="Previous and next service">
          @if (prev(); as p) { <a [routerLink]="['/service', cat(), index() - 1]"><small><i class="pi pi-arrow-left"></i> Previous</small><span>{{ p.title }}</span></a> } @else { <span></span> }
          @if (next(); as n) { <a class="r" [routerLink]="['/service', cat(), index() + 1]"><small>Next <i class="pi pi-arrow-right"></i></small><span>{{ n.title }}</span></a> }
        </div>

        @if (related().length) {
          <div class="container sd-rel">
            <h3 class="sd-sub">More in {{ list().label }}</h3>
            <ul>
              @for (r of related(); track r.i) {
                <li appReveal="up" [style.--d.ms]="$index * 70"><a [routerLink]="['/service', cat(), r.i]"><img [src]="img(r.s.img)" alt="" loading="lazy"><span>{{ r.s.title }}</span><i class="pi pi-arrow-right"></i></a></li>
              }
            </ul>
            <a class="sd-all" [routerLink]="list().route"><i class="pi pi-th-large"></i> View all {{ list().label }}</a>
          </div>
        }
      </section>

      <p-dialog header="Payment Terms &amp; Condition" [visible]="payOpen()" (visibleChange)="payOpen.set($event)" [modal]="true" [dismissableMask]="true" [style]="{ width: 'min(760px, 94vw)' }">
        <div class="sd-pay">
          <h4>Common Services Portal: Online Transactions</h4>
          <h5>Payment Options</h5>
          <p><b>Online Card Payments:</b> Visa and MasterCard payments are processed through a secure online payment gateway system. Your bank authorizes the card transaction directly, without card information passing through the portal. In approximately 25–30 seconds (depending on your internet connection) your bank issues, using the online payment gateway, an authorization code and confirmation of completion of the transaction.</p>
          <p>The Department of Science &amp; Technology's domain www.digitalgujarat.gov.in uses SSL encryption and other methods to protect your payment. The portal does not retain your credit card information.</p>
          <p><b>Internet Banking:</b> If you have an account in any bank within India, you can pay your application fees through your bank's net banking options and the amount is automatically debited from your account. The portal processes the payments through an online gateway system which enables safe and secure transactions.</p>
          <h4>Terms &amp; Conditions</h4>
          <h5>Transaction Confirmation</h5>
          <p>The payment gateway generates a unique Transaction ID against each transaction, which is displayed to the citizen and can be used for any query related to the transaction. All transactions where the payment gateway does not receive a response from the bank during the transaction session are auto-refunded within 7 working days.</p>
          <p>Payments for which a response is not received from the bank are automatically updated in the next 10 minutes. After making any payment, please wait for 10 minutes before another transaction.</p>
          <h5>Refund and Cancellation</h5>
          <ul>
            <li>The application fee is non-refundable. Fees once paid are not refunded for applications which are successfully submitted. Cancellation of applications shall not be entertained.</li>
            <li>Any excess payment received due to technical or other reasons will be refunded within 7 working days.</li>
            <li>The mode of refund is electronic and the amount (excluding the processing fees) is returned after reconciliation of accounts to the same card or bank account through which the transaction was done.</li>
          </ul>
        </div>
      </p-dialog>
    } @else {
      <app-page-hero title="Service not found" />
      <section class="section" data-main tabindex="-1"><div class="container sd-missing">
        <p>We couldn't find that service. It may have been moved.</p>
        <a class="sd-act sd-act-main" routerLink="/services/citizen"><span class="sd-ai"><i class="pi pi-th-large"></i></span> Browse all services</a>
      </div></section>
    }
  `,
})
export class ServiceDetailPage {
  private params = toSignal(inject(ActivatedRoute).paramMap, { requireSync: true });
  cat = computed(() => this.params().get('cat') ?? '');
  index = computed(() => Number(this.params().get('idx')));
  private items = computed<Item[]>(() => CONFIG[this.cat()]?.items ?? []);
  svc = computed<Item | null>(() => this.items()[this.index()] ?? null);
  list = computed(() => LISTS[this.cat()] ?? LISTS['citizen']);
  trail = computed(() => [{ label: 'Services' }, { label: this.list().label, routerLink: this.list().route }]);
  prev = computed(() => this.items()[this.index() - 1] ?? null);
  next = computed(() => this.items()[this.index() + 1] ?? null);
  /** [instruction set id, form PDF url] scanned from the official service page, if available. */
  info = computed(() => { const s = this.svc(); return s ? DATA.svc[this.cat() + '|' + s.title] ?? null : null; });
  set = computed<InfoSet | null>(() => { const i = this.info(); return i ? DATA.sets[i[0]] ?? null : null; });
  lines = computed<Line[]>(() => this.set()?.l ?? []);
  heading = computed(() => this.set()?.h || 'Instructions');
  segs = segments;
  open = signal(true);
  payOpen = signal(false);

  /** Up to four neighbouring services in the same category. */
  related = computed(() => {
    const items = this.items(), i = this.index(), out: { s: Item; i: number }[] = [];
    for (let k = 1; out.length < 4 && k < items.length; k++) {
      const j = (i + k) % items.length;
      out.push({ s: items[j], i: j });
    }
    return out;
  });

  private favs = signal<Set<string>>(this.load());
  saved = computed(() => !!this.svc() && this.favs().has(this.svc()!.title));

  readonly steps = [
    { t: 'Register or log in', d: 'Create a citizen account on the Digital Gujarat portal, or log in with your mobile number or Citizen ID.' },
    { t: 'Fill in the application', d: 'Select this service and complete the online form with your details.' },
    { t: 'Upload documents and pay', d: 'Attach the required documents, then pay any applicable fee online.' },
    { t: 'Track your application', d: 'Follow the status from your account and download the outcome when it is ready.' },
  ];

  /** "Read" speaks the instructions with the browser's built-in speech synthesis. */
  readonly canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
  speaking = signal(false);

  constructor() { inject(DestroyRef).onDestroy(() => this.stopSpeech()); }

  read() {
    if (!this.canSpeak) return;
    if (this.speaking()) { this.stopSpeech(); return; }
    const text = [this.set()?.p, ...this.lines().map((l) => l.t)].filter(Boolean).join('. ') || this.steps.map((s) => s.t + '. ' + s.d).join(' ');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = /[઀-૿]/.test(text) ? 'gu-IN' : 'en-IN';
    u.onend = u.onerror = () => this.speaking.set(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    this.speaking.set(true);
  }
  private stopSpeech() { if (this.canSpeak) speechSynthesis.cancel(); this.speaking.set(false); }

  img(p: string) { return IMG + encodeURI(p); }

  toggleSave() {
    const t = this.svc()?.title;
    if (!t) return;
    const s = new Set(this.favs());
    s.has(t) ? s.delete(t) : s.add(t);
    this.favs.set(s);
    try { localStorage.setItem('dg-saved', JSON.stringify([...s])); } catch { /* storage unavailable */ }
  }
  private load(): Set<string> {
    try { return new Set<string>(JSON.parse(localStorage.getItem('dg-saved') ?? '[]')); } catch { return new Set(); }
  }
}
