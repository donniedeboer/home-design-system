"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* Module-level modal stack so stacked modals behave: only the TOP-MOST modal
 * closes on Escape, and the body scroll-lock is reference-counted (set once on the
 * first open, restored once when the last closes — robust to non-LIFO unmounts). */
let modalStack: symbol[] = [];
let savedOverflow = "";

/** Phone-first modal: bottom sheet on narrow viewports, centered on desktop.
 * ESC + backdrop close, body scroll lock. Render its content as children. */
export default function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Keep the latest onClose in a ref so the keydown effect can depend only on
  // `open` (an inline onClose prop won't churn the stack on every parent
  // re-render). Update the ref in an effect — never assign to a ref during render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const id = Symbol("modal");
    modalStack.push(id);
    if (modalStack.length === 1) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    const onKey = (e: KeyboardEvent) => {
      // Only the top-most modal reacts to Escape.
      if (e.key === "Escape" && modalStack[modalStack.length - 1] === id) onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      modalStack = modalStack.filter((x) => x !== id);
      if (modalStack.length === 0) document.body.style.overflow = savedOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'var(--color-overlay)' }}
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface-0 shadow-pop sm:max-w-2xl sm:rounded-2xl">
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border-strong sm:hidden" />
        {children}
      </div>
    </div>,
    document.body,
  );
}
