import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function Header() {
  return (
    <header className="border-b border-brand-primary/10 bg-brand-primary text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          ClimateRisk
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-brand-accent"
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Sign in will be available in v2.0"
          className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-primary opacity-60 cursor-not-allowed"
        >
          Sign In
        </button>
      </div>
    </header>
  );
}
