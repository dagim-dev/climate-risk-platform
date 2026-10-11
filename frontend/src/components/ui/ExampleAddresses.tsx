import { EXAMPLE_ADDRESSES } from "@/lib/example-addresses";

interface ExampleAddressesProps {
  onSelect: (address: string) => void;
  disabled: boolean;
}

export function ExampleAddresses({ onSelect, disabled }: ExampleAddressesProps) {
  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <p className="text-sm text-zinc-500">No address in mind? Try an example:</p>
      <ul className="flex flex-wrap justify-center gap-2">
        {EXAMPLE_ADDRESSES.map((example) => (
          <li key={example.category}>
            <button
              type="button"
              onClick={() => onSelect(example.address)}
              disabled={disabled}
              aria-label={`Try an example: ${example.category}, ${example.place}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-brand-accent hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span aria-hidden="true">{example.icon}</span>
              <span className="font-semibold text-brand-primary">{example.category}</span>
              <span aria-hidden="true" className="text-zinc-300">
                ·
              </span>
              <span className="text-zinc-600">{example.place}</span>
            </button>
          </li>
        ))}
      </ul>
      <a
        href="https://www.google.com/maps"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-base font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-brand-primary hover:underline"
      >
        <span aria-hidden="true">📍 </span>
        or find one on Google Maps
        <span aria-hidden="true"> ↗</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}
