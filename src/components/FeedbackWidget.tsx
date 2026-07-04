'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * FeedbackWidget — the ONE shared feedback surface for every app (except Omni). A floating
 * button opens a small multi-turn composer that POSTs `{ thread, context }` to `endpoint`; the
 * backend may ask ONE clarifying question, then files a ticket and returns it. App-agnostic:
 * pass `appName` (stamped into the context) and `endpoint` (default `/api/feedback`).
 *
 * Promoted from the byte-identical per-app copies (Scout/Pulse) so there is one component, one
 * behavior, everywhere. The backend contract is unchanged, so existing routes keep working.
 */

type Role = 'user' | 'assistant';
export interface FeedbackThreadMessage {
  role: Role;
  text: string;
}
type Created = {
  status: 'created';
  issue: { url: string; identifier: string; title: string };
  duplicate: boolean;
};
type FeedbackResponse =
  | { status: 'need_clarification'; question: string; round?: number }
  | Created
  | { status: 'error'; error: string };

type Status = 'composing' | 'creating' | 'created' | 'error';

// Capture the last few console errors so a report can carry them (opt-in, cheap, no PII beyond
// what the app already logs). Wired lazily on first mount.
const recentErrors: string[] = [];
let wired = false;
function initConsoleCapture() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  const orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      recentErrors.push(args.map((a) => String(a)).join(' ').slice(0, 500));
      if (recentErrors.length > 10) recentErrors.shift();
    } catch {
      /* never let logging break the app */
    }
    orig(...(args as []));
  };
}

export default function FeedbackWidget({
  appName = '',
  endpoint = '/api/feedback',
  trigger = 'floating',
}: {
  appName?: string;
  endpoint?: string;
  /** 'floating' = the legacy bottom-right FAB. 'inline' = a compact TopNav-actions button
   *  (mount next to the identity chip) whose panel drops below the nav — the FAB kept
   *  colliding with docked chat panels (owner ruling: feedback lives up top, out of the way). */
  trigger?: 'floating' | 'inline';
} = {}) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<FeedbackThreadMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('composing');
  const [created, setCreated] = useState<Created | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    initConsoleCapture();
  }, []);

  const context = useCallback(
    () => ({
      app: appName,
      route: typeof location !== 'undefined' ? location.pathname : '',
      url: typeof location !== 'undefined' ? location.href : '',
      consoleErrors: recentErrors.slice(-10),
    }),
    [appName],
  );

  const reset = useCallback(() => {
    setThread([]);
    setInput('');
    setStatus('composing');
    setCreated(null);
    setErrorMsg(null);
  }, []);

  const send = useCallback(
    async (nextThread: FeedbackThreadMessage[]) => {
      sendingRef.current = true;
      setStatus('creating');
      setErrorMsg(null);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ thread: nextThread, context: context() }),
        });
        const data = (await res.json()) as FeedbackResponse;
        if (data.status === 'need_clarification') {
          setThread([...nextThread, { role: 'assistant', text: data.question }]);
          setStatus('composing');
        } else if (data.status === 'created') {
          setCreated(data);
          setStatus('created');
        } else {
          setErrorMsg(data.error || 'Something went wrong.');
          setStatus('error');
        }
      } catch {
        setErrorMsg("Couldn't reach the server — check your connection and retry.");
        setStatus('error');
      } finally {
        sendingRef.current = false;
      }
    },
    [endpoint, context],
  );

  const onSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || sendingRef.current) return;
    const nextThread: FeedbackThreadMessage[] = [...thread, { role: 'user', text }];
    setThread(nextThread);
    setInput('');
    void send(nextThread);
  }, [input, thread, send]);

  const onRetry = useCallback(() => {
    if (!sendingRef.current) void send(thread);
  }, [thread, send]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, status]);

  const round = thread.filter((m) => m.role === 'assistant').length;

  if (!open) {
    if (trigger === 'inline') {
      return (
        <button
          type="button"
          aria-label="Send feedback"
          title="Send feedback"
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]"
        >
          <ChatIcon />
        </button>
      );
    }
    return (
      <button
        type="button"
        aria-label="Send feedback"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg shadow-pop transition-colors hover:bg-accent-hover"
      >
        <ChatIcon />
      </button>
    );
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed z-50 w-[360px] max-w-[calc(100vw-2rem)] ${
        trigger === 'inline' ? 'right-4 top-14' : 'bottom-4 right-4'
      }`}
    >
      <div className="flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface-0 shadow-pop">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-fg">Send feedback</span>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="-mr-1 rounded-md p-1 text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <CloseIcon />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {thread.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}

          {status === 'creating' && (
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              <Spinner />
              Filing your ticket…
            </div>
          )}

          {status === 'created' && created && <CreatedView created={created} />}

          {status === 'error' && (
            <div className="rounded-lg border border-danger-subtle bg-danger-subtle px-3 py-2 text-sm text-danger-text">
              {errorMsg}
            </div>
          )}

          {thread.length === 0 && status === 'composing' && (
            <p className="text-sm text-fg-muted">
              Spotted a bug or want a new feature? Describe it — I&apos;ll ask a quick question if
              needed, then file a ticket you can watch.
            </p>
          )}

          {status === 'composing' && round > 0 && (
            <p className="text-xs text-fg-subtle">Question {round} of 2</p>
          )}
        </div>

        {status === 'created' ? (
          <div className="flex gap-2 border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-3"
            >
              Send another
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="border-t border-border px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                rows={2}
                placeholder={round > 0 ? 'Your answer…' : "What's broken or what would you like?"}
                disabled={status === 'creating'}
                className="min-h-[44px] flex-1 resize-none rounded-lg border border-border-control bg-surface-0 px-3 py-2 text-fg outline-none focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={status === 'error' ? onRetry : onSubmit}
                disabled={status === 'creating' || (status !== 'error' && !input.trim())}
                className="h-11 shrink-0 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {status === 'error' ? 'Retry' : 'Send'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Bubble({ role, text }: { role: Role; text: string }) {
  const mine = role === 'user';
  return (
    <div className={mine ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
          mine ? 'bg-accent-subtle text-fg' : 'bg-surface-2 text-fg'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function CreatedView({ created }: { created: Created }) {
  const { issue, duplicate } = created;
  const safeUrl = issue.url?.startsWith('https://') ? issue.url : null;
  return (
    <div className="rounded-lg border border-success-subtle bg-success-subtle px-3 py-3 text-sm">
      <p className="text-success-text">
        {duplicate ? 'Looks like this is already tracked as ' : 'Filed '}
        <span className="font-semibold">{issue.identifier}</span>
        {duplicate ? '.' : ` — ${issue.title}`}
      </p>
      {safeUrl && (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-medium text-accent-text underline underline-offset-2"
        >
          Watch in Linear →
        </a>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-[color:var(--color-accent)]" />
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
