import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

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
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email && API_BASE) {
        const response = await fetch(`${API_BASE}/api/v1/auth/oauth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name ?? (profile as { name?: string } | undefined)?.name,
            google_id: account.providerAccountId,
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
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
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
