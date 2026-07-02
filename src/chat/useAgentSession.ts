'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { consumeSse, type ConsumeStatus } from './consumeSse';

/**
 * useAgentSession — the shared agentic-chat engine for the home platform. Extracted from
 * Omni's useChat so Omni, Persona, and Scout drive ONE implementation of streaming +
 * turn-buffering + reconnect/replay instead of forking it. The transport specifics an app
 * varies (POST endpoint, reattach endpoint, request body, whether reconnect is on) are
 * options; the transcript model + SSE frame vocabulary are shared.
 *
 * Frame vocabulary the server may emit: turn{sessionId,turnId} · session{sessionId} ·
 * title{title} · text{text} · tool_use{name,summary} · question{question,options} ·
 * result · error{message} · done · interrupted|gone. Frames may carry a monotonic `seq`
 * for replay-dedup. Unknown events are ignored, so a server that emits a subset is fine.
 */

export interface OutgoingImage {
  media_type: string;
  data: string; // base64, no data: prefix
}

export interface ToolLine {
  kind: 'tool';
  name: string;
  summary?: string;
}
export interface QuestionCard {
  kind: 'question';
  question: string;
  options: string[];
  answered?: string;
}
export interface ErrLine {
  kind: 'error';
  message: string;
}
export interface RetryLine {
  kind: 'retry';
  message: string;
  retry: () => void;
}
export interface UserEntry {
  kind: 'user';
  id: string;
  text: string;
  author?: string | null;
  imageCount?: number;
  images?: { dataUrl: string }[];
}
export interface AssistantEntry {
  kind: 'assistant';
  id: string;
  text: string; // raw accumulated markdown (may contain the ```widget protocol)
  streaming?: boolean;
  tools?: { name: string; summary?: string }[];
}
export type Entry = UserEntry | AssistantEntry | ToolLine | QuestionCard | ErrLine | RetryLine;

export interface ChatState {
  entries: Entry[];
  busy: boolean;
  sessionId: string | null;
  title: string | null;
  owner: string | null;
  sharedWith: string[];
}

export interface LoadRecord {
  title?: string;
  user?: string | null;
  shared_with?: string[];
  messages?: {
    role: string;
    text?: string;
    images?: number;
    user?: string | null;
    tools?: { name: string; summary?: string }[];
  }[];
}

export interface AgentSessionOptions {
  /** POST endpoint that starts a new turn and returns an SSE stream. */
  endpoint: string;
  /** GET endpoint base for reattach/replay (`?sessionId&turnId&cursor`). Required if `reconnect`. */
  streamEndpoint?: string;
  /** Build the POST body for a turn. Apps inject identity/scope/context here. */
  buildBody: (text: string, images: OutgoingImage[], ctx: { sessionId: string | null }) => unknown;
  /** Enable turn-buffer reattach/replay (survive tab-sleep/network blips). Default false. */
  reconnect?: boolean;
  /** Initial owner (Omni-style multi-user chats); harmless/null elsewhere. */
  initialOwner?: string | null;
  /** Live sender identity for the author caption (defaults to `owner`). Omni passes
   *  () => currentUserRef.current so a SHARED chat stamps the sender, not the chat owner. */
  getAuthor?: () => string | null;
  /** Called when a turn finishes (e.g. refresh a history pane). */
  onTurnEnd?: () => void;
}

export interface UseAgentSession {
  state: ChatState;
  send: (text: string, images?: OutgoingImage[], previews?: { dataUrl: string }[]) => void;
  loadRecord: (id: string, rec: LoadRecord) => void;
  reset: (owner: string | null) => void;
  setEntries: React.Dispatch<React.SetStateAction<Entry[]>>;
  setSharedWith: (s: string[]) => void;
}

let uid = 0;
const nextId = () => `e${++uid}`;

export function useAgentSession(opts: AgentSessionOptions): UseAgentSession {
  const { endpoint, streamEndpoint, buildBody, reconnect = false, onTurnEnd } = opts;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(opts.initialOwner ?? null);
  const [sharedWith, setSharedWithState] = useState<string[]>([]);

  // Turn-scoped mutable state (not React state — updated per SSE frame).
  const sessionRef = useRef<string | null>(null);
  const turnId = useRef<string | null>(null);
  const maxSeq = useRef(-1);
  const liveId = useRef<string | null>(null);
  const liveAcc = useRef('');
  const attached = useRef(false);
  const reattaching = useRef(false);
  const lastMsg = useRef('');
  const lastImgs = useRef<OutgoingImage[]>([]);
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const turnEnd = useRef(onTurnEnd);
  turnEnd.current = onTurnEnd;
  const getAuthorRef = useRef(opts.getAuthor);
  getAuthorRef.current = opts.getAuthor;

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  const setSharedWith = useCallback((s: string[]) => setSharedWithState(s), []);
  const append = useCallback((e: Entry) => setEntries((prev) => [...prev, e]), []);

  const acquireWake = useCallback(async () => {
    try {
      if ('wakeLock' in navigator && !wakeLock.current)
        wakeLock.current = await navigator.wakeLock.request('screen');
    } catch {
      /* ignore */
    }
  }, []);
  const releaseWake = useCallback(() => {
    try {
      wakeLock.current?.release();
    } catch {
      /* ignore */
    }
    wakeLock.current = null;
  }, []);

  const applyText = useCallback((delta: string) => {
    setEntries((prev) => {
      const copy = prev.slice();
      let idx = liveId.current ? copy.findIndex((e) => e.kind === 'assistant' && e.id === liveId.current) : -1;
      if (idx < 0 && copy.length && copy[copy.length - 1].kind === 'assistant') idx = copy.length - 1;
      if (idx >= 0) {
        const cur = copy[idx] as AssistantEntry;
        liveId.current = cur.id;
        copy[idx] = { ...cur, text: cur.text + delta, streaming: true };
      } else {
        const id = nextId();
        liveId.current = id;
        copy.push({ kind: 'assistant', id, text: delta, streaming: true });
      }
      return copy;
    });
    liveAcc.current += delta;
  }, []);

  const stopLive = useCallback(() => {
    if (!liveId.current) return;
    const id = liveId.current;
    setEntries((prev) => prev.map((e) => (e.kind === 'assistant' && e.id === id ? { ...e, streaming: false } : e)));
    liveId.current = null;
    liveAcc.current = '';
  }, []);

  const endTurn = useCallback(() => {
    stopLive();
    turnId.current = null;
    maxSeq.current = -1;
    attached.current = false;
    releaseWake();
    setBusy(false);
    turnEnd.current?.();
  }, [stopLive, releaseWake]);

  const streamTurnRef = useRef<((text: string, images: OutgoingImage[]) => Promise<void>) | null>(null);

  const orphan = useCallback(() => {
    stopLive();
    const text = lastMsg.current;
    const imgs = lastImgs.current;
    turnId.current = null;
    maxSeq.current = -1;
    attached.current = false;
    releaseWake();
    setBusy(false);
    append({
      kind: 'retry',
      message: 'This turn was interrupted (the server restarted). Your message is saved — tap to resume.',
      retry: () => streamTurnRef.current?.(text, imgs),
    });
    turnEnd.current?.();
  }, [stopLive, releaseWake, append]);

  const handleFrame = useCallback(
    (event: string, obj: Record<string, unknown>): ConsumeStatus | void => {
      const seq = obj.seq;
      if (typeof seq === 'number') {
        if (seq <= maxSeq.current) return;
        maxSeq.current = seq;
      }
      if (event === 'turn') {
        const sid = obj.sessionId as string;
        setSessionId(sid);
        sessionRef.current = sid;
        turnId.current = (obj.turnId as string) || null;
      } else if (event === 'session') {
        const sid = obj.sessionId as string;
        setSessionId(sid);
        sessionRef.current = sid;
      } else if (event === 'title') {
        setTitle((obj.title as string) || null);
      } else if (event === 'question') {
        stopLive();
        append({
          kind: 'question',
          question: (obj.question as string) || 'Pick one:',
          options: ((obj.options as string[]) || []).map(String),
        });
      } else if (event === 'text') {
        applyText((obj.text as string) || '');
      } else if (event === 'tool_use') {
        stopLive();
        append({ kind: 'tool', name: (obj.name as string) || '', summary: obj.summary as string });
      } else if (event === 'result') {
        stopLive();
      } else if (event === 'proposal') {
        // Standalone proposal outcome (e.g. an accept applied/unsupported) — make it visible
        // (otherwise a widget Accept round-trip produces a silent, empty-looking turn).
        stopLive();
        const status = obj.status as string | undefined;
        const msg =
          (obj.message as string) ||
          (status === 'accepted' || status === 'committed'
            ? 'Applied ✓'
            : status === 'unsupported'
              ? "That didn't match a pending change."
              : '');
        if (msg) append({ kind: 'assistant', id: nextId(), text: msg });
      } else if (event === 'error') {
        stopLive();
        append({ kind: 'error', message: (obj.message as string) || 'unknown error' });
      } else if (event === 'done') {
        return 'done';
      } else if (event === 'interrupted' || event === 'gone') {
        return 'interrupted';
      }
    },
    [append, applyText, stopLive],
  );

  const reattachLoop = useCallback(async () => {
    const sid = sessionRef.current;
    if (!reconnect || !streamEndpoint) return;
    if (attached.current || reattaching.current || !turnId.current || !sid) return;
    reattaching.current = true;
    setBusy(true);
    acquireWake();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        let resp: Response;
        try {
          resp = await fetch(
            `${streamEndpoint}?sessionId=${encodeURIComponent(sid)}&turnId=${encodeURIComponent(
              turnId.current!,
            )}&cursor=${maxSeq.current}`,
            { signal: ctrl.signal },
          );
        } catch {
          await sleep(700 * (attempt + 1));
          continue;
        }
        if (!resp.ok || !resp.body) {
          await sleep(700 * (attempt + 1));
          continue;
        }
        attached.current = true;
        const status = await consumeSse(resp, (f) => handleFrame(f.event, f.data));
        attached.current = false;
        if (status === 'done') return endTurn();
        if (status === 'interrupted') return orphan();
        await sleep(600);
      }
      endTurn();
      append({
        kind: 'retry',
        message: "Still can't reconnect. Your progress is saved on the server — tap to resume.",
        retry: () => streamTurnRef.current?.(lastMsg.current, lastImgs.current),
      });
    } finally {
      reattaching.current = false;
    }
  }, [reconnect, streamEndpoint, acquireWake, handleFrame, endTurn, orphan, append]);

  const streamTurn = useCallback(
    async (text: string, images: OutgoingImage[]) => {
      setBusy(true);
      turnId.current = null;
      maxSeq.current = -1;
      liveId.current = null;
      liveAcc.current = '';
      lastMsg.current = text;
      lastImgs.current = images;
      acquireWake();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let resp: Response;
      try {
        resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(text, images, { sessionId: sessionRef.current })),
          signal: ctrl.signal,
        });
      } catch {
        endTurn();
        append({
          kind: 'retry',
          message: "Couldn't reach the server — check your connection.",
          retry: () => streamTurn(text, images),
        });
        return;
      }
      if (resp.status === 409) {
        const info = (await resp.json().catch(() => ({}))) as { turnId?: string };
        turnId.current = info.turnId || null;
        maxSeq.current = -1;
        // Reattach needs a session id for the stream URL; without one (e.g. a second tab that
        // never started a turn here) fall through to a visible error instead of wedging busy.
        if (turnId.current && reconnect && sessionRef.current) return reattachLoop();
        endTurn();
        append({ kind: 'error', message: 'A turn is already running on this chat.' });
        return;
      }
      if (!resp.ok || !resp.body) {
        const detail = await resp
          .json()
          .then((b) => (b && (b.detail || b.error)) || null)
          .catch(() => null);
        endTurn();
        append({ kind: 'error', message: detail || 'server error ' + resp.status });
        return;
      }
      attached.current = true;
      const status = await consumeSse(resp, (f) => handleFrame(f.event, f.data));
      attached.current = false;
      if (status === 'done') return endTurn();
      if (status === 'interrupted') return orphan();
      if (turnId.current && reconnect) return reattachLoop();
      endTurn();
      append({
        kind: 'retry',
        message:
          'Connection interrupted — your phone may have slept or the network blipped. Your progress is saved.',
        retry: () => streamTurn(text, images),
      });
    },
    [endpoint, buildBody, reconnect, acquireWake, endTurn, append, reattachLoop, handleFrame, orphan],
  );
  streamTurnRef.current = streamTurn;

  const send = useCallback(
    (text: string, images: OutgoingImage[] = [], previews: { dataUrl: string }[] = []) => {
      const t = text.trim();
      if ((!t && !images.length) || busy) return;
      append({
        kind: 'user',
        id: nextId(),
        text: t,
        author: getAuthorRef.current ? getAuthorRef.current() : owner,
        images: previews.length ? previews : undefined,
        imageCount: images.length,
      });
      void streamTurn(t, images);
    },
    [busy, append, owner, streamTurn],
  );

  const reset = useCallback((o: string | null) => {
    setEntries([]);
    setSessionId(null);
    sessionRef.current = null;
    setTitle(null);
    setOwner(o);
    setSharedWithState([]);
  }, []);

  const loadRecord = useCallback<UseAgentSession['loadRecord']>((id, rec) => {
    setSessionId(id);
    sessionRef.current = id;
    setTitle(rec.title || 'Chat');
    setOwner(rec.user || null);
    setSharedWithState(rec.shared_with || []);
    const list: Entry[] = [];
    for (const m of rec.messages || []) {
      if (m.role === 'user') {
        list.push({ kind: 'user', id: nextId(), text: m.text || '', author: m.user || null, imageCount: m.images || 0 });
      } else {
        for (const tl of m.tools || []) list.push({ kind: 'tool', name: tl.name, summary: tl.summary });
        if (m.text) list.push({ kind: 'assistant', id: nextId(), text: m.text });
      }
    }
    setEntries(list);
  }, []);

  // Reconnect on foreground / network return, mid-turn (only when reconnect is enabled).
  useEffect(() => {
    if (!reconnect) return;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      if (busy) acquireWake();
      if (busy && turnId.current && !attached.current) void reattachLoop();
    };
    const onOnline = () => {
      if (busy && turnId.current && !attached.current) void reattachLoop();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
    };
  }, [reconnect, busy, acquireWake, reattachLoop]);

  // Release the wake lock + abort any in-flight fetch on unmount.
  useEffect(
    () => () => {
      try {
        wakeLock.current?.release();
      } catch {
        /* ignore */
      }
      abortRef.current?.abort();
    },
    [],
  );

  return {
    state: { entries, busy, sessionId, title, owner, sharedWith },
    send,
    loadRecord,
    reset,
    setEntries,
    setSharedWith,
  };
}
