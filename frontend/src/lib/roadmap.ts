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
  // TODO(roadmap-copy): placeholder. The real copy for this item is written in a follow-up.
  {
    id: "heat-outlook-2050",
    title: "Real 2050 heat outlook",
    status: "next",
    summary: "TODO: one-line summary of the 2050 heat outlook.",
    whatYoullSee: ["TODO: first thing visitors will see.", "TODO: second thing visitors will see."],
    howItWorks: ["TODO: technical explanation of the projection data and method."],
    sources: [{ label: "TODO: data source" }],
  },
];
