"""Benchmark: how well does the verifier catch wrong numbers without crying wolf?

Measured per number (slot) and per report, across three synthetic domains and two
template families, for the full system, three ablations and a naive baseline:

* ``proofline``        - the full verifier.
* ``fixed_tolerance``  - ablation: accept any value within +/-1% (no display-precision semantics).
* ``no_context``       - ablation: no carry-over of metric/entity/basis across clauses and sentences.
* ``no_basis``         - ablation: ignore comparison-basis phrases (any basis may match).
* ``naive_lookup``     - baseline: flag a number only if it appears nowhere in the fact table.
                         This is what "check the numbers exist in the data" amounts to.
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from ..extract import ExtractOptions
from ..facts import DatasetSpec, FactSheet, compute_facts
from ..numbers import TolerancePolicy, iter_numbers
from ..repair import Edit, repair_text
from ..verify import Reason, Status, Verdict, VerifyOptions, verify_text
from .datasets import DATASETS
from .generate import ERROR_TYPES, GeneratedReport, ReportGenerator, Slot, slot_in_error

EXPECTED_REASON = {
    "wrong_value": {Reason.WRONG_VALUE},
    "rounding_drift": {Reason.WRONG_VALUE},
    "wrong_direction": {Reason.WRONG_DIRECTION},
    "unit_confusion": {Reason.UNIT_CONFUSION},
    "wrong_basis": {Reason.WRONG_BASIS},
    "wrong_entity": {Reason.WRONG_ENTITY},
    "wrong_metric": {Reason.WRONG_METRIC},
    "scale_error": {Reason.SCALE_ERROR},
    "fabricated": set(Reason),
}


@dataclass
class Config:
    name: str
    verify: VerifyOptions = field(default_factory=VerifyOptions)
    extract: ExtractOptions = field(default_factory=ExtractOptions)


CONFIGS = [
    Config("proofline"),
    Config("fixed_tolerance", verify=VerifyOptions(policy=TolerancePolicy(fixed_rel=0.01))),
    Config("no_context", extract=ExtractOptions(carry_context=False)),
    Config("no_basis", extract=ExtractOptions(use_basis=False)),
]


def _overlaps(a: tuple[int, int], b: tuple[int, int]) -> bool:
    return a[0] < b[1] and b[0] < a[1]


@dataclass
class SlotOutcome:
    label: str
    status: str  # supported | contradicted | unverifiable | missed
    reason: str | None


def _slot_outcomes(report: GeneratedReport, verdicts: list[Verdict]) -> tuple[list[SlotOutcome], int]:
    outcomes = []
    matched: set[int] = set()
    for s in report.slots:
        hits = [v for v in verdicts if _overlaps((v.claim.start, v.claim.end), (s.start, s.end))]
        if s.dir_span and s.sem != "DIR":
            # A wrong verb may be flagged at the verb itself ("rising to $464K (-$17K vs last week)").
            hits += [
                v for v in verdicts if v.claim.kind.value == "direction" and _overlaps((v.claim.start, v.claim.end), s.dir_span)
            ]
        if s.sem == "DIR":
            hits = [v for v in verdicts if v.claim.start == s.start] or hits
        for v in hits:
            matched.add(v.claim.id)
        if not hits:
            outcomes.append(SlotOutcome(s.label, "missed", None))
            continue
        worst = min(hits, key=lambda v: {Status.CONTRADICTED: 0, Status.UNVERIFIABLE: 1, Status.SUPPORTED: 2}[v.status])
        outcomes.append(SlotOutcome(s.label, worst.status.value, worst.reason.value))
    spurious = sum(1 for v in verdicts if v.claim.id not in matched and v.status is Status.CONTRADICTED)
    return outcomes, spurious


def _naive_outcomes(report: GeneratedReport, sheet: FactSheet) -> tuple[list[SlotOutcome], int]:
    values = [abs(f.value) for f in sheet.facts]
    flagged_spans = []
    for n in iter_numbers(report.text):
        if not any(n.admits(v) for v in values):
            flagged_spans.append((n.start, n.end))
    outcomes = []
    for s in report.slots:
        if s.sem == "DIR":
            outcomes.append(SlotOutcome(s.label, "supported", None))  # a lookup cannot check a verb
            continue
        hit = any(_overlaps(sp, (s.start, s.end)) for sp in flagged_spans)
        outcomes.append(SlotOutcome(s.label, "contradicted" if hit else "supported", None))
    return outcomes, 0


def _map_span(span: tuple[int, int], edits: list[Edit]) -> tuple[int, int]:
    shift = 0
    for e in sorted(edits, key=lambda e: e.start):
        if e.end <= span[0]:
            shift += len(e.after) - (e.end - e.start)
        elif _overlaps((e.start, e.end), span):
            start = span[0] + shift
            return start, start + len(e.after) + (span[1] - e.end if span[1] > e.end else 0)
    return span[0] + shift, span[1] + shift


def _repair_outcome(report: GeneratedReport, sheet: FactSheet, cfg: Config) -> tuple[int, int, int]:
    """(error slots fixed, repairable error slots, clean slots broken by repair)."""
    rep = verify_text(report.text, sheet, cfg.verify, cfg.extract)
    fixed_text, edits = repair_text(rep, sheet)
    fixed = total = broken = 0
    for s in report.slots:
        if s.sem == "FAB":
            continue
        new = Slot(
            s.sem,
            *_map_span((s.start, s.end), edits),
            s.metric,
            s.entity,
            s.basis,
            _map_span(s.dir_span, edits) if s.dir_span else None,
            s.label,
        )
        still_wrong = slot_in_error(sheet, new, fixed_text)
        if s.label != "clean":
            total += 1
            fixed += not still_wrong
        elif still_wrong:
            broken += 1
    return fixed, total, broken


def evaluate(reports: list[tuple[GeneratedReport, FactSheet]], cfg: Config | None, naive: bool = False) -> dict[str, Any]:
    by_label: dict[str, Counter[str]] = defaultdict(Counter)
    type_ok: Counter[str] = Counter()
    type_total: Counter[str] = Counter()
    spurious_total = 0
    contradicted_flags = contradicted_on_errors = 0
    clean_reports = clean_passed = corrupt_reports = corrupt_detected = 0
    for report, sheet in reports:
        if naive:
            outcomes, spurious = _naive_outcomes(report, sheet)
        else:
            assert cfg is not None
            rep = verify_text(report.text, sheet, cfg.verify, cfg.extract)
            outcomes, spurious = _slot_outcomes(report, rep.verdicts)
        spurious_total += spurious
        for o in outcomes:
            by_label[o.label][o.status] += 1
            if o.status == "contradicted":
                contradicted_flags += 1
                contradicted_on_errors += o.label != "clean"
            if o.label != "clean" and o.status == "contradicted" and o.reason is not None:
                type_total[o.label] += 1
                type_ok[o.label] += Reason(o.reason) in EXPECTED_REASON.get(o.label, set())
        flagged = [o for o in outcomes if o.status in ("contradicted", "unverifiable")]
        if report.corrupted:
            corrupt_reports += 1
            corrupt_detected += any(o.label != "clean" for o in flagged)
        else:
            clean_reports += 1
            clean_passed += not any(o.status == "contradicted" for o in outcomes) and spurious == 0
    contradicted_flags += spurious_total

    clean = by_label.get("clean", Counter())
    n_clean = sum(clean.values())
    errors = {k: v for k, v in by_label.items() if k != "clean"}
    n_err = sum(sum(c.values()) for c in errors.values())
    detected = sum(c["contradicted"] + c["unverifiable"] for c in errors.values())
    per_type = {
        k: {
            "n": sum(c.values()),
            "detected": round((c["contradicted"] + c["unverifiable"]) / max(1, sum(c.values())), 4),
            "contradicted": round(c["contradicted"] / max(1, sum(c.values())), 4),
            "diagnosis_accuracy": round(type_ok[k] / type_total[k], 4) if type_total[k] else None,
        }
        for k, c in sorted(errors.items(), key=lambda kv: ERROR_TYPES.index(kv[0]) if kv[0] in ERROR_TYPES else 99)
    }
    return {
        "slots": n_clean + n_err,
        "error_slots": n_err,
        "error_recall": round(detected / max(1, n_err), 4),
        "error_recall_contradicted": round(sum(c["contradicted"] for c in errors.values()) / max(1, n_err), 4),
        "false_alarm_rate": round((clean["contradicted"] + spurious_total) / max(1, n_clean), 4),
        "clean_supported_rate": round(clean["supported"] / max(1, n_clean), 4),
        "clean_unverifiable_rate": round(clean["unverifiable"] / max(1, n_clean), 4),
        "clean_missed_rate": round(clean["missed"] / max(1, n_clean), 4),
        "flag_precision": round(contradicted_on_errors / max(1, contradicted_flags), 4),
        "clean_report_pass_rate": round(clean_passed / max(1, clean_reports), 4),
        "corrupt_report_detection_rate": round(corrupt_detected / max(1, corrupt_reports), 4),
        "reports": {"clean": clean_reports, "corrupted": corrupt_reports},
        "per_type": per_type,
    }


def build_corpus(n_per_dataset: int, family: str, seed: int) -> list[tuple[GeneratedReport, FactSheet]]:
    corpus: list[tuple[GeneratedReport, FactSheet]] = []
    for i, (_name, fn) in enumerate(sorted(DATASETS.items())):
        spec, rows = fn()
        sheet = compute_facts(DatasetSpec.from_dict(spec), rows)
        gen = ReportGenerator(sheet, family=family, seed=seed * 1000 + i)
        corpus.extend((gen.generate(), sheet) for _ in range(n_per_dataset))
    return corpus


def run(
    n_per_dataset: int = 200,
    seed: int = 20260929,
    families: tuple[str, ...] = ("dev", "heldout", "heldout2", "heldout3"),
    progress: Callable[[str], None] | None = None,
) -> dict[str, Any]:
    results: dict[str, Any] = {"n_per_dataset": n_per_dataset, "seed": seed, "families": {}}
    for family in families:
        corpus = build_corpus(n_per_dataset, family, seed)
        fam: dict[str, Any] = {}
        for cfg in CONFIGS:
            if progress:
                progress(f"{family}: {cfg.name}")
            fam[cfg.name] = evaluate(corpus, cfg)
        fam["naive_lookup"] = evaluate(corpus, None, naive=True)
        fixed = total = broken = 0
        n_clean_slots = 0
        for report, sheet in corpus:
            if report.corrupted:
                f, t, b = _repair_outcome(report, sheet, CONFIGS[0])
                fixed, total, broken = fixed + f, total + t, broken + b
                n_clean_slots += sum(1 for s in report.slots if s.label == "clean")
        fam["repair"] = {
            "error_slots_fixed": round(fixed / max(1, total), 4),
            "clean_slots_broken": round(broken / max(1, n_clean_slots), 4),
            "repairable_error_slots": total,
        }
        results["families"][family] = fam
    return results


def to_markdown(results: dict[str, Any]) -> str:
    lines = [
        "# Benchmark results",
        "",
        f"Generated by `proofline bench --n {results['n_per_dataset']} --seed {results['seed']}`. "
        "Synthetic reports over three domains (hotel weekly, retail monthly in INR, SaaS monthly); "
        "numbers are labelled by an independent ground-truth check, not by the verifier.",
        "",
    ]
    for family, fam in results["families"].items():
        main = fam["proofline"]
        lines += [
            f"## Template family: `{family}`",
            "",
            f"{main['slots']} number/direction claims in {sum(main['reports'].values())} reports "
            f"({main['reports']['corrupted']} with injected errors, {main['error_slots']} erroneous claims).",
            "",
            "| system | error recall | false-alarm rate | flag precision | clean reports passing | corrupted reports caught |",
            "|---|---|---|---|---|---|",
        ]
        for name in ("proofline", "fixed_tolerance", "no_context", "no_basis", "naive_lookup"):
            r = fam[name]
            lines.append(
                f"| {name} | {r['error_recall']:.1%} | {r['false_alarm_rate']:.2%} | {r['flag_precision']:.1%} | "
                f"{r['clean_report_pass_rate']:.1%} | {r['corrupt_report_detection_rate']:.1%} |"
            )
        lines += [
            "",
            f"Clean claims: {main['clean_supported_rate']:.1%} verified as supported, "
            f"{main['clean_unverifiable_rate']:.1%} left unverifiable, {main['clean_missed_rate']:.1%} not extracted.",
            "",
            "| error type | n | detected | diagnosed correctly | naive lookup detected |",
            "|---|---|---|---|---|",
        ]
        for k, v in main["per_type"].items():
            naive = fam["naive_lookup"]["per_type"].get(k, {}).get("detected", 0)
            diag = "-" if v["diagnosis_accuracy"] is None else f"{v['diagnosis_accuracy']:.0%}"
            lines.append(f"| {k} | {v['n']} | {v['detected']:.1%} | {diag} | {naive:.1%} |")
        rp = fam["repair"]
        lines += [
            "",
            f"Deterministic repair fixed {rp['error_slots_fixed']:.1%} of {rp['repairable_error_slots']} erroneous claims "
            f"and changed {rp['clean_slots_broken']:.2%} of correct claims into incorrect ones.",
            "",
        ]
    return "\n".join(lines)


def dump(results: dict[str, Any]) -> str:
    return json.dumps(results, indent=2)
