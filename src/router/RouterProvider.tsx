'use client';
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

/**
 * The ONE framework-decoupling surface. Nav components read a RouterAdapter from
 * context (or an explicit `router` prop). No `next/*` imports live anywhere in the
 * package — Next apps inject an adapter wrapping next/link + usePathname; Vite SPAs
 * inject one over their router (or use the plain default <a> adapter).
 */
export type LinkAdapter = ComponentType<{
  href: string;
  className?: string;
  'aria-current'?: 'page';
  title?: string;
  onClick?: () => void;
  children: ReactNode;
}>;

export type RouterAdapter = {
  /** framework Link (Next: next/link; Vite: a plain <a> or router Link) */
  Link: LinkAdapter;
  /** active path (Next: usePathname(); Vite: window.location.pathname) */
  activePath: string;
};

/** Default adapter: a plain <a> and no active path (reads no framework). */
const PlainLink: LinkAdapter = ({ children, ...rest }) => <a {...rest}>{children}</a>;

export const defaultRouterAdapter: RouterAdapter = {
  Link: PlainLink,
  activePath: '',
};

export const RouterContext = createContext<RouterAdapter>(defaultRouterAdapter);

/** Inject the adapter once at the app root: <RouterProvider adapter={…}>…</RouterProvider>. */
export function RouterProvider({
  adapter,
  children,
}: {
  adapter: RouterAdapter;
  children: ReactNode;
}) {
  return <RouterContext.Provider value={adapter}>{children}</RouterContext.Provider>;
}

/** Read the adapter. Falls back to the plain <a> default when no provider is present. */
export function useRouter(): RouterAdapter {
  return useContext(RouterContext);
}

/** Is `href` the active route? Matches exact or a path prefix (segment-aware). */
export function isActivePath(activePath: string, href: string): boolean {
  if (!activePath || !href) return false;
  return activePath === href || activePath.startsWith(href.replace(/\/$/, '') + '/');
}
