import { HazardIcon, type HazardIconName } from "@/components/ui/HazardIcon";
import { EXAMPLE_ADDRESSES } from "@/lib/example-addresses";

interface ExampleAddressesProps {
  onSelect: (address: string) => void;
  disabled: boolean;
}

const CATEGORY_ICONS: Record<string, HazardIconName> = {
  Hurricane: "hurricane",
  Flood: "flood",
  Wildfire: "wildfire",
  Heat: "heat",
  "Lower risk": "home",
};

/** Example pills for the dark hero. */
export function ExampleAddresses({ onSelect, disabled }: ExampleAddressesProps) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <p className="px-1 text-sm text-white/70">No address in mind? Try an example:</p>
      <ul className="flex flex-wrap gap-2">
        {EXAMPLE_ADDRESSES.map((example) => {
          const iconName = CATEGORY_ICONS[example.category];
          return (
            <li key={example.category}>
              <button
                type="button"
                onClick={() => onSelect(example.address)}
                disabled={disabled}
                aria-label={`Try an example: ${example.category}, ${example.place}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 text-sm text-white transition hover:border-brand-accent/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-brand-accent"
                >
                  {iconName ? <HazardIcon name={iconName} className="h-4 w-4" /> : example.icon}
                </span>
                <span className="font-semibold">{example.category}</span>
                <span aria-hidden="true" className="text-white/40">
                  ·
                </span>
                <span className="text-white/75">{example.place}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <a
        href="https://www.google.com/maps"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1.5 self-start rounded px-1 text-base font-medium text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-brand-accent"
      >
        <span aria-hidden="true">📍</span>
        or find one on Google Maps
        <span aria-hidden="true">↗</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}
