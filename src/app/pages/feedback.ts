import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { SelectButton } from 'primeng/selectbutton';
import { Textarea } from 'primeng/textarea';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';

const Q = (q: string, options: string[]) => ({ q, options, value: null as string | null });
export const FEEDBACK_KEY = 'dg-feedback';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-feedback',
  imports: [FormsModule, RouterLink, ButtonDirective, InputText, SelectButton, Textarea, PageHero, Reveal],
  template: `
    <app-page-hero title="Feedback" subtitle="Tell us how we can make Digital Gujarat better." icon="pi pi-comments" />
    <section class="section" data-main tabindex="-1">
      <div class="container fbk">
        @if (sent()) {
          <div class="done-card" appReveal="zoom">
            <span class="done-ic"><i class="pi pi-check"></i></span>
            <h2>Thank you for your feedback</h2>
            <p>Your response has been recorded in this demo. It also appears on the feedback dashboard for this browser.</p>
            <div class="row-actions">
              <a pButton routerLink="/feedback-dashboard"><i class="pi pi-chart-bar"></i> View dashboard</a>
              <button pButton type="button" variant="outlined" (click)="again()">Send another response</button>
            </div>
          </div>
        } @else {
          <aside class="fbk-side">
            <p class="fbk-kicker">Your voice</p>
            <h2>Help us make Digital Gujarat better</h2>
            <p>Tell us how easy it was to find, apply for and track a service. It takes about two minutes and every response is read by the programme team.</p>
            <ol class="stepper" aria-label="Form progress">
              @for (s of steps; track s.t; let i = $index) {
                <li [class.on]="step() === i" [class.done]="step() > i" [attr.aria-current]="step() === i ? 'step' : null">
                  <span class="st-n">@if (step() > i) { <i class="pi pi-check"></i> } @else { {{ i + 1 }} }</span>
                  <span><b>{{ s.t }}</b><small>{{ s.d }}</small></span>
                </li>
              }
            </ol>
          </aside>
          <form class="feedback-form" appReveal="up" (ngSubmit)="submit(f.valid)" novalidate #f="ngForm">
            <div class="form-progress" aria-hidden="true"><i [style.width.%]="((step() + 1) / steps.length) * 100"></i></div>
            <p class="form-step-label">Step {{ step() + 1 }} of {{ steps.length }} · {{ steps[step()].t }}</p>

            <div class="step" [hidden]="step() !== 0">
              <div class="form-grid">
                <label>Name <input pInputText name="name" [(ngModel)]="form.name" #name="ngModel" required [attr.aria-invalid]="name.invalid && (name.touched || f.submitted)" aria-describedby="e-name">
                  <small id="e-name" class="field-error" role="alert">@if (name.invalid && (name.touched || f.submitted)) { Please enter your name. }</small></label>
                <label>Email <input pInputText type="email" name="email" [(ngModel)]="form.email" #email="ngModel" required email [attr.aria-invalid]="email.invalid && (email.touched || f.submitted)" aria-describedby="e-email">
                  <small id="e-email" class="field-error" role="alert">@if (email.invalid && (email.touched || f.submitted)) { Please enter a valid email address. }</small></label>
                <label>Mobile <input pInputText name="mobile" [(ngModel)]="form.mobile" #mobile="ngModel" pattern="[0-9]{10}" maxlength="10" inputmode="numeric" required [attr.aria-invalid]="mobile.invalid && (mobile.touched || f.submitted)" aria-describedby="e-mobile">
                  <small id="e-mobile" class="field-error" role="alert">@if (mobile.invalid && (mobile.touched || f.submitted)) { Enter a 10-digit mobile number. }</small></label>
                <label>Subject <input pInputText name="subject" [(ngModel)]="form.subject"><small class="field-error" aria-hidden="true"></small></label>
              </div>
            </div>

            <div class="step" [hidden]="step() !== 1">
              @for (q of questions; track q.q; let i = $index) {
                <fieldset>
                  <legend>{{ q.q }}</legend>
                  <p-selectbutton [options]="q.options" [(ngModel)]="q.value" [name]="'q' + i" [allowEmpty]="false" size="small" [ariaLabel]="q.q" />
                </fieldset>
              }
            </div>

            <div class="step" [hidden]="step() !== 2">
              <label>Message <textarea pTextarea name="message" rows="6" [(ngModel)]="form.message" placeholder="Anything else you would like us to know?"></textarea></label>
            </div>

            <div class="form-nav">
              <button pButton type="button" variant="outlined" (click)="back()" [style.visibility]="step() === 0 ? 'hidden' : 'visible'"><i class="pi pi-arrow-left"></i> Back</button>
              @if (step() < steps.length - 1) {
                <button pButton type="button" (click)="next(f)">Next <i class="pi pi-arrow-right"></i></button>
              } @else {
                <button pButton type="submit"><i class="pi pi-send"></i> Submit feedback</button>
              }
            </div>
          </form>
        }
      </div>
    </section>
  `,
})
export class FeedbackPage {
  sent = signal(false);
  step = signal(0);
  readonly steps = [
    { t: 'Your details', d: 'Name, email and mobile' },
    { t: 'Rate the service', d: 'Five quick questions' },
    { t: 'Your message', d: 'Anything else to add' },
  ];
  form = { name: '', email: '', mobile: '', subject: '', message: '' };
  questions = [
    Q('How easy was it to access the service online?', ['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy']),
    Q('How clear and understandable were the instructions for completing the process?', ['Very Unclear', 'Unclear', 'Neutral', 'Clear', 'Very Clear']),
    Q('How satisfied are you with the timeliness of the service?', ['Very Slow', 'Slow', 'Average', 'Fast', 'Very Fast']),
    Q('How satisfied are you with the user interface?', ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent']),
    Q('Overall, how satisfied are you with the overall online service experience?', ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']),
  ];

  /** Step 1 holds the required fields: validate them before moving on. */
  next(f: NgForm) {
    if (this.step() === 0) {
      let ok = true;
      for (const k of ['name', 'email', 'mobile']) { const c = f.controls[k]; c?.markAsTouched(); if (c?.invalid) ok = false; }
      if (!ok) return;
    }
    this.step.update((s) => Math.min(this.steps.length - 1, s + 1));
  }
  back() { this.step.update((s) => Math.max(0, s - 1)); }
  again() { this.step.set(0); this.sent.set(false); }

  submit(valid: boolean) {
    if (!valid) { this.step.set(0); return; }
    // keep the ratings (1–5) on this device so the feedback dashboard has something real to chart
    const ratings = this.questions.map((q) => (q.value ? q.options.indexOf(q.value) + 1 : 0));
    try {
      const all = JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? '[]');
      all.push({ at: Date.now(), ratings });
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all.slice(-200)));
    } catch { /* storage unavailable */ }
    this.sent.set(true);
  }
}
