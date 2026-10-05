"""Command-line interface.

proofline facts    --data rows.csv --spec spec.yaml -o facts.json
proofline verify   --facts facts.json report.md [--json] [--html out.html]   (exit 1 on contradictions)
proofline repair   --facts facts.json report.md [-o fixed.md]
proofline generate --facts facts.json --provider gemini --task "Weekly summary..." [--trace t.json]
proofline eval-llm --provider gemini --n 5                 (first-draft vs guarded error rates)
proofline bench    [--n 200] [--out docs/BENCHMARK_CURRENT.md]
proofline challenge [--set heldout|original|path.yaml] [--json out.json]   (exit 1 on any failed case)
proofline demo                                             (offline walkthrough)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .facts import DatasetSpec, FactSheet, compute_facts, load_rows
from .render import summary, to_html
from .repair import repair_text
from .samples import HOTEL
from .verify import verify_text


def _read_text(path: str) -> str:
    return sys.stdin.read() if path == "-" else Path(path).read_text(encoding="utf-8")


def _sheet(path: str) -> FactSheet:
    return FactSheet.from_json(Path(path).read_text(encoding="utf-8"))


def cmd_facts(a: argparse.Namespace) -> int:
    sheet = compute_facts(DatasetSpec.load(a.spec), load_rows(a.data))
    out = sheet.to_json()
    if a.output:
        Path(a.output).write_text(out, encoding="utf-8")
        print(f"{len(sheet.facts)} facts for {sheet.dataset} ({sheet.period}) -> {a.output}")
    else:
        print(out)
    return 0


def cmd_verify(a: argparse.Namespace) -> int:
    sheet = _sheet(a.facts)
    report = verify_text(_read_text(a.text), sheet)
    if a.json:
        print(json.dumps(report.to_dict(), indent=2))
    else:
        print(summary(report))
    if a.html:
        Path(a.html).write_text(to_html(report, sheet), encoding="utf-8")
    return 0 if report.passed else 1


def cmd_repair(a: argparse.Namespace) -> int:
    sheet = _sheet(a.facts)
    report = verify_text(_read_text(a.text), sheet)
    fixed, edits = repair_text(report, sheet)
    for e in edits:
        print(f"  {e.before!r} -> {e.after!r} ({e.reason})", file=sys.stderr)
    if a.output:
        Path(a.output).write_text(fixed, encoding="utf-8")
    else:
        print(fixed)
    return 0 if verify_text(fixed, sheet).passed else 1


def _provider(name: str, model: str | None):  # type: ignore[no-untyped-def]
    if name == "gemini":
        from .providers.gemini import DEFAULT_MODEL, GeminiProvider

        return GeminiProvider(model or DEFAULT_MODEL)
    if name == "claude":
        from .providers.claude import DEFAULT_MODEL as CLAUDE_DEFAULT
        from .providers.claude import ClaudeProvider

        return ClaudeProvider(model or CLAUDE_DEFAULT)
    raise SystemExit(f"unknown provider {name!r} (choose gemini or claude)")


def cmd_generate(a: argparse.Namespace) -> int:
    from .loop import guarded_generate

    sheet = _sheet(a.facts)
    result = guarded_generate(_provider(a.provider, a.model), sheet, a.task, max_rounds=a.rounds)
    for r in result.rounds:
        print(f"round {r.round}: {r.counts}", file=sys.stderr)
    if a.trace:
        Path(a.trace).write_text(
            json.dumps(
                [{"round": r.round, "counts": r.counts, "problems": r.problems, "text": r.text} for r in result.rounds], indent=2
            ),
            encoding="utf-8",
        )
    print(result.text)
    return 0 if result.passed else 1


def cmd_eval_llm(a: argparse.Namespace) -> int:
    from .evaluate_llm import run_llm_eval

    results = run_llm_eval(_provider(a.provider, a.model), n_tasks=a.n, max_rounds=a.rounds)
    Path(a.out).write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(json.dumps(results["summary"], indent=2))
    return 0


def cmd_bench(a: argparse.Namespace) -> int:
    from .bench.run import dump, run, to_markdown

    families = tuple(a.families.split(","))
    results = run(a.n, a.seed, families, progress=lambda m: print(m, file=sys.stderr))
    md = to_markdown(results)
    if a.out:
        Path(a.out).write_text(md, encoding="utf-8")
    if a.json:
        Path(a.json).write_text(dump(results), encoding="utf-8")
    print(md)
    return 0


def cmd_challenge(a: argparse.Namespace) -> int:
    from .bench.challenge import CHALLENGE_SETS, run_challenge, to_markdown

    path = CHALLENGE_SETS.get(a.set, Path(a.set))
    res = run_challenge(path)
    if a.json:
        Path(a.json).write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
    print(to_markdown(res))
    return 0 if res["cases_passed"] == res["cases"] else 1


DEMO_TEXT = HOTEL.text


def cmd_demo(_: argparse.Namespace) -> int:
    from .bench.datasets import hotel_weekly

    spec, rows = hotel_weekly()
    sheet = compute_facts(DatasetSpec.from_dict(spec), rows)
    print("A plausible LLM-written weekly summary:\n")
    print(DEMO_TEXT)
    report = verify_text(DEMO_TEXT, sheet)
    print(summary(report))
    fixed, _edits = repair_text(report, sheet)
    print("\nRepaired:\n")
    print(fixed)
    after = verify_text(fixed, sheet)
    print(f"after repair: {after.counts}")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="proofline", description="Verify every number in LLM-written business reports.")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("facts", help="compute a fact sheet from CSV + spec")
    s.add_argument("--data", required=True)
    s.add_argument("--spec", required=True)
    s.add_argument("-o", "--output")
    s.set_defaults(fn=cmd_facts)

    s = sub.add_parser("verify", help="verify a report; exit code 1 if anything is contradicted")
    s.add_argument("--facts", required=True)
    s.add_argument("text", help="report file, or - for stdin")
    s.add_argument("--json", action="store_true")
    s.add_argument("--html")
    s.set_defaults(fn=cmd_verify)

    s = sub.add_parser("repair", help="fix contradicted numbers with minimal edits")
    s.add_argument("--facts", required=True)
    s.add_argument("text")
    s.add_argument("-o", "--output")
    s.set_defaults(fn=cmd_repair)

    s = sub.add_parser("generate", help="guarded generation with an LLM")
    s.add_argument("--facts", required=True)
    s.add_argument("--provider", default="gemini")
    s.add_argument("--model")
    s.add_argument(
        "--task", default="Write a 120-word performance summary covering the overall total and the two most notable entities."
    )
    s.add_argument("--rounds", type=int, default=3)
    s.add_argument("--trace")
    s.set_defaults(fn=cmd_generate)

    s = sub.add_parser("eval-llm", help="measure first-draft vs guarded error rates for a real model")
    s.add_argument("--provider", default="gemini")
    s.add_argument("--model")
    s.add_argument("--n", type=int, default=5, help="tasks per dataset")
    s.add_argument("--rounds", type=int, default=3)
    s.add_argument("--out", default="llm_eval.json")
    s.set_defaults(fn=cmd_eval_llm)

    s = sub.add_parser("bench", help="run the synthetic benchmark")
    s.add_argument("--n", type=int, default=200, help="reports per dataset per family")
    s.add_argument("--seed", type=int, default=20260929)
    s.add_argument("--families", default="dev,heldout,heldout2,heldout3")
    s.add_argument("--out")
    s.add_argument("--json")
    s.set_defaults(fn=cmd_bench)

    s = sub.add_parser("challenge", help="score the verifier on a hand-labelled challenge set")
    s.add_argument("--set", default="heldout", help="heldout, original, or a path to a challenge YAML file")
    s.add_argument("--json")
    s.set_defaults(fn=cmd_challenge)

    s = sub.add_parser("demo", help="offline walkthrough on synthetic hotel data")
    s.set_defaults(fn=cmd_demo)

    a = p.parse_args(argv)
    return int(a.fn(a))


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
