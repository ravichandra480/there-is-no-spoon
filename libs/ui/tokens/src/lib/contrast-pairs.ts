import type { ColorToken } from './themes.js';

export type ContrastLevel = 'text' | 'large-text' | 'ui';

export interface ContrastPair {
  foreground: ColorToken;
  background: ColorToken;
  level: ContrastLevel;
  usage: string;
}

/** Minimum ratios for the AAA target: 1.4.6 (text, large text) and 1.4.11 / 2.4.13 (UI, focus). */
export const MIN_RATIO: Record<ContrastLevel, number> = { text: 7, 'large-text': 4.5, ui: 3 };

/** Every foreground/background combination used by components. Checked in every theme. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { foreground: 'color-text', background: 'color-surface', level: 'text', usage: 'body text' },
  { foreground: 'color-text', background: 'color-surface-raised', level: 'text', usage: 'text on raised surfaces / inputs' },
  { foreground: 'color-text-muted', background: 'color-surface', level: 'text', usage: 'hint / helper text' },
  { foreground: 'color-text-muted', background: 'color-surface-raised', level: 'text', usage: 'hint text on raised surfaces' },
  { foreground: 'color-on-primary', background: 'color-primary', level: 'text', usage: 'primary button label' },
  { foreground: 'color-on-primary', background: 'color-primary-hover', level: 'text', usage: 'primary button label (hover)' },
  { foreground: 'color-primary', background: 'color-surface', level: 'text', usage: 'secondary button label' },
  { foreground: 'color-primary', background: 'color-surface-raised', level: 'text', usage: 'secondary button label (hover)' },
  { foreground: 'color-danger', background: 'color-surface', level: 'text', usage: 'error message' },
  { foreground: 'color-danger', background: 'color-surface-raised', level: 'text', usage: 'error message on raised surface' },
  { foreground: 'color-link', background: 'color-surface', level: 'text', usage: 'links' },
  { foreground: 'color-border', background: 'color-surface', level: 'ui', usage: 'control boundaries' },
  { foreground: 'color-border', background: 'color-surface-raised', level: 'ui', usage: 'control boundaries on raised surfaces' },
  { foreground: 'color-danger', background: 'color-surface-raised', level: 'ui', usage: 'error state border' },
  { foreground: 'color-focus-ring', background: 'color-surface', level: 'ui', usage: 'focus indicator' },
  { foreground: 'color-focus-ring', background: 'color-surface-raised', level: 'ui', usage: 'focus indicator on raised surfaces' },
  { foreground: 'color-primary', background: 'color-surface', level: 'ui', usage: 'primary button boundary' },
  { foreground: 'color-success', background: 'color-surface', level: 'ui', usage: 'success / available status indicator' },
  { foreground: 'color-success', background: 'color-surface-raised', level: 'ui', usage: 'status indicator on raised surfaces' },
  { foreground: 'color-text', background: 'color-row-hover', level: 'text', usage: 'row text on hovered rows' },
  { foreground: 'color-text-muted', background: 'color-row-hover', level: 'text', usage: 'muted row text on hovered rows' },
  { foreground: 'color-border', background: 'color-row-hover', level: 'ui', usage: 'checkbox boundary on hovered rows' },
  { foreground: 'color-focus-ring', background: 'color-row-hover', level: 'ui', usage: 'focus indicator on hovered rows' },
  { foreground: 'color-primary', background: 'color-row-hover', level: 'ui', usage: 'checked checkbox on hovered rows' },
  { foreground: 'color-success', background: 'color-row-hover', level: 'ui', usage: 'status dot on hovered rows' },
  { foreground: 'color-text', background: 'color-row-selected', level: 'text', usage: 'row text on selected rows' },
  { foreground: 'color-text-muted', background: 'color-row-selected', level: 'text', usage: 'muted row text on selected rows' },
  { foreground: 'color-border', background: 'color-row-selected', level: 'ui', usage: 'checkbox boundary on selected rows' },
  { foreground: 'color-focus-ring', background: 'color-row-selected', level: 'ui', usage: 'focus indicator on selected rows' },
  { foreground: 'color-primary', background: 'color-row-selected', level: 'ui', usage: 'checked checkbox on selected rows' },
  { foreground: 'color-success', background: 'color-row-selected', level: 'ui', usage: 'status dot on selected rows' },
  { foreground: 'color-text', background: 'color-row-selected-hover', level: 'text', usage: 'row text on hovered selected rows' },
  { foreground: 'color-text-muted', background: 'color-row-selected-hover', level: 'text', usage: 'muted row text on hovered selected rows' },
  { foreground: 'color-border', background: 'color-row-selected-hover', level: 'ui', usage: 'checkbox boundary on hovered selected rows' },
  { foreground: 'color-focus-ring', background: 'color-row-selected-hover', level: 'ui', usage: 'focus indicator on hovered selected rows' },
  { foreground: 'color-primary', background: 'color-row-selected-hover', level: 'ui', usage: 'checked checkbox on hovered selected rows' },
  { foreground: 'color-success', background: 'color-row-selected-hover', level: 'ui', usage: 'status dot on hovered selected rows' },
];

/** Row state backgrounds. Each must differ from `color-surface` in every theme so hover and selection show. */
export const ROW_STATE_TOKENS = ['color-row-hover', 'color-row-selected', 'color-row-selected-hover'] as const satisfies readonly ColorToken[];
