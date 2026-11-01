/** WCAG 2.x contrast utilities (relative luminance per WCAG definition). */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i;

export function parseColor(input: string): Rgba {
  const value = input.trim().toLowerCase();
  if (value === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const hex = HEX.exec(value);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  const rgb = RGB.exec(value);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: alpha };
  }
  throw new Error(`Unsupported color format: "${input}"`);
}

/** Composites a (possibly translucent) foreground over an opaque background. */
export function blend(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

export function relativeLuminance({ r, g, b }: Rgba): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two colors (1–21). Translucent foregrounds are blended over the background. */
export function contrastRatio(foreground: string | Rgba, background: string | Rgba): number {
  const bgRaw = typeof background === 'string' ? parseColor(background) : background;
  const bg = bgRaw.a < 1 ? blend(bgRaw, { r: 255, g: 255, b: 255, a: 1 }) : bgRaw;
  const fgRaw = typeof foreground === 'string' ? parseColor(foreground) : foreground;
  const fg = fgRaw.a < 1 ? blend(fgRaw, bg) : fgRaw;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function meetsContrast(foreground: string, background: string, minimum: number): boolean {
  // Round down to 2 decimals so 6.999 never passes as 7.
  return Math.floor(contrastRatio(foreground, background) * 100) / 100 >= minimum;
}
