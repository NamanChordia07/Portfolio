# Design notes

## Problem framing

Automated report commentary (weekly performance summaries, forecast reviews, variance
explanations) is one of the most common enterprise LLM deployments, and one of the most
fragile: the prose is fluent, the numbers are occasionally wrong, and a reader cannot tell
which. The fix people reach for first, asking the model to "double check", uses the same
fallible reasoning to audit itself. Proofline takes the opposite position:

> The model writes. A deterministic system decides whether what it wrote is true.

That is a neurosymbolic split: generation is probabilistic, verification is symbolic,
explainable and testable. It also keeps the verifier cheap (no model calls), fast
(about 7,700 claims or 560 reports per second, single-threaded on a 2.1 GHz cloud vCPU) and auditable.

## Key decisions

**1. Facts are computed once, with IDs and derivations.**
`compute_facts` expands a small declarative spec (metrics as column sums or ratios of
sums, comparison bases as column suffixes or the previous period) into every level, base,
absolute change and relative change for every entity and the total. Ratios are always
ratio-of-sums. Each fact carries a derivation string so a reviewer can see exactly how a
number was produced.

**2. A written number is an interval, not a point.**
Checking `abs(claim - fact) < 1%` looks reasonable and is wrong in both directions: it
rejects "12%" for 12.4 (correct rounding) and accepts "1,000" for 1,009 (a precise-looking
number that is off). The display precision of the text defines the claim: "12.4%" commits
to ±0.05, "$1.2M" to ±$50K. Hedges widen or bound the interval ("about", "nearly", "over").
The ablation that replaces this with a fixed ±1% tolerance produces 24-29% false alarms.

**3. Attribution is the hard part, and it is done like a reader would.**
Most wrong numbers in LLM text are right numbers in the wrong slot. So every number is
attributed to (metric, entity, basis, kind, direction):

- *kind* (level, base, delta, direction-only) from local syntax: "to X" and "at X" are
  levels, "from X", "vs X", "a budget of X", "X (Y last month)" are bases, "by X", "up X",
  "a X increase" are changes, points are always changes;
- *metric/entity/basis* from the clause, then earlier clauses, then (for anaphora such as
  "It" / "This") the previous sentence's subject, then the section heading, then the total;
- *direction* from the governing verb, a sign, or an elliptical carry-over
  ("revenue rose 12% and orders 8%"), resolved through metric polarity for words such as
  "improved" (a return rate that improved went down).

Without this context, 31-52% of correct claims on held-out text could not be tied to a
fact at all.

**4. Three verdicts, and unverifiable is not a pass.**
A number that cannot be grounded is reported, not silently accepted. The CLI exit code is
driven by contradictions; unverifiable claims are surfaced for a human (or fed back to the
model) because they are frequently the fabricated ones.

**5. Diagnosis before repair.**
The same wrong number has different fixes depending on why it is wrong. The verifier tests
alternative explanations in a fixed order (points/percent confusion, scale, another basis,
another entity, another metric, then plain wrong value) and reports the first that fits.
Diagnosis accuracy is 87-100% by error type; the misses are genuine coincidences where a
corrupted value happens to equal some other fact.

**6. Repair is minimal and conservative.**
Edits replace only the offending token and reuse its formatting. Unit confusion is fixed
by correcting the unit ("5.2%" → "5.2 pts"), not the number, because that preserves what
the author meant. Unverifiable claims are never rewritten. Repair broke 0.05-1.2% of
correct claims in the benchmark, always downstream of a false alarm.

**7. The loop feeds back specifics, then stops.**
Guarded generation sends the model a numbered list of exact problems with the fact it
should have used, bounded by `max_rounds`, then falls back to deterministic repair. The
loop is provider-agnostic (Gemini and Claude adapters over official SDKs, plus a scripted
provider for tests).

## Why rule-based extraction (for now)

An LLM extractor would handle more phrasing, but it would make the checker as fallible as
the thing it checks, add cost and latency to every report, and make failures hard to
explain. The benchmark shows where the rules break (new constructions cost precision, not
recall), which points to the right hybrid: rules first, an LLM proposes attributions only
for numbers the rules leave unattributed, and verification stays deterministic.

## Evaluation protocol

Templates were split into families. `dev` was used while building. `heldout` was written
in a different voice and run once; its failures motivated fixes; `heldout2` was then
written and run once; `heldout3` likewise. The first-run numbers for each held-out family
are the honest measure of generalisation and are kept in `docs/results/*_first_run*.json`.
See [BENCHMARK.md](BENCHMARK.md).

## What I would build next

1. LLM-assisted attribution for unattributed numbers, measured on the same held-out families.
2. Share, rank and trend claims ("the top property", "a third consecutive weekly decline").
3. A real-model study with `proofline eval-llm` across providers and prompt styles.
4. A report-diff mode for recurring reports: flag numbers that changed meaning between versions.
