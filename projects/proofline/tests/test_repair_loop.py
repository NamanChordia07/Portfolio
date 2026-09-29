from types import SimpleNamespace

import pytest

from proofline.cli import DEMO_TEXT
from proofline.loop import SYSTEM_PROMPT, facts_brief, feedback_message, guarded_generate
from proofline.providers.base import ProviderError
from proofline.providers.claude import ClaudeProvider
from proofline.providers.gemini import GeminiProvider
from proofline.providers.scripted import ScriptedProvider
from proofline.repair import repair_text
from proofline.verify import Status, verify_text

WRONG = "Occupancy rose 5.2% to 66.8% vs last year. RevPAR improved vs last week."
RIGHT = "Occupancy rose 5.2 pts to 66.8% vs last year. RevPAR fell 3.6% vs last week."


def test_repair_makes_demo_pass(hotel):
    report = verify_text(DEMO_TEXT, hotel)
    assert len(report.contradicted) == 5
    fixed, edits = repair_text(report, hotel)
    assert {e.reason for e in edits} == {"unit", "direction", "wrong_basis", "wrong_entity", "wrong_value"}
    after = verify_text(fixed, hotel)
    assert after.passed
    assert "5.2 pts" in fixed and "RevPAR worsened" in fixed and "$150.04" in fixed
    # unverifiable claims are left alone, never rewritten
    assert "Guest satisfaction rose to 4.6 out of 5." in fixed


def test_repair_is_minimal(hotel):
    text = "Room revenue reached $464.4K, 3.2% behind budget. Rooms sold were 1.1% ahead of last year."
    fixed, edits = repair_text(verify_text(text, hotel), hotel)
    assert len(edits) == 1 and edits[0].before == "1.1%" and edits[0].after == "8.4%"
    assert fixed == text.replace("1.1%", "8.4%")


def test_feedback_names_the_problem(hotel):
    msg = feedback_message(verify_text(WRONG, hotel), hotel)
    assert "percentage points" in msg and "improved" in msg and msg.startswith("Your draft has 2 problem(s)")


def test_facts_brief_contains_citable_numbers(hotel):
    brief = facts_brief(hotel)
    assert "Occupancy: 66.8%" in brief and "+5.2 pts" in brief and "## Harbor View" in brief


def test_guarded_loop_converges_after_feedback(hotel):
    provider = ScriptedProvider([WRONG, RIGHT])
    result = guarded_generate(provider, hotel, "Summarise the week.")
    assert result.passed and result.text == RIGHT and not result.edits
    assert [r.counts["contradicted"] for r in result.rounds] == [2, 0]
    system, messages = provider.calls[1]
    assert system == SYSTEM_PROMPT
    assert [m.role for m in messages] == ["user", "assistant", "user"]
    assert "FACTS" in messages[0].content and "problem(s)" in messages[2].content


def test_guarded_loop_falls_back_to_repair(hotel):
    provider = ScriptedProvider([WRONG, WRONG])
    result = guarded_generate(provider, hotel, "Summarise the week.", max_rounds=2)
    assert result.passed and result.edits
    assert len(result.rounds) == 3 and result.rounds[-1].completion is None


def test_guarded_loop_without_repair_reports_failure(hotel):
    result = guarded_generate(ScriptedProvider([WRONG]), hotel, "x", max_rounds=1, repair=False)
    assert not result.passed and result.report.contradicted


def test_scripted_provider_runs_out():
    with pytest.raises(ProviderError):
        ScriptedProvider([]).complete("s", [])


# --- providers against fake SDK clients (no network) -----------------------------------


class FakeAnthropic:
    def __init__(self, stop_reason="end_turn"):
        self.kwargs = None
        self.stop_reason = stop_reason
        self.beta = SimpleNamespace(messages=SimpleNamespace(create=self.create))

    def create(self, **kwargs):
        self.kwargs = kwargs
        return SimpleNamespace(
            stop_reason=self.stop_reason,
            model=kwargs["model"],
            content=[SimpleNamespace(type="thinking", thinking=""), SimpleNamespace(type="text", text="Occupancy rose.")],
            usage=SimpleNamespace(input_tokens=120, output_tokens=8),
        )


def test_claude_provider_request_shape():
    from proofline.providers.base import Message

    fake = FakeAnthropic()
    out = ClaudeProvider(client=fake).complete("sys", [Message("user", "hi")])
    assert out.text == "Occupancy rose." and out.input_tokens == 120
    k = fake.kwargs
    assert k["model"] == "claude-opus-5-5" and k["system"] == "sys"
    assert k["fallbacks"] == "default" and k["betas"] == ["server-side-fallback-2026-07-01"]
    assert k["output_config"] == {"effort": "medium"}
    assert "temperature" not in k


def test_claude_provider_surfaces_refusal():
    with pytest.raises(ProviderError):
        ClaudeProvider(client=FakeAnthropic(stop_reason="refusal")).complete("s", [])


def test_gemini_provider_request_shape():
    from proofline.providers.base import Message

    calls = {}

    def generate_content(**kwargs):
        calls.update(kwargs)
        return SimpleNamespace(text="ok", usage_metadata=SimpleNamespace(prompt_token_count=10, candidates_token_count=2))

    fake = SimpleNamespace(models=SimpleNamespace(generate_content=generate_content))
    out = GeminiProvider(client=fake).complete("sys", [Message("user", "a"), Message("assistant", "b")])
    assert out.text == "ok" and out.output_tokens == 2
    assert [c["role"] for c in calls["contents"]] == ["user", "model"]
    assert calls["config"]["system_instruction"] == "sys"


def test_verdict_statuses_cover_report(hotel):
    report = verify_text(DEMO_TEXT, hotel)
    assert sum(report.counts.values()) == len(report.verdicts)
    assert {v.status for v in report.verdicts} == set(Status)


def test_llm_eval_harness_with_scripted_provider():
    from proofline.evaluate_llm import run_llm_eval

    # One draft per dataset, with no numeric claims, so each passes on the first round.
    results = run_llm_eval(ScriptedProvider(["Performance was mixed this period."] * 3), n_tasks=1)
    s = results["summary"]
    assert (s["reports"], s["mean_llm_calls"], s["final_pass_rate"]) == (3, 1, 1.0)
    assert s["first_draft_contradicted_claim_rate"] == 0 and s["needed_deterministic_repair"] == 0
