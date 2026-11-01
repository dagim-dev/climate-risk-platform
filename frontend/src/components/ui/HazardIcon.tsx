export type HazardIconName = "flood" | "hurricane" | "heat" | "wildfire" | "home";

const PATHS: Record<HazardIconName, string[]> = {
  flood: [
    "M3 8.5c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5",
    "M3 12.5c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5",
    "M3 16.5c1.5 0 1.5-1.5 3-1.5s1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5",
  ],
  hurricane: [
    "M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z",
    "M15 5.2C10.5 3 5 5.5 4.5 11.5",
    "M9 18.8c4.5 2.2 10-.3 10.5-6.3",
  ],
  heat: [
    "M14 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z",
    "M12 10v7",
    "M17.5 6h2.5M17.5 9.5h1.5",
  ],
  wildfire: [
    "M12 3c.6 3.2 5 5.4 5 10.5a5 5 0 0 1-10 0c0-2.6 1.4-4.2 2.6-5.3.1 2 .9 3.2 2.1 3.4.2-3-.9-5.4.3-8.6Z",
  ],
  home: ["M4 11 12 4.5l8 6.5v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5Z"],
};

/** Line icon for a hazard; decorative, so always hidden from assistive tech. */
export function HazardIcon({ name, className = "h-5 w-5" }: { name: HazardIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** The icon inside an outlined circle, as in the hero and the score cards. */
export function HazardBadge({
  name,
  className = "h-11 w-11 border-line text-accent-ink",
}: {
  name: HazardIconName;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border ${className}`}
      aria-hidden="true"
    >
      <HazardIcon name={name} className="h-1/2 w-1/2" />
    </span>
  );
}
