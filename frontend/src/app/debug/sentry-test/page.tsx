"use client";

export default function SentryTestPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p>Not available in production.</p>
      </main>
    );
  }

  throw new Error("Sentry test error — intentional for error monitoring verification");
}
