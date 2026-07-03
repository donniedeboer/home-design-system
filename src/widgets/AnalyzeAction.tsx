'use client';
import { useState } from 'react';
import type { WidgetAction } from './types';

/**
 * AnalyzeAction — the ONE in-card "run the full analysis" affordance, a peer of ReactionBar
 * in every interactive item card's action row (never a tack-on rendered after the card).
 * Emits `analyze <kind> <id>` through the same command channel as the thumbs; the host runs
 * its deep-dive and is expected to REMOUNT the card when it lands (fresh key / tier move),
 * which clears the local pending state. Ghost styling: it must never compete with the
 * primary card content or the thumbs.
 */
export default function AnalyzeAction({
  kind,
  id,
  onAction,
  label = 'Analyze',
  className = '',
}: {
  kind: string;
  id: string;
  onAction: WidgetAction;
  label?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        // The compact listing card stretches its permalink over the whole card — keep an
        // analyze click from also navigating.
        e.preventDefault();
        e.stopPropagation();
        setPending(true);
        onAction(`analyze ${kind} ${id}`);
      }}
      className={`rounded-lg border border-border bg-transparent px-2.5 py-1 text-[12px] font-medium text-fg-subtle transition-colors hover:border-fg-subtle hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)] disabled:cursor-default disabled:opacity-60 ${className}`}
    >
      {pending ? 'Analyzing…' : label}
    </button>
  );
}
