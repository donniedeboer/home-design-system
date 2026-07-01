/**
 * Machine-readable accent registry — one source for favicons, the Logo tile hex,
 * icon.svg generation, and the copy-into-@theme accent blocks. "Accent = signal,
 * not paint": these 7 vars re-skin ONLY chrome, never data hues.
 *
 * WCAG note: `accentBtn`/`accentBtnHover` are the FILL BEHIND PRIMARY-BUTTON TEXT
 * and `accentFg` is the ink on it — every (accentFg, accentBtn) and
 * (accentFg, accentBtnHover) pair clears AA 4.5:1 (verified). For indigo/amethyst
 * the button fill is darkened from the brand `accent` so white ink passes; the
 * dark-ink accents (emerald/teal/sky/amber) use the brand color as the fill.
 * `accent`/`accentHover` stay the brand SIGNAL color (active-nav pill via
 * subtle+text, links, focus ring) where no large-fill+ink contrast is required.
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
  /** contrast-safe primary-button fill (may differ from `accent`) */
  accentBtn: string;
  accentBtnHover: string;
  /** ink on the button fill — clears AA 4.5:1 on accentBtn AND accentBtnHover */
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

export const accents: Record<AccentName, Accent> = {
  omni: {
    accent: '#6366f1',
    accentHover: '#818cf8',
    accentBtn: '#4f46e5',
    accentBtnHover: '#5b52ea',
    accentFg: '#ffffff',
    accentSubtle: '#1e1b4b',
    accentMuted: '#312e81',
    accentText: '#a5b4fc',
    ring: '#818cf8',
  },
  persona: {
    accent: '#8b5cf6',
    accentHover: '#a78bfa',
    accentBtn: '#7048d8',
    accentBtnHover: '#7c4ff0',
    accentFg: '#ffffff',
    accentSubtle: '#2e1065',
    accentMuted: '#5b21b6',
    accentText: '#c4b5fd',
    ring: '#a78bfa',
  },
  pulse: {
    accent: '#10b981',
    accentHover: '#34d399',
    accentBtn: '#10b981',
    accentBtnHover: '#34d399',
    accentFg: '#04221a',
    accentSubtle: '#052e25',
    accentMuted: '#064e3b',
    accentText: '#6ee7b7',
    ring: '#34d399',
  },
  scout: {
    accent: '#14b8a6',
    accentHover: '#2dd4bf',
    accentBtn: '#14b8a6',
    accentBtnHover: '#2dd4bf',
    accentFg: '#04211d',
    accentSubtle: '#032725',
    accentMuted: '#0f766e',
    accentText: '#5eead4',
    ring: '#2dd4bf',
  },
  golinks: {
    accent: '#0ea5e9',
    accentHover: '#38bdf8',
    accentBtn: '#0ea5e9',
    accentBtnHover: '#38bdf8',
    accentFg: '#03192b',
    accentSubtle: '#0c2a3f',
    accentMuted: '#075985',
    accentText: '#7dd3fc',
    ring: '#38bdf8',
  },
  devbot: {
    accent: '#f59e0b',
    accentHover: '#fbbf24',
    accentBtn: '#f59e0b',
    accentBtnHover: '#fbbf24',
    accentFg: '#2a1a02',
    accentSubtle: '#2a1a02',
    accentMuted: '#78500b',
    accentText: '#fcd34d',
    ring: '#fbbf24',
  },
  neutral: {
    accent: '#64748b',
    accentHover: '#94a3b8',
    accentBtn: '#64748b',
    accentBtnHover: '#94a3b8',
    accentFg: '#0b0f1a',
    accentSubtle: '#1e293b',
    accentMuted: '#334155',
    accentText: '#cbd5e1',
    ring: '#94a3b8',
  },
};

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
