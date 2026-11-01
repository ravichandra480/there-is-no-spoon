import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withHashLocation,
} from '@angular/router';
import { appRoutes } from './app.routes';
import { ThemeService } from './shell/theme.service';
import { DemoTitleStrategy } from './shell/title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      // GitHub Pages has no SPA fallback: the single-file build routes via the URL hash.
      ...(import.meta.env.MODE === 'gh-pages' ? [withHashLocation()] : []),
    ),
    { provide: TitleStrategy, useClass: DemoTitleStrategy },
    // Apply the saved theme before first render.
    provideAppInitializer(() => void inject(ThemeService)),
  ],
};
