// Canonical SSE frame reader for the home platform's agent endpoints. Servers emit
// `event: <name>\ndata: <json>\n\n` frames plus `:hb` heartbeats; this reads a Response
// body to its end, invoking `onFrame` per parsed frame. The caller decides terminal
// handling from the returned status. Extracted from Omni (its api.ts) so every app —
// Omni, Persona, Scout — shares one parser instead of forking it.

export interface SseFrame {
  event: string;
  data: Record<string, unknown>;
}

export type ConsumeStatus = 'done' | 'interrupted' | 'dropped';

/**
 * Read an SSE response, dispatching frames. Resolves when the caller's `onFrame`
 * returns a terminal `ConsumeStatus` (from a done/interrupted/gone frame) or the
 * stream drops. Never throws — a read error resolves to `"dropped"`.
 */
export async function consumeSse(
  resp: Response,
  onFrame: (f: SseFrame) => ConsumeStatus | void,
): Promise<ConsumeStatus> {
  if (!resp.body) return 'dropped';
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let terminal: ConsumeStatus | null = null;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const parsed = parseFrame(frame);
        if (parsed) {
          const t = onFrame(parsed);
          if (t) terminal = t;
        }
      }
      if (terminal) break;
    }
  } catch {
    return 'dropped';
  }
  return terminal || 'dropped';
}

export function parseFrame(frame: string): SseFrame | null {
  let event = 'message';
  let data = '';
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data) return null; // heartbeat (":hb") or comment
  try {
    return { event, data: JSON.parse(data) as Record<string, unknown> };
  } catch {
    return null;
  }
}
