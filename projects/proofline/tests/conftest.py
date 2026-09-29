import pytest

from proofline.bench.datasets import hotel_weekly
from proofline.facts import DatasetSpec, FactSheet, compute_facts

TINY_SPEC = {
    "name": "tiny",
    "entity_column": "store",
    "period_column": "month",
    "currency": "USD",
    "total": {"id": "total", "name": "Total", "aliases": ["overall", "the business"]},
    "bases": [
        {"id": "last_year", "label": "last year", "suffix": "_ly"},
        {"id": "budget", "label": "budget", "suffix": "_budget"},
        {"id": "prior", "label": "last month", "source": "previous_period"},
    ],
    "metrics": [
        {
            "id": "revenue",
            "label": "Revenue",
            "type": "currency",
            "column": "revenue",
            "decimals": 0,
            "synonyms": ["revenue", "sales"],
        },
        {"id": "orders", "label": "Orders", "type": "count", "column": "orders", "decimals": 0},
        {
            "id": "aov",
            "label": "AOV",
            "type": "currency",
            "numerator": "revenue",
            "denominator": "orders",
            "decimals": 2,
            "synonyms": ["average order value"],
        },
        {
            "id": "conversion",
            "label": "Conversion rate",
            "type": "rate",
            "numerator": "orders",
            "denominator": "visits",
            "multiplier": 100,
            "synonyms": ["conversion"],
        },
        {
            "id": "returns",
            "label": "Return rate",
            "type": "rate",
            "numerator": "returned",
            "denominator": "orders",
            "multiplier": 100,
            "higher_is_better": False,
        },
    ],
}


def _row(store, month, revenue, orders, visits, returned, ly=None, budget=None):
    r = {"store": store, "month": month, "revenue": revenue, "orders": orders, "visits": visits, "returned": returned}
    for suffix, vals in (("_ly", ly), ("_budget", budget)):
        rev, o, v, ret = vals
        r.update({"revenue" + suffix: rev, "orders" + suffix: o, "visits" + suffix: v, "returned" + suffix: ret})
    return r


TINY_ROWS = [
    _row("Alpha", "2026-07", 90_000, 900, 30_000, 45, ly=(80_000, 800, 32_000, 40), budget=(95_000, 950, 31_000, 38)),
    _row("Beta", "2026-07", 40_000, 250, 10_000, 30, ly=(42_000, 300, 9_000, 20), budget=(38_000, 260, 10_000, 26)),
    _row("Alpha", "2026-08", 100_000, 1_000, 40_000, 50, ly=(90_000, 1_000, 36_000, 60), budget=(110_000, 1_050, 40_000, 42)),
    _row("Beta", "2026-08", 60_000, 300, 10_000, 30, ly=(50_000, 250, 10_000, 25), budget=(55_000, 280, 11_000, 28)),
]


@pytest.fixture(scope="session")
def tiny() -> FactSheet:
    return compute_facts(DatasetSpec.from_dict(TINY_SPEC), TINY_ROWS)


@pytest.fixture(scope="session")
def hotel() -> FactSheet:
    spec, rows = hotel_weekly()
    return compute_facts(DatasetSpec.from_dict(spec), rows)
