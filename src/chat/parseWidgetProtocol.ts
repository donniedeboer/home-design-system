import type { WidgetDescriptor } from '../widgets/types';

/**
 * STREAMING-SAFE widget-protocol parser.
 *
 * The agent emits inline widgets as a fenced code block whose info-string is
 * `widget`, containing JSON: {"type":"listing","data":{…}}. This function operates
 * on the RAW accumulated stream text (NOT a marked/DOM walk — marked auto-closes an
 * open fence into the same node mid-stream, so a DOM walk would render a half-typed
 * widget). We only emit a widget segment once its CLOSING ``` fence has arrived in
 * the accumulated string; an open (unterminated) trailing fence is withheld so the
 * caller can keep it out of the prose until it completes.
 *
 * Output is a stable, ordered list of segments. The `key` on a widget segment is
 * derived from its position + type + descriptor id so AgentChat can keep a mounted
 * widget stable across deltas (no re-mount per token).
 */

export type ChatSegment =
  | { kind: 'prose'; text: string; key: string }
  | { kind: 'widget'; descriptor: WidgetDescriptor; raw: string; key: string };

// Matches a fenced block opened with ``` (>=3 backticks) + info-string "widget".
// We scan manually rather than with a single global regex so we can distinguish a
// CLOSED block from a still-open trailing one.
const FENCE = /(^|\n)([ \t]*)(`{3,})[ \t]*widget[ \t]*\r?\n/;

/** Decode HTML entities that an upstream sanitizer/marked pass may have introduced. */
function htmlUnescape(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

function coerceDescriptor(body: string): WidgetDescriptor | null {
  try {
    const obj = JSON.parse(htmlUnescape(body.trim()));
    if (obj && typeof obj === 'object' && typeof obj.type === 'string' && 'data' in obj) {
      return obj as WidgetDescriptor;
    }
  } catch {
    /* not-yet-valid or malformed JSON → treat as unresolved */
  }
  return null;
}

function descriptorKey(d: WidgetDescriptor | null, index: number): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id = d ? (d.data as any)?.id ?? (d.data as any)?.propertyId ?? '' : '';
  return `w:${index}:${d?.type ?? 'unknown'}:${id}`;
}

/**
 * Parse accumulated text into ordered segments. Widgets are emitted only when their
 * closing fence is present. A trailing OPEN widget fence is dropped from the output
 * (its prose prefix, if any, is still emitted) so it never renders half-formed.
 */
export function parseWidgetProtocol(text: string): ChatSegment[] {
  const segments: ChatSegment[] = [];
  let rest = text;
  let cursor = 0;
  let widgetIdx = 0;

  while (rest.length > 0) {
    const open = FENCE.exec(rest);
    if (!open) {
      pushProse(segments, rest, cursor);
      break;
    }

    const openStart = open.index + open[1].length; // position of the fence line (after any leading \n)
    const fenceTicks = open[3];
    // Prose before the fence
    const before = rest.slice(0, openStart);
    if (before) pushProse(segments, before, cursor);
    cursor += before.length;

    // Body starts after the opening fence line
    const bodyStart = open.index + open[0].length;
    // Find the closing fence: a line that is only backticks (>= the opening count).
    const closeRe = new RegExp('\\n[ \\t]*`{' + fenceTicks.length + ',}[ \\t]*(?:\\r?\\n|$)');
    const after = rest.slice(bodyStart);
    const close = closeRe.exec(after);

    if (!close) {
      // Open, unterminated fence at the tail → withhold (still streaming).
      break;
    }

    const body = after.slice(0, close.index);
    const descriptor = coerceDescriptor(body);
    const rawBlock = rest.slice(openStart, bodyStart + close.index + close[0].length);
    if (descriptor) {
      segments.push({
        kind: 'widget',
        descriptor,
        raw: rawBlock,
        key: descriptorKey(descriptor, widgetIdx),
      });
    } else {
      // Closed but unparseable → fail soft as prose (show the raw block).
      pushProse(segments, rawBlock, cursor, `bad:${widgetIdx}`);
    }
    widgetIdx += 1;

    const consumed = bodyStart + close.index + close[0].length;
    cursor += consumed - openStart;
    rest = rest.slice(consumed);
  }

  return segments;
}

function pushProse(segments: ChatSegment[], text: string, cursorBase: number, keyOverride?: string) {
  if (!text) return;
  segments.push({ kind: 'prose', text, key: keyOverride ?? `p:${cursorBase}` });
}
