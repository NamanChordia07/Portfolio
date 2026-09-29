"use client";

import { type ReactNode, useMemo, useState } from "react";

import { demo, type DemoClaim, reasonLabel, segments } from "@/lib/demo";

import { renderPlain, statusDot, statusStyle } from "./ReportText";

type View = "draft" | "repaired";

function repairedSegments(sample: (typeof demo.samples)[number]) {
  // Edit offsets refer to the draft; walk them in order to find where each lands in the repaired text.
  const out: { start: number; end: number; before: string; reason: string }[] = [];
  let shift = 0;
  for (const e of [...sample.repaired.edits].sort((a, b) => a.start - b.start)) {
    const start = e.start + shift;
    out.push({ start, end: start + e.after.length, before: e.before, reason: e.reason });
    shift += e.after.length - (e.end - e.start);
  }
  return out;
}

export function ProoflineDemo() {
  const [sampleId, setSampleId] = useState(demo.samples[0]!.id);
  const [view, setView] = useState<View>("draft");
  const sample = demo.samples.find((s) => s.id === sampleId)!;
  const firstWrong = useMemo(() => sample.claims.findIndex((c) => c.status === "contradicted"), [sample]);
  const [selected, setSelected] = useState<number>(firstWrong);
  const active: DemoClaim | undefined = sample.claims[selected] ?? sample.claims[firstWrong];

  function pick(id: string) {
    const s = demo.samples.find((x) => x.id === id)!;
    setSampleId(id);
    setView("draft");
    setSelected(s.claims.findIndex((c) => c.status === "contradicted"));
  }

  const counts = view === "draft" ? sample.counts : sample.repaired.counts;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-elev shadow-[var(--shadow)]">
      <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div role="tablist" aria-label="Sample report" className="flex flex-wrap gap-1.5">
          {demo.samples.map((s) => (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={s.id === sampleId}
              aria-controls="demo-panel"
              onClick={() => pick(s.id)}
              className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                s.id === sampleId ? "bg-fg text-bg" : "text-muted hover:bg-sunk hover:text-fg"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 self-start rounded-full border border-line p-0.5 sm:self-auto" role="group" aria-label="Report version">
          {(["draft", "repaired"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-[13px] transition-colors ${view === v ? "bg-sunk text-fg" : "text-muted hover:text-fg"}`}
            >
              {v === "draft" ? "LLM draft" : "After repair"}
            </button>
          ))}
        </div>
      </div>

      <div id="demo-panel" role="tabpanel" className="grid lg:grid-cols-[1.35fr_1fr]">
        <div className="border-b border-line p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-subtle">
            <span>
              {sample.dataset} · {sample.period} · {sample.facts} facts
            </span>
            {(["supported", "contradicted", "unverifiable"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${statusDot[k]}`} aria-hidden="true" />
                {counts[k]} {k}
              </span>
            ))}
          </div>
          {view === "draft" ? (
            <p className="whitespace-pre-wrap text-[15px] leading-8 text-muted">
              {segments(sample.text, sample.claims).map((seg, i) =>
                seg.kind === "text" ? (
                  <span key={i}>{renderPlain(seg.value, String(i))}</span>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(seg.index)}
                    aria-pressed={selected === seg.index}
                    aria-label={`${seg.value}: ${seg.claim.status}${seg.claim.status === "supported" ? "" : `, ${reasonLabel[seg.claim.reason]}`}`}
                    className={`rounded px-1 py-0.5 text-left transition-shadow ${statusStyle[seg.claim.status]} ${
                      selected === seg.index ? "outline outline-2 outline-offset-1 outline-fg" : ""
                    }`}
                  >
                    {seg.value}
                  </button>
                ),
              )}
            </p>
          ) : (
            <RepairedText sample={sample} />
          )}
        </div>

        <aside aria-live="polite" className="p-4 sm:p-6">
          {view === "draft" && active ? (
            <ClaimDetail claim={active} />
          ) : (
            <div className="space-y-3 text-sm text-muted">
              <p className="font-medium text-fg">{sample.repaired.edits.length} minimal edits</p>
              <ul className="space-y-2">
                {sample.repaired.edits.map((e) => (
                  <li key={e.start} className="flex flex-wrap items-baseline gap-x-2 font-mono text-[13px]">
                    <span className="text-bad line-through decoration-bad/60">{e.before}</span>
                    <span aria-hidden="true">→</span>
                    <span className="sr-only">changed to</span>
                    <span className="text-fg">{e.after}</span>
                    <span className="font-sans text-xs text-subtle">({reasonLabel[e.reason] ?? e.reason.replace("_", " ")})</span>
                  </li>
                ))}
              </ul>
              <p className="text-[13px] leading-relaxed">
                Repair changes only the wrong token and keeps the author&apos;s format. Unverifiable claims are never rewritten: there is
                nothing to rewrite them to.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ClaimDetail({ claim }: { claim: DemoClaim }) {
  const rows = [
    ["Kind", claim.kind],
    ["Metric", claim.metric],
    ["Entity", claim.entity],
    ["Basis", claim.basis],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${statusDot[claim.status]}`} aria-hidden="true" />
        <span className="text-sm font-medium capitalize text-fg">{claim.status}</span>
        {claim.status !== "supported" && <span className="text-sm text-muted">· {reasonLabel[claim.reason]}</span>}
      </div>
      <p className="mt-2 font-mono text-lg text-fg">{claim.text}</p>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-subtle">{k}</dt>
            <dd className="font-mono text-fg">{v.replace(/_/g, " ")}</dd>
          </div>
        ))}
      </dl>
      {claim.message && <p className="mt-4 text-[13px] leading-relaxed text-muted">{claim.message}</p>}
      {claim.factId && (
        <div className="mt-4 rounded-lg border border-line bg-sunk p-3">
          <div className="font-mono text-[11px] uppercase tracking-wider text-subtle">Fact</div>
          <div className="mt-1 break-all font-mono text-[12px] text-fg">{claim.factId}</div>
          {claim.derivation && <div className="mt-1 break-words text-[12px] text-muted">{claim.derivation}</div>}
        </div>
      )}
      <p className="mt-4 text-xs text-subtle">Select any highlighted number to inspect it.</p>
    </div>
  );
}

function RepairedText({ sample }: { sample: (typeof demo.samples)[number] }) {
  const marks = repairedSegments(sample);
  const out: ReactNode[] = [];
  let pos = 0;
  marks.forEach((m, i) => {
    if (m.start > pos) out.push(<span key={`t${i}`}>{renderPlain(sample.repaired.text.slice(pos, m.start), `r${i}`)}</span>);
    out.push(
      <mark key={`m${i}`} className={`rounded px-1 py-0.5 ${statusStyle.fixed}`} title={`was “${m.before}”`}>
        {sample.repaired.text.slice(m.start, m.end)}
      </mark>,
    );
    pos = m.end;
  });
  out.push(<span key="tail">{renderPlain(sample.repaired.text.slice(pos), "tail")}</span>);
  return <p className="whitespace-pre-wrap text-[15px] leading-8 text-muted">{out}</p>;
}
