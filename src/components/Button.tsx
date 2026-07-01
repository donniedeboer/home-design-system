import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50';

const sizes: Record<Size, string> = {
  md: 'h-9 px-4 text-sm',
  sm: 'h-7 px-3 text-[13px]',
};

const variants: Record<Variant, string> = {
  // primary uses the CONTRAST-SAFE button fill (accent-btn) + accent-fg ink
  primary:
    'border-transparent bg-[color:var(--color-accent-btn)] text-[color:var(--color-accent-fg)] hover:bg-[color:var(--color-accent-btn-hover)]',
  // secondary boundary is border-strong for >=3:1 non-text contrast
  secondary: 'border-border-strong bg-surface-0 text-fg hover:bg-surface-2',
  ghost: 'border-transparent bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger:
    'border-transparent bg-danger-subtle text-danger hover:bg-danger hover:text-[color:var(--color-danger-fg)]',
};

/**
 * Button — 4 variants off one recipe (md=36px, sm=28px). At most one primary per
 * view. Renders <button> or, with `as="a"`, an <a>. Primary uses the contrast-safe
 * accent-btn fill so its accent-fg ink clears AA 4.5:1.
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
