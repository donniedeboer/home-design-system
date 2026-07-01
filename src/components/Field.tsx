import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

const control =
  'w-full rounded-lg border border-border-strong bg-surface-0 px-3 py-2 text-sm text-fg shadow-sm placeholder:text-fg-subtle focus-visible:border-[color:var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]';

/** Input — surface-0 + border-strong (>=3:1 non-text) + accent focus ring. */
export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${control} tabular-nums ${className}`} {...rest} />;
}

/** Select — matches Input; keeps native chevron. */
export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${control} ${className}`} {...rest}>
      {children}
    </select>
  );
}
