export function LoadingSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-4xl animate-pulse space-y-8"
      role="status"
      aria-label="Loading risk assessment"
    >
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

      <span className="sr-only">Loading...</span>
    </div>
  );
}
