# @tins/ui-tokens

Design tokens for the `tins-*` components: SCSS source → CSS custom properties, with three shipped
themes that all meet **WCAG 2.2 AAA** contrast (text ≥ 7:1, large text ≥ 4.5:1, UI boundaries and
focus ≥ 3:1). Contrast is enforced by `nx test ui-tokens` against the compiled CSS.

## Build output

| File | Purpose |
| --- | --- |
| `tokens.css` | Custom properties for `:root`, `[data-theme]`, `prefers-color-scheme`, `prefers-reduced-motion`, `forced-colors` |
| `tokens.json` | Per-theme values (used for contrast tests and documentation) |
| `scss/` | SCSS API: `token()` function and mixins |
| `index.js` | `THEMES`, `COLOR_TOKENS`, `BASE_TOKENS`, `tokenProperty()`, `CONTRAST_PAIRS`, `isTheme()` |

## Themes

| Theme | Selected by |
| --- | --- |
| `light` | default on `:root`, or `data-theme="light"` |
| `dark` | `data-theme="dark"`, or OS `prefers-color-scheme: dark` when no `data-theme` is set |
| `high-contrast` | `data-theme="high-contrast"` |
| forced colors | automatic under `forced-colors: active` (maps tokens to system colors) |

```html
<html data-theme="high-contrast">
```

## Tokens

Color tokens (per theme):

<!-- tokens:color -->
`--tins-color-text`, `--tins-color-text-muted`, `--tins-color-surface`, `--tins-color-surface-raised`,
`--tins-color-row-hover`, `--tins-color-row-selected`, `--tins-color-row-selected-hover`,
`--tins-color-border`, `--tins-color-focus-ring`, `--tins-color-primary`, `--tins-color-primary-hover`,
`--tins-color-on-primary`, `--tins-color-danger`, `--tins-color-link`, `--tins-color-success`
<!-- /tokens:color -->

Base tokens (theme-independent):

<!-- tokens:base -->
`--tins-font-family`, `--tins-font-size-base`, `--tins-font-size-lg`, `--tins-font-weight-regular`,
`--tins-font-weight-bold`, `--tins-line-height`, `--tins-space-1`, `--tins-space-2`, `--tins-space-3`,
`--tins-space-4`, `--tins-space-6`, `--tins-radius`, `--tins-border-width`, `--tins-focus-ring-width`,
`--tins-focus-ring-offset`, `--tins-target-size`, `--tins-motion-duration`
<!-- /tokens:base -->

`--tins-motion-duration` becomes `0ms` under `prefers-reduced-motion: reduce`.

## Overriding tokens

Set any token on an ancestor; components below it pick it up without rebuilding:

```css
.checkout {
  --tins-color-primary: #004d26;
  --tins-color-primary-hover: #00331a;
}
```

Overrides must keep the AAA ratios listed in `CONTRAST_PAIRS` (`src/lib/contrast-pairs.ts`).

## SCSS API (for component authors)

```scss
@use '@tins/ui-tokens/scss' as tokens;

:host {
  color: tokens.token('color-text'); // var(--tins-color-text, #1a1a1a)
}
button {
  @include tokens.target-size; // ≥ 44×44 (WCAG 2.5.5)
  @include tokens.focus-ring; // 3px ring, offset 2px (WCAG 2.4.13)
  @include tokens.motion-safe-transition(background-color); // off under reduced motion
  @include tokens.forced-colors {
    border-color: ButtonBorder;
  }
}
```

`token()` falls back to the light value, so components render the default theme even when the host
page loads no `tokens.css`. Unknown token names fail the Sass build.

## Commands

```sh
npx nx build ui-tokens   # dist/libs/ui/tokens
npx nx test ui-tokens    # AAA contrast for every theme, CSS output, mixins, README token list
```
