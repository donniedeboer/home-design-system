import type { ReactNode } from 'react';
import { useRouter, type RouterAdapter } from '../router/RouterProvider';

/**
 * Data-display primitives. Hues here are DATA hues (success/warning/danger/neutral
 * or an app-local token name) — never the app accent, which is reserved for chrome.
 */

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | string;

function toneClasses(tone: Tone): string {
  switch (tone) {
    case 'accent':
      return 'bg-accent-muted text-accent-text';
    case 'success':
      return 'bg-success-subtle text-success-text';
    case 'warning':
      return 'bg-warning-subtle text-warning-text';
    case 'danger':
      return 'bg-danger-subtle text-danger-text';
    case 'neutral':
      return 'bg-surface-2 text-fg-muted';
    default:
      // app-local data-hue token name, e.g. "protein" → bg-protein-muted/text-protein-text
      return `bg-[color:var(--color-${tone}-muted,var(--color-surface-2))] text-[color:var(--color-${tone}-text,var(--color-fg-muted))]`;
  }
}

/** Chip — a data-hue pill (NOT the accent, except the explicit `tone="accent"`). */
export function Chip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${toneClasses(
        tone,
      )}`}
    >
      {children}
    </span>
  );
}

/** StatChip — big tabular value over an 11px uppercase label (ScorePill = macro cell). */
export function StatChip({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className={`flex min-w-[44px] flex-col rounded-md px-2 py-1.5 ${toneClasses(tone)}`}>
      <span className="text-base font-semibold tabular-nums leading-none">{value}</span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.09em] opacity-80">
        {label}
      </span>
    </div>
  );
}

/** StatGrid — horizontal row of StatChips. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

/** DataGrid — grid-cols-2 sm:grid-cols-4; each cell = uppercase label + colored value. */
export function DataGrid({
  items,
}: {
  items: { label: string; value: ReactNode; tone?: Tone }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {items.map((it, i) => (
        <div key={i} className="flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-[0.09em] text-fg-subtle">
            {it.label}
          </span>
          <span
            className={`mt-0.5 text-sm font-semibold tabular-nums ${
              it.tone ? toneClasses(it.tone).split(' ').find((c) => c.startsWith('text-')) ?? 'text-fg' : 'text-fg'
            }`}
          >
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * ListRow — leading stat/badge → truncating title/meta → right tabular figure.
 * Bordered (not rounded-rect) so long lists stay calm; hover lifts the border.
 * Router-agnostic when given an href.
 */
export function ListRow({
  leading,
  title,
  meta,
  figure,
  href,
  onClick,
  router,
}: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  figure?: ReactNode;
  href?: string;
  onClick?: () => void;
  router?: RouterAdapter;
}) {
  const ctxRouter = useRouter();
  const { Link } = router ?? ctxRouter;
  const inner = (
    <>
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-fg">{title}</div>
        {meta && <div className="truncate text-[11px] text-fg-muted">{meta}</div>}
      </div>
      {figure != null && <div className="shrink-0 text-sm font-semibold tabular-nums text-fg">{figure}</div>}
    </>
  );
  const cls =
    'flex w-full items-center gap-3 border-b border-border px-2 py-2 text-left transition-colors hover:border-border-strong';
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}
