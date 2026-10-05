import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { ReadMore, ScrambleText } from "./Effects";
import { ArrowRight, ArrowUpRight } from "./Icons";
import { Reveal } from "./Reveal";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 2xl:px-14 ${className}`}>{children}</div>;
}

/** Numbered kicker, a serif title (use <em> for the accent word) and an optional intro. */
export function SectionHeading({ id, index, kicker, title, intro }: { id?: string; index?: string; kicker: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <Reveal className="mb-12 grid gap-6 md:mb-16 md:grid-cols-[1fr_minmax(0,420px)] md:items-end md:gap-12">
      <div>
        <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-subtle">
          {index && <span className="text-accent">{index}</span>}
          <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
          <ScrambleText text={kicker.toUpperCase()} />
        </p>
        <h2 id={id ? `${id}-title` : undefined} className="mt-5 font-display text-[2.6rem] leading-[1.02] text-fg sm:text-6xl">
          {title}
        </h2>
      </div>
      {intro && (
        <div className="md:pb-2">
          <ReadMore className="text-[16.5px] leading-relaxed text-muted">{intro}</ReadMore>
        </div>
      )}
    </Reveal>
  );
}

export function Section({
  id,
  index,
  label,
  title,
  intro,
  children,
  className = "",
}: {
  id?: string;
  index?: string;
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={`relative scroll-mt-24 py-20 sm:py-28 ${className}`}>
      <Container>
        <SectionHeading id={id} index={index} kicker={label} title={title} intro={intro} />
        {children}
      </Container>
    </section>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-bg/40 px-2.5 py-1 font-mono text-[11px] leading-none text-muted">
      {children}
    </span>
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
      {external ? (
        <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      ) : (
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      )}
    </a>
  );
}

const buttonStyles = {
  primary:
    "bg-accent text-accent-fg hover:shadow-[0_10px_40px_-10px_var(--accent)] shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] font-medium",
  secondary: "border border-line-strong bg-elev/60 text-fg hover:border-fg/40 backdrop-blur",
  ghost: "text-muted hover:text-fg hover:bg-sunk",
} as const;

const buttonSizes = {
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-4 text-[13px]",
  icon: "size-11",
} as const;

export function buttonClass(variant: keyof typeof buttonStyles = "primary", size: keyof typeof buttonSizes = "md", className = "") {
  return `group inline-flex items-center justify-center gap-2 rounded-full transition-all duration-300 ${buttonSizes[size]} ${buttonStyles[variant]} ${className}`;
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
  ...rest
}: { href: string; variant?: keyof typeof buttonStyles; className?: string; children: ReactNode } & Omit<ComponentProps<"a">, "href" | "className">) {
  const internal = href.startsWith("/") && !href.endsWith(".pdf");
  if (internal) {
    return (
      <Link href={href} className={buttonClass(variant, "md", className)} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={buttonClass(variant, "md", className)} {...rest}>
      {children}
    </a>
  );
}
