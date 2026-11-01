import { cardClass } from "@/lib/ui";

interface AISummaryProps {
  summary: string | null | undefined;
}

export function AISummary({ summary }: AISummaryProps) {
  if (!summary) return null;

  return (
    <section className={`${cardClass} relative overflow-hidden p-5 sm:p-6`}>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-accent via-sky-400/40 to-transparent"
      />
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-display text-3xl text-ink">AI Risk Analysis</h3>
        <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-accent-ink">
          AI-Generated
        </span>
      </div>

      <div className="mt-4 whitespace-pre-line leading-7 text-ink">{summary}</div>

      <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-muted">
        This summary is AI-generated and based on publicly available climate
        data. It does not constitute professional financial or legal advice.
      </p>
    </section>
  );
}
