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
  // Keep this short and plain. The full method lives in BACKLOG.md ("Real 2050 heat outlook").
  {
    id: "heat-outlook-2050",
    title: "Real 2050 heat outlook",
    status: "next",
    summary: "See how many very hot days your area could get around 2050, based on NASA climate data.",
    whatYoullSee: [
      "Hot days (90°F or more) today",
      "Hot days expected around 2050, shown as a range",
      "A lower and a higher emissions future, side by side",
    ],
    howItWorks: [
      "We start from real counts at a nearby weather station, then add the change NASA’s climate models expect by 2050.",
      "The models come from CMIP6, the worldwide set of climate models behind the UN’s IPCC climate reports. NASA adjusts them to local detail.",
      "The range shows where most models agree. It’s an estimate, not a forecast.",
    ],
    sources: [
      {
        label: "NASA NEX-GDDP-CMIP6",
        href: "https://www.nccs.nasa.gov/services/data-collections/land-based-products/nex-gddp-cmip6",
      },
      { label: "NOAA Climate Data Online", href: "https://www.ncei.noaa.gov/cdo-web/" },
    ],
  },
];
