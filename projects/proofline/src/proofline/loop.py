"""Guarded generation: draft with an LLM, verify every number, send back only what is wrong.

    facts --> prompt --> LLM draft --> verify --+--> pass: done
                            ^                   |
                            +---- feedback -----+  (at most ``max_rounds`` drafts)
                                                |
                                                +--> still failing: deterministic repair, re-verify

The model writes; the fact sheet decides. Feedback names the sentence, the wrong token and
the fact it should match, so a redraft is a targeted edit rather than a fresh roll of the dice.
Each round is recorded so the loop's behaviour (errors per round, tokens, latency) can be measured.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .facts import FactKind, FactSheet, MetricType
from .providers.base import Completion, Message, Provider
from .repair import Edit, repair_text
from .verify import Report, Status, VerifyOptions, verify_text

SYSTEM_PROMPT = """You write concise, accurate performance commentary for business reports.

Rules:
- Every number you write must come from the FACTS provided. Never compute, estimate or invent a number.
- Round naturally: rates and percent changes to 1 decimal place, money to the precision shown.
- Whenever you describe a change, name the comparison: vs last year, vs budget, vs forecast, or vs the prior period.
- Changes in rate metrics (for example occupancy or conversion rate) are percentage points: write "pts". A relative change is written with "%".
- Name the entity (property, region, segment, or the overall total) in each sentence, or use a markdown heading per entity.
- Plain prose paragraphs. No tables, no bullet lists, no preamble such as "Here is the summary"."""


def facts_brief(sheet: FactSheet) -> str:
    """A readable fact listing grouped by entity and metric - easier for a model to copy from than raw IDs."""
    lines = [f"Dataset: {sheet.dataset}. Period: {sheet.period}. Currency: {sheet.currency}."]
    lines.append("Comparison bases: " + ", ".join(f"{b.label}" for b in sheet.bases.values()) + ".")
    order = [sheet.total_entity] + [e for e in sheet.entities if e != sheet.total_entity]
    for eid in order:
        ent = sheet.entities[eid]
        lines.append(f"\n## {ent.name}")
        for m in sheet.metrics.values():
            level = sheet.get(f"{m.id}:{eid}:level")
            if level is None:
                continue
            parts = [f"{m.label}: {_show(level.value, m.type, m.decimals)}"]
            for b in sheet.bases.values():
                base = sheet.get(f"{m.id}:{eid}:base:{b.id}")
                dabs = sheet.get(f"{m.id}:{eid}:delta_abs:{b.id}")
                dpct = sheet.get(f"{m.id}:{eid}:delta_pct:{b.id}")
                if base is None or dabs is None:
                    continue
                change = _show_delta(dabs.value, m.type, m.decimals)
                if dpct is not None:
                    change += f", {dpct.value:+.1f}%"
                parts.append(f"vs {b.label} {_show(base.value, m.type, m.decimals)} ({change})")
            polarity = "" if m.higher_is_better else " [lower is better]"
            lines.append("- " + "; ".join(parts) + polarity)
    return "\n".join(lines)


def _show(v: float, t: MetricType, decimals: int) -> str:
    if t is MetricType.RATE:
        return f"{v:.1f}%"
    if t is MetricType.CURRENCY:
        return f"{v:,.{decimals}f}"
    return f"{v:,.{decimals}f}"


def _show_delta(v: float, t: MetricType, decimals: int) -> str:
    if t is MetricType.RATE:
        return f"{v:+.1f} pts"
    return f"{v:+,.{decimals}f}"


def feedback_message(report: Report, sheet: FactSheet) -> str:
    problems = [v for v in report.verdicts if v.status is not Status.SUPPORTED]
    lines = [f"Your draft has {len(problems)} problem(s). Fix only these and keep everything else unchanged:"]
    for i, v in enumerate(problems, 1):
        sentence = v.claim.sentence.strip()
        if v.status is Status.CONTRADICTED:
            fix = f"{v.message}."
            if v.fact is not None and v.fact.kind in (FactKind.DELTA_ABS, FactKind.DELTA_PCT, FactKind.LEVEL, FactKind.BASE):
                fix += f" The correct fact is {v.fact.id} = {v.fact.value:.4g} ({v.fact.unit})."
        else:
            fix = f"This cannot be checked against the facts ({v.message}). Tie it to a fact or remove it."
        lines.append(f'{i}. In "{sentence}": "{v.claim.text}" - {fix}')
    lines.append("Return the complete corrected text only.")
    return "\n".join(lines)


@dataclass
class RoundTrace:
    round: int
    text: str
    counts: dict[str, int]
    problems: list[str]
    completion: Completion | None


@dataclass
class GuardedResult:
    text: str
    report: Report
    rounds: list[RoundTrace] = field(default_factory=list)
    edits: list[Edit] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.report.passed

    @property
    def first_draft(self) -> RoundTrace:
        return self.rounds[0]


def guarded_generate(
    provider: Provider,
    sheet: FactSheet,
    request: str,
    *,
    max_rounds: int = 3,
    max_unverifiable: int = 0,
    repair: bool = True,
    verify_options: VerifyOptions | None = None,
) -> GuardedResult:
    messages = [Message("user", f"FACTS\n{facts_brief(sheet)}\n\nTASK\n{request}")]
    rounds: list[RoundTrace] = []
    report: Report | None = None
    for i in range(1, max_rounds + 1):
        completion = provider.complete(SYSTEM_PROMPT, messages)
        report = verify_text(completion.text.strip(), sheet, verify_options)
        problems = [
            f"{v.status.value}:{v.reason.value}:{v.claim.text}" for v in report.verdicts if v.status is not Status.SUPPORTED
        ]
        rounds.append(RoundTrace(i, report.text, report.counts, problems, completion))
        if report.passed and len(report.unverifiable) <= max_unverifiable:
            return GuardedResult(report.text, report, rounds)
        if i < max_rounds:
            messages += [Message("assistant", completion.text), Message("user", feedback_message(report, sheet))]
    assert report is not None
    if not repair or report.passed:
        return GuardedResult(report.text, report, rounds)
    fixed, edits = repair_text(report, sheet)
    final = verify_text(fixed, sheet, verify_options)
    rounds.append(RoundTrace(len(rounds) + 1, fixed, final.counts, [], None))
    return GuardedResult(fixed, final, rounds, edits)
