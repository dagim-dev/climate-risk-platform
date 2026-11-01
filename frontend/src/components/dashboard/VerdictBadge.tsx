import type { ClimateRiskReport, HazardScore, OverallStatus, Verdict } from "@/types/risk";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { verdictStyles } from "@/lib/risk-styles";
import { cardClass, eyebrowClass } from "@/lib/ui";

interface VerdictBadgeProps {
  verdict: Verdict | null;
  overallScore: number | null;
  overallStatus?: OverallStatus;
  unavailableHazards?: string[];
  verdictReason?: string | null;
}

export function unavailableHazardNames(report: ClimateRiskReport): string[] {
  const hazards: [string, HazardScore][] = [
    ["Flood", report.flood_risk],
    ["Hurricane", report.hurricane_risk],
    ["Heat", report.heat_risk],
    ["Wildfire", report.wildfire_risk],
  ];
  return hazards
    .filter(([, hazard]) => hazard.status === "unavailable" || hazard.score === null)
    .map(([name]) => name);
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function VerdictBadge({
  verdict,
  overallScore,
  overallStatus,
  unavailableHazards = [],
  verdictReason = null,
}: VerdictBadgeProps) {
  if (overallStatus === "partial" && verdict === null && overallScore !== null) {
    const missing = unavailableHazards.length > 0 ? formatList(unavailableHazards) : "Some hazard";
    return (
      <div
        className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-warn-line bg-warn-soft p-6 text-center sm:flex-row sm:p-8 sm:text-left"
        role="status"
      >
        <NoScoreRing />
        <div>
          <p className={`${eyebrowClass} text-warn-ink`}>Overall verdict</p>
          <p className="mt-2 font-display text-4xl text-ink sm:text-5xl">Verdict withheld</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink">
            {missing} data could not be retrieved, so we are not giving a Go / Caution / Avoid
            verdict. Scores for the hazards we could assess are shown below. Try again later for a
            complete assessment.
          </p>
        </div>
      </div>
    );
  }

  if (overallStatus === "unavailable" || verdict === null || overallScore === null) {
    return (
      <div
        className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-line bg-surface-2 p-6 text-center sm:flex-row sm:p-8 sm:text-left"
        role="status"
      >
        <NoScoreRing />
        <div>
          <p className={`${eyebrowClass} text-ink-muted`}>Overall verdict</p>
          <p className="mt-2 font-display text-4xl text-ink sm:text-5xl">
            Risk assessment unavailable
          </p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink">
            We could not retrieve enough hazard data to produce a reliable overall score. Review
            individual hazard cards below and try again later.
          </p>
        </div>
      </div>
    );
  }

  // The backend only issues a verdict when all four hazards were assessed.
  const style = verdictStyles[verdict];
  const clampedScore = Math.max(0, Math.min(100, overallScore));

  return (
    <div className={`${cardClass} relative overflow-hidden p-6 sm:p-8`} role="status">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${style.fill}`} />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-70 blur-3xl ${style.soft}`}
      />
      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:gap-8 sm:text-left">
        <ScoreRing score={clampedScore} fillClass={style.fill} size={128} strokeWidth={10}>
          <span className="text-4xl font-semibold tabular-nums leading-none text-ink">
            {clampedScore}
          </span>
          <span className="mt-1 text-xs text-ink-muted">/ 100</span>
        </ScoreRing>
        <div>
          <p className={`${eyebrowClass} text-ink-muted`}>Overall verdict</p>
          <p className={`mt-1 font-display text-6xl leading-none sm:text-7xl ${style.ink}`}>
            {style.label}
          </p>
          <p className="mt-3 text-base font-semibold text-ink">
            Overall Climate Risk Score: {clampedScore} / 100
          </p>
          <p className="mt-1 max-w-xl text-sm leading-6 text-ink-muted">
            {verdictReason ?? style.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Stands in for the overall ring when there is no verdict, so no number is implied. */
function NoScoreRing() {
  return (
    <ScoreRing score={null} size={128}>
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">
        No score
      </span>
    </ScoreRing>
  );
}
