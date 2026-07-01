'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GalleryData, WidgetProps } from './types';

/**
 * Gallery [P] — compact = cover + "N photos" overlay + up to ~4 thumbs; full = a
 * thumb rail. Clicking any thumb opens an accessible lightbox: role=dialog +
 * aria-modal, Escape closes, arrow keys page. On open, focus moves to the close
 * button; Tab/Shift+Tab are trapped (intercepted from the container itself, not just
 * at the first/last control, so focus can't escape); the background is scroll-locked
 * and marked inert + aria-hidden. Focus returns to the trigger on close. Honors
 * prefers-reduced-motion via CSS tokens.
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
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // On open: move focus to the first focusable control (the close button), lock
  // background scroll, and mark everything outside the dialog inert + aria-hidden so
  // AT and Tab can't escape. All restored on close. (Runs once per mount.)
  useEffect(() => {
    const el = dialogRef.current;
    closeRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Inert + hide every top-level sibling of the dialog's owner (the whole app
    // background). We toggle attributes and remember which we set so we only clear ours.
    const marked: HTMLElement[] = [];
    for (const node of Array.from(document.body.children)) {
      const child = node as HTMLElement;
      if (el && child.contains(el)) continue; // keep the branch that holds the dialog
      if (!child.hasAttribute('aria-hidden')) {
        child.setAttribute('aria-hidden', 'true');
        child.setAttribute('data-gallery-inert', '');
        // `inert` blocks focus/pointer inside the background subtree.
        (child as HTMLElement & { inert?: boolean }).inert = true;
        marked.push(child);
      }
    }

    return () => {
      document.body.style.overflow = overflow;
      for (const child of marked) {
        child.removeAttribute('aria-hidden');
        child.removeAttribute('data-gallery-inert');
        (child as HTMLElement & { inert?: boolean }).inert = false;
      }
    };
    // Only re-run on open/close (mount/unmount), not per page-change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = dialogRef.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        onIndex((index + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        onIndex((index - 1 + images.length) % images.length);
      } else if (e.key === 'Tab') {
        // Trap focus within the dialog. Intercept from the CONTAINER itself too (not
        // only at first/last), so focus can never land outside — if the active element
        // isn't inside the dialog, or is the tabIndex=-1 container, wrap to an edge.
        const focusables = el?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) {
          e.preventDefault();
          el?.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const inside = !!active && !!el && el.contains(active) && active !== el;
        if (!inside) {
          // focus escaped (or sits on the container) — pull it back to an edge.
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
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
          ref={closeRef}
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
