import { useId } from "react";
import type { AddressSearchState } from "@/lib/use-address-search";
import { buttonClass, inputClass } from "@/lib/ui";

interface AddressSearchProps {
  search: AddressSearchState;
  /** `dark` for the starfield hero, `light` for regular surfaces (follows the theme). */
  tone?: "dark" | "light";
}

const TONES = {
  dark: {
    form: "rounded-3xl border border-white/15 bg-white/[0.07] p-2 shadow-[0_20px_60px_rgb(0_0_0/0.35)] backdrop-blur-md @xl:rounded-full",
    input:
      "w-full flex-1 rounded-2xl bg-transparent px-4 py-3 text-ellipsis text-base text-white placeholder:text-white/85 outline-none focus-visible:outline-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-60 @xl:rounded-full",
    button: buttonClass("glow", "lg"),
    error: "text-rose-200",
  },
  light: {
    form: "",
    input: `${inputClass} flex-1`,
    button: buttonClass("primary", "lg"),
    error: "text-risk-high-ink",
  },
} as const;

/** The search box. Its state lives in `useAddressSearch`, so other controls can drive it. */
export function AddressSearch({ search, tone = "light" }: AddressSearchProps) {
  const inputId = useId();
  const { address, setAddress, loading, error, submit } = search;
  const styles = TONES[tone];

  return (
    <form onSubmit={submit} className="@container w-full max-w-2xl" noValidate>
      <div className={`flex flex-col gap-2 @xl:flex-row @xl:items-center ${styles.form}`}>
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
    </form>
  );
}
