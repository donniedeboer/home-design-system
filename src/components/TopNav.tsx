'use client';
import type { ReactNode } from 'react';
import Logo, { type AppGlyphName } from './Logo';
import { useRouter, isActivePath, type RouterAdapter } from '../router/RouterProvider';

export type NavLink = { href: string; label: string; icon?: ReactNode };

function initials(name: string): string {
  const p = name.trim().split(/[\s·]+/).filter(Boolean);
  const s = ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  return s || '?';
}

/**
 * The suite's identity indicator — READ-ONLY (authenticated identity, never a picker).
 * Avatar initials in the accent tint + the person's name. Same treatment in every app.
 */
export function IdentityChip({ name, detail }: { name: string; detail?: string }) {
  if (!name) return null;
  return (
    <span
      className="flex items-center gap-2"
      title={detail ? `${name} · ${detail}` : `Signed in as ${name}`}
    >
      <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-accent-subtle text-[11px] font-semibold text-accent-text">
        {initials(name)}
      </span>
      <span className="hidden text-xs text-fg-muted md:inline">
        {name}
        {detail && <span className="text-fg-subtle"> · {detail}</span>}
      </span>
    </span>
  );
}

/**
 * THE shared top nav for every home-platform app — one component, one layout, so the
 * apps read as a suite. Fixed height (h-14), one type scale. Left: accent Logo tile +
 * app name over a muted subtitle (the app's tagline). Middle: optional nav links (tabs)
 * with the accent active-pill — the ONLY accent in the chrome. Right: optional app
 * `actions`, then the uniform read-only `identity` indicator (NO profile picker).
 *
 * Router-agnostic: reads a RouterAdapter from the `router` prop OR RouterContext.
 */
export default function TopNav({
  appName,
  subtitle,
  links = [],
  actions,
  identity,
  glyph = 'module',
  router,
}: {
  appName: string;
  /** the app's tagline shown under the name (e.g. "your family assistant"). */
  subtitle?: string;
  links?: NavLink[];
  /** app-specific right-side actions (share, settings, model pill) — sit before identity. */
  actions?: ReactNode;
  /** the authenticated identity: a display name (renders the standard chip) or a node. */
  identity?: string | ReactNode;
  /** @deprecated ignored — the nav bar is ALWAYS full-width (logo left, identity right)
   * so it looks the same across the suite regardless of the content max-width. */
  maxWidth?: '3xl' | '5xl' | 'full';
  glyph?: AppGlyphName;
  router?: RouterAdapter;
}) {
  const ctxRouter = useRouter();
  const { Link, activePath } = router ?? ctxRouter;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-0/85 backdrop-blur-md">
      <nav className="flex h-14 w-full items-center gap-1 px-4 text-sm">
        <Link href="/" className="mr-3 flex items-center gap-2.5 text-fg">
          <Logo className="h-8 w-8 shrink-0" glyph={glyph} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-semibold tracking-tight">{appName}</span>
            {subtitle && (
              <span className="truncate text-[11px] font-medium text-fg-subtle">{subtitle}</span>
            )}
          </span>
        </Link>

        {links.map((l) => {
          const active = isActivePath(activePath, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'inline-flex items-center gap-1.5 rounded-md bg-accent-subtle px-2.5 py-1.5 font-semibold text-accent-text'
                  : 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg'
              }
            >
              {l.icon}
              {l.label}
            </Link>
          );
        })}

        <div className="ml-auto flex items-center gap-2.5">
          {actions}
          {typeof identity === 'string' ? <IdentityChip name={identity} /> : identity}
        </div>
      </nav>
    </header>
  );
}
