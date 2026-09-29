import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1120px] px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Section({
  id,
  label,
  title,
  intro,
  children,
}: {
  id?: string;
  label: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="scroll-mt-20 border-t border-line py-20 sm:py-24">
      <Container>
        <div className="mb-10 grid gap-4 md:grid-cols-[220px_1fr] md:gap-10">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-subtle">{label}</p>
          <div>
            <h2 id={id ? `${id}-title` : undefined} className="text-2xl font-semibold tracking-[-0.02em] text-fg sm:text-3xl">
              {title}
            </h2>
            {intro && <div className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted">{intro}</div>}
          </div>
        </div>
        {children}
      </Container>
    </section>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted">{children}</span>
  );
}

export function ArrowLink({ href, children, external = false }: { href: string; children: ReactNode; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-fg"
    >
      <span className="underline decoration-line-strong underline-offset-4 transition-colors group-hover:decoration-accent">{children}</span>
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
        {external ? "↗" : "→"}
      </span>
    </a>
  );
}
