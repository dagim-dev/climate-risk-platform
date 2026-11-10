import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { PageHero } from "@/components/ui/PageHero";
import { cardClass, linkClass } from "@/lib/ui";

// Every number on this page is copied by hand from the backend so the page never drifts at
// runtime. The comment next to each value names the constant it came from. If the scoring
// code changes, update this page in the same change.

export const metadata: Metadata = {
  title: "Methodology — ClimateRisk",
  description:
    "How ClimateRisk turns public flood, hurricane, heat and wildfire data into 0–100 scores, an overall score and a Go / Caution / Avoid verdict.",
};

const contents = [
  { id: "scale", label: "The 0–100 scale" },
  { id: "flood", label: "Flood" },
  { id: "hurricane", label: "Hurricane" },
  { id: "heat", label: "Heat" },
  { id: "wildfire", label: "Wildfire" },
  { id: "overall", label: "Overall score" },
  { id: "verdict", label: "Verdict" },
  { id: "data-honesty", label: "Missing and cached data" },
  { id: "outlook", label: "2030–2050 outlook" },
  { id: "ai-summary", label: "AI summary" },
] as const;

// backend/app/services/scoring/helpers.py: score_to_severity
const severityBands = [
  { label: "Low", range: "0–25" },
  { label: "Moderate", range: "26–50" },
  { label: "High", range: "51–75" },
  { label: "Extreme", range: "76–100" },
] as const;

// backend/app/services/scoring/flood_scorer.py: score_flood_risk
// Zone groups from backend/app/services/climate/flood_data.py: is_high_risk_zone,
// is_moderate_x_subtype, UNDETERMINED_ZONES
const floodZones = [
  {
    zone: "A, AE, A99, AR, V, VE",
    meaning: "1% annual chance of flooding (the “100-year” floodplain)",
    score: "80",
    confidence: "High",
  },
  {
    zone: "AO, AH",
    meaning: "1% annual chance of shallow flooding or ponding",
    score: "60",
    confidence: "High",
  },
  {
    zone: "Shaded X",
    meaning: "0.2% annual chance (“500-year”), or reduced risk behind a levee",
    score: "40",
    confidence: "High",
  },
  {
    zone: "X",
    meaning: "Minimal flood hazard on FEMA’s full map",
    score: "12",
    confidence: "High",
  },
  {
    zone: "No match on the mirror",
    meaning: "Outside the 1% and 0.2% zones on the backup copy, which leaves out zone X",
    score: "12",
    confidence: "Low",
  },
  {
    zone: "Any other code",
    meaning: "A zone code that is not a standard hazard class",
    score: "12",
    confidence: "Low",
  },
  {
    zone: "D, Area Not Included, or no FEMA map",
    meaning: "FEMA has not determined the flood hazard here",
    score: "Unavailable",
    confidence: "—",
  },
] as const;

// backend/app/services/scoring/wildfire_scorer.py: WHP_CLASS_WEIGHTS, WHP_CLASS_LABELS
const wildfireClasses = [
  { code: "1", label: "Very Low", weight: "10" },
  { code: "2", label: "Low", weight: "25" },
  { code: "3", label: "Moderate", weight: "50" },
  { code: "4", label: "High", weight: "75" },
  { code: "5", label: "Very High", weight: "100" },
  { code: "6", label: "Non-burnable", weight: "none (counts as land)" },
  { code: "7", label: "Water", weight: "none (ignored)" },
] as const;

// backend/app/services/scoring/helpers.py: URBAN_CITY_CENTERS (center points and radii in km)
const urbanHeatCities = [
  "New York (18 km)",
  "Los Angeles (25 km)",
  "Chicago (18 km)",
  "Houston (20 km)",
  "Phoenix (22 km)",
  "Denver (15 km)",
  "San Diego (18 km)",
  "San Francisco (15 km)",
  "Seattle (15 km)",
  "Miami (15 km)",
  "Atlanta (18 km)",
  "Boston (12 km)",
  "Washington, DC (15 km)",
  "Las Vegas (15 km)",
  "Austin (15 km)",
] as const;

// backend/app/services/scoring/hazard_utils.py: compute_overall_score
const weights = [
  { hazard: "Flood", weight: "0.30" },
  { hazard: "Hurricane", weight: "0.30" },
  { hazard: "Heat", weight: "0.20" },
  { hazard: "Wildfire", weight: "0.20" },
] as const;

// backend/app/services/scoring/hazard_utils.py: score_to_verdict
const verdicts = [
  { verdict: "Go", range: "0–35" },
  { verdict: "Caution", range: "36–65" },
  { verdict: "Avoid", range: "66–100" },
] as const;

// backend/app/services/climate/source_cache.py: STALE_TTL
const staleLimits = [
  { source: "Flood (FEMA)", limit: "30 days" },
  { source: "Hurricane (NOAA IBTrACS)", limit: "7 days" },
  { source: "Wildfire (USFS + NIFC)", limit: "7 days" },
  { source: "Heat (NOAA)", limit: "24 hours" },
] as const;

// backend/app/services/scoring/trend_builder.py: _flood_growth_rate, _hurricane_growth_rate,
// _heat_growth_rate, _wildfire_growth_rate
const outlookRates = [
  {
    hazard: "Flood",
    rule: "0.3 points a year if today’s score is 60 or more, otherwise 0.1",
  },
  {
    hazard: "Hurricane",
    rule: "0.4 if a hurricane passed within 100 km, 0.25 if only weaker storms did, otherwise 0.08",
  },
  {
    hazard: "Heat",
    rule: "0.45, plus 0.25 if hot days are increasing or minus 0.15 if they are decreasing, plus 0.15 more if they are rising by over 10 days a decade",
  },
  {
    hazard: "Wildfire",
    rule: "0.55 if at least 20% of nearby land is High or Very High hazard, 0.35 if at least 30% is burnable or any of it is High or Very High, otherwise 0.12",
  },
] as const;

function Section({
  id,
  title,
  band = false,
  children,
}: {
  id: string;
  title: string;
  band?: boolean;
  children: ReactNode;
}) {
  const inner = (
    <div className="mx-auto max-w-4xl">
      <h2 className="font-display text-4xl text-ink">{title}</h2>
      <div className="mt-5 space-y-5 leading-7 text-ink">{children}</div>
    </div>
  );
  return band ? (
    <section id={id} className="scroll-mt-20 border-y border-line bg-surface px-4 py-16 sm:px-6">
      {inner}
    </section>
  ) : (
    <section id={id} className="scroll-mt-20 px-4 py-16 sm:px-6">
      {inner}
    </section>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <pre className="whitespace-pre-wrap break-words rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-sm leading-6 text-ink">
      {children}
    </pre>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-lg font-semibold text-ink">{children}</h3>;
}

function Facts({ items }: { items: { term: string; detail: ReactNode }[] }) {
  return (
    <dl className={`${cardClass} divide-y divide-line`}>
      {items.map(({ term, detail }) => (
        <div key={term} className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm font-semibold text-ink-muted">{term}</dt>
          <dd className="text-sm leading-6 text-ink">{detail}</dd>
        </div>
      ))}
    </dl>
  );
}

function Limits({ items }: { items: string[] }) {
  return (
    <>
      <SubHeading>Known limits</SubHeading>
      <ul className="list-disc space-y-2 pl-6 text-ink-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}

export default function MethodologyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHero eyebrow="Methodology" title="How the scores are calculated.">
        Every score comes from public government data and a fixed set of rules. This page
        explains those rules, including the exact numbers the model uses, so you can judge
        a result for yourself.
      </PageHero>

      <nav aria-label="On this page" className="mx-auto w-full max-w-4xl px-4 pt-12 sm:px-6">
        <p className="text-sm font-semibold text-ink-muted">On this page</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {contents.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-block rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink transition-colors hover:bg-surface-2"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="scale" title="The 0–100 scale">
        <p>
          Each of the four hazards (flood, hurricane, heat and wildfire) gets its own score
          from 0 (no meaningful exposure found) to 100 (the highest exposure the model
          measures). Scores are rounded to whole numbers and kept within 0–100. Each score
          also gets a label:
        </p>
        <ul className="grid gap-3 sm:grid-cols-4">
          {severityBands.map(({ label, range }) => (
            <li key={label} className={`${cardClass} px-4 py-3`}>
              <p className="font-semibold text-ink">{label}</p>
              <p className="text-sm text-ink-muted">{range}</p>
            </li>
          ))}
        </ul>
        <p>
          Each score also has a <strong>confidence</strong> of High, Medium or Low. Confidence
          tells you how firmly the data supports the score, not how risky the property is.
        </p>
      </Section>

      <Section id="flood" title="Flood" band>
        <Facts
          items={[
            {
              term: "Source",
              detail:
                "FEMA National Flood Hazard Layer (NFHL), the official flood maps. If FEMA’s server can’t be reached, the app uses Esri’s Living Atlas copy of the same maps.",
            },
            {
              term: "What is measured",
              detail:
                "The FEMA flood zone at the exact point of the address. If the point sits on the border of two zones, the higher-risk zone is used.",
            },
          ]}
        />
        <SubHeading>How the zone becomes a score</SubHeading>
        <div className={`${cardClass} overflow-hidden`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-ink-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  FEMA zone
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  Score
                </th>
                <th scope="col" className="hidden px-4 py-2 font-semibold sm:table-cell">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {floodZones.map(({ zone, meaning, score, confidence }) => (
                <tr key={zone} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{zone}</p>
                    <p className="text-ink-muted">{meaning}</p>
                    <p className="mt-1 text-ink-muted sm:hidden">Confidence: {confidence}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-ink">{score}</td>
                  <td className="hidden px-4 py-3 text-ink sm:table-cell">{confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Elevation bonus:</strong> if FEMA marks the area as a Special Flood Hazard
          Area <em>and</em> records a base flood elevation for it, the score goes up by 8
          points. For example, an AE zone with a base flood elevation scores 88.
        </p>
        <p>
          <strong>When there is no FEMA determination:</strong> zone D, “Area Not Included”
          and places with no digital FEMA flood map at all are shown as{" "}
          <strong>unavailable</strong>. The model does not guess a score for them.
        </p>
        <p>
          <strong>When the backup copy has no match:</strong> Esri’s copy only includes the
          1% and 0.2% zones and levee areas. It leaves out the minimal-hazard zone X. So if the
          address isn’t in any zone on that copy, it is scored as minimal (12) with{" "}
          <strong>Low</strong> confidence, because the model can’t confirm the area was
          actually mapped.
        </p>
        <Limits
          items={[
            "It looks up a single point. Building elevation, foundation type and flood history at the address are not considered.",
            "Only FEMA’s current (effective) maps are used, not preliminary maps that may replace them.",
            "FEMA maps show mapped river and coastal flooding. They often miss flooding from heavy rain overwhelming drains.",
          ]}
        />
      </Section>

      <Section id="hurricane" title="Hurricane">
        <Facts
          items={[
            {
              term: "Source",
              detail: "NOAA IBTrACS, the global record of tropical storm tracks.",
            },
            {
              term: "What is measured",
              detail:
                "Over the last 50 years, how many different storms passed within 100 km of the address, and how strong each one was while it was that close. A storm counts as a hurricane at winds of 64 knots or more, and as a major hurricane (Category 3+) at 96 knots or more.",
            },
          ]}
        />
        <SubHeading>Formula</SubHeading>
        {/* hurricane_scorer.py: POINTS_PER_HURRICANE_PASS, MAX_PASS_POINTS, POINTS_PER_MAJOR_PASS,
            MAX_MAJOR_POINTS, POINTS_PER_TROPICAL_SYSTEM, MAX_TROPICAL_SYSTEM_POINTS
            hurricane_data.py: LOOKBACK_YEARS, PASS_RADIUS_KM, HURRICANE_WIND_KT, MAJOR_HURRICANE_WIND_KT */}
        <Formula>
          {`score = 7 × hurricanes            (up to 70)
      + 5 × major hurricanes      (up to 20)
      + 0.5 × storms of any kind  (up to 10)`}
        </Formula>
        <p>
          A storm can count on more than one line. For example, a Category 3 hurricane that
          passed within 100 km adds 7 + 5 + 0.5 = 12.5 points. The score reaches 100 with 10
          hurricanes, 4 of them major, and 20 storms of any strength.
        </p>
        <p>
          <strong>Confidence:</strong> always High.
        </p>
        <Limits
          items={[
            "It is based on history only. It doesn’t forecast how future storms might change.",
            "It counts storm tracks and wind strength. Storm surge, rainfall flooding and distance from the coast are not scored here.",
            "In very storm-heavy areas, if the storm record is too large to download in full (over 10,000 track segments), the model does not score from part of it. A recent cached copy is used if there is one, otherwise hurricane risk is unavailable.",
          ]}
        />
      </Section>

      <Section id="heat" title="Heat" band>
        <Facts
          items={[
            {
              term: "Source",
              detail:
                "NOAA Climate Data Online, using each station’s yearly count of days that reached 90°F or more.",
            },
            {
              term: "What is measured",
              detail:
                "The average number of 90°F+ days per year over up to the last 30 years (at least 10 years of data are required), and whether that number is going up or down.",
            },
          ]}
        />
        <SubHeading>How the weather station is chosen</SubHeading>
        {/* heat_data.py: STATION_SEARCH_DEGREES, LOOKBACK_YEARS, MIN_YEARS_OF_HEAT_DATA,
            MIN_STATION_COVERAGE, FIRST_ORDER_STATION_PREFIX, FIRST_ORDER_MAX_DISTANCE_KM,
            FIRST_ORDER_MAX_ELEVATION_DIFF_M */}
        <ol className="list-decimal space-y-2 pl-6">
          <li>
            Look at stations within half a degree (about 55 km) of the address that report
            yearly hot-day counts.
          </li>
          <li>
            Keep only stations with a long, recent record. The record must start early enough
            to give at least 10 of the last 30 years, must have data from within the last 2
            years, and must be at least 70% complete.
          </li>
          <li>
            Prefer the nearest major weather station (a National Weather Service or airport
            station) within 50 km, as long as its elevation is within 100 m of the nearest
            station of any kind. That nearby station stands in for the address’s own elevation,
            so a valley airport isn’t used for a hilltop town.
          </li>
          <li>If no major station fits, use the nearest station that passed step 2.</li>
        </ol>
        <SubHeading>Formula</SubHeading>
        {/* heat_scorer.py: MAX_EXTREME_HEAT_DAYS, MAX_TREND_BONUS, TREND_POINTS_PER_DAY_PER_DECADE
            helpers.py: urban_heat_island_bonus (8.0) */}
        <Formula>
          {`score = (average 90°F+ days per year ÷ 120) × 100   (up to 100)
      + 8    if the address is in a listed big-city center
      + 0.5 × increase in hot days per decade   (up to 10, only if rising)`}
        </Formula>
        <p>
          120 hot days a year gives the full 100 points before bonuses. The trend is a
          straight-line fit through the yearly counts, expressed as hot days gained or lost per
          decade. A rise of 20 or more days a decade earns the full 10-point bonus.
        </p>
        <p>
          The 8-point urban heat island bonus applies within a set distance of these city
          centers: {urbanHeatCities.join(", ")}.
        </p>
        {/* heat_scorer.py: confidence thresholds */}
        <p>
          <strong>Confidence:</strong> High at an average of 30 or more hot days a year,
          Medium below that, and Low when the average is zero.
        </p>
        <Limits
          items={[
            "The station can be up to about 50 km away, and the elevation match uses a nearby station as a stand-in.",
            "It counts days at or above 90°F only. Humidity, heat index and hot nights are not measured.",
            "The big-city bonus uses a fixed list of 15 metro areas. Other hot urban areas don’t get it.",
          ]}
        />
      </Section>

      <Section id="wildfire" title="Wildfire">
        <Facts
          items={[
            {
              term: "Sources",
              detail:
                "U.S. Forest Service Wildfire Hazard Potential map (2023) as the main signal, plus the National Interagency Fire Center (NIFC) record of past fire perimeters.",
            },
            {
              term: "What is measured",
              detail:
                "How much of the land within 2 km of the address can burn, and how hazardous it is. Plus the number of separate wildfires mapped within 50 km in the last 20 years.",
            },
          ]}
        />
        <SubHeading>Hazard classes</SubHeading>
        <ul className="grid gap-2 sm:grid-cols-4">
          {wildfireClasses.map(({ code, label, weight }) => (
            <li key={code} className={`${cardClass} px-4 py-2 text-sm`}>
              <span className="font-semibold text-ink">{label}</span>
              <span className="block text-ink-muted">weight {weight}</span>
            </li>
          ))}
        </ul>
        <SubHeading>Formula</SubHeading>
        {/* wildfire_scorer.py: whp_exposure, FULL_EXPOSURE_BURNABLE_SHARE, MAX_HISTORY_BONUS,
            FIRES_PER_HISTORY_POINT; wildfire_data.py: WHP_BOX_KM, SEARCH_RADIUS_M, LOOKBACK_YEARS */}
        <Formula>
          {`burnable share = burnable land ÷ all land (water excluded)
average hazard = average weight of the burnable land

score = average hazard × (burnable share ÷ 0.30, capped at 1)
      + number of past fires ÷ 10   (up to 10)`}
        </Formula>
        <p>
          If less than 30% of the land around the address can burn, the hazard is scaled
          down in proportion. A dense city center with a few patches of vegetation is not the
          same as homes at the edge of a forest. 100 or more past fires earns the full
          10-point history bonus.
        </p>
        <p>
          <strong>Confidence:</strong> High when both sources answered. Medium when the fire
          history couldn’t be fetched, in which case the score uses the hazard map alone. If
          the hazard map itself can’t be reached, wildfire is shown as unavailable.
        </p>
        <Limits
          items={[
            "Dense urban cores score low even in fire-prone regions.",
            "The 2023 hazard map does not cover Hawaii well.",
            "This is not an official wildland-urban interface designation or an insurance wildfire rating.",
          ]}
        />
      </Section>

      <Section id="overall" title="Overall score" band>
        <p>
          The overall score is a weighted average of the hazards that were actually
          assessed:
        </p>
        <ul className="grid gap-3 sm:grid-cols-4">
          {weights.map(({ hazard, weight }) => (
            <li key={hazard} className={`${cardClass} px-4 py-3`}>
              <p className="font-semibold text-ink">{hazard}</p>
              <p className="font-mono text-sm text-ink-muted">{weight}</p>
            </li>
          ))}
        </ul>
        <Formula>
          {`overall = sum of (score × weight) for assessed hazards
          ÷ sum of the weights of those hazards`}
        </Formula>
        <p>
          Dividing by the weights that are present means a missing hazard is left out, not
          counted as zero. For example, with flood 40, hurricane 20, heat 50 and wildfire 10:
        </p>
        <Formula>
          {`(40×0.30 + 20×0.30 + 50×0.20 + 10×0.20) ÷ 1.00 = 30

If heat were unavailable:
(40×0.30 + 20×0.30 + 10×0.20) ÷ 0.80 = 25`}
        </Formula>
        <SubHeading>Overall status</SubHeading>
        <Facts
          items={[
            { term: "Complete", detail: "All four hazards were assessed." },
            {
              term: "Partial",
              detail:
                "One to three hazards were assessed. The overall score covers only those, and the report says which are missing.",
            },
            {
              term: "Unavailable",
              detail: "No hazard could be assessed, so there is no overall score.",
            },
          ]}
        />
      </Section>

      <Section id="verdict" title="Verdict">
        <p>The verdict comes from the overall score:</p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {verdicts.map(({ verdict, range }) => (
            <li key={verdict} className={`${cardClass} px-4 py-3`}>
              <p className="font-semibold text-ink">{verdict}</p>
              <p className="text-sm text-ink-muted">overall {range}</p>
            </li>
          ))}
        </ul>
        {/* hazard_utils.py: compute_verdict, SINGLE_HAZARD_CAUTION_THRESHOLD */}
        <p>Two rules apply on top of that:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>No verdict unless all four hazards were assessed.</strong> If the status
            is partial or unavailable, no verdict is given at all, because a missing hazard
            could change it.
          </li>
          <li>
            <strong>One severe hazard rules out Go.</strong> If the overall score would mean
            Go but any single hazard scores 70 or more, the verdict is raised to Caution, and
            the report says which hazard caused it. A low average shouldn’t hide, say, severe
            wildfire exposure in a town with no flood or hurricane risk.
          </li>
        </ul>
      </Section>

      <Section id="data-honesty" title="Missing and cached data" band>
        <p>
          <strong>A missing source is never filled in.</strong> If a data provider is down,
          doesn’t cover the location, or returns data the model can’t read, that hazard is
          shown as <strong>unavailable</strong> with the reason. It is never given a made-up,
          average or default score. It is also left out of the overall score and blocks the
          verdict, as described above.
        </p>
        <p>
          <strong>Stale means cached.</strong> Every report asks each provider for fresh data.
          Each good answer is saved for its area (a grid cell of about 1 km). If a provider
          fails later, the app falls back to the saved copy for that cell, but only if it is
          recent enough:
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {staleLimits.map(({ source, limit }) => (
            <li key={source} className={`${cardClass} flex justify-between gap-4 px-4 py-3 text-sm`}>
              <span className="text-ink">{source}</span>
              <span className="font-semibold text-ink">{limit}</span>
            </li>
          ))}
        </ul>
        <p>
          A hazard scored from cached data shows <em>Cached data, last updated</em> with the
          date on its card. It counts toward the overall score and verdict like fresh data. If
          there is no copy that recent, the hazard is unavailable.
        </p>
      </Section>

      <Section id="outlook" title="2030–2050 outlook">
        <p>
          <strong>Only today’s scores are measured.</strong> The 2030, 2040 and 2050 points
          in the trend chart are simple straight-line projections from today’s scores. They
          are <strong>not</strong> output from a climate model or an emissions scenario, and
          no past scores are shown.
        </p>
        <Formula>
          {`projected score = today’s score + yearly rate × years from now   (kept within 0–100)`}
        </Formula>
        <p>Each hazard’s yearly rate is a fixed assumption set in the model:</p>
        <Facts items={outlookRates.map(({ hazard, rule }) => ({ term: hazard, detail: rule }))} />
        <p>
          Every rate is positive, so projected scores always rise. Treat them as a rough sense
          of direction, not a forecast. A hazard that is unavailable today has no projection.
        </p>
      </Section>

      <Section id="ai-summary" title="AI summary" band>
        <p>
          The written summary is generated by an OpenAI model after the scores are
          calculated. It reads the finished report and is told not to describe hazards that
          weren’t assessed.
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>It plays no part in the scores.</strong> The scores, overall score and
            verdict are calculated before the summary is written and are never changed by it.
          </li>
          <li>
            <strong>It is best-effort.</strong> If the model is slow or fails, the report is
            shown without a summary.
          </li>
          <li>Like any machine-written text, it can be incomplete or imperfect.</li>
        </ul>
        <p className="text-ink-muted">
          Scores and summaries are for information only. See the{" "}
          <Link href="/terms" className={linkClass}>
            Terms of Service
          </Link>{" "}
          for how they may be used, and the{" "}
          <Link href="/about" className={linkClass}>
            About page
          </Link>{" "}
          for the full list of data sources.
        </p>
      </Section>
    </div>
  );
}
