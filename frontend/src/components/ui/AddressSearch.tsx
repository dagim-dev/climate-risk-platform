"use client";

import { useId, useState, type FormEvent } from "react";
import { analyzeAddress } from "@/lib/api-client";
import type { ClimateRiskReport } from "@/types/risk";

interface AddressSearchProps {
  onResult: (report: ClimateRiskReport) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function AddressSearch({ onResult, onLoadingChange }: AddressSearchProps) {
  const inputId = useId();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLoadingState = (value: boolean) => {
    setLoading(value);
    onLoadingChange?.(value);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = address.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoadingState(true);
    try {
      const report = await analyzeAddress(trimmed);
      onResult(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingState(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Property address
        </label>
        <input
          id={inputId}
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Enter a property address (e.g., 123 Main St, Miami, FL)"
          autoComplete="street-address"
          disabled={loading}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 shadow-sm outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40 disabled:cursor-not-allowed disabled:bg-zinc-100"
        />
        <button
          type="submit"
          disabled={loading || address.trim().length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              Analyzing...
            </>
          ) : (
            "Analyze Risk"
          )}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-risk-high">
          {error}
        </p>
      )}
    </form>
  );
}
