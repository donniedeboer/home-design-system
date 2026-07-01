import type { ReactNode } from 'react';

/**
 * App mark: an accent tile (rx=6 on a 24-grid, fill=var(--color-accent)) holding
 * one hairline glyph in var(--color-accent-fg). Same tile, different mark — so all
 * apps read as one household. The glyph re-skins with the per-app accent via tokens.
 *
 * Pass `glyph` as an AppGlyphName (built-in mark) or your own <path>/<g> nodes. The
 * favicon (icon.svg) is generated from the SAME glyph source + the app's accent hex
 * (accents.ts) so nav-brand ↔ favicon never drift.
 */
export type AppGlyphName =
  | 'omni'
  | 'persona'
  | 'pulse'
  | 'scout'
  | 'golinks'
  | 'devbot'
  | 'module';

const stroke = {
  fill: 'none',
  stroke: 'var(--color-accent-fg)',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Built-in glyphs — one geometry, 24×24 grid, stroke-width 2, currentColor=accent-fg. */
export const glyphs: Record<AppGlyphName, ReactNode> = {
  // Orchestrator hub — Tabler "topology-star-3": seven nodes + spokes. The suite master mark.
  omni: (
    <g>
      <path d="M10 19a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" {...stroke} />
      <path d="M18 5a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" {...stroke} />
      <path d="M10 5a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" {...stroke} />
      <path d="M6 12a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" {...stroke} />
      <path d="M18 19a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" {...stroke} />
      <path d="M14 12a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" {...stroke} />
      <path d="M22 12a2 2 0 1 0 -4 0a2 2 0 0 0 4 0" {...stroke} />
      <path d="M6 12h4" {...stroke} />
      <path d="M14 12h4" {...stroke} />
      <path d="M15 7l-2 3" {...stroke} />
      <path d="M9 7l2 3" {...stroke} />
      <path d="M11 14l-2 3" {...stroke} />
      <path d="M13 14l2 3" {...stroke} />
    </g>
  ),
  // Open book / layered memory — Tabler "book-2".
  persona: (
    <g>
      <path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12" {...stroke} />
      <path d="M19 16h-12a2 2 0 0 0 -2 2" {...stroke} />
      <path d="M9 8h6" {...stroke} />
    </g>
  ),
  // Pulse / heartbeat — Tabler "heartbeat".
  pulse: (
    <g>
      <path d="M19.5 13.572l-7.5 7.428l-2.896 -2.868m-6.117 -8.104a5 5 0 0 1 9.013 -3.022a5 5 0 1 1 7.5 6.572" {...stroke} />
      <path d="M3 13h2l2 3l2 -6l1 3h3" {...stroke} />
    </g>
  ),
  // Compass (Tabler "compass") — outer ring + needle diamond + cardinal ticks.
  // General-purpose research/discovery; the old house-search glyph is retired.
  scout: (
    <g>
      <path d="M8 16l2 -6l6 -2l-2 6l-6 2" {...stroke} />
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" {...stroke} />
      <path d="M12 3l0 2" {...stroke} />
      <path d="M12 19l0 2" {...stroke} />
      <path d="M3 12l2 0" {...stroke} />
      <path d="M19 12l2 0" {...stroke} />
    </g>
  ),
  // Link (Tabler "link") — two diagonal capsule half-links overlapping at center.
  golinks: (
    <g>
      <path d="M9 15l6 -6" {...stroke} />
      <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" {...stroke} />
      <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" {...stroke} />
    </g>
  ),
  // Robot head — Tabler "robot": rounded head, antenna, body, dot eyes.
  devbot: (
    <g>
      <path d="M6 6a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2l0 -4" {...stroke} />
      <path d="M12 2v2" {...stroke} />
      <path d="M9 12v9" {...stroke} />
      <path d="M15 12v9" {...stroke} />
      <path d="M5 16l4 -2" {...stroke} />
      <path d="M15 14l4 2" {...stroke} />
      <path d="M9 18h6" {...stroke} />
      <path d="M10 8v.01" {...stroke} />
      <path d="M14 8v.01" {...stroke} />
    </g>
  ),
  // Generic module — hollow rounded square + center dot (default/unassigned).
  module: (
    <g>
      <rect x="6" y="6" width="12" height="12" rx="2.5" {...stroke} />
      <circle cx="12" cy="12" r="2" fill="var(--color-accent-fg)" />
    </g>
  ),
};

export default function Logo({
  className = 'h-6 w-6',
  glyph = 'module',
}: {
  className?: string;
  glyph?: AppGlyphName | ReactNode;
}) {
  const inner = typeof glyph === 'string' ? glyphs[glyph as AppGlyphName] ?? glyphs.module : glyph;
  // Inset the 24-grid glyph to ~72% so every mark sits with consistent padding
  // inside its accent tile (translate = (24 - 24*0.72)/2). One ratio, all apps.
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="App icon">
      <rect width="24" height="24" rx="6" fill="var(--color-accent)" />
      <g transform="translate(3.36 3.36) scale(0.72)">{inner}</g>
    </svg>
  );
}
