/**
 * Brand Color Utilities
 * HSL/RGB/Hex conversions, color harmony generation, WCAG contrast checking,
 * preset themes, color naming, and full theme generation.
 * Built in-house — no external dependencies.
 */

/** HSL color representation */
export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/** RGB color representation */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/** HSV color representation (used by SV pickers) */
export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100 (value/brightness)
}

/** Color harmony type */
export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'split-complementary'
  | 'monochromatic';

/** A complete brand color theme */
export interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
}

/** Preset theme with metadata */
export interface PresetTheme {
  id: string;
  name: string;
  description: string;
  mood: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted';
  colors: BrandTheme;
}

/** Color temperature info */
export type ColorTemperature = 'warm' | 'cool' | 'neutral';

// ─── Validation ──────────────────────────────────────────

/**
 * Check if a string is a valid hex color (#rgb or #rrggbb)
 */
export function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

/**
 * Normalize hex to lowercase 6-digit format. Returns null if invalid.
 */
export function normalizeHex(hex: string): string | null {
  if (!isValidHex(hex)) return null;
  let h = hex.toLowerCase();
  if (h.length === 4) {
    h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  }
  return h;
}

// ─── Conversions ─────────────────────────────────────────

/**
 * Convert hex color to RGB. Returns null if invalid.
 */
export function hexToRgb(hex: string): RGB | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return { r, g, b };
}

/**
 * Convert RGB to hex (#rrggbb)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex to HSV. Returns null if invalid.
 */
export function hexToHsv(hex: string): HSV | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  const s = max === 0 ? 0 : d / max;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(max * 100)
  };
}

/**
 * Convert HSV to hex (#rrggbb).
 */
export function hsvToHex(h: number, s: number, v: number): string {
  const hNorm = ((h % 360) + 360) % 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const vNorm = Math.max(0, Math.min(100, v)) / 100;

  const c = vNorm * sNorm;
  const hPrime = hNorm / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  const m = vNorm - c;

  let r: number, g: number, b: number;

  if (hPrime < 1) { r = c; g = x; b = 0; }
  else if (hPrime < 2) { r = x; g = c; b = 0; }
  else if (hPrime < 3) { r = 0; g = c; b = x; }
  else if (hPrime < 4) { r = 0; g = x; b = c; }
  else if (hPrime < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return rgbToHex(
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  );
}

/**
 * Convert hex to HSL. Returns null if invalid.
 */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL to hex (#rrggbb)
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  if (sNorm === 0) {
    const v = Math.round(lNorm * 255);
    return rgbToHex(v, v, v);
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;
  const hNorm = h / 360;

  const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

  return rgbToHex(r, g, b);
}

// ─── Contrast (WCAG 2.1) ────────────────────────────────

/**
 * Get the relative luminance of a hex color (WCAG formula)
 */
function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Calculate WCAG 2.1 contrast ratio between two colors.
 * Returns a value between 1 (identical) and 21 (black/white).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if two colors meet WCAG contrast requirements.
 * AA: 4.5:1 for normal text, AAA: 7:1 for normal text
 */
export function meetsContrast(fg: string, bg: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(fg, bg);
  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
}

// ─── Color Harmony ──────────────────────────────────────

/** Wraps hue to 0-360 range */
function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * Generate complementary color (opposite on the color wheel, +180°)
 */
export function generateComplementary(hex: string): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  return [hslToHex(wrapHue(hsl.h + 180), hsl.s, hsl.l)];
}

/**
 * Generate analogous colors (±30° on the color wheel)
 */
export function generateAnalogous(hex: string): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  return [
    hslToHex(wrapHue(hsl.h - 30), hsl.s, hsl.l),
    hslToHex(wrapHue(hsl.h + 30), hsl.s, hsl.l)
  ];
}

/**
 * Generate triadic colors (120° apart)
 */
export function generateTriadic(hex: string): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  return [
    hslToHex(wrapHue(hsl.h + 120), hsl.s, hsl.l),
    hslToHex(wrapHue(hsl.h + 240), hsl.s, hsl.l)
  ];
}

/**
 * Generate split-complementary colors (150° and 210° from base)
 */
export function generateSplitComplementary(hex: string): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  return [
    hslToHex(wrapHue(hsl.h + 150), hsl.s, hsl.l),
    hslToHex(wrapHue(hsl.h + 210), hsl.s, hsl.l)
  ];
}

/**
 * Generate monochromatic variations (same hue, different lightness)
 */
export function generateMonochromatic(hex: string, count: number = 4): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];

  const results: string[] = [];
  const step = 80 / (count + 1);
  for (let i = 1; i <= count; i++) {
    const l = Math.round(10 + step * i);
    results.push(hslToHex(hsl.h, hsl.s, l));
  }
  return results;
}

/**
 * Generate harmony colors for all types from a single base color.
 */
export function generateAllHarmonies(hex: string): Record<HarmonyType, string[]> {
  return {
    complementary: generateComplementary(hex),
    analogous: generateAnalogous(hex),
    triadic: generateTriadic(hex),
    tetradic: generateTetradic(hex),
    'split-complementary': generateSplitComplementary(hex),
    monochromatic: generateMonochromatic(hex, 4)
  };
}

// ─── Background/Surface Suggestions ─────────────────────

/**
 * Suggest background/surface colors based on a primary color.
 * Useful for auto-filling the extended brand color palette.
 */
export function suggestBackgroundColors(primaryHex: string): {
  light: string;
  lightSurface: string;
  dark: string;
  darkSurface: string;
} {
  const hsl = hexToHsl(primaryHex);
  if (!hsl) {
    return {
      light: '#f8f9fa',
      lightSurface: '#ffffff',
      dark: '#0f0f14',
      darkSurface: '#1a1a24'
    };
  }

  return {
    light: hslToHex(hsl.h, Math.max(5, Math.round(hsl.s * 0.15)), 96),
    lightSurface: hslToHex(hsl.h, Math.max(3, Math.round(hsl.s * 0.1)), 100),
    dark: hslToHex(hsl.h, Math.max(10, Math.round(hsl.s * 0.3)), 7),
    darkSurface: hslToHex(hsl.h, Math.max(8, Math.round(hsl.s * 0.25)), 12)
  };
}

/**
 * Suggest a full set of extended brand colors from primary, secondary, accent.
 * Useful for auto-generating the non-focal colors.
 */
export function suggestExtendedColors(primary: string, _secondary?: string, _accent?: string): {
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
} {
  const hsl = hexToHsl(primary);
  const h = hsl?.h ?? 0;
  const s = hsl?.s ?? 50;

  return {
    backgroundColor: hslToHex(h, Math.max(10, Math.round(s * 0.3)), 7),
    surfaceColor: hslToHex(h, Math.max(8, Math.round(s * 0.25)), 12),
    textColor: hslToHex(h, Math.max(5, Math.round(s * 0.1)), 92),
    textSecondaryColor: hslToHex(h, Math.max(5, Math.round(s * 0.15)), 60),
    borderColor: hslToHex(h, Math.max(8, Math.round(s * 0.2)), 22),
    successColor: '#22c55e',
    warningColor: '#fb923c',
    errorColor: '#f43f5e'
  };
}

// ─── Color Naming ───────────────────────────────────────

/**
 * Get an approximate human-readable color name from a hex value.
 */
export function getColorName(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return 'Unknown';

  const { h, s, l } = hsl;

  // Achromatic
  if (s < 8) {
    if (l < 10) return 'Black';
    if (l < 30) return 'Dark Gray';
    if (l < 55) return 'Gray';
    if (l < 80) return 'Light Gray';
    if (l < 96) return 'Off White';
    return 'White';
  }

  // Near-white pastels
  if (l > 90) {
    const hueNames = getHueFamily(h);
    return `Pale ${hueNames}`;
  }

  // Very dark shades
  if (l < 12) {
    const hueNames = getHueFamily(h);
    return `Dark ${hueNames}`;
  }

  const satPrefix = s < 30 ? 'Muted ' : s > 80 ? 'Vivid ' : '';
  const lightPrefix = l < 30 ? 'Dark ' : l > 70 ? 'Light ' : '';
  const hueFamily = getHueFamily(h);

  return `${satPrefix}${lightPrefix}${hueFamily}`.trim();
}

function getHueFamily(h: number): string {
  if (h < 15) return 'Red';
  if (h < 40) return 'Orange';
  if (h < 65) return 'Yellow';
  if (h < 80) return 'Lime';
  if (h < 150) return 'Green';
  if (h < 175) return 'Teal';
  if (h < 200) return 'Cyan';
  if (h < 250) return 'Blue';
  if (h < 280) return 'Indigo';
  if (h < 310) return 'Purple';
  if (h < 345) return 'Pink';
  return 'Red';
}

// ─── Color Temperature ──────────────────────────────────

/**
 * Determine if a color is warm, cool, or neutral.
 */
export function getColorTemperature(hex: string): ColorTemperature {
  const hsl = hexToHsl(hex);
  if (!hsl) return 'neutral';
  if (hsl.s < 10) return 'neutral';
  const { h } = hsl;
  // Warm: reds, oranges, yellows (330-60)
  if (h >= 330 || h <= 60) return 'warm';
  // Cool: greens, blues, purples (150-270)
  if (h >= 150 && h <= 270) return 'cool';
  return 'neutral';
}

// ─── Color Adjustment ───────────────────────────────────

/**
 * Lighten a hex color by a percentage (0-100).
 */
export function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  const newL = Math.min(100, hsl.l + amount);
  return hslToHex(hsl.h, hsl.s, Math.round(newL));
}

/**
 * Darken a hex color by a percentage (0-100).
 */
export function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  const newL = Math.max(0, hsl.l - amount);
  return hslToHex(hsl.h, hsl.s, Math.round(newL));
}

/**
 * Adjust saturation of a hex color. Positive = more saturated, negative = less.
 */
export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  const newS = Math.max(0, Math.min(100, hsl.s + amount));
  return hslToHex(hsl.h, Math.round(newS), hsl.l);
}

/**
 * Shift the hue of a hex color by degrees.
 */
export function shiftHue(hex: string, degrees: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  return hslToHex(wrapHue(hsl.h + degrees), hsl.s, hsl.l);
}

// ─── Perceived Brightness ───────────────────────────────

/**
 * Get perceived brightness of a color (0-255) using BT.709 luminance.
 * Useful for deciding whether text should be light or dark on a background.
 */
export function getPerceivedBrightness(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return Math.round(0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b);
}

/**
 * Returns true if dark text should be used on this color (i.e. it's a light background).
 */
export function shouldUseDarkText(hex: string): boolean {
  return getPerceivedBrightness(hex) > 140;
}

// ─── Tetradic Harmony ───────────────────────────────────

/**
 * Generate tetradic (rectangle) colors — 4 colors at 90° intervals.
 */
export function generateTetradic(hex: string): string[] {
  const hsl = hexToHsl(hex);
  if (!hsl) return [];
  return [
    hslToHex(wrapHue(hsl.h + 90), hsl.s, hsl.l),
    hslToHex(wrapHue(hsl.h + 180), hsl.s, hsl.l),
    hslToHex(wrapHue(hsl.h + 270), hsl.s, hsl.l)
  ];
}

// ─── Color Blending ─────────────────────────────────────

/**
 * Blend two hex colors by a given ratio (0 = color1, 1 = color2).
 */
export function blendColors(hex1: string, hex2: string, ratio: number): string {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return hex1;
  const t = Math.max(0, Math.min(1, ratio));
  return rgbToHex(
    Math.round(rgb1.r + (rgb2.r - rgb1.r) * t),
    Math.round(rgb1.g + (rgb2.g - rgb1.g) * t),
    Math.round(rgb1.b + (rgb2.b - rgb1.b) * t)
  );
}

// ─── Full Theme Generation ──────────────────────────────

/**
 * Generate a complete BrandTheme from a single primary color.
 * Creates a professionally harmonious dark theme.
 */
export function generateFullTheme(primaryHex: string): BrandTheme {
  const hsl = hexToHsl(primaryHex);
  const h = hsl?.h ?? 220;
  const s = hsl?.s ?? 70;

  // Secondary: triadic shift (120°), slightly desaturated
  const secH = wrapHue(h + 120);
  const secondary = hslToHex(secH, Math.round(s * 0.85), 55);

  // Accent: analogous shift (45°), vibrant
  const accH = wrapHue(h + 45);
  const accent = hslToHex(accH, Math.min(95, Math.round(s * 1.1)), 58);

  // Dark backgrounds tinted with primary hue
  const bgSat = Math.max(8, Math.round(s * 0.25));
  const bg = hslToHex(h, bgSat, 6);
  const surface = hslToHex(h, Math.max(6, Math.round(s * 0.2)), 11);

  // Text colors — very low saturation, primary-tinted
  const txtSat = Math.max(5, Math.round(s * 0.08));
  const txt = hslToHex(h, txtSat, 93);
  const txtSec = hslToHex(h, Math.max(5, Math.round(s * 0.12)), 58);

  // Border — subtle
  const border = hslToHex(h, Math.max(6, Math.round(s * 0.15)), 20);

  return {
    primaryColor: normalizeHex(primaryHex) || primaryHex,
    secondaryColor: secondary,
    accentColor: accent,
    backgroundColor: bg,
    surfaceColor: surface,
    textColor: txt,
    textSecondaryColor: txtSec,
    borderColor: border,
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    errorColor: '#ef4444'
  };
}

// ─── Contrast Matrix ────────────────────────────────────

export interface ContrastPair {
  fg: string;
  bg: string;
  fgLabel: string;
  bgLabel: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
}

/**
 * Build a contrast matrix checking all important text/background combinations.
 */
export function buildContrastMatrix(theme: Partial<BrandTheme>): ContrastPair[] {
  const pairs: ContrastPair[] = [];
  const fgColors: { key: keyof BrandTheme; label: string; }[] = [
    { key: 'textColor', label: 'Text' },
    { key: 'textSecondaryColor', label: 'Text Secondary' },
    { key: 'primaryColor', label: 'Primary' },
    { key: 'accentColor', label: 'Accent' }
  ];
  const bgColors: { key: keyof BrandTheme; label: string; }[] = [
    { key: 'backgroundColor', label: 'Background' },
    { key: 'surfaceColor', label: 'Surface' }
  ];

  for (const fg of fgColors) {
    for (const bg of bgColors) {
      const fgHex = theme[fg.key];
      const bgHex = theme[bg.key];
      if (fgHex && bgHex && isValidHex(fgHex) && isValidHex(bgHex)) {
        const ratio = getContrastRatio(fgHex, bgHex);
        pairs.push({
          fg: fgHex,
          bg: bgHex,
          fgLabel: fg.label,
          bgLabel: bg.label,
          ratio,
          passesAA: ratio >= 4.5,
          passesAAA: ratio >= 7
        });
      }
    }
  }
  return pairs;
}

// ─── Harmony Triple (Color Wheel) ────────────────────────

/** A triple of focal colors derived from a harmony pattern */
export interface HarmonyTriple {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Get the angular offsets from the base hue for a given harmony type.
 * Returns an array of degree offsets — first is always 0 (the primary).
 */
export function getHarmonyAngles(type: HarmonyType): number[] {
  switch (type) {
    case 'complementary':
      return [0, 180];
    case 'analogous':
      return [0, -30, 30];
    case 'triadic':
      return [0, 120, 240];
    case 'tetradic':
      return [0, 90, 180, 270];
    case 'split-complementary':
      return [0, 150, 210];
    case 'monochromatic':
      return [0, 0, 0];
  }
}

/**
 * Generate a primary/secondary/accent triple from a base hex and harmony type.
 * The primary is preserved as-is. Secondary and accent are derived from the pattern.
 */
export function generateHarmonyTriple(hex: string, type: HarmonyType): HarmonyTriple {
  const hsl = hexToHsl(hex);
  if (!hsl) return { primary: hex, secondary: hex, accent: hex };

  const angles = getHarmonyAngles(type);

  if (type === 'monochromatic') {
    // Same hue, varied lightness
    const secondary = hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 20));
    const accent = hslToHex(hsl.h, hsl.s, Math.min(90, hsl.l + 20));
    return { primary: hex, secondary, accent };
  }

  if (type === 'complementary') {
    // Two-point harmony: primary + complement, accent is a blend midpoint at 90°
    const secondary = hslToHex(wrapHue(hsl.h + 180), hsl.s, hsl.l);
    const accent = hslToHex(wrapHue(hsl.h + 90), Math.round(hsl.s * 0.8), hsl.l);
    return { primary: hex, secondary, accent };
  }

  if (type === 'tetradic') {
    // Four-point harmony: pick positions 1 and 2 (90° and 180°) as secondary/accent
    const secondary = hslToHex(wrapHue(hsl.h + angles[1]), hsl.s, hsl.l);
    const accent = hslToHex(wrapHue(hsl.h + angles[2]), hsl.s, hsl.l);
    return { primary: hex, secondary, accent };
  }

  // 3-point harmonies: triadic, analogous, split-complementary
  const secondary = hslToHex(wrapHue(hsl.h + angles[1]), hsl.s, hsl.l);
  const accent = hslToHex(wrapHue(hsl.h + angles[2]), hsl.s, hsl.l);
  return { primary: hex, secondary, accent };
}

/**
 * Rotate all three harmony colors by a given number of degrees.
 * Preserves the relative pattern — just shifts the base hue.
 */
export function rotateHarmony(triple: HarmonyTriple, degrees: number): HarmonyTriple {
  function rotate(hexColor: string): string {
    const h = hexToHsl(hexColor);
    if (!h) return hexColor;
    return hslToHex(wrapHue(h.h + degrees), h.s, h.l);
  }
  return {
    primary: rotate(triple.primary),
    secondary: rotate(triple.secondary),
    accent: rotate(triple.accent)
  };
}

// ─── Preset Themes ──────────────────────────────────────

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Professional and trustworthy',
    mood: 'cool',
    colors: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      accentColor: '#06b6d4',
      backgroundColor: '#0a0f1a',
      surfaceColor: '#131a2b',
      textColor: '#e8ecf1',
      textSecondaryColor: '#8896ab',
      borderColor: '#1e2d45',
      successColor: '#22c55e',
      warningColor: '#f59e0b',
      errorColor: '#ef4444'
    }
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Bold and energetic',
    mood: 'warm',
    colors: {
      primaryColor: '#f97316',
      secondaryColor: '#ec4899',
      accentColor: '#eab308',
      backgroundColor: '#120c08',
      surfaceColor: '#1c1410',
      textColor: '#f5ede6',
      textSecondaryColor: '#a89283',
      borderColor: '#2c1f18',
      successColor: '#22c55e',
      warningColor: '#f59e0b',
      errorColor: '#ef4444'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural and calming',
    mood: 'cool',
    colors: {
      primaryColor: '#10b981',
      secondaryColor: '#06b6d4',
      accentColor: '#84cc16',
      backgroundColor: '#070f0b',
      surfaceColor: '#0f1a14',
      textColor: '#e6f0eb',
      textSecondaryColor: '#7da390',
      borderColor: '#162a1f',
      successColor: '#22c55e',
      warningColor: '#f59e0b',
      errorColor: '#ef4444'
    }
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Creative and luxurious',
    mood: 'cool',
    colors: {
      primaryColor: '#a855f7',
      secondaryColor: '#ec4899',
      accentColor: '#6366f1',
      backgroundColor: '#0d0816',
      surfaceColor: '#160f24',
      textColor: '#ece4f5',
      textSecondaryColor: '#9b87b5',
      borderColor: '#241a38',
      successColor: '#22c55e',
      warningColor: '#f59e0b',
      errorColor: '#ef4444'
    }
  },
  {
    id: 'slate-minimal',
    name: 'Slate Minimal',
    description: 'Clean and sophisticated',
    mood: 'neutral',
    colors: {
      primaryColor: '#64748b',
      secondaryColor: '#475569',
      accentColor: '#0ea5e9',
      backgroundColor: '#0c0c0e',
      surfaceColor: '#15161a',
      textColor: '#e2e4e9',
      textSecondaryColor: '#8a8f9a',
      borderColor: '#23252b',
      successColor: '#22c55e',
      warningColor: '#f59e0b',
      errorColor: '#ef4444'
    }
  },
  {
    id: 'coral-sunset',
    name: 'Coral Sunset',
    description: 'Friendly and approachable',
    mood: 'warm',
    colors: {
      primaryColor: '#fb7185',
      secondaryColor: '#f97316',
      accentColor: '#fbbf24',
      backgroundColor: '#130a0c',
      surfaceColor: '#1d1214',
      textColor: '#f5e9ec',
      textSecondaryColor: '#b08a91',
      borderColor: '#301a1f',
      successColor: '#22c55e',
      warningColor: '#f59e0b',
      errorColor: '#ef4444'
    }
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    description: 'Modern and fresh',
    mood: 'cool',
    colors: {
      primaryColor: '#14b8a6',
      secondaryColor: '#3b82f6',
      accentColor: '#f0abfc',
      backgroundColor: '#060f0e',
      surfaceColor: '#0e1918',
      textColor: '#e4f0ef',
      textSecondaryColor: '#7ba8a0',
      borderColor: '#162c29',
      successColor: '#22c55e',
      warningColor: '#f59e0b',
      errorColor: '#ef4444'
    }
  },
  {
    id: 'neon-night',
    name: 'Neon Night',
    description: 'Vibrant and dynamic',
    mood: 'vibrant',
    colors: {
      primaryColor: '#22d3ee',
      secondaryColor: '#a78bfa',
      accentColor: '#f472b6',
      backgroundColor: '#050a10',
      surfaceColor: '#0c1420',
      textColor: '#ecf1f8',
      textSecondaryColor: '#7b9ab8',
      borderColor: '#142030',
      successColor: '#34d399',
      warningColor: '#fbbf24',
      errorColor: '#f87171'
    }
  }
];
