const linkClass =
  "font-medium text-brand-primary underline decoration-brand-accent underline-offset-4 hover:text-brand-accent";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-primary">Contact</h1>
      <p className="mt-6 leading-7 text-zinc-700">
        Questions, privacy requests, and account deletion requests can be sent by
        email:
      </p>
      <p className="mt-4">
        <a href="mailto:dagimmekonnen3@gmail.com" className={linkClass}>
          dagimmekonnen3@gmail.com
        </a>
      </p>
      <p className="mt-8 leading-7 text-zinc-700">
        Bug reports are welcome on GitHub. Please don&apos;t include personal
        information in public issues.
      </p>
      <p className="mt-4">
        <a href="https://github.com/dagim-dev/climate-risk-platform/issues" className={linkClass}>
          github.com/dagim-dev/climate-risk-platform/issues
        </a>
      </p>
    </div>
  );
}
