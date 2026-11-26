import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";

// Fonts are downloaded at build time and served from our own site
// (no requests to Google from the visitor's phone).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hybrid Athlete",
  description: "Personal hybrid training system",
  // Private app: ask search engines not to index it.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#101214",
  viewportFit: "cover",
};

// Phase 1.2 replaces the fixed lang/dir with the active locale (ar / en).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${barlow.variable} ${plexArabic.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
