import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import linked from '../data/linked.json';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-linked-services',
  imports: [FormsModule, ButtonDirective, IconField, InputIcon, InputText, Select, TableModule, PageHero, Reveal],
  template: `
    <app-page-hero title="Linked Services" subtitle="Online services of other departments and municipal corporations." [trail]="[{ label: 'Services' }]" icon="pi pi-link" />
    <section class="section" data-main tabindex="-1">
      <div class="container">
        <div class="kpi-row" appReveal="up">
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-link"></i></span><b>{{ total }}</b><small>Linked services</small></div>
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-building"></i></span><b>{{ departments.length }}</b><small>Departments</small></div>
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-filter"></i></span><b>{{ rows().length }}</b><small>Matching your filters</small></div>
        </div>
        <div class="list-toolbar">
          <p-select [options]="departments" [ngModel]="dept()" (ngModelChange)="dept.set($event)" [showClear]="true" placeholder="All departments" [filter]="true" styleClass="dept-select" ariaLabel="Department" />
          <p-iconfield class="grow">
            <p-inputicon class="pi pi-search" />
            <input pInputText type="search" enterkeyhint="search" autocomplete="off" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search services…" aria-label="Search linked services" />
          </p-iconfield>
        </div>
        <p-table appReveal="up" [value]="rows()" [paginator]="true" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]" [stripedRows]="true" [scrollable]="true">
          <ng-template #header>
            <tr><th style="width:4rem">No</th><th>Service Name</th><th>Description</th><th>Department</th><th style="width:10rem">Service URL</th></tr>
          </ng-template>
          <ng-template #body let-r let-i="rowIndex">
            <tr>
              <td>{{ i + 1 }}</td>
              <td class="strong">{{ r.name }}</td>
              <td>{{ r.desc }}</td>
              <td>{{ r.dept }}</td>
              <td><a pButton size="small" [href]="r.url" target="_blank" rel="noopener">Click here</a></td>
            </tr>
          </ng-template>
          <ng-template #emptymessage><tr><td colspan="5" class="empty">No services found.</td></tr></ng-template>
        </p-table>
      </div>
    </section>
  `,
})
export class LinkedServicesPage {
  departments: string[] = linked.departments;
  total = linked.rows.filter((r) => !!r.url).length;
  dept = signal<string | null>(null);
  query = signal('');
  private qp = toSignal(inject(ActivatedRoute).queryParamMap);
  constructor() { effect(() => { const q = this.qp()?.get('q'); if (q) this.query.set(q); }); }
  rows = computed(() => {
    const d = this.dept();
    const q = this.query().trim().toLowerCase();
    return linked.rows.filter((r) => !!r.url && (!d || r.dept === d) && (!q || (r.name + ' ' + r.desc).toLowerCase().includes(q)));
  });
}
