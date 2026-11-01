import { describe, expect, it } from 'vitest';
import { excludeRule, targetToString, type RuleExclusion } from './exclusions.js';

const valid: RuleExclusion = {
  rule: 'color-contrast-enhanced',
  selector: '.logo',
  reason: 'Logotypes are exempt under WCAG 1.4.6',
  issue: '#42',
};

describe('excludeRule', () => {
  it('accepts a justified, tracked, targeted exclusion', () => {
    expect(excludeRule(valid)).toEqual(valid);
  });

  it('throws when reason is missing', () => {
    expect(() => excludeRule({ ...valid, reason: '' })).toThrow(/reason/);
  });

  it('throws when issue is missing or not a tracking reference', () => {
    expect(() => excludeRule({ ...valid, issue: '' })).toThrow(/issue/);
    expect(() => excludeRule({ ...valid, issue: 'later' })).toThrow(/issue/);
  });

  it('rejects global selectors', () => {
    expect(() => excludeRule({ ...valid, selector: '*' })).toThrow(/selector/);
  });

  it('accepts Jira keys and https URLs as issue references', () => {
    expect(() => excludeRule({ ...valid, issue: 'A11Y-12' })).not.toThrow();
    expect(() => excludeRule({ ...valid, issue: 'https://github.com/o/r/issues/1' })).not.toThrow();
  });

  it('flattens nested shadow DOM targets', () => {
    expect(targetToString([['tins-x', '.logo']])).toBe('tins-x >>> .logo');
  });
});
