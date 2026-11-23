import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { Reveal } from '../shared/motion';
import { PageHero } from '../shared/page-hero';

const PORTAL = 'https://www.digitalgujarat.gov.in/loginapp/';
const COMMON = ['abc@123', 'xyz@789', 'password@1', 'admin@123', 'welcome@1', 'qwerty@1', 'india@123', 'gujarat@123'];

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-citizen-login',
  imports: [PageHero, Reveal],
  template: `
    <app-page-hero icon="pi pi-lock" title="Citizen Login" subtitle="Sign in to apply online, pay, store documents and track your applications." [trail]="[{ label: 'Login / Register' }]" />
    <section class="section cl" data-main tabindex="-1">
      <span class="cl-blob cl-blob-a" aria-hidden="true"></span>
      <span class="cl-blob cl-blob-b" aria-hidden="true"></span>
      <div class="container cl-grid">

        <!-- New user -->
        <article class="cl-card cl-new" appReveal="up">
          <header class="cl-head"><span class="cl-ico"><i class="pi pi-user-plus"></i></span>
            <div><h2>New User</h2><p>Register with Government of Gujarat Online Portal and get access to 100+ services.</p></div></header>
          <a class="cl-btn cl-btn-gold" [href]="portal + 'CitizenRegistration.aspx'" target="_blank" rel="noopener">New Registration (Citizen) <i class="pi pi-arrow-right"></i></a>
          <ul class="cl-perks">
            <li><i class="pi pi-file-edit"></i> Apply online</li>
            <li><i class="pi pi-folder-open"></i> Store documents in Digital Locker</li>
            <li><i class="pi pi-wallet"></i> Pay Online</li>
            <li><i class="pi pi-map-marker"></i> Track application status</li>
          </ul>
          <div class="cl-help">
            <i class="pi pi-phone"></i>
            <p>Contact our Common Service Portal Help-Line <a href="tel:18002335500">1800 233 5500</a> for further information.</p>
          </div>
          <div class="cl-manuals">
            <a [href]="portal + 'Download/User_Manual_on_CSP_v1.1.pdf'" target="_blank" rel="noopener"><i class="pi pi-download"></i> Download User Manual in English</a>
            <a [href]="portal + 'Download/GUser_Manual_on_CSP_v1.1.pdf'" target="_blank" rel="noopener"><i class="pi pi-download"></i> Download User Manual in Gujarati</a>
          </div>
        </article>

        <!-- Registered user -->
        <article class="cl-card cl-main" appReveal="up">
          <header class="cl-head"><span class="cl-ico"><i class="pi pi-lock"></i></span>
            <div><h2>Registered User</h2><p>Registered users can log in to access their account and 100+ services.</p></div></header>

          <p class="cl-note cl-note-ok" lang="gu"><i class="pi pi-info-circle"></i> ડિજિટલ ગુજરાત પોર્ટલ પર તમામ વિદ્યાર્થી/સીટીઝન પોતાના મોબાઇલ નંબર થી અગાઉની જેમ લોગીન કરી શકશે જેની નોંધ લેવા વિનંતી છે.</p>
          <p class="cl-note cl-note-warn"><i class="pi pi-exclamation-triangle"></i> Kindly update your password (using "Forgot Password?") as per new policy. It is necessary to change the password every 90 days.</p>

          <a class="cl-btn cl-btn-ghost cl-know" [href]="portal + 'KnowYourID.aspx'" target="_blank" rel="noopener"><i class="pi pi-search"></i> Know Your Citizen ID</a>

          <form class="cl-form" [class.shake]="shake()" (submit)="submit($event)" novalidate>
            <label class="cl-field">
              <span class="cl-label">Login with</span>
              <span class="cl-input"><i class="pi pi-id-card"></i>
                <select [value]="type()" (change)="setType($any($event.target).value)" aria-label="Login with">
                  <option value="0">Select</option><option value="3">Mobile No</option><option value="4">Citizen ID</option>
                </select><i class="pi pi-angle-down cl-caret"></i></span>
            </label>

            <label class="cl-field">
              <span class="cl-label">{{ type() === '3' ? 'Mobile number' : type() === '4' ? 'Citizen ID' : 'User name' }}</span>
              <span class="cl-input" [class.bad]="touched() && !user()"><i class="pi pi-user"></i>
                <input [value]="user()" (input)="user.set($any($event.target).value)" [disabled]="type() === '0'" [attr.maxlength]="type() === '3' ? 10 : 20" [attr.inputmode]="type() === '3' ? 'numeric' : 'text'" autocomplete="off" [placeholder]="type() === '0' ? 'Select a login type first' : 'User Name'" /></span>
            </label>

            <label class="cl-field">
              <span class="cl-label">Password</span>
              <span class="cl-input" [class.bad]="touched() && !pwdOk()"><i class="pi pi-key"></i>
                <input [type]="show() ? 'text' : 'password'" [value]="pwd()" (input)="pwd.set($any($event.target).value)" autocomplete="off" placeholder="Your Password" aria-describedby="cl-policy" />
                <button type="button" class="cl-eye" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Hide password' : 'Show password'" [attr.aria-pressed]="show()"><i class="pi" [class.pi-eye]="!show()" [class.pi-eye-slash]="show()"></i></button></span>
              <span class="cl-meter" aria-hidden="true"><i [style.width.%]="strength() * 20" [attr.data-s]="strength()"></i></span>
            </label>

            <div class="cl-captcha">
              <label class="cl-field">
                <span class="cl-label">Captcha</span>
                <span class="cl-input" [class.bad]="touched() && !captchaOk()"><i class="pi pi-shield"></i>
                  <input [value]="typed()" (input)="typed.set($any($event.target).value)" autocomplete="off" placeholder="Enter Captcha*" /></span>
              </label>
              <div class="cl-cap-img" role="img" [attr.aria-label]="'Captcha code ' + captcha().split('').join(' ')">
                <span>@for (c of captcha().split(''); track $index) { <b [style.--r.deg]="(($index * 37) % 21) - 10">{{ c }}</b> }</span>
              </div>
              <button type="button" class="cl-refresh" (click)="refresh()" [class.spin]="spin()" aria-label="Refresh captcha"><i class="pi pi-refresh"></i></button>
            </div>

            <div class="cl-policy" id="cl-policy">
              <b>Password Policy</b>
              <ol>
                @for (r of rules(); track r.t) { <li [class.ok]="r.ok"><i class="pi" [class.pi-check-circle]="r.ok" [class.pi-circle]="!r.ok"></i> {{ r.t }}</li> }
              </ol>
              <p class="cl-tip"><i class="pi pi-arrow-right"></i> The login button will be enabled if the password meets the policy requirements.<br><span lang="gu">પાસવર્ડ પોલીસી પ્રમાણે હશે તો જ લોગિન બટન સક્રિય થશે.</span></p>
            </div>

            @if (msg()) { <p class="cl-msg" role="alert"><i class="pi pi-info-circle"></i> {{ msg() }}</p> }

            <button class="cl-btn cl-btn-main" type="submit" [disabled]="!pwdOk()"><i class="pi pi-sign-in"></i> Login</button>
            <p class="cl-forgot">Forgot Password? <a [href]="portal + 'CitizenForgotPassword.aspx'" target="_blank" rel="noopener">Click here</a></p>
          </form>
        </article>

        <!-- Latest update -->
        <aside class="cl-card cl-news" appReveal="up" aria-labelledby="cl-news-h">
          <header class="cl-head"><span class="cl-ico"><i class="pi pi-bell"></i></span><div><h2 id="cl-news-h">Latest Update</h2></div></header>
          <div class="cl-ticker" tabindex="0" aria-label="Latest updates, scrolls automatically; hover or focus to pause">
            <ul class="cl-track">
              @for (n of loop; track $index) {
                <li [class.hot]="n.hot" [attr.aria-hidden]="$index >= news.length ? 'true' : null">
                  <i class="pi pi-angle-double-right"></i>
                  <p>{{ n.text }}
                    @for (l of n.links ?? []; track l.label) { <a [href]="l.url" target="_blank" rel="noopener">{{ l.label }}</a> }</p>
                </li>
              }
            </ul>
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class CitizenLoginPage {
  readonly portal = PORTAL;
  type = signal('0');
  user = signal('');
  pwd = signal('');
  typed = signal('');
  show = signal(false);
  touched = signal(false);
  shake = signal(false);
  spin = signal(false);
  msg = signal('');
  captcha = signal(this.makeCaptcha());

  rules = computed(() => {
    const p = this.pwd(), u = this.user();
    return [
      { t: 'Password should not contain email id/mobile no.', ok: p.length > 0 && !(u.length >= 4 && p.toLowerCase().includes(u.toLowerCase())) && !/\d{10}/.test(p) },
      { t: 'Password must be between 8-20 characters.', ok: p.length >= 8 && p.length <= 20 },
      { t: 'Use at least one numeric, one upper case, one lower case and one special character from @ # ? $.', ok: /\d/.test(p) && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[@#?$]/.test(p) },
      { t: 'Common password will not be allowed (e.g. abc@123 or xyz@789).', ok: p.length > 0 && !COMMON.includes(p.toLowerCase()) },
      { t: 'Password must be different from the last three passwords used.', ok: p.length > 0 },
    ];
  });
  pwdOk = computed(() => this.rules().every((r) => r.ok));
  strength = computed(() => this.rules().filter((r) => r.ok).length);
  captchaOk = computed(() => this.typed().trim().toLowerCase() === this.captcha().toLowerCase());

  news = [
    { text: 'If you are unable to access scholarship services via Digital Gujarat, you can avail of them at', links: [{ label: 'gssp.gujarat.gov.in', url: 'https://gssp.gujarat.gov.in' }] },
    { text: 'Due to remaining students: For Academic Year 2026-27 Filling Post Metric Scholarship Forms on Digital Gujarat Portal for SC Students remain re-open from 01/10/2026 to 31/10/2026.', hot: true },
    { text: 'Applications are invited online for the Post-Matric Scholarship and allied educational schemes for the academic year 2026-27 for Scheduled Tribe students from date 01/09/2026 to 30/11/2026.', hot: true },
    { text: 'Applications are invited again for the Post-Matric Scholarship and allied educational schemes for the academic year 2025-26 for remaining Scheduled Tribe students from date 01/10/2026 to 20/10/2026.', hot: true },
    { text: 'Post Metric Scholarships Guideline for Scheduled Caste and SEBC Students Only (2026-27).', links: [
      { label: 'SC Students', url: PORTAL + 'DownLoad/Guideline for SC Students (DGP) 2026-27.pdf' },
      { label: 'SEBC Students', url: PORTAL + 'DownLoad/DCW_Guidiline_26-27.pdf' },
      { label: 'ST Students', url: PORTAL + 'DownLoad/2026-27 Guidelines Post-Matric.pdf' }] },
    { text: "Use NIC's SANDES messaging mobile app for getting Alert/OTP SMSes related to your login from Digital Gujarat instantly. Get it on", links: [
      { label: 'Android Play Store', url: 'https://play.google.com/store/apps/details?id=in.nic.gimkerala&hl=en_IN&gl=US' },
      { label: 'iOS App Store', url: 'https://apps.apple.com/in/app/sandes/id1517976582' }] },
  ] as { text: string; hot?: boolean; links?: { label: string; url: string }[] }[];
  /** Duplicated so the CSS ticker can loop seamlessly. */
  loop = [...this.news, ...this.news];

  setType(v: string) { this.type.set(v); this.user.set(''); this.msg.set(''); }

  refresh() {
    this.captcha.set(this.makeCaptcha()); this.typed.set('');
    this.spin.set(true); setTimeout(() => this.spin.set(false), 600);
  }

  submit(e: Event) {
    e.preventDefault();
    this.touched.set(true);
    const t = this.type(), u = this.user().trim();
    let err = '';
    if (t === '0') err = 'Please select how you want to log in.';
    else if (!u) err = 'Please enter user id!';
    else if (t === '3' && !/^[6-9]\d{9}$/.test(u)) err = 'Enter a valid 10-digit mobile number.';
    else if (!this.pwdOk()) err = 'Password does not meet the policy requirements.';
    else if (!this.captchaOk()) err = 'Enter captcha characters.';
    this.msg.set(err || 'This is a design demo, so no sign-in is sent. Use the official portal to log in.');
    if (err) { this.shake.set(true); setTimeout(() => this.shake.set(false), 500); this.refreshIfCaptcha(err); }
  }
  private refreshIfCaptcha(err: string) { if (err.includes('captcha')) this.refresh(); }

  private makeCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
