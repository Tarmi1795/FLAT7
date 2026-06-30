"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type AppDialogProps = {
  open: boolean;
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

const focusableSelector = [
  "[data-autofocus]",
  "input:not([disabled]):not([type='file']):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled]):not([data-dialog-close])",
  "a[href]",
].join(",");

export function AppDialog({ open, title, eyebrow, onClose, children, className = "" }: AppDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(focusableSelector);
      (target || panelRef.current)?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="app-dialog-overlay"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={panelRef}
        className={`app-dialog-panel ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="app-dialog-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={titleId} className="mt-2 text-2xl font-bold text-white">{title}</h2>
          </div>
          <button type="button" className="icon-button shrink-0" onClick={onClose} data-dialog-close aria-label={`Close ${title}`}>
            <X className="size-5" />
          </button>
        </div>
        <div className="app-dialog-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
