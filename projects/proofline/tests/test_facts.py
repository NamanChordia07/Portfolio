import pytest

from proofline.facts import DatasetSpec, FactKind, FactSheet, compute_facts

from .conftest import TINY_ROWS, TINY_SPEC


def value(sheet: FactSheet, fid: str) -> float:
    f = sheet.get(fid)
    assert f is not None, fid
    return f.value


def test_levels_and_current_period(tiny):
    assert tiny.period == "2026-08"
    assert value(tiny, "revenue:alpha:level") == 100_000
    assert value(tiny, "revenue:total:level") == 160_000
    assert value(tiny, "orders:total:level") == 1_300


def test_ratio_metrics_are_ratio_of_sums(tiny):
    # AOV total = 160,000 / 1,300, not the mean of 100 and 200.
    assert value(tiny, "aov:total:level") == pytest.approx(123.0769, abs=1e-3)
    assert value(tiny, "conversion:total:level") == pytest.approx(1_300 / 50_000 * 100)


def test_comparisons(tiny):
    assert value(tiny, "revenue:total:base:last_year") == 140_000
    assert value(tiny, "revenue:total:delta_abs:last_year") == 20_000
    assert value(tiny, "revenue:total:delta_pct:last_year") == pytest.approx(20_000 / 140_000 * 100)
    # previous-period basis uses the prior month's rows
    assert value(tiny, "revenue:total:base:prior") == 130_000
    # rate deltas: absolute change is in points, relative change in percent
    assert value(tiny, "conversion:alpha:delta_abs:last_year") == pytest.approx(2.5 - 1000 / 36_000 * 100)
    assert tiny.get("conversion:alpha:delta_abs:last_year").unit == "points"
    assert tiny.get("conversion:alpha:delta_pct:last_year").unit == "percent"


def test_json_roundtrip(tiny):
    again = FactSheet.from_json(tiny.to_json())
    assert again.to_dict() == tiny.to_dict()
    assert again.find("aov", "total", FactKind.LEVEL)


def test_explicit_period_and_errors():
    spec = DatasetSpec.from_dict({**TINY_SPEC, "current_period": "2026-07"})
    sheet = compute_facts(spec, TINY_ROWS)
    assert sheet.period == "2026-07"
    assert sheet.get("revenue:total:base:prior") is None  # no earlier month
    with pytest.raises(ValueError):
        compute_facts(DatasetSpec.from_dict({**TINY_SPEC, "current_period": "2030-01"}), TINY_ROWS)
    with pytest.raises(ValueError):
        compute_facts(spec, [])
