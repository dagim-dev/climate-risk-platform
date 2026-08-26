"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-9 w-24 rounded-md bg-white/10" aria-hidden="true" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/properties"
          className="text-sm font-medium text-white/80 transition-colors hover:text-brand-accent"
        >
          My Properties
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md border border-white/30 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/sign-in"
      className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-primary transition-colors hover:bg-brand-accent/90"
    >
      Sign In
    </Link>
  );
}
