'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * ShareLinkButton — the ONE copy-a-share-link control for the suite (contract in
 * src/share.ts / home-dev-common/SHARING.md; reference flow extracted from Omni's
 * ShareMenu "Copy link"). The host supplies `getUrl` (typically: POST the resource's
 * /share mint route → absolute viewer URL); the button copies it and confirms inline —
 * "Link copied" — reverting after a beat; failure reads plainly, never throws.
 *
 * `variant="menu-item"` renders it as a dropdown row (Omni's ShareMenu); default is the
 * ghost button used on page headers and card action rows.
 */
export default function ShareLinkButton({
  getUrl,
  label = 'Share',
  className = '',
  variant = 'button',
}: {
  /** Mint (idempotently) and return the ABSOLUTE share URL to copy. */
  getUrl: () => Promise<string>;
  label?: string;
  className?: string;
  variant?: 'button' | 'menu-item';
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const settle = (s: 'copied' | 'failed') => {
    setState(s);
    timer.current = setTimeout(() => setState('idle'), 2500);
  };

  const onClick = async () => {
    if (state === 'busy') return;
    setState('busy');
    try {
      const url = await getUrl();
      await navigator.clipboard.writeText(url);
      settle('copied');
    } catch {
      settle('failed');
    }
  };

  const text =
    state === 'busy' ? 'Creating link…'
    : state === 'copied' ? 'Link copied'
    : state === 'failed' ? 'Couldn’t create link'
    : label;

  const cls =
    variant === 'menu-item'
      ? `flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2 ${className}`
      : `inline-flex items-center gap-1.5 rounded-lg border border-border-control bg-surface-0 px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:cursor-default disabled:opacity-70 ${className}`;

  return (
    <button type="button" onClick={() => void onClick()} disabled={state === 'busy'} className={cls}>
      <ShareIcon />
      {text}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
