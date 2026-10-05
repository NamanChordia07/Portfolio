import type { Metadata } from "next";
import Image from "next/image";

import { Container } from "@/components/Section";
import { resume, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Resume",
  description: "One-page resume: AI & automation at IDeaS (a SAS company), an AI voice sales agent, Proofline and ClueCode.",
  alternates: { canonical: "/resume" },
  openGraph: { url: "/resume" },
};

export default function ResumePage() {
  return (
    <Container className="py-14 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <a
          href={resume.file}
          className="group block overflow-hidden rounded-xl border border-line bg-white shadow-[var(--shadow)]"
          aria-label="Open the resume (PDF)"
        >
          <Image
            src={resume.preview}
            alt="First page of the resume"
            width={794}
            height={1123}
            priority
            className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.01]"
            sizes="(min-width: 1024px) 760px, 100vw"
          />
        </a>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">Resume</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-fg">One page, every claim sourced</h1>
          <p className="mt-5 text-[17px] leading-relaxed text-muted">{resume.focus}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={resume.file}
              download
              className="rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              Download PDF
            </a>
            <a
              href={resume.file}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line-strong px-5 py-2.5 text-sm text-fg transition-colors hover:bg-sunk"
            >
              Open in a tab
            </a>
          </div>
          <p className="mt-8 text-sm leading-relaxed text-subtle">
            The web copy leaves out my phone number. For it, a .docx, or a version tailored to a role, email{" "}
            <a className="link" href={`mailto:${site.email}`}>
              {site.email}
            </a>{" "}
            or reach me on{" "}
            <a className="link" href={site.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            .
          </p>
        </div>
      </div>
    </Container>
  );
}
