"""Minimal, deterministic edits that make a contradicted report true.

Repair edits only the tokens that are wrong and keeps the author's style: a wrong
"$1.4M" becomes "$1.2M" (same currency, scale and precision), a wrong "rose" becomes
"fell", a percent that was really percentage points becomes "pts". Claims that are
unverifiable are never rewritten - there is nothing to rewrite them *to*.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from .extract import ClaimKind
from .facts import FactSheet
from .numbers import Unit, format_like
from .verify import Reason, Report, Status, Verdict

_ANTONYMS = {
    "rose": "fell",
    "fell": "rose",
    "rise": "fall",
    "fall": "rise",
    "rises": "falls",
    "falls": "rises",
    "rising": "falling",
    "falling": "rising",
    "risen": "fallen",
    "fallen": "risen",
    "up": "down",
    "down": "up",
    "increased": "decreased",
    "decreased": "increased",
    "increase": "decrease",
    "decrease": "increase",
    "increases": "decreases",
    "decreases": "increases",
    "increasing": "decreasing",
    "decreasing": "increasing",
    "grew": "declined",
    "grow": "decline",
    "grows": "declines",
    "growing": "declining",
    "growth": "decline",
    "declined": "grew",
    "decline": "growth",
    "declines": "grows",
    "declining": "growing",
    "gained": "lost",
    "gain": "loss",
    "gains": "losses",
    "lost": "gained",
    "loss": "gain",
    "climbed": "fell",
    "jumped": "dropped",
    "dropped": "rose",
    "drop": "rise",
    "slipped": "rose",
    "dipped": "rose",
    "higher": "lower",
    "lower": "higher",
    "ahead": "behind",
    "behind": "ahead",
    "above": "below",
    "below": "above",
    "improved": "worsened",
    "worsened": "improved",
    "improvement": "deterioration",
    "better": "worse",
    "worse": "better",
    "surged": "plunged",
    "plunged": "surged",
    "expanded": "contracted",
    "contracted": "expanded",
    "softened": "strengthened",
    "strengthened": "softened",
    "eased": "rose",
    "exceeded": "missed",
    "missed": "beat",
    "beat": "missed",
    "outperformed": "underperformed",
    "trailed": "beat",
    "stronger": "weaker",
    "weaker": "stronger",
    "shrank": "grew",
    "slid": "rose",
    "advanced": "retreated",
    "lifted": "reduced",
    "reduced": "lifted",
    "raised": "lowered",
    "lowered": "raised",
    "boosted": "trimmed",
    "trimmed": "boosted",
    "climbing": "slipping",
    "slipping": "climbing",
}


@dataclass
class Edit:
    start: int
    end: int
    before: str
    after: str
    reason: str


def _match_case(src: str, word: str) -> str:
    if src.isupper():
        return word.upper()
    if src[:1].isupper():
        return word[:1].upper() + word[1:]
    return word


def _direction_edit(text: str, v: Verdict) -> Edit | None:
    span = v.claim.direction_span
    if span is None:
        return None
    word = text[span[0] : span[1]]
    flipped = _ANTONYMS.get(word.lower())
    if not flipped:
        return None
    return Edit(span[0], span[1], word, _match_case(word, flipped), "direction")


def plan_edits(report: Report, sheet: FactSheet) -> list[Edit]:
    edits: list[Edit] = []
    text = report.text
    for v in report.verdicts:
        if v.status is not Status.CONTRADICTED:
            continue
        c = v.claim
        n = c.number
        if v.reason is Reason.WRONG_DIRECTION:
            e = _direction_edit(text, v)
            if e is None and n is not None and n.sign is not None and v.expected is not None:
                e = Edit(c.start, c.end, c.text, format_like(n, v.expected), "sign")
            if e:
                edits.append(e)
            continue
        if n is None or v.expected is None:
            continue
        if v.reason is Reason.UNIT_CONFUSION and v.alternatives and n.unit is Unit.PERCENT:
            # The number was right in points; say so instead of changing the number.
            new = re.sub(r"\s?(?:%|percent|per\s?cent)$", " pts", c.text)
            edits.append(Edit(c.start, c.end, c.text, new, "unit"))
            continue
        if v.reason is Reason.CURRENCY_MISMATCH:
            continue  # needs a human: converting currencies is not a textual fix
        signed = c.kind in (ClaimKind.LEVEL, ClaimKind.BASE) or n.sign is not None
        value = v.expected if signed else abs(v.expected)
        edits.append(Edit(c.start, c.end, c.text, format_like(n, value), v.reason.value))
        # A wrong number may also have the wrong direction ("rose 3%" when it fell 5%).
        if c.kind is ClaimKind.DELTA and c.direction not in (None, 0) and n.sign is None:
            actual = 1 if v.expected > 0 else -1 if v.expected < 0 else 0
            if actual and actual != c.direction:
                e = _direction_edit(text, v)
                if e:
                    edits.append(e)
    # Several claims can share one direction word; apply each span once.
    unique = {(e.start, e.end): e for e in edits}
    return sorted(unique.values(), key=lambda e: e.start)


def apply_edits(text: str, edits: list[Edit]) -> str:
    out = text
    for e in sorted(edits, key=lambda e: e.start, reverse=True):
        out = out[: e.start] + e.after + out[e.end :]
    return out


def repair_text(report: Report, sheet: FactSheet) -> tuple[str, list[Edit]]:
    edits = plan_edits(report, sheet)
    return apply_edits(report.text, edits), edits
