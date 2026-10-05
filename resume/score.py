"""Resume quality score: the content checks that Enhancv and Resumly report, run locally.

Neither service has an API, and both put most of their report behind a paywall, so this applies
the rules their free reports state, to the built PDFs and to the bullets they were built from:

  quantified   share of bullets with a measurable number (Resumly target: 50-75%)      25
  repetition   no non-technical word over 3 uses; no opening verb over 2 uses          10
  spelling     no unknown words (tech terms whitelisted), one spelling variety (US)   15
  verbs        every bullet opens with a strong past-tense action verb                10
  ownership    bullets that show scope: led, owned, team size, solo, end to end       10
  structure    sections, contact (email, phone, LinkedIn URL), parseable role lines   10
  form         bullets of 1-2 lines, consistent end punctuation, no first person      10
  keywords     core job-description terms for the role                               10

    python score.py            # all application variants; exits 1 if any scores below 90
"""

from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

import yaml
from pdfminer.high_level import extract_text
from spellchecker import SpellChecker

from build import DIST, assemble, load

ROOT = Path(__file__).parent

STRONG_VERBS = set(
    """achieved added architected automated benchmarked built co-built created cut debugged delivered deployed designed
    detected developed drove engineered enforced established extended hardened identified implemented improved integrated
    launched led migrated modernized optimized orchestrated owned rebuilt reduced refactored replaced scaled shipped
    spearheaded streamlined validated wrote converted secured instrumented accelerated authored rolled released""".split()
)
WEAK_OPENERS = {"worked", "helped", "assisted", "responsible", "participated", "involved", "handled", "did", "made"}
OWNERSHIP = re.compile(
    r"\b(led|owned|owning|drove|spearheaded|mentored|managed|solo|end[ -]to[ -]end|team of \w+|sole|single-handedly|"
    r"took .* from|from idea to|for \d+\+? (students|clients|users))\b",
    re.I,
)
BRITISH = re.compile(
    r"\b\w*(ised|ising|isation|isations|yse|ysed|ysing)\b|\b\w+(elled|elling)\b|"
    r"\b(behaviour|colour|favour|honour|labour|centre|licence|catalogue|programme|dialled|dialling)\w*\b",
    re.I,
)
BRITISH_OK = {"our", "four", "hour", "hours", "your", "tour", "pour", "fourteen", "skilled", "installed", "controlled",
              "rolled", "scrolled", "polled", "pulled", "filled", "called", "spelled", "drilled", "killed", "enrolled",
              "compelled", "propelled", "rolling", "polling", "scrolling", "calling", "pulling", "filling", "controlling",
              "telling", "selling", "spelling", "modelled"}
FIRST_PERSON = re.compile(r"\b(I|me|my|mine|we|our)\b")

# Technical vocabulary a general dictionary does not know. Proper nouns and acronyms are also skipped by rule.
TECH = set(
    """api apis llm llms mcp fastapi postgres postgresql playwright streamlit pandas altair dockerized docker json
    websocket websockets webhooks webhook hmac sdk frejun teler twilio exotel dnc stt tts angular struts jsp springboot
    gemini openai anthropic claude electron typescript javascript nextjs neon razorpay drizzle zod monorepo npm
    pytest mypy hypothesis vitest github vercel linux sql mysql nosql cli ci cd langchain langgraph rag dpapi csp ipc
    wcag hypercare sit uat devops oauth jwt saas backend frontend fullstack multimodal hallucinations hallucination
    hallucinated reranking embeddings dedup barge-in barge inline config configs ui ux etl powerbi bi xss misconfiguration
    misconfigurations deduplicated idempotent idempotency subprocess unparseable reconciled reconciles timestamps codebase
    leaderboard benchmarked benchmarking learnings runtime prebuilt viit ctf ctfs ideas sas viz-a-thon runner-up reviewer
    toolchain toolkits signups admin preprocessing workflows dashboards repo repos onboarding standup e2e gradle maven
    async await enum enums npm-workspaces cgpa b.tech genai agentic orchestrator orchestration tool-calling stdio schema
    schemas validator validators workspaces deterministic app apps auth analytics lookup rollout versioned
    python java hackathon""".split()
)


def words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z][A-Za-z'\-]*[A-Za-z]|[A-Za-z]", text)


def spelling_issues(text: str, spell: SpellChecker) -> list[str]:
    issues = []
    text = re.sub(r"\S+@\S+|\S*\w\.(com|in|app|io|ai|dev)\S*", " ", text)  # emails and URLs are not prose
    for w in words(text):
        lw = w.lower().strip("'-")
        if not lw or lw in TECH or len(lw) <= 2:
            continue
        if any(c.isupper() for c in w[1:]) or w.isupper():  # acronyms, CamelCase product names
            continue
        if w[0].isupper() and lw not in spell:  # proper nouns: company, product and place names
            continue
        parts = [p for p in re.split(r"[-']", lw) if p]
        if all(p in TECH or p in spell or len(p) <= 2 for p in parts):
            continue
        issues.append(w)
    return sorted(set(issues))


def score_variant(variant: str, data: dict, keywords: dict) -> tuple[float, list[str], dict]:
    r = assemble(data, variant)
    pdf = DIST / f"{r['file']}.pdf" if "file" in r else DIST / f"{data['variants'][variant]['file']}.pdf"
    text = re.sub(r"\s+", " ", extract_text(str(pdf)))
    bullets = [b for org in r["experience"] for role in org["roles"] for b in role["bullets"]]
    bullets += [b for p in r["projects"] for b in p["bullets"]]
    bullets += list(r["leadership"])
    notes: list[str] = []
    parts: dict[str, float] = {}

    # quantified impact
    quantified = [b for b in bullets if re.search(r"\d", b)]
    ratio = len(quantified) / len(bullets)
    parts["quantified"] = min(1.0, ratio / 0.6)
    notes.append(f"quantified {len(quantified)}/{len(bullets)} bullets ({ratio:.0%})")
    for b in bullets:
        if b not in quantified:
            notes.append(f"  no number: {b[:90]}")

    # repetition
    stop = set("""a an the and or of to in for with on at by from as into over under across vs is are was were be been it its
    that this these those via per each every one two three four five six seven eight nine ten their they them so not no
    all any both more most less than then also out up down off only same own""".split())
    body = " ".join(bullets + [r["summary"]])
    counts = Counter(w.lower() for w in words(body) if w.lower() not in stop and w.lower() not in TECH and len(w) > 3)
    repeated = {w: n for w, n in counts.items() if n > 3 and w.isalpha() and not w[0].isupper()}
    openers = Counter(b.split()[0].lower().strip(",") for b in bullets)
    rep_open = {w: n for w, n in openers.items() if n > 2}
    parts["repetition"] = max(0.0, 1 - 0.25 * (len(repeated) + len(rep_open)))
    if repeated:
        notes.append(f"repeated words: {repeated}")
    if rep_open:
        notes.append(f"repeated opening verbs: {rep_open}")

    # spelling
    spell = SpellChecker()
    issues = spelling_issues(text, spell)
    british = sorted({m.group(0) for m in BRITISH.finditer(text) if m.group(0).lower() not in BRITISH_OK})
    parts["spelling"] = max(0.0, 1 - 0.2 * (len(issues) + len(british)))
    if issues:
        notes.append(f"unknown words: {issues}")
    if british:
        notes.append(f"non-US spellings: {british}")

    # action verbs
    bad = [b for b in bullets if b.split()[0].lower().strip(",") not in STRONG_VERBS]
    weak = [b for b in bullets if b.split()[0].lower() in WEAK_OPENERS]
    parts["verbs"] = max(0.0, 1 - 0.15 * len(bad) - 0.3 * len(weak))
    for b in bad:
        notes.append(f"  opener not a strong verb: {b.split()[0]}")

    # ownership
    owned = [b for b in bullets if OWNERSHIP.search(b)]
    parts["ownership"] = min(1.0, len(owned) / 3)
    notes.append(f"ownership signals in {len(owned)} bullets")

    # structure
    need = ["SUMMARY", "EXPERIENCE", "PROJECTS", "TECHNICAL SKILLS", "EDUCATION"]
    missing = [h for h in need if h not in text]
    contact_ok = data["person"]["email"] in text and data["person"]["phone"] in text and "linkedin.com/in/" in text
    roles_ok = all(
        i == 0 or org["company"].split(" (")[0] in role.get("display", role["title"])
        for org in r["experience"]
        for i, role in enumerate(org["roles"])
    )
    parts["structure"] = (1 - 0.2 * len(missing)) * (1 if contact_ok else 0.6) * (1 if roles_ok else 0.8)
    if missing:
        notes.append(f"missing sections: {missing}")
    if not roles_ok:
        notes.append("later roles at the same company do not name it (parsers merge them)")

    # form
    long = [b for b in bullets if len(b) > 235]
    ends = Counter(b.rstrip()[-1] == "." for b in bullets)
    inconsistent = len(ends) > 1
    fp = [b for b in bullets + [r["summary"]] if FIRST_PERSON.search(b)]
    parts["form"] = max(0.0, 1 - 0.1 * len(long) - (0.3 if inconsistent else 0) - 0.2 * len(fp))
    if long:
        notes.append(f"{len(long)} bullets over two lines")
    if inconsistent:
        notes.append("bullets end inconsistently (some with a period, some without)")
    if fp:
        notes.append("first-person pronouns present")

    # keywords
    low = text.lower()
    core = keywords[variant]["core"]
    hit = [k for k in core if k.lower() in low]
    parts["keywords"] = min(1.0, len(hit) / (0.9 * len(core)))
    miss = [k for k in core if k not in hit]
    if miss:
        notes.append(f"core keywords missing: {miss}")

    weights = {"quantified": 25, "repetition": 10, "spelling": 15, "verbs": 10, "ownership": 10, "structure": 10, "form": 10, "keywords": 10}
    total = sum(parts[k] * w for k, w in weights.items())
    return total, notes, parts


def main() -> int:
    data = load()
    keywords = yaml.safe_load((ROOT / "ats_keywords.yaml").read_text())
    failed = False
    for variant in ["fde", "ai", "sde", "web"]:
        kv = variant if variant in keywords else data["variants"][variant].get("fallback", "fde")
        total, notes, parts = score_variant(variant, data, {**keywords, variant: keywords[kv]})
        failed |= total < 90
        print(f"== {variant}: {total:.0f}/100  " + "  ".join(f"{k} {v:.0%}" for k, v in parts.items()))
        for n in notes:
            print("   " + n)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
