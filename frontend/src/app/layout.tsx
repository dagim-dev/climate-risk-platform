import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClimateRisk — Climate Risk Intelligence",
  description:
    "Address-level climate risk intelligence for property investors, developers, and lenders.",
};

export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
