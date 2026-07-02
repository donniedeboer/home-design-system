'use client';
import type { ListingData, WidgetProps } from './types';
import { Chip, DataGrid } from '../components/data';
import Button from '../components/Button';
import Gallery from './Gallery';
import ReactionBar from './ReactionBar';
import { FitChip, WhyLine, ReasoningBlock } from './Reasoning';

function money(n?: number): string | undefined {
  return n == null ? undefined : `$${n.toLocaleString('en-US')}`;
}

/**
 * ListingCard [I] — compact = CDN hero + address + one meta line + why/fit + price +
 * drop chips, click-through (the calmer representative preview); full = hero + gallery
 * rail + DataGrid spec grid + summary + synthesized-fit reasoning + thumbs-with-note +
 * Open-in-Scout. Score/drop/fit use DATA hues (success/danger/neutral), never the accent.
 */
export default function ListingCard({ data, variant = 'compact', onAction }: WidgetProps<ListingData>) {
  const price = money(data.price);
  const dropped = data.lastPrice != null && data.price != null && data.price < data.lastPrice;
  const metaLine = [
    data.beds != null ? `${data.beds} bd` : null,
    data.baths != null ? `${data.baths} ba` : null,
    data.sqft != null ? `${data.sqft.toLocaleString('en-US')} sqft` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const cityLine = [data.city, data.region, data.zip].filter(Boolean).join(', ');

  const chips = (
    <>
      {dropped && <Chip tone="success">↓ {money(data.lastPrice! - data.price!)}</Chip>}
      {data.score != null && <Chip tone="neutral">Fit {data.score}</Chip>}
      {data.status && <Chip tone="neutral">{data.status}</Chip>}
    </>
  );

  if (variant === 'compact') {
    const inner = (
      <div className="flex items-stretch gap-3 rounded-xl border border-border bg-surface-0 p-0 transition-colors hover:border-border-strong">
        <Hero url={data.photo_url} alt={data.address} className="w-28 shrink-0 rounded-l-xl" />
        <div className="min-w-0 flex-1 py-2.5 pr-3">
          <div className="truncate text-sm font-semibold text-fg">{data.address}</div>
          {cityLine && <div className="truncate text-[11px] text-fg-muted">{cityLine}</div>}
          {metaLine && <div className="mt-0.5 text-[11px] text-fg-subtle">{metaLine}</div>}
          <WhyLine why={data.why} className="mt-0.5" />
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {price && <span className="text-sm font-semibold tabular-nums text-fg">{price}</span>}
            {chips}
            <FitChip fit={data.fit} />
          </div>
        </div>
      </div>
    );
    // Prefer the Scout candidate page over the raw source listing so a click stays in the
    // platform; fall back to the source listing when Scout has no permalink for it.
    const cardHref = data.scoutUrl ?? data.url;
    return cardHref ? (
      <a href={cardHref} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]">
        {inner}
      </a>
    ) : (
      inner
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-0 shadow-soft">
      <Hero url={data.photo_url} alt={data.address} className="h-48 w-full" />
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-md font-semibold text-fg">{data.address}</div>
            {cityLine && <div className="text-[13px] text-fg-muted">{cityLine}</div>}
          </div>
          {price && <div className="shrink-0 text-lg font-semibold tabular-nums text-fg">{price}</div>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">{chips}</div>

        {data.photos && data.photos.length > 0 && (
          <div className="mt-3">
            <Gallery variant="full" data={{ images: data.photos.map((u) => ({ url: u })) }} />
          </div>
        )}

        <div className="mt-3">
          <DataGrid
            items={[
              { label: 'Beds', value: data.beds ?? '—' },
              { label: 'Baths', value: data.baths ?? '—' },
              { label: 'Sqft', value: data.sqft?.toLocaleString('en-US') ?? '—' },
              { label: 'Lot', value: data.lotSize ?? '—' },
            ]}
          />
        </div>

        {data.summary && <p className="mt-3 text-[15px] leading-[1.6] text-fg">{data.summary}</p>}

        <ReasoningBlock fit={data.fit} why={data.why} pros={data.pros} cons={data.cons} advice={data.advice} />

        {onAction && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ReactionBar kind="listing" id={data.propertyId} reaction={data.reaction} onAction={onAction} />
            {data.scoutUrl && (
              <Button as="a" href={data.scoutUrl} target="_blank" rel="noreferrer" variant="ghost" size="sm">
                Open in Scout
              </Button>
            )}
            {data.url && (
              <Button as="a" href={data.url} target="_blank" rel="noreferrer" variant="ghost" size="sm">
                View listing ↗
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Hero({ url, alt, className = '' }: { url?: string; alt: string; className?: string }) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-surface-2 text-fg-subtle ${className}`} aria-hidden>
        🏠
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={`object-cover ${className}`} loading="lazy" />;
}
