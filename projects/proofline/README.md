# Proofline

**Every number an LLM writes into a business report, checked against the data before anyone reads it.**

LLMs are good at writing weekly performance commentary and bad at keeping the numbers
straight. The failures are rarely invented digits. They are *real numbers in the wrong
place*: last year's change reported against budget, one property's ADR attributed to
another, a 5.2-point occupancy gain written as "5.2%", "improved" when it fell. Those
errors survive a "does this number appear in the data?" check, and they destroy trust in
an automated report the first time a stakeholder catches one.

Proofline computes a fact sheet from the data, extracts every numeric and directional
claim from the prose, checks each against the fact it is *about* (metric, entity,
comparison basis, unit, display precision), explains how a wrong claim is wrong, and
repairs it with minimal edits. It runs as a Python library, a CLI that exits non-zero on
a bad report (so it can gate a pipeline), and an MCP server any agent can call.

```text
$ proofline demo
15 claims: 8 supported, 5 contradicted, 2 unverifiable
  [x] '5.2%' (unit_confusion): 5.2% matches the change in percentage points (occupancy:portfolio:delta_abs:last_year); as written it should be 8.44%
  [x] 'improved' (wrong_direction): says up, but revpar:portfolio:delta_abs:prior is -4.05
  [x] '1.1%' (wrong_basis): 1.1% matches rooms_sold:portfolio:delta_pct:forecast, not the stated basis (... last_year = 8.44%)
  [x] '$171.08' (wrong_entity): $171.08 is the figure for Riverside Inn, not Harbor View
  [x] '66.3%' (wrong_value): 66.3% does not match occupancy:harbor-view:level = 66.04%
  [?] '4.6' (no_metric): no metric could be attributed to this number
      in: Guest satisfaction rose to 4.6 out of 5.
  ...
Repaired:  "Occupancy rose 5.2 pts ...", "RevPAR worsened vs last week", "8.4% ahead of last year", "$150.04", "66.0%"
after repair: {'supported': 13, 'contradicted': 0, 'unverifiable': 2}
```

## Results

Measured on synthetic reports over three domains (hotel weekly in USD, retail monthly in
INR with lakh/crore, SaaS monthly), with nine kinds of injected error and an independent
ground-truth label on every number. Full method and tables: [docs/BENCHMARK.md](docs/BENCHMARK.md).

**Generalisation to phrasing never seen during development** (each family run once,
extractor frozen, 7.5k-8.4k claims per family):

| held-out family | errors caught | false-alarm rate | naive lookup catches |
|---|---|---|---|
| `heldout`  | 98.9% | 1.87% | 16.2% |
| `heldout2` | 100.0% | 4.54% | 17.7% |
| `heldout3` | 98.9% | 1.11% | 20.3% |

- A naive "does the number exist in the data" check catches **0%** of wrong-direction,
  wrong-basis, wrong-entity, wrong-metric and points-vs-percent errors, which are most
  of what goes wrong.
- Recall generalises; precision does not fully. New phrasings introduced 1-5% false
  alarms, each traced to one construction (for example "2.3% (2.2% last month)") and fixed.
  After fixes the four families sit at 0.03-1.1% false alarms and 99.9-100% recall.
- Ablations on held-out text: display-precision semantics replaced by a fixed ±1%
  tolerance → **24-29% false alarms**; no clause/sentence context → **31-52% of correct
  claims unverifiable**; no comparison-basis handling → recall falls to **86-89%**.
- Deterministic repair fixes 98-100% of erroneous claims while altering 0.05-1.2% of
  correct ones.

**Hand-labelled challenge sets** (one construction per case, 13 categories from points vs
percent and lakh/crore to ambiguity and identifiers; first run of each, before any fix):

| set | cases passed | precision | recall | F1 | false positives | false negatives | p50 latency |
|---|---|---|---|---|---|---|---|
| original, 68 cases | 63/68 | 100.0% | 94.1% | 0.970 | 0 | 2 | 0.38 ms |
| held-out, 65 cases | 62/65 | 87.9% | 100.0% | 0.935 | 4 | 0 | 0.51 ms |

Both pass fully after the fixes each run exposed. Throughput is about 5,000-6,200 claims/s
single-threaded (2-2.5 ms per report).

What is not measured yet: error rates of real models. `proofline eval-llm --provider gemini`
runs the guarded loop against a live model and reports first-draft vs final error rates;
no numbers are claimed here until that has been run.

## How it works

```
 rows.csv + spec.yaml ──► facts.compute_facts ──► FactSheet (levels, bases, abs/% changes, derivations)
                                                        │
 report.md ──► extract (clauses, carry-over) ──► claims ─┴─► verify ──► verdicts + diagnosis ──► repair
                                                                   │
 LLM draft ◄── feedback naming each wrong token ◄──────────────────┘   (guarded loop, max N rounds)
```

1. **Facts are computed, never generated.** Ratio metrics are ratio-of-sums (averaging
   per-property ADRs is a classic way totals go wrong). Every fact has a stable ID and a
   human-readable derivation.
2. **Numbers carry their precision.** "12%" means [11.5, 12.5); "about $1.2M", "nearly 5%"
   and "over 80%" get hedge-specific intervals. Scale words (K, M, lakh, crore), bps,
   percentage points and currency symbols are parsed; identifiers and dates (Week 32, Q3,
   FY26, COVID-19) are not claims.
3. **Claims are attributed like a reader would.** Each number is tied to a metric, entity,
   basis and direction from its clause, with carry-over from earlier clauses, anaphora
   ("It was up 5.7% vs forecast"), and section headings. The extractor is rule-based and
   records why it attributed each field, so every verdict is explainable.
4. **Verdicts are three-valued.** Supported, contradicted (with a diagnosis: wrong value,
   direction, basis, entity, metric, scale, currency, or points/percent confusion), or
   unverifiable. An ungrounded number is never counted as supported.
5. **Repair edits tokens, not sentences.** The fix keeps the author's format ("$1.4M" →
   "$1.2M", "5.2%" → "5.2 pts", "rose" → "fell") and never touches unverifiable claims.
6. **Guarded generation** drafts with a model, verifies, and sends back only the specific
   problems; after `max_rounds` it falls back to deterministic repair. Every round is traced.

Design rationale and trade-offs: [docs/DESIGN.md](docs/DESIGN.md).

## Use it

```bash
pip install -e ".[yaml]"          # the core has no runtime dependencies

proofline facts  --data examples/hotel_weekly/data.csv --spec examples/hotel_weekly/spec.yaml -o facts.json
proofline verify --facts facts.json examples/hotel_weekly/report.md --html report.html   # exit 1 if contradicted
proofline repair --facts facts.json examples/hotel_weekly/report.md -o fixed.md
proofline bench  --n 200                                                                   # reproduce the benchmark
proofline challenge --set heldout                                                          # hand-labelled cases
python -m proofline.export_demo --html docs/demo                                           # static demo pages

pip install -e ".[gemini]"   # then set GEMINI_API_KEY in your environment (see .env.example)
proofline generate --facts facts.json --provider gemini --task "Weekly summary for the GM"
proofline eval-llm --provider gemini --n 5 --out llm_eval.json
```

```python
from proofline.facts import DatasetSpec, compute_facts, load_rows
from proofline.verify import verify_text
from proofline.repair import repair_text

sheet = compute_facts(DatasetSpec.load("spec.yaml"), load_rows("data.csv"))
report = verify_text(draft, sheet)
if not report.passed:
    fixed, edits = repair_text(report, sheet)
```

**MCP.** `pip install -e ".[mcp]"` then register `proofline-mcp` (stdio) with any MCP
client. Tools: `compute_facts`, `facts_brief`, `verify_narrative`, `repair_narrative`.

## Engineering

- Pure-Python core, zero runtime dependencies; model SDKs (`google-genai`, `anthropic`) and
  `mcp` are optional extras.
- 71 tests (unit, property-based with Hypothesis, CLI, in-process MCP client, fake-SDK
  provider contracts, benchmark smoke, both challenge sets as regression tests), 95% line
  coverage, `mypy --strict`, `ruff`, CI on Python 3.11-3.13.
- API keys are read from the environment only (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`); the
  core never makes a network call.
- The benchmark generator is seeded and deterministic across processes; ground-truth
  labelling is independent of the verifier's extractor.

## Limitations

- The extractor is rule-based. Unfamiliar phrasings cost precision first (see results);
  an LLM-assisted extraction fallback for unattributed numbers is the next step, with
  verification staying deterministic.
- Claims about shares, rankings ("the top property"), multi-period trends and
  derived arithmetic ("twice last year's level") are not checked yet.
- The benchmark text is template-generated. It measures the checker against known error
  types; it does not measure how often real models make each error.

## Project

- [docs/DESIGN.md](docs/DESIGN.md): design and trade-offs
- [docs/BENCHMARK.md](docs/BENCHMARK.md): method, protocol, all results including first runs
- [docs/demo/](docs/demo/index.html): static demo, generated from real verifier output
- [ROADMAP.md](ROADMAP.md), [CHANGELOG.md](CHANGELOG.md), [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT
