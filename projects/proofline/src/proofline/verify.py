"""Checking claims against the fact sheet and explaining what went wrong.

Every claim gets one of three statuses:

* ``supported``     - a fact with the same metric, entity, kind and basis is inside the
                      interval the wording commits to, and the stated direction agrees.
* ``contradicted``  - the claim is grounded (we know which fact it is about) but wrong.
                      The verifier also diagnoses *how* it is wrong, because the fix differs:
                      a points/percent confusion is fixed by changing the unit, a wrong
                      basis by changing the number, a wrong direction by changing the verb.
* ``unverifiable``  - no fact can be tied to the claim (unknown metric, no comparison data).
                      Never counted as supported: an ungrounded number is a finding too.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from enum import StrEnum

from .extract import Claim, ClaimKind, ExtractOptions, extract_claims
from .facts import Fact, FactKind, FactSheet, MetricType
from .numbers import DEFAULT_POLICY, NumberMention, TolerancePolicy, Unit


class Status(StrEnum):
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    UNVERIFIABLE = "unverifiable"


class Reason(StrEnum):
    OK = "ok"
    WRONG_VALUE = "wrong_value"
    WRONG_DIRECTION = "wrong_direction"
    UNIT_CONFUSION = "unit_confusion"  # percentage points reported as percent, or vice versa
    WRONG_BASIS = "wrong_basis"  # the number is the change vs budget but the text says vs last year
    WRONG_ENTITY = "wrong_entity"  # the number belongs to another property / region
    WRONG_METRIC = "wrong_metric"  # the number belongs to another metric
    SCALE_ERROR = "scale_error"  # thousand vs million, lakh vs crore
    CURRENCY_MISMATCH = "currency_mismatch"
    NO_METRIC = "no_metric"
    NO_MATCHING_FACT = "no_matching_fact"
    AMBIGUOUS = "ambiguous"


@dataclass
class Verdict:
    claim: Claim
    status: Status
    reason: Reason
    fact: Fact | None = None  # supporting fact, or the fact the claim should have matched
    expected: float | None = None
    message: str = ""
    alternatives: list[Fact] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        c = self.claim
        return {
            "claim_id": c.id,
            "text": c.text,
            "span": [c.start, c.end],
            "kind": c.kind.value,
            "metric": c.metric,
            "entity": c.entity,
            "basis": c.basis,
            "direction": c.direction,
            "status": self.status.value,
            "reason": self.reason.value,
            "fact_id": self.fact.id if self.fact else None,
            "expected": self.expected,
            "message": self.message,
            "alternatives": [f.id for f in self.alternatives],
            "notes": c.notes,
        }


@dataclass
class VerifyOptions:
    policy: TolerancePolicy = DEFAULT_POLICY
    diagnose: bool = True
    unit_confusion: bool = True
    flat_pct: float = 1.0  # a relative change under this is "flat"


@dataclass
class Report:
    text: str
    verdicts: list[Verdict]

    @property
    def counts(self) -> dict[str, int]:
        c = Counter(v.status.value for v in self.verdicts)
        return {s.value: c.get(s.value, 0) for s in Status}

    @property
    def contradicted(self) -> list[Verdict]:
        return [v for v in self.verdicts if v.status is Status.CONTRADICTED]

    @property
    def unverifiable(self) -> list[Verdict]:
        return [v for v in self.verdicts if v.status is Status.UNVERIFIABLE]

    @property
    def passed(self) -> bool:
        return not self.contradicted

    @property
    def grounded_ratio(self) -> float:
        return self.counts["supported"] / len(self.verdicts) if self.verdicts else 1.0

    def to_dict(self) -> dict[str, object]:
        return {"passed": self.passed, "counts": self.counts, "verdicts": [v.to_dict() for v in self.verdicts]}


def _sign(x: float, flat_threshold: float = 0.0) -> int:
    if abs(x) <= flat_threshold:
        return 0
    return 1 if x > 0 else -1


def _fmt(v: float, unit: str) -> str:
    if unit == "currency":
        return f"{v:,.2f}"
    if unit in ("percent", "points"):
        return f"{v:.2f}{'%' if unit == 'percent' else ' pts'}"
    return f"{v:,.2f}"


def _target_kinds(claim: Claim, metric_type: MetricType) -> tuple[list[FactKind], list[FactKind]]:
    """(kinds the wording means, kinds a confused writer might have meant)."""
    n = claim.number
    assert n is not None
    if claim.kind is ClaimKind.LEVEL:
        return [FactKind.LEVEL], []
    if claim.kind is ClaimKind.BASE:
        return [FactKind.BASE], []
    # DELTA
    if n.unit is Unit.PERCENT:
        if metric_type is MetricType.RATE:
            return [FactKind.DELTA_PCT], [FactKind.DELTA_ABS]
        return [FactKind.DELTA_PCT], []
    if n.unit in (Unit.POINTS, Unit.BPS):
        return [FactKind.DELTA_ABS], [FactKind.DELTA_PCT]
    return [FactKind.DELTA_ABS], []


def _admits(n: NumberMention, fact: Fact, policy: TolerancePolicy, signed: bool) -> bool:
    target = fact.value if signed else abs(fact.value)
    if signed and n.sign == -1:
        return n.admits(-target, policy)
    return n.admits(target, policy)


def verify_claim(claim: Claim, sheet: FactSheet, opts: VerifyOptions | None = None) -> Verdict:
    o = opts or VerifyOptions()
    if claim.metric is None:
        return Verdict(claim, Status.UNVERIFIABLE, Reason.NO_METRIC, message="no metric could be attributed to this number")
    metric = sheet.metrics.get(claim.metric)
    if metric is None:
        return Verdict(claim, Status.UNVERIFIABLE, Reason.NO_METRIC, message=f"metric {claim.metric!r} is not in the data")
    entity = claim.entity or sheet.total_entity
    bases: list[str | None] = [claim.basis] if claim.basis else [*sheet.bases] or [None]

    if claim.kind is ClaimKind.DIRECTION:
        return _verify_direction(claim, sheet, entity, bases, o)

    n = claim.number
    assert n is not None
    if n.currency and n.currency != sheet.currency and metric.type is MetricType.CURRENCY:
        fact = next(iter(sheet.find(claim.metric, entity, FactKind.LEVEL)), None)
        return Verdict(
            claim,
            Status.CONTRADICTED,
            Reason.CURRENCY_MISMATCH,
            fact=fact,
            message=f"written in {n.currency} but the data is in {sheet.currency}",
        )

    kinds, confusable = _target_kinds(claim, metric.type)
    signed = claim.kind in (ClaimKind.LEVEL, ClaimKind.BASE)
    candidates = [
        f for k in kinds for b in bases for f in sheet.find(claim.metric, entity, k, b if k is not FactKind.LEVEL else None)
    ]
    # LEVEL facts have no basis; de-duplicate.
    candidates = list({f.id: f for f in candidates}.values())
    if not candidates:
        what = f"{claim.kind.value} of {claim.metric} for {entity}" + (f" vs {claim.basis}" if claim.basis else "")
        return Verdict(claim, Status.UNVERIFIABLE, Reason.NO_MATCHING_FACT, message=f"no fact for {what}")

    for f in candidates:
        if _admits(n, f, o.policy, signed):
            if claim.kind is ClaimKind.DELTA and claim.direction is not None:
                actual = _sign(f.value, 1e-12)
                if claim.direction == 0 or (actual != 0 and actual != claim.direction):
                    if claim.direction == 0 and _is_flat(sheet, f, o):
                        return Verdict(claim, Status.SUPPORTED, Reason.OK, fact=f, expected=f.value)
                    return Verdict(
                        claim,
                        Status.CONTRADICTED,
                        Reason.WRONG_DIRECTION,
                        fact=f,
                        expected=f.value,
                        message=f"says {'up' if claim.direction > 0 else 'down' if claim.direction < 0 else 'flat'}, "
                        f"but {f.id} is {_fmt(f.value, f.unit)}",
                    )
            return Verdict(claim, Status.SUPPORTED, Reason.OK, fact=f, expected=f.value)

    # Not supported: pick the fact the sentence is about, then work out how it went wrong.
    primary = candidates[0]
    wrong = Verdict(
        claim,
        Status.CONTRADICTED,
        Reason.WRONG_VALUE,
        fact=primary,
        expected=primary.value,
        message=f"{n.text} does not match {primary.id} = {_fmt(primary.value, primary.unit)}",
    )
    if claim.basis is None and len({f.basis for f in candidates}) > 1:
        wrong.message += " (no comparison basis stated; checked all)"
    if not o.diagnose:
        return wrong

    def matches(facts: list[Fact]) -> list[Fact]:
        return [f for f in facts if _admits(n, f, o.policy, signed)]

    if o.unit_confusion and confusable:
        alt = matches([f for k in confusable for b in bases for f in sheet.find(claim.metric, entity, k, b)])
        if alt:
            wrong.reason = Reason.UNIT_CONFUSION
            wrong.alternatives = alt
            meant = "the change in percentage points" if alt[0].unit == "points" else "the relative (percent) change"
            wrong.message = f"{n.text} matches {meant} ({alt[0].id}); as written it should be {_fmt(primary.value, primary.unit)}"
            return wrong

    for factor in (1e3, 1e-3, 1e6, 1e-6, 100.0, 0.01, 10.0, 0.1):  # K/M, lakh/crore and digit-shift slips
        for f in candidates:
            if f.value != 0 and n.admits(abs(f.value) * factor, o.policy):
                wrong.reason = Reason.SCALE_ERROR
                wrong.message = f"{n.text} is off by a factor of {1 / factor:g} from {f.id} = {_fmt(f.value, f.unit)}"
                return wrong

    if claim.basis is not None:
        other_bases = [b for b in sheet.bases if b != claim.basis]
        alt = matches([f for k in kinds for b in other_bases for f in sheet.find(claim.metric, entity, k, b)])
        if alt:
            wrong.reason = Reason.WRONG_BASIS
            wrong.alternatives = alt
            wrong.message = (
                f"{n.text} matches {alt[0].id}, not the stated basis ({primary.id} = {_fmt(primary.value, primary.unit)})"
            )
            return wrong

    other_entities = [e for e in sheet.entities if e != entity]
    alt = matches(
        [
            f
            for e in other_entities
            for k in kinds
            for b in bases
            for f in sheet.find(claim.metric, e, k, b if k is not FactKind.LEVEL else None)
        ]
    )
    if alt:
        wrong.reason = Reason.WRONG_ENTITY
        wrong.alternatives = alt
        wrong.message = f"{n.text} is the figure for {sheet.entities[alt[0].entity].name}, not {sheet.entities[entity].name}"
        return wrong

    other_metrics = [m for m in sheet.metrics if m != claim.metric]
    alt = matches(
        [
            f
            for m in other_metrics
            for k in kinds
            for b in bases
            for f in sheet.find(m, entity, k, b if k is not FactKind.LEVEL else None)
        ]
    )
    if alt:
        wrong.reason = Reason.WRONG_METRIC
        wrong.alternatives = alt
        wrong.message = f"{n.text} is {sheet.metrics[alt[0].metric].label}, not {metric.label}"
        return wrong

    if claim.kind is ClaimKind.DELTA and claim.direction is not None:
        actual = _sign(primary.value, 1e-12)
        if actual != 0 and actual != claim.direction and claim.direction != 0:
            wrong.message += "; the direction is also wrong"
    return wrong


def _is_flat(sheet: FactSheet, fact: Fact, o: VerifyOptions) -> bool:
    pct = sheet.get(fact.id.replace(f":{fact.kind.value}:", ":delta_pct:"))
    if pct is not None:
        return abs(pct.value) < o.flat_pct
    return abs(fact.value) < 1e-9


def _verify_direction(claim: Claim, sheet: FactSheet, entity: str, bases: list[str | None], o: VerifyOptions) -> Verdict:
    assert claim.metric is not None
    deltas = [f for b in bases for f in sheet.find(claim.metric, entity, FactKind.DELTA_ABS, b)]
    if not deltas:
        return Verdict(claim, Status.UNVERIFIABLE, Reason.NO_MATCHING_FACT, message="no comparison data for this direction")
    outcomes = []
    for f in deltas:
        flat = _is_flat(sheet, f, o)
        actual = 0 if flat else _sign(f.value)
        ok = actual == claim.direction or (claim.direction != 0 and flat and _sign(f.value) == claim.direction)
        outcomes.append((ok, f))
    if all(ok for ok, _ in outcomes):
        return Verdict(claim, Status.SUPPORTED, Reason.OK, fact=outcomes[0][1], expected=outcomes[0][1].value)
    if not any(ok for ok, _ in outcomes):
        f = outcomes[0][1]
        word = {1: "up", -1: "down", 0: "flat"}[claim.direction or 0]
        return Verdict(
            claim,
            Status.CONTRADICTED,
            Reason.WRONG_DIRECTION,
            fact=f,
            expected=f.value,
            message=f"says {word}, but {f.id} is {_fmt(f.value, f.unit)}",
        )
    return Verdict(
        claim,
        Status.UNVERIFIABLE,
        Reason.AMBIGUOUS,
        alternatives=[f for _, f in outcomes],
        message="direction depends on the comparison basis, which is not stated",
    )


def verify_text(
    text: str,
    sheet: FactSheet,
    options: VerifyOptions | None = None,
    extract_options: ExtractOptions | None = None,
) -> Report:
    claims = extract_claims(text, sheet, extract_options)
    return Report(text, [verify_claim(c, sheet, options) for c in claims])
