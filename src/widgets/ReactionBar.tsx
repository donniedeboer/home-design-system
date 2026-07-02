'use client';
import { useState } from 'react';
import type { Reaction, WidgetAction } from './types';
import { Input } from '../components/Field';
import Button from '../components/Button';

/**
 * ReactionBar — the ONE thumbs-up/down + optional-note control shared by every interactive
 * item card (ListingCard / MovieCard / DynamicCard). Emits the compact command grammar
 * documented in types.ts: `up <kind> <id>` / `down <kind> <id>`, or `up <kind> <id> | <note>`
 * when a note rides along. A persisted `reaction` on the card's data drives the filled state;
 * a click sets it optimistically. Selected thumbs use DATA hues (success/danger), never the
 * accent. A thumb clicked while the note field is CLOSED sends immediately; while it's open,
 * the click only selects — submitting the note sends both together.
 */
export default function ReactionBar({
  kind,
  id,
  reaction,
  onAction,
}: {
  kind: string;
  id: string;
  reaction?: Reaction;
  onAction: WidgetAction;
}) {
  const [picked, setPicked] = useState<Reaction | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  // Optimistic local pick wins; fall back to the persisted reaction (junk values ignored).
  const current = picked ?? (reaction === 'up' || reaction === 'down' ? reaction : undefined);

  const send = (r: Reaction, text?: string) => {
    const trimmed = text?.trim();
    onAction(trimmed ? `${r} ${kind} ${id} | ${trimmed}` : `${r} ${kind} ${id}`);
  };

  const onThumb = (r: Reaction) => {
    setPicked(r);
    if (!noteOpen) send(r);
  };

  const submitNote = () => {
    if (!current || !note.trim()) return; // a note always rides WITH a chosen thumb
    send(current, note);
    setNote('');
    setNoteOpen(false);
  };

  const thumbCls = (selected: boolean, tone: 'success' | 'danger') =>
    `relative flex h-7 min-h-[44px] min-w-[44px] items-center justify-center rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)] ${
      selected
        ? tone === 'success'
          ? 'bg-success-subtle text-success-text'
          : 'bg-danger-subtle text-danger-text'
        : 'text-fg-subtle hover:bg-surface-2 hover:text-fg'
    }`;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
      <button
        type="button"
        aria-label="Thumbs up"
        aria-pressed={current === 'up'}
        onClick={() => onThumb('up')}
        className={thumbCls(current === 'up', 'success')}
      >
        <ThumbIcon up filled={current === 'up'} />
      </button>
      <button
        type="button"
        aria-label="Thumbs down"
        aria-pressed={current === 'down'}
        onClick={() => onThumb('down')}
        className={thumbCls(current === 'down', 'danger')}
      >
        <ThumbIcon up={false} filled={current === 'down'} />
      </button>
      {noteOpen ? (
        <div className="flex min-w-[200px] flex-1 items-center gap-1.5">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitNote();
              } else if (e.key === 'Escape') {
                setNoteOpen(false);
                setNote('');
              }
            }}
            placeholder={current ? 'Add a note…' : 'Pick a thumb, then add a note…'}
            aria-label="Reaction note"
            autoFocus
            className="h-8"
          />
          <Button variant="secondary" size="sm" onClick={submitNote} disabled={!current || !note.trim()}>
            Send
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setNoteOpen(true)}>
          Add a note
        </Button>
      )}
    </div>
  );
}

function ThumbIcon({ up, filled }: { up: boolean; filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {up ? (
        <>
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
        </>
      ) : (
        <>
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
        </>
      )}
    </svg>
  );
}
