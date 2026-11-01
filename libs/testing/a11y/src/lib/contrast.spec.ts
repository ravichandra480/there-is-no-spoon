import { describe, expect, it } from 'vitest';
import { contrastRatio, meetsContrast, parseColor } from './contrast.js';

describe('contrast', () => {
  it('computes the WCAG ratio for black on white', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#767676'), 10);
  });

  it('treats #767676 on white as AA (4.5) but not AAA (7)', () => {
    expect(meetsContrast('#767676', '#ffffff', 4.5)).toBe(true);
    expect(meetsContrast('#767676', '#ffffff', 7)).toBe(false);
  });

  it('parses rgb(), rgba(), and 8-digit hex', () => {
    expect(parseColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(parseColor('rgba(10, 20, 30, 0.5)').a).toBe(0.5);
    expect(parseColor('#ff000080').a).toBeCloseTo(0.5, 2);
  });

  it('blends translucent foregrounds over the background', () => {
    expect(contrastRatio('rgba(0, 0, 0, 0)', '#fff')).toBeCloseTo(1, 5);
  });

  it('rejects unsupported formats', () => {
    expect(() => parseColor('hsl(0 0% 0%)')).toThrow(/Unsupported/);
  });
});
