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
