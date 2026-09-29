import pytest

from proofline.facts import DatasetSpec, compute_facts
from proofline.repair import repair_text
from proofline.samples import DATASET_FNS, SAMPLES
from proofline.verify import Status, verify_text


@pytest.mark.parametrize("sample", SAMPLES, ids=lambda s: s.id)
def test_samples_have_exactly_the_intended_errors(sample):
    spec, rows = DATASET_FNS[sample.dataset]()
    sheet = compute_facts(DatasetSpec.from_dict(spec), rows)
    report = verify_text(sample.text, sheet)
    found = {v.claim.text: v.reason.value for v in report.verdicts if v.status is Status.CONTRADICTED}
    assert found == sample.expected_errors
    fixed, _ = repair_text(report, sheet)
    assert verify_text(fixed, sheet).passed


def test_export_demo_writes_engine_output(tmp_path):
    import json

    from proofline.export_demo import main

    out = tmp_path / "demo.json"
    assert main([str(out)]) == 0
    data = json.loads(out.read_text(encoding="utf-8"))
    assert [s["id"] for s in data["samples"]] == [s.id for s in SAMPLES]
    for s in data["samples"]:
        assert all(s["text"][c["start"] : c["end"]] == c["text"] for c in s["claims"])
        assert s["repaired"]["counts"]["contradicted"] == 0
    assert {r["family"] for r in data["benchmark"]["firstRuns"]} == {"heldout", "heldout2", "heldout3"}
