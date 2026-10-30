import { PageHero } from "@/components/ui/PageHero";
import { cardClass, linkClass } from "@/lib/ui";

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHero eyebrow="Get in touch" title="Contact" />
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className={`${cardClass} p-6 sm:p-8`}>
          <p className="leading-7 text-ink">
            Questions, privacy requests, and account deletion requests can be sent by
            email:
          </p>
          <p className="mt-4">
            <a href="mailto:dagimmekonnen3@gmail.com" className={linkClass}>
              dagimmekonnen3@gmail.com
            </a>
          </p>
          <p className="mt-8 border-t border-line pt-8 leading-7 text-ink">
            Bug reports are welcome on GitHub. Please don&apos;t include personal
            information in public issues.
          </p>
          <p className="mt-4">
            <a
              href="https://github.com/dagim-dev/climate-risk-platform/issues"
              className={`${linkClass} break-all`}
            >
              github.com/dagim-dev/climate-risk-platform/issues
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
