"""Export real verifier output for the sample reports, plus the benchmark summary, as JSON.

The portfolio website renders this file; nothing in it is hand-written. With --html, also write a
static demo (one page per sample, before and after repair) that needs no server.

    python -m proofline.export_demo ../../src/content/proofline-demo.json --html docs/demo
"""

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from typing import Any

from .facts import DatasetSpec, compute_facts
from .render import to_html
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
    challenge = {}
    for name in ("challenge_first_run", "challenge_heldout_first_run", "challenge_current", "challenge_heldout_current"):
        path = RESULTS / f"{name}.json"
        if path.exists():
            r = json.loads(path.read_text())
            challenge[name] = {
                "cases": r["cases"],
                "passed": r["cases_passed"],
                "claims": r["tokens"],
                "statusAccuracy": r["status_accuracy"],
                **{k: r["flag"][k] for k in ("precision", "recall", "f1", "fp", "fn")},
                "p50ms": r["latency_ms"]["p50"],
            }
    return {"firstRuns": rows, "perType": per_type, "challenge": challenge}


def write_static_demo(out_dir: Path) -> list[Path]:
    """One self-contained HTML page per sample (as written, and after repair), plus an index."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written, items = [], []
    for sample in SAMPLES:
        spec, rows = DATASET_FNS[sample.dataset]()
        sheet = compute_facts(DatasetSpec.from_dict(spec), rows)
        report = verify_text(sample.text, sheet)
        fixed, _ = repair_text(report, sheet)
        after = verify_text(fixed, sheet)
        for suffix, rep, label in (("", report, "as written"), ("-repaired", after, "after repair")):
            path = out_dir / f"{sample.id}{suffix}.html"
            path.write_text(to_html(rep, sheet, title=f"{sample.title} ({label})"), encoding="utf-8")
            written.append(path)
        c = report.counts
        items.append(
            f'<li><a href="{sample.id}.html">{html.escape(sample.title)}</a> &middot; '
            f"{c['supported']} supported, {c['contradicted']} contradicted, {c['unverifiable']} unverifiable "
            f'&middot; <a href="{sample.id}-repaired.html">after repair</a></li>'
        )
    index = out_dir / "index.html"
    index.write_text(
        "<!doctype html><html lang='en'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'><title>Proofline demo</title>"
        "<style>body{font:16px/1.6 ui-sans-serif,system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px}"
        "@media (prefers-color-scheme:dark){body{background:#121315;color:#e8e8e6}a{color:#8fd3bf}}</style></head><body>"
        "<h1>Proofline demo</h1><p>Plausible LLM-written reports over synthetic data, checked by Proofline. "
        "Hover a highlighted number to see the fact it was checked against. Generated by "
        "<code>python -m proofline.export_demo --html docs/demo</code>; nothing here is hand-written.</p>"
        f"<ul>{''.join(items)}</ul></body></html>\n",
        encoding="utf-8",
    )
    return [index, *written]


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="python -m proofline.export_demo")
    p.add_argument("json_out", nargs="?", help="where to write the website's JSON")
    p.add_argument("--html", help="directory for the static demo pages")
    a = p.parse_args(argv)
    if a.json_out:
        out = Path(a.json_out)
        data = {"samples": [_sample(s) for s in SAMPLES], "benchmark": _benchmark()}
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"wrote {out}")
    if a.html:
        pages = write_static_demo(Path(a.html))
        print(f"wrote {len(pages)} pages to {a.html}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
