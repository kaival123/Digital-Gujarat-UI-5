import { Component, ElementRef, computed, effect, inject, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { SearchHit, SearchService } from './search.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-command-palette',
  imports: [FormsModule, Dialog],
  template: `
    <p-dialog [visible]="s.open()" (visibleChange)="s.open.set($event)" [modal]="true" [dismissableMask]="true" [showHeader]="false"
      position="top" [style]="{ width: 'min(680px, 94vw)', marginTop: '10vh' }" styleClass="palette" (onShow)="focus()">
      <div class="pal-input">
        <i class="pi pi-search"></i>
        <input #box type="search" enterkeyhint="search" [ngModel]="s.query()" (ngModelChange)="onType($event)" (keydown)="onKey($event)"
          placeholder="Search 650+ services, certificates, pages…" aria-label="Search" autocomplete="off" role="combobox" [attr.aria-expanded]="hits().length > 0">
        <kbd class="pal-esc">Esc</kbd>
        <button type="button" class="pal-close" aria-label="Close search" (click)="s.open.set(false)"><i class="pi pi-times"></i></button>
      </div>
      <div class="pal-body">
        @if (!s.query().trim()) {
          <p class="pal-label"><i class="pi pi-bolt"></i> Trending searches</p>
          <div class="pal-chips">
            @for (t of s.trending; track t) { <button type="button" (click)="onType(t)">{{ t }}</button> }
          </div>
        } @else if (hits().length) {
          <ul role="listbox">
            @for (h of hits(); track $index) {
              <li role="option" [class.active]="$index === active()" [attr.aria-selected]="$index === active()" (mouseenter)="active.set($index)" (click)="go(h)">
                <span class="ic"><i [class]="h.icon"></i></span>
                <span class="tx"><b>{{ h.title }}</b><small>{{ h.kind }}</small></span>
                <i class="pi" [class.pi-external-link]="h.url" [class.pi-arrow-right]="!h.url"></i>
              </li>
            }
          </ul>
        } @else {
          <p class="pal-empty"><i class="pi pi-search"></i> No results for “{{ s.query() }}”. Try a shorter word like <em>income</em> or <em>ration</em>.</p>
        }
      </div>
      <div class="pal-foot" aria-hidden="true">
        <span class="hint"><kbd class="key"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5"/></svg></kbd><kbd class="key"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v10M3.5 8.5L8 13l4.5-4.5"/></svg></kbd><em>Navigate</em></span>
        <span class="hint"><kbd class="key wide"><svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 3v5.5a1.5 1.5 0 0 1-1.5 1.5H3M6 7l-3 3 3 3"/></svg></kbd><em>Open</em></span>
        <span class="hint"><kbd class="key wide">Esc</kbd><em>Close</em></span>
        <span class="hint push"><kbd class="key wide">Ctrl</kbd><kbd class="key">K</kbd><em>Toggle</em></span>
      </div>
    </p-dialog>
  `,
})
export class CommandPalette {
  s = inject(SearchService);
  private router = inject(Router);
  private box = viewChild<ElementRef<HTMLInputElement>>('box');
  active = signal(0);
  hits = computed<SearchHit[]>(() => this.s.find(this.s.query()));

  constructor() {
    effect(() => { this.s.query(); this.active.set(0); });
  }

  focus() { setTimeout(() => this.box()?.nativeElement.focus(), 30); }
  onType(v: string) { this.s.query.set(v); }

  onKey(e: KeyboardEvent) {
    const n = this.hits().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.active.set((this.active() + 1) % Math.max(n, 1)); this.scroll(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active.set((this.active() - 1 + n) % Math.max(n, 1)); this.scroll(); }
    else if (e.key === 'Enter') { const h = this.hits()[this.active()]; if (h) this.go(h); }
  }

  private scroll() { setTimeout(() => document.querySelector('.palette li.active')?.scrollIntoView({ block: 'nearest' })); }

  go(h: SearchHit) {
    this.s.open.set(false);
    if (h.url) { window.open(h.url, '_blank', 'noopener'); return; }
    this.router.navigate([h.route], h.query ? { queryParams: { q: h.query } } : {});
  }
}
