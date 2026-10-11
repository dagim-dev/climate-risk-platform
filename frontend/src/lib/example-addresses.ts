export interface ExampleAddress {
  category: string;
  icon: string;
  /** Short label shown on the pill. */
  place: string;
  /** Full address sent to /analyze. */
  address: string;
}

// The labels promise what the report will show, so every entry is a public place checked
// against live data (2026-10-11; scores in comments). Re-check if a scorer or source changes.
export const EXAMPLE_ADDRESSES: readonly ExampleAddress[] = [
  {
    // hurricane 100, heat 87, flood 40, wildfire 0
    category: "Hurricane",
    icon: "🌀",
    place: "New Orleans, LA",
    address: "1300 Perdido St, New Orleans, LA 70112",
  },
  {
    // flood 88, heat 32, wildfire 9, hurricane 7
    category: "Flood",
    icon: "🌊",
    place: "Annapolis, MD",
    address: "1 Dock St, Annapolis, MD 21401",
  },
  {
    // wildfire 78, flood 12, heat 1, hurricane 0
    category: "Wildfire",
    icon: "🔥",
    place: "Big Bear Lake, CA",
    address: "39707 Big Bear Blvd, Big Bear Lake, CA 92315",
  },
  {
    // heat 100, flood 40, wildfire 8, hurricane 0
    category: "Heat",
    icon: "🌡️",
    place: "Phoenix, AZ",
    address: "200 W Washington St, Phoenix, AZ 85003",
  },
  {
    // overall 6, verdict Go: flood 12, heat 8, wildfire 2, hurricane 0
    category: "Lower risk",
    icon: "🏡",
    place: "Madison, WI",
    address: "2 E Main St, Madison, WI 53703",
  },
];
