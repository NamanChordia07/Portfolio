import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";

import { ArrowUpRight, Download, GitHub, LinkedIn, Mail, Phone } from "@/components/Icons";
import { CopyButton, Magnetic } from "@/components/Interactive";
import { buttonClass, Container } from "@/components/Section";
import { resume, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Resume",
  description: "One-page resume: AI & automation at IDeaS (a SAS company), an AI voice sales agent, Proofline and ClueCode.",
  alternates: { canonical: "/resume" },
  openGraph: { url: "/resume" },
};

export default function ResumePage() {
  const contacts = [
    { href: `mailto:${site.email}`, label: site.email, icon: Mail, external: false },
    { href: site.phoneHref, label: site.phone, icon: Phone, external: false },
    { href: site.linkedin, label: "LinkedIn", icon: LinkedIn, external: true },
    { href: site.github, label: "GitHub", icon: GitHub, external: true },
  ];
  return (
    <div className="grain relative overflow-hidden">
      <div aria-hidden="true" className="bg-grid mask-radial absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(45% 50% at 20% 10%, color-mix(in oklab, var(--accent) 11%, transparent), transparent 70%)" }}
      />
      <Container className="relative pb-24 pt-32 sm:pt-40">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <a
            href={resume.file}
            className="rise group relative block [perspective:1400px]"
            aria-label="Open the resume (PDF)"
            style={{ "--d": "0.1s" } as CSSProperties}
          >
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-[28px] opacity-60 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
              style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 22%, transparent), transparent)" }}
            />
            <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-white shadow-[0_40px_100px_-40px_rgb(0_0_0/0.6)] transition-transform duration-700 ease-[var(--ease)] group-hover:[transform:rotateX(2deg)_translateY(-4px)]">
              <Image
                src={resume.preview}
                alt="First page of the resume"
                width={794}
                height={1123}
                priority
                unoptimized
                className="h-auto w-full"
              />
            </div>
          </a>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="rise flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-subtle">
              <span aria-hidden="true" className="h-px w-6 bg-accent" />
              Resume
            </p>
            <h1 className="rise mt-5 font-display text-6xl leading-[0.95] text-fg sm:text-7xl" style={{ "--d": "0.06s" } as CSSProperties}>
              One page. <em>Every claim sourced.</em>
            </h1>
            <p className="rise mt-6 text-[17px] leading-relaxed text-muted" style={{ "--d": "0.12s" } as CSSProperties}>
              {resume.focus}
            </p>
            <div className="rise mt-8 flex flex-wrap gap-3" style={{ "--d": "0.18s" } as CSSProperties}>
              <Magnetic>
                <a href={resume.file} download className={buttonClass("primary")}>
                  <Download className="size-4" /> Download PDF
                </a>
              </Magnetic>
              <Magnetic>
                <a href={resume.file} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary")}>
                  Open in a tab <ArrowUpRight className="size-4" />
                </a>
              </Magnetic>
            </div>
            <ul className="rise mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-elev/50" style={{ "--d": "0.24s" } as CSSProperties}>
              {contacts.map(({ href, label, icon: Icon, external }) => (
                <li key={label} className="flex items-center">
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-sm text-fg transition-colors hover:bg-sunk"
                  >
                    <Icon className="size-4 shrink-0 text-subtle transition-colors group-hover:text-accent" />
                    <span className="truncate">{label}</span>
                  </a>
                  {!external && (
                    <CopyButton
                      text={label}
                      label={`Copy ${label}`}
                      done="Copied"
                      className="mr-2 grid size-9 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-sunk hover:text-fg"
                    />
                  )}
                </li>
              ))}
            </ul>
            <p className="rise mt-6 text-sm leading-relaxed text-subtle" style={{ "--d": "0.3s" } as CSSProperties}>
              Need a .docx or a version tailored to a role? Email me and I&apos;ll send it the same day.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
