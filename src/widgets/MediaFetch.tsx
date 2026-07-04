'use client';
import { useState } from 'react';
import type { WidgetAction } from './types';

/**
 * MediaFetch — the affordance INSIDE an empty media slot: when an item has no cached image
 * yet, the placeholder itself offers "Fetch image" (emits `fetch-image <kind> <id>` through
 * the same command channel as the thumbs; the host runs its deterministic page-metadata
 * fetch and remounts the card). When an attempt already came up dry, the slot says so
 * plainly — "No image available" — instead of dangling a button that can't deliver.
 * Integrated in-card per the household UX ruling; never a control tacked outside the slot.
 */
export default function MediaFetch({
  kind,
  id,
  onAction,
  failed,
  className = '',
}: {
  kind: string;
  id: string;
  onAction: WidgetAction;
  /** a fetch already ran and found nothing — show the calm caption instead of the button. */
  failed?: boolean;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  if (failed && !pending) {
    return <span className={`px-1 text-center text-[11px] leading-tight text-fg-subtle ${className}`}>No image available</span>;
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        // Compact cards stretch their permalink over the whole card — don't also navigate.
        e.preventDefault();
        e.stopPropagation();
        setPending(true);
        onAction(`fetch-image ${kind} ${id}`);
      }}
      className={`rounded-md border border-border bg-transparent px-2 py-1 text-center text-[11px] font-medium leading-tight text-fg-subtle transition-colors hover:border-fg-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)] disabled:cursor-default disabled:opacity-60 ${className}`}
    >
      {pending ? 'Fetching…' : 'Fetch image'}
    </button>
  );
}
