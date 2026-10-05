"use client";

import { type CSSProperties, type ElementType, type ReactNode, useEffect, useId, useRef, useState } from "react";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Read more (phones only) ---------- */

/**
 * On screens narrower than 640px, long text shows its first two lines (faded) and a "Read more"
 * toggle. Wider screens always show everything. The full text stays in the DOM for screen readers.
 */
export function ReadMore({
  children,
  className = "",
  as: Tag = "div",
  lines = 2,
  lineHeight = "1.65em",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  lines?: number;
  lineHeight?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [needed, setNeeded] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const check = () => {
      if (!mq.matches) return setNeeded(false);
      const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
      // scrollHeight is the full content height whether or not the clamp is applied
      setNeeded(el.scrollHeight > fontSize * parseFloat(lineHeight) * lines + 4);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    mq.addEventListener("change", check);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", check);
    };
  }, [lineHeight, lines]);

  return (
    <>
      <Tag
        ref={ref}
        id={id}
        className={`${className} ${needed && !open ? "rm-clamp" : ""}`}
        style={{ "--rm-lines": lines, "--rm-lh": lineHeight } as CSSProperties}
      >
        {children}
      </Tag>
      {needed && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="relative z-10 mt-2 inline-flex items-center gap-1 rounded-full text-[13px] font-medium text-accent sm:hidden"
        >
          {open ? "Show less" : "Read more"}
          <svg viewBox="0 0 24 24" className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  );
}

/* ---------- scramble-in text ---------- */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_+*#";

/** Mono labels that decode into place when they scroll into view, and again on hover. */
export function ScrambleText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);

  const play = () => {
    const el = ref.current;
    if (!el || reduced()) return;
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const duration = 650;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const settled = Math.floor(p * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const c = text[i]!;
        out += i < settled || c === " " || c === "·" ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (p < 1) raf.current = requestAnimationFrame(step);
      else el.textContent = text;
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        io.disconnect();
        play();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span className={className} onMouseEnter={play}>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

/* ---------- marquee that answers the scroll wheel ---------- */

/** The tech marquee speeds up with scroll velocity and runs backwards while scrolling up. */
export function VelocityMarquee({ items }: { items: readonly string[] }) {
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    if (!el || reduced()) return;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let rate = 1;
    let target = 1;
    let frame = 0;
    const tick = () => {
      rate += (target - rate) * 0.14;
      target += (1 - target) * 0.05;
      const anim = el.getAnimations()[0];
      if (anim) anim.playbackRate = rate;
      if (Math.abs(rate - 1) > 0.01 || Math.abs(target - 1) > 0.01) frame = requestAnimationFrame(tick);
      else {
        frame = 0;
        if (anim) anim.playbackRate = 1;
      }
    };
    const onScroll = () => {
      const now = performance.now();
      const v = (window.scrollY - lastY) / Math.max(16, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      target = Math.max(-7, Math.min(8, 1 + v * 5));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div ref={track} className="marquee-track flex w-max">
      {[...items, ...items].map((t, i) => (
        <span key={i} className="flex items-center gap-10 pr-10 font-mono text-[13px] uppercase tracking-[0.16em] text-muted">
          {t}
          <span className="text-accent">✦</span>
        </span>
      ))}
    </div>
  );
}
