import { whenAppReady } from './app-ready';
import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Word-by-word text reveal: each word fades in place (opacity only — no sliding letters).
 * Usage: <h1 [appWords]="'Connecting Gujarat.'" [wordDelay]="400"></h1>
 * The full text stays in the DOM (aria-label on the host), so screen readers read it once and normally.
 * With reduced motion the text is shown immediately.
 */
@Directive({ selector: '[appWords]' })
export class Words implements OnInit, OnDestroy {
  appWords = input.required<string>();
  wordDelay = input(0);       // ms before the first word
  wordGap = input(90);        // ms between words
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private cancel = () => {};

  ngOnInit() {
    const text = this.appWords();
    const root = document.documentElement.classList;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || root.contains('a11y-nomotion') || root.contains('lite');
    this.el.setAttribute('aria-label', text);
    this.el.textContent = '';
    const words = text.split(/\s+/).filter(Boolean);
    const spans: HTMLElement[] = [];
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = w;
      this.el.append(s);
      if (i < words.length - 1) this.el.append(' ');
      spans.push(s);
    });
    if (still) { spans.forEach((s) => s.classList.add('on')); return; }
    this.cancel = whenAppReady(() => spans.forEach((s, i) => this.timers.push(setTimeout(() => s.classList.add('on'), this.wordDelay() + i * this.wordGap()))));
  }
  ngOnDestroy() { this.cancel(); this.timers.forEach(clearTimeout); }
}
