"""Synthetic reports with known ground truth, and controlled error injection.

Each sentence is built from a *plan*: which metric, entity and comparison basis it is
about, which template phrases it, and which facts its numbers display. Corruptions edit
the plan the way an LLM gets things wrong (the right number attached to the wrong entity,
a points change written as percent, a flipped verb, ...). Labels are then computed by an
independent check of every displayed number against the facts for the attributes the
sentence *states*, so a corruption that happens to be harmless is labelled clean.

Two template families exist: ``dev`` (used while building the extractor) and ``heldout``
(written afterwards in a more verbose, LLM-like voice and never used for tuning).
"""

from __future__ import annotations

import random
import re
from collections.abc import Callable
from dataclasses import dataclass, field

from ..facts import BasisSpec, EntitySpec, FactSheet, MetricSpec, MetricType
from ..numbers import Unit, iter_numbers

# --- templates ------------------------------------------------------------------------

DEV_TEMPLATES = [
    "{Es} {m} {verb} {DA} to {L} {B}.",
    "{M} at {E} was {L}, {adv} {DA} {B}.",
    "{E} posted {m} of {L}, {DP} {cmp} than {Bn}.",
    "{M} for {E} came in at {L} versus {BLP}.",
    "At {E}, {m} {verb} {DP} {B}.",
    "{E} delivered {m} of {L}, {DA} {ahead} {Bb}.",
    "{Es} {m} {verb} from {BL} to {L} {B}.",
    "{M} {verb} {DP} {B} at {E}.",
    "{E}: {m} {L} ({DPs} {B}).",
    "{E} saw a {DP} {noun} in {m} {B}.",
    "{Es} {m} was {adv} {DP} {B} at {L}.",
    "{Es} {m} {verb} {B}.",
    "{Eo}{m} of {L} was {DA} {cmp} than {Bn}.",
    "{Eo}{m} {verb} {DP} {B}, while {m2} {verb2} {DP2}.",
    "{Eo}{m} reached {L}, {adv} {DA} {B}.",
    "{Eo}{m} {verb} {DA} {B} to {L}.",
]

HELDOUT_TEMPLATES = [
    "Looking at {E}, {m} landed at {L}, which is {DA} {cmp} than {Bn}.",
    "{E} continues to be notable on {m}, which {verb} by {DP} {B} to reach {L}.",
    "Compared with {Bn}, {Es} {m} is {adv} {DP}.",
    "There was a {DP} {noun} in {Es} {m} {B}.",
    "{E} recorded {m} of {L}, compared to {BLP}.",
    "{Es} {m} {verb} {B}, by {DP}.",
    "{E} saw {m} {gerund} to {L} ({DAs} {B}).",
    "{M} was the standout at {E}: {adv} {DP} {B}.",
    "{Eo}{m} closed the period at {L}; that is {DA} {cmp} than {Bn}.",
    "{Eo}{m} {verb} {DP} {B} and {m2} {verb2} {DP2}.",
    "{Eo}{m} moved {adv} {B}.",
    "In terms of {m}, {E} finished at {L} against {BLP}.",
]

# Written after the first held-out run and run exactly once, to measure the fixes that run motivated.
HELDOUT2_TEMPLATES = [
    "{Es} {m}: {L}, {adv} {DP} {B}.",
    "{M} at {E} {verb} to {L} {B}, a change of {DAs}.",
    "Against {Bn}, {m} for {E} was {DA} {cmp}.",
    "{E} reported {m} of {L} ({BL} {Bn}).",
    "{Es} {m} {verb} {DP} {B}; {m2} {verb2} {DP2}.",
    "{M} {verb} {DP} {B} for {E}, reaching {L}.",
    "Versus {Bn}, {Es} {m} is {adv} {DA}.",
    "{E} {m}: {DPs} {B} to {L}.",
    "{E} ran {m} of {L} this period, {DA} {ahead} {Bb}.",
    "{Eo}{m} {verb} {B} ({DPs}).",
    "At {L}, {Es} {m} was {DA} {cmp} than {Bn}.",
]

# Written after heldout2 was fixed; run exactly once. The final unbiased generalisation check.
HELDOUT3_TEMPLATES = [
    "{E} - {m} {L} vs {BL} {Bn}.",
    "{M} came in {DA} {cmp} {B} at {E}.",
    "{Es} {m} of {L} compares with {BLP}.",
    "{E} {lift} {m} by {DP} {B}.",
    "{Eo}{m} finished {adv} {DA} {B}, at {L}.",
    "The {DP} {noun} in {m} at {E} ({B}) stands out.",
    "{E} was {ahead} {Bb} on {m} by {DA}.",
    "{Es} {m} is now {L}, after {gerund} {DP} {B}.",
    "Relative to {Bn}, {m} at {E} {verb} {DA}.",
    "{Es} {m} ({L}) was {DP} {cmp} than {Bn}.",
    "{M}, {E}: {L} ({DAs} {B}).",
]

FOLLOW_UPS = ["It was {adv} {DP} {B}.", "That is {DA} {cmp} than {Bn}.", "This was {DP} {cmp} than {Bn}."]

_DIR_PAIRS = {
    "verb": [("rose", "fell"), ("increased", "decreased"), ("grew", "declined"), ("climbed", "slipped"), ("jumped", "dropped")],
    "adv": [("up", "down")],
    "cmp": [("higher", "lower")],
    "ahead": [("ahead of", "behind")],
    "noun": [("increase", "decline"), ("gain", "drop"), ("rise", "fall")],
    "gerund": [("rising", "falling"), ("climbing", "slipping")],
    "lift": [("lifted", "reduced"), ("raised", "lowered")],
}
DIRECTION_WORD_SIGN = {w: (1 if i == 0 else -1) for pairs in _DIR_PAIRS.values() for pair in pairs for i, w in enumerate(pair)}

_BASIS_PHRASES = {
    "last_year": [
        "vs last year",
        "year over year",
        "compared with last year",
        "versus last year",
        "YoY",
        "vs. the same period last year",
    ],
    "budget": ["vs budget", "against budget", "relative to budget", "versus plan"],
    "forecast": ["vs forecast", "against the forecast", "relative to forecast"],
    "prior_week": ["vs last week", "week over week", "WoW", "compared with the prior week"],
    "prior_month": ["vs last month", "month over month", "MoM", "compared with the previous month"],
}
_BASIS_NOUNS = {
    "last_year": ["last year", "a year ago"],
    "budget": ["budget"],
    "forecast": ["forecast"],
    "prior_week": ["last week"],
    "prior_month": ["last month"],
}
_BLP = {
    "last_year": ["{BL} last year", "{BL} a year ago"],
    "budget": ["a budget of {BL}", "budgeted {BL}"],
    "forecast": ["a forecast of {BL}", "the forecast {BL}"],
    "prior_week": ["{BL} last week", "{BL} the prior week"],
    "prior_month": ["{BL} last month", "{BL} the previous month"],
}
ERROR_TYPES = [
    "wrong_value",
    "rounding_drift",
    "wrong_direction",
    "unit_confusion",
    "wrong_basis",
    "wrong_entity",
    "wrong_metric",
    "scale_error",
    "fabricated",
]
_FABRICATED = [
    "Guest satisfaction scores {verb} to 4.6 out of 5.",
    "Staff turnover {verb} 3.4% {B}.",
    "Marketing spend was $84,000, {adv} 6.2% {B}.",
    "Net promoter score {verb} 7 points {B}.",
    "Energy costs {verb} 5.1% {B}.",
]


def _basis_key(sheet: FactSheet, b: BasisSpec) -> str:
    if b.id == "prior":
        return "prior_week" if "week" in b.label else "prior_month"
    return b.id


# --- formatting -----------------------------------------------------------------------


def _indian(n: int) -> str:
    s = str(abs(n))
    head, last3 = s[:-3], s[-3:]
    groups: list[str] = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    return ",".join([*groups, last3]) if groups else last3


def _money(v: float, currency: str, decimals: int, style: int) -> str:
    v = abs(v)
    if currency == "INR":
        if v >= 1e7:
            opts = [f"₹{v / 1e7:.2f} crore", f"₹{v / 1e5:.1f} lakh", f"Rs {_indian(round(v))}"]
        elif v >= 1e5:
            opts = [f"₹{v / 1e5:.2f} lakh", f"₹{_indian(round(v))}"]
        else:
            opts = [f"₹{_indian(round(v))}"]
    else:
        if v >= 1e6:
            opts = [f"${v / 1e6:.2f}M", f"${v / 1e6:.1f} million", f"${v:,.0f}"]
        elif v >= 1e4:
            opts = [f"${v / 1e3:.1f}K", f"${v:,.0f}"]
        else:
            opts = [f"${v:,.{decimals}f}"]
    return opts[style % len(opts)]


def _count(v: float, style: int) -> str:
    v = abs(v)
    if v >= 10_000 and style % 2:
        return f"{v / 1e3:.1f}K"
    return f"{v:,.0f}"


def format_value(metric: MetricSpec, sem: str, v: float, currency: str, style: int, signed: bool = False) -> str:
    """Render a fact value the way a report would. ``sem`` is L, BL, DA or DP."""
    sign = ("+" if v >= 0 else "-") if signed else ""
    if sem == "DP":
        return f"{sign}{abs(v):.1f}{'%' if style % 3 else ' percent'}"
    if metric.type is MetricType.RATE:
        if sem == "DA":
            unit = [" pts", " percentage points", " pp", " pts"][style % 4]
            return f"{sign}{abs(v):.1f}{unit}"
        return f"{v:.1f}%"
    if metric.type is MetricType.CURRENCY:
        return sign + _money(v, currency, metric.decimals, style)
    return sign + _count(v, style)


# --- plans ----------------------------------------------------------------------------


@dataclass
class Slot:
    sem: str  # L, BL, DA, DP, DIR
    start: int
    end: int
    metric: str
    entity: str
    basis: str | None
    dir_span: tuple[int, int] | None = None
    label: str = "clean"


@dataclass
class Plan:
    template: str
    metric: MetricSpec
    entity: EntitySpec
    basis: BasisSpec | None
    metric2: MetricSpec | None = None
    # what the sentence *states* (may differ from the source of the shown numbers after corruption)
    stated_metric: MetricSpec | None = None
    stated_entity: EntitySpec | None = None
    stated_basis: BasisSpec | None = None
    flip: bool = False
    unit_swap: bool = False
    value_scale: dict[str, float] = field(default_factory=dict)
    scale_swap: bool = False
    styles: dict[str, int] = field(default_factory=dict)
    words: dict[str, int] = field(default_factory=dict)
    entity_explicit: bool = True
    corruption: str | None = None
    fabricated: str | None = None


@dataclass
class GeneratedReport:
    text: str
    slots: list[Slot]
    dataset: str
    family: str

    @property
    def corrupted(self) -> bool:
        return any(s.label != "clean" for s in self.slots)


def _fact(sheet: FactSheet, metric: str, entity: str, sem: str, basis: str | None) -> float | None:
    kind = {"L": "level", "BL": "base", "DA": "delta_abs", "DP": "delta_pct"}[sem]
    fid = f"{metric}:{entity}:{kind}" + (f":{basis}" if kind != "level" else "")
    f = sheet.get(fid)
    return f.value if f else None


def _possessive(name: str) -> str:
    return name + ("'" if name.endswith("s") and not name.endswith("ss") else "'s")


def _entity_phrase(sheet: FactSheet, e: EntitySpec) -> str:
    if e.id == sheet.total_entity:
        return next((a for a in e.aliases if a.startswith("the ")), e.name)
    return e.name


class Renderer:
    def __init__(self, sheet: FactSheet, rng: random.Random) -> None:
        self.sheet = sheet
        self.rng = rng

    def render(self, plan: Plan, offset: int) -> tuple[str, list[Slot]]:
        sheet = self.sheet
        src_m, src_e, src_b = plan.metric, plan.entity, plan.basis
        st_m = plan.stated_metric or src_m
        st_e = plan.stated_entity or src_e
        st_b = plan.stated_basis or src_b
        if plan.fabricated:
            template = plan.fabricated
        else:
            template = plan.template
        out: list[str] = []
        slots: list[Slot] = []
        pos = 0
        pending_dirs: list[tuple[int, int, str]] = []

        def emit(s: str) -> tuple[int, int]:
            start = offset + sum(len(x) for x in out)
            out.append(s)
            return start, start + len(s)

        delta_sign = 0
        dp_src = _fact(sheet, src_m.id, src_e.id, "DA", src_b.id) if src_b else None
        if dp_src is not None:
            delta_sign = 1 if dp_src > 0 else -1

        for m in re.finditer(r"\{(\w+)\}", template):
            emit(template[pos : m.start()])
            pos = m.end()
            tok = m.group(1)
            base_tok = tok.rstrip("2")
            second = tok.endswith("2") and tok not in ("L", "BL")
            metric = (plan.metric2 if second else src_m) or src_m
            st_metric = (plan.metric2 if second else st_m) or st_m
            if tok in ("E", "Es", "Eo"):
                if tok == "Eo":
                    phrase = _possessive(_entity_phrase(sheet, st_e)) + " " if plan.entity_explicit else ""
                else:
                    phrase = _entity_phrase(sheet, st_e)
                    if tok == "Es":
                        phrase = _possessive(phrase)
                emit(phrase)
            elif tok in ("M", "m", "m2"):
                syns = [st_metric.label, *st_metric.synonyms]
                phrase = syns[plan.words.get(tok, 0) % len(syns)]
                emit(phrase if tok == "M" or phrase.isupper() or phrase[:2].isupper() else phrase.lower())
            elif tok == "B":
                key = _basis_key(sheet, st_b) if st_b else "last_year"
                emit(_BASIS_PHRASES[key][plan.words.get("B", 0) % len(_BASIS_PHRASES[key])])
            elif tok == "Bn":
                key = _basis_key(sheet, st_b) if st_b else "last_year"
                emit(_BASIS_NOUNS[key][plan.words.get("Bn", 0) % len(_BASIS_NOUNS[key])])
            elif tok == "Bb":
                emit(st_b.label if st_b else "budget")
            elif tok == "BLP":
                key = _basis_key(sheet, st_b) if st_b else "last_year"
                phrase = _BLP[key][plan.words.get("BLP", 0) % len(_BLP[key])]
                a, b = phrase.split("{BL}")
                emit(a)
                slots.append(self._number(plan, "BL", metric, st_metric, st_e, st_b, src_e, src_b, emit, False))
                emit(b)
            elif base_tok in _DIR_PAIRS:
                pairs = _DIR_PAIRS[base_tok]
                pair = pairs[plan.words.get(base_tok, 0) % len(pairs)]
                if second:
                    d2 = _fact(sheet, metric.id, src_e.id, "DA", src_b.id) if src_b else None
                    sgn = 1 if (d2 or 0) > 0 else -1
                else:
                    sgn = delta_sign
                if plan.flip:
                    sgn = -sgn
                word = pair[0] if sgn > 0 else pair[1]
                span = emit(word)
                pending_dirs.append((span[0], span[1], "2" if second else "1"))
            elif base_tok in ("L", "BL", "DA", "DP", "DAs", "DPs"):
                sem = base_tok.rstrip("s")
                slots.append(
                    self._number(plan, sem, metric, st_metric, st_e, st_b, src_e, src_b, emit, base_tok.endswith("s"), second)
                )
            else:
                raise ValueError(f"unknown token {tok}")
        emit(template[pos:])
        text = "".join(out)
        text = text[:1].upper() + text[1:]
        # Attach each direction word to the delta slots it governs.
        for s in slots:
            if s.sem in ("DA", "DP"):
                group = "2" if getattr(s, "_second", False) else "1"
                d = next((d for d in pending_dirs if d[2] == group), None)
                if d:
                    s.dir_span = (d[0], d[1])
        if not any(s.sem in ("DA", "DP") for s in slots) and pending_dirs and not plan.fabricated:
            d = pending_dirs[0]
            slots.append(Slot("DIR", d[0], d[1], st_m.id, st_e.id, st_b.id if st_b else None, (d[0], d[1])))
        if plan.fabricated:
            for s in slots:
                s.label = "fabricated"
            nums = [n for n in iter_numbers(text)]
            slots = [Slot("FAB", offset + n.start, offset + n.end, "", "", None, label="fabricated") for n in nums]
        return text, slots

    def _number(
        self,
        plan: Plan,
        sem: str,
        metric: MetricSpec,
        st_metric: MetricSpec,
        st_e: EntitySpec,
        st_b: BasisSpec | None,
        src_e: EntitySpec,
        src_b: BasisSpec | None,
        emit: Callable[[str], tuple[int, int]],
        signed: bool,
        second: bool = False,
    ) -> Slot:
        sheet = self.sheet
        v = _fact(sheet, metric.id, src_e.id, sem, src_b.id if src_b else None)
        assert v is not None, (metric.id, src_e.id, sem, src_b)
        v *= plan.value_scale.get(sem + ("2" if second else ""), 1.0)
        shown_sem = sem
        style = plan.styles.get(sem, 0)
        text = format_value(metric, sem, v, sheet.currency, style, signed)
        if plan.unit_swap and sem == "DA" and metric.type is MetricType.RATE and not second:
            text = re.sub(r"\s?(?:pts|percentage points|pp)$", "%", text)
        if plan.scale_swap and not second:
            swapped = _swap_scale(text)
            if swapped:
                text = swapped
        start, end = emit(text)
        slot = Slot(shown_sem, start, end, st_metric.id, st_e.id, st_b.id if st_b else None)
        slot._second = second  # type: ignore[attr-defined]
        return slot


def _swap_scale(text: str) -> str | None:
    for a, b in (("M", "K"), (" million", " billion"), (" crore", " lakh"), (" lakh", " crore"), ("K", "M")):
        if text.endswith(a):
            return text[: -len(a)] + b
    return None


# --- labelling ------------------------------------------------------------------------


def slot_in_error(sheet: FactSheet, slot: Slot, text: str) -> bool:
    """Independent ground truth: is the displayed number (and direction) wrong for what the sentence states?"""
    if slot.sem == "FAB":
        return True
    metric = sheet.metrics.get(slot.metric)
    if metric is None:
        return True
    if slot.sem == "DIR":
        truth = _fact(sheet, slot.metric, slot.entity, "DA", slot.basis)
        word = text[slot.start : slot.end].lower()
        return truth is None or DIRECTION_WORD_SIGN.get(word, 0) != (1 if truth > 0 else -1)
    nums = list(iter_numbers(text[slot.start : slot.end]))
    if not nums:
        return True
    n = nums[0]
    sem = slot.sem
    if sem == "DA" and metric.type is MetricType.RATE and n.unit is Unit.PERCENT:
        sem = "DP"
    elif sem == "DP" and n.unit in (Unit.POINTS, Unit.BPS):
        sem = "DA"
    truth = _fact(sheet, slot.metric, slot.entity, sem, slot.basis)
    if truth is None:
        return True
    unit = n.display_unit / 100 if n.unit is Unit.BPS else n.display_unit
    shown = n.points_magnitude
    if sem in ("L", "BL"):
        return abs(shown * (n.sign or 1) - truth) > 0.6 * unit
    if abs(shown - abs(truth)) > 0.6 * unit:
        return True
    direction = n.sign
    if slot.dir_span:
        direction = DIRECTION_WORD_SIGN.get(text[slot.dir_span[0] : slot.dir_span[1]].lower(), direction)
    return direction is not None and truth != 0 and direction != (1 if truth > 0 else -1)


# --- report generation ----------------------------------------------------------------


class ReportGenerator:
    def __init__(
        self, sheet: FactSheet, family: str = "dev", seed: int = 0, error_rate: float = 0.35, clean_report_rate: float = 0.3
    ) -> None:
        self.sheet = sheet
        self.templates = {
            "dev": DEV_TEMPLATES,
            "heldout": HELDOUT_TEMPLATES,
            "heldout2": HELDOUT2_TEMPLATES,
            "heldout3": HELDOUT3_TEMPLATES,
        }[family]
        self.family = family
        self.rng = random.Random(seed)
        self.error_rate = error_rate
        self.clean_report_rate = clean_report_rate
        self.renderer = Renderer(sheet, self.rng)

    def _usable(self, metric: MetricSpec, entity: EntitySpec, basis: BasisSpec | None) -> bool:
        if basis is None:
            return True
        dp = _fact(self.sheet, metric.id, entity.id, "DP", basis.id)
        da = _fact(self.sheet, metric.id, entity.id, "DA", basis.id)
        # Skip near-zero changes: "rose 0.0%" is not a sentence anyone writes.
        return dp is not None and da is not None and abs(dp) >= 0.3

    def _plan(self, entity: EntitySpec, template: str, explicit: bool) -> Plan | None:
        rng, sheet = self.rng, self.sheet
        metrics = list(sheet.metrics.values())
        bases = list(sheet.bases.values())
        for _ in range(30):
            metric = rng.choice(metrics)
            basis = rng.choice(bases)
            if ("{ahead}" in template or "{Bb}" in template) and basis.id not in ("budget", "forecast"):
                continue
            if not self._usable(metric, entity, basis):
                continue
            metric2 = None
            if "{m2}" in template:
                others = [m for m in metrics if m.id != metric.id and self._usable(m, entity, basis)]
                if not others:
                    continue
                metric2 = rng.choice(others)
            return Plan(
                template=template,
                metric=metric,
                entity=entity,
                basis=basis,
                metric2=metric2,
                styles={k: rng.randrange(12) for k in ("L", "BL", "DA", "DP")},
                words={k: rng.randrange(12) for k in ("m", "M", "m2", "B", "Bn", "BLP", *_DIR_PAIRS)},
                entity_explicit=explicit,
            )
        return None

    def _corrupt(self, plan: Plan, kind: str) -> bool:
        rng, sheet = self.rng, self.sheet
        tokens = sorted(set(re.findall(r"\{(\w+)\}", plan.template)))
        nums = [t.rstrip("s") for t in tokens if t.rstrip("s") in ("L", "BL", "DA", "DP")] + (["BL"] if "BLP" in tokens else [])
        has_dir = any(t.rstrip("2") in _DIR_PAIRS for t in tokens)
        token_set = set(tokens)
        plan.corruption = kind
        if kind == "wrong_value" and nums:
            s = rng.choice(nums)
            plan.value_scale[s] = rng.choice([-1, 1]) * rng.uniform(0.15, 0.45) + 1
            return True
        if kind == "rounding_drift" and nums:
            s = rng.choice([x for x in nums if x != "BL"] or nums)
            v = _fact(sheet, plan.metric.id, plan.entity.id, s, plan.basis.id if plan.basis else None) or 0
            if abs(v) < 1:
                return False
            # two or three display units, expressed as a relative change of the shown value
            step = 0.1 if s in ("DP",) or plan.metric.type is MetricType.RATE else None
            if step is None:
                return False
            plan.value_scale[s] = 1 + rng.choice([-1, 1]) * rng.choice([2.2, 3.2]) * step / abs(v)
            return True
        if kind == "wrong_direction" and has_dir:
            plan.flip = True
            return True
        if kind == "unit_confusion" and "DA" in nums and plan.metric.type is MetricType.RATE:
            plan.unit_swap = True
            return True
        if kind == "wrong_basis" and plan.basis is not None and any(t in tokens for t in ("B", "Bn", "BLP")):
            other_bases = [b for b in sheet.bases.values() if b.id != plan.basis.id and self._usable(plan.metric, plan.entity, b)]
            if not other_bases:
                return False
            plan.stated_basis = rng.choice(other_bases)
            return True
        if kind == "wrong_entity" and (token_set & {"E", "Es"} or ("Eo" in token_set and plan.entity_explicit)):
            other_entities = [e for e in sheet.entities.values() if e.id != plan.entity.id]
            plan.stated_entity = rng.choice(other_entities)
            return True
        if kind == "wrong_metric" and token_set & {"m", "M"}:
            other_metrics = [m for m in sheet.metrics.values() if m.id != plan.metric.id and m.type is plan.metric.type]
            if not other_metrics:
                return False
            plan.stated_metric = rng.choice(other_metrics)
            return True
        if kind == "scale_error" and plan.metric.type is MetricType.CURRENCY and nums:
            for s in ("L", "BL", "DA"):
                if s in nums:
                    v = _fact(sheet, plan.metric.id, plan.entity.id, s, plan.basis.id if plan.basis else None) or 0
                    txt = format_value(plan.metric, s, v, sheet.currency, plan.styles.get(s, 0))
                    if _swap_scale(txt):
                        plan.scale_swap = True
                        return True
            return False
        return False

    def generate(self) -> GeneratedReport:
        rng, sheet = self.rng, self.sheet
        clean_report = rng.random() < self.clean_report_rate
        entities = [e for e in sheet.entities.values() if e.id != sheet.total_entity]
        sections: list[tuple[EntitySpec | None, EntitySpec]] = [(None, sheet.entities[sheet.total_entity])]
        for e in rng.sample(entities, k=min(len(entities), rng.choice([1, 2]))):
            sections.append((e if rng.random() < 0.5 else None, e))
        parts: list[str] = []
        slots: list[Slot] = []
        offset = 0
        for heading, entity in sections:
            if heading is not None:
                h = f"## {heading.name}\n"
                parts.append(h)
                offset += len(h)
            for _ in range(rng.choice([2, 3, 4])):
                template = rng.choice(self.templates)
                if entity.id == sheet.total_entity:
                    explicit = rng.random() < 0.6
                elif heading is not None:
                    explicit = rng.random() < 0.4
                else:
                    explicit = True
                plan = self._plan(entity, template, explicit)
                if plan is None:
                    continue
                if not clean_report and rng.random() < self.error_rate:
                    kind = rng.choice(ERROR_TYPES)
                    if kind == "fabricated":
                        plan.fabricated = rng.choice(_FABRICATED)
                        plan.corruption = kind
                    elif not self._corrupt(plan, kind):
                        plan = self._plan(entity, template, explicit) or plan
                sentence, s_slots = self.renderer.render(plan, offset)
                padded = _pad(offset, sentence)
                for s in s_slots:
                    if s.sem != "FAB":
                        s.label = (plan.corruption or "unlabelled_error") if slot_in_error(sheet, s, padded) else "clean"
                parts.append(sentence + " ")
                slots.extend(s_slots)
                offset += len(sentence) + 1
                if rng.random() < 0.15 and plan.basis is not None and not plan.fabricated:
                    follow = self._follow_up(plan, offset)
                    if follow:
                        f_text, f_slots = follow
                        parts.append(f_text + " ")
                        slots.extend(f_slots)
                        offset += len(f_text) + 1
            parts.append("\n\n")
            offset += 2
        text = "".join(parts)
        return GeneratedReport(text, slots, sheet.dataset, self.family)

    def _follow_up(self, plan: Plan, offset: int) -> tuple[str, list[Slot]] | None:
        others = [
            b
            for b in self.sheet.bases.values()
            if plan.basis and b.id != plan.basis.id and self._usable(plan.metric, plan.entity, b)
        ]
        if not others:
            return None
        # A follow-up ("It was up 3% vs budget") is about what the previous sentence *said*.
        metric = plan.stated_metric or plan.metric
        entity = plan.stated_entity or plan.entity
        others = [b for b in others if self._usable(metric, entity, b)]
        if not others:
            return None
        follow = Plan(
            template=self.rng.choice(FOLLOW_UPS),
            metric=metric,
            entity=entity,
            basis=self.rng.choice(others),
            styles={k: self.rng.randrange(12) for k in ("L", "BL", "DA", "DP")},
            words={k: self.rng.randrange(12) for k in ("B", "Bn", *_DIR_PAIRS)},
        )
        text, slots = self.renderer.render(follow, offset)
        for s in slots:
            s.label = "clean" if not slot_in_error(self.sheet, s, _pad(offset, text)) else "unlabelled_error"
        return text, slots


def _pad(offset: int, sentence: str) -> str:
    """Slots carry absolute offsets; pad so they index correctly into a single sentence."""
    return " " * offset + sentence
