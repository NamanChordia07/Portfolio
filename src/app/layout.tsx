import "./globals.css";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MotionRoot } from "@/components/Reveal";
import { themeScript } from "@/components/ThemeToggle";
import { site } from "@/content/site";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0e" },
  ],
  width: "device-width",
  initialScale: 1,
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: "Software Engineer",
  email: `mailto:${site.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Pune", addressCountry: "IN" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Vishwakarma Institute of Information Technology" },
  worksFor: { "@type": "Organization", name: "IDeaS Revenue Solutions", url: "https://ideas.com" },
  knowsAbout: ["Software engineering", "Applied AI", "LLM evaluation", "Automation", "Enterprise integration"],
  sameAs: [site.github, site.linkedin],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <MotionRoot>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </MotionRoot>
      </body>
    </html>
  );
}
