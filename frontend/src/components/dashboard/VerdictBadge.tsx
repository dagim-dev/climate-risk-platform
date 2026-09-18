import type { OverallStatus, Verdict } from "@/types/risk";
import { verdictStyles } from "@/lib/risk-styles";

interface VerdictBadgeProps {
  verdict: Verdict | null;
  overallScore: number | null;
  overallStatus?: OverallStatus;
}

export function VerdictBadge({ verdict, overallScore, overallStatus }: VerdictBadgeProps) {
  if (overallStatus === "unavailable" || verdict === null || overallScore === null) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl border border-zinc-300 bg-zinc-100 px-6 py-8 text-center text-zinc-800 shadow-md"
        role="status"
      >
        <p className="text-xl font-bold sm:text-2xl">Risk assessment unavailable</p>
        <p className="max-w-xl text-sm">
          We could not retrieve enough hazard data to produce a reliable overall score. Review
          individual hazard cards below and try again later.
        </p>
      </div>
    );
  }

  const style = verdictStyles[verdict];
  const clampedScore = Math.max(0, Math.min(100, overallScore));
  const partialNote =
    overallStatus === "partial"
      ? "Partial data — at least one hazard source is unavailable. Score reflects available sources only."
      : null;

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl px-6 py-8 text-center shadow-md ${
        overallStatus === "partial" ? "opacity-90 saturate-50" : ""
      } ${style.bg} ${style.text}`}
      role="status"
    >
      {partialNote ? (
        <p className="max-w-xl rounded-md bg-black/10 px-3 py-1 text-xs font-medium">{partialNote}</p>
      ) : null}
      <div className="flex items-center gap-3 text-4xl font-bold sm:text-5xl">
        <span aria-hidden="true">{style.icon}</span>
        <span>{style.label}</span>
      </div>
      <p className="text-lg font-semibold">
        Overall Climate Risk Score: {clampedScore} / 100
      </p>
      <p className="max-w-xl text-sm opacity-90">{style.explanation}</p>
    </div>
  );
}
