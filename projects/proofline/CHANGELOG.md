# Changelog

## 0.2.0 (2026-09-29)

- Held-out hand-labelled challenge set (`benchmarks/challenge_heldout.yaml`, 65 cases),
  run once before any fix: 62/65, precision 87.9%, recall 100%, F1 0.935. All four false
  positives traced and fixed; both challenge sets now run in CI.
- `proofline challenge` command (exits 1 on any failed case).
- Benchmark reports a gate view (precision, recall, F1, accuracy, FP, FN) and latency
  (p50/p95 per report, claims per second).
- Metric names split around their number are recognised ("sold 1,017 rooms").
- Verbs that bound a level are hedges, not changes ("topped $460K", "exceeded 70%").
- A bare integer after a capitalised non-entity word mid-sentence is a name, not a claim
  ("Tower 2", "Terminal 4").
- Static demo pages: `python -m proofline.export_demo --html docs/demo`.
- `.env.example`, CONTRIBUTING, SECURITY, ROADMAP.
- First hand-labelled challenge set (68 cases, 13 categories), run once: 63/68.
- A change with no stated comparison is `unverifiable/ambiguous` when more than one basis
  exists and the number fits one of them.
- A qualifier before a generic metric word makes an unknown metric ("Spa revenue",
  "Weekend churn") instead of a lookalike.
- A level equal to a base-period value is diagnosed `wrong_basis` (stale period).

## 0.1.0 (2026-09-29)

- Fact sheets from CSV + spec: ratio-of-sums metrics, bases from column suffixes or the
  previous period, derivations for every fact.
- Number parsing with display-precision intervals, hedges, K/M/B, lakh/crore, bps,
  percentage points, currencies; identifiers and dates skipped.
- Clause-level attribution with carry-over, anaphora and headings.
- Three-valued verification with diagnosis; minimal-edit repair.
- Guarded generation loop (Gemini, Claude), `eval-llm`, MCP server.
- Synthetic benchmark with four template families, held-out protocol, ablations and a
  naive-lookup baseline; sample reports and demo export for the portfolio site.
