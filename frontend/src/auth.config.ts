import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Server-side calls (this file runs in the Next.js server) may need a different host than
// the browser, e.g. the compose service name inside Docker.
const API_BASE = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

// Must not outlive the backend JWT (JWT_EXPIRE_MINUTES, 7 days by default).
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Expiry (ms since epoch) of the backend JWT, read from its payload; null if unreadable. */
function backendTokenExpiry(accessToken: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !API_BASE) {
          return null;
        }

        const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as {
          user: { id: number; email: string; name: string | null };
          access_token: string;
        };

        return {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          accessToken: data.access_token,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }
      // Without a backend token the account can't use saved properties or PDFs.
      if (!API_BASE || !account.id_token) {
        return false;
      }

      const response = await fetch(`${API_BASE}/api/v1/auth/oauth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: account.id_token,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as {
        user: { id: number };
        access_token: string;
      };
      user.id = String(data.user.id);
      user.accessToken = data.access_token;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.accessTokenExpires = user.accessToken
          ? backendTokenExpiry(user.accessToken)
          : null;
      }
      // End the session once the backend token has expired instead of leaving the
      // user "signed in" with every API call failing.
      if (typeof token.accessTokenExpires === "number" && Date.now() >= token.accessTokenExpires) {
        return null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = String(token.id);
      }
      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
};
