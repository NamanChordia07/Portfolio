"""Human-readable output: a terminal summary and a self-contained HTML provenance report."""

from __future__ import annotations

import html

from .facts import FactSheet
from .verify import Report, Status

_COLORS = {Status.SUPPORTED: "ok", Status.CONTRADICTED: "bad", Status.UNVERIFIABLE: "unk"}


def summary(report: Report) -> str:
    c = report.counts
    lines = [
        f"{len(report.verdicts)} claims: {c['supported']} supported, "
        f"{c['contradicted']} contradicted, {c['unverifiable']} unverifiable"
    ]
    for v in report.verdicts:
        if v.status is Status.SUPPORTED:
            continue
        mark = "x" if v.status is Status.CONTRADICTED else "?"
        lines.append(f"  [{mark}] {v.claim.text!r} ({v.reason.value}): {v.message}")
        lines.append(f"      in: {v.claim.sentence.strip()}")
    return "\n".join(lines)


def to_html(report: Report, sheet: FactSheet, title: str = "Proofline report") -> str:
    text = report.text
    spans = sorted(report.verdicts, key=lambda v: v.claim.start)
    parts: list[str] = []
    pos = 0
    for v in spans:
        c = v.claim
        if c.start < pos:
            continue
        parts.append(html.escape(text[pos : c.start]))
        tip = v.message or (f"{v.fact.id} = {v.fact.value:,.4g} ({v.fact.derivation})" if v.fact else "")
        parts.append(
            f'<mark class="{_COLORS[v.status]}" title="{html.escape(tip)}" data-claim="{c.id}">'
            f"{html.escape(text[c.start : c.end])}</mark>"
        )
        pos = c.end
    parts.append(html.escape(text[pos:]))
    body = "".join(parts).replace("\n", "<br>\n")
    rows = "\n".join(
        f"<tr class='{_COLORS[v.status]}'><td>{v.claim.id}</td><td>{html.escape(v.claim.text)}</td>"
        f"<td>{v.status.value}</td><td>{v.reason.value}</td><td>{html.escape(v.fact.id if v.fact else '')}</td>"
        f"<td>{html.escape(v.message)}</td></tr>"
        for v in report.verdicts
    )
    counts = report.counts
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title>
<style>
:root{{--fg:#16181d;--bg:#fbfbfa;--muted:#667;--ok:#d9f2e3;--bad:#fbd9d6;--unk:#f3ecd0;--line:#e4e4e0}}
@media (prefers-color-scheme:dark){{:root{{--fg:#e8e8e6;--bg:#121315;--muted:#99a;--ok:#1d4030;--bad:#5a2320;--unk:#4a4020;--line:#2a2b2e}}}}
body{{font:16px/1.6 ui-sans-serif,system-ui,sans-serif;color:var(--fg);background:var(--bg);max-width:860px;margin:40px auto;padding:0 16px}}
mark{{border-radius:4px;padding:0 3px;color:inherit;cursor:help}} mark.ok{{background:var(--ok)}} mark.bad{{background:var(--bad)}} mark.unk{{background:var(--unk)}}
.doc{{border:1px solid var(--line);border-radius:8px;padding:20px 24px}} table{{border-collapse:collapse;width:100%;font-size:13px;margin-top:24px}}
td,th{{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}} .muted{{color:var(--muted)}}
</style></head><body>
<h1>{html.escape(title)}</h1>
<p class="muted">{sheet.dataset} &middot; period {sheet.period} &middot; {len(report.verdicts)} claims:
{counts["supported"]} supported, {counts["contradicted"]} contradicted, {counts["unverifiable"]} unverifiable</p>
<div class="doc">{body}</div>
<table><thead><tr><th>#</th><th>claim</th><th>status</th><th>reason</th><th>fact</th><th>detail</th></tr></thead>
<tbody>{rows}</tbody></table>
</body></html>
"""
