import { describe, expect, it } from 'vitest';
import { formatFindings, wcagCriteria } from './format.js';

describe('format', () => {
  it('maps axe tags to WCAG criteria', () => {
    expect(wcagCriteria(['wcag2aaa', 'wcag146', 'wcag1410', 'cat.color'])).toEqual(['1.4.6', '1.4.10']);
  });

  it('reports rule id, node and criterion', () => {
    const msg = formatFindings(
      [{ rule: 'button-name', criteria: ['4.1.2'], help: 'Buttons must have discernible text', target: 'button.x', impact: 'critical' }],
      'fixture',
    );
    expect(msg).toContain('[button-name]');
    expect(msg).toContain('WCAG 4.1.2');
    expect(msg).toContain('at: button.x');
  });
});
