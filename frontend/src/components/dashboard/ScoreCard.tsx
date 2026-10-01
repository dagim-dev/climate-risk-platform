"use client";

import { useState } from "react";
import type { HazardScore, Severity } from "@/types/risk";
import { severityBarClass, severityFromScore, severityTextClass } from "@/lib/risk-styles";

interface ScoreCardProps {
  hazard: string;
  icon: string;
  data: HazardScore;
}

function formatAsOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function ScoreCard({ hazard, icon, data }: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = data.status ?? "ok";

  if (status === "unavailable" || data.score === null) {
    return (
      <article className="flex flex-col rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl">
              {icon}
            </span>
            <h3 className="text-lg font-semibold text-brand-primary">{hazard}</h3>
          </div>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
            Unavailable
          </span>
        </header>
        <p className="mt-4 text-sm font-medium text-amber-950">
          Data unavailable — cannot assess risk
        </p>
        {data.unavailable_reason ? (
          <p className="mt-2 text-sm text-amber-900/90">{data.unavailable_reason}</p>
        ) : null}
        <p className="mt-3 text-xs text-amber-800/80">
          If a data provider was temporarily unreachable, try again in a few minutes.
        </p>
      </article>
    );
  }

  const clampedScore = Math.max(0, Math.min(100, data.score));
  const severity: Severity = data.severity ?? severityFromScore(clampedScore);

  return (
    <article className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-2xl">
            {icon}
          </span>
          <h3 className="text-lg font-semibold text-brand-primary">{hazard}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${severityTextClass[severity]}`}
          >
            {severity}
          </span>
          {status === "stale" && data.as_of ? (
            <span className="text-xs text-zinc-500">Last updated {formatAsOf(data.as_of)}</span>
          ) : null}
        </div>
      </header>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-brand-primary">{clampedScore}</span>
        <span className="text-sm text-zinc-500">/ 100</span>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200"
        role="progressbar"
        aria-label={`${hazard} risk score`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedScore}
      >
        <div
          className={`h-full rounded-full transition-all ${severityBarClass[severity]}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="mt-4 flex items-center gap-1 self-start text-sm font-medium text-brand-accent hover:underline"
      >
        <span>{expanded ? "Hide" : "Show"} Risk Factors</span>
        <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          {data.primary_factors.length > 0 ? (
            data.primary_factors.map((factor) => <li key={factor}>{factor}</li>)
          ) : (
            <li className="list-none text-zinc-500">No specific risk factors reported.</li>
          )}
        </ul>
      )}
    </article>
  );
}
