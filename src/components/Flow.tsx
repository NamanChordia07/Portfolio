import type { ReactNode } from "react";

export type FlowStep = { title: string; detail?: ReactNode; tone?: "default" | "accent" | "muted" };

const tones = {
  default: "border-line bg-elev",
  accent: "border-accent/40 bg-accent-soft",
  muted: "border-dashed border-line-strong bg-sunk",
};

/**
 * A left-to-right pipeline that stacks vertically on small screens. Real text, not an image,
 * so it stays readable at any width and is available to screen readers as an ordered list.
 */
export function Flow({ steps, label }: { steps: FlowStep[]; label: string }) {
  return (
    <ol aria-label={label} className="flex flex-col items-stretch gap-2 md:flex-row md:items-stretch md:gap-0">
      {steps.map((s, i) => (
        <li key={s.title} className="flex flex-col items-stretch md:flex-1 md:flex-row md:items-center">
          <div className={`flex-1 rounded-2xl border p-4 ${tones[s.tone ?? "default"]}`}>
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent">{String(i + 1).padStart(2, "0")}</div>
            <div className="mt-1 text-sm font-medium text-fg">{s.title}</div>
            {s.detail && <div className="mt-1 text-[13px] leading-snug text-muted">{s.detail}</div>}
          </div>
          {i < steps.length - 1 && (
            <div aria-hidden="true" className="flex justify-center py-1 text-subtle md:px-1.5 md:py-0">
              <svg viewBox="0 0 16 16" className="size-4 rotate-90 md:rotate-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/** A labelled group of boxes, used for system maps. */
export function Box({ title, items, tone = "default", className = "" }: { title: string; items: string[]; tone?: keyof typeof tones; className?: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]} ${className}`}>
      <div className="text-sm font-medium text-fg">{title}</div>
      <ul className="mt-2 space-y-1 text-[13px] leading-snug text-muted">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-accent" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Connector({ label, direction = "both" }: { label: string; direction?: "both" | "right" | "left" }) {
  const arrows = { both: "↔", right: "→", left: "←" }[direction];
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-center font-mono text-[11px] leading-tight text-subtle lg:flex-col lg:px-2 lg:py-0">
      <span aria-hidden="true" className="text-base text-line-strong">
        {arrows}
      </span>
      <span>{label}</span>
    </div>
  );
}
