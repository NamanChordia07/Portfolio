import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import type { Claim as ClaimData } from "@/content/site";

import { Claim } from "./Claim";
import { ReadMore, ScrambleText } from "./Effects";
import { ArrowRight } from "./Icons";
import { Reveal } from "./Reveal";
import { Container } from "./Section";

export function CaseHeader({
  kicker,
  title,
  lede,
  meta,
}: {
  kicker: string;
  title: string;
  lede: ReactNode;
  meta: { label: string; value: ReactNode }[];
}) {
  return (
    <header className="grain relative overflow-hidden border-b border-line">
      <div aria-hidden="true" className="bg-grid mask-radial absolute inset-0" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(50% 60% at 85% 0%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)" }}
      />
      <Container className="relative pb-14 pt-32 sm:pb-20 sm:pt-40">
        <nav aria-label="Breadcrumb" className="rise font-mono text-xs text-subtle">
          <Link href="/#work" className="transition-colors hover:text-fg">
            Work
          </Link>
          <span aria-hidden="true" className="mx-2 text-line-strong">
            /
          </span>
          <span aria-current="page" className="text-muted">
            {title}
          </span>
        </nav>
        <p className="rise mt-8 inline-flex items-center gap-2 rounded-full border border-line-strong bg-elev/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted backdrop-blur">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          {kicker}
        </p>
        <h1 className="rise mt-6 font-display text-[3.4rem] leading-[0.95] text-fg sm:text-7xl lg:text-[6.25rem]" style={{ "--d": "0.08s" } as CSSProperties}>
          {title}
        </h1>
        <div className="rise mt-7" style={{ "--d": "0.16s" } as CSSProperties}>
          <ReadMore as="p" className="max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">
            {lede}
          </ReadMore>
        </div>
        <dl
          className="rise mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
          style={{ "--d": "0.24s" } as CSSProperties}
        >
          {meta.map((m) => (
            <div key={m.label} className="bg-bg/90 p-5">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">{m.label}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-fg">{m.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </header>
  );
}

export function CaseSection({ id, label, title, children }: { id?: string; label: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="scroll-mt-24 border-b border-line py-16 sm:py-24">
      <Container>
        <div className="grid gap-5 lg:grid-cols-[220px_1fr] lg:gap-14">
          <div>
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-subtle lg:sticky lg:top-28">
              <span aria-hidden="true" className="h-px w-6 bg-accent" />
              <ScrambleText text={label.toUpperCase()} />
            </p>
          </div>
          <div className="min-w-0">
            <Reveal>
              <h2 id={id ? `${id}-title` : undefined} className="font-display text-4xl leading-[1.05] text-fg sm:text-5xl">
                {title}
              </h2>
            </Reveal>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <ReadMore className="prose-body max-w-[70ch] text-[16.5px] leading-[1.8]" lineHeight="1.8em">
      {children}
    </ReadMore>
  );
}

export function Stats({ items }: { items: { claim?: ClaimData; value?: string; label: string }[] }) {
  return (
    <div className="border-b border-line">
      <div className="mx-auto grid max-w-[1560px] grid-cols-2 gap-px bg-line lg:grid-cols-4">
        {items.map((s, i) => (
          <Reveal key={s.label} delay={0.06 * i} className="bg-bg px-4 py-8 sm:px-8 sm:py-10">
            <div className="font-display text-4xl leading-none text-fg sm:text-5xl">
              {s.claim ? <Claim claim={s.claim} className="font-normal" animate /> : s.value}
            </div>
            <div className="mt-3 max-w-[260px] text-[13px] leading-snug text-muted">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export function Decision({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal className="spot mb-4 rounded-2xl border border-line bg-elev/40 p-6 last:mb-0 sm:p-7" >
      <h3 className="flex items-start gap-3 text-lg font-semibold tracking-[-0.01em] text-fg">
        <span aria-hidden="true" className="mt-[11px] h-px w-4 shrink-0 bg-accent" />
        {title}
      </h3>
      <div className="mt-3 sm:pl-7">
        <ReadMore className="prose-body max-w-[68ch] text-[15.5px] leading-relaxed">{children}</ReadMore>
      </div>
    </Reveal>
  );
}

export function NextCase({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Container className="py-16 sm:py-24">
      <Link
        href={href}
        data-tilt=""
        className="spot group relative flex items-center justify-between gap-6 overflow-hidden rounded-[28px] border border-line bg-elev/50 p-7 transition-colors hover:border-line-strong sm:p-10"
      >
        <span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">Next case study</span>
          <span className="mt-3 block font-display text-4xl leading-none text-fg sm:text-6xl">{title}</span>
          <span className="mt-3 block text-sm text-muted">{note}</span>
        </span>
        <span className="grid size-14 shrink-0 place-items-center rounded-full border border-line-strong text-fg transition-all duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg sm:size-16">
          <ArrowRight className="size-5 transition-transform duration-500 group-hover:translate-x-0.5" />
        </span>
      </Link>
    </Container>
  );
}
