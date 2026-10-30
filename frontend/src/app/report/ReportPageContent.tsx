"use client";

import Link from "next/link";
import { VerdictBadge, unavailableHazardNames } from "@/components/dashboard/VerdictBadge";
import { RiskTrendChart } from "@/components/dashboard/RiskTrendChart";
import { Logo } from "@/components/layout/Logo";
import { HazardBadge, type HazardIconName } from "@/components/ui/HazardIcon";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { requestDashboardRestore, useStoredReport } from "@/lib/report-storage";
import { severityFillClass, severityFromScore, severityPillClass } from "@/lib/risk-styles";
import { buttonClass, eyebrowClass } from "@/lib/ui";
import type { Severity } from "@/types/risk";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

const HAZARDS: { label: string; icon: HazardIconName; field: "flood_risk" | "hurricane_risk" | "heat_risk" | "wildfire_risk" }[] = [
  { label: "Flood", icon: "flood", field: "flood_risk" },
  { label: "Hurricane", icon: "hurricane", field: "hurricane_risk" },
  { label: "Heat", icon: "heat", field: "heat_risk" },
  { label: "Wildfire", icon: "wildfire", field: "wildfire_risk" },
];

function ReportScoreRow({
  label,
  icon,
  data,
}: {
  label: string;
  icon: HazardIconName;
  data: { score: number | null; severity: Severity | null; status?: string; unavailable_reason?: string | null };
}) {
  if (data.status === "unavailable" || data.score === null) {
    return (
      <div className="report-section flex items-center gap-4 rounded-2xl border border-dashed border-warn-line bg-warn-soft p-4">
        <ScoreRing score={null} size={60} strokeWidth={6}>
          <span className="text-ink-muted" aria-hidden="true">
            —
          </span>
        </ScoreRing>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <HazardBadge name={icon} className="h-7 w-7 border-warn-line text-warn-ink" />
            <span className="font-semibold text-ink">{label}</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-warn-ink">Data unavailable</p>
          {data.unavailable_reason ? (
            <p className="mt-0.5 text-xs text-ink-muted">{data.unavailable_reason}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const clampedScore = Math.max(0, Math.min(100, data.score));
  const severity: Severity = data.severity ?? severityFromScore(clampedScore);

  return (
    <div className="report-section flex items-center gap-4 rounded-2xl border border-line p-4">
      <ScoreRing score={clampedScore} fillClass={severityFillClass[severity]} size={60} strokeWidth={6}>
        <span className="text-lg font-semibold tabular-nums text-ink">
          {clampedScore}
          <span className="sr-only"> / 100</span>
        </span>
      </ScoreRing>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HazardBadge name={icon} className="h-7 w-7 border-line text-accent-ink" />
            <span className="font-semibold text-ink">{label}</span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${severityPillClass[severity]}`}
          >
            {severity}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ReportPageContent() {
  const report = useStoredReport();

  if (!report) {
    return (
      <div className="report-container">
        <div className="report-sheet flex flex-col items-center gap-4 text-center">
          <Logo tone="light" />
          <h1 className="mt-4 font-display text-4xl text-ink">No report available</h1>
          <p className="max-w-md text-ink-muted">
            Analyze a property address first, then open the full report from the dashboard.
          </p>
          <Link href="/" className={`no-print mt-2 ${buttonClass("primary")}`}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" onClick={requestDashboardRestore} className={buttonClass("secondary")}>
          Back to Dashboard
        </Link>
        <button type="button" onClick={() => window.print()} className={buttonClass("primary")}>
          🖨 Print / Save as PDF
        </button>
      </div>

      <article className="report-sheet space-y-8">
        <header className="report-section space-y-4 border-b border-line pb-8">
          <Logo tone="light" />
          <div>
            <p className={`${eyebrowClass} text-accent-ink`}>Climate Risk Report</p>
            <h1 className="mt-2 break-words font-display text-4xl leading-tight text-ink sm:text-5xl">
              {report.address}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              Report generated {formatDate(report.generated_at)} · {report.latitude.toFixed(4)},{" "}
              {report.longitude.toFixed(4)}
            </p>
          </div>
        </header>

        <VerdictBadge
          verdict={report.verdict}
          overallScore={report.overall_risk_score}
          overallStatus={report.overall_status}
          unavailableHazards={unavailableHazardNames(report)}
          verdictReason={report.verdict_reason}
        />

        <section className="report-score-grid grid grid-cols-1 gap-3 sm:grid-cols-2">
          {HAZARDS.map(({ label, icon, field }) => (
            <ReportScoreRow key={field} label={label} icon={icon} data={report[field]} />
          ))}
        </section>

        {report.historical_trend && report.historical_trend.length > 0 && (
          <section className="report-section no-print">
            <RiskTrendChart trend={report.historical_trend} />
          </section>
        )}

        {report.ai_summary && (
          <section className="report-section space-y-2">
            <h2 className="font-display text-3xl text-ink">AI Risk Summary</h2>
            <p className="whitespace-pre-line leading-7 text-ink">{report.ai_summary}</p>
            <p className="text-xs text-ink-muted">
              AI-generated from public climate data. Not professional financial or legal advice.
            </p>
          </section>
        )}

        <footer className="report-section border-t border-line pt-4 text-center text-xs text-ink-muted">
          Risk data sourced from NOAA, FEMA NFHL, USFS, and NIFC.
        </footer>
      </article>
    </div>
  );
}
