interface AISummaryProps {
  summary: string | null | undefined;
}

export function AISummary({ summary }: AISummaryProps) {
  if (!summary) return null;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-brand-primary">
          AI Risk Analysis
        </h3>
        <span className="rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-semibold text-brand-accent">
          AI-Generated
        </span>
      </div>

      <div className="mt-4 whitespace-pre-line leading-7 text-zinc-700">
        {summary}
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-400">
        This summary is AI-generated and based on publicly available climate
        data. It does not constitute professional financial or legal advice.
      </p>
    </section>
  );
}
