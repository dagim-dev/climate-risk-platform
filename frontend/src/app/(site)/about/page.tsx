import { PageHero } from "@/components/ui/PageHero";
import { cardClass } from "@/lib/ui";

const dataSources = [
  {
    name: "NOAA",
    detail: "Annual counts of days at or above 90°F, and hurricane track history.",
  },
  {
    name: "FEMA NFHL",
    detail: "Official flood zones, queried from FEMA or its Esri Living Atlas mirror.",
  },
  {
    name: "USFS Wildfire Hazard Potential",
    detail: "2023 wildfire hazard classes for the land within 2 km of the property.",
  },
  {
    name: "NIFC fire perimeters",
    detail: "Mapped wildfire perimeters within 50 km over the last 20 years.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        eyebrow="About ClimateRisk"
        title="Better property decisions start with clearer climate data."
      >
        ClimateRisk helps investors, developers, and lenders understand
        address-level climate exposure before capital is committed. The
        platform is free for everyone.
      </PageHero>

      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-4xl text-ink">Data sources</h2>
        <p className="mt-4 max-w-3xl leading-7 text-ink-muted">
          Scores are built from NOAA, FEMA, USFS, and NIFC public datasets.
          NASA EarthData is not queried today.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {dataSources.map((source) => (
            <article key={source.name} className={`${cardClass} p-6`}>
              <h3 className="text-lg font-semibold text-ink">{source.name}</h3>
              <p className="mt-2 leading-7 text-ink-muted">{source.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-4xl text-ink">How scoring works</h2>
          <p className="mt-5 leading-8 text-ink">
            Flood, hurricane, heat, and wildfire measurements are normalized into
            0–100 hazard scores. Weighted scores produce an overall result and a
            Go, Caution, or Avoid verdict.
          </p>
          <ul className="mt-6 list-disc space-y-3 pl-6 text-ink">
            <li>
              Historical trend points are interpolated from the current score.
              They are not independent analyses of 2000, 2010, or 2020 data.
            </li>
            <li>
              Wildland-urban interface (WUI) and fire-weather labels are inferred
              from nearby fire counts and lat/lng, not official WUI or NWS fire
              weather zone maps.
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-4xl text-ink">Founder</h2>
        <div className={`${cardClass} mt-6 p-6`}>
          <h3 className="text-xl font-semibold text-ink">Dagim — Founder</h3>
          <p className="mt-3 leading-7 text-ink-muted">
            Dagim founded ClimateRisk to make fragmented public climate data
            practical for consequential property decisions, turning complex hazard
            signals into clear and actionable risk intelligence.
          </p>
        </div>
      </section>
    </div>
  );
}
