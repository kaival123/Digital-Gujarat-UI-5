import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-not-found',
  imports: [RouterLink, ButtonDirective],
  template: `
    <section class="section" data-main tabindex="-1">
      <div class="container not-found">
        <span class="code">404</span>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or has moved.</p>
        <a pButton routerLink="/"><i class="pi pi-home"></i> Back to home</a>
      </div>
    </section>
  `,
})
export class NotFoundPage {}
