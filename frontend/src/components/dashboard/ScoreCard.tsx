"use client";

import { useState } from "react";
import type { HazardScore, Severity } from "@/types/risk";
import { HazardBadge, type HazardIconName } from "@/components/ui/HazardIcon";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { severityFillClass, severityFromScore, severityPillClass } from "@/lib/risk-styles";
import { cardClass } from "@/lib/ui";

interface ScoreCardProps {
  hazard: string;
  icon: HazardIconName;
  data: HazardScore;
}

function formatAsOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

const pillClass = "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide";

export function ScoreCard({ hazard, icon, data }: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = data.status ?? "ok";

  if (status === "unavailable" || data.score === null) {
    return (
      <article className="flex flex-col rounded-2xl border border-dashed border-warn-line bg-warn-soft p-5">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HazardBadge name={icon} className="h-10 w-10 border-warn-line text-warn-ink" />
            <h3 className="text-base font-semibold text-ink">{hazard}</h3>
          </div>
          <span className={`${pillClass} border border-warn-line bg-surface text-warn-ink`}>
            Unavailable
          </span>
        </header>
        <div className="mt-5 flex items-center gap-4">
          <ScoreRing score={null} size={80}>
            <span className="text-xl text-ink-muted" aria-hidden="true">
              —
            </span>
          </ScoreRing>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-warn-ink">
              Data unavailable — cannot assess risk
            </p>
            {data.unavailable_reason ? (
              <p className="mt-1 text-sm text-ink">{data.unavailable_reason}</p>
            ) : null}
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-ink-muted">
          If a data provider was temporarily unreachable, try again in a few minutes.
        </p>
      </article>
    );
  }

  const clampedScore = Math.max(0, Math.min(100, data.score));
  const severity: Severity = data.severity ?? severityFromScore(clampedScore);

  return (
    <article className={`${cardClass} flex flex-col p-5`}>
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HazardBadge name={icon} />
          <h3 className="text-base font-semibold text-ink">{hazard}</h3>
        </div>
        <span className={`${pillClass} ${severityPillClass[severity]}`}>{severity}</span>
      </header>

      <div className="mt-5 flex items-center gap-4">
        <div
          role="progressbar"
          aria-label={`${hazard} risk score`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedScore}
        >
          <ScoreRing score={clampedScore} fillClass={severityFillClass[severity]} size={80}>
            <span className="text-2xl font-semibold tabular-nums leading-none text-ink">
              {clampedScore}
            </span>
            <span className="mt-0.5 text-[0.6875rem] text-ink-muted">/ 100</span>
          </ScoreRing>
        </div>
        <dl className="min-w-0 space-y-2 text-sm">
          {data.confidence ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-muted">Confidence</dt>
              <dd className="font-medium text-ink">{data.confidence}</dd>
            </div>
          ) : null}
          {status === "stale" && data.as_of ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-muted">Cached data</dt>
              <dd className="font-medium text-ink">Last updated {formatAsOf(data.as_of)}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="mt-5 flex items-center gap-1.5 self-start rounded text-sm font-medium text-accent-ink hover:underline"
      >
        <span>{expanded ? "Hide" : "Show"} Risk Factors</span>
        <svg
          viewBox="0 0 16 16"
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <ul className="mt-3 list-disc space-y-1 border-t border-line pl-5 pt-3 text-sm text-ink">
          {data.primary_factors.length > 0 ? (
            data.primary_factors.map((factor) => <li key={factor}>{factor}</li>)
          ) : (
            <li className="list-none text-ink-muted">No specific risk factors reported.</li>
          )}
        </ul>
      )}
    </article>
  );
}
