import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { analyzeAddress } from "@/lib/api-client";
import type { ClimateRiskReport } from "@/types/risk";

interface AddressSearchOptions {
  onResult: (report: ClimateRiskReport) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export interface AddressSearchState {
  address: string;
  setAddress: (address: string) => void;
  loading: boolean;
  error: string | null;
  /** The form's submit handler: analyzes the typed address. */
  submit: (event: FormEvent<HTMLFormElement>) => void;
  /** Fills in an address and analyzes it right away, for the example pills. */
  searchFor: (address: string) => void;
}

/**
 * State of one address search. It's a hook so the box and the controls that feed it can sit apart,
 * as the hero's example pills do.
 */
export function useAddressSearch({
  onResult,
  onLoadingChange,
}: AddressSearchOptions): AddressSearchState {
  const { data: session } = useSession();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLoadingState = (value: boolean) => {
    setLoading(value);
    onLoadingChange?.(value);
  };

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

  return {
    address,
    setAddress,
    loading,
    error,
    submit: (event) => {
      event.preventDefault();
      runAnalysis(address);
    },
    searchFor: (example) => {
      setAddress(example);
      runAnalysis(example);
    },
  };
}
