import type { Metadata } from "next";
import Image from "next/image";

import { Container } from "@/components/Section";
import { resumes, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Resumes",
  description: "One-page resumes for Forward Deployed Engineer, AI Engineer and Software Engineer roles.",
  alternates: { canonical: "/resume" },
  openGraph: { url: "/resume" },
};

export default function ResumePage() {
  return (
    <Container className="py-14 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">Resumes</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-fg sm:text-5xl">Three versions, one set of facts</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
        Each is one page and tailored to a role: the same work, ordered and described for what that role screens for. Pick the one that
        matches the job. Web copies omit my phone number; email me for it, or for a .docx.
      </p>
      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {resumes.map((r) => (
          <li key={r.id} className="flex flex-col rounded-2xl border border-line bg-elev p-5">
            <a href={r.file} className="group block overflow-hidden rounded-lg border border-line bg-white" aria-label={`Open the ${r.title} resume (PDF)`}>
              <Image
                src={r.preview}
                alt={`First page of the ${r.title} resume`}
                width={794}
                height={1123}
                className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.015]"
                sizes="(min-width: 768px) 33vw, 100vw"
              />
            </a>
            <h2 className="mt-5 font-medium text-fg">{r.title}</h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{r.focus}</p>
            <div className="mt-5 flex gap-3">
              <a href={r.file} download className="rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">
                Download PDF
              </a>
              <a href={r.file} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line-strong px-4 py-2 text-sm text-fg hover:bg-sunk">
                Open
              </a>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-subtle">
        Questions about any line? <a className="link" href={`mailto:${site.email}`}>{site.email}</a>
      </p>
    </Container>
  );
}
