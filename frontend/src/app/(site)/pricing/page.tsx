import Link from "next/link";

const tiers = [
  {
    name: "Individual",
    price: "$49",
    suffix: "/month",
    features: [
      "10 property analyses per month",
      "Four-hazard risk dashboard",
      "Go / Caution / Avoid verdict",
    ],
  },
  {
    name: "Professional",
    price: "$99",
    suffix: "/month",
    features: [
      "50 property analyses per month",
      "Everything in Individual",
      "Priority data refreshes",
    ],
    featured: true,
  },
  {
    name: "Business",
    price: "$500–$5,000",
    suffix: "/month",
    features: [
      "Custom analysis volume",
      "Portfolio-scale workflows",
      "Dedicated support",
    ],
  },
] as const;

export default function PricingPage() {
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
                disabled
                aria-disabled="true"
                title="Available in v2.0"
                className="mt-8 cursor-not-allowed rounded-md bg-brand-primary px-5 py-3 font-semibold text-white opacity-60"
              >
                Get Started
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
