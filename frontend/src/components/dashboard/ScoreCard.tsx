"use client";

import { useState } from "react";
import type { Severity } from "@/types/risk";
import { severityBarClass, severityTextClass } from "@/lib/risk-styles";

interface ScoreCardProps {
  hazard: string;
  icon: string;
  score: number;
  severity: Severity;
  factors: string[];
}

export function ScoreCard({ hazard, icon, score, severity, factors }: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <article className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-2xl">
            {icon}
          </span>
          <h3 className="text-lg font-semibold text-brand-primary">{hazard}</h3>
        </div>
        <span
          className={`rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${severityTextClass[severity]}`}
        >
          {severity}
        </span>
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
          {factors.length > 0 ? (
            factors.map((factor) => <li key={factor}>{factor}</li>)
          ) : (
            <li className="list-none text-zinc-500">No specific risk factors reported.</li>
          )}
        </ul>
      )}
    </article>
  );
}
