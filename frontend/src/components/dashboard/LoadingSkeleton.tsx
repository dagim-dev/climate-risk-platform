"use client";

import { useEffect, useState } from "react";

/** How long a search runs before we explain that the server may be starting up. */
const SLOW_SEARCH_MS = 5000;

export function LoadingSkeleton() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_SEARCH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8" role="status" aria-label="Loading risk assessment">
      {slow && (
        <p
          className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center text-sm text-zinc-600 shadow-sm"
          data-testid="warming-up-message"
        >
          <span className="font-medium text-brand-primary">Warming up…</span> The first search
          after a quiet period can take up to 20 seconds while the server starts. Thanks for
          waiting.
        </p>
      )}

      <div className="animate-pulse space-y-8">
        <div className="h-40 w-full rounded-xl bg-zinc-200" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 rounded bg-zinc-200" />
                <div className="h-5 w-16 rounded-full bg-zinc-200" />
              </div>
              <div className="mt-4 h-10 w-24 rounded bg-zinc-200" />
              <div className="mt-3 h-2 w-full rounded-full bg-zinc-200" />
              <div className="mt-4 h-4 w-28 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
