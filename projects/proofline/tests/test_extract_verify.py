import pytest

from proofline.extract import ClaimKind, extract_claims
from proofline.verify import Reason, Status, verify_text


def verdicts(text, sheet):
    return {v.claim.text: v for v in verify_text(text, sheet).verdicts}


def test_clause_attribution(hotel):
    claims = extract_claims("Occupancy rose 5.2 pts to 66.8% vs last year, while ADR grew 3.8%.", hotel)
    by_text = {c.text: c for c in claims}
    assert by_text["5.2 pts"].kind is ClaimKind.DELTA and by_text["5.2 pts"].basis == "last_year"
    assert by_text["66.8%"].kind is ClaimKind.LEVEL
    adr = by_text["3.8%"]
    assert (adr.metric, adr.kind, adr.basis, adr.direction) == ("adr", ClaimKind.DELTA, "last_year", 1)


@pytest.mark.parametrize(
    "sentence, number, kind",
    [
        ("Occupancy came in at 66.8% versus 61.6% last year.", "61.6%", ClaimKind.BASE),
        ("Occupancy of 66.8% compares with a budget of 69.2%.", "69.2%", ClaimKind.BASE),
        ("Occupancy was 66.8% (69.2% budget).", "69.2%", ClaimKind.BASE),
        ("Occupancy rose from 61.6% to 66.8% vs last year.", "61.6%", ClaimKind.BASE),
        ("Room revenue was up 12.6% vs last year at $464.4K.", "$464.4K", ClaimKind.LEVEL),
        ("Rooms sold rose 8.4% year over year, by 222.", "222", ClaimKind.DELTA),
        ("There was a 12.6% increase in room revenue vs last year.", "12.6%", ClaimKind.DELTA),
    ],
)
def test_kind_classification(hotel, sentence, number, kind):
    claim = next(c for c in extract_claims(sentence, hotel) if c.text == number)
    assert claim.kind is kind


def test_supported_report(hotel):
    text = (
        "## Portfolio\nOccupancy rose 5.2 pts to 66.8% vs last year. RevPAR fell 3.6% week over week. "
        "Room revenue came in at $464.4K versus a budget of $480.0K."
    )
    report = verify_text(text, hotel)
    assert report.passed and report.counts["supported"] == len(report.verdicts) == 5


@pytest.mark.parametrize(
    "text, token, reason",
    [
        ("Occupancy rose 5.2% vs last year.", "5.2%", Reason.UNIT_CONFUSION),
        ("RevPAR rose 3.6% week over week.", "3.6%", Reason.WRONG_DIRECTION),
        ("Rooms sold were 1.1% ahead of last year.", "1.1%", Reason.WRONG_BASIS),
        ("Harbor View's ADR was $171.08.", "$171.08", Reason.WRONG_ENTITY),
        ("Harbor View's occupancy was 66.3%.", "66.3%", Reason.WRONG_VALUE),
        ("Room revenue was $464.4M.", "$464.4M", Reason.SCALE_ERROR),
        ("Portfolio ADR rose 12.6% vs last year.", "12.6%", Reason.WRONG_METRIC),
        ("Room revenue was €464.4K.", "€464.4K", Reason.CURRENCY_MISMATCH),
    ],
)
def test_diagnosis(hotel, text, token, reason):
    v = verdicts(text, hotel)[token]
    assert v.status is Status.CONTRADICTED
    assert v.reason is reason, v.message


def test_direction_only_claims(hotel):
    report = verify_text("RevPAR improved vs last week. ADR rose vs last year.", hotel)
    assert [(v.claim.text, v.status) for v in report.verdicts] == [
        ("improved", Status.CONTRADICTED),
        ("rose", Status.SUPPORTED),
    ]


def test_polarity_aware_improvement(tiny):
    # Return rate: lower is better, so "improved" means it fell.
    down = tiny.get("returns:total:delta_abs:last_year").value
    assert down < 0
    assert verify_text("The return rate improved vs last year.", tiny).passed
    assert not verify_text("The return rate deteriorated vs last year.", tiny).passed


def test_unverifiable_is_not_supported(hotel):
    v = verdicts("Guest satisfaction reached 4.6 out of 5.", hotel)["4.6"]
    assert v.status is Status.UNVERIFIABLE and v.reason is Reason.NO_METRIC


def test_context_carry_over(hotel):
    text = "## Harbor View\nRevPAR climbed 13.6% vs last year. It was up 5.7% against the forecast."
    report = verify_text(text, hotel)
    assert report.passed, [v.message for v in report.verdicts]
    it = report.verdicts[-1].claim
    assert (it.metric, it.entity, it.basis) == ("revpar", "harbor-view", "forecast")
    assert "metric carried from previous sentence" in it.notes


def test_hedges_are_respected(hotel):
    assert verify_text("Occupancy was about 67% overall.", hotel).passed
    assert not verify_text("Occupancy was over 70% overall.", hotel).passed


def test_unstated_basis_checks_every_basis(hotel):
    # 8.4% is the change vs last year; no basis is stated, so any basis may support it.
    assert verify_text("Rooms sold rose 8.4%.", hotel).passed
    v = verdicts("Rooms sold rose 9.9%.", hotel)["9.9%"]
    assert v.status is Status.CONTRADICTED and "no comparison basis stated" in v.message


@pytest.mark.parametrize(
    "text, token, status",
    [
        ("Harbor View sold 1,017 rooms, 67 fewer than the prior week.", "1,017", Status.SUPPORTED),
        ("Harbor View sold 1,017 rooms, 67 fewer than the prior week.", "67", Status.SUPPORTED),
        ("Portfolio room revenue topped $460K.", "$460K", Status.SUPPORTED),
        ("Portfolio room revenue topped $470K.", "$470K", Status.CONTRADICTED),
    ],
)
def test_split_metric_names_and_hedge_verbs(hotel, text, token, status):
    assert verdicts(text, hotel)[token].status is status


def test_numbers_inside_names_are_not_claims(hotel):
    assert set(verdicts("Harbor View (Tower 2) sold 1,017 rooms.", hotel)) == {"1,017"}
    # An entity name followed by a count is still a claim.
    listed = verdicts("Rooms sold by property: Cedar Lodge 434, Harbor View 1017.", hotel)
    assert listed["434"].status is Status.SUPPORTED and listed["1017"].status is Status.SUPPORTED
