"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { saveProperty } from "@/lib/api-client";
import type { ClimateRiskReport } from "@/types/risk";

interface SavePropertyButtonProps {
  report: ClimateRiskReport;
}

export function SavePropertyButton({ report }: SavePropertyButtonProps) {
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return null;
  }

  if (!session?.accessToken) {
    return (
      <div className="rounded-md border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-primary">
        <Link href="/sign-up" className="font-semibold underline hover:no-underline">
          Create an account
        </Link>
        {" "}to save this property and track analyses over time.
      </div>
    );
  }

  async function handleSave() {
    if (!session?.accessToken || saving) return;

    setSaving(true);
    setError(null);

    try {
      await saveProperty(report, session.accessToken);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || saved}
        className="inline-flex items-center justify-center rounded-md border border-brand-primary bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-60"
      >
        {saved ? "Property Saved" : saving ? "Saving..." : "Save This Property"}
      </button>
      {error && (
        <p role="alert" className="text-sm font-medium text-risk-high">
          {error}
        </p>
      )}
    </div>
  );
}
