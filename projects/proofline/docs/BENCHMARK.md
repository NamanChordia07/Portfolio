# Benchmark

## What is measured

Can the verifier find wrong numbers in report prose without flagging correct ones?

- **Corpus.** Reports generated from computed facts over three synthetic domains:
  `hotel_weekly` (4 properties, occupancy/ADR/RevPAR/revenue/rooms sold, bases: last year,
  budget, forecast, last week), `retail_monthly` (4 regions, INR amounts written in
  lakh/crore and Indian digit grouping, a lower-is-better return rate), `saas_monthly`
  (3 segments, MRR, new customers, churn). 200 reports per domain per template family.
  About 30% of reports are fully clean; in the rest each sentence is corrupted with
  probability 0.35.
- **Errors injected** (the ways LLM commentary goes wrong): `wrong_value`,
  `rounding_drift` (2-3 display units, e.g. 66.0% written as 66.3%), `wrong_direction`,
  `unit_confusion` (points written as percent), `wrong_basis`, `wrong_entity`,
  `wrong_metric`, `scale_error` (K vs M, lakh vs crore), `fabricated` (a metric not in the data).
- **Labels.** Every displayed number is labelled by an independent check of the value and
  direction against the fact for what the sentence *states*. A corruption that happens to
  produce a true statement is labelled clean. Labels never use the verifier's extractor.
- **Metrics.** Error recall (flagged as contradicted or unverifiable), false-alarm rate
  (correct claims flagged contradicted, plus contradictions on spans that are not claims),
  flag precision, share of clean reports that pass, share of corrupted reports caught,
  diagnosis accuracy per error type, and repair outcomes re-checked against ground truth.
- **Systems.** `proofline`; ablations `fixed_tolerance` (±1%, no display precision),
  `no_context` (no carry-over across clauses/sentences), `no_basis` (basis phrases ignored);
  baseline `naive_lookup` (flag a number only if no fact anywhere has that value).

## Protocol: how the held-out numbers were kept honest

| step | what happened |
|---|---|
| 1 | Built the extractor against `dev` templates only. |
| 2 | Wrote `heldout` templates in a different voice; ran once → `results/heldout_first_run.json`. |
| 3 | Inspected failures ("vs budget, by 7.0 percent"; a wrong verb flagged at the verb, not the number), fixed them. |
| 4 | Wrote `heldout2`; ran once → `results/heldout2_first_run.json`. One construction ("2.3% (2.2% last month)") caused almost all false alarms; fixed. |
| 5 | Wrote `heldout3`; ran once. Found a **benchmark** bug: one template hard-coded "lifted", so falling metrics were labelled clean while the verifier (correctly) flagged them. Fixed the labels with the extractor untouched → `results/heldout3_first_run_corrected_labels.json`. The uncorrected file is kept too. |
| 6 | Added common verbs found missing ("raised", "lowered"); `results/current.*` is the state after all fixes, where every family has been seen. |
| 7 | Wrote the hand-labelled challenge set (`benchmarks/challenge.yaml`, see below); ran once → `results/challenge_first_run.json`; fixed what it exposed. |
| 8 | Wrote a second, held-out challenge set in new phrasings (`benchmarks/challenge_heldout.yaml`); ran once → `results/challenge_heldout_first_run.json`; fixed what it exposed; re-ran the template families to confirm no regression. |

## Generalisation (first run per held-out family)

| family | claims | errors | recall | false alarms | flag precision | clean reports pass | corrupted reports caught |
|---|---|---|---|---|---|---|---|
| heldout  | 7,745 | 842 | 98.9% | 1.87% | 82.9% | 79.2% | 99.7% |
| heldout2 | 8,380 | 845 | 100.0% | 4.54% | 67.0% | 52.6% | 100.0% |
| heldout3 | 7,554 | 813 | 98.9% | 1.11% | 89.2% | 87.2% | 100.0% |

Ablations and baseline on the same first runs:

| system | recall | false alarms | correct claims left unverifiable |
|---|---|---|---|
| proofline | 98.9-100% | 1.1-4.5% | 0% |
| fixed ±1% tolerance | 98.0-99.4% | 24.1-28.7% | 0% |
| no context carry-over | 97.5-99.6% | 8.4% | 31.3-51.6% |
| no basis handling | 86.1-88.6% | 5.5-6.1% | 0-6.7% |
| naive lookup | 16.2-20.3% | 0% | - |

Reading: recall generalises to new phrasing; precision is where unseen constructions
hurt, and each held-out family exposed one or two constructions. Precision-aware intervals
and context resolution are each worth an order of magnitude in false alarms.

## Current state (all families seen)

From `proofline bench --n 200` (full tables in [results/current.md](results/current.md)):

| family | recall | false alarms | clean reports pass | repair: errors fixed | repair: correct claims broken |
|---|---|---|---|---|---|
| dev | 100.0% | 0.15% | 100.0% | 99.7% | 0.28% |
| heldout | 100.0% | 0.03% | 100.0% | 100.0% | 0.06% |
| heldout2 | 100.0% | 0.03% | 100.0% | 99.9% | 0.05% |
| heldout3 | 99.9% | 1.11% | 87.2% | 98.4% | 1.16% |

The same runs as a gate decision (a claim is flagged if it is contradicted **or** left
unverifiable, so an unverifiable correct claim counts as a false positive), with latency:

| family | precision | recall | F1 | accuracy | FP | FN | p50 per report | p95 per report | claims/s |
|---|---|---|---|---|---|---|---|---|---|
| dev | 98.6% | 100.0% | 0.993 | 99.86% | 12 | 0 | 2.2 ms | 4.1 ms | ~6,200 |
| heldout | 99.8% | 100.0% | 0.999 | 99.97% | 2 | 0 | 2.0 ms | 3.3 ms | ~6,200 |
| heldout2 | 99.8% | 100.0% | 0.999 | 99.98% | 2 | 0 | 2.5 ms | 5.4 ms | ~5,000 |
| heldout3 | 91.5% | 99.9% | 0.955 | 98.99% | 75 | 1 | 2.1 ms | 3.7 ms | ~5,600 |

Latency is single-threaded wall time for `verify_text` on one report (about 13 claims) on a
2.1 GHz Xeon cloud vCPU; it varies by roughly ±20% between runs.

## Hand-labelled challenge sets

Template families test many sentences built from a few constructions. The challenge sets
test many constructions, one or two sentences each, written by hand against the fact
sheets and labelled with what a careful analyst would conclude from the data, not with what
Proofline outputs. Thirteen categories: basics, points vs percent, currency and scale
(K/M, lakh/crore, $ vs ₹ vs €), absolute numbers, wrong entity, wrong period or basis, wrong
direction, lower-is-better metrics, hedges and rounding, missing evidence, ambiguity
(a change with no stated comparison), context (headings, anaphora, lists) and identifiers
(Week 32, FY26, Tower 2).

Scored per labelled claim. "Flag" = contradicted or unverifiable, the positive class.

| set | cases | claims | first run: cases passed | status accuracy | precision | recall | F1 | FP | FN | p50 per case | after fixes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| original ([challenge.yaml](../benchmarks/challenge.yaml)) | 68 | 78 | 63/68 | 94.9% | 100.0% | 94.1% | 0.970 | 0 | 2 | 0.38 ms | 68/68 |
| held-out ([challenge_heldout.yaml](../benchmarks/challenge_heldout.yaml)) | 65 | 79 | 62/65 | 94.9% | 87.9% | 100.0% | 0.935 | 4 | 0 | 0.51 ms | 65/65 |

What the first runs exposed:

- **Original set.** A change with no stated comparison ("Occupancy rose 1.1%") was accepted
  because it matched *some* basis; it is now `unverifiable/ambiguous` when more than one
  basis exists. "Spa revenue" and "Weekend churn" were checked as room revenue and churn
  (a qualifier word now makes an unknown metric). A level equal to last period's value
  was diagnosed as a wrong value instead of a stale period (`wrong_basis`).
- **Held-out set.** No error was missed; all failures were false positives. "Sold 1,017
  rooms" (a metric name split around its number) was unattributed; "topped $460K" was read
  as a change instead of a lower bound; "(Tower 2)" was read as a claim.

Both sets now pass completely, so neither is an unbiased test any more; the first-run rows
above are the honest generalisation numbers. The next held-out set should come from real
model output (`proofline eval-llm`), labelled by hand.

Per error type, the naive lookup detects 0% of `wrong_direction`, `unit_confusion`,
`wrong_basis`, `wrong_entity` and `wrong_metric` errors in every family; Proofline detects
99-100% of each.

## Threats to validity

- Templates and extractor share an author. The held-out protocol limits but does not remove
  that bias. Real model output is more varied; `proofline eval-llm` is the real test.
- Injected error rates are chosen, not observed. The benchmark says how well errors are
  caught, not how often models make them.
- Synthetic data is smooth. Real data has missing periods, restatements and zero bases.

## Reproduce

```bash
pip install -e ".[dev]"
proofline bench --n 200 --out docs/results/current.md --json docs/results/current.json   # ~40 s
proofline challenge --set original                                                        # exit 1 on any failed case
proofline challenge --set heldout
```
