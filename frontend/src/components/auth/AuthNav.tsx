"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { buttonClass } from "@/lib/ui";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-9 w-24 rounded-full bg-white/10" aria-hidden="true" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/properties"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
        >
          My Properties
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={buttonClass("onDark", "sm")}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Link href="/sign-in" className={buttonClass("glow", "sm")}>
      Sign In
    </Link>
  );
}
