"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState, type FormEvent } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { buttonClass, inputClass, linkClass } from "@/lib/ui";

/** Only same-site relative paths, so a crafted link can't redirect off-site after sign-in. */
function safeCallbackUrl(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    let result: Awaited<ReturnType<typeof signIn>> | undefined;
    try {
      result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again.");
      return;
    } finally {
      setLoading(false);
    }

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError(null);
    await signIn("google", { callbackUrl });
  }

  return (
    <AuthShell
      title="Sign In"
      subtitle="Save properties and download PDF reports."
    >

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-risk-high-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full ${buttonClass("primary", "lg")}`}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6">
        <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
          or
          <span aria-hidden="true" className="h-px flex-1 bg-line" />
        </div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className={`w-full ${buttonClass("secondary", "lg")}`}
        >
          Continue with Google
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className={linkClass}>
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
