import type { Severity, Verdict } from "@/types/risk";

export const severityBarClass: Record<Severity, string> = {
  Low: "bg-risk-low",
  Moderate: "bg-risk-moderate",
  High: "bg-risk-high",
  Extreme: "bg-risk-extreme",
};

export const severityTextClass: Record<Severity, string> = {
  Low: "text-risk-low",
  Moderate: "text-risk-moderate",
  High: "text-risk-high",
  Extreme: "text-risk-extreme",
};

export const verdictStyles: Record<
  Verdict,
  { label: string; icon: string; bg: string; text: string; explanation: string }
> = {
  Go: {
    label: "Go",
    icon: "✅",
    bg: "bg-risk-low",
    text: "text-white",
    explanation: "Low cumulative climate exposure detected",
  },
  Caution: {
    label: "Caution",
    icon: "⚠️",
    bg: "bg-risk-moderate",
    text: "text-white",
    explanation: "Moderate cumulative climate exposure detected",
  },
  Avoid: {
    label: "Avoid",
    icon: "🚫",
    bg: "bg-risk-high",
    text: "text-white",
    explanation: "Extreme cumulative climate exposure detected",
  },
};
