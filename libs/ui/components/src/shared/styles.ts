import { type CSSResult, unsafeCSS } from 'lit';

/** Wraps SCSS compiled by Vite (`import css from './x.styles.scss?inline'`) as a Lit `CSSResult`. */
export function scss(compiled: string): CSSResult {
  return unsafeCSS(compiled);
}
