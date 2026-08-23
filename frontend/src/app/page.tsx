"use client";

import { useEffect, useRef, useState } from "react";
import { AddressSearch } from "@/components/ui/AddressSearch";
import type { ClimateRiskReport } from "@/types/risk";

export default function Home() {
  const [report, setReport] = useState<ClimateRiskReport | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report && dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report]);

  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-1 flex-col items-center justify-center gap-8 bg-gradient-to-b from-zinc-50 to-white px-4 py-24 text-center sm:px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
            Understand Climate Risk Before You Invest
          </h1>
          <p className="mt-4 text-lg text-zinc-600 sm:text-xl">
            Enter any U.S. property address for an instant, data-backed climate risk assessment.
          </p>
        </div>

        <div className="flex w-full justify-center">
          <AddressSearch onResult={setReport} />
        </div>

        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Powered by NOAA · NASA · FEMA · USGS
        </p>
      </section>

      {report && (
        <section
          ref={dashboardRef}
          className="border-t border-zinc-200 bg-white px-4 py-16 sm:px-6"
          aria-label="Risk assessment results"
        >
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-semibold text-brand-primary">
              Risk assessment for {report.address}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Overall score: {report.overall_risk_score} / 100 · Verdict: {report.verdict}
            </p>
            <p className="mt-6 text-zinc-600">
              Detailed dashboard is under construction. Score cards, verdict badge, and hazard breakdown will appear here.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
