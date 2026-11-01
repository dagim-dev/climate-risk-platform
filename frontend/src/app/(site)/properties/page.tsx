"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import {
  ApiError,
  analyzeAddress,
  deleteProperty,
  listProperties,
  saveProperty,
  type SavedPropertyListItem,
} from "@/lib/api-client";
import { DownloadPdfButton } from "@/components/dashboard/DownloadPdfButton";
import { HazardBadge } from "@/components/ui/HazardIcon";
import { PageHero } from "@/components/ui/PageHero";
import { saveReport } from "@/lib/report-storage";
import { verdictStyles } from "@/lib/risk-styles";
import { buttonClass, cardClass, linkClass } from "@/lib/ui";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isExpiredSession(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

function signInAgain() {
  return signOut({ callbackUrl: "/sign-in?callbackUrl=/properties" });
}

export default function PropertiesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [properties, setProperties] = useState<SavedPropertyListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) {
      return;
    }

    let cancelled = false;

    async function load() {
      const token = accessToken;
      if (!token) return;

      try {
        const items = await listProperties(token);
        if (!cancelled) {
          setProperties(items);
        }
      } catch (err) {
        if (isExpiredSession(err)) {
          await signInAgain();
          return;
        }
        if (!cancelled) {
          setError("Failed to load saved properties.");
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [status, accessToken]);

  // Signed in, but without a backend token (e.g. the backend was unreachable during
  // Google sign-in): nothing can load until the user signs in again.
  const missingToken = status === "authenticated" && !accessToken;
  const loading = status === "loading" || (status === "authenticated" && !missingToken && !loaded);

  async function handleRerun(property: SavedPropertyListItem) {
    if (!accessToken) return;

    setRerunningId(property.id);
    setError(null);

    try {
      const report = await analyzeAddress(property.address, accessToken);
      // Update the saved record too, so the list reflects the refreshed scores.
      await saveProperty(report, accessToken);
      saveReport(report);
      router.push("/report");
    } catch (err) {
      if (isExpiredSession(err)) {
        await signInAgain();
        return;
      }
      setError(err instanceof Error ? err.message : "Re-run failed.");
      setRerunningId(null);
    }
  }

  async function handleDelete(property: SavedPropertyListItem) {
    if (!accessToken || deletingId !== null) return;
    if (!window.confirm(`Delete the saved analysis for ${property.address}?`)) return;

    setDeletingId(property.id);
    setError(null);

    try {
      await deleteProperty(property.id, accessToken);
      setProperties((prev) => prev.filter((p) => p.id !== property.id));
    } catch (err) {
      if (isExpiredSession(err)) {
        await signInAgain();
        return;
      }
      setError("Failed to delete property.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHero eyebrow="Saved analyses" title="My Properties">
        Saved climate risk analyses. Re-run an address to refresh scores with the latest data.
      </PageHero>

      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        {error && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-line bg-risk-high-soft px-4 py-3 text-sm font-medium text-risk-high-ink"
          >
            {error}
          </p>
        )}

        {missingToken && (
          <div className="rounded-2xl border border-dashed border-warn-line bg-warn-soft px-6 py-6 text-sm text-ink">
            We couldn&apos;t connect your account to the analysis service.{" "}
            <button type="button" onClick={signInAgain} className={linkClass}>
              Sign in again
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1].map((index) => (
              <div key={index} className={`${cardClass} h-24 animate-pulse bg-surface-2`} />
            ))}
          </div>
        )}
        {loading && <p className="sr-only">Loading saved properties...</p>}

        {!loading && !missingToken && !error && properties.length === 0 && (
          <div className={`${cardClass} flex flex-col items-center px-6 py-14 text-center`}>
            <HazardBadge name="home" className="h-14 w-14 border-line text-accent-ink" />
            <p className="mt-5 font-display text-3xl text-ink">No saved properties yet.</p>
            <Link href="/" className={`mt-6 ${buttonClass("primary")}`}>
              Analyze an address and save it from the dashboard
            </Link>
          </div>
        )}

        {!loading && properties.length > 0 && (
          <ul className="space-y-3">
            {properties.map((property) => {
              const verdict = property.verdict ? verdictStyles[property.verdict] : null;
              return (
                <li
                  key={property.id}
                  className={`${cardClass} flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between`}
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <HazardBadge name="home" />
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-ink">{property.address}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        Last updated {formatDate(property.updated_at)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-ink">
                          {property.overall_risk_score != null
                            ? `Score ${property.overall_risk_score}`
                            : "Score unavailable"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 ${
                            verdict
                              ? `${verdict.soft} ${verdict.ink}`
                              : "border border-dashed border-line text-ink-muted"
                          }`}
                        >
                          {property.verdict ?? "Verdict unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-start gap-2">
                    <button
                      type="button"
                      onClick={() => handleRerun(property)}
                      disabled={rerunningId === property.id}
                      className={buttonClass("primary", "sm")}
                    >
                      {rerunningId === property.id ? "Re-running..." : "Re-run Analysis"}
                    </button>
                    <DownloadPdfButton propertyId={property.id} />
                    <button
                      type="button"
                      onClick={() => handleDelete(property)}
                      disabled={deletingId === property.id}
                      className={buttonClass("danger", "sm")}
                    >
                      {deletingId === property.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
