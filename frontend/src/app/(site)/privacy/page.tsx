export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-primary">Privacy Policy</h1>
      <p className="mt-4 text-sm text-zinc-500">Last updated: August 27, 2026</p>
      <div className="mt-8 space-y-10 leading-7 text-zinc-700">
        <section className="space-y-4">
          <p>
            This Privacy Policy explains how Climate Risk Analyzer
            (&quot;ClimateRisk,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) handles information when you use
            the app. It is written to match the product&apos;s current behavior as of
            the date above.
          </p>
          <p>
            ClimateRisk analyzes property addresses, generates climate-risk
            reports, offers optional account features such as saved properties and
            PDF downloads, and may show an AI-generated summary alongside the
            underlying public-data analysis.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Information We Collect
          </h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Account information.</strong> If you create an account with
              email and password, the app collects your email address, optional
              name, and a hashed version of your password. If you sign in with
              Google, the app stores your Google account ID, email address, and
              name if Google provides it.
            </li>
            <li>
              <strong>Addresses you submit for analysis.</strong> When you enter a
              property address, the app sends that address to the backend so it
              can geocode the location and generate a report.
            </li>
            <li>
              <strong>Saved property records.</strong> If you choose to save a
              property, the app stores the formatted address, latitude,
              longitude, report data, generated verdict and scores, AI summary if
              one was returned, and timestamps for creation and updates.
            </li>
            <li>
              <strong>Generated PDF files.</strong> If you generate a PDF for a
              saved property, the PDF is written to server-side file storage and
              a time-limited download link is created for that file.
            </li>
            <li>
              <strong>Technical monitoring data.</strong> If Sentry is configured
              for the deployment, the frontend and backend may send error and
              performance telemetry to Sentry.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            How We Use Information
          </h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>To authenticate users and maintain signed-in sessions.</li>
            <li>To geocode submitted addresses and generate climate-risk reports.</li>
            <li>To let signed-in users save, re-run, and delete property analyses.</li>
            <li>To generate downloadable PDF reports for saved properties.</li>
            <li>To generate an optional AI summary based on the report data.</li>
            <li>To diagnose product errors and monitor performance when Sentry is enabled.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Third-Party Services and Data Sources
          </h2>
          <p>
            ClimateRisk depends on a small set of third-party services and public
            data sources to produce results:
          </p>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Google Maps Geocoding API:</strong> receives the address you
              submit so the app can convert it into coordinates and a formatted
              address.
            </li>
            <li>
              <strong>NOAA:</strong> provides public climate and weather data used
              in heat and hurricane analysis.
            </li>
            <li>
              <strong>FEMA National Flood Hazard Layer (NFHL):</strong> provides
              flood-zone and flood-hazard data.
            </li>
            <li>
              <strong>USGS / NIFC wildfire services:</strong> provide wildfire
              perimeter data used in wildfire analysis.
            </li>
            <li>
              <strong>OpenAI:</strong> receives report data when the app requests
              an AI-generated summary.
            </li>
            <li>
              <strong>Sentry:</strong> may receive technical error and performance
              data if monitoring is enabled for the deployment.
            </li>
          </ul>
          <p>
            NASA EarthData is referenced in some project documentation, but the
            current production app does not query NASA data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Cookies, Session Storage, and Similar Technologies
          </h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              The app uses authentication cookies managed by NextAuth to keep
              signed-in users logged in.
            </li>
            <li>
              The browser stores the current climate report in
              <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
                sessionStorage
              </code>
              so you can open the report page without re-running the analysis.
            </li>
            <li>
              The current codebase does not include separate advertising cookies
              or standalone product analytics tooling.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">Data Retention</h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              Account records are kept until they are deleted from the system.
              The current app does not provide a self-serve account deletion flow.
            </li>
            <li>
              Saved properties and their stored report data remain in the
              database until you delete them from the My Properties page or ask
              us to remove them.
            </li>
            <li>
              The report stored in your browser
              <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
                sessionStorage
              </code>
              remains there until your browser session is cleared or a newer
              report replaces it.
            </li>
            <li>
              Backend access tokens expire automatically. PDF download links are
              signed and currently expire after 60 minutes.
            </li>
            <li>
              Generated PDF files are stored on the server after creation. The
              current code does not automatically remove an existing PDF file
              when its saved property record is deleted.{" "}
              <strong>[PLACEHOLDER — needs legal review]</strong>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Your Rights and Choices
          </h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>You can choose whether to create an account at all.</li>
            <li>
              You can delete saved properties from the My Properties page inside
              the app.
            </li>
            <li>
              If you want to request access to, correction of, or deletion of
              account-related information, use the contact details below.
            </li>
          </ul>
          <p>
            Because the product does not currently include self-serve tools for
            every privacy request, some requests may need to be handled manually.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">Security</h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>Email/password accounts store hashed passwords rather than plain text passwords.</li>
            <li>Google sign-in uses Google ID token verification before a local access token is issued.</li>
            <li>PDF downloads for saved properties use signed, time-limited links.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">Contact</h2>
          <p>
            Questions, privacy requests, and data requests can be sent through
            the Contact page or by opening an issue at{" "}
            <a
              href="https://github.com/dagim-dev/climate-risk-platform/issues"
              className="font-medium text-brand-primary underline decoration-brand-accent underline-offset-4 hover:text-brand-accent"
            >
              github.com/dagim-dev/climate-risk-platform/issues
            </a>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy as the product changes. When we do,
            we will update the &quot;Last updated&quot; date on this page.
          </p>
        </section>
      </div>
    </div>
  );
}
