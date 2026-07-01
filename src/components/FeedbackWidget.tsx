'use client';
import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * FeedbackWidget — promoted from the byte-identical duplicate in every repo. A
 * floating trigger that opens a small feedback composer POSTing to `endpoint`.
 */
export default function FeedbackWidget({ endpoint = '/api/feedback' }: { endpoint?: string } = {}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), path: typeof location !== 'undefined' ? location.pathname : '' }),
      });
      setSent(true);
      setText('');
    } catch {
      /* offline — swallow */
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSent(false);
          setOpen(true);
        }}
        aria-label="Send feedback"
        className="fixed bottom-4 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border-control bg-surface-0 text-fg-muted shadow-pop transition-colors hover:text-fg"
      >
        <span aria-hidden>✎</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="p-4">
          <h2 className="text-md font-semibold text-fg">Feedback</h2>
          {sent ? (
            <p className="mt-3 text-sm text-fg-muted">Thanks — sent.</p>
          ) : (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="What's on your mind?"
                className="mt-3 w-full rounded-lg border border-border-control bg-surface-0 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus-visible:border-[color:var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-ring)]"
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={send} disabled={busy || !text.trim()}>
                  Send
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
