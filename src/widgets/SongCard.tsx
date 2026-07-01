'use client';
import type { SongData, WidgetProps } from './types';

/**
 * SongCard [I] — compact = square art + title/artist one line (list-friendly);
 * full = larger art + album/year + play link. Round-trips a "play" command.
 */
export default function SongCard({ data, variant = 'compact', onAction }: WidgetProps<SongData>) {
  const sub = [data.album, data.year].filter(Boolean).join(' · ');

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-0 p-2">
        <Art url={data.art_url} title={data.title} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-fg">{data.title}</div>
          <div className="truncate text-[11px] text-fg-muted">{data.artist}</div>
        </div>
        {(data.url || onAction) && (
          <button
            type="button"
            onClick={() => (onAction ? onAction(`play ${data.title} by ${data.artist}`) : undefined)}
            aria-label={`Play ${data.title}`}
            className="relative flex h-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-fg-subtle hover:text-fg"
          >
            <span aria-hidden>▶</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-surface-0 p-3 shadow-soft">
      <Art url={data.art_url} title={data.title} size={96} />
      <div className="min-w-0 flex-1">
        <div className="text-md font-semibold text-fg">{data.title}</div>
        <div className="text-[13px] text-fg-muted">{data.artist}</div>
        {sub && <div className="mt-0.5 text-[11px] text-fg-subtle">{sub}</div>}
        {data.url && (
          <a
            href={data.url}
            className="mt-3 inline-flex text-[13px] font-medium text-accent-text underline decoration-transparent hover:decoration-inherit"
          >
            ▶ Play
          </a>
        )}
      </div>
    </div>
  );
}

function Art({ url, title, size }: { url?: string; title: string; size: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={`${title} cover art`}
        className="shrink-0 rounded-md border border-border object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-fg-subtle"
      style={{ width: size, height: size }}
      aria-hidden
    >
      ♪
    </div>
  );
}
