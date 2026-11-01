import type { Severity, Verdict } from "@/types/risk";

/** Ring and bar fills (3:1 against `surface` in both themes). */
export const severityFillClass: Record<Severity, string> = {
  Low: "stroke-risk-low-fill bg-risk-low-fill",
  Moderate: "stroke-risk-moderate-fill bg-risk-moderate-fill",
  High: "stroke-risk-high-fill bg-risk-high-fill",
  Extreme: "stroke-risk-extreme-fill bg-risk-extreme-fill",
};

/** Severity pill: AA text on its soft background in both themes. */
export const severityPillClass: Record<Severity, string> = {
  Low: "bg-risk-low-soft text-risk-low-ink",
  Moderate: "bg-risk-moderate-soft text-risk-moderate-ink",
  High: "bg-risk-high-soft text-risk-high-ink",
  Extreme: "bg-risk-extreme-soft text-risk-extreme-ink",
};

export const verdictStyles: Record<
  Verdict,
  { label: string; ink: string; soft: string; fill: string; explanation: string }
> = {
  Go: {
    label: "Go",
    ink: "text-risk-low-ink",
    soft: "bg-risk-low-soft",
    fill: "stroke-risk-low-fill bg-risk-low-fill",
    explanation: "Low cumulative climate exposure detected",
  },
  Caution: {
    label: "Caution",
    ink: "text-risk-moderate-ink",
    soft: "bg-risk-moderate-soft",
    fill: "stroke-risk-moderate-fill bg-risk-moderate-fill",
    explanation: "Moderate cumulative climate exposure detected",
  },
  Avoid: {
    label: "Avoid",
    ink: "text-risk-high-ink",
    soft: "bg-risk-high-soft",
    fill: "stroke-risk-high-fill bg-risk-high-fill",
    explanation: "Extreme cumulative climate exposure detected",
  },
};

/** Same thresholds as backend `score_to_severity`; used if a report lacks a severity. */
export function severityFromScore(score: number): Severity {
  if (score <= 25) return "Low";
  if (score <= 50) return "Moderate";
  if (score <= 75) return "High";
  return "Extreme";
}
