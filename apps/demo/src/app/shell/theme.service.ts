import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { isTheme, type Theme } from '@tins/ui-tokens';

/** `system` = no `data-theme`; the tokens follow `prefers-color-scheme` (and forced colors). */
export type ThemeChoice = 'system' | Theme;

export const THEME_STORAGE_KEY = 'tins-demo-theme';

export const THEME_OPTIONS: readonly { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'Match my device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast' },
];

/** Applies the chosen theme as `data-theme` on `<html>` and remembers it in localStorage. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly storage = this.doc.defaultView?.localStorage;
  readonly theme = signal<ThemeChoice>(this.read());

  constructor() {
    this.apply(this.theme());
  }

  set(choice: ThemeChoice): void {
    this.theme.set(choice);
    this.apply(choice);
    try {
      if (choice === 'system') this.storage?.removeItem(THEME_STORAGE_KEY);
      else this.storage?.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      // Storage may be unavailable (private mode); the choice still applies for this visit.
    }
  }

  private read(): ThemeChoice {
    try {
      const stored = this.storage?.getItem(THEME_STORAGE_KEY);
      return stored && isTheme(stored) ? stored : 'system';
    } catch {
      return 'system';
    }
  }

  private apply(choice: ThemeChoice): void {
    const root = this.doc.documentElement;
    if (choice === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', choice);
  }
}
