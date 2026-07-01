/**
 * Machine-readable accent registry — one source for favicons, the Logo tile hex,
 * icon.svg generation, and the copy-into-@theme accent blocks. "Accent = signal,
 * not paint": these 9 vars re-skin ONLY chrome, never data hues.
 *
 * ── The contrast rule (this file's whole reason to exist) ────────────────────
 * `accent`/`accentHover` are the brand SIGNAL color — active-nav pill (via
 * subtle+text), links, live cursor, focus ring. No large fill sits behind text
 * there, so no AA floor applies.
 *
 * `accentBtn`/`accentBtnHover` ARE the fill behind primary-button labels (~13px /
 * 500 — normal text, so the bar is WCAG AA 4.5:1, not the 3:1 large-text let-out),
 * and `accentFg` is the ink on them. Those three are NOT hand-set — they are
 * DERIVED from the brand `accent` by `deriveButton()`:
 *
 *   • Ink polarity follows the seed's luminance, not raw max-contrast: a deep
 *     jewel-tone fill (Lseed < POLARITY_LUM) wears WHITE ink; a bright fill wears
 *     a deep tint of its own hue. (Raw max-contrast would put black on indigo —
 *     it scores a hair higher — which is not the brand intent.)
 *   • White-ink accents: the brand color is too light for white to clear 4.5, so
 *     the button fill is DARKENED (in HSL, hue/sat preserved) until it hits
 *     BTN_TARGET at rest and HOVER_TARGET on hover — both comfortably past 4.5.
 *   • Dark-ink accents: the brand color already clears 4.5 with room, so the fill
 *     stays the brand color and the ink is the derived deep tint.
 *
 * Every (accentFg, accentBtn) and (accentFg, accentBtnHover) pair is therefore
 * guaranteed ≥ AA_NORMAL. The three decorative tints (subtle/muted/text) live on
 * the near-black canvas, not on the fill, so they stay curated per app.
 *
 * Verify + regenerate the CSS mirrors:
 *   node --experimental-strip-types scripts/check-accents.ts
 */

export type AccentName =
  | 'omni'
  | 'persona'
  | 'pulse'
  | 'scout'
  | 'golinks'
  | 'devbot'
  | 'neutral';

export interface Accent {
  /** brand signal color: active place, links, live cursor, focus ring */
  accent: string;
  accentHover: string;
  /** contrast-safe primary-button fill (derived; may differ from `accent`) */
  accentBtn: string;
  accentBtnHover: string;
  /** ink on the button fill — derived; clears AA 4.5:1 on accentBtn AND accentBtnHover */
  accentFg: string;
  /** faint tint — active-nav pill / chip-accent bg */
  accentSubtle: string;
  /** chip fill / text-selection bg */
  accentMuted: string;
  /** accent-colored text / links / active-nav label on dark */
  accentText: string;
  /** focus ring */
  ring: string;
}

/* ── WCAG contrast rule ─────────────────────────────────────────────────────── */

/** AA for normal-size text (primary-button labels are ~13px/500 → this, not 3:1). */
export const AA_NORMAL = 4.5;
/** Seeds darker than this wear white ink; brighter seeds wear a deep-tint ink. */
const POLARITY_LUM = 0.25;
/** Resting button fill : ink target (headroom above AA). */
const BTN_TARGET = 6.0;
/** Hover button fill : ink target — lighter than rest, still well past AA. */
const HOVER_TARGET = 5.0;

type Rgb = { r: number; g: number; b: number };
const WHITE = '#ffffff';

function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '').trim();
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const to = (c: number) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** WCAG 2.x relative luminance (sRGB, D65). */
function relLuminance({ r, g, b }: Rgb): number {
  const lin = (c8: number) => {
    const c = c8 / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two hex colors (order-independent), 1..21. */
export function contrast(a: string, b: string): number {
  const la = relLuminance(hexToRgb(a));
  const lb = relLuminance(hexToRgb(b));
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Round a ratio for display (4.5, not 4.4999). */
export const ratio = (n: number): number => Math.round(n * 100) / 100;

/* ── HSL (used to darken a fill hue-stably + mint the deep-tint ink) ─────────── */

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  h = (((h % 360) + 360) % 360) / 360;
  if (s === 0) { const v = l * 255; return rgbToHex({ r: v, g: v, b: v }); }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return rgbToHex({ r: hue(h + 1 / 3) * 255, g: hue(h) * 255, b: hue(h - 1 / 3) * 255 });
}

/** A deep, saturated tint of the hue — the dark-ink candidate (~#04221a style). */
function deepInk(seedHex: string): string {
  const { h, s } = rgbToHsl(hexToRgb(seedHex));
  return hslToHex(h, Math.max(0.45, Math.min(0.95, s)), 0.09);
}

/**
 * Darken `seedHex` in HSL (hue + saturation held) to the LIGHTEST shade whose
 * white-ink contrast is still ≥ target. Monotonic in L → binary search.
 */
function darkenForWhite(seedHex: string, target: number): string {
  const { h, s, l } = rgbToHsl(hexToRgb(seedHex));
  if (contrast(WHITE, seedHex) >= target) return seedHex; // already dark enough
  let lo = 0, hi = l;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (contrast(WHITE, hslToHex(h, s, mid)) >= target) lo = mid; // can allow lighter
    else hi = mid;
  }
  return hslToHex(h, s, lo);
}

/* ── the derivation: brand seed → contrast-safe button trio ──────────────────── */

type Seed = Pick<Accent, 'accent' | 'accentHover' | 'accentSubtle' | 'accentMuted' | 'accentText' | 'ring'>;

function deriveButton(seed: Seed): Pick<Accent, 'accentBtn' | 'accentBtnHover' | 'accentFg'> {
  const light = relLuminance(hexToRgb(seed.accent)) < POLARITY_LUM;
  if (!light) {
    // Bright fill → deep-tint ink on the brand color; no darkening needed.
    return { accentBtn: seed.accent, accentBtnHover: seed.accentHover, accentFg: deepInk(seed.accent) };
  }
  // Deep jewel tone → white ink; darken the fill until white clears the targets.
  return {
    accentBtn: darkenForWhite(seed.accent, BTN_TARGET),
    accentBtnHover: darkenForWhite(seed.accent, HOVER_TARGET),
    accentFg: WHITE,
  };
}

/* ── per-app brand seeds (the ONLY hand-authored colors) ─────────────────────── */
/* accent/accentHover + the three decorative tints + ring are brand-curated; the
   button trio (accentBtn/-Hover/-fg) is DERIVED from `accent` by deriveButton(). */

const SEEDS: Record<AccentName, Seed> = {
  omni:    { accent: '#6366f1', accentHover: '#818cf8', accentSubtle: '#1e1b4b', accentMuted: '#312e81', accentText: '#a5b4fc', ring: '#818cf8' },
  // Persona = ORCHID/magenta (was amethyst #8b5cf6). Deep jewel tone → white ink; button
  // fill DARKENS from the brand so white clears AA (white on brand #c026d3 = 4.71 — passes
  // AA but the trio targets 6.0/5.0 headroom, so the fill drops to #a521b6/#b925cc). All
  // ratios recomputed with real WCAG math (scripts/check-accents.ts recomputes independently):
  //   accent          #c026d3  seed (nav pill / ring / links / logo tile); white-ink polarity (lum 0.173 < 0.25)
  //   accentBtn       #a521b6  white ×btn        = 6.01  (DERIVED, darkened for white ink)
  //   accentBtnHover  #b925cc  white ×btn-hover  = 5.00  (DERIVED)
  //   accentFg        #ffffff
  //   accentText      #f0abfc  ×surface-0 8.81 · ×surface-1 9.78 · ×surface-2 7.91 · ×surface-3 7.06 (all ≥4.5)
  //   accentSubtle    #3b0764  accent-text ×subtle = 8.52   accentMuted #86198f  accent-text ×muted = 4.68
  //   ring            #d946ef  ×surface-0 4.48 · -1 4.98 · -2 4.03 · -3 3.59 (all ≥3:1)
  persona: { accent: '#c026d3', accentHover: '#d946ef', accentSubtle: '#3b0764', accentMuted: '#86198f', accentText: '#f0abfc', ring: '#d946ef' },
  pulse:   { accent: '#10b981', accentHover: '#34d399', accentSubtle: '#052e25', accentMuted: '#064e3b', accentText: '#6ee7b7', ring: '#34d399' },
  scout:   { accent: '#14b8a6', accentHover: '#2dd4bf', accentSubtle: '#032725', accentMuted: '#0f766e', accentText: '#5eead4', ring: '#2dd4bf' },
  golinks: { accent: '#0ea5e9', accentHover: '#38bdf8', accentSubtle: '#0c2a3f', accentMuted: '#075985', accentText: '#7dd3fc', ring: '#38bdf8' },
  devbot:  { accent: '#f59e0b', accentHover: '#fbbf24', accentSubtle: '#451a03', accentMuted: '#78350f', accentText: '#fcd34d', ring: '#fbbf24' },
  neutral: { accent: '#64748b', accentHover: '#94a3b8', accentSubtle: '#1e293b', accentMuted: '#334155', accentText: '#cbd5e1', ring: '#94a3b8' },
};

function buildAccent(seed: Seed): Accent {
  return { ...seed, ...deriveButton(seed) };
}

export const accents: Record<AccentName, Accent> = Object.fromEntries(
  (Object.keys(SEEDS) as AccentName[]).map((k) => [k, buildAccent(SEEDS[k])]),
) as Record<AccentName, Accent>;

/** CSS custom-property names, in the order they appear in an accent @theme block. */
export const accentCssVars: Record<keyof Accent, string> = {
  accent: '--color-accent',
  accentHover: '--color-accent-hover',
  accentBtn: '--color-accent-btn',
  accentBtnHover: '--color-accent-btn-hover',
  accentFg: '--color-accent-fg',
  accentSubtle: '--color-accent-subtle',
  accentMuted: '--color-accent-muted',
  accentText: '--color-accent-text',
  ring: '--color-ring',
};

/**
 * Render an accent as a `@theme { … }` block an app pastes into its globals.css
 * (right after `@import "home-design-system/theme.css";`). Build-time; no runtime
 * data-app swapping.
 */
export function accentThemeBlock(name: AccentName): string {
  const a = accents[name];
  const lines = (Object.keys(accentCssVars) as (keyof Accent)[]).map(
    (k) => `  ${accentCssVars[k]}: ${a[k]};`,
  );
  return `@theme {\n${lines.join('\n')}\n}`;
}

/** Whether a resolved accent uses white ink (deep jewel tone) vs a deep-tint ink. */
export const isWhiteInk = (a: Accent): boolean => a.accentFg.toLowerCase() === WHITE;

/**
 * The AA audit for every accent — the button ink against BOTH the resting fill
 * and the hover fill (both are text backgrounds). Used by the check script and
 * anything that wants to assert the guarantee.
 */
export function accentAudit(): Array<{
  name: AccentName; ink: 'white' | 'deep-tint';
  fgOnBtn: number; fgOnBtnHover: number; pass: boolean;
}> {
  return (Object.keys(accents) as AccentName[]).map((name) => {
    const a = accents[name];
    const fgOnBtn = ratio(contrast(a.accentFg, a.accentBtn));
    const fgOnBtnHover = ratio(contrast(a.accentFg, a.accentBtnHover));
    return {
      name,
      ink: isWhiteInk(a) ? 'white' : 'deep-tint',
      fgOnBtn,
      fgOnBtnHover,
      pass: fgOnBtn >= AA_NORMAL && fgOnBtnHover >= AA_NORMAL,
    };
  });
}
