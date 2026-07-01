'use client';
import type { ComponentType, ReactNode } from 'react';
import { RouterProvider, type RouterAdapter } from '../router/RouterProvider';
import ProfileProvider from './ProfileProvider';
import ProfileSwitcher from './ProfileSwitcher';
import TopNav, { type NavLink } from './TopNav';
import SideNav, { type NavSection } from './SideNav';
import type { AppGlyphName } from './Logo';

const MAINW: Record<'3xl' | '5xl' | 'full', string> = {
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-none',
};

/**
 * The composition root every app shares. Injects the RouterAdapter once, wraps
 * ProfileProvider, and renders TopNav + optional SideNav + <main>. ONE `maxWidth`
 * lever is applied to BOTH nav and main (fixes nav/content misalignment).
 *
 * Two supported layouts (SideNav is OPTIONAL):
 *   (a) TopNav + left SideNav + main   — pass `sideNav` (Omni pattern).
 *   (b) TopNav-with-top-tabs + main with app-provided side panes — omit `sideNav`,
 *       put the app's panes inside `children` (Persona pattern). `topLinks` render
 *       as the top tabs.
 *
 * Centered chat column (Omni): `maxWidth` bounds the shell frame; the chat column
 * centers itself WITHIN <main> with its own narrower max (e.g. mx-auto max-w-2xl),
 * so the shell lever and the reading column stay independent.
 *
 * `right` defaults to <ProfileSwitcher/> (mounts only when a profile is active).
 * Pass `profileCookieName={null}` to skip the ProfileProvider entirely (utilities).
 */
export default function AppShell({
  appName,
  router,
  glyph = 'module',
  topLinks = [],
  sideNav,
  sideNavCollapsed = false,
  sideNavFooter,
  maxWidth = '3xl',
  right,
  profileCookieName = 'app_profile',
  provider,
  children,
}: {
  appName: string;
  router: RouterAdapter;
  glyph?: AppGlyphName;
  topLinks?: NavLink[];
  sideNav?: NavSection[];
  sideNavCollapsed?: boolean;
  sideNavFooter?: ReactNode;
  maxWidth?: '3xl' | '5xl' | 'full';
  /** TopNav right slot; defaults to <ProfileSwitcher/>. Pass `null` to render nothing. */
  right?: ReactNode | null;
  /** per-app profile cookie (host-scoped; must be unique). `null` disables profiles. */
  profileCookieName?: string | null;
  /** optional child-wrapper (e.g. an app-local data provider). */
  provider?: ComponentType<{ children: ReactNode }>;
  children: ReactNode;
}) {
  const hasProfiles = profileCookieName != null;
  const rightSlot = right === null ? undefined : right ?? (hasProfiles ? <ProfileSwitcher /> : undefined);

  const shell = (
    <div className="flex min-h-screen flex-col">
      <TopNav
        appName={appName}
        links={topLinks}
        right={rightSlot}
        maxWidth={maxWidth}
        glyph={glyph}
      />
      <div className={`mx-auto flex w-full flex-1 ${MAINW[maxWidth]}`}>
        {sideNav && sideNav.length > 0 && (
          <SideNav sections={sideNav} collapsed={sideNavCollapsed} footer={sideNavFooter} />
        )}
        <main className="min-w-0 flex-1 px-4 py-4">{children}</main>
      </div>
    </div>
  );

  const withProvider = provider ? withComponent(provider, shell) : shell;
  const withProfiles = hasProfiles ? (
    <ProfileProvider cookieName={profileCookieName as string}>{withProvider}</ProfileProvider>
  ) : (
    withProvider
  );

  return <RouterProvider adapter={router}>{withProfiles}</RouterProvider>;
}

function withComponent(Provider: ComponentType<{ children: ReactNode }>, children: ReactNode) {
  return <Provider>{children}</Provider>;
}
