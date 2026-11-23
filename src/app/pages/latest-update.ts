import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { abs } from '../shared/site';
import circulars from '../data/circulars.json';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-latest-update',
  imports: [ButtonDirective, Tabs, TabList, Tab, TabPanels, TabPanel, TableModule, Tag, PageHero, Reveal],
  template: `
    <app-page-hero title="Latest Update" subtitle="News, circulars and notifications from Digital Gujarat." icon="pi pi-megaphone" [chips]="[news.length + ' announcements', rows.length + ' circulars']" />
    <section class="section" data-main tabindex="-1">
      <div class="container lu">
        <aside class="lu-rail">
          <p class="lu-title">Related portals</p>
          <a pButton [outlined]="true" href="https://mariyojana.gujarat.gov.in/" target="_blank" rel="noopener">Government Scheme / Service <i class="pi pi-external-link"></i></a>
          <a pButton [outlined]="true" href="https://gil.gujarat.gov.in/Tenders" target="_blank" rel="noopener">Government Tenders <i class="pi pi-external-link"></i></a>
        </aside>
        <div class="lu-main">
        <p-tabs value="news" appReveal="up">
          <p-tablist>
            <p-tab value="news"><i class="pi pi-megaphone"></i>&nbsp; News &amp; Updates</p-tab>
            <p-tab value="circular"><i class="pi pi-file"></i>&nbsp; Circular / Notification</p-tab>
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="news">
              <ul class="news timeline">
                @for (n of news; track $index) {
                  <li>
                    @if (n.date) { <p-tag [value]="n.date" severity="warn" [rounded]="true" /> }
                    <div>
                      <p>{{ n.text }}</p>
                      @for (l of n.links; track l.url) {
                        <a class="more" [href]="l.url" target="_blank" rel="noopener">{{ l.label }} <i class="pi pi-external-link"></i></a>
                      }
                    </div>
                  </li>
                }
              </ul>
            </p-tabpanel>
            <p-tabpanel value="circular">
              <p-table [value]="rows" [stripedRows]="true" [paginator]="true" [rows]="10" [scrollable]="true">
                <ng-template #header>
                  <tr><th style="width:4rem">No</th><th style="width:8rem">GR Date</th><th>GR Number</th><th>Title</th><th style="width:7rem">Document</th></tr>
                </ng-template>
                <ng-template #body let-r>
                  <tr>
                    <td>{{ r.no }}</td><td>{{ r.date }}</td><td>{{ r.grNo }}</td><td>{{ r.title }}</td>
                    <td><a pButton size="small" [outlined]="true" [href]="r.link" target="_blank" rel="noopener"><i class="pi pi-download"></i></a></td>
                  </tr>
                </ng-template>
              </p-table>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
        </div>
      </div>
    </section>
  `,
})
export class LatestUpdatePage {
  rows = circulars.filter((c) => !!c.url).map((c) => ({ ...c, link: abs(c.url) }));
  news = [
    { date: '17/08/2026', text: 'If you are unable to access scholarship services via Digital Gujarat, you can avail of them at the Gujarat Scholarship portal.', links: [{ label: 'gssp.gujarat.gov.in', url: 'https://gssp.gujarat.gov.in' }] },
    { date: '17/08/2026', text: 'For Academic Year 2026-27, filling Post Matric Scholarship forms on the Digital Gujarat portal for SC students remains re-open from 01/10/2026 to 31/10/2026 for remaining students.', links: [] },
    { date: '17/08/2026', text: 'Applications are invited online for the Post-Matric Scholarship and allied educational schemes for the academic year 2026-27 for Scheduled Tribe students from 01/09/2026 to 30/11/2026.', links: [] },
    { date: '17/08/2026', text: 'Applications are invited again for the Post-Matric Scholarship and allied educational schemes for the academic year 2025-26 for remaining Scheduled Tribe students from 01/10/2026 to 20/10/2026.', links: [] },
    {
      date: '18/07/2025', text: 'Post Matric Scholarships guidelines for Scheduled Caste, SEBC and ST students (2026-27).',
      links: [
        { label: 'For SC students', url: abs('/LoginApp/DownLoad/Guideline for SC Students (DGP) 2026-27.pdf') },
        { label: 'For SEBC students', url: abs('/LoginApp/DownLoad/DCW_Guidiline_26-27.pdf') },
        { label: 'For ST students', url: abs('/LoginApp/DownLoad/2026-27 Guidelines Post-Matric.pdf') },
      ],
    },
    { date: '', text: "Use NIC's SANDES messaging mobile app to get Alert/OTP SMSes related to your Digital Gujarat login instantly.", links: [{ label: 'Android Play Store', url: 'https://play.google.com/store/apps/details?id=in.nic.gimkerala&hl=en_IN&gl=US' }] },
  ];
}
