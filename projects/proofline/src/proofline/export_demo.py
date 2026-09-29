"""Export real verifier output for the sample reports, plus the benchmark summary, as JSON.

The portfolio website renders this file; nothing in it is hand-written.

    python -m proofline.export_demo ../../src/content/proofline-demo.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from .facts import DatasetSpec, compute_facts
from .repair import repair_text
from .samples import DATASET_FNS, SAMPLES
from .verify import verify_text

RESULTS = Path(__file__).resolve().parents[2] / "docs" / "results"


def _sample(sample: Any) -> dict[str, Any]:
    spec, rows = DATASET_FNS[sample.dataset]()
    sheet = compute_facts(DatasetSpec.from_dict(spec), rows)
    report = verify_text(sample.text, sheet)
    fixed, edits = repair_text(report, sheet)
    after = verify_text(fixed, sheet)
    return {
        "id": sample.id,
        "title": sample.title,
        "dataset": sheet.dataset,
        "period": sheet.period,
        "currency": sheet.currency,
        "facts": len(sheet.facts),
        "text": sample.text,
        "counts": report.counts,
        "claims": [
            {
                "start": v.claim.start,
                "end": v.claim.end,
                "text": v.claim.text,
                "kind": v.claim.kind.value,
                "metric": v.claim.metric,
                "entity": v.claim.entity,
                "basis": v.claim.basis,
                "status": v.status.value,
                "reason": v.reason.value,
                "message": v.message,
                "factId": v.fact.id if v.fact else None,
                "derivation": v.fact.derivation if v.fact else None,
            }
            for v in report.verdicts
        ],
        "repaired": {
            "text": fixed,
            "edits": [{"start": e.start, "end": e.end, "before": e.before, "after": e.after, "reason": e.reason} for e in edits],
            "counts": after.counts,
        },
    }


def _benchmark() -> dict[str, Any]:
    first = {
        "heldout": json.loads((RESULTS / "heldout_first_run.json").read_text()),
        "heldout2": json.loads((RESULTS / "heldout2_first_run.json").read_text()),
        "heldout3": json.loads((RESULTS / "heldout3_first_run_corrected_labels.json").read_text()),
    }
    systems = ["proofline", "fixed_tolerance", "no_context", "no_basis", "naive_lookup"]
    rows = []
    for family, res in first.items():
        for system in systems:
            r = res[system]
            rows.append(
                {
                    "family": family,
                    "system": system,
                    "claims": r["slots"],
                    "errors": r["error_slots"],
                    "recall": r["error_recall"],
                    "falseAlarms": r["false_alarm_rate"],
                    "precision": r["flag_precision"],
                    "cleanReportsPass": r["clean_report_pass_rate"],
                    "unverifiableClean": r["clean_unverifiable_rate"],
                }
            )
    current = json.loads((RESULTS / "current.json").read_text())
    per_type = []
    for family, fam in current["families"].items():
        for kind, v in fam["proofline"]["per_type"].items():
            naive = fam["naive_lookup"]["per_type"].get(kind, {})
            per_type.append(
                {"family": family, "type": kind, "n": v["n"], "detected": v["detected"], "naive": naive.get("detected", 0)}
            )
    return {"firstRuns": rows, "perType": per_type}


def main(argv: list[str] | None = None) -> int:
    out = Path((argv or sys.argv[1:])[0])
    data = {"samples": [_sample(s) for s in SAMPLES], "benchmark": _benchmark()}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
