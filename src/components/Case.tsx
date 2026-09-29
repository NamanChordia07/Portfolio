import Link from "next/link";
import type { ReactNode } from "react";

import type { Claim as ClaimData } from "@/content/site";

import { Claim } from "./Claim";
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
    <header className="border-b border-line">
      <Container className="pb-14 pt-10 sm:pb-16 sm:pt-14">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-subtle">
          <Link href="/#work" className="hover:text-fg">
            Work
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{title}</span>
        </nav>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">{kicker}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-fg sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">{lede}</p>
        <dl className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-subtle">{m.label}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-fg">{m.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </header>
  );
}

export function CaseSection({ id, label, title, children }: { id?: string; label: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="scroll-mt-20 border-b border-line py-14 sm:py-20">
      <Container>
        <div className="grid gap-4 lg:grid-cols-[200px_1fr] lg:gap-12">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">{label}</p>
          <div className="min-w-0">
            <h2 id={id ? `${id}-title` : undefined} className="text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-[1.75rem]">
              {title}
            </h2>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose-body max-w-[68ch] text-[16.5px] leading-[1.75]">{children}</div>;
}

export function Stats({ items }: { items: { claim?: ClaimData; value?: string; label: string }[] }) {
  return (
    <div className="border-b border-line">
      <Container className="grid grid-cols-2 gap-px overflow-visible py-2 lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="py-6 pr-4">
            <div className="text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-3xl">
              {s.claim ? <Claim claim={s.claim} className="font-semibold" /> : s.value}
            </div>
            <div className="mt-1.5 text-[13px] leading-snug text-muted">{s.label}</div>
          </div>
        ))}
      </Container>
    </div>
  );
}

export function Decision({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <h3 className="font-medium text-fg">{title}</h3>
      <div className="prose-body mt-2 max-w-[68ch] text-[15.5px] leading-relaxed">{children}</div>
    </div>
  );
}

export function NextCase({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <Container className="py-14">
      <Link href={href} className="group block rounded-2xl border border-line p-6 transition-colors hover:border-line-strong sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-subtle">Next case study</p>
        <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-fg sm:text-2xl">
          {title}{" "}
          <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
            →
          </span>
        </p>
        <p className="mt-1 text-sm text-muted">{note}</p>
      </Link>
    </Container>
  );
}
