import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/debug") && process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (process.env.E2E_AUTH_BYPASS === "true") {
    return NextResponse.next();
  }

  // Saved properties are per-account. Analysis and the printable report are open to everyone.
  if (!req.auth && pathname.startsWith("/properties")) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/properties/:path*", "/debug/:path*"],
};
