'use client';
import type { ComponentType, ReactNode } from 'react';
import { RouterProvider, type RouterAdapter } from '../router/RouterProvider';
import TopNav, { type NavLink } from './TopNav';
import SideNav, { type NavSection } from './SideNav';
import type { AppGlyphName } from './Logo';

const MAINW: Record<'3xl' | '5xl' | 'full', string> = {
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-none',
};

/**
 * The composition root EVERY app shares. Injects the RouterAdapter once and renders the
 * one shared TopNav + optional SideNav + <main>. ONE `maxWidth` lever aligns nav + main.
 *
 * OPINIONATED identity: the nav shows a READ-ONLY authenticated-identity chip from the
 * `identity` prop (a display name). There is NO profile picker — every app resolves its
 * signed-in identity (Tailscale-derived) and passes the name here, so identity looks and
 * sits the same across the suite. Apps that need profile DATA context can still wrap their
 * own provider via `provider`; it must not add a picker to the chrome.
 *
 * Layouts (SideNav optional): (a) TopNav + left SideNav + main (pass `sideNav`); (b)
 * TopNav-with-top-tabs + main with app panes in `children` (pass `topLinks`).
 */
export default function AppShell({
  appName,
  subtitle,
  router,
  glyph = 'module',
  topLinks = [],
  actions,
  identity,
  sideNav,
  sideNavCollapsed = false,
  sideNavFooter,
  maxWidth = '3xl',
  mainClassName = 'min-w-0 flex-1 px-4 py-4',
  provider,
  children,
}: {
  appName: string;
  /** the app's tagline (e.g. "your family assistant") shown under the name in the nav. */
  subtitle?: string;
  router: RouterAdapter;
  glyph?: AppGlyphName;
  topLinks?: NavLink[];
  /** app-specific right-side nav actions (share/settings/model pill) — before identity. */
  actions?: ReactNode;
  /** the authenticated identity display name (or a node) — renders the uniform chip. */
  identity?: string | ReactNode;
  sideNav?: NavSection[];
  sideNavCollapsed?: boolean;
  sideNavFooter?: ReactNode;
  maxWidth?: '3xl' | '5xl' | 'full';
  /**
   * className for the <main> element. Defaults to `"min-w-0 flex-1 px-4 py-4"`
   * (the padded standard). Pass `"min-w-0 flex-1"` to make main full-bleed so an
   * app can render an edge-to-edge, flush layout (e.g. a full-height side rail).
   */
  mainClassName?: string;
  /** optional child-wrapper (e.g. an app-local data provider). */
  provider?: ComponentType<{ children: ReactNode }>;
  children: ReactNode;
}) {
  const shell = (
    <div className="flex min-h-screen flex-col">
      <TopNav
        appName={appName}
        subtitle={subtitle}
        links={topLinks}
        actions={actions}
        identity={identity}
        maxWidth={maxWidth}
        glyph={glyph}
      />
      <div className={`mx-auto flex w-full flex-1 ${MAINW[maxWidth]}`}>
        {sideNav && sideNav.length > 0 && (
          <SideNav sections={sideNav} collapsed={sideNavCollapsed} footer={sideNavFooter} />
        )}
        <main className={mainClassName}>{children}</main>
      </div>
    </div>
  );

  const withProvider = provider ? withComponent(provider, shell) : shell;
  return <RouterProvider adapter={router}>{withProvider}</RouterProvider>;
}

function withComponent(Provider: ComponentType<{ children: ReactNode }>, children: ReactNode) {
  return <Provider>{children}</Provider>;
}
