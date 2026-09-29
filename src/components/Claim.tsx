"use client";

import { useId } from "react";

import type { Claim as ClaimData } from "@/content/site";

/**
 * A number with a receipt. Every figure on the site is rendered through this component: a
 * dotted underline marks it as sourced, and hovering or focusing it shows where it comes from.
 * The source is also exposed to assistive technology via aria-describedby.
 */
export function Claim({ claim, className = "" }: { claim: ClaimData; className?: string }) {
  const id = useId();
  return (
    <span
      className={`claim relative inline-block cursor-help whitespace-nowrap font-medium text-fg underline decoration-accent decoration-dotted decoration-[1.5px] underline-offset-[5px] ${className}`}
      tabIndex={0}
      aria-describedby={id}
    >
      {claim.value}
      <span
        id={id}
        role="tooltip"
        className="claim-tip absolute left-1/2 top-full z-30 mt-2 w-64 whitespace-normal rounded-lg border border-line bg-elev p-3 text-left font-sans text-xs font-normal leading-relaxed text-muted no-underline shadow-[var(--shadow)]"
      >
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-accent">Source</span>
        {claim.source}
      </span>
    </span>
  );
}
