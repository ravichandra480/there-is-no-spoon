/**
 * The only supported way to suppress an automated accessibility finding.
 * Spec: accessibility-compliance › "No suppression without justification".
 */
export interface RuleExclusion {
  /** axe rule id or custom check id, e.g. `color-contrast-enhanced` or `tins-target-size`. */
  readonly rule: string;
  /** CSS selector; a finding is excluded when its element matches it or sits inside a match (shadow-DOM aware). */
  readonly selector: string;
  /** Why this is acceptable (e.g. a WCAG exception that applies). */
  readonly reason: string;
  /** Tracking reference: `#123`, `ABC-123`, or an https URL. */
  readonly issue: string;
}

const ISSUE_PATTERN = /^(#\d+|[A-Z][A-Z0-9]+-\d+|https:\/\/\S+)$/;
const MIN_REASON_LENGTH = 15;

export function excludeRule(exclusion: RuleExclusion): RuleExclusion {
  const { rule, selector, reason, issue } = (exclusion ?? {}) as Partial<RuleExclusion>;
  const problems: string[] = [];
  if (!rule?.trim()) problems.push('`rule` is required');
  if (!selector?.trim() || selector.trim() === '*') {
    problems.push('`selector` must target specific nodes (global exclusions are not allowed)');
  }
  if (!reason || reason.trim().length < MIN_REASON_LENGTH) {
    problems.push(`\`reason\` must explain the exclusion (at least ${MIN_REASON_LENGTH} characters)`);
  }
  if (!issue || !ISSUE_PATTERN.test(issue.trim())) {
    problems.push('`issue` must be a tracking reference (#123, ABC-123 or https URL)');
  }
  if (problems.length) {
    throw new Error(`Invalid accessibility rule exclusion: ${problems.join('; ')}`);
  }
  return Object.freeze({ ...exclusion });
}

/** Flattens an axe node target (which may be nested for shadow DOM) into one string. */
export function targetToString(target: unknown): string {
  if (Array.isArray(target)) return target.map(targetToString).join(' >>> ');
  return String(target);
}

/** True when `el` (or a composed ancestor) matches `selector`. Runs in a browser. */
export function composedClosest(el: Element, selector: string): boolean {
  for (let cur: Element | null = el; cur; ) {
    if (cur.matches(selector)) return true;
    const root = cur.getRootNode();
    cur = cur.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return false;
}

/** Browser-side exclusion check against a live element. */
export function isElementExcluded(rule: string, el: Element | undefined, exclusions: readonly RuleExclusion[]): boolean {
  if (!el) return false;
  return exclusions.some((e) => e.rule === rule && composedClosest(el, e.selector));
}
