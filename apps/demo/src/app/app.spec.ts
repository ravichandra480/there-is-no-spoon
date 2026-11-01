import { TestBed } from '@angular/core/testing';
import { expectNoA11yViolations } from '@tins/testing-a11y/vitest';
import { navigate, renderApp } from './testing';

afterEach(() => {
  TestBed.resetTestingModule();
  document.documentElement.removeAttribute('data-theme');
});

describe('App shell', () => {
  it('has a skip link first, landmarks, and a single h1', async () => {
    const { root } = await renderApp('/file-table');
    const focusables = root.querySelectorAll(
      'a[href], select, button, [tabindex="0"]',
    );
    expect(focusables[0]?.textContent?.trim()).toBe('Skip to main content');
    expect(root.querySelectorAll('header')).toHaveLength(1);
    expect(root.querySelectorAll('main#main')).toHaveLength(1);
    expect(root.querySelectorAll('footer')).toHaveLength(1);
    expect(root.querySelectorAll('h1')).toHaveLength(1);
  });

  it('redirects the site root and unknown paths to the file table page', async () => {
    const { fixture, router } = await renderApp('/');
    expect(router.url).toBe('/file-table');
    await navigate(fixture, router, '/does-not-exist');
    expect(router.url).toBe('/file-table');
  });

  it('skip link moves focus to main content without navigating', async () => {
    const { root, router } = await renderApp('/file-table');
    root.querySelector<HTMLAnchorElement>('.skip-link')?.click();
    expect(document.activeElement?.id).toBe('main');
    expect(router.url).toBe('/file-table');
  });

  it('sets the document title and focuses the page h1 after an in-app navigation', async () => {
    const { fixture, router, root } = await renderApp('/file-table');
    expect(document.title).toBe('File table · tins components demo');

    await navigate(fixture, router, '/file-table?from=nav');
    expect(document.title).toBe('File table · tins components demo');
    expect(document.activeElement).toBe(root.querySelector('main h1'));
    expect(document.activeElement?.textContent).toBe('File table');
    expect(root.querySelectorAll('h1')).toHaveLength(1);
  });

  it('does not move focus on the initial page load', async () => {
    await renderApp('/file-table');
    expect(document.activeElement).toBe(document.body);
  });

  it('shell has no WCAG 2.2 A/AA/AAA violations', async () => {
    const { root } = await renderApp('/file-table');
    await expectNoA11yViolations(root, { context: 'demo shell' });
  });
});
