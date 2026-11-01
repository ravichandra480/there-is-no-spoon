/**
 * Accessibility assertions for Vitest **browser mode** component tests.
 *
 *   import { expectNoA11yViolations, assertTargetSize, assertFocusVisible } from '@tins/testing-a11y/vitest';
 */
import axe from 'axe-core';
import { AAA_FOCUS_THICKNESS, AAA_TARGET_SIZE, NON_TEXT_CONTRAST, axeRunOptions } from './lib/config.js';
import { contrastRatio, parseColor } from './lib/contrast.js';
import { composedContains, composedParent, deepActiveElement, deepQueryAll, effectiveBackground, INTERACTIVE_SELECTOR, isDisabled, isRendered } from './lib/dom.js';
import { type RuleExclusion, isElementExcluded } from './lib/exclusions.js';
import { type A11yFinding, findingsFromAxe, formatFindings } from './lib/format.js';

export { excludeRule } from './lib/exclusions.js';
export type { RuleExclusion } from './lib/exclusions.js';

export interface A11yCheckOptions {
  exclusions?: readonly RuleExclusion[];
  /** Label used in failure messages, e.g. `tins-button[disabled]`. */
  context?: string;
}

export class A11yAssertionError extends Error {
  constructor(message: string, readonly findings: readonly A11yFinding[]) {
    super(message);
    this.name = 'A11yAssertionError';
  }
}

function fail(findings: A11yFinding[], context: string): never {
  throw new A11yAssertionError(formatFindings(findings, context), findings);
}

const describeEl = (el: Element) =>
  el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + [...el.classList].map((c) => `.${c}`).join('');

/** Runs axe-core (WCAG 2.2 A/AA/AAA + best practice) against `el` including its shadow DOM. */
export async function runAxe(el: Element, options: A11yCheckOptions = {}): Promise<A11yFinding[]> {
  const results = await axe.run(el, axeRunOptions());
  const violations = results.violations
    .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !isElementExcluded(v.id, n.element, options.exclusions ?? [])) }))
    .filter((v) => v.nodes.length > 0);
  return findingsFromAxe(violations);
}

/** Fails with a readable report (rule id, node, WCAG criterion) if axe finds any violation. */
export async function expectNoA11yViolations(el: Element, options: A11yCheckOptions = {}): Promise<void> {
  const findings = await runAxe(el, options);
  if (findings.length) fail(findings, options.context ?? describeEl(el));
}

export interface TargetSizeOptions extends A11yCheckOptions {
  /** CSS selectors exempt under WCAG 2.5.5 exceptions (e.g. inline links in a sentence). */
  exempt?: readonly string[];
}

/**
 * WCAG 2.5.5 Target Size (Enhanced): every enabled, rendered interactive element at or below `el`
 * (through shadow roots) must be at least `min`×`min` CSS px. If `el` has no interactive
 * descendants, `el` itself is measured.
 */
export function assertTargetSize(el: Element, min = AAA_TARGET_SIZE, options: TargetSizeOptions = {}): void {
  const candidates = deepQueryAll(el, INTERACTIVE_SELECTOR).filter((c) => isRendered(c) && !isDisabled(c));
  const targets = candidates.length ? candidates : [el];
  const findings: A11yFinding[] = [];
  for (const t of targets) {
    if (options.exempt?.some((s) => t.matches(s))) continue;
    const target = describeEl(t);
    if (isElementExcluded('tins-target-size', t, options.exclusions ?? [])) continue;
    const { width, height } = t.getBoundingClientRect();
    if (width + 0.5 < min || height + 0.5 < min) {
      findings.push({
        rule: 'tins-target-size',
        criteria: ['2.5.5'],
        help: `Pointer target must be at least ${min}x${min} CSS px (is ${width.toFixed(1)}x${height.toFixed(1)})`,
        target,
      });
    }
  }
  if (findings.length) fail(findings, options.context ?? describeEl(el));
}

interface Indicator {
  thickness: number;
  color: string;
  source: Element;
}

function parseBoxShadows(value: string): { color: string; spread: number; blur: number; inset: boolean }[] {
  if (!value || value === 'none') return [];
  return value.split(/,(?![^(]*\))/).map((part) => {
    const color = /(rgba?\([^)]*\)|#[0-9a-f]+|[a-z]+)/i.exec(part.replace(/inset|\d+(\.\d+)?px/g, ''))?.[0] ?? 'transparent';
    const nums = [...part.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((m) => parseFloat(m[1]));
    return { color, blur: nums[2] ?? 0, spread: nums[3] ?? 0, inset: /\binset\b/.test(part) };
  });
}

function indicatorOf(el: Element): Indicator | null {
  const s = getComputedStyle(el);
  const outlineWidth = parseFloat(s.outlineWidth) || 0;
  if (s.outlineStyle !== 'none' && outlineWidth > 0 && parseColor(s.outlineColor).a > 0) {
    return { thickness: outlineWidth, color: s.outlineColor, source: el };
  }
  const shadow = parseBoxShadows(s.boxShadow)
    .filter((b) => b.spread > 0 && parseColor(b.color).a > 0)
    .sort((a, b) => b.spread - a.spread)[0];
  return shadow ? { thickness: shadow.spread, color: shadow.color, source: el } : null;
}

/**
 * WCAG 2.4.7 / 2.4.11 / 2.4.13: focusing `el` must show an indicator (outline or box-shadow ring)
 * at least `minThickness` px thick with ≥3:1 contrast against the adjacent background, and the
 * focused element must not be fully obscured.
 */
export function assertFocusVisible(el: HTMLElement, options: A11yCheckOptions & { minThickness?: number } = {}): void {
  const context = options.context ?? describeEl(el);
  const minThickness = options.minThickness ?? AAA_FOCUS_THICKNESS;
  el.focus({ focusVisible: true } as FocusOptions);
  const focused = deepActiveElement();
  if (!focused || (focused !== el && !el.contains(focused) && !el.shadowRoot?.contains(focused))) {
    fail([{ rule: 'tins-focus-visible', criteria: ['2.4.7'], help: 'Element did not receive focus', target: context }], context);
  }

  // The ring may be drawn on the focused node or on an ancestor up to (and including) the host.
  let indicator: Indicator | null = null;
  for (let cur: Element | null = focused; cur; cur = composedParent(cur)) {
    indicator = indicatorOf(cur);
    if (indicator || cur === el) break;
  }
  const findings: A11yFinding[] = [];
  if (!indicator) {
    findings.push({ rule: 'tins-focus-visible', criteria: ['2.4.7', '2.4.13'], help: 'No visible focus indicator (outline or box-shadow ring)', target: describeEl(focused) });
  } else {
    if (indicator.thickness + 0.01 < minThickness) {
      findings.push({ rule: 'tins-focus-visible', criteria: ['2.4.13'], help: `Focus indicator is ${indicator.thickness}px; must be at least ${minThickness}px`, target: describeEl(indicator.source) });
    }
    const parent = composedParent(indicator.source) ?? indicator.source;
    const ratio = contrastRatio(indicator.color, effectiveBackground(parent));
    if (ratio < NON_TEXT_CONTRAST) {
      findings.push({ rule: 'tins-focus-visible', criteria: ['1.4.11', '2.4.13'], help: `Focus indicator contrast is ${ratio.toFixed(2)}:1; must be at least ${NON_TEXT_CONTRAST}:1`, target: describeEl(indicator.source) });
    }
  }

  // 2.4.12 Focus Not Obscured (Enhanced): the centre point must hit the focused element.
  const rect = focused.getBoundingClientRect();
  const root = focused.getRootNode() as Document | ShadowRoot;
  const hit = root.elementFromPoint?.(rect.left + rect.width / 2, rect.top + rect.height / 2);
  // Hits on the focused element's own descendants (incl. slotted content) or its hosts are not obscuring.
  if (hit && !composedContains(focused, hit) && !composedContains(hit, focused)) {
    findings.push({ rule: 'tins-focus-not-obscured', criteria: ['2.4.12'], help: `Focused element is covered by ${describeEl(hit)}`, target: describeEl(focused) });
  }

  const remaining = findings.filter((f) => !isElementExcluded(f.rule, focused, options.exclusions ?? []));
  if (remaining.length) fail(remaining, context);
}
