import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { RouteFocusService } from './shell/route-focus.service';
import { SITE_NAME } from './shell/title-strategy';
import {
  THEME_OPTIONS,
  type ThemeChoice,
  ThemeService,
} from './shell/theme.service';

/**
 * Accessible application shell: skip link, banner / main / contentinfo landmarks,
 * theme switcher, and focus moved to the page `h1` after each route change.
 */
@Component({
  selector: 'demo-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly siteName = SITE_NAME;
  protected readonly themeOptions = THEME_OPTIONS;
  protected readonly theme = inject(ThemeService);

  constructor() {
    inject(RouteFocusService).start(inject(Router));
  }

  /** The skip link must not navigate (with `<base href>` a bare `#main` would load `/`). */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    const main = (
      event.currentTarget as HTMLElement
    ).ownerDocument.getElementById('main');
    main?.focus();
  }

  protected onThemeChange(event: Event): void {
    this.theme.set((event.target as HTMLSelectElement).value as ThemeChoice);
  }
}
