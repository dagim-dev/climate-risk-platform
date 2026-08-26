"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!API_BASE) {
      setError("API is not configured.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        setError(body?.detail ?? "Registration failed.");
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (signInResult?.error) {
        setError("Account created but sign-in failed. Try signing in manually.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-primary">Create Account</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sign up for unlimited analyses, full reports, and saved properties.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/40"
          />
          <p className="mt-1 text-xs text-zinc-500">At least 8 characters</p>
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
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-brand-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
