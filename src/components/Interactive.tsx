"use client";

import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Check, Copy } from "./Icons";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A ring and a spray of sparks where the pointer went down. Pure DOM + Web Animations; removes itself. */
function burst(layer: HTMLElement, x: number, y: number) {
  if (layer.childElementCount > 90) return;
  const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
  const add = (className: string) => {
    const el = document.createElement("span");
    el.className = className;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    return el;
  };
  for (const [scale, delay, duration] of [
    [1, 0, 700],
    [1.8, 60, 900],
  ] as const) {
    const ring = add("burst-ring");
    ring.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.1)", opacity: 0.95 },
        { transform: `translate(-50%, -50%) scale(${scale})`, opacity: 0 },
      ],
      { duration, delay, easing: ease, fill: "backwards" },
    ).onfinish = () => ring.remove();
  }
  const core = add("burst-core");
  core.animate(
    [
      { transform: "translate(-50%, -50%) scale(0.4)", opacity: 1 },
      { transform: "translate(-50%, -50%) scale(2.6)", opacity: 0 },
    ],
    { duration: 420, easing: ease },
  ).onfinish = () => core.remove();
  const sparks = 18;
  for (let i = 0; i < sparks; i++) {
    const spark = add(`burst-spark burst-spark-${i % 3}`);
    const angle = (i / sparks) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
    const dist = 55 + Math.random() * 85;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist + 10;
    spark.animate(
      [
        { transform: `translate(-50%, -50%) rotate(${angle}rad) scaleX(1.4)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${angle}rad) scaleX(0.15)`, opacity: 0 },
      ],
      { duration: 600 + Math.random() * 350, easing: ease },
    ).onfinish = () => spark.remove();
  }
}

const INTERACTIVE = "a, button, [role='option'], [role='tab'], input, summary, label, [data-tilt]";

/**
 * One set of listeners for the whole page:
 * - a soft red light that follows the pointer (bigger over anything clickable, brighter while scrolling);
 * - on touch screens the light follows the finger while it is down or scrolling;
 * - a burst of sparks on every click or tap;
 * - pointer coordinates for card borders (.spot), the footer wordmark (.spot-text) and 3D tilt ([data-tilt]).
 * Everything is rAF-throttled and switched off under prefers-reduced-motion (the light stays, still).
 */
export function Spotlight() {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let last: { x: number; y: number; target: EventTarget | null; mouse: boolean } | null = null;
    let tilted: HTMLElement | null = null;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    let touchTimer: ReturnType<typeof setTimeout> | undefined;

    const untilt = () => {
      if (!tilted) return;
      delete tilted.dataset.tilting;
      tilted.style.removeProperty("--rx");
      tilted.style.removeProperty("--ry");
      tilted = null;
    };

    const apply = () => {
      frame = 0;
      if (!last) return;
      const { x, y, target, mouse } = last;
      root.style.setProperty("--mx", `${x}px`);
      root.style.setProperty("--my", `${y}px`);
      const el = target instanceof Element ? target : null;
      const spot = el?.closest<HTMLElement>(".spot, .spot-text");
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--x", `${x - r.left}px`);
        spot.style.setProperty("--y", `${y - r.top}px`);
      }
      const tilt = mouse && !prefersReducedMotion() ? (el?.closest<HTMLElement>("[data-tilt]") ?? null) : null;
      if (tilt !== tilted) untilt();
      if (tilt) {
        const r = tilt.getBoundingClientRect();
        tilt.style.setProperty("--rx", `${(((y - r.top) / r.height - 0.5) * -5).toFixed(2)}deg`);
        tilt.style.setProperty("--ry", `${(((x - r.left) / r.width - 0.5) * 6).toFixed(2)}deg`);
        tilt.dataset.tilting = "";
        tilted = tilt;
      }
      root.dataset.cursor = el?.closest(INTERACTIVE) ? "hover" : "on";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = { x: e.clientX, y: e.clientY, target: e.target, mouse: true };
      schedule();
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      last = { x: t.clientX, y: t.clientY, target: e.target, mouse: false };
      schedule();
      clearTimeout(touchTimer);
    };
    const onTouchEnd = () => {
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => delete root.dataset.cursor, 700);
    };
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        delete root.dataset.cursor;
        untilt();
      }
    };
    const onScroll = () => {
      root.dataset.cursorScroll = "";
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => delete root.dataset.cursorScroll, 220);
      if (tilted) untilt();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      root.dataset.cursorFlash = "";
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => delete root.dataset.cursorFlash, 260);
      if (layer.current && !prefersReducedMotion()) burst(layer.current, e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onLeave, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      [scrollTimer, flashTimer, touchTimer].forEach(clearTimeout);
    };
  }, []);
  return (
    <>
      <div aria-hidden="true" className="cursor-light" />
      <div aria-hidden="true" ref={layer} className="burst-layer" />
      <div aria-hidden="true" className="scroll-progress" />
    </>
  );
}

/* ---------- toasts ---------- */

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent<string>("toast", { detail: message }));
}

export function Toaster() {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onToast = (e: Event) => {
      setMessage({ text: (e as CustomEvent<string>).detail, id: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 2200);
    };
    window.addEventListener("toast", onToast);
    return () => {
      window.removeEventListener("toast", onToast);
      clearTimeout(timer);
    };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      {message && (
        <div
          key={message.id}
          className="fade-in flex items-center gap-2 rounded-full border border-line-strong bg-elev px-4 py-2 text-sm text-fg shadow-[var(--shadow)]"
        >
          <Check className="size-4 text-accent" />
          {message.text}
        </div>
      )}
    </div>
  );
}

export async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast("Copy failed; select the text instead");
  }
}

export function CopyButton({ text, label, done, className = "" }: { text: string; label: string; done: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => {
        await copyText(text, done);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className={className}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

/* ---------- magnetic hover ---------- */

/** Pulls its child a few pixels toward the pointer. Inline wrapper; does nothing on touch or reduced motion. */
export function Magnetic({ children, strength = 0.22, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      className={`inline-block transition-transform duration-300 ease-[var(--ease)] motion-reduce:transform-none ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const el = ref.current!;
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </span>
  );
}

/* ---------- local time in Pune ---------- */

const formatter = typeof Intl !== "undefined" ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }) : null;

function subscribeMinute(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}

/** The current time in India, rendered on the client only (the server's clock would not hydrate). */
export function LocalTime({ className = "" }: { className?: string }) {
  const time = useSyncExternalStore(
    subscribeMinute,
    () => formatter?.format(new Date()) ?? "",
    () => "",
  );
  return (
    <span className={className} suppressHydrationWarning>
      {time ? `${time.toUpperCase()} IST` : "IST"}
    </span>
  );
}
