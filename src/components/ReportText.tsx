import type { ReactNode } from "react";

/** Renders report markdown-lite: "## Heading" lines become small headings, the rest stays as written. */
export function renderPlain(value: string, keyPrefix: string): ReactNode[] {
  const parts = value.split(/(^## [^\n]*$)/m);
  return parts.map((p, i) =>
    p.startsWith("## ") ? (
      <span key={`${keyPrefix}-${i}`} className="font-semibold text-fg">
        {p.slice(3)}
      </span>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{p}</span>
    ),
  );
}

export const statusStyle = {
  supported: "bg-ok-soft text-fg ring-1 ring-inset ring-ok/35",
  contradicted: "bg-bad-soft text-fg ring-1 ring-inset ring-bad/45",
  unverifiable: "bg-unk-soft text-fg ring-1 ring-inset ring-unk/45",
  fixed: "bg-accent-soft text-fg ring-1 ring-inset ring-accent/50",
} as const;

export const statusDot = {
  supported: "bg-ok",
  contradicted: "bg-bad",
  unverifiable: "bg-unk",
} as const;
