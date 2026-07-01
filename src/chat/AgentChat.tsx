'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { parseWidgetProtocol, type ChatSegment } from './parseWidgetProtocol';
import { Widget } from '../widgets/registry';
import type { WidgetDescriptor, WidgetAction } from '../widgets/types';

export type ChatRole = 'user' | 'assistant';
export interface ChatMessage {
  id: string;
  role: ChatRole;
  /** RAW accumulated text (assistant messages may contain the ```widget fenced protocol). */
  content: string;
  /** true while this message is still streaming (drives the caret). */
  streaming?: boolean;
}

/**
 * AgentChat — a PRESENTATIONAL, transport-agnostic streaming chat surface. The app
 * feeds it deltas from its OWN SSE/fetch; AgentChat owns none of the transport.
 *
 * Two ways to drive it (pick one):
 *   • controlled: pass `messages` (+ update them as your stream lands).
 *   • token stream: pass `stream`, an async iterable/generator of ChatStreamEvents;
 *     AgentChat accumulates assistant text and re-renders. Prose + inline widgets are
 *     parsed on the RAW accumulated text (closing-fence scan) so a widget mounts only
 *     once complete and STABLE widgets are not re-mounted per delta.
 *
 * The composer round-trips a plain string via `onSend`. Widget interactions
 * round-trip a compact command string via `onWidgetAction` (defaults to onSend).
 *
 * Accessibility: the message list is role=log + aria-live=polite; every turn has a
 * visible/accessible speaker label ("You" / "Assistant"), not a color rail alone.
 */
export type ChatStreamEvent =
  | { type: 'user'; id?: string; text: string }
  | { type: 'assistant-start'; id?: string }
  | { type: 'assistant-delta'; text: string }
  | { type: 'assistant-end' };

export interface AgentChatProps {
  /** controlled transcript (mutually exclusive with `stream`). */
  messages?: ChatMessage[];
  /** async token stream the app feeds from its own transport. */
  stream?: AsyncIterable<ChatStreamEvent>;
  /** composer submit. */
  onSend?: (text: string) => void;
  /** widget interaction round-trip; defaults to onSend. */
  onWidgetAction?: WidgetAction;
  /** render a widget descriptor (override to use in-app renderers); defaults to the shared registry. */
  renderWidget?: (descriptor: WidgetDescriptor, onAction: WidgetAction) => ReactNode;
  /** the 3px accent left-rule marking assistant turns (default true). */
  assistantRail?: boolean;
  placeholder?: string;
  /** disable the composer (e.g. while a turn is in flight). */
  busy?: boolean;
  /** optional header/userbar slot above the log. */
  header?: ReactNode;
  className?: string;
}

let autoId = 0;
const nextId = () => `m${++autoId}`;

export default function AgentChat({
  messages: controlled,
  stream,
  onSend,
  onWidgetAction,
  renderWidget,
  assistantRail = true,
  placeholder = 'Message…',
  busy = false,
  header,
  className = '',
}: AgentChatProps) {
  const [streamed, setStreamed] = useState<ChatMessage[]>([]);
  const messages = controlled ?? streamed;

  // Consume the async token stream (uncontrolled mode).
  useEffect(() => {
    if (!stream) return;
    let alive = true;
    (async () => {
      for await (const ev of stream) {
        if (!alive) return;
        setStreamed((prev) => reduceStream(prev, ev));
      }
    })();
    return () => {
      alive = false;
    };
  }, [stream]);

  const widgetAction: WidgetAction = useCallback(
    (msg) => (onWidgetAction ? onWidgetAction(msg) : onSend?.(msg)),
    [onWidgetAction, onSend],
  );

  // Sticky-scroll: stay pinned to bottom unless the user scrolled up (>60px).
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`}>
      {header}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation"
        className="flex-1 space-y-4 overflow-y-auto px-1 py-3"
      >
        {messages.map((m) =>
          m.role === 'user' ? (
            <UserTurn key={m.id} text={m.content} />
          ) : (
            <AssistantTurn
              key={m.id}
              message={m}
              rail={assistantRail}
              renderWidget={renderWidget}
              onWidgetAction={widgetAction}
            />
          ),
        )}
      </div>
      {onSend && <Composer onSend={onSend} placeholder={placeholder} busy={busy} />}
    </div>
  );
}

/** Reducer for the uncontrolled token-stream path. */
function reduceStream(prev: ChatMessage[], ev: ChatStreamEvent): ChatMessage[] {
  switch (ev.type) {
    case 'user':
      return [...prev, { id: ev.id ?? nextId(), role: 'user', content: ev.text }];
    case 'assistant-start':
      return [...prev, { id: ev.id ?? nextId(), role: 'assistant', content: '', streaming: true }];
    case 'assistant-delta': {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant' || !last.streaming) {
        return [...prev, { id: nextId(), role: 'assistant', content: ev.text, streaming: true }];
      }
      const copy = prev.slice();
      copy[copy.length - 1] = { ...last, content: last.content + ev.text };
      return copy;
    }
    case 'assistant-end': {
      const last = prev[prev.length - 1];
      if (!last || last.role !== 'assistant') return prev;
      const copy = prev.slice();
      copy[copy.length - 1] = { ...last, streaming: false };
      return copy;
    }
    default:
      return prev;
  }
}

function UserTurn({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="mb-0.5 pr-1 text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">
        You
      </span>
      <div className="max-w-[80%] whitespace-pre-wrap rounded-xl rounded-br-sm bg-[#202024] px-3 py-2 text-[15px] leading-[1.6] text-fg">
        {text}
      </div>
    </div>
  );
}

function AssistantTurn({
  message,
  rail,
  renderWidget,
  onWidgetAction,
}: {
  message: ChatMessage;
  rail: boolean;
  renderWidget?: (descriptor: WidgetDescriptor, onAction: WidgetAction) => ReactNode;
  onWidgetAction: WidgetAction;
}) {
  // Parse on RAW accumulated text; memoize on content so stable widgets don't re-mount.
  const segments = useMemo<ChatSegment[]>(
    () => parseWidgetProtocol(message.content),
    [message.content],
  );

  return (
    <div className={rail ? 'border-l-[3px] border-[color:var(--color-accent)] pl-3' : ''}>
      <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-[0.09em] text-fg-subtle">
        Assistant
      </span>
      <div className="space-y-3">
        {segments.map((seg) =>
          seg.kind === 'prose' ? (
            <p key={seg.key} className="whitespace-pre-wrap text-[15px] leading-[1.6] text-fg">
              {seg.text}
            </p>
          ) : (
            <div key={seg.key}>
              {renderWidget
                ? renderWidget(seg.descriptor, onWidgetAction)
                : <Widget descriptor={seg.descriptor} onAction={onWidgetAction} />}
            </div>
          ),
        )}
        {message.streaming && <StreamingCaret />}
      </div>
    </div>
  );
}

/** The single blinking accent streaming caret — the one persistent animation. */
function StreamingCaret() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-pulse bg-[color:var(--color-accent)] align-text-bottom"
    />
  );
}

function Composer({
  onSend,
  placeholder,
  busy,
}: {
  onSend: (text: string) => void;
  placeholder: string;
  busy: boolean;
}) {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const submit = () => {
    const t = value.trim();
    if (!t || busy) return;
    onSend(t);
    setValue('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  return (
    <div className="border-t border-border pt-2">
      <div className="flex items-end gap-2 rounded-2xl border border-border-control bg-surface-0 px-3 py-2 focus-within:border-[color:var(--color-accent)]">
        <textarea
          ref={taRef}
          value={value}
          rows={1}
          placeholder={placeholder}
          aria-label="Message"
          onChange={(e) => {
            setValue(e.target.value);
            const el = e.target;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 160) + 'px';
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-40 flex-1 resize-none bg-transparent text-[15px] leading-[1.5] text-fg outline-none placeholder:text-fg-subtle"
        />
        <button
          type="button"
          onClick={submit}
          disabled={busy || !value.trim()}
          aria-label="Send message"
          className="flex h-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[color:var(--color-accent-btn)] px-3 text-[color:var(--color-accent-fg)] transition-colors hover:bg-[color:var(--color-accent-btn-hover)] disabled:opacity-40"
        >
          <span aria-hidden>↑</span>
        </button>
      </div>
    </div>
  );
}
