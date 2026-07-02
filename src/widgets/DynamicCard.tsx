'use client';
import type { DynamicData, WidgetProps } from './types';
import { Chip, DataGrid } from '../components/data';
import Button from '../components/Button';
import { evalPredicate, formatValue, MAX_STATS, MAX_CHIPS, type ItemBag } from './dynamicLayout';

/**
 * DynamicCard [dyn] — renders an agent-authored declarative layout (DynamicLayout) for a
 * domain with no hand-built widget. It NEVER runs code: closed-vocabulary slots map to
 * primitives (Chip / DataGrid / Button), values format through the fixed enum, and badges
 * are gated by the safe predicate DSL. Missing/empty slots are dropped; if fewer than two
 * slots populate it downgrades to a plain row rather than render a near-blank tile.
 */
export default function DynamicCard({ data, variant = 'compact', onAction }: WidgetProps<DynamicData>) {
  const layout = data?.layout;
  const bag = (data?.item ?? {}) as ItemBag;
  const itemId = data?.itemId ?? data?.id ?? '';
  if (!layout || !layout.title) return null;

  const titleText = formatValue(bag[layout.title.field], layout.title.format);
  const title = titleText && titleText !== '—' ? titleText : undefined;
  const subtitle = (layout.subtitle ?? [])
    .map((r) => formatValue(bag[r.field], r.format))
    .filter((s) => s && s !== '—')
    .join(' · ');
  const stats = (layout.stats ?? [])
    .slice(0, MAX_STATS)
    .map((r) => ({ label: r.label ?? r.field, value: formatValue(bag[r.field], r.format) }))
    .filter((s) => s.value !== '—');
  const chips = (layout.chips ?? [])
    .slice(0, MAX_CHIPS)
    .map((c) => ({ tone: (c.tone ?? 'neutral') as 'success' | 'warning' | 'danger' | 'neutral', value: formatValue(bag[c.field]) }))
    .filter((c) => c.value && c.value !== '—');
  const badges = (layout.badges ?? []).filter((b) => evalPredicate(b.when, bag));
  const bodyText = layout.body ? formatValue(bag[layout.body.field], layout.body.format) : '';
  const body = bodyText && bodyText !== '—' ? bodyText : undefined;
  const mediaUrl = layout.media ? (bag[layout.media.field] as string | undefined) : undefined;
  const actions = layout.actions ?? [];
  const openHref = data.scoutUrl ?? data.url;

  const populated =
    (title ? 1 : 0) + (subtitle ? 1 : 0) + (stats.length ? 1 : 0) + (chips.length ? 1 : 0) + (body ? 1 : 0) + (mediaUrl ? 1 : 0);

  // Minimum-viability — never a near-blank tile.
  if (populated < 2) {
    return (
      <div className="rounded-xl border border-border bg-surface-0 px-3 py-2.5">
        <div className="truncate text-sm font-semibold text-fg">{title ?? '—'}</div>
        {stats[0] && (
          <div className="mt-0.5 text-[11px] text-fg-subtle">
            {stats[0].label}: {stats[0].value}
          </div>
        )}
      </div>
    );
  }

  const badgeRow = badges.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => (
        <Chip key={`b${i}`} tone={b.hue}>
          {b.text}
        </Chip>
      ))}
    </div>
  );
  const chipRow = chips.length > 0 && (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c, i) => (
        <Chip key={`c${i}`} tone={c.tone}>
          {c.value}
        </Chip>
      ))}
    </div>
  );

  if (variant === 'compact') {
    const mediaAspect =
      layout.media?.shape === 'poster' ? 'aspect-[2/3]' : layout.media?.shape === 'wide' ? 'aspect-[16/9]' : 'aspect-square';
    const inner = (
      <div className="flex items-stretch gap-3 rounded-xl border border-border bg-surface-0 transition-colors hover:border-border-strong">
        {mediaUrl && <Media url={mediaUrl} alt={title ?? ''} className={`w-24 shrink-0 rounded-l-xl ${mediaAspect}`} />}
        <div className="min-w-0 flex-1 py-2.5 pr-3">
          {title && <div className="truncate text-sm font-semibold text-fg">{title}</div>}
          {subtitle && <div className="truncate text-[11px] text-fg-muted">{subtitle}</div>}
          {(badges.length > 0 || chips.length > 0) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {badgeRow}
              {chipRow}
            </div>
          )}
        </div>
      </div>
    );
    return openHref ? (
      <a
        href={openHref}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]"
      >
        {inner}
      </a>
    ) : (
      inner
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-0 shadow-soft">
      {mediaUrl && (
        <Media url={mediaUrl} alt={title ?? ''} className={`w-full ${layout.media?.shape === 'wide' ? 'aspect-[16/9]' : 'aspect-[3/2]'}`} />
      )}
      <div className="p-3">
        {title && <div className="text-md font-semibold text-fg">{title}</div>}
        {subtitle && <div className="text-[13px] text-fg-muted">{subtitle}</div>}
        {(badges.length > 0 || chips.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {badgeRow}
            {chipRow}
          </div>
        )}
        {stats.length > 0 && (
          <div className="mt-3">
            <DataGrid items={stats} />
          </div>
        )}
        {body && <p className="mt-3 text-[15px] leading-[1.6] text-fg">{body}</p>}
        {onAction && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {actions.includes('love') && (
              <Button variant="primary" size="sm" onClick={() => onAction(`love item ${itemId}`)}>
                Loved
              </Button>
            )}
            {actions.includes('pass') && (
              <Button variant="secondary" size="sm" onClick={() => onAction(`pass item ${itemId}`)}>
                Pass
              </Button>
            )}
            {actions.includes('rate') && (
              <div className="flex items-center gap-0.5" role="group" aria-label="Rate">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Rate ${n} of 5`}
                    onClick={() => onAction(`rate item ${itemId} ${n}`)}
                    className="px-0.5 text-fg-subtle transition-colors hover:text-fg"
                  >
                    ★
                  </button>
                ))}
              </div>
            )}
            {actions.includes('open') && openHref && (
              <Button as="a" href={openHref} target="_blank" rel="noreferrer" variant="ghost" size="sm">
                Open ↗
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Media({ url, alt, className = '' }: { url: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={`object-cover ${className}`} loading="lazy" />;
}
