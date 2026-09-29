import Link from "next/link";

import { Claim } from "@/components/Claim";
import { HeroReceipt } from "@/components/HeroReceipt";
import { Reveal } from "@/components/Reveal";
import { ArrowLink, Container, Section, Tag } from "@/components/Section";
import { areas, claims, education, experience, principles, resumes, site, work, type WorkItem } from "@/content/site";

export default function Home() {
  return (
    <>
      <Hero />
      <Work />
      <Experience />
      <Areas />
      <Contact />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-title">
      <div aria-hidden="true" className="grid-paper pointer-events-none absolute inset-0 -z-10" />
      <Container className="grid gap-12 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.08fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">
            {site.name} · {site.shortRole}
          </p>
          <h1 id="hero-title" className="mt-5 text-[2.15rem] font-semibold leading-[1.08] tracking-[-0.035em] text-fg sm:text-5xl lg:text-[3.35rem]">
            I build automation and AI systems for messy, real-world workflows, and the checks that make them safe to ship.
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted sm:text-lg">
            At IDeaS (a SAS company) I automate revenue-management operations with Python, Playwright and LLMs. On my own, I shipped{" "}
            <Link href="/work/cluecode" className="link">
              ClueCode
            </Link>
            , a subscription desktop AI app, and built{" "}
            <Link href="/work/proofline" className="link">
              Proofline
            </Link>
            , which checks every number an LLM writes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/#work"
              className="rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              See the work
            </Link>
            <Link
              href="/resume"
              className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-sunk"
            >
              Resumes
            </Link>
            <a href={`mailto:${site.email}`} className="px-2 py-2.5 text-sm text-muted transition-colors hover:text-fg">
              {site.email}
            </a>
          </div>
          <p className="mt-8 flex items-start gap-2 text-sm text-subtle">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            <span>Open to {site.openTo}</span>
          </p>
        </div>
        <Reveal delay={0.1}>
          <HeroReceipt />
        </Reveal>
      </Container>
    </section>
  );
}

function Work() {
  const [lead, ...rest] = work;
  return (
    <Section
      id="work"
      label="01 · Selected work"
      title="Things I've built"
      intro="Each one links to a case study: the problem, what I built, the decisions that mattered, and how I know it works."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {lead && (
          <Reveal className="md:col-span-2">
            <WorkCard item={lead} featured />
          </Reveal>
        )}
        {rest.map((item, i) => (
          <Reveal key={item.slug} delay={i * 0.06}>
            <WorkCard item={item} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function WorkCard({ item, featured = false }: { item: WorkItem; featured?: boolean }) {
  return (
    <article
      className={`group relative flex h-full flex-col rounded-2xl border border-line bg-elev p-6 transition-colors hover:border-line-strong sm:p-7 ${
        featured ? "lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-10" : ""
      }`}
    >
      <div className="flex flex-col">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-subtle">{item.kicker}</p>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-fg sm:text-2xl">
          <Link href={`/work/${item.slug}`} className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none">
            {item.title}
          </Link>
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.summary}</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {item.stack.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      </div>
      <div className={`mt-6 flex flex-col justify-between gap-6 ${featured ? "lg:mt-0" : ""}`}>
        <ul className="relative z-10 space-y-2.5 border-t border-line pt-5 text-sm text-muted lg:border-t-0 lg:pt-0">
          {item.facts.map((f, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {typeof f === "string" ? (
                <span>{f}</span>
              ) : (
                <span>
                  <Claim claim={f} /> {factLabel(item.slug, f.value)}
                </span>
              )}
            </li>
          ))}
        </ul>
        <span className="text-sm font-medium text-fg">
          Read the case study{" "}
          <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </article>
  );
}

function factLabel(slug: WorkItem["slug"], value: string) {
  if (slug === "proofline" && value === claims.recall.value) return "of injected numeric errors caught on held-out phrasing";
  if (slug === "proofline" && value === claims.naive.value) return "for a naive “is this number in the data?” check";
  if (slug === "proofline" && value === claims.plTests.value) return "93% coverage, mypy --strict";
  if (slug === "cluecode") return "automated tests across web, desktop and E2E";
  if (slug === "enterprise-automation") return "of manual mailbox tracking removed";
  return "";
}

function Experience() {
  return (
    <Section id="experience" label="02 · Experience" title="Where I've worked">
      <div className="divide-y divide-line border-y border-line">
        {experience.map((job) => (
          <Reveal key={job.company}>
            <div className="grid gap-6 py-8 md:grid-cols-[220px_1fr] md:gap-10">
              <div>
                <h3 className="font-medium text-fg">{job.company}</h3>
                <p className="mt-1 text-sm text-subtle">{job.location}</p>
              </div>
              <div className="space-y-8">
                {job.roles.map((role) => (
                  <div key={role.title}>
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                      <h4 className="font-medium text-fg">{role.title}</h4>
                      <p className="font-mono text-xs text-subtle">{role.dates}</p>
                    </div>
                    <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-muted">
                      {role.points.map((p) => (
                        <li key={p} className="flex gap-3">
                          <span className="mt-[11px] size-1 shrink-0 rounded-full bg-subtle" aria-hidden="true" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
        <Reveal>
          <div className="grid gap-6 py-8 md:grid-cols-[220px_1fr] md:gap-10">
            <div>
              <h3 className="font-medium text-fg">Education</h3>
            </div>
            <div className="text-[15px] leading-relaxed text-muted">
              <p>
                <span className="font-medium text-fg">{education.school}</span>
                <br />
                {education.degree}, {education.year} · CGPA <Claim claim={education.cgpa} />
              </p>
              <ul className="mt-3 space-y-2">
                {education.extra.map((e) => (
                  <li key={e.text} className="flex gap-3">
                    <span className="mt-[11px] size-1 shrink-0 rounded-full bg-subtle" aria-hidden="true" />
                    <span>
                      {e.text} {e.claim && <Claim claim={e.claim} />} {e.after}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Areas() {
  return (
    <Section
      id="areas"
      label="03 · What I work on"
      title="Three kinds of problems I like"
      intro="The common thread: a workflow people depend on, a system that has to be right, and evidence that it is."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {areas.map((a, i) => (
          <Reveal key={a.title} delay={i * 0.05}>
            <div className="flex h-full flex-col rounded-2xl border border-line p-6">
              <h3 className="font-medium text-fg">{a.title}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{a.body}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {a.tools.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-14 grid gap-8 border-t border-line pt-10 md:grid-cols-3">
        {principles.map((p, i) => (
          <div key={p.title}>
            <p className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-2 font-medium text-fg">{p.title}</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <Section id="contact" label="04 · Contact" title="Let's talk">
      <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="max-w-xl text-[17px] leading-relaxed text-muted">
            I&apos;m open to {site.openTo} The fastest way to reach me is email.
          </p>
          <a
            href={`mailto:${site.email}`}
            className="mt-6 inline-block break-all text-2xl font-semibold tracking-[-0.02em] text-fg underline decoration-line-strong decoration-2 underline-offset-8 transition-colors hover:decoration-accent sm:text-3xl"
          >
            {site.email}
          </a>
          <div className="mt-8 flex flex-wrap gap-6">
            <ArrowLink href={site.linkedin} external>
              LinkedIn
            </ArrowLink>
            <ArrowLink href={site.github} external>
              GitHub
            </ArrowLink>
          </div>
        </div>
        <div className="rounded-2xl border border-line p-6">
          <h3 className="font-medium text-fg">Resumes</h3>
          <p className="mt-1 text-sm text-muted">One page each, tailored to the role.</p>
          <ul className="mt-4 divide-y divide-line">
            {resumes.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-[15px] text-fg">{r.title}</span>
                <a href={r.file} className="font-mono text-xs text-muted underline decoration-line-strong underline-offset-4 hover:text-fg" download>
                  PDF ↓
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
