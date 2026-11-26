/**
 * Public roadmap shown in the header's "Next up" panel (components/layout/RoadmapPanel.tsx).
 * Add, reorder or edit items here; the panel renders whatever this list holds.
 *
 * Copy rules: `summary` and `whatYoullSee` are for everyone and must make sense on their own.
 * `howItWorks` and `sources` sit in a collapsed "How it works" section for technical readers.
 * Only list what we can back with real data (see docs/data-sources.md).
 */

export type RoadmapStatus = "next" | "in-progress" | "exploring";

export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  next: "Next up",
  "in-progress": "In progress",
  exploring: "Exploring",
};

export interface RoadmapSource {
  label: string;
  href?: string;
}

export interface RoadmapItem {
  /** Stable slug, used for element ids. */
  id: string;
  title: string;
  status: RoadmapStatus;
  /** One plain-language line. */
  summary: string;
  /** Short bullets: what a visitor will notice once it ships. */
  whatYoullSee: string[];
  /** Technical detail, shown only when "How it works" is opened. */
  howItWorks: string[];
  sources: RoadmapSource[];
}

export const ROADMAP_ITEMS: RoadmapItem[] = [
  // Backlog: "Real 2050 heat outlook" in BACKLOG.md. Facts checked against Thrasher et al. 2022
  // and the nex-gddp-cmip6 S3 bucket (35 models, daily BCSD, 0.25°, 1950–2014 / 2015–2100).
  {
    id: "heat-outlook-2050",
    title: "Real 2050 heat outlook",
    status: "next",
    summary:
      "See how many very hot days your address could have around 2050, using the climate models behind the UN’s IPCC reports. It replaces our old outlook chart, which only extended a straight line.",
    whatYoullSee: [
      "How many days reach 90°F or more today, measured at a nearby weather station",
      "The expected number around 2050, shown as a likely range, not a single guess",
      "Two futures side by side: moderate emissions and high emissions",
      "Warm nights: how often it stays above 75°F after dark, when heat is hardest on health",
      "If there isn’t enough reliable data for your area, we’ll say so instead of guessing",
    ],
    howItWorks: [
      "Models: CMIP6, the coordinated set of global climate model runs behind the IPCC Sixth Assessment Report (AR6).",
      "Downscaling: NASA NEX-GDDP-CMIP6. 35 CMIP6 models, bias-corrected and downscaled with a daily variant of BCSD (bias correction/spatial disaggregation) to a 0.25° grid (about 25 km). Daily maximum and minimum temperature, 1950–2014 historical and 2015–2100 projected. Open data on AWS.",
      // U+2011 non-breaking hyphens keep "SSP5‑8.5" on one line in the narrow panel.
      "Scenarios: SSP2‑4.5 (moderate) and SSP5‑8.5 (high emissions).",
      "Method: the delta method. For each model, count days per year with a high of 90°F (32.2°C) or more in a 1995–2014 baseline and in 2041–2060, a 20-year window centered on 2050. Add each model’s change to the observed count at the station we already use for the heat score (NOAA Global Summary of the Year DX90, built from GHCN-Daily), averaged over the same baseline years. The observed count stays real; the models supply only the change.",
      "Warm nights: the same method on daily minimum temperature, counting nights that stay at or above 75°F (23.9°C).",
      "Range: the median across models, with the 10th–90th percentile spread shown as the likely range.",
      "Speed: computed once, offline, for the whole U.S. and stored, so results load instantly.",
      "Limits: a 25 km grid cell can’t capture city heat islands or street-level differences. Humidity isn’t included yet (heat index is a possible later step). The result is a projection range, not a forecast.",
    ],
    sources: [
      { label: "CMIP6 (World Climate Research Programme)", href: "https://wcrp-cmip.org/cmip-phases/cmip6/" },
      {
        label: "NASA NEX-GDDP-CMIP6",
        href: "https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6",
      },
      {
        label: "Thrasher et al. (2022), NEX-GDDP-CMIP6 method paper, Scientific Data",
        href: "https://doi.org/10.1038/s41597-022-01393-4",
      },
      { label: "NOAA Climate Data Online (GHCN-Daily, Global Summary of the Year)", href: "https://www.ncei.noaa.gov/cdo-web/" },
    ],
  },
];
