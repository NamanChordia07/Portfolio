"use client";

import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Check, Copy } from "./Icons";

/**
 * One pointer listener for the whole page: it moves the background glow and tells the card under
 * the pointer where to light its border. rAF-throttled, fine pointers only.
 */
export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = document.documentElement;
    let frame = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      frame = 0;
      if (!last) return;
      root.style.setProperty("--mx", `${last.clientX}px`);
      root.style.setProperty("--my", `${last.clientY}px`);
      const card = (last.target as Element | null)?.closest?.<HTMLElement>(".spot");
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--x", `${last.clientX - r.left}px`);
        card.style.setProperty("--y", `${last.clientY - r.top}px`);
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <div aria-hidden="true" className="page-glow" />;
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
