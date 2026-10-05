"""Score the verifier against the hand-labelled challenge set (benchmarks/challenge.yaml).

For each expected token the verifier must produce a claim with the expected status (and, where
given, the expected diagnosis). Claims it produces that the case does not expect count as
spurious. The binary view treats "should be flagged" (contradicted or unverifiable) as the
positive class, which is what matters when Proofline gates a report.
"""

from __future__ import annotations

import statistics
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ..facts import DatasetSpec, FactSheet, compute_facts
from ..verify import Verdict, VerifyOptions, verify_text
from .datasets import DATASETS

BENCHMARKS = Path(__file__).resolve().parents[3] / "benchmarks"
DEFAULT_PATH = BENCHMARKS / "challenge.yaml"
CHALLENGE_SETS = {"original": DEFAULT_PATH, "heldout": BENCHMARKS / "challenge_heldout.yaml"}


@dataclass
class TokenResult:
    token: str
    expected_status: str
    expected_reason: str | None
    got_status: str  # supported | contradicted | unverifiable | missed
    got_reason: str | None
    message: str = ""

    @property
    def status_ok(self) -> bool:
        return self.got_status == self.expected_status

    @property
    def ok(self) -> bool:
        return self.status_ok and (self.expected_reason is None or self.expected_reason == self.got_reason)


@dataclass
class CaseResult:
    id: str
    category: str
    text: str
    tokens: list[TokenResult]
    spurious: list[str] = field(default_factory=list)
    ms: float = 0.0

    @property
    def passed(self) -> bool:
        return all(t.ok for t in self.tokens) and not self.spurious


def load_cases(path: Path = DEFAULT_PATH) -> list[dict[str, Any]]:
    import yaml

    return list(yaml.safe_load(path.read_text(encoding="utf-8")))


def _sheets() -> dict[str, FactSheet]:
    out = {}
    for name, fn in DATASETS.items():
        spec, rows = fn()
        out[name] = compute_facts(DatasetSpec.from_dict(spec), rows)
    return out


def score_case(case: dict[str, Any], sheet: FactSheet, options: VerifyOptions | None = None) -> CaseResult:
    started = time.perf_counter()
    report = verify_text(case["text"], sheet, options)
    ms = (time.perf_counter() - started) * 1000
    unused: list[Verdict] = list(report.verdicts)
    tokens = []
    for exp in case.get("expect") or []:
        match = next((v for v in unused if v.claim.text == exp["token"]), None)
        if match is None:
            tokens.append(TokenResult(exp["token"], exp["status"], exp.get("reason"), "missed", None))
            continue
        unused.remove(match)
        tokens.append(
            TokenResult(exp["token"], exp["status"], exp.get("reason"), match.status.value, match.reason.value, match.message)
        )
    return CaseResult(case["id"], case["category"], case["text"], tokens, [v.claim.text for v in unused], ms)


def run_challenge(path: Path = DEFAULT_PATH, options: VerifyOptions | None = None) -> dict[str, Any]:
    sheets = _sheets()
    cases = load_cases(path)
    results = [score_case(c, sheets[c["dataset"]], options) for c in cases]

    tokens = [t for r in results for t in r.tokens]
    confusion: Counter[tuple[str, str]] = Counter((t.expected_status, t.got_status) for t in tokens)
    tp = sum(1 for t in tokens if t.expected_status != "supported" and t.got_status in ("contradicted", "unverifiable"))
    fn = sum(1 for t in tokens if t.expected_status != "supported" and t.got_status not in ("contradicted", "unverifiable"))
    fp = sum(1 for t in tokens if t.expected_status == "supported" and t.got_status in ("contradicted", "unverifiable"))
    tn = sum(1 for t in tokens if t.expected_status == "supported" and t.got_status == "supported")
    precision = tp / (tp + fp) if tp + fp else 1.0
    recall = tp / (tp + fn) if tp + fn else 1.0
    with_reason = [t for t in tokens if t.expected_reason and t.status_ok]

    by_cat: dict[str, list[CaseResult]] = defaultdict(list)
    for r in results:
        by_cat[r.category].append(r)
    latencies = sorted(r.ms for r in results)

    return {
        "cases": len(results),
        "cases_passed": sum(r.passed for r in results),
        "tokens": len(tokens),
        "status_accuracy": round(sum(t.status_ok for t in tokens) / max(1, len(tokens)), 4),
        "reason_accuracy": round(sum(t.ok for t in with_reason) / max(1, len(with_reason)), 4),
        "missed": sum(t.got_status == "missed" for t in tokens),
        "spurious": sum(len(r.spurious) for r in results),
        "flag": {
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "tn": tn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(2 * precision * recall / (precision + recall), 4) if precision + recall else 0.0,
            "accuracy": round((tp + tn) / max(1, tp + tn + fp + fn), 4),
        },
        "confusion": {f"{e}->{g}": n for (e, g), n in sorted(confusion.items())},
        "latency_ms": {
            "p50": round(statistics.median(latencies), 3),
            "p95": round(latencies[int(0.95 * (len(latencies) - 1))], 3),
            "max": round(latencies[-1], 3),
        },
        "categories": {cat: {"cases": len(rs), "passed": sum(r.passed for r in rs)} for cat, rs in sorted(by_cat.items())},
        "failures": [
            {
                "id": r.id,
                "text": r.text,
                "tokens": [
                    {
                        "token": t.token,
                        "expected": f"{t.expected_status}{'/' + t.expected_reason if t.expected_reason else ''}",
                        "got": f"{t.got_status}{'/' + t.got_reason if t.got_reason else ''}",
                        "message": t.message,
                    }
                    for t in r.tokens
                    if not t.ok
                ],
                "spurious": r.spurious,
            }
            for r in results
            if not r.passed
        ],
    }


def to_markdown(res: dict[str, Any]) -> str:
    f = res["flag"]
    lines = [
        f"**{res['cases_passed']}/{res['cases']} cases pass** ({res['tokens']} labelled claims). "
        f"Status accuracy {res['status_accuracy']:.1%}; diagnosis accuracy {res['reason_accuracy']:.1%} "
        f"(where a reason is labelled); {res['missed']} missed, {res['spurious']} spurious.",
        "",
        f"Flagging (contradicted or unverifiable) as a binary decision: precision {f['precision']:.1%}, recall {f['recall']:.1%}, "
        f"F1 {f['f1']:.3f}, accuracy {f['accuracy']:.1%} (TP {f['tp']}, FP {f['fp']}, FN {f['fn']}, TN {f['tn']}).",
        "",
        f"Latency per case: p50 {res['latency_ms']['p50']:.2f} ms, p95 {res['latency_ms']['p95']:.2f} ms.",
        "",
        "| category | cases passed |",
        "|---|---|",
    ]
    lines += [f"| {cat} | {v['passed']}/{v['cases']} |" for cat, v in res["categories"].items()]
    if res["failures"]:
        lines += ["", "Failures:", ""]
        for fl in res["failures"]:
            detail = "; ".join(f"`{t['token']}` expected {t['expected']}, got {t['got']}" for t in fl["tokens"])
            if fl["spurious"]:
                detail += ("; " if detail else "") + f"spurious: {', '.join(fl['spurious'])}"
            lines.append(f'- `{fl["id"]}` "{fl["text"]}": {detail}')
    return "\n".join(lines)
