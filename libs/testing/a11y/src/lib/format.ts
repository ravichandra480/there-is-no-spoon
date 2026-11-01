import type { NodeResult, Result } from 'axe-core';
import { targetToString } from './exclusions.js';

/** Converts axe tags such as `wcag146` into WCAG criteria (`1.4.6`). */
export function wcagCriteria(tags: readonly string[]): string[] {
  return tags
    .map((t) => /^wcag(\d)(\d)(\d+)$/.exec(t))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => `${m[1]}.${m[2]}.${m[3]}`);
}

export interface A11yFinding {
  rule: string;
  impact?: string | null;
  criteria: string[];
  help: string;
  helpUrl?: string;
  target: string;
  summary?: string;
}

export function findingsFromAxe(violations: readonly Result[]): A11yFinding[] {
  return violations.flatMap((v) =>
    v.nodes.map((n: NodeResult) => ({
      rule: v.id,
      impact: n.impact ?? v.impact,
      criteria: wcagCriteria(v.tags),
      help: v.help,
      helpUrl: v.helpUrl,
      target: targetToString(n.target),
      summary: n.failureSummary,
    })),
  );
}

export function formatFindings(findings: readonly A11yFinding[], context = 'element'): string {
  if (!findings.length) return `No accessibility violations in ${context}.`;
  const lines = findings.map((f, i) => {
    const wcag = f.criteria.length ? `WCAG ${f.criteria.join(', ')}` : 'best practice';
    return [
      `${i + 1}) [${f.rule}] ${f.help} (${wcag}${f.impact ? `, ${f.impact}` : ''})`,
      `   at: ${f.target}`,
      f.summary ? `   ${f.summary.replace(/\n/g, '\n   ')}` : '',
      f.helpUrl ? `   see: ${f.helpUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  });
  return `${findings.length} accessibility violation(s) in ${context}:\n${lines.join('\n')}`;
}
