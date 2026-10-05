import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { Claim } from "@/components/Claim";
import { ArrowDown, ArrowRight, ArrowUpRight, Download, FileText, GitHub, Layers, LinkedIn, Mail, Phone, Sparkle, Workflow } from "@/components/Icons";
import { ReadMore, ScrambleText, VelocityMarquee } from "@/components/Effects";
import { CopyButton, Magnetic } from "@/components/Interactive";
import { PhotoCard } from "@/components/PhotoCard";
import { Reveal } from "@/components/Reveal";
import { ButtonLink, buttonClass, Container, Section, Tag } from "@/components/Section";
import { Timeline } from "@/components/Timeline";
import { AutomationVisual, ClueCodeVisual, ProoflineVisual, VoiceVisual } from "@/components/WorkVisuals";
import { areas, claims, type Claim as ClaimData, education, experience, principles, resume, site, stack, work, type WorkItem } from "@/content/site";

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

export default function Home() {
  return (
    <>
      <Hero />
      <Marquee />
      <Work />
      <Numbers />
      <Experience />
      <Areas />
      <Contact />
    </>
  );
}

/* ---------- hero ---------- */

function Hero() {
  const words = ["I", "build", "AI", "that", "works"];
  return (
    <section aria-labelledby="hero-title" className="grain relative overflow-hidden">
      <div aria-hidden="true" className="bg-grid mask-radial absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(55% 45% at 78% 18%, color-mix(in oklab, var(--accent) 13%, transparent), transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="drift absolute left-[-10%] top-[30%] size-[520px] rounded-full opacity-50 blur-[90px]"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 22%, transparent), transparent)" }}
      />
      <Container className="relative grid min-h-[100svh] items-center gap-12 pb-24 pt-28 sm:gap-16 sm:pt-32 lg:grid-cols-[1.3fr_1fr] lg:gap-8 lg:pb-20 lg:pt-28">
        <div>
          <p className="rise flex flex-wrap items-center gap-x-4 gap-y-2" style={d(0)}>
            <span className="flex items-center gap-2 rounded-full border border-line-strong bg-elev/60 px-3 py-1 text-xs text-muted backdrop-blur">
              <span className="pulse-dot size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Available for new roles
            </span>
            <ScrambleText text={site.shortRole.toUpperCase()} className="font-mono text-xs tracking-[0.16em] text-subtle" />
          </p>
          <h1 id="hero-title" className="mt-8 font-display text-[3.35rem] leading-[0.95] text-fg sm:text-[5rem] lg:text-[5.75rem] 2xl:text-[7.25rem]">
            {words.map((w, i) => (
              <span key={w} className="rise mr-[0.2em] inline-block" style={d(0.06 + i * 0.06)}>
                <span className="hero-word">{w}</span>
              </span>
            ))}
            <em className="rise inline-block" style={d(0.42)}>
              outside the demo.
            </em>
          </h1>
          <div className="rise mt-8" style={d(0.55)}>
          <ReadMore as="p" className="max-w-[580px] text-[17px] leading-relaxed text-muted sm:text-lg 2xl:max-w-[680px] 2xl:text-xl">
            I&apos;m Naman, an AI &amp; Automation Developer at IDeaS (a SAS company). I co-built a real-time{" "}
            <Link href="/work/voice-sales-agent" className="link">
              AI voice sales agent
            </Link>
            , built{" "}
            <Link href="/work/proofline" className="link">
              Proofline
            </Link>{" "}
            to check every number an LLM writes, and shipped{" "}
            <Link href="/work/cluecode" className="link">
              ClueCode
            </Link>
            , a subscription desktop AI app, solo.
          </ReadMore>
          </div>
          <p className="rise mt-5 flex flex-wrap items-center gap-x-2 text-[15px] text-muted" style={d(0.62)}>
            <span>Open to</span>
            <span className="sr-only">Forward Deployed Engineer, Applied AI Engineer and Software Engineer roles.</span>
            <span aria-hidden="true" className="relative inline-flex h-[1.5em] overflow-hidden">
              <span className="ticker flex flex-col">
                {["Forward Deployed Engineer", "Applied AI Engineer", "Software Engineer", "Forward Deployed Engineer"].map((r, i) => (
                  <span key={i} className="h-[1.5em] whitespace-nowrap leading-[1.5em]">
                    <span className="font-medium text-fg">{r}</span> roles
                  </span>
                ))}
              </span>
            </span>
          </p>
          <div className="rise mt-10 flex flex-wrap items-center gap-3" style={d(0.7)}>
            <Magnetic>
              <ButtonLink href="/#work">
                See my work <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
              </ButtonLink>
            </Magnetic>
            <Magnetic>
              <ButtonLink href="/resume" variant="secondary">
                <FileText className="size-4" /> Resume
              </ButtonLink>
            </Magnetic>
            <div className="flex h-11 items-center rounded-full border border-line pl-4 pr-1 text-sm text-muted">
              <a href={`mailto:${site.email}`} className="hover:text-fg">
                {site.email}
              </a>
              <CopyButton
                text={site.email}
                label="Copy email address"
                done="Email copied"
                className="ml-2 grid size-9 place-items-center rounded-full text-subtle transition-colors hover:bg-sunk hover:text-fg"
              />
            </div>
          </div>
          <ul className="rise mt-8 flex items-center gap-5 text-sm text-muted" style={d(0.78)}>
            <li>
              <a href={site.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-fg">
                <GitHub className="size-4" /> GitHub
              </a>
            </li>
            <li>
              <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-colors hover:text-fg">
                <LinkedIn className="size-4" /> LinkedIn
              </a>
            </li>
            <li>
              <a href={site.phoneHref} className="flex items-center gap-2 transition-colors hover:text-fg">
                <Phone className="size-4" /> {site.phone}
              </a>
            </li>
          </ul>
        </div>
        <div className="fade-in order-first max-w-[205px] sm:max-w-none lg:order-none" style={d(0.3)}>
          <PhotoCard />
        </div>
      </Container>
      <div aria-hidden="true" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-subtle">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden bg-line">
          <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-accent" />
        </span>
      </div>
    </section>
  );
}

/* ---------- marquee ---------- */

function Marquee() {
  return (
    <div className="marquee relative border-y border-line bg-sunk/50 py-5">
      <p className="sr-only">Tools I work with: {stack.join(", ")}.</p>
      <div aria-hidden="true" className="mask-x overflow-hidden">
        <VelocityMarquee items={stack} />
      </div>
    </div>
  );
}

/* ---------- work ---------- */

const factLabels = new Map<string, string>([
  [claims.vaLatency.value, "median voice reply"],
  [claims.vaTests.value, "automated tests"],
  [claims.recall.value, "errors caught, unseen phrasing"],
  [claims.naive.value, "for a naive lookup"],
  [claims.plTests.value, "95% coverage"],
  [claims.ccTests.value, "automated tests"],
  [claims.mailbox.value, "manual tracking removed"],
]);

const visuals: Record<WorkItem["slug"], ReactNode> = {
  "voice-sales-agent": <VoiceVisual />,
  proofline: <ProoflineVisual />,
  cluecode: <ClueCodeVisual />,
  "enterprise-automation": <AutomationVisual />,
};

function Work() {
  const [lead, ...rest] = work;
  return (
    <Section
      id="work"
      index="01"
      label="Selected work"
      title={
        <>
          Things I&apos;ve <em>built.</em>
        </>
      }
      intro="Each one opens a case study: the problem, what I built, the decisions that mattered, and how I know it works."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {lead && (
          <Reveal className="lg:col-span-3">
            <WorkCard item={lead} featured />
          </Reveal>
        )}
        {rest.map((item, i) => (
          <Reveal key={item.slug} delay={0.08 * i} className="h-full">
            <WorkCard item={item} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function WorkCard({ item, featured = false }: { item: WorkItem; featured?: boolean }) {
  const [kind, area] = item.kicker.split(" · ");
  const facts = item.facts.filter((f): f is ClaimData => typeof f !== "string").slice(0, 2);
  const notes = item.facts.filter((f): f is string => typeof f === "string").slice(0, featured ? 1 : 0);
  return (
    <article
      data-tilt=""
      className={`spot group relative flex h-full flex-col rounded-[28px] border border-line bg-elev/60 p-2.5 transition-[border-color,transform] duration-500 hover:border-line-strong has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent ${
        featured ? "lg:grid lg:grid-cols-[1fr_1.05fr] lg:gap-2.5" : ""
      }`}
    >
      {!featured && <div className="h-[244px]">{visuals[item.slug]}</div>}
      <div className={`flex flex-1 flex-col ${featured ? "p-5 sm:p-8" : "p-5 sm:p-6"}`}>
        <p className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">
          <span>
            {kind} <span className="text-accent">·</span> {area}
          </span>
          <span>{item.year}</span>
        </p>
        <h3 className={`mt-4 font-display leading-[1.02] text-fg ${featured ? "text-4xl sm:text-[3.4rem]" : "text-[2.1rem]"}`}>
          <Link href={`/work/${item.slug}`} className="after:absolute after:inset-0 after:rounded-[28px] after:content-[''] focus-visible:outline-none">
            {item.title}
          </Link>
        </h3>
        <ReadMore as="p" className={`mt-4 leading-relaxed text-muted ${featured ? "max-w-xl text-[16.5px]" : "text-[15px]"}`}>
          {item.summary}
        </ReadMore>
        <ul className="relative z-10 mt-6 flex flex-wrap gap-2">
          {facts.map((f) => (
            <li key={f.value} className="flex items-center gap-2 rounded-full border border-line bg-bg/50 px-3 py-1.5 text-[13px] text-muted">
              <Claim claim={f} /> {factLabels.get(f.value)}
            </li>
          ))}
          {notes.map((n) => (
            <li key={n} className="flex items-center rounded-full border border-line bg-bg/50 px-3 py-1.5 text-[13px] text-muted">
              {n}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {item.stack.slice(0, featured ? 6 : 4).map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between gap-4 pt-8">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-fg">
            Read the case study <ArrowRight className="size-4 text-accent transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          {item.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {l.label} <ArrowUpRight className="size-3" />
            </a>
          ))}
        </div>
      </div>
      {featured && <div className="min-h-[340px]">{visuals[item.slug]}</div>}
    </article>
  );
}

/* ---------- numbers ---------- */

function Numbers() {
  const items = [
    { claim: claims.vaLatency, label: "median from a caller finishing a sentence to the voice agent's first audio" },
    { claim: claims.recall, label: "of injected numeric errors Proofline caught on phrasing it had never seen" },
    { claim: claims.ccTests, label: "automated tests behind ClueCode, a desktop AI app I shipped solo" },
    { claim: claims.mailbox, label: "of manual mailbox tracking removed at IDeaS" },
  ];
  return (
    <section aria-label="By the numbers" className="border-y border-line">
      <div className="mx-auto grid max-w-[1560px] grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={0.06 * i} className="bg-bg px-6 py-10 sm:px-8">
            <p className="font-display text-5xl leading-none text-fg sm:text-[3.4rem]">
              <Claim claim={it.claim} className="font-normal" animate />
            </p>
            <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-muted">{it.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- experience ---------- */

function Experience() {
  return (
    <Section
      id="experience"
      index="02"
      label="Experience"
      title={
        <>
          Where I&apos;ve <em>worked.</em>
        </>
      }
      intro="Security, full-stack and BI internships, then full-time on AI and automation at IDeaS, a SAS company."
    >
      <Timeline jobs={experience} />
      <Reveal className="mt-10 grid gap-1 pl-9 md:grid-cols-[200px_1fr] md:pl-0">
        <div className="pt-6 md:pr-10 md:text-right">
          <p className="font-mono text-xs text-subtle">{education.year}</p>
          <p className="mt-1 hidden text-sm text-muted md:block">Education</p>
        </div>
        <div className="rounded-2xl border border-line bg-elev/40 p-5 sm:p-6 md:ml-8">
          <h3 className="text-lg font-semibold tracking-[-0.01em] text-fg">{education.school}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {education.degree} · CGPA <Claim claim={education.cgpa} />
          </p>
          <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-muted">
            {education.extra.map((e) => (
              <li key={e.text} className="flex gap-3">
                <span className="mt-[11px] h-px w-3 shrink-0 bg-accent" aria-hidden="true" />
                <span>
                  {e.text} {e.claim && <Claim claim={e.claim} />} {e.after}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}

/* ---------- what I do ---------- */

const areaIcons = [Sparkle, Workflow, Layers];

function Areas() {
  return (
    <Section
      id="about"
      index="03"
      label="What I do"
      title={
        <>
          Three kinds of problems <em>I like.</em>
        </>
      }
      intro="The common thread: a workflow people depend on, a system that has to be right, and evidence that it is."
      className="bg-sunk/30"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {areas.map((a, i) => {
          const Icon = areaIcons[i]!;
          return (
            <Reveal key={a.title} delay={0.07 * i} className="h-full">
              <div data-tilt="" className="spot group flex h-full flex-col rounded-3xl border border-line bg-elev/60 p-6 sm:p-7">
                <span className="grid size-11 place-items-center rounded-2xl border border-accent/30 bg-accent-soft text-accent transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.015em] text-fg">{a.title}</h3>
                <div className="mt-3 flex-1">
                  <ReadMore as="p" className="text-[15px] leading-relaxed text-muted">
                    {a.body}
                  </ReadMore>
                </div>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {a.tools.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <ol className="mt-16 grid gap-10 border-t border-line pt-12 md:grid-cols-3">
        {principles.map((p, i) => (
          <Reveal as="li" key={p.title} delay={0.07 * i}>
            <span className="font-display text-5xl italic leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-4 text-lg font-semibold text-fg">{p.title}</h3>
            <ReadMore as="p" className="mt-2 text-[15px] leading-relaxed text-muted">
              {p.body}
            </ReadMore>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

/* ---------- contact ---------- */

function Contact() {
  const tiles = [
    { href: site.linkedin, label: "LinkedIn", note: "linkedin.com/in/naman-chordia-291b7a22a", icon: LinkedIn, external: true },
    { href: site.github, label: "GitHub", note: "github.com/NamanChordia07", icon: GitHub, external: true },
  ];
  return (
    <Section
      id="contact"
      index="04"
      label="Contact"
      title={
        <>
          Let&apos;s build something <em>that ships.</em>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Reveal className="spot relative overflow-hidden rounded-[28px] border border-line bg-elev/60 p-7 sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: "radial-gradient(60% 80% at 100% 0%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 70%)" }}
          />
          <div className="relative">
            <ReadMore as="p" className="max-w-lg text-[17px] leading-relaxed text-muted">
              I&apos;m open to {site.openTo} Email or call; I reply within a day.
            </ReadMore>
            <a
              href={`mailto:${site.email}`}
              className="mt-8 block font-display text-[1.7rem] leading-tight text-fg transition-colors [overflow-wrap:anywhere] hover:text-accent sm:text-5xl"
            >
              {site.email}
            </a>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <ButtonLink href={`mailto:${site.email}`}>
                  <Mail className="size-4" /> Email me
                </ButtonLink>
              </Magnetic>
              <Magnetic>
                <ButtonLink href={site.phoneHref} variant="secondary">
                  <Phone className="size-4" /> {site.phone}
                </ButtonLink>
              </Magnetic>
              <CopyButton
                text={site.email}
                label="Copy email address"
                done="Email copied"
                className={buttonClass("ghost", "icon")}
              />
            </div>
          </div>
        </Reveal>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
          {tiles.map(({ href, label, note, icon: Icon }, i) => (
            <Reveal key={label} delay={0.06 * (i + 1)}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-tilt=""
                className="spot group flex h-full items-center gap-4 rounded-[28px] border border-line bg-elev/60 p-6 transition-colors hover:border-line-strong"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-bg text-fg">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-fg">{label}</span>
                  <span className="block truncate font-mono text-xs text-subtle">{note}</span>
                </span>
                <ArrowUpRight className="size-5 text-subtle transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
              </a>
            </Reveal>
          ))}
          <Reveal delay={0.18}>
            <div className="spot flex items-center gap-5 rounded-[28px] border border-line bg-elev/60 p-4 pr-6">
              <Link href="/resume" className="block w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-white" aria-label="Preview the resume">
                <Image src={resume.preview} alt="" width={160} height={226} unoptimized className="h-auto w-full" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-fg">Resume</p>
                <p className="mt-0.5 text-sm text-muted">One page, PDF.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={resume.file} download className={buttonClass("primary", "sm")}>
                    <Download className="size-3.5" /> Download
                  </a>
                  <Link href="/resume" className={buttonClass("ghost", "sm")}>
                    Preview
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
