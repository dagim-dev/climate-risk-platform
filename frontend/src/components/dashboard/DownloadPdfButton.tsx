"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { ApiError, generatePropertyPdf } from "@/lib/api-client";
import { buttonClass } from "@/lib/ui";

interface DownloadPdfButtonProps {
  propertyId: number;
}

export function DownloadPdfButton({ propertyId }: DownloadPdfButtonProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!accessToken) return;

    // Open the tab synchronously in the click handler; browsers block window.open
    // after an await. It is pointed at the signed link once that is ready.
    const pdfWindow = window.open("", "_blank");
    setLoading(true);
    setError(null);

    try {
      // Signed links expire, so always request a fresh one.
      const pdfUrl = await generatePropertyPdf(propertyId, accessToken);
      if (pdfWindow) {
        pdfWindow.opener = null;
        pdfWindow.location.href = pdfUrl;
      } else {
        window.location.href = pdfUrl;
      }
    } catch (err) {
      pdfWindow?.close();
      if (err instanceof ApiError && err.status === 401) {
        await signOut({ callbackUrl: "/sign-in?callbackUrl=/properties" });
        return;
      }
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
        className={buttonClass("secondary", "sm")}
      >
        {loading ? "Generating PDF..." : "Download PDF"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-risk-high-ink">
          {error}
        </p>
      )}
    </div>
  );
}
