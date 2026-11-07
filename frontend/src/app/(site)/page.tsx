"use client";

import { useEffect, useRef, useState } from "react";
import { AddressSearch } from "@/components/ui/AddressSearch";
import { EarthHero } from "@/components/ui/EarthHero";
import { HazardBadge } from "@/components/ui/HazardIcon";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { RiskDashboard } from "@/components/dashboard/RiskDashboard";
import { warmUpBackend } from "@/lib/api-client";
import {
  clearDashboardRestore,
  isDashboardRestoreRequested,
  useStoredReport,
} from "@/lib/report-storage";
import { eyebrowClass } from "@/lib/ui";
import type { ClimateRiskReport } from "@/types/risk";

const HERO_HAZARDS = [
  { name: "flood", label: "Flood" },
  { name: "hurricane", label: "Hurricane" },
  { name: "heat", label: "Heat" },
  { name: "wildfire", label: "Wildfire" },
] as const;

export default function Home() {
  const [searchedReport, setReport] = useState<ClimateRiskReport | null>(null);
  const [restoreDismissed, setRestoreDismissed] = useState(false);
  // "Back to Dashboard" on /report sets a flag so the last report reopens here.
  // (Server render and hydration see no stored report either way, so markup matches.)
  const [restoreRequested] = useState(
    () => typeof window !== "undefined" && isDashboardRestoreRequested(),
  );
  const storedReport = useStoredReport();
  const report =
    searchedReport ?? (restoreRequested && !restoreDismissed ? storedReport : null);
  const [loading, setLoading] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    warmUpBackend();
  }, []);

  useEffect(() => {
    if ((report || loading) && dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report, loading]);

  const handleReset = () => {
    setReport(null);
    setRestoreDismissed(true);
    clearDashboardRestore();
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-1 flex-col">
      <section
        ref={heroRef}
        className="starfield on-dark relative isolate flex overflow-hidden text-white lg:min-h-[calc(100svh-4rem)]"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:py-16">
          <div ref={heroCopyRef} className="w-full lg:w-[48%] lg:max-w-[35rem]">
            <p className={`${eyebrowClass} text-brand-accent`}>Address-level climate risk</p>
            <h1 className="mt-4 font-display text-[2.75rem] leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Understand <em className="text-sky-200">climate risk</em> before you invest
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/75 lg:max-w-md">
              Enter any U.S. property address for an instant, data-backed climate risk assessment.
            </p>

            <div className="mt-8">
              <AddressSearch
                onResult={setReport}
                onLoadingChange={setLoading}
                showExamples
                tone="dark"
                beforeExamples={
                  // On small screens the Earth rises through this gap, so it's on the first
                  // screen right under the search. On large ones it fills the whole hero.
                  <div className="earth-window">
                    <EarthHero
                      focus={
                        report ? { latitude: report.latitude, longitude: report.longitude } : null
                      }
                      avoidRef={heroCopyRef}
                    />
                  </div>
                }
              />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-white/10 pt-6">
              <ul className="flex gap-3" aria-label="Hazards we score">
                {HERO_HAZARDS.map(({ name, label }) => (
                  <li key={name} className="flex flex-col items-center gap-1.5">
                    <HazardBadge name={name} className="h-10 w-10 border-white/25 text-white" />
                    <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-white/70">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/65">
                Powered by NOAA · FEMA · USFS · NIFC
              </p>
            </div>
          </div>
        </div>
      </section>

      {(loading || report) && (
        <section
          ref={dashboardRef}
          className="scroll-mt-16 border-t border-line bg-canvas px-4 py-14 sm:px-6 sm:py-20"
          aria-label="Risk assessment results"
        >
          {loading && <LoadingSkeleton />}
          {report && (
            <div className="space-y-16">
              {!loading && <RiskDashboard report={report} onAnalyzeAnother={handleReset} />}

              {/* Hidden rather than unmounted while loading, so a failed search keeps its error. */}
              <div
                className={`mx-auto w-full max-w-5xl flex-col items-center gap-4 rounded-3xl border border-line bg-surface px-4 py-10 text-center sm:px-8 ${
                  loading ? "hidden" : "flex"
                }`}
              >
                <h3 className="font-display text-3xl text-ink">Analyze another address</h3>
                <div className="flex w-full justify-center">
                  <AddressSearch onResult={setReport} onLoadingChange={setLoading} />
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
