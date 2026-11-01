import { TestBed } from '@angular/core/testing';
import { renderApp, settle } from '../testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

const html = document.documentElement;

beforeEach(() => {
  localStorage.removeItem(THEME_STORAGE_KEY);
  html.removeAttribute('data-theme');
});
afterEach(() => TestBed.resetTestingModule());

describe('ThemeService', () => {
  it('follows the OS by default (no data-theme attribute)', async () => {
    await renderApp('/');
    expect(TestBed.inject(ThemeService).theme()).toBe('system');
    expect(html.hasAttribute('data-theme')).toBe(false);
  });

  it('applies the theme chosen in the theme menu and persists it across a re-bootstrap', async () => {
    const { fixture, root } = await renderApp('/');
    const select = root.querySelector<HTMLSelectElement>('#theme-select');
    if (!select) throw new Error('theme select missing');
    select.value = 'high-contrast';
    select.dispatchEvent(new Event('change'));
    await settle(fixture);
    expect(html.getAttribute('data-theme')).toBe('high-contrast');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('high-contrast');

    // "Reload": tear the app down, clear the DOM state, boot again.
    TestBed.resetTestingModule();
    html.removeAttribute('data-theme');
    const again = await renderApp('/');
    expect(html.getAttribute('data-theme')).toBe('high-contrast');
    expect(
      again.root.querySelector<HTMLSelectElement>('#theme-select')?.value,
    ).toBe('high-contrast');
  });

  it('returns to the OS setting and forgets the choice', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    await renderApp('/');
    expect(html.getAttribute('data-theme')).toBe('dark');
    TestBed.inject(ThemeService).set('system');
    expect(html.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('ignores an unknown stored value', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    await renderApp('/');
    expect(TestBed.inject(ThemeService).theme()).toBe('system');
  });
});
