"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

import { ROADMAP_ITEMS, ROADMAP_STATUS_LABELS, type RoadmapItem, type RoadmapStatus } from "@/lib/roadmap";
import { eyebrowClass, linkClass } from "@/lib/ui";

const FOCUSABLE = 'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

// Not risk colors: a roadmap status is never a severity (docs/design-system.md, rule 2).
const STATUS_CHIP: Record<RoadmapStatus, string> = {
  next: "bg-accent-ink/10 text-accent-ink",
  "in-progress": "bg-accent-ink/10 text-accent-ink",
  exploring: "bg-surface-2 text-ink-muted",
};

function StatusChip({ status }: { status: RoadmapStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CHIP[status]}`}
    >
      {status === "in-progress" && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
      {ROADMAP_STATUS_LABELS[status]}
    </span>
  );
}

function RoadmapEntry({ item }: { item: RoadmapItem }) {
  const headingId = `roadmap-${item.id}`;

  return (
    <article aria-labelledby={headingId} className="rounded-xl border border-line bg-canvas p-4">
      <StatusChip status={item.status} />
      <h3 id={headingId} className="mt-2.5 text-base font-semibold text-ink">
        {item.title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-ink-muted">{item.summary}</p>

      {item.whatYoullSee.length > 0 && (
        <>
          <h4 className="mt-3 text-sm font-semibold text-ink">What you&rsquo;ll see</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-ink marker:text-ink-muted">
            {item.whatYoullSee.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </>
      )}

      {(item.howItWorks.length > 0 || item.sources.length > 0) && (
        <details className="group mt-3 border-t border-line pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded text-sm font-semibold text-accent-ink [&::-webkit-details-marker]:hidden">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 3 5 5-5 5" />
            </svg>
            How it works
          </summary>
          <div className="mt-2 space-y-2 text-sm leading-6 text-ink-muted">
            {item.howItWorks.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {item.sources.length > 0 && (
              <>
                <p className="font-semibold text-ink">Sources</p>
                <ul className="list-disc space-y-1 pl-5 marker:text-ink-muted">
                  {item.sources.map(({ label, href }) => (
                    <li key={label}>
                      {href ? (
                        <a href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
                          {label}
                        </a>
                      ) : (
                        label
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </details>
      )}
    </article>
  );
}

/**
 * Header "Next up" pill and the roadmap panel it opens: a popover under the pill from `sm` up,
 * a bottom sheet on phones. Items come from lib/roadmap.ts.
 */
export function RoadmapPanel({ onOpen }: { onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = useId();

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      // Keep focus inside the panel. Links in a closed <details> have no boxes, so skip them.
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      // Clicking another control shouldn't have its focus pulled back to the pill.
      const landedOnControl = target instanceof Element && target.closest(FOCUSABLE) !== null;
      close(false);
      // The browser moves focus to <body> on the mousedown that follows, so return it after that.
      if (!landedOnControl) setTimeout(() => buttonRef.current?.focus({ preventScroll: true }), 0);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => {
          if (open) {
            close();
          } else {
            onOpen?.();
            setOpen(true);
          }
        }}
        className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold tracking-wide transition-colors max-[359px]:px-2.5 ${
          open
            ? "border-brand-accent/60 bg-white/10 text-white"
            : "border-white/20 bg-white/5 text-white/90 hover:border-white/35 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span aria-hidden="true" className="next-up-dot h-2 w-2 shrink-0 rounded-full bg-brand-accent" />
        <span>
          Next<span className="max-[359px]:hidden"> up</span>
          <span className="sr-only">: upcoming features</span>
        </span>
      </button>

      {open && (
        <>
          {/* Dims the page behind the phone bottom sheet. Clicks on it close the panel. */}
          <div aria-hidden="true" className="fixed inset-0 z-40 bg-space-950/60 sm:hidden" />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            aria-labelledby={titleId}
            className="on-surface fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl border border-line bg-surface text-ink shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-3 sm:max-h-[calc(100dvh-6rem)] sm:w-[26rem] sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-3 pt-4">
              <div>
                <p className={`${eyebrowClass} text-accent-ink`}>Roadmap</p>
                <h2 id={titleId} className="mt-1 font-display text-2xl leading-tight text-ink">
                  What&rsquo;s coming next
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => close()}
                aria-label="Close"
                className="-mr-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-2 hover:text-ink"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
              {ROADMAP_ITEMS.map((item) => (
                <RoadmapEntry key={item.id} item={item} />
              ))}
            </div>

            <p className="border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs leading-5 text-ink-muted">
              Plans can change. We only ship what we can back with real data.{" "}
              <Link href="/methodology" className={linkClass} onClick={() => close(false)}>
                How we score today
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
