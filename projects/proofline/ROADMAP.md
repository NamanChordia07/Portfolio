# Roadmap

Ordered by what would most change how much Proofline can be trusted on real reports.

## Next

1. **Real-model error rates.** Run `proofline eval-llm` against Gemini and Claude on all
   three datasets; publish first-draft vs guarded error rates and cost per report. Nothing
   about real models is claimed until this has run.
2. **A challenge set from real model output.** Hand-label 100+ sentences from those runs;
   run once; publish the first run. This replaces template text as the main precision test.
3. **LLM-assisted attribution fallback.** When the rule-based extractor cannot attribute a
   number (no metric, ambiguous entity), ask a model for metric/entity/basis as structured
   output, then verify deterministically. The model proposes; the fact sheet decides.

## Later

- Shares and rankings ("the top property", "40% of revenue"), multi-period trends
  ("third straight week"), derived arithmetic ("twice last year's level").
- Data quality inputs: missing periods, restatements, zero or negative bases.
- Spec inference from a CSV header so a new dataset needs less configuration.
- A GitHub Action that verifies generated reports in a pipeline and comments the verdicts.
- Packaging to PyPI once the API has settled.

## Not planned

- Letting a model decide whether a claim is supported. Verification stays deterministic
  and explainable.
