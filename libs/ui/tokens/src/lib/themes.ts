export const TOKEN_PREFIX = 'tins';

/** Themes shipped by this library. All meet WCAG 2.2 AAA contrast. */
export const THEMES = ['light', 'dark', 'high-contrast'] as const;
export type Theme = (typeof THEMES)[number];

/** The `data-theme` attribute value selects a theme; omit it to follow `prefers-color-scheme`. */
export const THEME_ATTRIBUTE = 'data-theme';

export const COLOR_TOKENS = [
  'color-text',
  'color-text-muted',
  'color-surface',
  'color-surface-raised',
  'color-row-hover',
  'color-row-selected',
  'color-row-selected-hover',
  'color-border',
  'color-focus-ring',
  'color-primary',
  'color-primary-hover',
  'color-on-primary',
  'color-danger',
  'color-link',
  'color-success',
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export const BASE_TOKENS = [
  'font-family',
  'font-size-base',
  'font-size-lg',
  'font-weight-regular',
  'font-weight-bold',
  'line-height',
  'space-1',
  'space-2',
  'space-3',
  'space-4',
  'space-6',
  'radius',
  'border-width',
  'focus-ring-width',
  'focus-ring-offset',
  'target-size',
  'motion-duration',
] as const;
export type BaseToken = (typeof BASE_TOKENS)[number];
export type TokenName = ColorToken | BaseToken;

/** CSS custom property name for a token, e.g. `--tins-color-text`. */
export function tokenProperty(name: TokenName): `--${typeof TOKEN_PREFIX}-${TokenName}` {
  return `--${TOKEN_PREFIX}-${name}`;
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}
