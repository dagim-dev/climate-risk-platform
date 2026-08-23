"use client";

import type { ClimateRiskReport } from "@/types/risk";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { VerdictBadge } from "@/components/dashboard/VerdictBadge";

interface RiskDashboardProps {
  report: ClimateRiskReport;
  onAnalyzeAnother?: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function RiskDashboard({ report, onAnalyzeAnother }: RiskDashboardProps) {
  const hazards = [
    { key: "flood", hazard: "Flood", icon: "🌊", data: report.flood_risk },
    { key: "hurricane", hazard: "Hurricane", icon: "🌀", data: report.hurricane_risk },
    { key: "heat", hazard: "Heat", icon: "🌡️", data: report.heat_risk },
    { key: "wildfire", hazard: "Wildfire", icon: "🔥", data: report.wildfire_risk },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-brand-primary sm:text-3xl">
          {report.address}
        </h2>
        <p className="text-sm text-zinc-500">
          Report generated {formatDate(report.generated_at)}
        </p>
      </header>

      <VerdictBadge verdict={report.verdict} overallScore={report.overall_risk_score} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hazards.map(({ key, hazard, icon, data }) => (
          <ScoreCard
            key={key}
            hazard={hazard}
            icon={icon}
            score={data.score}
            severity={data.severity}
            factors={data.primary_factors}
          />
        ))}
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Report downloads will be available in v1.0"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-500 opacity-60 cursor-not-allowed"
        >
          Download Report
        </button>
        <button
          type="button"
          onClick={onAnalyzeAnother}
          className="inline-flex items-center justify-center rounded-md bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
        >
          Analyze Another Address
        </button>
      </div>

      <footer className="border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
        Risk data sourced from NOAA, NASA EarthData, FEMA NFHL, and USGS.
      </footer>
    </div>
  );
}
