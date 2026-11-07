import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { eyebrowClass } from "@/lib/ui";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/contact", label: "Contact" },
] as const;

const dataSources = ["NOAA", "FEMA NFHL", "USFS", "NIFC"] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="starfield on-dark mt-auto border-t border-white/10 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-6 text-white/70">
            Free, address-level climate risk for U.S. properties, built on public data.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className={`${eyebrowClass} text-white/60`}>Explore</p>
          <ul className="mt-4 space-y-2.5">
            {footerLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm text-white/80 transition-colors hover:text-brand-accent"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className={`${eyebrowClass} text-white/60`}>Data sources</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {dataSources.map((source) => (
              <li
                key={source}
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80"
              >
                {source}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/60 sm:px-6">
          &copy; {year} ClimateRisk. All rights reserved. Homepage Earth is an illustration made
          from NASA Blue Marble, GEBCO elevation and NOAA GOES imagery.
        </p>
      </div>
    </footer>
  );
}
