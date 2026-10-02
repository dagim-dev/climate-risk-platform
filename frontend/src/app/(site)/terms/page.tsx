import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-primary">Terms of Service</h1>
      <p className="mt-4 text-sm text-zinc-500">Last updated: October 2, 2026</p>
      <div className="mt-8 space-y-10 leading-7 text-zinc-700">
        <section className="space-y-4">
          <p>
            These Terms of Service govern your use of Climate Risk Analyzer
            (&quot;ClimateRisk,&quot; &quot;the service,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By using the
            service, you agree to these terms. The service is operated by Dagim
            Mekonnen, an independent developer based in the United States. How we
            handle personal information is described in our{" "}
            <Link
              href="/privacy"
              className="font-medium text-brand-primary underline decoration-brand-accent underline-offset-4 hover:text-brand-accent"
            >
              Privacy Policy
            </Link>
            .
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
            through your account, so keep your password secure and tell us
            promptly if you believe your account has been compromised.
          </p>
          <p>
            You must be at least 13 years old to use the service. If you are
            under the age of majority where you live, you may use it only with
            the permission of a parent or legal guardian.
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
            including Google Maps Geocoding, NOAA, FEMA NFHL, USFS and NIFC wildfire
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
              Only today&apos;s scores are assessed. The 2030, 2040, and 2050 points
              in the trend chart are illustrative linear projections from those
              scores, not outputs of a climate model, and no past scores are shown.
            </li>
            <li>
              Wildfire scores are derived from U.S. Forest Service Wildfire Hazard
              Potential data and nearby historical fire records. They are not
              official wildland-urban interface designations or insurance
              wildfire ratings.
            </li>
            <li>
              If a data source cannot be reached or does not cover a location,
              that hazard is shown as unavailable rather than estimated, and no
              overall verdict is given unless all four hazards were assessed.
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
            Disclaimer of Warranties
          </h2>
          <p>
            The service is provided free of charge on an &quot;as is&quot; and &quot;as
            available&quot; basis. To the fullest extent permitted by law, we
            disclaim all warranties, express or implied, including warranties of
            merchantability, fitness for a particular purpose, accuracy, and
            non-infringement. We do not guarantee that the service or its data
            will be accurate, complete, current, uninterrupted, secure, or free of
            errors.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, ClimateRisk and its operator
            will not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or for any loss of profits,
            revenue, data, or property value, arising from your use of, or
            reliance on, the service or its outputs, including decisions related
            to property acquisition, underwriting, financing, pricing, insurance,
            or risk management.
          </p>
          <p>
            Our total liability for any claim relating to the service will not
            exceed one hundred U.S. dollars (US$100). Some jurisdictions do not
            allow certain of these limitations, so they apply to you only to the
            extent permitted by law.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Governing Law and Venue
          </h2>
          <p>
            These terms are governed by the laws of the Commonwealth of Virginia,
            United States, without regard to its conflict-of-law rules. Any
            dispute relating to these terms or the service will be brought
            exclusively in the state or federal courts located in Virginia, and
            you and we consent to the jurisdiction of those courts. Before filing
            a claim, please contact us so we can try to resolve the issue
            informally.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-brand-primary">
            Suspension and Termination
          </h2>
          <p>
            You may stop using the service at any time and ask us to delete your
            account as described in the Privacy Policy. We may suspend or end
            access for anyone who violates these terms, and we may change or
            discontinue the service, in whole or in part, at any time.
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
            Questions about these terms can be sent to{" "}
            <a
              href="mailto:dagimmekonnen3@gmail.com"
              className="font-medium text-brand-primary underline decoration-brand-accent underline-offset-4 hover:text-brand-accent"
            >
              dagimmekonnen3@gmail.com
            </a>
            . Bug reports can also be opened as issues at{" "}
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
