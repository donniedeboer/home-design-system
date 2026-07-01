'use client';
import type { ChecklistData, WidgetProps } from './types';

/**
 * Checklist [I] — agent-updatable (the agent re-emits the same descriptor with a
 * stable `id`; React replaces it in place) AND user-checkable (toggling round-trips
 * a check/uncheck command via onAction). This is a CONTROLLED widget: `checked`
 * comes from props/data, so the agent stays the source of truth.
 */
export default function Checklist({ data, onAction }: WidgetProps<ChecklistData>) {
  const items = data.items ?? [];
  const done = items.filter((i) => i.checked).length;

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[13px] font-semibold text-fg">{data.title}</div>
        <span className="text-[11px] font-medium tabular-nums text-fg-subtle">
          {done}/{items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {items.map((item, i) => {
          const key = item.id ?? String(i);
          const canToggle = data.updatable !== false && !!onAction;
          const label = (
            <span className="flex min-w-0 flex-col">
              <span className={`text-sm ${item.checked ? 'text-fg-subtle line-through' : 'text-fg'}`}>
                {item.label}
              </span>
              {item.note && <span className="text-[11px] text-fg-subtle">{item.note}</span>}
            </span>
          );
          return (
            <li key={key}>
              {canToggle ? (
                <label className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    checked={!!item.checked}
                    onChange={() =>
                      onAction!(`${item.checked ? 'uncheck' : 'check'} ${data.id} ${item.label}`)
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--color-accent)]"
                  />
                  {label}
                </label>
              ) : (
                <div className="flex items-start gap-2 px-1 py-1.5">
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                      item.checked
                        ? 'border-transparent bg-success text-[color:var(--color-success-fg)]'
                        : 'border-border-strong'
                    }`}
                  >
                    {item.checked ? '✓' : ''}
                  </span>
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
