'use client';
import type { ReactNode } from 'react';
import { useRouter, isActivePath, type RouterAdapter } from '../router/RouterProvider';
import type { NavLink } from './TopNav';

export type NavSection = { label?: string; links: NavLink[] };

/**
 * Optional persistent left rail (172px expanded / 56px collapsed icon-rail). NOT
 * every app has one — Omni does (with an identity userbar footer); Persona uses
 * top-tabs + panes instead. Router-agnostic (RouterAdapter). Active state matches
 * TopNav: accent-subtle fill + accent-text + aria-current="page".
 */
export default function SideNav({
  sections,
  router,
  collapsed = false,
  footer,
}: {
  sections: NavSection[];
  router?: RouterAdapter;
  collapsed?: boolean;
  footer?: ReactNode;
}) {
  const ctxRouter = useRouter();
  const { Link, activePath } = router ?? ctxRouter;

  return (
    <nav
      aria-label="Primary"
      className={`flex shrink-0 flex-col gap-4 border-r border-border bg-surface-1 py-3 ${
        collapsed ? 'w-14 px-1.5' : 'w-[172px] px-2'
      }`}
    >
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {sections.map((section, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {section.label && !collapsed && (
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">
                {section.label}
              </div>
            )}
            {section.links.map((l) => {
              const active = isActivePath(activePath, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  title={collapsed ? l.label : undefined}
                  className={
                    (active
                      ? 'bg-accent-subtle font-semibold text-accent-text'
                      : 'font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg') +
                    ' flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ' +
                    (collapsed ? 'justify-center' : '')
                  }
                >
                  {l.icon && <span className="shrink-0" aria-hidden>{l.icon}</span>}
                  {!collapsed && <span className="truncate">{l.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      {footer && <div className="mt-auto border-t border-border pt-2">{footer}</div>}
    </nav>
  );
}
