"""Sample LLM-style reports with known, deliberate errors, used by the demo, docs and website.

Each sample lists the errors it contains so tests can pin the verifier's behaviour.
"""

from __future__ import annotations

from dataclasses import dataclass

from .bench.datasets import hotel_weekly, retail_monthly, saas_monthly


@dataclass(frozen=True)
class Sample:
    id: str
    title: str
    dataset: str
    text: str
    expected_errors: dict[str, str]  # claim text -> reason


HOTEL = Sample(
    "hotel",
    "Hotel portfolio, weekly (USD)",
    "hotel_weekly",
    """## Portfolio
Occupancy rose 5.2% to 66.8% vs last year, while ADR grew 3.8% year over year.
Room revenue reached $464.4K, 3.2% behind budget, and RevPAR improved vs last week.
Rooms sold were 1.1% ahead of last year.

## Harbor View
Harbor View's RevPAR climbed 13.6% vs last year to $99.09. Its ADR of $171.08 was 6.5% above forecast.
Occupancy was 66.3%, down 4.4 pts week over week. Guest satisfaction rose to 4.6 out of 5.
""",
    {
        "5.2%": "unit_confusion",
        "improved": "wrong_direction",
        "1.1%": "wrong_basis",
        "$171.08": "wrong_entity",
        "66.3%": "wrong_value",
    },
)

RETAIL = Sample(
    "retail",
    "Retail regions, monthly (INR)",
    "retail_monthly",
    """## Company
Revenue reached ₹9.59 crore in August, up 8.8% year over year but 1.1% behind budget. Orders fell 7.3% vs last month, and the return rate improved to 6.4%, down 0.6 pts month over month. Conversion rate slipped 0.2% vs last month.

## Regions
East beat budget on revenue by 12.1%, with sales of ₹14.99 lakh. North's AOV slipped 2.5% vs last month.
""",
    {"0.2%": "unit_confusion", "₹14.99 lakh": "scale_error", "2.5%": "wrong_entity"},
)

SAAS = Sample(
    "saas",
    "SaaS segments, monthly (USD)",
    "saas_monthly",
    """MRR finished August at $672.3K, 1.4% ahead of plan but down 1.7% month over month. New customers came in at 56 against a plan of 59. Churn improved vs last month.

## Segments
Enterprise MRR grew 3.5% vs last month. Mid-Market was the bright spot: MRR rose 7.8% vs plan, while churn rose 0.4 pts. SMB added 42 new customers, 16.0% fewer than last month.
""",
    {"improved": "wrong_direction", "3.5%": "wrong_direction"},
)

SAMPLES = [HOTEL, RETAIL, SAAS]
DATASET_FNS = {"hotel_weekly": hotel_weekly, "retail_monthly": retail_monthly, "saas_monthly": saas_monthly}
