"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState, type FormEvent } from "react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

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
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-primary">Sign In</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Access full reports and save properties for later.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-risk-high">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
        >
          Continue with Google
        </button>
      </div>

      <p className="mt-8 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-brand-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
