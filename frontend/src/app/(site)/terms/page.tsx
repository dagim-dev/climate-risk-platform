export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-primary">Terms of Service</h1>
      <p className="mt-4 text-sm text-zinc-500">Last updated: August 26, 2026</p>
      <div className="mt-8 space-y-6 leading-7 text-zinc-700">
        <p>
          ClimateRisk is provided free of charge for informational purposes.
          Risk scores, verdicts, maps, trend charts, and AI summaries are not
          professional financial, insurance, engineering, or legal advice.
        </p>
        <p>
          Historical trend points are interpolated from the current analysis,
          not independent historical scores. Wildland-urban interface and
          fire-weather labels are inferred from fire counts and location.
        </p>
        <p>
          Data sources, APIs, and scoring methods can change. You are
          responsible for how you use the output in any investment, lending, or
          insurance decision.
        </p>
        <p>
          The software is licensed under the MIT License. The service is
          provided “as is,” without warranties of merchantability, fitness for a
          particular purpose, or non-infringement.
        </p>
      </div>
    </div>
  );
}
