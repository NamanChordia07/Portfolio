from hypothesis import given
from hypothesis import strategies as st

from proofline.numbers import Hedge, TolerancePolicy, Unit, format_like, iter_numbers


def one(text: str):
    found = list(iter_numbers(text))
    assert len(found) == 1, found
    return found[0]


def test_units_and_scales():
    assert one("up 4.2 pts").unit is Unit.POINTS
    assert one("up 2.3 percentage points").unit is Unit.POINTS
    assert one("a 40 bps gain").points_magnitude == 0.4
    assert one("rose 12%").unit is Unit.PERCENT
    assert one("rose 12 percent").unit is Unit.PERCENT
    n = one("revenue of $1.24M")
    assert (n.unit, n.magnitude, n.currency, n.decimals) == (Unit.CURRENCY, 1_240_000, "USD", 2)
    assert one("₹2.25 crore").magnitude == 22_500_000
    assert one("Rs 2,25,31,000").magnitude == 22_531_000
    assert one("₹45.6 lakh").magnitude == 4_560_000
    assert one("3.4K orders").magnitude == 3_400
    assert one("a 1.4x multiple").unit is Unit.MULTIPLE


def test_signs():
    assert one("(+4.2 pts vs LY)").sign == 1
    assert one("change of -$17,273").sign == -1
    assert one("the 10-12% range").sign is None  # a hyphen inside a range is not a sign


def test_identifiers_and_dates_are_not_claims():
    for text in (
        "In Week 32 we",
        "Q3 results",
        "the G3 system",
        "COVID-19 impact",
        "in 2026 alone",
        "on 12 Aug",
        "top 3 hotels",
        "FY26 plan",
        "the 3rd week",
    ):
        assert list(iter_numbers(text)) == [], text


def test_list_markers_are_skipped():
    assert [n.text for n in iter_numbers("1. Revenue rose 3%")] == ["3%"]


def test_hedges():
    assert one("about 78%").hedge is Hedge.APPROX
    assert one("nearly $1.2M").hedge is Hedge.NEARLY
    assert one("more than 80%").hedge is Hedge.AT_LEAST
    assert one("under 5%").hedge is Hedge.AT_MOST
    assert one("just over 4 pts").hedge is Hedge.JUST_OVER


def test_display_precision_interval():
    n = one("12.4%")
    assert n.admits(12.44) and n.admits(12.36) and n.admits(12.45)  # rounding, including the half-even boundary
    assert not n.admits(12.5) and not n.admits(12.3)
    m = one("$1.2M")
    assert m.admits(1_236_000) and not m.admits(1_300_000)


def test_hedged_intervals():
    assert one("about 12%").admits(13.2)
    assert not one("about 12%").admits(14.0)
    assert one("nearly 5%").admits(4.8) and not one("nearly 5%").admits(5.3)
    assert one("over 80%").admits(81.5) and not one("over 80%").admits(79.9)
    assert one("under 5%").admits(4.2) and not one("under 5%").admits(5.1)


def test_fixed_tolerance_policy_ignores_precision():
    policy = TolerancePolicy(fixed_rel=0.01)
    assert not one("12%").admits(12.4, policy)  # 3% off: rejected although it rounds to 12


def test_format_like_keeps_style():
    assert format_like(one("$1.24M"), 1_195_000) == "$1.20M"
    assert format_like(one("12.4%"), 8.4433) == "8.4%"
    assert format_like(one("₹2.25 crore"), 19_870_000) == "₹1.99 crore"
    assert format_like(one("+4.2 pts"), -2.34) == "-2.3 pts"
    assert format_like(one("3,412"), 2853) == "2,853"


@given(
    st.floats(min_value=0.05, max_value=9_999_999, allow_nan=False),
    st.sampled_from(["$1.2M", "12.4%", "3,412", "4.2 pts", "$182.40"]),
)
def test_format_like_roundtrips(value: float, template: str):
    """Whatever we write back must be read back as a value the verifier accepts."""
    t = one(template)
    rendered = format_like(t, value)
    n = one(rendered)
    assert n.unit is t.unit
    assert n.admits(round(value / t.scale, t.decimals) * t.scale)
