import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const DigitalGujarat = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'color-mix(in srgb, var(--brand) 8%, #fff)',
      100: 'color-mix(in srgb, var(--brand) 16%, #fff)',
      200: 'color-mix(in srgb, var(--brand) 30%, #fff)',
      300: 'color-mix(in srgb, var(--brand) 50%, #fff)',
      400: 'color-mix(in srgb, var(--brand) 75%, #fff)',
      500: 'var(--brand)',
      600: 'color-mix(in srgb, var(--brand) 88%, #000)',
      700: 'color-mix(in srgb, var(--brand) 72%, #000)',
      800: 'color-mix(in srgb, var(--brand) 56%, #000)',
      900: 'color-mix(in srgb, var(--brand) 40%, #000)',
      950: 'color-mix(in srgb, var(--brand) 26%, #000)',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }), withPreloading(PreloadAllModules)),
    providePrimeNG({
      theme: {
        preset: DigitalGujarat,
        options: { darkModeSelector: '.app-dark' },
      },
    }),
  ],
};
