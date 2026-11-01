import {
  DOCUMENT,
  Injectable,
  Injector,
  afterNextRender,
  inject,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * After every in-app navigation (not the initial page load), moves keyboard focus to the new
 * page's `h1` so screen reader and keyboard users land at the start of the new content.
 */
@Injectable({ providedIn: 'root' })
export class RouteFocusService {
  private readonly doc = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private started = false;

  start(router: Router = this.injector.get(Router)): void {
    if (this.started) return;
    this.started = true;
    let first = true;
    router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        if (first) {
          first = false;
          return;
        }
        afterNextRender(
          { write: () => this.focusHeading() },
          { injector: this.injector },
        );
      });
  }

  focusHeading(): void {
    const h1 = this.doc.querySelector<HTMLElement>('#main h1');
    if (!h1) return;
    if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
    h1.focus();
  }
}
