export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-primary">Privacy Policy</h1>
      <p className="mt-4 text-sm text-zinc-500">Last updated: August 26, 2026</p>
      <div className="mt-8 space-y-6 leading-7 text-zinc-700">
        <p>
          ClimateRisk is a free climate-risk analysis tool. We collect the
          information needed to run the product: addresses you analyze, account
          details if you sign in, and saved properties you choose to store.
        </p>
        <p>
          Authentication may use email and password or Google OAuth. We store a
          hashed password for email accounts and a Google account identifier for
          OAuth accounts. We do not sell personal data.
        </p>
        <p>
          Climate scores are generated from public government datasets (NOAA,
          FEMA, USGS/NIFC) plus an optional AI summary from OpenAI. Map views
          use Mapbox. Those providers process the location data required to
          fulfill the request.
        </p>
        <p>
          You can delete saved properties from the My Properties page. For other
          account or data requests, use the Contact page.
        </p>
      </div>
    </div>
  );
}
