import Link from "next/link";

import { PageHero } from "@/components/ui/PageHero";
import { buttonClass, cardClass } from "@/lib/ui";

const features = [
  "Unlimited property analyses",
  "Four-hazard risk dashboard",
  "Go / Caution / Avoid verdict",
  "AI-generated risk summary",
  "Save unlimited properties",
  "PDF report download",
  "Historical trend charts",
];

export default function PricingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHero eyebrow="Pricing" title="Completely Free" align="center">
        Every feature is available to every user at no cost. No paid tiers, no
        feature gates, no credit card required.
      </PageHero>

      <div className="px-4 pb-20 sm:px-6">
        <div className={`${cardClass} relative mx-auto -mt-10 max-w-2xl p-8 sm:p-10`}>
          <h2 className="font-display text-3xl text-ink">All Features Included</h2>
          <ul className="mt-6 grid gap-3 text-ink sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-risk-low-soft text-xs font-bold text-risk-low-ink"
                >
                  &#10003;
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <Link href="/" className={`mt-8 ${buttonClass("primary", "lg")}`}>
            Start Analyzing
          </Link>
        </div>
      </div>
    </div>
  );
}
