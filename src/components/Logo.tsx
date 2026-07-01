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
  // Orchestrator hub — center dot + N/E/S/W nodes with spokes. The suite master mark.
  omni: (
    <g>
      <line x1="12" y1="12" x2="12" y2="4" {...stroke} />
      <line x1="12" y1="12" x2="19" y2="12" {...stroke} />
      <line x1="12" y1="12" x2="12" y2="20" {...stroke} />
      <line x1="12" y1="12" x2="5" y2="12" {...stroke} />
      <circle cx="12" cy="12" r="2.4" fill="var(--color-accent-fg)" />
      <circle cx="12" cy="4" r="1.6" fill="var(--color-accent-fg)" />
      <circle cx="19" cy="12" r="1.6" fill="var(--color-accent-fg)" />
      <circle cx="12" cy="20" r="1.6" fill="var(--color-accent-fg)" />
      <circle cx="5" cy="12" r="1.6" fill="var(--color-accent-fg)" />
    </g>
  ),
  // Open book / layered memory — two facing leaves + spine.
  persona: (
    <g>
      <path d="M12 6c-1.6-1.3-4-1.8-7-1.5v12c3-.3 5.4.2 7 1.5 1.6-1.3 4-1.8 7-1.5v-12c-3-.3-5.4.2-7 1.5z" {...stroke} />
      <path d="M12 6v12" {...stroke} />
    </g>
  ),
  // Pulse / heartbeat tick — flat, up-spike, down-spike, flat.
  pulse: <path d="M4 12h4l2-5 3 10 2-5h4" {...stroke} />,
  // Compass (Tabler "compass") — outer ring + a two-tone needle diamond + hub.
  // General-purpose research/discovery; the old house-search glyph is retired.
  scout: (
    <g>
      <circle cx="12" cy="12" r="8.5" {...stroke} />
      <path d="M15.5 8.5 10.5 10.5 8.5 15.5 13.5 13.5z" {...stroke} />
      <circle cx="12" cy="12" r="1" fill="var(--color-accent-fg)" />
    </g>
  ),
  // Link (Tabler "link") — two diagonal capsule half-links overlapping at center.
  golinks: (
    <g>
      <path d="M9 15l6-6" {...stroke} />
      <path d="M11 6.5l1.5-1.5a3.5 3.5 0 0 1 5 5L16 11.5" {...stroke} />
      <path d="M13 17.5l-1.5 1.5a3.5 3.5 0 0 1-5-5L8 12.5" {...stroke} />
    </g>
  ),
  // Robot head — rounded head, two dot eyes, antenna.
  devbot: (
    <g>
      <line x1="12" y1="4" x2="12" y2="7" {...stroke} />
      <rect x="5" y="7" width="14" height="12" rx="3" {...stroke} />
      <circle cx="9.5" cy="13" r="1.3" fill="var(--color-accent-fg)" />
      <circle cx="14.5" cy="13" r="1.3" fill="var(--color-accent-fg)" />
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
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="App icon">
      <rect width="24" height="24" rx="6" fill="var(--color-accent)" />
      {inner}
    </svg>
  );
}
