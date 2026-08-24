"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VerdictBadge } from "@/components/dashboard/VerdictBadge";
import {
  loadReportFromSession,
  loadReportFromUrlParam,
} from "@/lib/report-storage";
import { severityTextClass } from "@/lib/risk-styles";
import type { ClimateRiskReport, Severity } from "@/types/risk";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

const HAZARDS = [
  { key: "flood", label: "Flood", icon: "🌊", field: "flood_risk" as const },
  { key: "hurricane", label: "Hurricane", icon: "🌀", field: "hurricane_risk" as const },
  { key: "heat", label: "Heat", icon: "🌡️", field: "heat_risk" as const },
  { key: "wildfire", label: "Wildfire", icon: "🔥", field: "wildfire_risk" as const },
];

function ReportScoreRow({
  label,
  icon,
  score,
  severity,
}: {
  label: string;
  icon: string;
  score: number;
  severity: Severity;
}) {
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="report-section rounded-lg border border-zinc-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">{icon}</span>
          <span className="font-semibold text-brand-primary">{label}</span>
        </div>
        <span
          className={`rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${severityTextClass[severity]}`}
        >
          {severity}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-brand-primary">
        {clampedScore}
        <span className="text-sm font-normal text-zinc-500"> / 100</span>
      </p>
    </div>
  );
}

export function ReportPageContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ClimateRiskReport | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("report");
    if (fromUrl) {
      const parsed = loadReportFromUrlParam(fromUrl);
      if (parsed) {
        setReport(parsed);
        setReady(true);
        return;
      }
    }

    setReport(loadReportFromSession());
    setReady(true);
  }, [searchParams]);

  if (!ready) {
    return null;
  }

  if (!report) {
    return (
      <div className="report-container flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-brand-primary">No report available</h1>
        <p className="text-zinc-600">
          Analyze a property address first, then open the full report from the dashboard.
        </p>
        <Link
          href="/"
          className="no-print inline-flex rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="report-container space-y-8">
      <header className="report-section space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Climate Risk Report
        </p>
        <h1 className="text-2xl font-bold text-brand-primary sm:text-3xl">{report.address}</h1>
        <p className="text-sm text-zinc-500">Report generated {formatDate(report.generated_at)}</p>
      </header>

      <div className="no-print flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
        >
          🖨 Print / Save as PDF
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Back to Dashboard
        </Link>
      </div>

      <VerdictBadge verdict={report.verdict} overallScore={report.overall_risk_score} />

      <section className="report-score-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
        {HAZARDS.map(({ label, icon, field }) => {
          const data = report[field];
          return (
            <ReportScoreRow
              key={field}
              label={label}
              icon={icon}
              score={data.score}
              severity={data.severity}
            />
          );
        })}
      </section>

      {report.ai_summary && (
        <section className="report-section space-y-2">
          <h2 className="text-lg font-semibold text-brand-primary">AI Risk Summary</h2>
          <p className="text-sm leading-relaxed text-zinc-700">{report.ai_summary}</p>
        </section>
      )}

      <footer className="report-section border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
        Risk data sourced from NOAA, NASA EarthData, FEMA NFHL, and USGS.
      </footer>
    </div>
  );
}
