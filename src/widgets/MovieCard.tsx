'use client';
import type { MovieData, WidgetProps } from './types';
import ReactionBar from './ReactionBar';
import { FitChip, WhyLine, ReasoningBlock } from './Reasoning';

/**
 * MovieCard — compact = boxshot (62×92) + title/year + why/fit + rating pill; full =
 * larger poster + notes/who + synthesized-fit reasoning + thumbs-with-note. The rating
 * pill is a DATA display (amber star ink on a neutral fill, NEVER the app accent) —
 * reactions are the thumbs, not the stars.
 */
export default function MovieCard({ data, variant = 'compact', onAction }: WidgetProps<MovieData>) {
  const year = data.year ? ` (${data.year})` : '';
  const rating = typeof data.rating === 'number' ? Math.max(0, Math.min(5, data.rating)) : undefined;

  const RatingPill = rating != null ? (
    <span
      className="inline-flex items-center gap-0.5 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-fg-muted"
      aria-label={`Rated ${rating} out of 5`}
    >
      <span aria-hidden className="text-warning">★</span>
      {rating.toFixed(1)}
    </span>
  ) : null;

  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-0 p-2.5">
        <Poster url={data.poster_url} title={data.title} w={62} h={92} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-fg">
            {data.title}
            <span className="font-normal text-fg-muted">{year}</span>
          </div>
          {data.status && (
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.09em] text-fg-subtle">
              {data.status === 'watched' ? 'Watched' : 'Watchlist'}
            </div>
          )}
          <WhyLine why={data.why} className="mt-0.5" />
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {RatingPill}
            <FitChip fit={data.fit} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-3 shadow-soft">
      <div className="flex items-start gap-4">
        <Poster url={data.poster_url} title={data.title} w={96} h={144} />
        <div className="min-w-0 flex-1">
          <div className="text-md font-semibold text-fg">
            {data.title}
            <span className="font-normal text-fg-muted">{year}</span>
          </div>
          {data.who && <div className="mt-1 text-[13px] text-fg-muted">With {data.who}</div>}
          {data.notes && (
            <p className="mt-2 text-[15px] leading-[1.6] text-fg">{data.notes}</p>
          )}
          <ReasoningBlock fit={data.fit} why={data.why} pros={data.pros} cons={data.cons} advice={data.advice} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {RatingPill}
            {onAction && (
              <ReactionBar kind="movie" id={data.id ?? data.title} reaction={data.reaction} onAction={onAction} />
            )}
            {data.url && (
              <a
                href={data.url}
                className="ml-auto text-[13px] font-medium text-accent-text underline decoration-transparent hover:decoration-inherit"
              >
                Open
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Poster({ url, title, w, h }: { url?: string; title: string; w: number; h: number }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`${title} poster`}
        width={w}
        height={h}
        className="shrink-0 rounded-md border border-border object-cover"
        style={{ width: w, height: h }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-fg-subtle"
      style={{ width: w, height: h }}
      aria-hidden
    >
      🎬
    </div>
  );
}
