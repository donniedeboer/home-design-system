'use client';
import { useMemo } from 'react';
import { marked, type MarkedOptions } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Markdown — renders GitHub-flavored markdown as SANITIZED HTML for assistant prose.
 *
 * Why this exists: Omni's assistant messages are markdown-rich (headings, lists, links,
 * images, code, bold, tables). AgentChat used to render prose as plain text in a
 * <p class="whitespace-pre-wrap">, which showed that markdown as raw source. This
 * component parses each PROSE segment (the widget-protocol fences are handled upstream
 * by parseWidgetProtocol and never reach here) and renders it safely.
 *
 * Safety model:
 *   • marked → HTML string (GFM: tables, autolinks; NO raw-HTML pass-through — we don't
 *     enable `mangle`/`headerIds` legacy junk, and we run everything through DOMPurify).
 *   • DOMPurify strips <script>/<style>/event handlers/js: URLs. We additionally force
 *     every anchor to rel="noopener noreferrer nofollow" + target="_blank" via a hook.
 *   • Styling is applied via a scoped className ("ds-md") whose rules live in the DS
 *     stylesheet, so images get the same max-width/rounded treatment as widget imagery
 *     (multiple ![](url) read as an inline gallery).
 *
 * Streaming: this renders the ACCUMULATING prose text every delta. marked tolerates a
 * partially-typed markdown document (a half-open ```widget fence never reaches here —
 * parseWidgetProtocol withholds it), so streaming stays smooth.
 */

// GFM on; do not let marked inject header ids / mangled mailto — keep output minimal
// and deterministic. We sanitize afterwards regardless.
const MARKED_OPTIONS: MarkedOptions = {
  gfm: true,
  breaks: true,
};

// Force safe link behavior on every anchor. Registered once (idempotent guard below).
let hooksInstalled = false;
function installHooks() {
  if (hooksInstalled) return;
  // DOMPurify.addHook is only meaningful where a DOM exists.
  if (typeof window === 'undefined' || !DOMPurify.addHook) return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
    // Lazy-load images so a wall of ![](url) doesn't stall the stream.
    if (node.tagName === 'IMG') {
      node.setAttribute('loading', 'lazy');
      node.setAttribute('decoding', 'async');
    }
  });
  hooksInstalled = true;
}

function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { ...MARKED_OPTIONS, async: false }) as string;
  // Without a DOM (SSR), skip sanitization AND rendering of raw HTML — return escaped
  // text so nothing unsafe is ever emitted server-side. The client re-renders on hydrate.
  if (typeof window === 'undefined' || !DOMPurify.sanitize) {
    return '';
  }
  installHooks();
  return DOMPurify.sanitize(rawHtml, {
    // Block anything that could execute or exfiltrate. No <script>, <style>, <iframe>,
    // <form>, event handlers (default), or javascript: URLs (default).
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'link', 'meta'],
    FORBID_ATTR: ['style'],
    ALLOW_DATA_ATTR: false,
  });
}

export interface MarkdownProps {
  /** raw markdown source (prose segment; widget fences already stripped upstream). */
  children: string;
  className?: string;
}

export default function Markdown({ children, className = '' }: MarkdownProps) {
  const html = useMemo(() => renderMarkdown(children), [children]);
  // eslint-disable-next-line react/no-danger
  return <div className={`ds-md ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
