"""Seeded synthetic datasets for three reporting domains.

The data is synthetic on purpose: the benchmark needs ground truth for every number, and
nothing here should resemble any real company's figures. The domains are chosen for the
failure modes they exercise:

* hotel_weekly   - rate metrics (occupancy) where points vs percent confusion is common,
                   ratio metrics (ADR, RevPAR), four comparison bases.
* retail_monthly - INR amounts written in lakh / crore, a lower-is-better metric (return rate).
* saas_monthly   - small counts, churn (lower is better), month-over-month and plan bases.
"""

from __future__ import annotations

import random
from typing import Any

Rows = list[dict[str, Any]]


def hotel_weekly(seed: int = 7) -> tuple[dict[str, Any], Rows]:
    rng = random.Random(seed)
    props = {"Harbor View": 220, "Parkside Suites": 140, "Cedar Lodge": 90, "Riverside Inn": 160}
    weeks = ["2026-W29", "2026-W30", "2026-W31", "2026-W32"]
    rows: Rows = []
    for name, rooms in props.items():
        base_occ = rng.uniform(0.62, 0.84)
        base_adr = rng.uniform(120, 260)
        for w in weeks:
            avail = rooms * 7
            occ = min(0.98, max(0.35, base_occ + rng.uniform(-0.08, 0.08)))
            adr = base_adr * rng.uniform(0.9, 1.1)
            sold = round(avail * occ)
            row: dict[str, Any] = {
                "property": name,
                "week": w,
                "rooms_available": avail,
                "rooms_sold": sold,
                "room_revenue": round(sold * adr, 2),
            }
            for suffix, occ_shift, adr_shift in (("_ly", -0.03, 0.96), ("_budget", 0.02, 1.02), ("_fcst", 0.0, 1.0)):
                o = min(0.98, max(0.3, occ + occ_shift + rng.uniform(-0.05, 0.05)))
                a = adr * adr_shift * rng.uniform(0.93, 1.07)
                s = round(avail * o)
                row["rooms_available" + suffix] = avail
                row["rooms_sold" + suffix] = s
                row["room_revenue" + suffix] = round(s * a, 2)
            rows.append(row)
    spec = {
        "name": "hotel_weekly",
        "entity_column": "property",
        "period_column": "week",
        "currency": "USD",
        "total": {
            "id": "portfolio",
            "name": "Portfolio",
            "aliases": ["the portfolio", "portfolio", "overall", "across the portfolio", "all properties"],
        },
        "entity_aliases": {"Harbor View": ["Harbor View Hotel"], "Riverside Inn": ["Riverside"]},
        "bases": [
            {"id": "last_year", "label": "last year", "suffix": "_ly"},
            {"id": "budget", "label": "budget", "suffix": "_budget"},
            {"id": "forecast", "label": "forecast", "suffix": "_fcst"},
            {"id": "prior", "label": "last week", "source": "previous_period"},
        ],
        "metrics": [
            {
                "id": "occupancy",
                "label": "Occupancy",
                "type": "rate",
                "numerator": "rooms_sold",
                "denominator": "rooms_available",
                "multiplier": 100,
                "synonyms": ["occupancy", "occ", "occupancy rate"],
            },
            {
                "id": "adr",
                "label": "ADR",
                "type": "currency",
                "numerator": "room_revenue",
                "denominator": "rooms_sold",
                "decimals": 2,
                "synonyms": ["ADR", "average daily rate", "average rate", "room rate"],
            },
            {
                "id": "revpar",
                "label": "RevPAR",
                "type": "currency",
                "numerator": "room_revenue",
                "denominator": "rooms_available",
                "decimals": 2,
                "synonyms": ["RevPAR", "revenue per available room"],
            },
            {
                "id": "room_revenue",
                "label": "Room revenue",
                "type": "currency",
                "column": "room_revenue",
                "decimals": 0,
                "synonyms": ["room revenue", "rooms revenue", "revenue"],
            },
            {
                "id": "rooms_sold",
                "label": "Rooms sold",
                "type": "count",
                "column": "rooms_sold",
                "decimals": 0,
                "synonyms": ["rooms sold", "room nights", "room nights sold"],
            },
        ],
    }
    return spec, rows


def retail_monthly(seed: int = 11) -> tuple[dict[str, Any], Rows]:
    rng = random.Random(seed)
    regions = {"North": 1.3, "South": 1.0, "East": 0.7, "West": 1.1}
    months = ["2026-05", "2026-06", "2026-07", "2026-08"]
    rows: Rows = []
    for name, size in regions.items():
        base_sessions = size * rng.uniform(400_000, 500_000)
        base_conv = rng.uniform(0.02, 0.032)
        base_aov = rng.uniform(1_500, 2_200)
        base_ret = rng.uniform(0.05, 0.09)
        for mth in months:
            sessions = round(base_sessions * rng.uniform(0.92, 1.08))
            conv = base_conv * rng.uniform(0.93, 1.07)
            orders = round(sessions * conv)
            aov = base_aov * rng.uniform(0.95, 1.05)
            ret = base_ret * rng.uniform(0.9, 1.1)
            row: dict[str, Any] = {
                "region": name,
                "month": mth,
                "sessions": sessions,
                "orders": orders,
                "revenue": round(orders * aov),
                "returns": round(orders * ret),
            }
            for suffix, g in (("_ly", 0.9), ("_budget", 1.04)):
                s2 = round(sessions * g * rng.uniform(0.95, 1.05))
                o2 = round(s2 * conv * rng.uniform(0.93, 1.07))
                row["sessions" + suffix] = s2
                row["orders" + suffix] = o2
                row["revenue" + suffix] = round(o2 * aov * rng.uniform(0.95, 1.05))
                row["returns" + suffix] = round(o2 * ret * rng.uniform(0.85, 1.15))
            rows.append(row)
    spec = {
        "name": "retail_monthly",
        "entity_column": "region",
        "period_column": "month",
        "currency": "INR",
        "total": {
            "id": "company",
            "name": "Company",
            "aliases": ["the business", "company-wide", "overall", "in total", "across all regions"],
        },
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
                "synonyms": ["revenue", "sales", "net sales", "GMV"],
            },
            {
                "id": "orders",
                "label": "Orders",
                "type": "count",
                "column": "orders",
                "decimals": 0,
                "synonyms": ["orders", "order volume", "order count"],
            },
            {
                "id": "aov",
                "label": "AOV",
                "type": "currency",
                "numerator": "revenue",
                "denominator": "orders",
                "decimals": 0,
                "synonyms": ["AOV", "average order value", "basket size"],
            },
            {
                "id": "conversion_rate",
                "label": "Conversion rate",
                "type": "rate",
                "numerator": "orders",
                "denominator": "sessions",
                "multiplier": 100,
                "decimals": 2,
                "synonyms": ["conversion rate", "conversion", "CVR"],
            },
            {
                "id": "return_rate",
                "label": "Return rate",
                "type": "rate",
                "numerator": "returns",
                "denominator": "orders",
                "multiplier": 100,
                "higher_is_better": False,
                "synonyms": ["return rate", "returns rate", "rate of returns"],
            },
        ],
    }
    return spec, rows


def saas_monthly(seed: int = 5) -> tuple[dict[str, Any], Rows]:
    rng = random.Random(seed)
    segments = {"SMB": (900, 90), "Mid-Market": (240, 900), "Enterprise": (45, 7_500)}
    months = ["2026-05", "2026-06", "2026-07", "2026-08"]
    rows: Rows = []
    for name, (customers, arpa) in segments.items():
        base_churn = rng.uniform(0.012, 0.035)
        base_new = rng.uniform(0.03, 0.06)
        for mth in months:
            start = round(customers * rng.uniform(0.97, 1.05))
            churned = max(1, round(start * base_churn * rng.uniform(0.8, 1.2)))
            new = round(start * base_new * rng.uniform(0.85, 1.15))
            mrr = round((start - churned + new) * arpa * rng.uniform(0.95, 1.05))
            row: dict[str, Any] = {
                "segment": name,
                "month": mth,
                "customers_start": start,
                "churned": churned,
                "new_customers": new,
                "mrr": mrr,
            }
            s2 = round(start * rng.uniform(0.97, 1.05))
            row["customers_start_plan"] = s2
            row["churned_plan"] = max(1, round(s2 * base_churn * rng.uniform(0.8, 1.2)))
            row["new_customers_plan"] = round(s2 * base_new * rng.uniform(0.85, 1.15))
            row["mrr_plan"] = round(mrr * rng.uniform(0.92, 1.08))
            rows.append(row)
    spec = {
        "name": "saas_monthly",
        "entity_column": "segment",
        "period_column": "month",
        "currency": "USD",
        "total": {
            "id": "all-segments",
            "name": "All segments",
            "aliases": ["the business", "overall", "across all segments", "in total", "company-wide"],
        },
        "entity_aliases": {"Mid-Market": ["mid-market", "midmarket"], "SMB": ["small business"]},
        "bases": [
            {"id": "budget", "label": "plan", "suffix": "_plan"},
            {"id": "prior", "label": "last month", "source": "previous_period"},
        ],
        "metrics": [
            {
                "id": "mrr",
                "label": "MRR",
                "type": "currency",
                "column": "mrr",
                "decimals": 0,
                "synonyms": ["MRR", "monthly recurring revenue", "recurring revenue"],
            },
            {
                "id": "new_customers",
                "label": "New customers",
                "type": "count",
                "column": "new_customers",
                "decimals": 0,
                "synonyms": ["new customers", "new logos", "customer adds"],
            },
            {
                "id": "churn_rate",
                "label": "Churn rate",
                "type": "rate",
                "numerator": "churned",
                "denominator": "customers_start",
                "multiplier": 100,
                "decimals": 2,
                "higher_is_better": False,
                "synonyms": ["churn rate", "logo churn", "churn"],
            },
        ],
    }
    return spec, rows


DATASETS = {"hotel_weekly": hotel_weekly, "retail_monthly": retail_monthly, "saas_monthly": saas_monthly}
