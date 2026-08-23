const dataSources = [
  {
    name: "NOAA",
    detail: "Weather observations, extreme heat records, and hurricane history.",
  },
  {
    name: "NASA EarthData",
    detail: "Satellite-derived environmental and wildfire signals.",
  },
  {
    name: "FEMA NFHL",
    detail: "Official flood-zone and flood-hazard information.",
  },
  {
    name: "USGS",
    detail: "Geographic and hazard datasets that support location-level analysis.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-brand-primary px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-accent">
            About ClimateRisk
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Better property decisions start with clearer climate data.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
            ClimateRisk helps investors, developers, and lenders understand
            address-level climate exposure before capital is committed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold text-brand-primary">Data sources</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {dataSources.map((source) => (
            <article
              key={source.name}
              className="rounded-lg border border-zinc-200 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-brand-primary">{source.name}</h3>
              <p className="mt-2 leading-7 text-zinc-600">{source.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-zinc-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-semibold text-brand-primary">How scoring works</h2>
          <p className="mt-5 leading-8 text-zinc-700">
            Flood, hurricane, heat, and wildfire measurements are normalized into
            0–100 hazard scores. Weighted scores produce an overall result and a
            Go, Caution, or Avoid verdict.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold text-brand-primary">Founder</h2>
        <div className="mt-6 rounded-lg border border-zinc-200 p-6">
          <h3 className="text-xl font-semibold text-brand-primary">Dagim — Founder</h3>
          <p className="mt-3 leading-7 text-zinc-600">
            Dagim founded ClimateRisk to make fragmented public climate data
            practical for consequential property decisions, turning complex hazard
            signals into clear and actionable risk intelligence.
          </p>
        </div>
      </section>
    </div>
  );
}
