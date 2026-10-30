"use client";

import { useEffect, useState } from "react";

import { cardClass } from "@/lib/ui";

/** How long a search runs before we explain that the server may be starting up. */
const SLOW_SEARCH_MS = 5000;

export function LoadingSkeleton() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_SEARCH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6" role="status" aria-label="Loading risk assessment">
      {slow && (
        <p
          className={`${cardClass} px-4 py-3 text-center text-sm text-ink-muted`}
          data-testid="warming-up-message"
        >
          <span className="font-semibold text-ink">Warming up…</span> The first search
          after a quiet period can take up to 20 seconds while the server starts. Thanks for
          waiting.
        </p>
      )}

      <div className="animate-pulse space-y-6">
        <div className="space-y-3">
          <div className="h-3 w-40 rounded-full bg-surface-2" />
          <div className="h-9 w-3/4 max-w-md rounded-lg bg-surface-2" />
        </div>

        <div className={`${cardClass} flex items-center gap-6 p-6 sm:p-8`}>
          <div className="h-32 w-32 shrink-0 rounded-full border-[10px] border-surface-2" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-28 rounded-full bg-surface-2" />
            <div className="h-12 w-40 rounded-lg bg-surface-2" />
            <div className="h-4 w-2/3 rounded-full bg-surface-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${cardClass} p-5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-surface-2" />
                  <div className="h-5 w-20 rounded-full bg-surface-2" />
                </div>
                <div className="h-5 w-14 rounded-full bg-surface-2" />
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="h-20 w-20 rounded-full border-8 border-surface-2" />
                <div className="h-4 w-20 rounded-full bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
