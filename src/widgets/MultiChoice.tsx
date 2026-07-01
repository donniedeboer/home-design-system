'use client';
import { useId, useRef, useState } from 'react';
import type { MultiChoiceData, WidgetProps } from './types';

/**
 * MultiChoice [I] — today's ask_user, formalized. Single-select renders a
 * role=radiogroup of role=radio pills with arrow-key roving-tabindex navigation;
 * multi-select renders checkboxes. Both are labelled by the question (aria-labelledby).
 * After an answer, options become aria-disabled (NOT removed) so the choice stays
 * visible and the round-tripped command is sent once via onAction.
 */
export default function MultiChoice({ data, onAction }: WidgetProps<MultiChoiceData>) {
  const options = data.options ?? [];
  const multi = !!data.multi;
  const qId = useId();
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [focusIdx, setFocusIdx] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function submitSingle(i: number) {
    if (answered) return;
    setSelected(new Set([i]));
    setAnswered(true);
    onAction?.(options[i]);
  }

  function toggleMulti(i: number) {
    if (answered) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function submitMulti() {
    if (answered || selected.size === 0) return;
    setAnswered(true);
    onAction?.(Array.from(selected).sort().map((i) => options[i]).join(', '));
  }

  function onKeyDownRadio(e: React.KeyboardEvent, i: number) {
    if (answered) return;
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % options.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + options.length) % options.length;
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      submitSingle(i);
      return;
    } else return;
    e.preventDefault();
    setFocusIdx(next);
    btnRefs.current[next]?.focus();
  }

  const optionCls = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)] ${
      active
        ? 'border-transparent bg-accent-subtle text-accent-text'
        : 'border-border-strong text-fg-muted hover:bg-surface-2 hover:text-fg'
    } ${answered ? 'opacity-60' : ''}`;

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-3">
      <div id={qId} className="mb-2 text-sm font-semibold text-fg">
        {data.question}
      </div>
      <div
        role={multi ? 'group' : 'radiogroup'}
        aria-labelledby={qId}
        className="flex flex-wrap gap-2"
      >
        {options.map((opt, i) => {
          const active = selected.has(i);
          if (multi) {
            return (
              <button
                key={i}
                type="button"
                role="checkbox"
                aria-checked={active}
                aria-disabled={answered || undefined}
                onClick={() => toggleMulti(i)}
                className={optionCls(active)}
              >
                {opt}
              </button>
            );
          }
          return (
            <button
              key={i}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={answered || undefined}
              tabIndex={answered ? -1 : i === focusIdx ? 0 : -1}
              onClick={() => submitSingle(i)}
              onKeyDown={(e) => onKeyDownRadio(e, i)}
              className={optionCls(active)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {multi && !answered && (
        <button
          type="button"
          onClick={submitMulti}
          disabled={selected.size === 0}
          className="mt-3 inline-flex h-8 items-center rounded-lg bg-[color:var(--color-accent-btn)] px-3 text-[13px] font-medium text-[color:var(--color-accent-fg)] transition-colors hover:bg-[color:var(--color-accent-btn-hover)] disabled:opacity-50"
        >
          Submit
        </button>
      )}
    </div>
  );
}
