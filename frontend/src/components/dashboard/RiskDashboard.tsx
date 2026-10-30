"use client";

import { useRouter } from "next/navigation";
import type { ClimateRiskReport } from "@/types/risk";
import { AISummary } from "@/components/dashboard/AISummary";
import { RiskTrendChart } from "@/components/dashboard/RiskTrendChart";
import { SavePropertyButton } from "@/components/dashboard/SavePropertyButton";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { VerdictBadge, unavailableHazardNames } from "@/components/dashboard/VerdictBadge";
import { saveReport } from "@/lib/report-storage";
import { buttonClass, cardClass, eyebrowClass } from "@/lib/ui";

interface RiskDashboardProps {
  report: ClimateRiskReport;
  onAnalyzeAnother?: () => void;
}

function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
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
  const router = useRouter();

  const handleViewReport = () => {
    saveReport(report);
    router.push("/report");
  };

  const hazards = [
    { key: "flood", hazard: "Flood", icon: "flood", data: report.flood_risk },
    { key: "hurricane", hazard: "Hurricane", icon: "hurricane", data: report.hurricane_risk },
    { key: "heat", hazard: "Heat", icon: "heat", data: report.heat_risk },
    { key: "wildfire", hazard: "Wildfire", icon: "wildfire", data: report.wildfire_risk },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className={`${eyebrowClass} text-accent-ink`}>Climate risk report</p>
          <h2 className="mt-2 break-words font-display text-3xl leading-tight text-ink sm:text-5xl">
            {report.address}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Report generated {formatDate(report.generated_at)}
          </p>
        </div>
        <p className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-muted sm:self-auto">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
          {formatCoordinates(report.latitude, report.longitude)}
        </p>
      </header>

      <VerdictBadge
        verdict={report.verdict}
        overallScore={report.overall_risk_score}
        overallStatus={report.overall_status}
        unavailableHazards={unavailableHazardNames(report)}
        verdictReason={report.verdict_reason}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hazards.map(({ key, hazard, icon, data }) => (
          <ScoreCard key={key} hazard={hazard} icon={icon} data={data} />
        ))}
      </div>

      <AISummary summary={report.ai_summary} />

      {report.historical_trend && report.historical_trend.length > 0 && (
        <RiskTrendChart trend={report.historical_trend} />
      )}

      <div
        className={`${cardClass} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}
      >
        {/* Keyed so "Property Saved" resets when a different report is shown. */}
        <SavePropertyButton key={report.generated_at} report={report} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleViewReport} className={buttonClass("secondary")}>
            View Full Report
          </button>
          <button type="button" onClick={onAnalyzeAnother} className={buttonClass("primary")}>
            Analyze Another Address
          </button>
        </div>
      </div>

      <footer className="pt-2 text-center text-xs text-ink-muted">
        Risk data sourced from NOAA, FEMA NFHL, USFS, and NIFC.
      </footer>
    </div>
  );
}
