"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const tiers = [
  {
    name: "Individual",
    price: "$49",
    suffix: "/month",
    priceEnvKey: "individual",
    features: [
      "50 property analyses per month",
      "Save up to 25 properties",
      "Four-hazard risk dashboard",
      "Go / Caution / Avoid verdict",
      "PDF report download",
    ],
  },
  {
    name: "Professional",
    price: "$99",
    suffix: "/month",
    priceEnvKey: "professional",
    features: [
      "200 property analyses per month",
      "Unlimited saved properties",
      "Everything in Individual",
      "Historical trend charts",
      "Priority data refreshes",
    ],
    featured: true,
  },
  {
    name: "Business",
    price: "$500–$5,000",
    suffix: "/month",
    priceEnvKey: "business",
    features: [
      "Unlimited analyses",
      "Team access & collaboration",
      "All Professional features",
      "Portfolio-scale workflows",
      "Dedicated support",
    ],
  },
] as const;

const PRICE_IDS: Record<string, string> = {
  individual: process.env.NEXT_PUBLIC_STRIPE_PRICE_INDIVIDUAL ?? "",
  professional: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL ?? "",
  business: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS ?? "",
};

async function startCheckout(priceKey: string): Promise<string> {
  const priceId = PRICE_IDS[priceKey];
  if (!priceId || !API_BASE) {
    throw new Error("Stripe is not configured. Set price IDs in your environment.");
  }

  const res = await fetch(`${API_BASE}/api/v1/billing/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price_id: priceId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).detail ?? "Failed to start checkout");
  }

  const data = (await res.json()) as { checkout_url: string };
  return data.checkout_url;
}

export default function PricingPage() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = useCallback(async (priceKey: string) => {
    setError(null);
    setLoadingTier(priceKey);
    try {
      const url = await startCheckout(priceKey);
      globalThis.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingTier(null);
    }
  }, []);

  return (
    <div className="bg-zinc-50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
          Plans for every property workflow
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
          Choose the analysis capacity that matches how your team evaluates climate
          exposure.
        </p>

        <div className="mt-4 rounded-md bg-zinc-100 px-4 py-2 text-xs text-zinc-500">
          Free tier: 3 analyses per day · No saved properties · No PDF download
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`flex flex-col rounded-xl border bg-white p-7 text-left shadow-sm ${
                "featured" in tier && tier.featured
                  ? "border-brand-accent ring-2 ring-brand-accent/20"
                  : "border-zinc-200"
              }`}
            >
              <h2 className="text-xl font-semibold text-brand-primary">{tier.name}</h2>
              <p className="mt-4">
                <span className="text-3xl font-bold text-brand-primary">{tier.price}</span>
                <span className="text-zinc-500">{tier.suffix}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-zinc-700">
                {tier.features.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleSubscribe(tier.priceEnvKey)}
                disabled={loadingTier !== null}
                className={`mt-8 rounded-md px-5 py-3 font-semibold text-white transition-colors ${
                  loadingTier === tier.priceEnvKey
                    ? "cursor-wait bg-brand-primary/70"
                    : "bg-brand-primary hover:bg-brand-primary/90"
                }`}
              >
                {loadingTier === tier.priceEnvKey ? "Redirecting…" : "Get Started"}
              </button>
            </article>
          ))}
        </div>

        <p className="mt-10 text-zinc-600">
          Need an enterprise plan?{" "}
          <Link href="/contact" className="font-semibold text-brand-primary underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
