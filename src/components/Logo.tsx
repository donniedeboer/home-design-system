/**
 * App mark: an accent tile with a generic "module" glyph — shared by the nav brand and
 * (as app/icon.svg) the favicon, so the two always match. Uses theme tokens so it
 * re-skins with the per-app accent. PER APP: redraw the inner glyph + recolor icon.svg.
 */
export default function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Home App">
      <rect width="24" height="24" rx="6" fill="var(--color-accent)" />
      <rect
        x="6" y="6" width="12" height="12" rx="2.5"
        fill="none" stroke="var(--color-accent-fg)" strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2" fill="var(--color-accent-fg)" />
    </svg>
  );
}
