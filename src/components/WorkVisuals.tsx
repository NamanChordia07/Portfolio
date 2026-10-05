import type { CSSProperties, ReactNode } from "react";

import { demo, segments } from "@/lib/demo";

import { Check, Cross } from "./Icons";
import { LiveVisual } from "./Reveal";

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

function Frame({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  return (
    <LiveVisual className={`relative h-full overflow-hidden rounded-2xl border border-line bg-sunk ${className}`}>
      <div aria-hidden="true" className="bg-dots mask-radial absolute inset-0" />
      <div aria-hidden="true" className="relative flex h-full flex-col">
        {children}
      </div>
      <span className="sr-only">{label}</span>
    </LiveVisual>
  );
}

/* ---------- AI voice sales agent: a live call ---------- */

const BARS = 44;
const heights = Array.from({ length: BARS }, (_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)));

export function VoiceVisual() {
  return (
    <Frame label="Illustration of a live call between the AI agent and a lead." className="min-h-[300px] p-5">
      <div className="flex items-center justify-between font-mono text-[11px] text-muted">
        <span className="flex items-center gap-2">
          <span className="pulse-dot size-1.5 rounded-full bg-accent" />
          Outbound call · live
        </span>
        <span>00:42</span>
      </div>
      <div className="mt-6 flex h-14 items-center justify-between gap-[3px]">
        {heights.map((h, i) => (
          <span
            key={i}
            className="wave-bar w-[3px] rounded-full bg-accent"
            style={{ height: `${Math.round(h * 100)}%`, opacity: 0.35 + h * 0.65, ...d((i % 11) * 0.09) }}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-1 flex-col gap-2.5 text-[13px] leading-snug">
        <p className="bubble max-w-[85%] self-start rounded-2xl rounded-bl-md border border-accent/30 bg-accent-soft px-3.5 py-2 text-fg" style={d(0)}>
          <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-wider text-accent">Agent</span>
          Hi! You enquired with us last week. Is now a good time?
        </p>
        <p className="bubble max-w-[70%] self-end rounded-2xl rounded-br-md border border-line-strong bg-elev px-3.5 py-2 text-fg" style={d(1.2)}>
          <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-wider text-subtle">Lead</span>
          Sure, go ahead.
        </p>
        <p className="bubble max-w-[85%] self-start rounded-2xl rounded-bl-md border border-accent/30 bg-accent-soft px-3.5 py-2 text-fg" style={d(2.4)}>
          <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-wider text-accent">Agent</span>
          Great. What budget range are you considering?
        </p>
      </div>
      <div className="bubble mt-4 flex items-center gap-3 rounded-xl border border-line-strong bg-elev px-3.5 py-2.5" style={d(3.6)}>
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
          <Check className="size-3.5" strokeWidth={2.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-medium text-fg">Lead qualified · handed to sales</span>
          <span className="block font-mono text-[10.5px] text-muted">budget ✓ · timeline ✓ · decision-maker ✓</span>
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] text-muted">
        {["speech-to-text", "LLM", "validator", "text-to-speech"].map((s, i) => (
          <span key={s} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-subtle">→</span>}
            <span className="rounded-md border border-line bg-elev px-1.5 py-0.5">{s}</span>
          </span>
        ))}
        <span className="ml-auto text-subtle">illustrative</span>
      </div>
    </Frame>
  );
}

/* ---------- Proofline: real verifier output, checked claim by claim ---------- */

const sample = demo.samples.find((s) => s.id === "hotel")!;
const from = sample.text.indexOf("Occupancy rose");
const to = sample.text.indexOf("\nRooms sold");
const snippet = sample.text.slice(from, to);
const snippetClaims = sample.claims
  .filter((c) => c.start >= from && c.end <= to)
  .map((c) => ({ ...c, start: c.start - from, end: c.end - from }));

export function ProoflineVisual() {
  let n = 0;
  const wrong = snippetClaims.filter((c) => c.status === "contradicted").length;
  return (
    <Frame label="Proofline output: numbers in an LLM-written sentence marked supported or wrong." className="min-h-[260px] p-5">
      <div className="flex items-center justify-between font-mono text-[11px] text-muted">
        <span>weekly_summary.md</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-ok" />
            {snippetClaims.length - wrong} ok
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-bad" />
            {wrong} wrong
          </span>
        </span>
      </div>
      <div className="relative mt-5 flex-1">
        <div className="scan-line absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-transparent via-accent/15 to-transparent" />
        <p className="relative text-[14px] leading-[2.1] text-muted">
          {segments(snippet, snippetClaims).map((seg, i) => {
            if (seg.kind === "text") return <span key={i}>{seg.value}</span>;
            const ok = seg.claim.status === "supported";
            const delay = 0.5 + n++ * 0.7;
            return (
              <span key={i} className="whitespace-nowrap">
                <span className={`rounded px-1 py-0.5 text-fg ring-1 ring-inset ${ok ? "bg-ok-soft ring-ok/35" : "bg-bad-soft ring-bad/45"}`}>{seg.value}</span>
                <span
                  className={`mark-pop ml-1 size-4 place-items-center rounded-full align-[-2px] ${ok ? "bg-ok text-bg" : "bg-bad text-bg"}`}
                  style={d(delay)}
                >
                  {ok ? <Check className="size-2.5" strokeWidth={3} /> : <Cross className="size-2.5" strokeWidth={3} />}
                </span>
              </span>
            );
          })}
        </p>
      </div>
      <p className="mt-4 border-t border-line pt-3 font-mono text-[10.5px] text-muted">real output · synthetic hotel data · repaired in one pass</p>
    </Frame>
  );
}

/* ---------- ClueCode: a streaming answer in the desktop app ---------- */

export function ClueCodeVisual() {
  return (
    <Frame label="Illustration of the ClueCode desktop app streaming an answer." className="min-h-[230px] p-4 sm:p-5">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-line-strong bg-elev shadow-[var(--shadow)]">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-full bg-line-strong" />
            ))}
          </span>
          <span className="ml-1 font-mono text-[11px] text-muted">ClueCode</span>
          <span className="ml-auto rounded-full border border-accent/40 px-2 py-0.5 font-mono text-[10px] text-accent">Pro · 1 device</span>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-3.5">
          <p className="self-end rounded-xl rounded-br-sm bg-sunk px-3 py-1.5 text-[12.5px] text-fg">Why does this query time out?</p>
          <div className="space-y-2 pt-1">
            {[92, 78, 86, 54].map((w, i) => (
              <span key={i} className="stream-line block h-2 rounded-full bg-line-strong" style={{ width: `${w}%`, ...d(i * 0.45) }} />
            ))}
          </div>
          <p className="mt-auto flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
            <span className="caret inline-block h-3 w-1.5 bg-accent" /> Gemini · streaming
          </p>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- Enterprise automation: data moving through a checked pipeline ---------- */

export function AutomationVisual() {
  const nodes = ["Salesforce", "G3 RMS", "Database", "Reports"];
  return (
    <Frame label="Illustration of an automated pipeline from Salesforce to generated reports." className="min-h-[230px] p-5">
      <div className="font-mono text-[11px] text-muted">nightly · playwright + python</div>
      <div className="relative mt-7 flex items-center justify-between">
        <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2">
          {[0, 1.5, 3].map((delay) => (
            <span key={delay} className="packet-x absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" style={d(delay)} />
          ))}
        </div>
        {nodes.map((n, i) => (
          <span
            key={n}
            className="node-ping relative rounded-xl border border-line-strong bg-elev px-2 py-1.5 text-center font-mono text-[10.5px] text-fg sm:px-2.5 sm:text-[11px]"
            style={d(i * 1.1)}
          >
            {n}
          </span>
        ))}
      </div>
      <div className="mt-auto space-y-1.5 pt-6 text-[12px] text-muted">
        {["account numbers match", "integration types match", "PDF · Word · Excel generated"].map((t) => (
          <p key={t} className="flex items-center gap-2">
            <span className="grid size-4 place-items-center rounded-full bg-ok-soft text-ok">
              <Check className="size-2.5" strokeWidth={3} />
            </span>
            {t}
          </p>
        ))}
      </div>
    </Frame>
  );
}
