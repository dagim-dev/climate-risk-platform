"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { saveProperty } from "@/lib/api-client";
import { buttonClass, linkClass } from "@/lib/ui";
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
      <p className="text-sm leading-6 text-ink-muted">
        <Link href="/sign-up" className={linkClass}>
          Create an account
        </Link>
        {" "}to save this property and track analyses over time.
      </p>
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
        className={buttonClass("primary")}
      >
        {saved ? "Property Saved" : saving ? "Saving..." : "Save This Property"}
      </button>
      {error && (
        <p role="alert" className="text-sm font-medium text-risk-high-ink">
          {error}
        </p>
      )}
    </div>
  );
}
