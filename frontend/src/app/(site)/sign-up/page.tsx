"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { buttonClass, inputClass, linkClass } from "@/lib/ui";

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
        const body = (await response.json().catch(() => null)) as { detail?: unknown } | null;
        // FastAPI validation errors (422) return a list, not a string.
        setError(
          typeof body?.detail === "string"
            ? body.detail
            : response.status === 422
              ? "Please enter a valid email and a password of at least 8 characters."
              : "Registration failed.",
        );
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
    <AuthShell
      title="Create Account"
      subtitle="Analysis is free for everyone. Create an account to save properties and download PDF reports."
    >

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink">
            Name (optional)
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-ink">
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
            className={`mt-1.5 ${inputClass}`}
          />
          <p className="mt-1.5 text-xs text-ink-muted">At least 8 characters</p>
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
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className={linkClass}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
