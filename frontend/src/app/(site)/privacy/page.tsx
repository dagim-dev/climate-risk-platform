import type { ReactNode } from "react";
import Link from "next/link";

const CONTACT_EMAIL = "dagimmekonnen3@gmail.com";

const linkClass =
  "font-medium text-brand-primary underline decoration-brand-accent underline-offset-4 hover:text-brand-accent";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-2xl font-semibold text-brand-primary">{title}</h2>
      {children}
    </section>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-lg font-semibold text-zinc-900">{children}</h3>;
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function EmailLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
      {CONTACT_EMAIL}
    </a>
  );
}

const sections = [
  { id: "who-we-are", title: "Who We Are" },
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use-information", title: "How We Use Information" },
  { id: "google-user-data", title: "Google User Data" },
  { id: "how-information-is-shared", title: "How Information Is Shared" },
  { id: "cookies-and-storage", title: "Cookies and Browser Storage" },
  { id: "data-retention", title: "Data Retention" },
  { id: "your-rights", title: "Your Rights and Choices" },
  { id: "security", title: "Security" },
  { id: "where-data-is-stored", title: "Where Data Is Stored" },
  { id: "children", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact" },
];

const serviceProviders = [
  {
    name: "Vercel",
    purpose: "Hosts the website.",
    data: "Standard request data (IP address, browser type, pages requested) and the session cookie.",
  },
  {
    name: "Google Cloud (Cloud Run)",
    purpose: "Hosts the backend that runs analyses and manages accounts.",
    data: "Request data, account and saved-property data in transit, and server logs.",
  },
  {
    name: "Supabase",
    purpose: "Hosts the database.",
    data: "Account records and saved properties.",
  },
  {
    name: "Google Maps Platform (Geocoding API)",
    purpose: "Converts the address you enter into map coordinates.",
    data: "The address you submit.",
  },
  {
    name: "OpenAI",
    purpose: "Writes the optional plain-language summary of a report.",
    data: "The analyzed address and its hazard scores. No name, email address, or account information is sent.",
  },
  {
    name: "Public data agencies (NOAA, FEMA, U.S. Forest Service, NIFC) and the Esri ArcGIS mirror of FEMA flood maps",
    purpose: "Provide the climate and hazard data behind each score.",
    data: "Map coordinates only. These services never receive your address or any information about you.",
  },
  {
    name: "Sentry (only if error monitoring is turned on)",
    purpose: "Helps diagnose crashes and slow pages.",
    data: "Technical error details such as the page, browser type, and error message.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-primary">Privacy Policy</h1>
      <p className="mt-4 text-sm text-zinc-500">
        Effective date and last updated: October 2, 2026
      </p>
      <div className="mt-8 space-y-10 leading-7 text-zinc-700">
        <section className="space-y-4">
          <p>
            This Privacy Policy explains what information ClimateRisk (also called
            Climate Risk Analyzer, &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects when you use
            the website at climate-risk-platform-seven.vercel.app and its related
            services (the &quot;Service&quot;), how that information is used and shared,
            and the choices you have. By using the Service, you agree to the
            practices described here.
          </p>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <p className="font-semibold text-zinc-900">The short version</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                You can analyze an address without an account. Accounts are only
                needed to save properties and download PDF reports.
              </li>
              <li>
                We collect only what the Service needs to work: your email address,
                optional name, the addresses you analyze, and the properties you
                choose to save.
              </li>
              <li>
                We do not sell your information, show ads, or use advertising or
                analytics trackers.
              </li>
              <li>
                If you sign in with Google, we receive only your name, email
                address, and Google account ID, and we use them only to sign you in.
              </li>
              <li>
                You can delete saved properties at any time and ask us to delete
                your account by emailing <EmailLink />.
              </li>
            </ul>
          </div>
          <nav aria-label="Privacy policy sections">
            <p className="font-semibold text-zinc-900">Contents</p>
            <ol className="mt-3 list-decimal space-y-1 pl-6">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={linkClass}>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </section>

        <Section id="who-we-are" title="1. Who We Are">
          <p>
            ClimateRisk is a free, address-level climate-risk tool for U.S.
            properties. It is built and operated by Dagim Mekonnen, an independent
            developer based in the United States, who is responsible for the
            personal information described in this policy. You can reach him at{" "}
            <EmailLink />.
          </p>
        </Section>

        <Section id="information-we-collect" title="2. Information We Collect">
          <SubHeading>Information you give us</SubHeading>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Account information.</strong> If you create an account with
              an email address and password, we collect your email address, your
              name if you choose to provide it, and your password. We never store
              your password itself, only a one-way bcrypt hash of it.
            </li>
            <li>
              <strong>Addresses you analyze.</strong> When you enter a property
              address, we use it to find the location and build a climate-risk
              report. You do not need an account to do this.
            </li>
            <li>
              <strong>Saved properties.</strong> If you are signed in and choose to
              save a property, we store the formatted address, its map coordinates,
              the full report (hazard scores, verdict, trend projections, and the
              AI summary, if one was generated), and when it was saved and last
              updated.
            </li>
            <li>
              <strong>Messages you send us.</strong> If you email us, we receive
              your email address and whatever you include in the message.
            </li>
          </ul>

          <SubHeading>Information from Google sign-in</SubHeading>
          <p>
            If you choose &quot;Sign in with Google,&quot; we receive your Google account
            ID, email address, and name. See{" "}
            <a href="#google-user-data" className={linkClass}>
              Google User Data
            </a>{" "}
            below for exactly how this is handled.
          </p>

          <SubHeading>Information collected automatically</SubHeading>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Server logs.</strong> Like most websites, our hosting
              providers automatically record basic technical details about each
              request, such as IP address, browser type, the page or API endpoint
              requested, the date and time, and any error that occurred. If an
              analysis fails, the address involved may be written to the error log
              so the problem can be fixed.
            </li>
            <li>
              <strong>Cookies and browser storage.</strong> We use a small number
              of cookies that are strictly necessary to keep you signed in, plus
              your browser&apos;s session storage to hold your latest report. See{" "}
              <a href="#cookies-and-storage" className={linkClass}>
                Cookies and Browser Storage
              </a>
              .
            </li>
          </ul>

          <SubHeading>Information we do not collect</SubHeading>
          <ul className="list-disc space-y-3 pl-6">
            <li>We do not access your device&apos;s location (GPS).</li>
            <li>
              We do not collect payment information. The Service is free and has
              no paid features.
            </li>
            <li>
              We do not use advertising networks, cross-site tracking, or
              third-party analytics tools.
            </li>
            <li>
              We do not ask for sensitive information such as government ID
              numbers, financial account details, or health information.
            </li>
          </ul>
        </Section>

        <Section id="how-we-use-information" title="3. How We Use Information">
          <p>We use the information described above only to:</p>
          <ul className="list-disc space-y-3 pl-6">
            <li>create and secure your account and keep you signed in;</li>
            <li>
              find the location of an address and generate its flood, hurricane,
              heat, and wildfire report;
            </li>
            <li>generate the optional AI-written summary of a report;</li>
            <li>
              let you save, re-run, and delete properties, and generate PDF
              reports of them on request;
            </li>
            <li>respond to your questions and privacy requests;</li>
            <li>
              keep the Service running, diagnose errors, and prevent abuse such
              as automated overloading or attempts to access other users&apos;
              accounts; and
            </li>
            <li>comply with legal obligations.</li>
          </ul>
          <p>
            We do not use your information for advertising, we do not build
            profiles of you, and we do not sell or rent it to anyone. The Go /
            Caution / Avoid verdict describes a property&apos;s climate exposure; it is
            not a decision about you and has no legal or similar effect on you.
          </p>
        </Section>

        <Section id="google-user-data" title="4. Google User Data">
          <p>
            Signing in with Google is optional. You can always create an account
            with an email address and password instead.
          </p>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>What we access.</strong> We request only Google&apos;s basic
              sign-in scopes (&quot;openid,&quot; &quot;email,&quot; and &quot;profile&quot;). From these we
              receive your Google account ID, email address, and name. Google may
              also include a link to your profile photo; we do not save it in our
              database. We do not request access to Gmail, Google Drive, Google
              Calendar, Google Contacts, or any other Google data.
            </li>
            <li>
              <strong>How we use it.</strong> We use your Google account ID and
              email address only to verify your identity, create your ClimateRisk
              account or link it to an existing account with the same email
              address, and sign you in. We use your name only to label your
              account. Before trusting any Google sign-in, our backend verifies the
              token directly with Google.
            </li>
            <li>
              <strong>How we store it.</strong> Your Google account ID, email
              address, and name are stored in your account record in our database,
              which is protected as described in{" "}
              <a href="#security" className={linkClass}>
                Security
              </a>
              .
            </li>
            <li>
              <strong>How we share it.</strong> We do not sell, rent, or share
              Google user data with anyone. It is never sent to OpenAI, never used
              for advertising, and never used to develop, improve, or train
              artificial intelligence or machine learning models. It is processed
              only by the infrastructure providers that host the Service (Vercel,
              Google Cloud, and Supabase), solely to run it.
            </li>
            <li>
              <strong>How long we keep it.</strong> We keep it for as long as your
              account exists. If you ask us to delete your account, your Google
              account ID, email address, and name are permanently deleted along
              with it.
            </li>
            <li>
              <strong>How to revoke access.</strong> You can disconnect ClimateRisk
              from your Google account at any time at{" "}
              <ExternalLink href="https://myaccount.google.com/connections">
                myaccount.google.com/connections
              </ExternalLink>
              . This stops future Google sign-ins; to also remove the data we
              already hold, email us at <EmailLink />.
            </li>
          </ul>
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            ClimateRisk&apos;s use and transfer of information received from Google
            APIs will adhere to the{" "}
            <ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </ExternalLink>
            , including the Limited Use requirements.
          </p>
        </Section>

        <Section id="how-information-is-shared" title="5. How Information Is Shared">
          <p>
            We do not sell your personal information, and we do not share it for
            targeted or cross-context behavioral advertising. We share information
            only in the following situations.
          </p>

          <SubHeading>Service providers</SubHeading>
          <p>
            These companies and public agencies process information on our behalf
            so the Service can work. Each receives only what it needs:
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-900">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Provider</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Why</th>
                  <th scope="col" className="px-4 py-3 font-semibold">What it receives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {serviceProviders.map((provider) => (
                  <tr key={provider.name} className="align-top">
                    <td className="px-4 py-3 font-medium text-zinc-900">{provider.name}</td>
                    <td className="px-4 py-3">{provider.purpose}</td>
                    <td className="px-4 py-3">{provider.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Google Maps and OpenAI handle the data they receive under their own
            terms and privacy policies. Under OpenAI&apos;s API terms, data sent
            through its API is not used to train its models by default, though
            OpenAI may keep it for a limited time to monitor for abuse.
          </p>

          <SubHeading>Legal reasons</SubHeading>
          <p>
            We may disclose information if we believe in good faith that the law,
            a court order, or another valid legal process requires it, or that
            doing so is necessary to protect the rights, property, or safety of
            our users, the public, or the Service.
          </p>

          <SubHeading>If the Service changes hands</SubHeading>
          <p>
            If the Service is transferred to a new owner, the information
            described here may be transferred with it. The new owner would have to
            honor this policy, and we would post a notice on the site before your
            information became subject to a different policy.
          </p>

          <SubHeading>With your permission</SubHeading>
          <p>We will share information in other ways only if you ask us to.</p>
        </Section>

        <Section id="cookies-and-storage" title="6. Cookies and Browser Storage">
          <p>
            We use only what is needed for the Service to work. We do not use
            advertising cookies, analytics cookies, or tracking pixels.
          </p>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Session cookie.</strong> When you sign in, an encrypted
              cookie keeps you signed in. It holds your account ID, email address,
              name, and a sign-in token, and it expires after at most 7 days or
              when you sign out.
            </li>
            <li>
              <strong>Sign-in security cookies.</strong> Short-lived cookies
              protect the sign-in process against cross-site request forgery and
              remember which page to return you to afterward.
            </li>
            <li>
              <strong>Session storage.</strong> Your browser keeps the most recent
              report in its session storage so the full report page can open
              without running the analysis again. This data stays on your device,
              is never sent to us from there, and is erased when you close the tab
              or run a new analysis.
            </li>
          </ul>
          <p>
            Because these cookies are strictly necessary, the Service will not
            work correctly for signed-in features if you block them. Since we do
            no tracking, &quot;Do Not Track&quot; and Global Privacy Control signals do
            not change how the Service behaves; there is nothing additional to
            switch off.
          </p>
        </Section>

        <Section id="data-retention" title="7. Data Retention">
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Account information</strong> is kept until you ask us to
              delete your account.
            </li>
            <li>
              <strong>Saved properties</strong> are kept until you delete them on
              the My Properties page, or until your account is deleted, which
              removes all of them automatically.
            </li>
            <li>
              <strong>Addresses you analyze but do not save</strong> are not
              stored in our database. They may appear in server or error logs,
              which our hosting providers keep for a limited period, typically 30
              days or less.
            </li>
            <li>
              <strong>PDF reports</strong> are generated on demand each time you
              download one and are never stored on our servers. Download links
              expire after 60 minutes.
            </li>
            <li>
              <strong>Climate data cache.</strong> To stay fast and keep working
              when a government data source is down, we store the public climate
              data fetched for an area, keyed to a location rounded to roughly one
              kilometer. This cache contains no address, account, or other
              personal information.
            </li>
            <li>
              <strong>Emails you send us</strong> are kept only as long as needed
              to respond and to keep a record of privacy requests.
            </li>
          </ul>
          <p>
            Deleted information may remain in routine database backups for a
            short period before those backups are overwritten.
          </p>
        </Section>

        <Section id="your-rights" title="8. Your Rights and Choices">
          <p>Wherever you live, you can ask us to:</p>
          <ul className="list-disc space-y-3 pl-6">
            <li>
              <strong>Access</strong> the personal information we hold about you,
              and receive a copy of it in a portable format;
            </li>
            <li>
              <strong>Correct</strong> information that is inaccurate; or
            </li>
            <li>
              <strong>Delete</strong> your account and all information linked to
              it.
            </li>
          </ul>
          <p>
            You can delete saved properties yourself at any time from the My
            Properties page. For anything else, email <EmailLink /> from the email
            address on your account (so we can confirm the request is yours) and
            tell us what you would like done. We will respond within 30 days.
            There is no charge, and we will never treat you differently for
            exercising these rights.
          </p>
          <p>
            Some U.S. states, including California, Virginia, Colorado, and
            Connecticut, give residents specific privacy rights, such as the right
            to know what is collected, to delete or correct it, and to opt out of
            its sale or use for targeted advertising. We honor these rights for
            everyone. We do not sell personal information, do not share it for
            targeted advertising, do not profile users, and do not collect
            sensitive personal information, so there is nothing to opt out of. If
            we deny a request, you may appeal by replying to our response, and we
            will reconsider it within 45 days.
          </p>
          <p>
            You can also choose not to create an account at all; address analysis
            works without one.
          </p>
        </Section>

        <Section id="security" title="9. Security">
          <p>We take reasonable measures to protect your information, including:</p>
          <ul className="list-disc space-y-3 pl-6">
            <li>encrypting all traffic between your browser and the Service with HTTPS;</li>
            <li>storing passwords only as bcrypt hashes, never in readable form;</li>
            <li>verifying every Google sign-in directly with Google;</li>
            <li>using signed sign-in tokens that expire after 7 days and PDF download links that expire after 60 minutes;</li>
            <li>keeping API keys and database credentials in a managed secrets store rather than in code; and</li>
            <li>limiting access to production systems and data to the operator.</li>
          </ul>
          <p>
            No method of transmission or storage is completely secure, so we
            cannot guarantee absolute security. If a security incident affects
            your personal information, we will notify you as required by law.
          </p>
        </Section>

        <Section id="where-data-is-stored" title="10. Where Data Is Stored">
          <p>
            The Service is designed for U.S. properties, and your information is
            stored and processed in the United States by the providers listed
            above. If you use the Service from outside the United States, your
            information will be transferred to and processed in the United
            States, where privacy laws may differ from those in your country.
          </p>
        </Section>

        <Section id="children" title="11. Children's Privacy">
          <p>
            The Service is not directed to children, and you must be at least 13
            years old to use it. We do not knowingly collect personal information
            from children under 13. If you believe a child under 13 has given us
            personal information, email <EmailLink /> and we will delete it.
          </p>
        </Section>

        <Section id="changes" title="12. Changes to This Policy">
          <p>
            We may update this policy as the Service changes. When we do, we will
            update the date at the top of this page. If a change materially
            affects how we use information we already hold, we will post a
            notice on the site before it takes effect. We will never use Google
            user data in a new way without first updating this policy and, where
            required, asking for your consent.
          </p>
        </Section>

        <Section id="contact" title="13. Contact">
          <p>
            For questions about this policy or to make a privacy request, contact:
          </p>
          <p>
            Dagim Mekonnen, ClimateRisk
            <br />
            Email: <EmailLink />
          </p>
          <p>
            You can also visit the{" "}
            <Link href="/contact" className={linkClass}>
              Contact page
            </Link>
            . Please don&apos;t post personal information in public GitHub issues.
          </p>
        </Section>
      </div>
    </div>
  );
}
