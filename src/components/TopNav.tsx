"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Logo from "./Logo";

export type NavLink = { href: string; label: string };

/**
 * Top app bar with an accent active-pill (the only accent in the chrome). Pass the app
 * name + its nav links; `right` is a slot for a right-aligned control (e.g. a
 * <ProfileSwitcher/> for profile-using apps — utilities just omit it).
 */
export default function TopNav({
  appName,
  links = [],
  right,
}: {
  appName: string;
  links?: NavLink[];
  right?: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-0/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-3xl items-center gap-1 px-4 py-2.5 text-sm">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold tracking-tight text-fg">
          <Logo className="h-6 w-6 shrink-0" />
          <span className="hidden sm:inline">{appName}</span>
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={
              isActive(l.href)
                ? "rounded-md bg-accent-subtle px-2.5 py-1.5 font-medium text-accent-text"
                : "rounded-md px-2.5 py-1.5 font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            }
          >
            {l.label}
          </Link>
        ))}
        {right && <div className="ml-auto flex items-center">{right}</div>}
      </nav>
    </header>
  );
}
