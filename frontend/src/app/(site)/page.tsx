"use client";

import { useEffect, useRef, useState } from "react";
import { AddressSearch } from "@/components/ui/AddressSearch";
import { LoadingSkeleton } from "@/components/dashboard/LoadingSkeleton";
import { RiskDashboard } from "@/components/dashboard/RiskDashboard";
import type { ClimateRiskReport } from "@/types/risk";

export default function Home() {
  const [report, setReport] = useState<ClimateRiskReport | null>(null);
  const [loading, setLoading] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((report || loading) && dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report, loading]);

  const handleReset = () => {
    setReport(null);
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-1 flex-col">
      <section
        ref={heroRef}
        className="flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-zinc-50 to-white px-4 py-24 text-center sm:px-6"
      >
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
            Understand Climate Risk Before You Invest
          </h1>
          <p className="mt-4 text-lg text-zinc-600 sm:text-xl">
            Enter any U.S. property address for an instant, data-backed climate risk assessment.
          </p>
        </div>

        <div className="flex w-full justify-center">
          <AddressSearch onResult={setReport} onLoadingChange={setLoading} />
        </div>

        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Powered by NOAA · NASA · FEMA · USGS
        </p>
      </section>

      {(loading || report) && (
        <section
          ref={dashboardRef}
          className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 sm:px-6"
          aria-label="Risk assessment results"
        >
          {loading && <LoadingSkeleton />}
          {!loading && report && (
            <div className="space-y-16">
              <RiskDashboard report={report} onAnalyzeAnother={handleReset} />

              <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 border-t border-zinc-200 pt-10">
                <h3 className="text-lg font-semibold text-brand-primary">
                  Analyze another address
                </h3>
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
