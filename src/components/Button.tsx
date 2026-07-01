import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

const base =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50';

const sizes: Record<Size, string> = {
  md: 'h-9 px-4 text-sm',
  // sm keeps its 28px VISUAL height but a ::before hit-slop pseudo-element expands
  // the tappable area to >=44px on coarse pointers (WCAG 2.5.5) without changing layout.
  sm: "h-7 px-3 text-[13px] [@media(pointer:coarse)]:before:absolute [@media(pointer:coarse)]:before:left-1/2 [@media(pointer:coarse)]:before:top-1/2 [@media(pointer:coarse)]:before:h-11 [@media(pointer:coarse)]:before:min-h-[44px] [@media(pointer:coarse)]:before:w-full [@media(pointer:coarse)]:before:min-w-[44px] [@media(pointer:coarse)]:before:-translate-x-1/2 [@media(pointer:coarse)]:before:-translate-y-1/2 [@media(pointer:coarse)]:before:content-['']",
};

const variants: Record<Variant, string> = {
  // primary uses the CONTRAST-SAFE button fill (accent-btn) + accent-fg ink
  primary:
    'border-transparent bg-[color:var(--color-accent-btn)] text-[color:var(--color-accent-fg)] hover:bg-[color:var(--color-accent-btn-hover)]',
  // secondary boundary is border-control for WCAG 1.4.11 >=3:1 non-text contrast vs all surfaces
  secondary: 'border-border-control bg-surface-0 text-fg hover:bg-surface-2',
  ghost: 'border-transparent bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger:
    'border-transparent bg-danger-subtle text-danger hover:bg-danger hover:text-[color:var(--color-danger-fg)]',
};

/**
 * Button — 4 variants off one recipe (md=36px, sm=28px). At most one primary per
 * view. Renders <button> or, with `as="a"`, an <a>. Primary uses the contrast-safe
 * accent-btn fill so its accent-fg ink clears AA 4.5:1. The secondary boundary uses
 * border-control (WCAG 1.4.11 >=3:1). sm keeps its 28px visual size but a coarse-pointer
 * ::before hit-slop guarantees a >=44px touch target (WCAG 2.5.5) with no layout shift.
 */
export default function Button({
  variant = 'secondary',
  size = 'md',
  as = 'button',
  className = '',
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  as?: 'button' | 'a';
  className?: string;
  children?: ReactNode;
} & Partial<ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>>) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  if (as === 'a') {
    return (
      <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
