"use client";

import { useEffect, useId, useRef } from "react";

import type { Claim as ClaimData } from "@/content/site";

const NUMBER = /(\d[\d,]*(?:\.\d+)?)/;

/**
 * Counts each number in a claim up from zero the first time it scrolls into view ("98.9–100%"
 * animates both ends). The final value is in the HTML from the start, so without JavaScript, under
 * reduced motion or for screen readers nothing changes.
 */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const parts = value.split(NUMBER);
    const render = (t: number) =>
      parts
        .map((p, i) => {
          if (i % 2 === 0) return p;
          const decimals = (p.split(".")[1] ?? "").length;
          const n = parseFloat(p.replace(/,/g, "")) * t;
          return p.includes(",") ? n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : n.toFixed(decimals);
        })
        .join("");
    let frame = 0;
    if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = render(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / 1500);
          el.textContent = render(1 - Math.pow(1 - p, 4));
          if (p < 1) frame = requestAnimationFrame(step);
          else el.textContent = value;
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

/**
 * A number with a receipt. Every figure on the site is rendered through this component: a
 * dotted underline marks it as sourced, and hovering or focusing it shows where it comes from.
 * The source is also exposed to assistive technology via aria-describedby.
 */
export function Claim({ claim, className = "", animate = false }: { claim: ClaimData; className?: string; animate?: boolean }) {
  const id = useId();
  return (
    <span
      className={`claim relative inline-block cursor-help whitespace-nowrap font-medium text-fg underline decoration-accent decoration-dotted decoration-[1.5px] underline-offset-[5px] ${className}`}
      tabIndex={0}
      aria-describedby={id}
    >
      {animate ? <CountUp value={claim.value} /> : claim.value}
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
