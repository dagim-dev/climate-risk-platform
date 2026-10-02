import Link from "next/link";

import { LogoMark } from "@/components/layout/Logo";

const footerLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/contact", label: "Contact" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-brand-primary/10 bg-brand-primary text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="flex items-center gap-2 text-sm text-white/70">
          <LogoMark className="h-6 w-6 shrink-0" />
          <span>&copy; {year} ClimateRisk. All rights reserved.</span>
        </p>

        <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer">
          {footerLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-white/70 transition-colors hover:text-brand-accent"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
