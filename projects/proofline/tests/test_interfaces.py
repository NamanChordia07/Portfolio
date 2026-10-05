import json

import anyio
import pytest

from proofline.bench.generate import ReportGenerator, slot_in_error
from proofline.bench.run import build_corpus, evaluate, run, to_markdown
from proofline.cli import DEMO_TEXT, main

from .conftest import TINY_ROWS, TINY_SPEC


def test_cli_verify_exit_codes(tmp_path, hotel, capsys):
    facts = tmp_path / "facts.json"
    facts.write_text(hotel.to_json())
    bad = tmp_path / "bad.md"
    bad.write_text(DEMO_TEXT)
    good = tmp_path / "good.md"
    good.write_text("Occupancy rose 5.2 pts to 66.8% vs last year.")
    assert main(["verify", "--facts", str(facts), str(bad)]) == 1
    capsys.readouterr()
    assert main(["verify", "--facts", str(facts), str(good), "--json"]) == 0
    assert json.loads(capsys.readouterr().out)["passed"] is True
    html = tmp_path / "r.html"
    assert main(["verify", "--facts", str(facts), str(bad), "--html", str(html)]) == 1
    assert '<mark class="bad"' in html.read_text()


def test_cli_facts_and_repair(tmp_path):
    import csv

    data = tmp_path / "rows.csv"
    with data.open("w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(TINY_ROWS[0]))
        w.writeheader()
        w.writerows(TINY_ROWS)
    spec = tmp_path / "spec.json"
    spec.write_text(json.dumps(TINY_SPEC))
    facts = tmp_path / "facts.json"
    assert main(["facts", "--data", str(data), "--spec", str(spec), "-o", str(facts)]) == 0
    report = tmp_path / "r.md"
    report.write_text("Revenue rose 11.2% vs last year.")  # true value: 14.3%
    fixed = tmp_path / "fixed.md"
    assert main(["repair", "--facts", str(facts), str(report), "-o", str(fixed)]) == 0
    assert fixed.read_text() == "Revenue rose 14.3% vs last year."


def test_cli_demo(capsys):
    assert main(["demo"]) == 0
    assert "after repair: {'supported': 13, 'contradicted': 0, 'unverifiable': 2}" in capsys.readouterr().out


def test_mcp_server_tools(hotel):
    pytest.importorskip("mcp")
    from mcp import Client

    from proofline.mcp_server import build_server

    async def scenario():
        async with Client(build_server()) as client:
            names = {t.name for t in (await client.list_tools()).tools}
            assert names == {"compute_facts", "facts_brief", "verify_narrative", "repair_narrative"}
            facts = hotel.to_dict()
            verified = await client.call_tool("verify_narrative", {"text": DEMO_TEXT, "facts": facts})
            body = verified.structured_content or json.loads(verified.content[0].text)
            assert body["passed"] is False and body["counts"]["contradicted"] == 5
            repaired = await client.call_tool("repair_narrative", {"text": DEMO_TEXT, "facts": facts})
            body = repaired.structured_content or json.loads(repaired.content[0].text)
            assert body["passed"] is True and len(body["edits"]) == 5

    anyio.run(scenario)


def test_generator_is_deterministic(hotel):
    a = ReportGenerator(hotel, "dev", seed=42).generate()
    b = ReportGenerator(hotel, "dev", seed=42).generate()
    assert a.text == b.text and [(s.start, s.label) for s in a.slots] == [(s.start, s.label) for s in b.slots]


def test_clean_reports_have_no_errors_by_ground_truth(hotel):
    gen = ReportGenerator(hotel, "heldout", seed=3, clean_report_rate=1.0)
    for _ in range(20):
        r = gen.generate()
        assert not r.corrupted
        assert not any(slot_in_error(hotel, s, r.text) for s in r.slots)


def test_benchmark_smoke():
    corpus = build_corpus(15, "dev", seed=1)
    from proofline.bench.run import CONFIGS

    main_cfg = evaluate(corpus, CONFIGS[0])
    naive = evaluate(corpus, None, naive=True)
    assert main_cfg["error_recall"] > 0.95 and main_cfg["false_alarm_rate"] < 0.02
    assert naive["error_recall"] < 0.5
    gate = main_cfg["gate"]
    assert gate["tp"] + gate["fn"] == main_cfg["error_slots"] and 0.9 < gate["precision"] <= 1.0
    assert main_cfg["latency"]["report_p50_ms"] > 0 and naive["latency"] is None
    md = to_markdown(run(5, families=("dev",)))
    assert "| proofline |" in md and "naive_lookup" in md and "Gate view" in md


@pytest.mark.parametrize("name", ["original", "heldout"])
def test_challenge_sets_pass(name):
    from proofline.bench.challenge import CHALLENGE_SETS, run_challenge

    res = run_challenge(CHALLENGE_SETS[name])
    assert res["failures"] == [] and res["flag"]["f1"] == 1.0


def test_cli_challenge(tmp_path, capsys):
    out = tmp_path / "c.json"
    assert main(["challenge", "--set", "heldout", "--json", str(out)]) == 0
    assert "65/65 cases pass" in capsys.readouterr().out
    assert json.loads(out.read_text())["cases"] == 65
    failing = tmp_path / "failing.yaml"
    failing.write_text(
        '- {id: x, category: basics, dataset: hotel_weekly, text: "Occupancy was 70%.", '
        "expect: [{token: '70%', status: supported}]}\n"
    )
    assert main(["challenge", "--set", str(failing)]) == 1


def test_static_demo_export(tmp_path):
    from proofline.export_demo import main as export_main

    assert export_main([str(tmp_path / "demo.json"), "--html", str(tmp_path / "demo")]) == 0
    data = json.loads((tmp_path / "demo.json").read_text())
    assert {s["id"] for s in data["samples"]} == {"hotel", "retail", "saas"}
    assert "challenge_heldout_first_run" in data["benchmark"]["challenge"]
    index = (tmp_path / "demo" / "index.html").read_text()
    assert "hotel-repaired.html" in index and (tmp_path / "demo" / "saas.html").exists()
