import Link from "next/link";

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
    <div className="bg-zinc-50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">
          Completely Free
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">
          Every feature is available to every user at no cost. No paid tiers, no
          feature gates, no credit card required.
        </p>

        <div className="mt-12 rounded-xl border border-zinc-200 bg-white p-8 text-left shadow-sm">
          <h2 className="text-xl font-semibold text-brand-primary">
            All Features Included
          </h2>
          <ul className="mt-6 space-y-3 text-zinc-700">
            {features.map((feature) => (
              <li key={feature}>&#10003; {feature}</li>
            ))}
          </ul>
          <Link
            href="/"
            className="mt-8 inline-block rounded-md bg-brand-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-primary/90"
          >
            Start Analyzing
          </Link>
        </div>
      </div>
    </div>
  );
}
