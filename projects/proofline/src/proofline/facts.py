"""The ground truth: a deterministic fact sheet computed from tabular data.

The model never does arithmetic that matters. Every number a report is allowed to
state is computed here, once, from the rows, and given a stable ID. The verifier then
checks prose against these facts, and the generator is asked to cite them.

Ratio metrics (ADR = revenue / rooms sold, conversion = orders / sessions) are always
computed as a ratio of sums, never as an average of per-entity ratios. Averaging ratios is
the most common way hand-built reports get portfolio totals wrong.
"""

from __future__ import annotations

import csv
import json
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import asdict, dataclass, field
from enum import StrEnum
from pathlib import Path
from typing import Any


class MetricType(StrEnum):
    CURRENCY = "currency"
    RATE = "rate"  # stored and written as a percentage, e.g. occupancy 78.4%
    COUNT = "count"
    MULTIPLE = "multiple"  # e.g. 1.4x


class FactKind(StrEnum):
    LEVEL = "level"  # value in the reported period
    BASE = "base"  # value in the comparison (last year, budget, prior period, ...)
    DELTA_ABS = "delta_abs"  # level - base, in the metric's unit (points for rates)
    DELTA_PCT = "delta_pct"  # (level - base) / |base| * 100


@dataclass(frozen=True)
class MetricSpec:
    id: str
    label: str
    type: MetricType
    synonyms: tuple[str, ...] = ()
    column: str | None = None
    numerator: str | None = None
    denominator: str | None = None
    multiplier: float = 1.0
    higher_is_better: bool = True
    decimals: int = 1

    def columns(self) -> tuple[str, ...]:
        if self.column:
            return (self.column,)
        assert self.numerator and self.denominator, f"metric {self.id} needs column or numerator/denominator"
        return (self.numerator, self.denominator)

    def formula(self) -> str:
        if self.column:
            return f"sum({self.column})"
        scale = f" x {self.multiplier:g}" if self.multiplier != 1 else ""
        return f"sum({self.numerator}) / sum({self.denominator}){scale}"


@dataclass(frozen=True)
class BasisSpec:
    id: str
    label: str
    source: str = "suffix"  # "suffix" (columns like revenue_ly) or "previous_period"
    suffix: str | None = None
    phrases: tuple[str, ...] = ()


@dataclass(frozen=True)
class EntitySpec:
    id: str
    name: str
    aliases: tuple[str, ...] = ()


@dataclass(frozen=True)
class DatasetSpec:
    name: str
    entity_column: str
    period_column: str
    metrics: tuple[MetricSpec, ...]
    bases: tuple[BasisSpec, ...] = ()
    currency: str = "USD"
    current_period: str | None = None
    total: EntitySpec = EntitySpec("total", "Total", ("overall", "in total", "combined"))
    entity_aliases: Mapping[str, tuple[str, ...]] = field(default_factory=dict)

    @staticmethod
    def from_dict(d: Mapping[str, Any]) -> DatasetSpec:
        metrics = tuple(
            MetricSpec(
                id=m["id"],
                label=m.get("label", m["id"]),
                type=MetricType(m["type"]),
                synonyms=tuple(m.get("synonyms", ())),
                column=m.get("column"),
                numerator=m.get("numerator"),
                denominator=m.get("denominator"),
                multiplier=float(m.get("multiplier", 1.0)),
                higher_is_better=bool(m.get("higher_is_better", True)),
                decimals=int(m.get("decimals", 1)),
            )
            for m in d["metrics"]
        )
        bases = tuple(
            BasisSpec(
                id=b["id"],
                label=b.get("label", b["id"]),
                source=b.get("source", "suffix"),
                suffix=b.get("suffix"),
                phrases=tuple(b.get("phrases", ())),
            )
            for b in d.get("bases", ())
        )
        total_d = d.get("total", {})
        total = EntitySpec(
            id=total_d.get("id", "total"),
            name=total_d.get("name", "Total"),
            aliases=tuple(total_d.get("aliases", ("overall", "in total", "combined"))),
        )
        return DatasetSpec(
            name=d["name"],
            entity_column=d["entity_column"],
            period_column=d["period_column"],
            metrics=metrics,
            bases=bases,
            currency=d.get("currency", "USD"),
            current_period=d.get("current_period"),
            total=total,
            entity_aliases={k: tuple(v) for k, v in d.get("entity_aliases", {}).items()},
        )

    @staticmethod
    def load(path: str | Path) -> DatasetSpec:
        text = Path(path).read_text(encoding="utf-8")
        if str(path).endswith((".yaml", ".yml")):
            import yaml  # optional dependency, only needed for YAML specs

            return DatasetSpec.from_dict(yaml.safe_load(text))
        return DatasetSpec.from_dict(json.loads(text))


@dataclass(frozen=True)
class Fact:
    id: str
    metric: str
    entity: str
    period: str
    kind: FactKind
    basis: str | None
    value: float
    unit: str  # currency | percent | points | count | multiple
    derivation: str

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["kind"] = self.kind.value
        return d


def fact_id(metric: str, entity: str, kind: FactKind, basis: str | None) -> str:
    return ":".join(p for p in (metric, entity, kind.value, basis) if p)


@dataclass
class FactSheet:
    dataset: str
    period: str
    currency: str
    facts: list[Fact]
    metrics: dict[str, MetricSpec]
    entities: dict[str, EntitySpec]
    bases: dict[str, BasisSpec]
    total_entity: str

    def __post_init__(self) -> None:
        self._by_id = {f.id: f for f in self.facts}

    def get(self, id_: str) -> Fact | None:
        return self._by_id.get(id_)

    def find(
        self,
        metric: str | None = None,
        entity: str | None = None,
        kind: FactKind | None = None,
        basis: str | None = None,
        *,
        any_basis: bool = False,
    ) -> list[Fact]:
        out = []
        for f in self.facts:
            if metric is not None and f.metric != metric:
                continue
            if entity is not None and f.entity != entity:
                continue
            if kind is not None and f.kind != kind:
                continue
            if not any_basis and basis is not None and f.basis != basis:
                continue
            out.append(f)
        return out

    # --- serialisation: a fact sheet is self-describing so it can travel over MCP / JSON ---

    def to_dict(self) -> dict[str, Any]:
        return {
            "dataset": self.dataset,
            "period": self.period,
            "currency": self.currency,
            "total_entity": self.total_entity,
            "metrics": [_metric_to_dict(m) for m in self.metrics.values()],
            "entities": [asdict(e) for e in self.entities.values()],
            "bases": [asdict(b) for b in self.bases.values()],
            "facts": [f.to_dict() for f in self.facts],
        }

    def to_json(self, indent: int | None = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @staticmethod
    def from_dict(d: Mapping[str, Any]) -> FactSheet:
        metrics = {
            m["id"]: MetricSpec(**{**m, "type": MetricType(m["type"]), "synonyms": tuple(m["synonyms"])}) for m in d["metrics"]
        }
        entities = {e["id"]: EntitySpec(e["id"], e["name"], tuple(e.get("aliases", ()))) for e in d["entities"]}
        bases = {b["id"]: BasisSpec(**{**b, "phrases": tuple(b.get("phrases", ()))}) for b in d["bases"]}
        facts = [Fact(**{**f, "kind": FactKind(f["kind"])}) for f in d["facts"]]
        return FactSheet(
            dataset=d["dataset"],
            period=d["period"],
            currency=d["currency"],
            facts=facts,
            metrics=metrics,
            entities=entities,
            bases=bases,
            total_entity=d["total_entity"],
        )

    @staticmethod
    def from_json(text: str) -> FactSheet:
        return FactSheet.from_dict(json.loads(text))

    def to_prompt_table(self) -> str:
        """Compact, citation-friendly listing of the facts for an LLM prompt."""
        lines = ["fact_id | value | unit"]
        for f in self.facts:
            lines.append(f"{f.id} | {_plain(f.value)} | {f.unit}")
        return "\n".join(lines)


def _metric_to_dict(m: MetricSpec) -> dict[str, Any]:
    d = asdict(m)
    d["type"] = m.type.value
    d["synonyms"] = list(m.synonyms)
    return d


def _plain(v: float) -> str:
    return f"{v:.4f}".rstrip("0").rstrip(".") if abs(v) < 1e6 else f"{v:.2f}"


# --- computation ------------------------------------------------------------------------


def load_rows(path: str | Path) -> list[dict[str, str]]:
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def _slug(name: str) -> str:
    return "-".join("".join(c.lower() if c.isalnum() else " " for c in name).split())


def _to_float(raw: Any) -> float:
    if isinstance(raw, int | float):
        return float(raw)
    s = str(raw).strip().replace(",", "")
    if s == "":
        raise ValueError("empty value")
    return float(s)


def _metric_value(metric: MetricSpec, rows: Sequence[Mapping[str, Any]], suffix: str = "") -> float | None:
    cols = [c + suffix for c in metric.columns()]
    if not rows or any(c not in rows[0] for c in cols):
        return None
    sums = [sum(_to_float(r[c]) for r in rows) for c in cols]
    if metric.column:
        return sums[0] * metric.multiplier
    num, den = sums
    if den == 0:
        return None
    return num / den * metric.multiplier


def _unit_for(metric: MetricSpec, kind: FactKind) -> str:
    if kind is FactKind.DELTA_PCT:
        return "percent"
    if metric.type is MetricType.RATE:
        return "points" if kind is FactKind.DELTA_ABS else "percent"
    return metric.type.value


def compute_facts(spec: DatasetSpec, rows: Iterable[Mapping[str, Any]]) -> FactSheet:
    rows = list(rows)
    if not rows:
        raise ValueError("no rows")
    periods = sorted({str(r[spec.period_column]) for r in rows})
    current = spec.current_period or periods[-1]
    if current not in periods:
        raise ValueError(f"current period {current!r} not in data (have {periods[-3:]}...)")
    previous = periods[periods.index(current) - 1] if periods.index(current) > 0 else None

    names = sorted({str(r[spec.entity_column]) for r in rows})
    entities: dict[str, EntitySpec] = {}
    for name in names:
        eid = _slug(name)
        entities[eid] = EntitySpec(eid, name, spec.entity_aliases.get(name, ()))
    entities[spec.total.id] = spec.total

    def rows_for(entity_id: str, period: str) -> list[Mapping[str, Any]]:
        return [
            r
            for r in rows
            if str(r[spec.period_column]) == period
            and (entity_id == spec.total.id or _slug(str(r[spec.entity_column])) == entity_id)
        ]

    facts: list[Fact] = []
    for eid, ent in entities.items():
        cur_rows = rows_for(eid, current)
        scope = "all entities" if eid == spec.total.id else ent.name
        for metric in spec.metrics:
            level = _metric_value(metric, cur_rows)
            if level is None:
                continue
            facts.append(
                Fact(
                    fact_id(metric.id, eid, FactKind.LEVEL, None),
                    metric.id,
                    eid,
                    current,
                    FactKind.LEVEL,
                    None,
                    level,
                    _unit_for(metric, FactKind.LEVEL),
                    f"{metric.formula()} for {scope}, {current}",
                )
            )
            for basis in spec.bases:
                if basis.source == "previous_period":
                    if previous is None:
                        continue
                    base = _metric_value(metric, rows_for(eid, previous))
                    where = f"{scope}, {previous}"
                else:
                    base = _metric_value(metric, cur_rows, basis.suffix or "")
                    where = f"{scope}, {current} ({basis.label}, columns *{basis.suffix})"
                if base is None:
                    continue
                facts.append(
                    Fact(
                        fact_id(metric.id, eid, FactKind.BASE, basis.id),
                        metric.id,
                        eid,
                        current,
                        FactKind.BASE,
                        basis.id,
                        base,
                        _unit_for(metric, FactKind.BASE),
                        f"{metric.formula()} for {where}",
                    )
                )
                facts.append(
                    Fact(
                        fact_id(metric.id, eid, FactKind.DELTA_ABS, basis.id),
                        metric.id,
                        eid,
                        current,
                        FactKind.DELTA_ABS,
                        basis.id,
                        level - base,
                        _unit_for(metric, FactKind.DELTA_ABS),
                        f"level - {basis.label} = {_plain(level)} - {_plain(base)}",
                    )
                )
                if base != 0:
                    facts.append(
                        Fact(
                            fact_id(metric.id, eid, FactKind.DELTA_PCT, basis.id),
                            metric.id,
                            eid,
                            current,
                            FactKind.DELTA_PCT,
                            basis.id,
                            (level - base) / abs(base) * 100.0,
                            "percent",
                            f"(level - {basis.label}) / |{basis.label}| x 100 = ({_plain(level)} - {_plain(base)}) / {_plain(abs(base))} x 100",
                        )
                    )

    return FactSheet(
        dataset=spec.name,
        period=current,
        currency=spec.currency,
        facts=facts,
        metrics={m.id: m for m in spec.metrics},
        entities=entities,
        bases={b.id: b for b in spec.bases},
        total_entity=spec.total.id,
    )
