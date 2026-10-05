import "./globals.css";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

import { CommandMenu } from "@/components/CommandMenu";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Spotlight, Toaster } from "@/components/Interactive";
import { MotionRoot } from "@/components/Reveal";
import { themeScript } from "@/components/ThemeToggle";
import { site } from "@/content/site";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · Software Engineer, AI & Automation`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  keywords: [
    "Naman Chordia",
    "Forward Deployed Engineer",
    "Applied AI Engineer",
    "Software Engineer",
    "LLM evaluation",
    "AI voice agent",
    "automation",
    "Playwright",
    "Next.js",
    "Spring Boot",
    "Pune",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    firstName: "Naman",
    lastName: "Chordia",
    url: "/",
    siteName: site.name,
    title: `${site.name} · Software Engineer, AI & Automation`,
    description: site.description,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: `${site.name} · Software Engineer, AI & Automation`, description: site.description },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: "AI & Automation Developer",
  email: `mailto:${site.email}`,
  telephone: site.phone.replace(/\s/g, ""),
  image: `${site.url}${site.photo}`,
  address: { "@type": "PostalAddress", addressLocality: "Pune", addressCountry: "IN" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Vishwakarma Institute of Information Technology" },
  worksFor: { "@type": "Organization", name: "IDeaS Revenue Solutions", url: "https://ideas.com" },
  knowsAbout: ["Software engineering", "Applied AI", "LLM evaluation", "Automation", "Enterprise integration"],
  sameAs: [site.github, site.linkedin],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
        >
          Skip to content
        </a>
        <MotionRoot>
          <Spotlight />
          <Header />
          <main id="main" className="relative">
            {children}
          </main>
          <Footer />
          <CommandMenu />
          <Toaster />
        </MotionRoot>
      </body>
    </html>
  );
}
