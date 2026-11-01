import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

/** Boots the real app shell (router, title strategy, theme) inside TestBed. */
export async function renderApp(
  url?: string,
): Promise<{
  fixture: ComponentFixture<App>;
  router: Router;
  root: HTMLElement;
}> {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [...appConfig.providers],
  });
  const fixture = TestBed.createComponent(App);
  const router = TestBed.inject(Router);
  fixture.autoDetectChanges();
  await router.navigateByUrl(url ?? '/');
  await settle(fixture);
  return { fixture, router, root: fixture.nativeElement as HTMLElement };
}

/** Waits for Angular, lazy routes and Lit elements to finish rendering. */
export async function settle(
  fixture: ComponentFixture<unknown>,
): Promise<void> {
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const lit = [...root.querySelectorAll('*')].filter(
    (e): e is Element & { updateComplete: Promise<unknown> } =>
      'updateComplete' in e,
  );
  await Promise.all(lit.map((e) => e.updateComplete));
  await new Promise((r) => requestAnimationFrame(() => r(undefined)));
}

export async function navigate(
  fixture: ComponentFixture<unknown>,
  router: Router,
  url: string,
): Promise<void> {
  await router.navigateByUrl(url);
  await settle(fixture);
}
