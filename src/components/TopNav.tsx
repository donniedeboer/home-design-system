'use client';
import type { ReactNode } from 'react';
import Logo, { type AppGlyphName } from './Logo';
import { useRouter, isActivePath, type RouterAdapter } from '../router/RouterProvider';

export type NavLink = { href: string; label: string; icon?: ReactNode };

const MAXW: Record<'3xl' | '5xl' | 'full', string> = {
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-none',
};

/**
 * Sticky top app bar with an accent active-pill (the only accent in the chrome).
 * Router-agnostic: reads a RouterAdapter from `router` prop OR RouterContext — NO
 * next/link, NO usePathname. Active state = accent-subtle fill + accent-text + 600
 * label + aria-current="page". `right` is a right-aligned slot (e.g. ProfileSwitcher).
 */
export default function TopNav({
  appName,
  links = [],
  right,
  maxWidth = '3xl',
  glyph = 'module',
  router,
}: {
  appName: string;
  links?: NavLink[];
  right?: ReactNode;
  maxWidth?: '3xl' | '5xl' | 'full';
  glyph?: AppGlyphName;
  router?: RouterAdapter;
}) {
  const ctxRouter = useRouter();
  const { Link, activePath } = router ?? ctxRouter;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-0/85 backdrop-blur-md">
      <nav className={`mx-auto flex ${MAXW[maxWidth]} items-center gap-1 px-4 py-2.5 text-sm`}>
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold tracking-tight text-fg">
          <Logo className="h-6 w-6 shrink-0" glyph={glyph} />
          <span className="hidden sm:inline">{appName}</span>
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
        {right && <div className="ml-auto flex items-center">{right}</div>}
      </nav>
    </header>
  );
}
