'use client';
import type { AestheticData, WidgetProps } from './types';

/**
 * Aesthetic [P] — image tile + label; hover/focus reveals `why`. image_url is a
 * RESOLVED ref (Persona /ref route) that degrades to a text tile off-tailnet. Save
 * is human-gated (not here). Tags render as neutral data chips.
 */
export default function Aesthetic({ data }: WidgetProps<AestheticData>) {
  const tags = (data.tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <figure className="group relative overflow-hidden rounded-xl border border-border bg-surface-0">
      <div className="aspect-[4/3] w-full">
        {data.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.image_url} alt={data.label} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-2 p-4 text-center text-[13px] text-fg-muted">
            {data.label}
          </div>
        )}
      </div>
      <figcaption className="flex flex-col gap-1 p-2.5">
        <span className="text-[13px] font-semibold text-fg">{data.label}</span>
        <span className="text-[13px] leading-snug text-fg-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {data.why}
        </span>
        {tags.length > 0 && (
          <span className="mt-0.5 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-fg-subtle">
                {t}
              </span>
            ))}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
