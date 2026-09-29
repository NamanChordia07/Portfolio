import Link from "next/link";

import { demo, reasonLabel, segments } from "@/lib/demo";

import { statusDot, statusStyle } from "./ReportText";

const sample = demo.samples.find((s) => s.id === "hotel")!;
// The two sentences about the portfolio: enough to show a supported claim next to two wrong ones.
const from = sample.text.indexOf("Occupancy rose");
const to = sample.text.indexOf("\nRooms sold");
const text = sample.text.slice(from, to);
const claims = sample.claims
  .filter((c) => c.start >= from && c.end <= to)
  .map((c) => ({ ...c, start: c.start - from, end: c.end - from }));
const counts = {
  supported: claims.filter((c) => c.status === "supported").length,
  contradicted: claims.filter((c) => c.status === "contradicted").length,
};
const wrong = claims.filter((c) => c.status === "contradicted");

export function HeroReceipt() {
  return (
    <figure className="relative rounded-2xl border border-line bg-elev p-5 shadow-[var(--shadow)] sm:p-6">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <span className="font-mono text-xs text-subtle">weekly_summary.md · drafted by an LLM</span>
        <span className="flex items-center gap-3 font-mono text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${statusDot.supported}`} aria-hidden="true" />
            {counts.supported} supported
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${statusDot.contradicted}`} aria-hidden="true" />
            {counts.contradicted} wrong
          </span>
        </span>
      </div>
      <p className="mt-4 text-[15px] leading-8 text-muted">
        {segments(text, claims).map((seg, i) =>
          seg.kind === "text" ? (
            <span key={i}>{seg.value}</span>
          ) : (
            <mark key={i} className={`rounded px-1 py-0.5 ${statusStyle[seg.claim.status]}`} title={seg.claim.message || "Matches the data"}>
              {seg.value}
            </mark>
          ),
        )}
      </p>
      <ul className="mt-4 space-y-2 border-t border-line pt-4 text-[13px] leading-snug">
        {wrong.map((c) => (
          <li key={c.start} className="flex gap-2.5">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-bad" aria-hidden="true" />
            <span>
              <span className="font-mono text-fg">{c.text}</span>
              <span className="text-muted"> — {reasonLabel[c.reason]}. </span>
              <span className="text-subtle">{c.message}</span>
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="mt-4 flex items-center justify-between gap-3 text-xs text-subtle">
        <span>Real output from Proofline on synthetic data.</span>
        <Link href="/work/proofline#demo" className="link shrink-0 text-fg">
          Try the demo
        </Link>
      </figcaption>
    </figure>
  );
}
