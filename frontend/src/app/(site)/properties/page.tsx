"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { analyzeAddress, deleteProperty, listProperties, type SavedPropertyListItem } from "@/lib/api-client";
import { saveReport } from "@/lib/report-storage";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PropertiesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [properties, setProperties] = useState<SavedPropertyListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<number | null>(null);

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
      } catch {
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

  const loading = status === "loading" || (status === "authenticated" && !loaded);

  async function handleRerun(property: SavedPropertyListItem) {
    if (!accessToken) return;

    setRerunningId(property.id);
    setError(null);

    try {
      const report = await analyzeAddress(property.address, accessToken);
      saveReport(report);
      router.push("/report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-run failed.");
      setRerunningId(null);
    }
  }

  async function handleDelete(propertyId: number) {
    if (!accessToken) return;

    setError(null);

    try {
      await deleteProperty(propertyId, accessToken);
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch {
      setError("Failed to delete property.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-primary">My Properties</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Saved climate risk analyses. Re-run an address to refresh scores with the latest data.
      </p>

      {error && (
        <p role="alert" className="mt-6 text-sm font-medium text-risk-high">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-8 text-sm text-zinc-500">Loading saved properties...</p>
      )}

      {!loading && properties.length === 0 && (
        <div className="mt-8 rounded-md border border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
          <p className="text-zinc-600">No saved properties yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-semibold text-brand-primary hover:underline"
          >
            Analyze an address and save it from the dashboard
          </Link>
        </div>
      )}

      {!loading && properties.length > 0 && (
        <ul className="mt-8 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {properties.map((property) => (
            <li
              key={property.id}
              className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div>
                <p className="font-semibold text-brand-primary">{property.address}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Last updated {formatDate(property.updated_at)} · Score {property.overall_risk_score} ·{" "}
                  {property.verdict}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleRerun(property)}
                  disabled={rerunningId === property.id}
                  className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-60"
                >
                  {rerunningId === property.id ? "Re-running..." : "Re-run Analysis"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(property.id)}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
