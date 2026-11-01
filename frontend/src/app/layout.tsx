import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClimateRisk — Climate Risk Intelligence",
  description:
    "Address-level climate risk intelligence for property investors, developers, and lenders.",
  verification: {
    google: "f9De_ljvPMsHL2-kpvNMZpwK73p911zSBh_KSxxELLY",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#050b18",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${instrumentSerif.variable}`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only z-50 rounded-full bg-white px-4 py-2 text-sm font-semibold text-space-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
