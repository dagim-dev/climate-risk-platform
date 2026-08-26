export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-brand-primary">Contact</h1>
      <p className="mt-6 leading-7 text-zinc-700">
        Questions, privacy requests, and bug reports are welcome on GitHub:
      </p>
      <p className="mt-4">
        <a
          href="https://github.com/dagim-dev/climate-risk-platform/issues"
          className="font-medium text-brand-primary underline decoration-brand-accent underline-offset-4 hover:text-brand-accent"
        >
          github.com/dagim-dev/climate-risk-platform/issues
        </a>
      </p>
    </div>
  );
}
