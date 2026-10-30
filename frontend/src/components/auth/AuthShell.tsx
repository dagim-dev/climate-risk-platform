import type { ReactNode } from "react";

import { LogoMark } from "@/components/layout/Logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Starfield backdrop with a centered theme-aware card, shared by sign-in and sign-up. */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="starfield relative flex flex-1 items-center justify-center overflow-hidden px-4 py-14 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#1f6fb2_0%,#123a6b_45%,#071a36_75%)] opacity-70 shadow-[0_0_120px_rgb(56_189_248/0.35)]"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-[0_30px_80px_rgb(0_0_0/0.45)] sm:p-9">
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-5 font-display text-4xl text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
