/**
 * Accessibility helpers for Playwright e2e tests.
 *
 *   import { scanPage, applyTextSpacing, assertNoReflowOverflow } from '@tins/testing-a11y/playwright';
 */
import { AxeBuilder } from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { FORCE_ENABLED_RULES, WCAG_TAGS } from './lib/config.js';
import type { RuleExclusion } from './lib/exclusions.js';
import {
  type A11yFinding,
  findingsFromAxe,
  formatFindings,
} from './lib/format.js';

export { excludeRule } from './lib/exclusions.js';
export type { RuleExclusion } from './lib/exclusions.js';

type Attachable = Pick<TestInfo, 'attach'>;

export interface ScanOptions {
  exclusions?: readonly RuleExclusion[];
  /** Restrict the scan to a CSS selector (defaults to the whole page). */
  include?: string;
  /** Name for the attached report, e.g. `axe:/button:dark`. */
  name?: string;
}

export class PageA11yError extends Error {
  constructor(
    message: string,
    readonly findings: readonly A11yFinding[],
  ) {
    super(message);
    this.name = 'PageA11yError';
  }
}

type AxeViolation = Awaited<
  ReturnType<AxeBuilder['analyze']>
>['violations'][number];

/** Resolves each violating node in the page (through shadow roots) and drops those matching an exclusion. */
async function filterExcluded(
  page: Page,
  violations: AxeViolation[],
  exclusions: readonly RuleExclusion[],
): Promise<AxeViolation[]> {
  if (!exclusions.length) return violations;
  const checks = violations.flatMap((v) =>
    v.nodes.map((n) => ({
      target: n.target as unknown,
      selectors: exclusions
        .filter((e) => e.rule === v.id)
        .map((e) => e.selector),
    })),
  );
  const excluded = await page.evaluate((items) => {
    const resolve = (target: unknown): Element | null => {
      const path = (
        Array.isArray(target) ? target : [target]
      ).flat() as string[];
      let root: Document | ShadowRoot = document;
      let el: Element | null = null;
      for (const sel of path) {
        el = root.querySelector(sel);
        if (!el) return null;
        if (el.shadowRoot) root = el.shadowRoot;
      }
      return el;
    };
    const closest = (el: Element, selector: string) => {
      for (let cur: Element | null = el; cur; ) {
        if (cur.matches(selector)) return true;
        const r = cur.getRootNode();
        cur = cur.parentElement ?? (r instanceof ShadowRoot ? r.host : null);
      }
      return false;
    };
    return items.map(({ target, selectors }) => {
      const el = selectors.length ? resolve(target) : null;
      return !!el && selectors.some((s) => closest(el, s));
    });
  }, checks);
  let i = 0;
  return violations
    .map((v) => ({ ...v, nodes: v.nodes.filter(() => !excluded[i++]) }))
    .filter((v) => v.nodes.length > 0);
}

/** Runs axe-core with the shared WCAG 2.2 A/AA/AAA configuration, attaches the JSON report, and throws on violations. */
export async function scanPage(
  page: Page,
  testInfo: Attachable,
  options: ScanOptions = {},
): Promise<A11yFinding[]> {
  let builder = new AxeBuilder({ page: page as never })
    .withTags([...WCAG_TAGS])
    .options({
      rules: Object.fromEntries(
        FORCE_ENABLED_RULES.map((id) => [id, { enabled: true }]),
      ),
    });
  if (options.include) builder = builder.include(options.include);
  const results = await builder.analyze();
  const violations = await filterExcluded(
    page,
    results.violations,
    options.exclusions ?? [],
  );
  const findings = findingsFromAxe(violations);
  await testInfo.attach(options.name ?? 'axe-results', {
    body: JSON.stringify(
      {
        url: page.url(),
        findings,
        incomplete: results.incomplete.map((i) => i.id),
      },
      null,
      2,
    ),
    contentType: 'application/json',
  });
  if (findings.length)
    throw new PageA11yError(formatFindings(findings, page.url()), findings);
  return findings;
}

/** WCAG 1.4.12 text-spacing bookmarklet styles, injected into the document and every open shadow root. */
export const TEXT_SPACING_CSS = `
*, *::before, *::after {
  line-height: 1.5 !important;
  letter-spacing: 0.12em !important;
  word-spacing: 0.16em !important;
}
p { margin-bottom: 2em !important; }
`;

export async function applyTextSpacing(page: Page): Promise<void> {
  await page.evaluate((css) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    const roots: (Document | ShadowRoot)[] = [document];
    const walk = (node: Element) => {
      if (node.shadowRoot) {
        roots.push(node.shadowRoot);
        [...node.shadowRoot.children].forEach(walk);
      }
      [...node.children].forEach(walk);
    };
    walk(document.documentElement);
    for (const root of roots)
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }, TEXT_SPACING_CSS);
}

export interface LayoutProblem {
  kind: 'horizontal-scroll' | 'clipped-text';
  target: string;
  detail: string;
}

/** Finds horizontal page scrolling and text clipped by overflow (walks shadow roots). */
export async function findLayoutProblems(page: Page): Promise<LayoutProblem[]> {
  return page.evaluate(() => {
    const problems: {
      kind: 'horizontal-scroll' | 'clipped-text';
      target: string;
      detail: string;
    }[] = [];
    const doc = document.scrollingElement ?? document.documentElement;
    if (doc.scrollWidth > doc.clientWidth + 1) {
      problems.push({
        kind: 'horizontal-scroll',
        target: 'document',
        detail: `scrollWidth ${doc.scrollWidth} > viewport ${doc.clientWidth}`,
      });
    }
    const describe = (el: Element) => {
      const parts: string[] = [];
      for (let cur: Element | null = el; cur && parts.length < 4; ) {
        parts.unshift(cur.tagName.toLowerCase() + (cur.id ? `#${cur.id}` : ''));
        const root = cur.getRootNode();
        cur =
          cur.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
      }
      return parts.join(' > ');
    };
    // The standard "visually hidden" technique (≤1px box clipped away, text still read by
    // assistive technology) clips on purpose and is not a reflow or text-spacing failure.
    const isVisuallyHidden = (el: Element, s: CSSStyleDeclaration) =>
      el.clientWidth <= 1 &&
      el.clientHeight <= 1 &&
      (s.clipPath.startsWith('inset') ||
        s.clip.startsWith('rect') ||
        s.position === 'absolute');
    const visit = (el: Element) => {
      const s = getComputedStyle(el);
      if (isVisuallyHidden(el, s)) return;
      const hidesOverflow = /(hidden|clip)/.test(s.overflowX + s.overflowY);
      const hasText = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim(),
      );
      if (
        hidesOverflow &&
        hasText &&
        s.textOverflow !== 'ellipsis' &&
        (el.scrollWidth > el.clientWidth + 1 ||
          el.scrollHeight > el.clientHeight + 1)
      ) {
        problems.push({
          kind: 'clipped-text',
          target: describe(el),
          detail: `content ${el.scrollWidth}x${el.scrollHeight} exceeds box ${el.clientWidth}x${el.clientHeight}`,
        });
      }
      if (el.shadowRoot) [...el.shadowRoot.children].forEach(visit);
      [...el.children].forEach(visit);
    };
    visit(document.body);
    return problems;
  });
}

function throwLayout(problems: LayoutProblem[], what: string): void {
  if (!problems.length) return;
  throw new Error(
    `${what} failed:\n` +
      problems.map((p) => `- [${p.kind}] ${p.target}: ${p.detail}`).join('\n'),
  );
}

/** WCAG 1.4.10 Reflow: at `width` CSS px there is no horizontal scrolling and no clipped text. */
export async function assertNoReflowOverflow(
  page: Page,
  width = 320,
): Promise<void> {
  const viewport = page.viewportSize();
  await page.setViewportSize({ width, height: viewport?.height ?? 800 });
  await page.waitForTimeout(50);
  throwLayout(
    await findLayoutProblems(page),
    `Reflow at ${width}px (WCAG 1.4.10)`,
  );
}

/** WCAG 1.4.12 Text Spacing: after applying the override, no text is clipped and nothing scrolls horizontally. */
export async function assertTextSpacingSafe(page: Page): Promise<void> {
  await applyTextSpacing(page);
  throwLayout(
    await findLayoutProblems(page),
    'Text spacing override (WCAG 1.4.12)',
  );
}
