'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GalleryData, WidgetProps } from './types';

/**
 * Gallery [P] — compact = cover + "N photos" overlay + up to ~4 thumbs; full = a
 * thumb rail. Clicking any thumb opens an accessible lightbox: role=dialog +
 * aria-modal, Escape closes, arrow keys page, focus is trapped inside, and focus
 * returns to the trigger on close. Honors prefers-reduced-motion via CSS tokens.
 */
export default function Gallery({ data, variant = 'compact' }: WidgetProps<GalleryData>) {
  const images = data.images ?? [];
  const cover = data.cover_url ?? images[0]?.url;
  const [open, setOpen] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openAt = useCallback((i: number, el: HTMLButtonElement) => {
    triggerRef.current = el;
    setOpen(i);
  }, []);

  if (images.length === 0) return null;

  const thumbs = variant === 'compact' ? images.slice(0, 4) : images;

  return (
    <div className="rounded-xl border border-border bg-surface-0 p-2.5">
      {data.title && (
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">
          {data.title}
        </div>
      )}
      {variant === 'compact' ? (
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={(e) => openAt(0, e.currentTarget)}
            className="relative col-span-2 row-span-2 overflow-hidden rounded-md border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]"
            aria-label={`Open gallery, ${images.length} photos`}
          >
            <Thumb url={cover} alt={images[0]?.alt} className="aspect-square" />
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
              {images.length} photos
            </span>
          </button>
          {thumbs.slice(1, 4).map((img, i) => (
            <button
              key={i + 1}
              type="button"
              onClick={(e) => openAt(i + 1, e.currentTarget)}
              className="overflow-hidden rounded-md border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]"
              aria-label={img.alt ?? `Photo ${i + 2}`}
            >
              <Thumb url={img.url} alt={img.alt} className="aspect-square" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {thumbs.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => openAt(i, e.currentTarget)}
              className="h-24 w-32 shrink-0 overflow-hidden rounded-md border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]"
              aria-label={img.alt ?? `Photo ${i + 1}`}
            >
              <Thumb url={img.url} alt={img.alt} className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
      {open != null && (
        <Lightbox
          images={images}
          index={open}
          onIndex={setOpen}
          onClose={() => {
            setOpen(null);
            triggerRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}

function Thumb({ url, alt, className = '' }: { url?: string; alt?: string; className?: string }) {
  if (!url) {
    return <div className={`flex items-center justify-center bg-surface-2 text-fg-subtle ${className}`} aria-hidden>—</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt ?? ''} className={`object-cover ${className}`} loading="lazy" />;
}

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: GalleryData['images'];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    el?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        onIndex((index + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        onIndex((index - 1 + images.length) % images.length);
      } else if (e.key === 'Tab') {
        // trap focus within the dialog
        const focusables = el?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, onIndex]);

  const img = images[index];
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${images.length}`}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 outline-none"
      style={{ background: 'var(--color-overlay)' }}
    >
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-0/80 text-fg hover:bg-surface-2"
        >
          <span aria-hidden>✕</span>
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.url} alt={img.alt ?? `Photo ${index + 1}`} className="max-h-[80vh] max-w-full rounded-lg object-contain" />
      {images.length > 1 && (
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => onIndex((index - 1 + images.length) % images.length)}
            aria-label="Previous photo"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-0/80 text-fg hover:bg-surface-2"
          >
            <span aria-hidden>‹</span>
          </button>
          <span className="text-[13px] tabular-nums text-fg-muted">
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={() => onIndex((index + 1) % images.length)}
            aria-label="Next photo"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-0/80 text-fg hover:bg-surface-2"
          >
            <span aria-hidden>›</span>
          </button>
        </div>
      )}
    </div>
  );
}
