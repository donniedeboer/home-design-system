'use client';
import type { DiffData, WidgetProps } from './types';

/**
 * Diff [I] — renders an old→new value change proposed by a Curator agent. Uses the
 * shared git-diff hues (--color-diff-added-* / --color-diff-removed-*), NEVER the
 * per-app accent, so the semantics read as add/remove everywhere.
 *
 * A small header shows the target (entity · key · op). Accept / Dismiss buttons are
 * shown ONLY when an action handler is present AND the proposal is still actionable
 * (a `proposalId` exists and it is not already committed). When the change was
 * auto-committed (status='committed', no id) we show a static "committed" badge
 * instead of buttons — there is nothing to accept.
 *
 * Interactions round-trip a compact command through onAction:
 *   "accept <proposalId>" / "dismiss <proposalId>"
 * AgentChat threads onAction from its onWidgetAction bus, so the host app can turn
 * that command into the proposals API call (accept → POST /api/proposals/{id}/accept,
 * dismiss → reject).
 */
export default function Diff({ data, onAction }: WidgetProps<DiffData>) {
  const { entity, key, old, new: next, op, proposalId, status } = data;
  const committed = status === 'committed';
  const actionable = !!onAction && !!proposalId && !committed;

  const opLabel =
    op === 'add' ? 'add' : op === 'remove' ? 'remove' : op ?? 'edit';

  const showOld = old !== undefined && old !== null && old !== '';
  const showNew = next !== undefined && next !== null && next !== '';

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-fg-subtle">
        {entity && (
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-fg-muted">{entity}</span>
        )}
        {key && <span className="font-mono text-fg-muted">{key}</span>}
        <span className="uppercase tracking-[0.08em] text-fg-subtle">{opLabel}</span>
        {committed && (
          <span className="ml-auto rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-success-fg)]">
            committed
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 font-mono text-[13px] leading-[1.5]">
        {showOld && (
          <div className="flex gap-2 rounded-md bg-[color:var(--color-diff-removed-bg)] px-2 py-1 text-[color:var(--color-diff-removed-fg)]">
            <span aria-hidden className="select-none opacity-70">
              −
            </span>
            <span className="min-w-0 whitespace-pre-wrap break-words">
              <span className="sr-only">Previous value: </span>
              {String(old)}
            </span>
          </div>
        )}
        {showNew && (
          <div className="flex gap-2 rounded-md bg-[color:var(--color-diff-added-bg)] px-2 py-1 text-[color:var(--color-diff-added-fg)]">
            <span aria-hidden className="select-none opacity-70">
              +
            </span>
            <span className="min-w-0 whitespace-pre-wrap break-words">
              <span className="sr-only">New value: </span>
              {String(next)}
            </span>
          </div>
        )}
      </div>

      {actionable && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAction!(`accept ${proposalId}`)}
            aria-label={`Accept proposed change to ${key ?? 'record'}`}
            className="inline-flex h-8 items-center rounded-lg bg-[color:var(--color-accent-btn)] px-3 text-[13px] font-medium text-[color:var(--color-accent-fg)] transition-colors hover:bg-[color:var(--color-accent-btn-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onAction!(`dismiss ${proposalId}`)}
            aria-label={`Dismiss proposed change to ${key ?? 'record'}`}
            className="inline-flex h-8 items-center rounded-lg border border-border-control px-3 text-[13px] font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
