"""Measure a real model: how often is its first draft wrong, and does the guarded loop fix it?

This is the experiment the synthetic benchmark cannot run. It needs an API key and costs
money, so it is a separate command (``proofline eval-llm``) and its numbers are only ever
reported from an actual run.
"""

from __future__ import annotations

import statistics
import time
from typing import Any

from .bench.datasets import DATASETS
from .facts import DatasetSpec, compute_facts
from .loop import guarded_generate
from .providers.base import Provider

TASKS = [
    "Write a 120-word performance summary covering the overall total and the two most notable entities.",
    "Write three short paragraphs: the overall picture, the strongest entity, and the weakest entity vs budget.",
    "Summarise performance versus last year and versus budget for every entity, one sentence each.",
    "Write an executive summary (under 100 words) highlighting the biggest positive and negative changes.",
    "Explain what drove the overall result this period, citing the relevant metrics for each entity.",
]


def run_llm_eval(provider: Provider, n_tasks: int = 5, max_rounds: int = 3) -> dict[str, Any]:
    runs: list[dict[str, Any]] = []
    for name, fn in sorted(DATASETS.items()):
        spec, rows = fn()
        sheet = compute_facts(DatasetSpec.from_dict(spec), rows)
        for task in TASKS[:n_tasks]:
            started = time.perf_counter()
            result = guarded_generate(provider, sheet, task, max_rounds=max_rounds)
            first = result.rounds[0]
            runs.append(
                {
                    "dataset": name,
                    "task": task,
                    "first_draft": first.counts,
                    "final": result.report.counts,
                    "passed": result.passed,
                    "rounds": len([r for r in result.rounds if r.completion is not None]),
                    "repaired": bool(result.edits),
                    "input_tokens": sum(r.completion.input_tokens for r in result.rounds if r.completion),
                    "output_tokens": sum(r.completion.output_tokens for r in result.rounds if r.completion),
                    "seconds": round(time.perf_counter() - started, 2),
                    "first_draft_problems": first.problems,
                }
            )

    def rate(key: str, stage: str) -> float:
        claims = sum(sum(r[stage].values()) for r in runs)
        return round(float(sum(r[stage][key] for r in runs)) / max(1, claims), 4)

    summary = {
        "model": provider.model,
        "reports": len(runs),
        "first_draft_contradicted_claim_rate": rate("contradicted", "first_draft"),
        "first_draft_unverifiable_claim_rate": rate("unverifiable", "first_draft"),
        "first_drafts_with_any_contradiction": round(
            sum(r["first_draft"]["contradicted"] > 0 for r in runs) / max(1, len(runs)), 4
        ),
        "final_contradicted_claim_rate": rate("contradicted", "final"),
        "final_pass_rate": round(sum(r["passed"] for r in runs) / max(1, len(runs)), 4),
        "mean_llm_calls": round(statistics.mean(r["rounds"] for r in runs), 2) if runs else 0,
        "needed_deterministic_repair": sum(r["repaired"] for r in runs),
        "mean_tokens_per_report": round(statistics.mean(r["input_tokens"] + r["output_tokens"] for r in runs)) if runs else 0,
    }
    return {"summary": summary, "runs": runs}
