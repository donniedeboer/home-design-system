'use client';
import type { FitVerdict, ResearchDim } from './types';
import { Chip } from '../components/data';

/**
 * Reasoning — the shared synthesized-perspective slices for item cards (ListingCard /
 * MovieCard / DynamicCard): a fit-verdict Chip (DATA hues), the compact one-line `why`,
 * the full-variant block (fit chip + why paragraph + pros/cons columns + advice), and
 * the research-transparency chips (compact "n/m researched" / full ✓/○ dimension row).
 * Every read is defensive — a missing or malformed field renders nothing, never throws
 * (a thrown widget would take down the whole chat surface).
 */

/** Hard clamp on rendered research dimensions (matches the layout-DSL chip clamps). */
export const MAX_RESEARCH_DIMS = 6;

/** Defensive read: keep only well-formed { label, done } entries, clamped to 6. */
export function researchDims(research?: ResearchDim[]): ResearchDim[] {
  if (!Array.isArray(research)) return [];
  return research
    .filter((d): d is ResearchDim => !!d && typeof d === 'object' && typeof d.label === 'string' && !!d.label.trim())
    .slice(0, MAX_RESEARCH_DIMS);
}

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

/**
 * FitChip — the verdict pill ("Strong fit"); unknown/missing verdicts render nothing.
 * `provisional` (tier === 'triage') mutes the chip to neutral and prefixes "~" — the
 * verdict came from the cheap triage pass, not the full deep-dive.
 */
export function FitChip({ fit, provisional }: { fit?: FitVerdict; provisional?: boolean }) {
  const tone = fitTone(fit);
  if (!tone || !fit) return null;
  const label = `${fit.charAt(0).toUpperCase() + fit.slice(1)} fit`;
  if (provisional) {
    return (
      <Chip tone="neutral">
        <span className="italic opacity-80">~{label}</span>
      </Chip>
    );
  }
  return <Chip tone={tone}>{label}</Chip>;
}

/**
 * ResearchChip — the compact-variant progress pill ("2/4 researched"). Renders nothing
 * when `research` is absent/empty, so cards without the feature are unchanged.
 */
export function ResearchChip({ research }: { research?: ResearchDim[] }) {
  const dims = researchDims(research);
  if (dims.length === 0) return null;
  const done = dims.filter((d) => d.done).length;
  return (
    <Chip tone="neutral">
      {done}/{dims.length} researched
    </Chip>
  );
}

/**
 * ResearchRow — the full-variant per-dimension chip row: done → success "✓ Risk",
 * pending → neutral muted "○ Schools". Clamped to 6 dims; renders nothing when absent.
 */
export function ResearchRow({ research, className = '' }: { research?: ResearchDim[]; className?: string }) {
  const dims = researchDims(research);
  if (dims.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {dims.map((d, i) =>
        d.done ? (
          <Chip key={i} tone="success">
            ✓ {d.label}
          </Chip>
        ) : (
          <Chip key={i} tone="neutral">
            <span className="opacity-70">○ {d.label}</span>
          </Chip>
        ),
      )}
    </div>
  );
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
  provisional,
}: {
  fit?: FitVerdict;
  why?: string;
  pros?: string[];
  cons?: string[];
  advice?: string;
  /** triage-tier item — the fit verdict renders muted with a "~" (not deep-researched yet). */
  provisional?: boolean;
}) {
  const whyText = asStr(why);
  const adviceText = asStr(advice);
  const proList = asStrs(pros);
  const conList = asStrs(cons);
  const tone = fitTone(fit);
  if (!tone && !whyText && !adviceText && proList.length === 0 && conList.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {/* Authorship label: this block IS Scout's pass-1 voice — naming it (and its depth)
          keeps it from reading as a rival take next to the full deep-research write-up. */}
      <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">
        {provisional ? 'Scout’s initial take — from listing data so far' : 'Scout’s take at a glance'}
      </div>
      {tone && (
        <div>
          <FitChip fit={fit} provisional={provisional} />
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
