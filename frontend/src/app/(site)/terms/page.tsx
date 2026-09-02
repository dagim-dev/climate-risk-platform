export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-primary">Terms of Service</h1>
      <p className="mt-4 text-sm text-zinc-500">Last updated: August 27, 2026</p>
      <div className="mt-8 space-y-10 leading-7 text-zinc-700">
        <section className="space-y-4">
          <p>
            These Terms of Service govern your use of Climate Risk Analyzer
            (&quot;ClimateRisk,&quot; &quot;the service,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By using the
            service, you agree to these terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            What the Service Does
          </h2>
          <p>
            ClimateRisk provides address-level climate-risk analysis using public
            data sources and related services. Depending on how you use the app,
            the service may:
          </p>
          <ul className="list-disc space-y-3 pl-6">
            <li>geocode a submitted property address,</li>
            <li>generate flood, hurricane, heat, and wildfire scores,</li>
            <li>generate an optional AI-written summary,</li>
            <li>let signed-in users save properties, and</li>
            <li>create downloadable PDF reports for saved properties.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Accounts and Access
          </h2>
          <p>
            Some features are public, and some require an account. You may sign
            in with email and password or with Google. You are responsible for
            the accuracy of information you submit and for activity that occurs
            through your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Acceptable Use
          </h2>
          <p>You may use the service only in lawful, reasonable ways.</p>
          <ul className="list-disc space-y-3 pl-6">
            <li>Do not attempt to gain unauthorized access to accounts, tokens, or infrastructure.</li>
            <li>Do not interfere with the service or overload it with abusive automated traffic.</li>
            <li>Do not submit malicious code or use the service to harm others.</li>
            <li>Do not misrepresent ClimateRisk output as certified professional advice or guaranteed fact.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Data Sources and Third-Party Services
          </h2>
          <p>
            ClimateRisk depends on third-party services and public datasets,
            including Google Maps Geocoding, NOAA, FEMA NFHL, USGS/NIFC wildfire
            services, OpenAI for optional summaries, and Sentry for monitoring when
            enabled.
          </p>
          <p>
            Those services may change, become unavailable, rate-limit requests,
            or return incomplete data. ClimateRisk is not responsible for third-party
            outages or changes outside our control.
          </p>
          <p>
            NASA EarthData is not currently queried by the production app.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Informational Use Only
          </h2>
          <p>
            ClimateRisk is provided for informational and research use. Risk
            scores, verdicts, trend charts, PDFs, and AI summaries are not
            financial, investment, insurance, engineering, legal, or emergency
            management advice.
          </p>
          <p>
            You are responsible for any business, lending, acquisition,
            development, or insurance decision you make using the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Methodology and Output Limits
          </h2>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              Results are based on current scoring logic, public datasets, and
              supporting service integrations available at the time of the request.
            </li>
            <li>
              Historical trend points shown in the app are interpolated from the
              current analysis. They are not separate historical analyses run on
              archived year-specific inputs.
            </li>
            <li>
              Wildfire-related labels in the current app are inferred from nearby
              fire counts and location data rather than official wildland-urban
              interface or National Weather Service fire weather zone maps.
            </li>
            <li>
              AI summaries are machine-generated from report data and may be
              incomplete or imperfect.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Open-Source License
          </h2>
          <p>
            The source code repository is licensed under the MIT License. These
            Terms govern use of the hosted service and do not replace the MIT
            License terms that apply to the source code itself.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Disclaimer of Warranties <span className="font-medium">[PLACEHOLDER — needs legal review]</span>
          </h2>
          <p>
            The service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We
            do not guarantee that the service will always be accurate,
            uninterrupted, secure, or fit for a particular purpose.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Limitation of Liability <span className="font-medium">[PLACEHOLDER — needs legal review]</span>
          </h2>
          <p>
            To the fullest extent permitted by law, ClimateRisk and its operator
            should not be liable for losses or damages arising from use of, or
            reliance on, the service or its outputs, including decisions related
            to property acquisition, underwriting, financing, pricing, or risk
            management.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Governing Law and Venue <span className="font-medium">[PLACEHOLDER — needs legal review]</span>
          </h2>
          <p>
            These terms should specify the governing law, venue, and any dispute
            resolution rules chosen for the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">Changes to These Terms</h2>
          <p>
            We may update these Terms of Service as the product changes. When we
            do, we will update the &quot;Last updated&quot; date on this page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">Contact</h2>
          <p>
            Questions about these terms can be sent through the Contact page or
            by opening an issue at{" "}
            <a
              href="https://github.com/dagim-dev/climate-risk-platform/issues"
              className="font-medium text-brand-primary underline decoration-brand-accent underline-offset-4 hover:text-brand-accent"
            >
              github.com/dagim-dev/climate-risk-platform/issues
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
