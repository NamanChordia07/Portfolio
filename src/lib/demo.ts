import data from "@/content/proofline-demo.json";

export type DemoClaim = {
  start: number;
  end: number;
  text: string;
  kind: string;
  metric: string | null;
  entity: string | null;
  basis: string | null;
  status: "supported" | "contradicted" | "unverifiable";
  reason: string;
  message: string;
  factId: string | null;
  derivation: string | null;
};

export type DemoSample = {
  id: string;
  title: string;
  dataset: string;
  period: string;
  currency: string;
  facts: number;
  text: string;
  counts: Record<"supported" | "contradicted" | "unverifiable", number>;
  claims: DemoClaim[];
  repaired: {
    text: string;
    edits: { start: number; end: number; before: string; after: string; reason: string }[];
    counts: Record<"supported" | "contradicted" | "unverifiable", number>;
  };
};

export type BenchRow = {
  family: string;
  system: string;
  claims: number;
  errors: number;
  recall: number;
  falseAlarms: number;
  precision: number;
  cleanReportsPass: number;
  unverifiableClean: number;
};

export const demo = data as unknown as {
  samples: DemoSample[];
  benchmark: { firstRuns: BenchRow[]; perType: { family: string; type: string; n: number; detected: number; naive: number }[] };
};

export const reasonLabel: Record<string, string> = {
  ok: "Supported",
  wrong_value: "Wrong value",
  wrong_direction: "Wrong direction",
  unit_confusion: "Points written as percent",
  wrong_basis: "Wrong comparison basis",
  wrong_entity: "Figure belongs to another entity",
  wrong_metric: "Figure belongs to another metric",
  scale_error: "Scale slip",
  currency_mismatch: "Wrong currency",
  no_metric: "No metric to check against",
  no_matching_fact: "No matching fact",
  ambiguous: "Ambiguous basis",
};

/** Split text into plain segments and claim segments, in order. Claims never overlap. */
export function segments(text: string, claims: DemoClaim[]) {
  const out: ({ kind: "text"; value: string } | { kind: "claim"; value: string; claim: DemoClaim; index: number })[] = [];
  let pos = 0;
  claims
    .map((claim, index) => ({ claim, index }))
    .sort((a, b) => a.claim.start - b.claim.start)
    .forEach(({ claim, index }) => {
      if (claim.start < pos) return;
      if (claim.start > pos) out.push({ kind: "text", value: text.slice(pos, claim.start) });
      out.push({ kind: "claim", value: text.slice(claim.start, claim.end), claim, index });
      pos = claim.end;
    });
  if (pos < text.length) out.push({ kind: "text", value: text.slice(pos) });
  return out;
}

export const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
