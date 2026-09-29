"""Turning report prose into atomic, checkable claims.

A sentence such as

    "Occupancy rose 4.2 pts to 78.4% vs last year, while ADR slipped 1.1%."

contains three claims: a change in occupancy (+4.2 points vs last year), an occupancy level
(78.4%), and a relative change in ADR (-1.1%, basis carried over from the sentence). Each
number is attributed to a metric, an entity, a comparison basis and a direction using the
clause it sits in, with carry-over from earlier clauses, sentences and section headings
the way a human reader resolves "it" and elliptical phrases.

The extractor is deliberately rule-based: it is fast, deterministic, explainable (every
attribution records *why*), and it never invents a number. Mentions it cannot attribute are
reported as unverifiable rather than guessed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import StrEnum

from .facts import FactSheet, MetricType
from .numbers import Hedge, NumberMention, Unit, iter_numbers


class ClaimKind(StrEnum):
    LEVEL = "level"
    BASE = "base"
    DELTA = "delta"
    DIRECTION = "direction"  # qualitative: "ADR declined vs budget"


@dataclass
class Claim:
    id: int
    kind: ClaimKind
    start: int
    end: int
    text: str
    sentence: str
    number: NumberMention | None
    metric: str | None
    entity: str | None
    basis: str | None
    direction: int | None  # +1 up, -1 down, 0 flat, None unknown
    direction_span: tuple[int, int] | None = None
    notes: list[str] = field(default_factory=list)


# --- lexicons ---------------------------------------------------------------------------

_DEFAULT_BASIS_PHRASES: dict[str, tuple[str, ...]] = {
    "last_year": (
        "year over year",
        "year-over-year",
        "year on year",
        "year-on-year",
        "yoy",
        "y/y",
        "y-o-y",
        "vs ly",
        "vs. ly",
        "stly",
        "same time last year",
        "same period last year",
        "same week last year",
        "same month last year",
        "a year ago",
        "a year earlier",
        "the prior year",
        "prior-year",
        "prior year",
        "last year",
        "last year's",
        "the previous year",
    ),
    "prior": (
        "week over week",
        "week-over-week",
        "week on week",
        "week-on-week",
        "wow",
        "w/w",
        "month over month",
        "month-over-month",
        "month on month",
        "month-on-month",
        "mom",
        "m/m",
        "sequentially",
        "the prior week",
        "the previous week",
        "prior week",
        "previous week",
        "last week",
        "last week's",
        "the prior month",
        "the previous month",
        "prior month",
        "previous month",
        "last month",
        "last month's",
        "the prior period",
        "prior period",
        "the previous period",
        "previous period",
    ),
    "budget": ("budget", "budgeted", "the budget", "plan", "the plan", "target", "targets"),
    "forecast": ("forecast", "the forecast", "forecasted", "projection", "projections", "projected", "expectations"),
}
_BASIS_ALIASES = {
    "ly": "last_year",
    "yoy": "last_year",
    "stly": "last_year",
    "last_year": "last_year",
    "prior": "prior",
    "previous": "prior",
    "previous_period": "prior",
    "prior_period": "prior",
    "wow": "prior",
    "mom": "prior",
    "budget": "budget",
    "plan": "budget",
    "forecast": "forecast",
    "fcst": "forecast",
    "projection": "forecast",
}

_UP = 1
_DOWN = -1
_FLAT = 0
_GOOD = 2  # direction depends on metric polarity
_BAD = -2

_DIRECTION_WORDS: dict[str, int] = {}
for _w in (
    "rose rise rises rising risen up increased increase increases increasing grew grow grows growing grown "
    "growth gained gain gains gaining climbed climb climbing jumped jump jumps surged surge surging higher "
    "ahead above exceeded exceeding beat beating outperformed advanced expanded expanding lifted lift uplift "
    "picked strengthened stronger topped rebounded recovered accelerated upturn raised boosted"
).split():
    _DIRECTION_WORDS[_w] = _UP
for _w in (
    "fell fall falls falling fallen down decreased decrease decreases decreasing declined decline declines "
    "declining dropped drop drops dropping slipped slip slipping dipped dip dipping lower below behind "
    "missed trailed trailing shrank shrink shrinking contracted contraction contracting reduced reduction "
    "softened softer softening eased easing weakened weaker weakening slid slide sliding lost loss "
    "plunged plunge tumbled retreated slowed downturn lowered trimmed fewer"
).split():
    _DIRECTION_WORDS[_w] = _DOWN
for _w in "flat unchanged steady stable level-pegging".split():
    _DIRECTION_WORDS[_w] = _FLAT
for _w in "improved improve improves improving improvement better favorable favourable".split():
    _DIRECTION_WORDS[_w] = _GOOD
for _w in "worsened worsen worsening worse deteriorated deteriorating deterioration unfavorable unfavourable".split():
    _DIRECTION_WORDS[_w] = _BAD

_DIRECTION_RE = re.compile(
    r"(?<![A-Za-z-])(" + "|".join(sorted(map(re.escape, _DIRECTION_WORDS), key=len, reverse=True)) + r")(?![A-Za-z-])",
    re.IGNORECASE,
)
_NOT_DIRECTION_AFTER = re.compile(r"^\s+to\s+(?:\$|₹|€|£)?\d", re.IGNORECASE)  # "up to 80%" is a bound

_DELTA_NOUN = (
    r"increase|rise|gain|growth|jump|improvement|uplift|lift|decline|decrease|drop|fall|dip|reduction|"
    r"contraction|change|swing|slide|downturn|upturn|expansion"
)
_DELTA_NOUN_OF_BEFORE = re.compile(rf"(?:(?:{_DELTA_NOUN})\s+of|\bby)\s+(?:a|an|the)?\s*$", re.IGNORECASE)
_DELTA_AFTER = re.compile(
    rf"^[\s-]*(?:{_DELTA_NOUN}|higher|lower|more|less|fewer|above|below|ahead|behind|up|down|better|worse|"
    r"stronger|weaker|increase|improvement)\b",
    re.IGNORECASE,
)
_BASE_MARKER_BEFORE = re.compile(
    r"(?:\bvs\.?|\bversus|\bagainst|\bcompared\s+(?:with|to)|\brelative\s+to|\bfrom|\bthan)\s*(?:a|an|the)?\s*$",
    re.IGNORECASE,
)
_LEVEL_MARKER_BEFORE = re.compile(
    r"(?:\bto|\bat|\bwas|\bwere|\bis|\bof|\breached|\bhit|\btotal(?:l)?ed|\btotal(?:l)?ing|\bstood\s+at|"
    r"\bcame\s+in\s+at|\blanded\s+at|\bfinished\s+at|\bclosed\s+at|\baveraged|\bran\s+at|\bsat\s+at|"
    r"\bposted|\brecorded|\bdelivered|\bgenerated|\bof\s+roughly|:|=)\s*(?:a|an|the)?\s*$",
    re.IGNORECASE,
)
_BASE_GAP = re.compile(
    r"(?:'s)?\s*(?:was|were|of|stood\s+at|came\s+in\s+at|called\s+for|had\s+been|had|is|figure\s+of|level\s+of)?"
    r"\s*(?:a|an|the)?\s*(?:about|around|roughly|nearly|almost|over|under)?\s*",
    re.IGNORECASE,
)
_ADVERBIAL_BASIS = re.compile(
    r"(?:year|week|month)[\s-]+(?:over|on)[\s-]+(?:year|week|month)|yoy|y/y|y-o-y|wow|w/w|mom|m/m|sequentially|stly",
    re.IGNORECASE,
)
_HEDGE_TAIL = re.compile(
    r"(?:just\s+under|just\s+over|nearly|almost|about|around|approximately|approx\.?|roughly|some|"
    r"more\s+than|over|above|at\s+least|less\s+than|under|below|up\s+to|close\s+to|~)\s*$",
    re.IGNORECASE,
)
_CLAUSE_BREAK = re.compile(
    r";|,\s+|\s+(?:while|whereas|but|although|though|and|as)\s+|\s+[-–—]\s+|:\s+",
    re.IGNORECASE,
)
_ANAPHOR = re.compile(r"(?:it|this|that|these|the\s+(?:figure|metric|rate|number|change|increase|decline))\b", re.IGNORECASE)


def _split_sentences(text: str) -> list[tuple[int, int]]:
    """Sentence spans. Decimal points ("78.4%") and abbreviations ("vs.") do not end sentences."""
    spans: list[tuple[int, int]] = []
    for line_match in re.finditer(r"[^\n]+", text):
        line, base = line_match.group(0), line_match.start()
        start = 0
        for m in re.finditer(r"[.!?]+(?=\s+[A-Z(\"'*]|\s*$)", line):
            before = line[max(0, m.start() - 4) : m.start()].lower()
            if before.endswith(("vs", " vs", "approx", "no", "e.g", "i.e")):
                continue
            spans.append((base + start, base + m.end()))
            start = m.end()
        if line[start:].strip():
            spans.append((base + start, base + len(line)))
    return [(s + (len(text[s:e]) - len(text[s:e].lstrip())), e) for s, e in spans if text[s:e].strip()]


def _phrase_re(phrases: list[str]) -> re.Pattern[str] | None:
    phrases = sorted({p.strip() for p in phrases if p.strip()}, key=len, reverse=True)
    if not phrases:
        return None
    alt = "|".join(re.escape(p).replace(r"\ ", r"\s+") for p in phrases)
    return re.compile(rf"(?<![A-Za-z0-9])(?:{alt})(?![A-Za-z0-9])", re.IGNORECASE)


_BLANKS = re.compile(r"[ \t]*")
_NUMBER_WORD = r"(?:[$₹€£]\s?)?\d[\d,]*(?:\.\d+)?\s?(?:[kKmM]|thousand|million|lakh|crore)?"


@dataclass
class _Hit:
    start: int
    end: int
    value: str


class Lexicon:
    """Metric, entity and basis vocabularies derived from a fact sheet."""

    def __init__(self, sheet: FactSheet) -> None:
        self.sheet = sheet
        self._metric_phrases: dict[str, str] = {}
        for m in sheet.metrics.values():
            for p in (m.label, m.id.replace("_", " "), *m.synonyms):
                self._metric_phrases.setdefault(p.lower(), m.id)
        self._entity_phrases: dict[str, str] = {}
        for e in sheet.entities.values():
            for p in (e.name, *e.aliases):
                self._entity_phrases.setdefault(p.lower(), e.id)
            if e.id != sheet.total_entity:
                self._entity_phrases.setdefault(e.id.replace("-", " "), e.id)
        self._basis_phrases: dict[str, str] = {}
        for b in sheet.bases.values():
            canonical = _BASIS_ALIASES.get(b.id.lower(), b.id)
            for p in (*b.phrases, *_DEFAULT_BASIS_PHRASES.get(canonical, ()), b.label):
                self._basis_phrases.setdefault(p.lower(), b.id)
        self._metric_re = _phrase_re(list(self._metric_phrases))
        # Two-word metric names can be split around the number: "rooms sold" -> "sold 1,017 rooms".
        self._inverted: dict[tuple[str, str], str] = {}
        for phrase, metric_id in self._metric_phrases.items():
            words = phrase.split()
            if len(words) == 2:
                self._inverted.setdefault((words[1], words[0]), metric_id)
        self._inverted_re = (
            re.compile(
                rf"(?<![A-Za-z0-9])(?P<verb>{'|'.join(sorted({re.escape(v) for v, _ in self._inverted}))})\s+"
                rf"{_NUMBER_WORD}\s+(?P<noun>{'|'.join(sorted({re.escape(n) for _, n in self._inverted}))})(?![A-Za-z0-9])",
                re.IGNORECASE,
            )
            if self._inverted
            else None
        )
        self._entity_re = _phrase_re(list(self._entity_phrases))
        self._basis_re = _phrase_re(list(self._basis_phrases))

    def _hits(self, pattern: re.Pattern[str] | None, table: dict[str, str], text: str) -> list[_Hit]:
        if pattern is None:
            return []
        return [_Hit(m.start(), m.end(), table[re.sub(r"\s+", " ", m.group(0).lower())]) for m in pattern.finditer(text)]

    def bases(self, text: str) -> list[_Hit]:
        return self._hits(self._basis_re, self._basis_phrases, text)

    def metrics(self, text: str, mask: list[_Hit]) -> list[_Hit]:
        hits = [h for h in self._hits(self._metric_re, self._metric_phrases, text) if not _overlaps(h, mask)]
        # "sold 1,017 rooms" names the metric "rooms sold" with its words split around the number.
        for m in self._inverted_re.finditer(text) if self._inverted_re else ():
            metric_id = self._inverted.get((m.group("verb").lower(), m.group("noun").lower()))
            h = _Hit(m.start("noun"), m.end("noun"), metric_id or "")
            if metric_id and not _overlaps(h, mask + hits):
                hits.append(h)
        return sorted(hits, key=lambda h: h.start)

    def entities(self, text: str, mask: list[_Hit]) -> list[_Hit]:
        return [h for h in self._hits(self._entity_re, self._entity_phrases, text) if not _overlaps(h, mask)]


# Words that may sit right before a generic metric word ("revenue", "churn") without changing
# which metric it is. Anything else ("Spa revenue", "Weekend churn") names a different metric.
_QUALIFIER_OK = set(
    """the a an its their our his her this that these those which whose what and or but nor while whereas
    with without of for in on at by from to as into than via per across within over under after before during
    was were is are be been being has had have did do does ran saw posted recorded reported delivered generated
    achieved drove reached closed finished ended kept held maintained hit landed came totalled totaled averaged
    total overall net gross weekly monthly daily quarterly annual yearly average combined blended aggregate
    portfolio company business group all strong weak record solid flat steady also still only both""".split()
)


def _qualifier(text: str, hit: _Hit, entity_hits: list[_Hit]) -> str | None:
    """The word that turns a generic metric word into a different metric, e.g. "Spa" in "Spa revenue"."""
    matched = text[hit.start : hit.end]
    if " " in matched.strip() or not any(c.islower() for c in matched):
        return None  # multi-word phrases and acronyms (ADR, MRR) are specific already
    before = text[: hit.start]
    m = re.search(r"([A-Za-z][A-Za-z'’-]*)[ \t]+$", before)
    if not m:
        return None  # start of text, or preceded by punctuation or a number
    word = m.group(1)
    if word.endswith(("'s", "’s", "'", "’")):
        return None  # a possessive names whose metric it is: "Harbor View's occupancy"
    if any(e.end == m.end(1) for e in entity_hits):
        return None  # "Harbor View revenue"
    if word.lower() in _QUALIFIER_OK or word.lower() in _DIRECTION_WORDS:
        return None
    return word


def _names_a_thing(text: str, n: NumberMention, sentence_start: int, known: list[_Hit]) -> bool:
    """A bare integer after a capitalised word mid-sentence is part of a name: "Tower 2", "Terminal 4".

    Entity, metric and basis words are excluded, so "Enterprise 3" in a list of segments is still a claim.
    """
    if n.unit is not Unit.NONE or n.currency or n.scale != 1.0 or n.sign is not None or not n.text.isdigit():
        return False
    m = re.search(r"([A-Z][a-z]+)[ \t]+$", text[sentence_start : n.start])
    if not m:
        return False
    word_start = sentence_start + m.start(1)
    if not text[sentence_start:word_start].strip(" \t\n#*-•(\"'"):
        return False  # first word of the sentence: "Sold 42 ..." is capitalised because it starts the sentence
    return not any(h.start <= word_start < h.end for h in known)


def _overlaps(h: _Hit, others: list[_Hit]) -> bool:
    return any(h.start < o.end and o.start < h.end for o in others)


# --- extraction -------------------------------------------------------------------------


@dataclass
class ExtractOptions:
    carry_context: bool = True  # resolve metric/entity/basis from earlier clauses and sentences
    use_basis: bool = True  # attribute comparison bases (ablation switch)


@dataclass
class _Clause:
    start: int
    end: int


def _clauses(text: str, s: int, e: int) -> list[_Clause]:
    out: list[_Clause] = []
    cur = s
    for m in _CLAUSE_BREAK.finditer(text, s, e):
        # Commas inside numbers ("1,234") never match because the pattern needs a space.
        if m.start() > cur:
            out.append(_Clause(cur, m.start()))
        cur = m.end()
    if cur < e:
        out.append(_Clause(cur, e))
    return out


def _nearest(hits: list[_Hit], pos: int, lo: int, hi: int) -> _Hit | None:
    inside = [h for h in hits if lo <= h.start and h.end <= hi]
    before = [h for h in inside if h.end <= pos]
    if before:
        return max(before, key=lambda h: h.end)
    after = [h for h in inside if h.start >= pos]
    return min(after, key=lambda h: h.start) if after else None


def _resolve_direction(raw: int, metric_higher_is_better: bool | None) -> int | None:
    if raw in (_GOOD, _BAD):
        if metric_higher_is_better is None:
            return None
        good = raw == _GOOD
        return _UP if good == metric_higher_is_better else _DOWN
    return raw


def extract_claims(text: str, sheet: FactSheet, options: ExtractOptions | None = None) -> list[Claim]:
    opts = options or ExtractOptions()
    lex = Lexicon(sheet)
    basis_hits = lex.bases(text) if opts.use_basis else []
    metric_hits = lex.metrics(text, basis_hits)
    entity_hits = lex.entities(text, basis_hits + metric_hits)
    for h in metric_hits:
        q = _qualifier(text, h, entity_hits)
        if q:
            # An unknown metric: claims about it are reported as unverifiable, never checked against a lookalike.
            h.value = f"?{q.lower()} {text[h.start : h.end].lower()}"
    numbers = list(iter_numbers(text))
    # A verb that is itself the hedge ("topped $460K", "exceeded 70%") bounds a level; it is not a change.
    hedge_verb_ends = {n.start for n in numbers if n.hedge is not Hedge.EXACT}
    direction_hits = [
        (m.start(), m.end(), _DIRECTION_WORDS[m.group(1).lower()])
        for m in _DIRECTION_RE.finditer(text)
        if not _NOT_DIRECTION_AFTER.match(text, m.end()) and _BLANKS.match(text, m.end()).end() not in hedge_verb_ends  # type: ignore[union-attr]
    ]

    claims: list[Claim] = []
    heading_entity: str | None = None
    para_metric: str | None = None
    para_entity: str | None = None
    para_basis: str | None = None
    last_sentence_end = 0

    for s, e in _split_sentences(text):
        between = text[last_sentence_end:s]
        if "\n\n" in between or "\n#" in "\n" + between:
            para_metric = para_entity = para_basis = None
        last_sentence_end = e
        sentence = text[s:e]
        is_heading = sentence.lstrip().startswith("#")
        s_entities = [h for h in entity_hits if s <= h.start < e]
        if is_heading:
            heading_entity = s_entities[0].value if s_entities else None
            para_metric = para_entity = para_basis = None
            continue

        s_metrics = [h for h in metric_hits if s <= h.start < e]
        s_bases = [h for h in basis_hits if s <= h.start < e]
        s_numbers = [
            n for n in numbers if s <= n.start < e and not _names_a_thing(text, n, s, entity_hits + metric_hits + basis_hits)
        ]
        s_dirs = [d for d in direction_hits if s <= d[0] < e]
        clauses = _clauses(text, s, e)
        sentence_claims: list[Claim] = []
        used_direction_spans: set[tuple[int, int]] = set()

        def clause_of(pos: int) -> _Clause:
            for c in clauses:
                if c.start <= pos < c.end:
                    return c
            return _Clause(s, e)

        def resolve_metric(pos: int, cl: _Clause, notes: list[str]) -> str | None:
            h = _nearest(s_metrics, pos, cl.start, cl.end)
            if h:
                return h.value
            if not opts.carry_context:
                return None
            earlier = [m for m in s_metrics if m.end <= cl.start]
            if earlier:
                notes.append("metric carried from earlier clause")
                return earlier[-1].value
            later = [m for m in s_metrics if m.start >= cl.end]
            if later:
                notes.append("metric taken from later clause")
                return later[0].value
            # Across sentences, only an anaphoric subject ("It", "This") inherits the metric;
            # "Staff turnover rose 3%" must not be read as a claim about the previous metric.
            if para_metric and _ANAPHOR.match(sentence.lstrip()):
                notes.append("metric carried from previous sentence")
                return para_metric
            return None

        def resolve_entity(pos: int, cl: _Clause, notes: list[str]) -> str:
            h = _nearest(s_entities, pos, cl.start, cl.end)
            if h:
                return h.value
            if opts.carry_context:
                earlier = [x for x in s_entities if x.end <= cl.start]
                if earlier:
                    return earlier[-1].value
                later = [x for x in s_entities if x.start >= cl.end]
                if later:
                    return later[0].value
                anaphoric = bool(_ANAPHOR.match(sentence.lstrip()))
                if para_entity and anaphoric:
                    notes.append("entity carried from previous sentence")
                    return para_entity
                if heading_entity:
                    notes.append("entity from section heading")
                    return heading_entity
                if para_entity:
                    notes.append("entity carried from previous sentence")
                    return para_entity
            return sheet.total_entity

        def resolve_basis(pos: int, cl: _Clause, notes: list[str]) -> str | None:
            h = _nearest(s_bases, pos, cl.start, cl.end)
            if h:
                return h.value
            if not s_bases:
                if opts.carry_context and para_basis:
                    notes.append("basis carried from previous sentence")
                    return para_basis
                return None
            after = [b for b in s_bases if b.start >= pos]
            notes.append("basis from elsewhere in sentence")
            return (after[0] if after else s_bases[-1]).value

        prev_number_end: dict[int, int] = {}
        for n in s_numbers:
            cl = clause_of(n.start)
            prev_number_end[n.start] = max([m.end for m in s_numbers if cl.start <= m.start < n.start], default=cl.start)

        for n in s_numbers:
            cl = clause_of(n.start)
            notes: list[str] = []
            metric = resolve_metric(n.start, cl, notes)
            entity = resolve_entity(n.start, cl, notes)
            m_spec = sheet.metrics.get(metric) if metric else None
            prefix = text[cl.start : n.start]
            prefix_nohedge = _HEDGE_TAIL.sub("", prefix)
            suffix = text[n.end : cl.end]
            kind: ClaimKind
            direction: int | None = None
            dir_span: tuple[int, int] | None = None

            def direction_before() -> tuple[int, int, int] | None:
                lo = prev_number_end[n.start]
                cands = [d for d in s_dirs if lo <= d[0] and d[1] <= n.start]
                return cands[-1] if cands else None

            after_delta = _DELTA_AFTER.match(suffix)
            if _BASE_MARKER_BEFORE.search(prefix_nohedge):
                kind = ClaimKind.BASE
            elif after_delta:
                kind = ClaimKind.DELTA
                d = next((x for x in s_dirs if x[0] >= n.end and x[0] <= n.end + after_delta.end() + 1), None)
                if d:
                    direction, dir_span = d[2], (d[0], d[1])
            elif _DELTA_NOUN_OF_BEFORE.search(prefix_nohedge):
                kind = ClaimKind.DELTA
            elif _LEVEL_MARKER_BEFORE.search(prefix_nohedge) and n.unit not in (Unit.POINTS, Unit.BPS):
                kind = ClaimKind.LEVEL
            elif direction_before() is not None or n.sign is not None or n.unit in (Unit.POINTS, Unit.BPS):
                kind = ClaimKind.DELTA
            elif m_spec and m_spec.type is not MetricType.RATE and n.unit is Unit.PERCENT:
                kind = ClaimKind.DELTA  # "ADR 3.1%": a percent can only be a change for a currency metric
                notes.append("percent on a non-rate metric read as a change")
            else:
                kind = ClaimKind.LEVEL

            # A base value next to its basis phrase: "a budget of $1.3M", "last year's 74.2%",
            # "versus budgeted $119,991". Not "vs forecast at $152,592" - "at" introduces the current level.
            if kind is ClaimKind.LEVEL:
                for b in s_bases:
                    if not (cl.start <= b.start and b.end <= n.start):
                        continue
                    gap = text[b.end : n.start]
                    for mh in s_metrics:
                        if b.end <= mh.start and mh.end <= n.start:
                            gap = gap.replace(text[mh.start : mh.end], " ")
                    if _BASE_GAP.fullmatch(gap):
                        kind = ClaimKind.BASE
                        break
            # "churn of 2.3% (2.2% last month)": a number directly followed by a basis phrase.
            if kind is ClaimKind.LEVEL:
                lead = re.match(r"\s*(?:in\s+|for\s+)?(?:the\s+)?", suffix)
                at = n.end + (lead.end() if lead else 0)
                follows = next((b for b in s_bases if b.start == at), None)
                if (
                    follows is not None
                    and not _ADVERBIAL_BASIS.fullmatch(text[follows.start : follows.end])
                    and not re.search(r"\bto\s*$", prefix_nohedge, re.IGNORECASE)
                ):
                    kind = ClaimKind.BASE

            if kind is ClaimKind.DELTA and direction is None:
                if n.sign is not None:
                    direction = n.sign
                else:
                    d = direction_before()
                    if d is None:
                        m_after = next((x for x in s_dirs if n.end <= x[0] <= n.end + 25 and x[1] <= cl.end), None)
                        d = m_after
                    if d is None and opts.carry_context:
                        earlier = [x for x in s_dirs if x[1] <= n.start]
                        if earlier:
                            d = earlier[-1]
                            notes.append("direction carried from earlier in sentence")
                    if d is None:
                        m_noun = re.search(rf"({_DELTA_NOUN})\s+of\s+(?:a|an|the)?\s*$", prefix_nohedge, re.IGNORECASE)
                        if m_noun and m_noun.group(1).lower() in _DIRECTION_WORDS:
                            direction = _DIRECTION_WORDS[m_noun.group(1).lower()]
                    if d is not None:
                        direction, dir_span = d[2], (d[0], d[1])
                if direction is not None:
                    direction = _resolve_direction(direction, m_spec.higher_is_better if m_spec else None)

            basis = resolve_basis(n.start, cl, notes) if kind in (ClaimKind.DELTA, ClaimKind.BASE) else None
            if dir_span:
                used_direction_spans.add(dir_span)
            claim = Claim(
                id=0,
                kind=kind,
                start=n.start,
                end=n.end,
                text=n.text,
                sentence=sentence,
                number=n,
                metric=metric,
                entity=entity,
                basis=basis,
                direction=direction,
                direction_span=dir_span,
                notes=notes,
            )
            sentence_claims.append(claim)

        # Qualitative direction claims: "ADR declined vs budget" with no number attached.
        for d_start, d_end, raw in s_dirs:
            if (d_start, d_end) in used_direction_spans:
                continue
            cl = clause_of(d_start)
            if any(n.start <= d_start < n.end for n in s_numbers):
                continue
            notes = []
            metric_hit = _nearest(s_metrics, d_start, cl.start, cl.end)
            if metric_hit is None:
                continue  # direction words without a metric in the same clause are too vague to check
            entity = resolve_entity(d_start, cl, notes)
            m_spec = sheet.metrics.get(metric_hit.value)
            direction = _resolve_direction(raw, m_spec.higher_is_better if m_spec else None)
            if direction is None:
                continue
            sentence_claims.append(
                Claim(
                    id=0,
                    kind=ClaimKind.DIRECTION,
                    start=d_start,
                    end=d_end,
                    text=text[d_start:d_end],
                    sentence=sentence,
                    number=None,
                    metric=metric_hit.value,
                    entity=entity,
                    basis=resolve_basis(d_start, cl, notes),
                    direction=direction,
                    direction_span=(d_start, d_end),
                    notes=notes,
                )
            )

        sentence_claims.sort(key=lambda c: c.start)
        claims.extend(sentence_claims)
        if s_metrics:
            para_metric = s_metrics[0].value  # "It"/"This" refers back to the subject
        if s_entities:
            para_entity = s_entities[0].value
        if s_bases:
            para_basis = s_bases[-1].value

    for i, c in enumerate(claims):
        c.id = i
    return claims
