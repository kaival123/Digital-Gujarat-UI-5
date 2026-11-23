import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Reveal, Tilt } from '../shared/motion';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Tag } from 'primeng/tag';
import { PageHero } from '../shared/page-hero';
import { IMG, SITE } from '../shared/site';
import citizen from '../data/citizen.json';
import sugam from '../data/sugam.json';
import dss from '../data/dss.json';
import janseva from '../data/janseva.json';

export interface Item { title: string; img: string; }

function loadFavs(): Set<string> {
  try { return new Set<string>(JSON.parse(localStorage.getItem('dg-saved') ?? '[]')); } catch { return new Set(); }
}

export const CONFIG: Record<string, { title: string; subtitle: string; page: string; items: Item[] }> = {
  citizen: { title: 'Citizen Services', subtitle: 'Certificates and passes available to every citizen of Gujarat.', page: 'Services/CitizenServices.aspx', items: citizen },
  sugam: { title: 'Sugam Digital Gujarat', subtitle: 'Online services — apply from home.', page: 'Services/SugamDGAbhiyanServices.aspx', items: sugam },
  dss: { title: 'Digital SevaSetu Services', subtitle: 'Department schemes and subsidies delivered through Digital SevaSetu.', page: 'Services/DSSServices.aspx', items: dss },
  janseva: { title: 'Janseva Services', subtitle: 'Services available through Janseva Kendras.', page: 'Services/JansevaServices.aspx', items: janseva },
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-service-list',
  imports: [FormsModule, RouterLink, RouterLinkActive, ButtonDirective, IconField, InputIcon, InputText, Paginator, Tag, ToggleSwitch, PageHero, Reveal, Tilt],
  template: `
    <app-page-hero [title]="cfg().title" [subtitle]="cfg().subtitle" [trail]="trail" [icon]="icon()" [chips]="[cfg().items.length + ' services', 'Apply online', 'Track status']" />
    <section class="section" data-main tabindex="-1">
      <div class="container">
        <div class="kpi-row" appReveal="up">
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-th-large"></i></span><b>{{ cfg().items.length }}</b><small>Services in this category</small></div>
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-filter"></i></span><b>{{ filtered().length }}</b><small>Matching your filters</small></div>
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-heart"></i></span><b>{{ favs().size }}</b><small>Saved by you</small></div>
        </div>
        <div class="list-toolbar">
          <p-iconfield class="grow">
            <p-inputicon class="pi pi-search" />
            <input pInputText type="search" enterkeyhint="search" autocomplete="off" [ngModel]="query()" (ngModelChange)="setQuery($event)" placeholder="Search in {{ cfg().title }}…" aria-label="Search services" />
          </p-iconfield>
          <p-tag [value]="filtered().length + ' services'" severity="contrast" [rounded]="true" />
          <label class="saved-toggle" [class.on]="savedOnly()">
            <p-toggleswitch [ngModel]="savedOnly()" (ngModelChange)="setSaved($event)" ariaLabel="Show saved only" />
            <span><i class="pi pi-heart-fill"></i> Saved ({{ favs().size }})</span>
          </label>
          @if (key() === 'sugam') {
            <a pButton [outlined]="true" routerLink="/user-manual"><i class="pi pi-book"></i> User Manual</a>
          }
          @if (key() === 'janseva') {
            <a pButton [outlined]="true" [href]="site + 'Download/JanSevaKendraList.pdf'" target="_blank" rel="noopener"><i class="pi pi-download"></i> Janseva Kendra list</a>
            <p-tag value="Office time: 10 AM – 6 PM" icon="pi pi-clock" severity="warn" [rounded]="true" />
          }
        </div>
      </div>
      <div class="container sl">
        <aside class="sl-rail">
        <nav class="sl-cats" aria-label="Service categories">
          <p class="sl-cats-title">Browse categories</p>
          @for (c of cats; track c.route) {
            <a [routerLink]="c.route" routerLinkActive="on" #rla="routerLinkActive" [attr.aria-current]="rla.isActive ? 'page' : null"><i [class]="c.icon"></i> {{ c.label }} <i class="pi pi-arrow-right go"></i></a>
          }
        </nav>
        </aside>

        <div class="sl-main">
        @if (pageItems().length) {
          <div class="svc-grid">
            @for (s of pageItems(); track s.title + $index) {
              <article class="svc-card" appTilt [appReveal]="'up'" [revealDelay]="($index % 4) * 70">
                <span class="num">{{ first() + $index + 1 }}</span>
                <button type="button" class="fav" [class.on]="isFav(s.title)" (click)="toggleFav(s.title)" [attr.aria-pressed]="isFav(s.title)" [attr.aria-label]="(isFav(s.title) ? 'Remove from saved: ' : 'Save: ') + s.title">
                  <i class="pi" [class.pi-heart-fill]="isFav(s.title)" [class.pi-heart]="!isFav(s.title)"></i>
                </button>
                <img [src]="img(s.img)" alt="" loading="lazy">
                <h3>{{ s.title }}</h3>
                <a class="more" [routerLink]="['/service', key(), idx(s)]">Read more <i class="pi pi-arrow-right"></i></a>
              </article>
            }
          </div>
          <p-paginator [first]="first()" [rows]="rows" [totalRecords]="filtered().length" (onPageChange)="onPage($event)" [showCurrentPageReport]="true" currentPageReportTemplate="{first} – {last} of {totalRecords}" />
        } @else {
          <p class="empty"><i class="pi pi-search"></i> {{ savedOnly() ? 'No saved services here yet — tap the heart on a card to save it.' : 'No services match “' + query() + '”.' }}</p>
        }
        </div>
      </div>
    </section>
  `,
})
export class ServiceListPage {
  readonly site = SITE;
  readonly cats = [
    { label: 'Citizen Services', icon: 'pi pi-users', route: '/services/citizen' },
    { label: 'Sugam Digital Gujarat', icon: 'pi pi-bolt', route: '/sugam-digital-gujarat' },
    { label: 'Digital SevaSetu', icon: 'pi pi-briefcase', route: '/services/digital-sevasetu' },
    { label: 'Janseva Services', icon: 'pi pi-building', route: '/services/janseva' },
    { label: 'Linked Services', icon: 'pi pi-link', route: '/services/linked' },
  ];
  readonly rows = 12;
  private data = toSignal(inject(ActivatedRoute).data, { requireSync: true });
  key = computed<string>(() => this.data()['key']);
  cfg = computed(() => CONFIG[this.key()]);
  icon = computed(() => ({ citizen: 'pi pi-users', sugam: 'pi pi-bolt', dss: 'pi pi-briefcase', janseva: 'pi pi-building' } as Record<string, string>)[this.key()] ?? 'pi pi-th-large');
  trail = [{ label: 'Services' }];
  query = signal('');
  first = signal(0);
  savedOnly = signal(false);
  favs = signal<Set<string>>(loadFavs());
  private qp = toSignal(inject(ActivatedRoute).queryParamMap);

  constructor() {
    effect(() => {
      const q = this.qp()?.get('q');
      if (q) { this.query.set(q); this.first.set(0); }
    });
  }

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const favs = this.favs();
    let items = this.cfg().items;
    if (this.savedOnly()) items = items.filter((i) => favs.has(i.title));
    return tokens.length ? items.filter((i) => tokens.every((t) => i.title.toLowerCase().includes(t))) : items;
  });

  isFav(t: string) { return this.favs().has(t); }
  toggleFav(t: string) {
    const s = new Set(this.favs());
    s.has(t) ? s.delete(t) : s.add(t);
    this.favs.set(s);
    try { localStorage.setItem('dg-saved', JSON.stringify([...s])); } catch { /* storage unavailable */ }
  }
  setSaved(v: boolean) { this.savedOnly.set(v); this.first.set(0); }
  pageItems = computed(() => this.filtered().slice(this.first(), this.first() + this.rows));

  setQuery(v: string) { this.query.set(v); this.first.set(0); }
  onPage(e: PaginatorState) { this.first.set(e.first ?? 0); document.querySelector('[data-main]')?.scrollIntoView({ behavior: 'smooth' }); }
  img(p: string) { return IMG + encodeURI(p); }
  idx(s: Item) { return this.cfg().items.indexOf(s); }
}
