# Contributing

Thanks for looking. Proofline is small on purpose: a deterministic core with no runtime
dependencies, and everything model-related behind optional extras.

## Set up

```bash
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
```

## Before you open a pull request

```bash
ruff check src tests && ruff format --check src tests
mypy                                   # strict
pytest                                 # includes both challenge sets as regression tests
proofline challenge --set original && proofline challenge --set heldout
proofline bench --n 200 --json /tmp/bench.json   # compare with docs/results/current.json
```

A change to `extract.py`, `numbers.py` or `verify.py` should leave the template benchmark
no worse on any family. If it moves a number, say which and why in the PR.

## Adding a phrasing Proofline gets wrong

1. Add the sentence as a case in a challenge set, labelled with what a careful analyst
   would conclude from the data (look the values up in the fact sheet, not in Proofline's
   output). Format and conventions are at the top of `benchmarks/challenge.yaml`.
2. Run `proofline challenge --set <file>` and confirm it fails for the reason you expect.
3. Fix it with a rule that covers the construction, not the sentence. Add a focused unit
   test in `tests/test_extract_verify.py`.
4. Re-run the benchmark; a fix that trades one false alarm for ten elsewhere is not a fix.

## Keeping the results honest

- Never edit a `*_first_run.json` file. First runs are the generalisation evidence.
- New held-out material (template family or challenge set) is run once before any fix,
  and that result is committed as-is, failures included.
- If you find a labelling bug, fix the labels without touching the verifier, and keep
  both result files (see `heldout3` in `docs/BENCHMARK.md`).

## Secrets

API keys come from the environment only (`.env.example` lists the names). Never commit a
key, a `.env` file, model transcripts containing private data, or real business data.
Use synthetic datasets for tests and examples.
