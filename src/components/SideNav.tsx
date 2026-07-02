'use client';
import type { ReactNode } from 'react';
import { useRouter, isActivePath, type RouterAdapter } from '../router/RouterProvider';
import type { NavLink } from './TopNav';

export type NavSection = { label?: string; links: NavLink[] };

/** Section label — the 11px uppercase heading used inside a sidebar. */
export function SideNavLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-subtle">
      {children}
    </div>
  );
}

/**
 * SideNavItem — THE flat sidebar row, the one suite-wide standard for "a thing in a
 * left nav". rounded-md, subtle-accent background when `active` (NO boxed border — flat),
 * muted → fg text on hover. Link (`href`) or button (`onClick`). `leading` (an icon) and
 * `trailing` (counts, or a delete-on-hover action — the row is a `group`) are optional
 * right/left slots. Use this everywhere a sidebar lists things so every left nav matches.
 */
export function SideNavItem({
  active,
  href,
  onClick,
  leading,
  trailing,
  title,
  children,
  router,
}: {
  active?: boolean;
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  title?: string;
  children: ReactNode;
  router?: RouterAdapter;
}) {
  const ctxRouter = useRouter();
  const { Link } = router ?? ctxRouter;
  const cls =
    'group flex min-h-[32px] w-full items-center gap-2 rounded-md px-2.5 py-1 text-left text-[13px] ' +
    (active
      ? 'bg-accent-subtle font-semibold text-fg'
      : 'font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg');
  const inner = (
    <>
      {leading != null && (
        <span className="shrink-0" aria-hidden>
          {leading}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing != null && <span className="shrink-0">{trailing}</span>}
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-current={active ? 'page' : undefined} title={title} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} title={title} className={cls}>
      {inner}
    </button>
  );
}

/**
 * SideNav — the persistent left rail (flat, border-r, surface-1). COMPOSITIONAL: pass
 * SideNavLabel + SideNavItem (or any content — a search box, etc.) as `children`, with an
 * optional `header` (e.g. a New-chat button) and `footer` (e.g. an identity bar). The
 * `sections` prop is a convenience for simple link nav. Width via `width` (px); `collapsed`
 * gives a 56px icon rail.
 */
export default function SideNav({
  sections,
  children,
  header,
  footer,
  width,
  collapsed = false,
  router,
  className = '',
}: {
  sections?: NavSection[];
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  width?: number;
  collapsed?: boolean;
  router?: RouterAdapter;
  className?: string;
}) {
  const ctxRouter = useRouter();
  const { activePath } = router ?? ctxRouter;
  const w = collapsed ? 56 : width ?? 240;
  return (
    <nav
      aria-label="Primary"
      style={{ width: w }}
      className={`flex shrink-0 flex-col border-r border-border bg-surface-1 ${className}`}
    >
      {header && <div className="border-b border-border p-2.5">{header}</div>}
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {sections?.map((s, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {s.label && !collapsed && <SideNavLabel>{s.label}</SideNavLabel>}
            {s.links.map((l) => (
              <SideNavItem
                key={l.href}
                href={l.href}
                active={isActivePath(activePath, l.href)}
                router={router}
                title={collapsed ? l.label : undefined}
                leading={l.icon}
              >
                {collapsed ? '' : l.label}
              </SideNavItem>
            ))}
          </div>
        ))}
        {children}
      </div>
      {footer && <div className="mt-auto border-t border-border p-2">{footer}</div>}
    </nav>
  );
}
