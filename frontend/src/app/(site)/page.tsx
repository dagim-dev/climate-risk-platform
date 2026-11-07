"use client";

import { useEffect, useRef, useState } from "react";
import { AddressSearch } from "@/components/ui/AddressSearch";
import { EarthHero } from "@/components/ui/EarthHero";
import { ExampleAddresses } from "@/components/ui/ExampleAddresses";
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
import { useAddressSearch } from "@/lib/use-address-search";
import type { ClimateRiskReport } from "@/types/risk";

const HERO_HAZARDS = [
  { name: "flood", label: "Flood" },
  { name: "hurricane", label: "Hurricane" },
  { name: "heat", label: "Heat" },
  { name: "wildfire", label: "Wildfire" },
] as const;

/** The search under the results. It's gone with them, so it starts empty next time. */
function AnotherAddressSearch({
  onResult,
  onLoadingChange,
}: {
  onResult: (report: ClimateRiskReport) => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  return <AddressSearch search={useAddressSearch({ onResult, onLoadingChange })} />;
}

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
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const search = useAddressSearch({ onResult: setReport, onLoadingChange: setLoading });

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
        {/* Stacked on small screens, with the Earth in the gap under the search so it's on the
            first screen. Large ones put the Earth behind two panels. */}
        <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:max-w-none lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-8 xl:px-10">
          <div ref={leftPanelRef} className="earth-panel lg:w-[clamp(20rem,31vw,28rem)]">
            <p className={`${eyebrowClass} text-brand-accent lg:text-sky-200`}>
              Address-level climate risk
            </p>
            <h1 className="mt-4 font-display text-[2.75rem] leading-[1.02] tracking-tight sm:text-6xl lg:text-[clamp(3rem,4.7vw,4.25rem)]">
              Understand <em className="text-sky-200">climate risk</em> before you invest
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/90">
              Enter any U.S. property address for an instant, data-backed climate risk assessment.
            </p>

            <div className="mt-8">
              <AddressSearch search={search} tone="dark" />
            </div>
          </div>

          <div className="earth-window">
            <EarthHero
              focus={report ? { latitude: report.latitude, longitude: report.longitude } : null}
              leftPanelRef={leftPanelRef}
              rightPanelRef={rightPanelRef}
            />
          </div>

          <div
            ref={rightPanelRef}
            className="earth-panel mt-6 lg:mt-0 lg:w-[clamp(19rem,25vw,23rem)]"
          >
            <ExampleAddresses onSelect={search.searchFor} disabled={search.loading} />

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-white/10 pt-6 lg:mt-6">
              <ul className="flex gap-3" aria-label="Hazards we score">
                {HERO_HAZARDS.map(({ name, label }) => (
                  <li key={name} className="flex flex-col items-center gap-1.5">
                    <HazardBadge name={name} className="h-10 w-10 border-white/25 text-white" />
                    <span className="text-[0.6875rem] uppercase tracking-[0.15em] text-white/90">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/90 lg:tracking-[0.1em]">
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
                  <AnotherAddressSearch onResult={setReport} onLoadingChange={setLoading} />
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
