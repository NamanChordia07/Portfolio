"""Finding numbers in prose and deciding which true values they are consistent with.

A number written in a report is not a point value. "12%" is a claim that the true
value rounds to 12, i.e. lies in [11.5, 12.5). "About $1.2M" is looser still, and
"over 80%" is a one-sided bound. This module turns each numeric mention into a
:class:`NumberMention` that carries its display precision and hedge, so the verifier
can ask the right question: *is the true value inside the interval this text commits to?*
"""

from __future__ import annotations

import re
from collections.abc import Iterator
from dataclasses import dataclass
from enum import StrEnum


class Unit(StrEnum):
    NONE = "none"
    PERCENT = "percent"
    POINTS = "points"  # percentage points: the difference between two rates
    BPS = "bps"  # basis points, 1/100 of a percentage point
    CURRENCY = "currency"
    MULTIPLE = "multiple"  # 1.4x


class Hedge(StrEnum):
    EXACT = "exact"
    APPROX = "approx"  # about, around, roughly, ~
    AT_LEAST = "at_least"  # over, more than, above, at least
    AT_MOST = "at_most"  # under, less than, below, up to
    NEARLY = "nearly"  # nearly, almost, just under
    JUST_OVER = "just_over"  # just over, slightly above


@dataclass(frozen=True)
class TolerancePolicy:
    """How much slack each kind of wording gets, in multiples of the display unit.

    The display unit of "12.4%" is 0.1; of "$1.2M" it is 100,000. ``exact_slack`` widens
    normal rounding (+/- half a unit) by a sliver, so float noise and half-up vs half-even
    disagreements at the boundary are accepted, while a drift of even one unit is not.
    """

    exact_slack: float = 0.1
    approx_units: float = 1.5
    approx_rel: float = 0.03
    nearly_units: float = 2.0
    nearly_rel: float = 0.05
    bound_units: float = 10.0
    bound_rel: float = 0.5
    # When set, ignore display precision entirely and accept +/- this relative error.
    # Only used for the "fixed tolerance" ablation in the benchmark.
    fixed_rel: float | None = None


DEFAULT_POLICY = TolerancePolicy()


@dataclass(frozen=True)
class NumberMention:
    start: int
    end: int
    text: str
    magnitude: float  # absolute value after applying the scale suffix
    sign: int | None  # +1 / -1 when the text carries an explicit sign, else None
    unit: Unit
    currency: str | None
    decimals: int
    scale: float
    hedge: Hedge

    @property
    def display_unit(self) -> float:
        """Smallest step the text can express, e.g. 0.1 for "12.4" and 1e5 for "1.2M"."""
        return (10.0**-self.decimals) * self.scale

    @property
    def points_magnitude(self) -> float:
        """Magnitude expressed in percentage points (bps are converted)."""
        return self.magnitude / 100.0 if self.unit is Unit.BPS else self.magnitude

    def interval(self, policy: TolerancePolicy = DEFAULT_POLICY) -> tuple[float, float]:
        """Closed interval of true magnitudes this wording is consistent with."""
        v = self.points_magnitude
        unit = self.display_unit / 100.0 if self.unit is Unit.BPS else self.display_unit
        if policy.fixed_rel is not None:
            slack = abs(v) * policy.fixed_rel
            return v - slack, v + slack
        half = unit * (0.5 + policy.exact_slack)
        if self.hedge is Hedge.EXACT:
            return v - half, v + half
        if self.hedge is Hedge.APPROX:
            w = max(unit * policy.approx_units, abs(v) * policy.approx_rel)
            return v - w, v + w
        edge = unit * policy.exact_slack
        if self.hedge is Hedge.NEARLY:  # "nearly 5%": a little under 5
            w = max(unit * policy.nearly_units, abs(v) * policy.nearly_rel)
            return v - w, v + edge
        if self.hedge is Hedge.JUST_OVER:  # "just over 4 pts": a little over 4
            w = max(unit * policy.nearly_units, abs(v) * policy.nearly_rel)
            return v - edge, v + w
        wide = max(unit * policy.bound_units, abs(v) * policy.bound_rel)
        if self.hedge is Hedge.AT_LEAST:
            return v, v + wide
        return max(0.0, v - wide), v  # AT_MOST

    def admits(self, true_magnitude: float, policy: TolerancePolicy = DEFAULT_POLICY) -> bool:
        lo, hi = self.interval(policy)
        eps = 1e-9 * max(1.0, abs(true_magnitude))
        return lo - eps <= true_magnitude <= hi + eps


# --- parsing ---------------------------------------------------------------------------

_CURRENCY_SYMBOLS = {
    "$": "USD",
    "us$": "USD",
    "usd": "USD",
    "₹": "INR",
    "rs": "INR",
    "rs.": "INR",
    "inr": "INR",
    "€": "EUR",
    "eur": "EUR",
    "£": "GBP",
    "gbp": "GBP",
}

_SCALES = {
    "k": 1e3,
    "thousand": 1e3,
    "m": 1e6,
    "mn": 1e6,
    "mm": 1e6,
    "million": 1e6,
    "b": 1e9,
    "bn": 1e9,
    "billion": 1e9,
    "lakh": 1e5,
    "lakhs": 1e5,
    "lac": 1e5,
    "crore": 1e7,
    "crores": 1e7,
    "cr": 1e7,
}

_HEDGES: list[tuple[str, Hedge]] = [
    (r"just\s+under|just\s+shy\s+of|a\s+shade\s+under|nearly|almost|close\s+to", Hedge.NEARLY),
    (r"just\s+over|just\s+above|slightly\s+(?:over|above|more\s+than)", Hedge.JUST_OVER),
    (r"about|around|approximately|approx\.?|roughly|some|circa|~|≈", Hedge.APPROX),
    (
        r"more\s+than|over|above|at\s+least|north\s+of|upwards\s+of|in\s+excess\s+of|exceeding|exceeded|topped|topping|surpassed",
        Hedge.AT_LEAST,
    ),
    (r"less\s+than|under|below|at\s+most|up\s+to|no\s+more\s+than|south\s+of", Hedge.AT_MOST),
]
_HEDGE_RE = [(re.compile(rf"(?:^|[\s(])(?:{pat})\s*$", re.IGNORECASE), h) for pat, h in _HEDGES]

_NUMBER_RE = re.compile(
    r"""
    (?P<sign>[+\-−])?\s?
    (?P<cur>US\$|\$|₹|€|£|Rs\.?\s?|INR\s?|USD\s?|EUR\s?|GBP\s?)?
    (?P<num>\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?|\.\d+)
    (?:
        (?P<scale_tight>k|K|m|M|mn|MM|bn|B|b|cr)(?![A-Za-z])
      | \s?(?P<scale_word>thousand|million|billion|lakhs?|lac|crores?|mn|bn|cr)\b
    )?
    (?P<unit>
        \s?%
      | \s?(?:percent|per\s?cent)\b
      | \s?(?:percentage|pct\.?)\s+points?\b
      | \s?(?:pts?|pp|ppts?|points?)(?![A-Za-z])
      | \s?(?:bps|basis\s+points?)\b
      | x(?![A-Za-z])
    )?
    """,
    re.VERBOSE,
)

_MONTHS = (
    r"jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|"
    r"sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?"
)
_BEFORE_NOT_A_CLAIM = re.compile(
    rf"(?:\b(?:week|wk|fy|cy|period|day|no\.?|number|#|top|bottom|rank(?:ed)?|version|phase|step|tier|"
    rf"{_MONTHS}))\s*$",
    re.IGNORECASE,
)
_AFTER_NOT_A_CLAIM = re.compile(rf"^\s*(?:{_MONTHS})\b|^(?:st|nd|rd|th)\b|^[:/]\d|^-\d|^[A-Za-z]\d", re.IGNORECASE)


def _unit_of(raw: str | None) -> Unit:
    if not raw:
        return Unit.NONE
    s = raw.strip().lower()
    if "point" in s or s.startswith(("pt", "pp", "ppt")):
        return Unit.BPS if s.startswith("basis") else Unit.POINTS
    if s == "%" or s.startswith("percent") or s.startswith("per"):
        return Unit.PERCENT
    if s.startswith("bps") or s.startswith("basis"):
        return Unit.BPS
    if s == "x":
        return Unit.MULTIPLE
    return Unit.POINTS


def _hedge_before(text: str, start: int) -> Hedge:
    window = text[max(0, start - 32) : start]
    for pattern, hedge in _HEDGE_RE:
        if pattern.search(window):
            return hedge
    return Hedge.EXACT


def _looks_like_year(num: str, unit: Unit, has_currency: bool, scale: float) -> bool:
    if unit is not Unit.NONE or has_currency or scale != 1.0:
        return False
    return re.fullmatch(r"(?:19|20)\d\d", num) is not None


def iter_numbers(text: str) -> Iterator[NumberMention]:
    """Yield every numeric mention in ``text`` that could be a factual claim.

    Identifiers and calendar references (years, "Week 32", "Q3", "3rd", "12 Aug",
    "COVID-19", "G3") are skipped: they are labels, not measurements.
    """
    for m in _NUMBER_RE.finditer(text):
        sign_raw = m.group("sign")
        if sign_raw and m.start() > 0 and text[m.start() - 1].isalnum():
            if text[m.start() - 1].isalpha():
                continue  # "COVID-19", "Q-3": a label, not a number
            sign_raw = None  # the hyphen in a range such as "10-12%" is not a sign
        start = m.start() if sign_raw else (m.start("cur") if m.group("cur") else m.start("num"))
        if start > 0 and (text[start - 1].isalnum() or text[start - 1] in "_."):
            continue  # part of an identifier such as G3, COVID-19, v2.1
        num = m.group("num")
        cur_raw = m.group("cur")
        scale_raw = m.group("scale_tight") or m.group("scale_word")
        unit_raw = m.group("unit")
        end = m.end()

        # "m"/"b" glued to a bare number only mean million/billion for money ("$1.2m").
        if scale_raw in {"m", "b"} and not cur_raw:
            scale_raw, unit_raw, end = None, None, m.end("num")
        scale = _SCALES.get(scale_raw.lower(), 1.0) if scale_raw else 1.0
        unit = _unit_of(unit_raw)
        if cur_raw and unit is Unit.NONE:
            unit = Unit.CURRENCY

        line_start = text.rfind("\n", 0, start) + 1
        if text[line_start:start].strip() in {"", "-", "*"} and re.match(r"[.)]\s", text[end : end + 2]):
            continue  # list marker such as "1. " or "2) "
        if _BEFORE_NOT_A_CLAIM.search(text[max(0, start - 24) : start]):
            continue
        if _AFTER_NOT_A_CLAIM.search(text[end : end + 12]):
            continue
        if _looks_like_year(num, unit, bool(cur_raw), scale):
            continue

        digits = num.replace(",", "")
        decimals = len(digits.split(".")[1]) if "." in digits else 0
        magnitude = float(digits) * scale
        sign: int | None = None
        if sign_raw:
            sign = 1 if sign_raw == "+" else -1
        currency = _CURRENCY_SYMBOLS.get(cur_raw.strip().lower(), "USD") if cur_raw else None
        yield NumberMention(
            start=start,
            end=end,
            text=text[start:end],
            magnitude=magnitude,
            sign=sign,
            unit=unit,
            currency=currency,
            decimals=decimals,
            scale=scale,
            hedge=_hedge_before(text, start),
        )


# --- formatting (used by repair) --------------------------------------------------------

_SCALE_WORD_FOR = {1e3: "K", 1e6: "M", 1e9: "B", 1e5: " lakh", 1e7: " crore"}


def format_like(template: NumberMention, value: float) -> str:
    """Render ``value`` using the same style as ``template`` (currency, scale, decimals, unit).

    Used to repair a wrong number without changing how the sentence reads:
    "$1.4M" with a true value of 1_236_000 becomes "$1.2M".
    """
    magnitude = abs(value)
    if template.unit is Unit.BPS:
        magnitude *= 100.0
    scaled = magnitude / template.scale
    body = f"{scaled:,.{template.decimals}f}"
    if "," not in template.text and "," in body:
        body = body.replace(",", "")
    original = template.text
    prefix = ""
    num_match = re.search(r"\d|\.\d", original)
    if num_match:
        prefix = original[: num_match.start()]
    if template.sign is not None:
        prefix = prefix.lstrip("+-−").lstrip()
        prefix = ("+" if value >= 0 else "-") + prefix
    tail_match = re.search(r"(?:\d)([^\d]*)$", original)
    tail = tail_match.group(1) if tail_match else ""
    return f"{prefix}{body}{tail}"
