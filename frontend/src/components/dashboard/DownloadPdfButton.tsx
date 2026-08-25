"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import {
  canDownloadPdf,
  generatePropertyPdf,
  getCurrentUser,
} from "@/lib/api-client";

interface DownloadPdfButtonProps {
  propertyId: number;
  existingPdfUrl?: string | null;
}

export function DownloadPdfButton({ propertyId, existingPdfUrl }: DownloadPdfButtonProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function loadTier() {
      const token = accessToken;
      if (!token) return;
      try {
        const user = await getCurrentUser(token);
        if (!cancelled) {
          setSubscriptionTier(user.subscription_tier);
        }
      } catch {
        if (!cancelled) {
          setSubscriptionTier("free");
        }
      }
    }

    loadTier();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleDownload() {
    if (!accessToken) return;

    if (subscriptionTier && !canDownloadPdf(subscriptionTier)) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    setError(null);
    setShowUpgrade(false);

    try {
      const pdfUrl = existingPdfUrl ?? (await generatePropertyPdf(propertyId, accessToken));
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const upgradeRequired =
        err instanceof Error && "code" in err && (err as Error & { code?: string }).code === "UPGRADE_REQUIRED";
      if (upgradeRequired) {
        setShowUpgrade(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to download PDF");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!accessToken) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading || subscriptionTier === null}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
      >
        {loading ? "Generating PDF..." : "Download PDF"}
      </button>

      {showUpgrade && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p>Server-generated PDF reports are available on paid plans.</p>
          <Link href="/pricing" className="mt-1 inline-block font-semibold text-brand-primary hover:underline">
            View pricing and upgrade
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-risk-high">
          {error}
        </p>
      )}
    </div>
  );
}
