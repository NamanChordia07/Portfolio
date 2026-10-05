"use client";

import Image from "next/image";
import { type CSSProperties, useRef } from "react";

import { claims, site } from "@/content/site";

import { MapPin } from "./Icons";
import { LocalTime } from "./Interactive";

const chips = [
  { text: `AI voice agent · ${claims.vaLatency.value} median reply`, className: "-right-24 top-[14%]", depth: 26 },
  { text: `Proofline · ${claims.recall.value} errors caught`, className: "-left-28 top-[48%]", depth: -34 },
  { text: `ClueCode · ${claims.ccTests.value} tests`, className: "-right-12 bottom-[20%]", depth: 18 },
];

/**
 * The portrait as a physical card: it tilts toward the pointer, catches a glare, and the fact chips
 * drift at different depths. Pointer-only; on touch and under reduced motion it stays still.
 */
export function PhotoCard() {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 9).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
    el.style.setProperty("--px", px.toFixed(3));
    el.style.setProperty("--py", py.toFixed(3));
    el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
  }
  function onLeave() {
    const el = ref.current!;
    for (const p of ["--rx", "--ry", "--px", "--py"]) el.style.removeProperty(p);
  }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className="group/photo relative w-full max-w-[400px] [perspective:1100px] sm:mx-auto lg:w-[min(360px,calc((100svh-230px)*0.5625))] 2xl:w-[min(410px,calc((100svh-230px)*0.5625))] 2xl:max-w-none">
      <div
        aria-hidden="true"
        className="absolute -inset-10 rounded-full opacity-70 blur-3xl transition-opacity duration-700 group-hover/photo:opacity-100"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 32%, transparent), transparent)" }}
      />
      <div
        className="relative rounded-[30px] p-px transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))", transformStyle: "preserve-3d" } as CSSProperties}
      >
        {/* rotating accent edge */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[30px]">
          <div
            className="spin-slow absolute -inset-1/2"
            style={{ background: "conic-gradient(from 0deg, transparent 0 62%, var(--accent) 78%, transparent 92%)" }}
          />
          <div className="absolute inset-0 rounded-[30px] bg-line-strong/60" style={{ mixBlendMode: "normal", opacity: 0.35 }} />
        </div>
        <figure className="relative overflow-hidden rounded-[29px] bg-elev">
          <Image
            src={site.photo}
            alt="Portrait of Naman Chordia"
            width={900}
            height={1600}
            priority
            sizes="(min-width: 1536px) 410px, (min-width: 1024px) 360px, 400px"
            className="aspect-[9/16] h-auto w-full object-cover saturate-[0.92] transition-[filter,transform] duration-700 ease-[var(--ease)] group-hover/photo:saturate-110"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover/photo:opacity-100"
            style={{ background: "radial-gradient(420px circle at var(--gx, 50%) var(--gy, 30%), rgb(255 255 255 / 0.55), transparent 45%)" }}
          />
          <figcaption className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <span>
              <span className="block text-[15px] font-medium text-fg">Naman Chordia</span>
              <span className="block text-xs text-muted">AI &amp; Automation Developer · IDeaS</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-[11px] text-subtle max-sm:hidden">
              <span className="flex items-center gap-1">
                <MapPin className="size-3" /> Pune
              </span>
              <LocalTime />
            </span>
          </figcaption>
        </figure>
      </div>
      {chips.map((c) => (
        <span
          key={c.text}
          aria-hidden="true"
          className={`absolute hidden whitespace-nowrap rounded-full border border-line-strong bg-elev/85 px-3 py-1.5 font-mono text-[11px] text-fg shadow-[var(--shadow)] backdrop-blur-md transition-transform duration-500 ease-out lg:block ${c.className}`}
          style={{ transform: `translate(calc(var(--px, 0) * ${c.depth}px), calc(var(--py, 0) * ${c.depth}px))` }}
        >
          <span className="mr-1.5 text-accent">●</span>
          {c.text}
        </span>
      ))}
    </div>
  );
}
