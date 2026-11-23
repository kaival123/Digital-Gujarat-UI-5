import { Component, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { NetBackdrop } from './net-backdrop';

/** Shared banner for every inner page: navy hologram-grid surface, connected-network canvas, breadcrumb, title, optional chips. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-page-hero',
  imports: [Breadcrumb, NetBackdrop],
  template: `
    <section class="page-hero">
      <app-net-backdrop />
      <div class="container ph-in">
        <p-breadcrumb [model]="items()" [home]="home" />
        <div class="ph-row">
          @if (icon()) { <span class="ph-ico" aria-hidden="true"><i [class]="icon()"></i></span> }
          <div>
            <h1>{{ title() }}</h1>
            @if (subtitle()) { <p>{{ subtitle() }}</p> }
          </div>
        </div>
        @if (chips().length) {
          <ul class="ph-chips">@for (c of chips(); track c) { <li>{{ c }}</li> }</ul>
        }
      </div>
    </section>
  `,
})
export class PageHero {
  title = input.required<string>();
  subtitle = input('');
  icon = input('');
  chips = input<string[]>([]);
  /** Breadcrumb trail below Home, e.g. [{ label: 'Services' }, { label: 'Citizen' }]. */
  trail = input<MenuItem[]>([]);
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/' };
  items = computed<MenuItem[]>(() => [...this.trail(), { label: this.title() }]);
}
