'use client';
import type { FitVerdict } from './types';
import { Chip } from '../components/data';

/**
 * Reasoning — the shared synthesized-perspective slices for item cards (ListingCard /
 * MovieCard / DynamicCard): a fit-verdict Chip (DATA hues), the compact one-line `why`,
 * and the full-variant block (fit chip + why paragraph + pros/cons columns + advice).
 * Every read is defensive — a missing or malformed field renders nothing, never throws
 * (a thrown widget would take down the whole chat surface).
 */

/** fit verdict → data hue; anything unrecognized → undefined (chip simply doesn't show). */
export function fitTone(fit?: string): 'success' | 'warning' | 'danger' | undefined {
  switch (fit) {
    case 'strong':
    case 'good':
      return 'success';
    case 'mixed':
      return 'warning';
    case 'weak':
      return 'danger';
    default:
      return undefined;
  }
}

function asStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined;
}

function asStrs(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && !!s.trim()) : [];
}

/** FitChip — the verdict pill ("Strong fit"); unknown/missing verdicts render nothing. */
export function FitChip({ fit }: { fit?: FitVerdict }) {
  const tone = fitTone(fit);
  if (!tone || !fit) return null;
  return <Chip tone={tone}>{fit.charAt(0).toUpperCase() + fit.slice(1)} fit</Chip>;
}

/** WhyLine — the compact one-liner: truncated, italic, muted. */
export function WhyLine({ why, className = '' }: { why?: string; className?: string }) {
  const text = asStr(why);
  if (!text) return null;
  return <div className={`truncate text-[11px] italic text-fg-muted ${className}`}>{text}</div>;
}

function ReasonList({ items, glyph, glyphTone }: { items: string[]; glyph: string; glyphTone: string }) {
  return (
    <ul className="space-y-1">
      {items.map((s, i) => (
        <li key={i} className="flex gap-1.5 text-[13px] leading-snug text-fg-muted">
          <span aria-hidden className={glyphTone}>
            {glyph}
          </span>
          <span className="min-w-0">{s}</span>
        </li>
      ))}
    </ul>
  );
}

/** ReasoningBlock — full-variant synthesized perspective; renders nothing when every field is absent. */
export function ReasoningBlock({
  fit,
  why,
  pros,
  cons,
  advice,
}: {
  fit?: FitVerdict;
  why?: string;
  pros?: string[];
  cons?: string[];
  advice?: string;
}) {
  const whyText = asStr(why);
  const adviceText = asStr(advice);
  const proList = asStrs(pros);
  const conList = asStrs(cons);
  const tone = fitTone(fit);
  if (!tone && !whyText && !adviceText && proList.length === 0 && conList.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {tone && (
        <div>
          <FitChip fit={fit} />
        </div>
      )}
      {whyText && <p className="text-[15px] leading-[1.6] text-fg">{whyText}</p>}
      {(proList.length > 0 || conList.length > 0) && (
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          {proList.length > 0 && <ReasonList items={proList} glyph="✓" glyphTone="text-success" />}
          {conList.length > 0 && <ReasonList items={conList} glyph="✕" glyphTone="text-danger" />}
        </div>
      )}
      {adviceText && <p className="text-[13px] font-medium text-fg">{adviceText}</p>}
    </div>
  );
}
