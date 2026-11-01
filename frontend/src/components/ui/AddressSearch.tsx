"use client";

import { useId, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { analyzeAddress } from "@/lib/api-client";
import { buttonClass, inputClass } from "@/lib/ui";
import type { ClimateRiskReport } from "@/types/risk";
import { ExampleAddresses } from "@/components/ui/ExampleAddresses";

interface AddressSearchProps {
  onResult: (report: ClimateRiskReport) => void;
  onLoadingChange?: (loading: boolean) => void;
  showExamples?: boolean;
  /** `dark` for the starfield hero, `light` for regular surfaces (follows the theme). */
  tone?: "dark" | "light";
}

const TONES = {
  dark: {
    form: "rounded-3xl border border-white/15 bg-white/[0.07] p-2 shadow-[0_20px_60px_rgb(0_0_0/0.35)] backdrop-blur-md sm:rounded-full",
    input:
      "w-full flex-1 rounded-2xl bg-transparent px-4 py-3 text-base text-white placeholder:text-white/60 outline-none focus-visible:outline-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-full",
    button: buttonClass("glow", "lg"),
    error: "text-rose-300",
  },
  light: {
    form: "",
    input: `${inputClass} flex-1`,
    button: buttonClass("primary", "lg"),
    error: "text-risk-high-ink",
  },
} as const;

export function AddressSearch({
  onResult,
  onLoadingChange,
  showExamples = false,
  tone = "light",
}: AddressSearchProps) {
  const inputId = useId();
  const { data: session } = useSession();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = TONES[tone];

  const setLoadingState = (value: boolean) => {
    setLoading(value);
    onLoadingChange?.(value);
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runAnalysis(address);
  }

  function handleExampleSelect(example: string) {
    setAddress(example);
    runAnalysis(example);
  }

  async function runAnalysis(value: string) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoadingState(true);
    try {
      const report = await analyzeAddress(trimmed, session?.accessToken);
      onResult(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingState(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl" noValidate>
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-center ${styles.form}`}>
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
          className={styles.input}
        />
        <button
          type="submit"
          disabled={loading || address.trim().length === 0}
          className={`${styles.button} shrink-0`}
        >
          {loading ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
              />
              Analyzing...
            </>
          ) : (
            "Analyze Risk"
          )}
        </button>
      </div>

      {error && (
        <p role="alert" className={`mt-3 px-2 text-sm font-medium ${styles.error}`}>
          {error}
        </p>
      )}

      {showExamples && <ExampleAddresses onSelect={handleExampleSelect} disabled={loading} />}
    </form>
  );
}
