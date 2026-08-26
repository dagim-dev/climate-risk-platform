"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

import { generatePropertyPdf } from "@/lib/api-client";

interface DownloadPdfButtonProps {
  propertyId: number;
  existingPdfUrl?: string | null;
}

export function DownloadPdfButton({ propertyId, existingPdfUrl }: DownloadPdfButtonProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const pdfUrl = existingPdfUrl ?? (await generatePropertyPdf(propertyId, accessToken));
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
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
        disabled={loading}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
      >
        {loading ? "Generating PDF..." : "Download PDF"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-risk-high">
          {error}
        </p>
      )}
    </div>
  );
}
