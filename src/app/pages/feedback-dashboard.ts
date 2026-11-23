import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { Counter, Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';
import { SITE } from '../shared/site';
import { FEEDBACK_KEY } from './feedback';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-feedback-dashboard',
  imports: [RouterLink, ButtonDirective, Message, PageHero, Reveal, Counter],
  template: `
    <app-page-hero title="Citizen Feedback Dashboard" subtitle="Feedback analytics & service satisfaction overview" icon="pi pi-chart-bar" />
    <section class="section" data-main tabindex="-1">
      <div class="container">

        <div class="kpi-row" appReveal="up">
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-comments"></i></span><b><span [appCounter]="count">0</span></b><small>Responses on this device</small></div>
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-star"></i></span><b>{{ count ? overall.toFixed(1) : '—' }}<em> / 5</em></b><small>Overall satisfaction</small></div>
          <div class="kpi"><span class="kpi-ic"><i class="pi pi-thumbs-up"></i></span><b>{{ count ? positive + '%' : '—' }}</b><small>Rated 4 or 5</small></div>
        </div>

        <p-message class="mt" severity="info" icon="pi pi-info-circle">Live ratings come from the Digital Gujarat feedback database and are not bundled with this demo. The charts below summarise responses submitted from this browser.</p-message>

        <div class="chart-grid">
          <article class="panel" appReveal="up">
            <header><h2>Overall satisfaction</h2><p>Average of all rated questions</p></header>
            <div class="gauge" role="img" [attr.aria-label]="count ? 'Average rating ' + overall.toFixed(1) + ' out of 5' : 'No responses yet'">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle class="g-track" cx="60" cy="60" r="50" />
                <circle class="g-val" cx="60" cy="60" r="50" [style.stroke-dashoffset]="314 - 314 * (overall / 5)" />
              </svg>
              <span class="g-txt"><b>{{ count ? overall.toFixed(1) : '—' }}</b><small>out of 5</small></span>
            </div>
          </article>

          <article class="panel" appReveal="up">
            <header><h2>Question rating ranking</h2><p>Average score per question (1–5)</p></header>
            <ul class="bars">
              @for (q of ranked; track q.label; let i = $index) {
                <li [title]="q.label + ': ' + (q.avg ? q.avg.toFixed(2) : 'no data')">
                  <span class="b-rank">{{ i + 1 }}</span>
                  <span class="b-body"><span class="b-label">{{ q.label }}</span><span class="b-track"><i [style.width.%]="(q.avg / 5) * 100"></i></span></span>
                  <b>{{ q.avg ? q.avg.toFixed(1) : '—' }}</b>
                </li>
              }
            </ul>
            @if (!count) { <p class="empty-note"><i class="pi pi-inbox"></i> No responses yet — submit feedback to see the chart fill in.</p> }
          </article>
        </div>

        <div class="row-actions">
          <a pButton routerLink="/feedback"><i class="pi pi-comment"></i> Share your feedback</a>
          <a pButton variant="outlined" [href]="site + 'LinkPages/FeedbackDashboard.aspx'" target="_blank" rel="noopener">Open live dashboard <i class="pi pi-external-link"></i></a>
        </div>
      </div>
    </section>
  `,
})
export class FeedbackDashboardPage {
  site = SITE;
  questions = ['Service Access', 'Instructions', 'Timeliness', 'User Interface', 'Overall Experience'];
  private rows: { ratings: number[] }[] = (() => { try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? '[]'); } catch { return []; } })();
  count = this.rows.length;
  private avgs = this.questions.map((_, i) => {
    const v = this.rows.map((r) => r.ratings?.[i] ?? 0).filter((n) => n > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  });
  ranked = this.questions.map((label, i) => ({ label, avg: this.avgs[i] })).sort((a, b) => b.avg - a.avg);
  overall = (() => { const v = this.avgs.filter((n) => n > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; })();
  positive = (() => {
    const all = this.rows.flatMap((r) => r.ratings ?? []).filter((n) => n > 0);
    return all.length ? Math.round((all.filter((n) => n >= 4).length / all.length) * 100) : 0;
  })();
}
