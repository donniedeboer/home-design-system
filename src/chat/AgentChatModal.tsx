'use client';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Modal from '../components/Modal';
import AgentChat, { type ChatMessage } from './AgentChat';
import { useAgentSession, type Entry, type OutgoingImage } from './useAgentSession';
import type { WidgetDescriptor, WidgetAction } from '../widgets/types';

/**
 * AgentChatModal — a Modal-or-docked shell hosting the shared AgentChat, driven by the
 * shared useAgentSession transport. Extracted from Persona's CuratorChat + CuratorModal so
 * Persona and Scout share ONE chat-in-a-panel implementation. The app varies only the
 * endpoint, the scope key, the dock, the intro/suggestions, and (optionally) how widget
 * actions are handled + how app-local widget types render.
 *
 * The system prompt is resolved SERVER-SIDE from `scopeKey` (Scout: "search:<id>",
 * Persona: "entity:<e>"), so the client never carries it. Accept/Dismiss + up/down
 * round-trip through the same session as an ordinary turn (the server's route applies the
 * write via its on_accept), unless the app overrides `onWidgetAction`.
 */

export type Dock = 'modal' | 'right' | 'bottom';

export interface SeedLine {
  role: 'assistant' | 'user';
  content: string;
}

export interface AgentChatModalProps {
  open: boolean;
  onClose: () => void;
  /** POST endpoint that starts a turn (server resolves the system prompt from scopeKey). */
  endpoint: string;
  /** Reattach endpoint base for reconnect/replay; only used when `reconnect`. */
  streamEndpoint?: string;
  /** Opaque scope for this conversation, e.g. "search:42". Sent in the request body. */
  scopeKey: string;
  reconnect?: boolean;
  dock?: Dock;
  title?: ReactNode;
  /** Quick-suggestion chips that PREFILL the composer (never auto-send). */
  suggestions?: string[];
  /** Prefill the composer when the modal OPENS (never auto-sends) — the "chat about THIS
   *  thing" entry point: the host addresses the subject, the person writes the ask. */
  initialDraft?: string;
  /** Host control rendered in the header next to the close button — e.g. Scout's
   *  "Continue in Omni" graduate action. */
  headerAction?: ReactNode;
  /** Local intro transcript (not sent to the model — the server owns history via scopeKey). */
  seedLines?: SeedLine[];
  placeholder?: string;
  /** Override the request body (default: { message, scopeKey }). */
  buildBody?: (text: string, scopeKey: string) => unknown;
  /** Handle a widget command string (default: send it back through the session). */
  onWidgetAction?: WidgetAction;
  /** Supply app-local widget types (e.g. Scout's 'plan'); falls back to the shared registry. */
  renderWidget?: (descriptor: WidgetDescriptor, onAction: WidgetAction) => ReactNode;
  className?: string;
}

function entriesToMessages(seed: SeedLine[], entries: Entry[]): ChatMessage[] {
  const seeded: ChatMessage[] = seed.map((s, i) => ({ id: `seed${i}`, role: s.role, content: s.content }));
  const mapped: ChatMessage[] = [];
  entries.forEach((e, i) => {
    if (e.kind === 'user') mapped.push({ id: e.id, role: 'user', content: e.text });
    else if (e.kind === 'assistant') mapped.push({ id: e.id, role: 'assistant', content: e.text, streaming: e.streaming });
    else if (e.kind === 'error') mapped.push({ id: `err${i}`, role: 'assistant', content: `⚠ ${e.message}` });
    else if (e.kind === 'question') mapped.push({ id: `q${i}`, role: 'assistant', content: e.question });
    else if (e.kind === 'retry') mapped.push({ id: `retry${i}`, role: 'assistant', content: e.message });
    // 'tool' lines are omitted in the compact modal surface (Omni's full chat renders them).
  });
  return [...seeded, ...mapped];
}

export default function AgentChatModal({
  open,
  onClose,
  endpoint,
  streamEndpoint,
  scopeKey,
  reconnect,
  dock = 'modal',
  title,
  suggestions,
  initialDraft,
  headerAction,
  seedLines = [],
  placeholder,
  buildBody,
  onWidgetAction,
  renderWidget,
  className,
}: AgentChatModalProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const body = useCallback(
    (text: string, images: OutgoingImage[], _ctx: { sessionId: string | null }) =>
      buildBody ? buildBody(text, scopeKey) : { message: text, scopeKey, ...(images.length ? { images } : {}) },
    [buildBody, scopeKey],
  );

  const session = useAgentSession({ endpoint, streamEndpoint, buildBody: body, reconnect });
  const messages = useMemo(() => entriesToMessages(seedLines, session.state.entries), [seedLines, session.state.entries]);

  // Prefill the composer without sending (native setter + input event, then focus).
  const prefill = useCallback((text: string) => {
    const ta = rootRef.current?.querySelector<HTMLTextAreaElement>('textarea');
    if (!ta) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(ta, text);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    ta.setSelectionRange(text.length, text.length);
  }, []);

  useEffect(() => {
    if (!open || !initialDraft) return;
    // Next tick: the dock/modal content (and its textarea) must exist before we can prefill.
    const t = setTimeout(() => prefill(initialDraft), 0);
    return () => clearTimeout(t);
  }, [open, initialDraft, prefill]);

  const handleWidgetAction = useCallback<WidgetAction>(
    (cmd) => {
      if (onWidgetAction) onWidgetAction(cmd);
      else session.send(cmd);
    },
    [onWidgetAction, session],
  );

  const inner = (
    <div ref={rootRef} className={`flex h-full min-h-0 flex-col ${className ?? ''}`}>
      {title ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0 truncate text-[15px] font-semibold text-fg">{title}</div>
          {headerAction ? <div className="ml-auto shrink-0">{headerAction}</div> : null}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-fg-subtle transition-colors hover:text-fg"
          >
            ✕
          </button>
        </div>
      ) : null}
      {suggestions && suggestions.length ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => prefill(s)}
              className="rounded-full border border-border bg-surface-1 px-2.5 py-1 text-[11.5px] text-fg-muted transition-colors hover:border-accent-muted hover:text-accent-text"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}
      <AgentChat
        messages={messages}
        onSend={(text, images, previews) => session.send(text, images, previews)}
        onWidgetAction={handleWidgetAction}
        renderWidget={renderWidget}
        busy={session.state.busy}
        placeholder={placeholder ?? 'Message…'}
        className="min-h-0 flex-1"
      />
    </div>
  );

  if (dock === 'modal') {
    return (
      <Modal open={open} onClose={onClose}>
        <div className="flex h-[min(600px,80vh)] w-full flex-col p-1">{inner}</div>
      </Modal>
    );
  }

  // Docked drawer (right rail on desktop, bottom sheet). position:fixed is fine in a real app.
  if (!open) return null;
  const panelPos =
    dock === 'right'
      ? 'right-0 top-0 h-full w-[min(400px,92vw)] border-l'
      : 'inset-x-0 bottom-0 h-[min(70vh,560px)] rounded-t-2xl border-t';
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <aside className={`absolute ${panelPos} flex flex-col border-border bg-surface-1 p-3 shadow-soft`}>
        {inner}
      </aside>
    </div>
  );
}
