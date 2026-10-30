import type { ReactNode } from "react";

import { eyebrowClass } from "@/lib/ui";

interface PageHeroProps {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
}

/** Dark starfield band that opens content pages. */
export function PageHero({ eyebrow, title, children, align = "left" }: PageHeroProps) {
  const alignment = align === "center" ? "items-center text-center" : "";

  return (
    <section className="starfield on-dark relative overflow-hidden px-4 pb-16 pt-14 text-white sm:px-6 sm:pb-20 sm:pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 h-72 w-[140%] -translate-x-1/2 rounded-[100%] bg-brand-accent/10 blur-3xl"
      />
      <div className={`relative mx-auto flex max-w-4xl flex-col ${alignment}`}>
        {eyebrow && <p className={`${eyebrowClass} text-brand-accent`}>{eyebrow}</p>}
        <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg leading-8 text-white/75">{children}</div>}
      </div>
    </section>
  );
}
