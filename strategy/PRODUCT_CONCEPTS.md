# New AI product: research and concepts (for approval)

Status: **proposal only. Nothing below is built until you reply "PROCEED" and pick a concept.**
Research date: 29 Sep 2026. Vendor numbers are vendor claims unless marked as measured.

---

## Part 1. Research

### 1.1 "System One" decision models (Jev, Laya, OpenJev)

**What they are.** A model that takes some *state* (a ticket, an email, a JSON record) plus
a set of *typed questions*, and returns a typed answer with a probability for every option,
in one forward pass, without generating text. The category was named by TypeSafe AI when it
launched **Jev** on 15 Sep 2026; open alternatives followed within days.

| | Jev (TypeSafe AI) | Laya (Convai Innovations) | OpenJev (razorback16) | OpenJev (S1LV3RJ1NX) |
|---|---|---|---|---|
| Access | Closed API (also Vercel AI Gateway, OpenRouter) | Open weights | Open server | Open, trainable |
| Licence | Commercial API | Apache 2.0 | Apache 2.0 (code and DiffusionGemma weights) | Apache 2.0 |
| Model | Undisclosed | ModernBERT-large 421M (English, 512 tokens); mmBERT-base 322M multilingual (1,024 tokens); `laya-typed-decisions` 421M (1,024 tokens) | DiffusionGemma 26B-A4B (discrete diffusion); can also serve Laya | Rank-16 LoRA on Qwen3-1.7B; ModernBERT variant |
| Questions | `noul` (P(true)), `choice` (≤255 options), `score` (2-10 levels) | Same primitives as Jev | Same, Jev-compatible wire API | Same |
| Latency | 70-500 ms (vendor) | 32.8 ms (vendor; hardware not verified) | ~31 ms p50 on an RTX PRO 6000, 3 questions | 56 ms p95 decoder / 20 ms encoder, H100 |
| Hardware | none (API) | runs on CPU or GPU | ≥24 GB VRAM, or ~16 GB Apple silicon | GPU |
| Price | $0.042 per million input tokens, output free | $0 self-hosted | free self-hosted; hosted trial | free self-hosted |
| Context | 64k per request, 32k for state + longest question | 512 or 1,024 tokens | model-dependent | model-dependent |

**Input and output.** Request: `{state, questions: {id: {type, instructions, options|levels}}}`.
Response per question: chosen option or score, the full probability distribution, and (for
choice/score) a confidence value. Nothing to parse, so an answer cannot go off-schema.

**Calibration: the part to be careful about.**
- Jev's own guidance: "Calibration does not mean that an individual prediction is
  guaranteed to be correct." High confidence can still be wrong.
- Laya reports mean ECE falling from **0.466 to 0.081** only after refitting one temperature
  per question type on domain data. Out of the box its probabilities are not calibrated.
- One OpenJev server defines confidence as `1 − H(p)/ln K` (normalised entropy). That is a
  measure of peakedness, **not** calibration; it says nothing about how often the model is right.
- NathanHB/open-jev states plainly: "None of these toy examples is calibrated out of the box."
- Zero-shot accuracy is modest: Laya's base English checkpoint scores 0.362 on its own
  typed-decisions benchmark vs 0.766 fine-tuned; S1LV3RJ1NX's zero-shot lags Jev, but with
  395 labelled examples its fine-tuned router beat Jev (0.979 vs 0.941 intent accuracy).
- Laya's model card claims 83.8% vs Jev's 67.8% on Laya's own benchmark. A vendor's own
  benchmark is not evidence; it needs reproducing on your task.

**Where they help.** High-volume, narrow, typed judgements where speed and cost matter and a
wrong answer is recoverable: routing, triage, moderation, "is this sentence a factual claim?",
"which statement does this number belong to?", agent branching. Pattern: fan out narrow
questions, compose answers in code, auto-act above a threshold fitted on labelled data, and
escalate below it to an LLM or a person.

**Where they don't.** Generation; arithmetic, counting or date maths (Jev's docs say so);
anything needing a written rationale for an auditor; open answer spaces; long reasoning.
This is exactly why they pair well with Proofline: a System One model can decide *what kind*
of claim a sentence makes; deterministic code does the maths.

**Implementations.** Laya via Hugging Face `transformers` (Python); ModernBERT models can in
general be exported to ONNX, but I have not verified a Laya ONNX export. OpenJev is a Python
server (vLLM or MLX) that speaks Jev's wire API, so Jev's SDKs work against it. Jev is
reachable from TypeScript through Vercel AI Gateway.

### 1.2 RAG, stated correctly

Retrieval-augmented generation does **not** train or fine-tune a model. At question time it
retrieves relevant passages from an index you control (keyword search, embeddings, or both)
and puts them in the prompt, so the model answers from current, citable sources. It helps
when the knowledge is large, changes, or must be cited. It does not make a model reliable
at arithmetic, and retrieval quality caps answer quality: in FinanceBench, GPT-4-Turbo with
a retrieval system answered 81% of questions about public-company filings incorrectly or
refused them. That result is why the concepts below verify numbers deterministically after
retrieval instead of trusting the generated answer.

### 1.3 MCP, only where it earns its place

The Model Context Protocol lets any compatible agent (Claude, IDEs, agent frameworks) call
your tool. It is worth adding when the product's core action is something an agent should
do *before* it answers: "check these numbers", "make this decision". It is not worth adding
to a product whose value is a UI for humans.

### 1.4 Constraints that shaped the shortlist

- **No products in revenue management or hotel analytics.** You work full-time at IDeaS;
  a competing product risks your employment agreement and would draw on employer know-how.
- **Legally usable data only.** Public-domain or openly licensed sources, or the customer's
  own data. No scraping sites whose terms forbid it (review sites, NSE/BSE pages).
- **This environment blocks** `data.sec.gov`, `www.sec.gov`, `huggingface.co` and
  `api.typesafe.ai`. Building concept A or B here needs those hosts added to the allowed
  domains (cloud environment menu → Edit → Network access). PyPI and npm work.

---

## Part 2. Candidates considered

Scores 1-5. "Build here" = can be built and tested in this cloud environment once the named
hosts are allowed.

| # | Concept | Portfolio (FDE / AI / SDE) | Differentiation | Legal data | Market | Build here | Verdict |
|---|---|---|---|---|---|---|---|
| A | **FilingCheck**: verify every number about a public company against its SEC filings | 5 / 5 / 5 | 5 | 5 (public records) | 3 | yes, with SEC hosts allowed | **Recommended** |
| B | **Calibrate**: benchmark and calibrated cascade for decision models | 3 / 5 / 4 | 4 | 5 (CC-BY datasets) | 2 | yes, with Hugging Face allowed | Strong second |
| C | **Deflect**: support triage with System One routing, RAG replies, human handoff | 5 / 4 / 4 | 2 | 4 | 4 (crowded) | yes | Viable, crowded |
| D | **GST circular desk**: cited answers from CBIC/GST Council documents | 3 / 4 / 3 | 3 | 2 (reuse needs permission) | 4 | partly | Only with permission |
| - | Agent tool-call guardrail gateway (MCP proxy) | 3 / 4 / 4 | 2 | 5 | 3 | yes | Rejected: crowded (Lakera, Snyk/Invariant) and security-flavoured, which you don't want as your identity |
| - | Hotel review intelligence | - | - | 1 (review-site terms) | - | - | Rejected: data terms and employer conflict |
| - | Contract-summary number checker | 3 / 4 / 3 | 3 | 1 (private documents) | 3 | no | Rejected: no legal demo data, liability |
| - | Generic "chat with your PDFs" | 1 / 2 / 2 | 1 | - | - | - | Rejected: the generic project the brief rules out |

---

## Part 3. The shortlist in detail

### A. FilingCheck (recommended)

**One line.** Paste an earnings recap, newsletter paragraph or AI-written summary about a
US public company; every number is checked against the company's own SEC filings, wrong
ones are explained ("that is nine-month revenue, not Q3"; "that growth is year over year,
the text says sequential") and fixed, with a link to the source line.

- **Problem.** Financial writing gets numbers wrong in the ways Proofline already catches:
  wrong period (quarter vs nine months vs trailing twelve months), wrong comparison (YoY vs
  QoQ), wrong line item (revenue vs net revenue, GAAP vs adjusted), scale (millions vs
  billions), wrong segment. LLM-written recaps make it worse (FinanceBench, above).
- **Customer.** (1) Finance newsletter writers and creators; (2) fintech and brokerage
  content teams publishing AI-assisted earnings recaps; (3) developers building finance
  agents, through the API and MCP tool. Investor-relations teams checking coverage later.
- **Alternatives.** Checking by hand against the 10-Q; research platforms (AlphaSense,
  Hebbia, BamSEC) that help you *find* numbers, not check your draft; raw XBRL APIs with no
  claim checking; generic fact-checkers that are not number-aware.
- **Differentiation.** Claim-level verification with a diagnosis and a minimal fix, grounded
  in structured XBRL facts (deterministic) rather than a model's reading of the filing, plus
  a published benchmark built from real recaps with the first run kept.
- **How the AI pieces fit.**
  - *Deterministic core (Proofline):* numbers, periods, bases, units, the verdict and the fix.
  - *System One (Laya, local):* per sentence, typed questions: is this a factual numeric
    claim (noul); which statement or segment (choice); GAAP or non-GAAP (choice); forward
    guidance (noul, marked unverifiable by design). Thresholds fitted on labelled data;
    below threshold, escalate to an LLM.
  - *RAG:* hybrid keyword + embedding search over the filing's text (MD&A, notes) to cite the
    sentence behind a number and to handle claims XBRL doesn't tag. No training.
  - *GenAI:* structured-output fallback to attribute numbers the rules can't, and an optional
    "write me a recap" mode that must pass verification (Proofline's guarded loop).
  - *MCP:* yes: `check_financial_claims(text, ticker)` so an agent verifies before it answers.
- **Data.** SEC EDGAR APIs (company facts, submissions, filing documents): free, no key,
  ≤10 requests/second, a declared User-Agent contact (from an environment variable you set).
  Numbers are facts; filings are public records; show short cited excerpts and link to sec.gov.
  India later only through a licensed data source.
- **Cost (estimated, to be measured).** Data $0. A 1,500-word article (~40 claims): System
  One on CPU ~$0; LLM fallback for ~20% of claims on Gemini 3.1 Flash-Lite ($0.25/$1.50 per
  million tokens) ≈ $0.004; embeddings with a local open model $0. Fixed: $0 while it is a
  portfolio demo; ~$50-70/month once commercial (Vercel Pro is required for commercial use,
  a small API host, Postgres with pgvector). Per-user limits and a hard monthly spend cap.
- **Architecture.** Next.js (Vercel) → Python API (FastAPI, Proofline core) → ingestion
  worker (rate-limited EDGAR fetch, cached facts and filings) → Postgres + pgvector →
  Laya (CPU) → optional LLM provider. Auth, a usage table for metering, Stripe or Razorpay.
- **UI.** Ticker search → paste text or URL → the annotated document (green / red / amber,
  like the Proofline demo on your site) → side panel with the fact, period, filing and line,
  one-click fix → shareable report card. History and usage on an account page.
- **Monetisation (unvalidated).** Free: 5 checks a month. Writer: ~$12/month for 100.
  API/MCP: usage-based. Before charging, 10 conversations with finance writers.
- **MVP.** S&P 500, 10-K and 10-Q, ~40 core concepts (revenue, operating income, net income,
  EPS, cash, debt, derived margins and free cash flow), quarter / nine-month / annual /
  YoY / QoQ / TTM bases; paste-text UI, verdicts with citations, auth, usage limits, MCP
  server, and a hand-labelled benchmark of real published recaps with the first run kept.
- **Scaling.** Stateless API; per-company fact cache; queue-based ingestion under the SEC
  rate limit; more companies = more cache, not more compute.
- **Risks.** XBRL tagging varies by company (extension tags, segment vs consolidated);
  non-GAAP figures aren't in XBRL (reported as unverifiable, honestly); fiscal calendars;
  "not investment advice" terms.
- **Portfolio and interview value.** It answers Proofline's main weakness (synthetic data)
  with real public data and real users. FDE: data integration and a customer workflow. AI:
  RAG used correctly, System One with measured calibration, evaluation discipline. SDE:
  full-stack, caching, rate limits, metering, auth.

### B. Calibrate

**One line.** An open-source harness and runtime that tells you, on *your* labelled data,
which decision model to use (Laya, OpenJev, Jev, or an LLM), at what threshold, with what
escalation rate, cost and latency, and then runs that cascade in production.

- **Problem.** The category is two weeks old and the claims conflict (Laya's card vs Jev;
  zero-shot vs fine-tuned; "confidence" that is really entropy). Teams can't tell what will
  work on their tickets or documents without building their own evaluation.
- **Customer.** Engineers automating routing, triage or moderation; AI platform teams.
- **Alternatives.** LLM eval tools (Braintrust, Langfuse, promptfoo) are built for generated
  text; LLM routers (RouteLLM, Not Diamond, Martian, OpenRouter) route prompts between LLMs;
  notebooks.
- **Differentiation.** Built for typed decisions: accuracy, ECE, Brier, reliability
  diagrams, temperature fitting on a dev split, threshold search for a target precision, and
  a cost / latency / accuracy frontier for cascades (Laya → Jev → LLM → person). Exports a
  policy file that the runtime enforces.
- **AI pieces.** System One models are the subject. GenAI as a cascade tier and for suggested
  labels a person confirms. RAG: not needed. MCP: small value (`decide` tool); optional.
- **Data.** Banking77 (CC-BY-4.0), CLINC150 (CC-BY-3.0), Bitext support (CDLA-Sharing-1.0);
  users bring a labelled CSV.
- **Cost.** Local models free; a 3,000-example Jev run costs cents.
- **Architecture.** Python library + CLI (adapters: transformers/ONNX, Jev-compatible HTTP,
  LLM providers) → FastAPI runtime → Next.js dashboard.
- **Monetisation.** Weak on its own: open-source core, hosted runtime priced per decision.
  Its value is credibility and interviews.
- **Portfolio value.** Very high for AI Engineer roles (evaluation and calibration are what
  2026 JDs ask for); medium for FDE and SDE. Timely, but the space moves weekly.

### C. Deflect

**One line.** Support-ticket triage for SaaS teams: System One routes and prioritises in
milliseconds, RAG drafts a reply from the help centre with citations, and anything below a
calibrated threshold goes to a person, with the reason.

- **Customer.** Small SaaS and D2C support teams on Freshdesk or Zendesk.
- **Alternatives.** Zendesk AI agents, Intercom Fin, Freshworks Freddy: strong, bundled,
  per-resolution pricing. This is the most crowded concept here.
- **Differentiation.** Cost (System One instead of an LLM on every ticket), measured
  calibration and a transparent handoff policy. Real, but thin against bundled incumbents.
- **AI pieces.** All four (System One routing, RAG replies, LLM drafting, MCP optional).
- **Data.** Bitext and Banking77 for the demo; customers' own tickets in production (needs
  a DPA and careful PII handling).
- **Portfolio value.** Very FDE-shaped (integrations, a customer's workflow, handoff rules),
  but it reads as a well-known product category.

### D. GST circular desk (only with permission)

**One line.** Answers GST questions from CBIC and GST Council circulars and notifications,
with every answer cited and every rate or threshold checked against a structured table;
"ask a CA" when the question is advice, not lookup.

- **Market.** ~1.67 crore active GST registrations (June 2026).
- **Why it is fourth.** The GST Council's copyright policy allows reproduction free of
  charge only *after permission by email*; CBIC terms need checking. Tax answers carry
  liability. ClearTax and others already ship AI assistants. Worth it only if you want an
  India-market product and are willing to get permission first.

---

## Recommendation

**Build A (FilingCheck)**, with B's calibration harness as an internal module rather than
a separate product: FilingCheck needs a fitted threshold for its System One questions
anyway, so the evaluation work is shared. This gives one product with real public data, a
real UI and users, RAG and System One used where each is actually right, and a direct story
from Proofline ("I built the verifier, then pointed it at real filings").

Before building, I need from you:
1. **PROCEED**, and which concept (A recommended).
2. The environment's allowed domains to include `data.sec.gov`, `www.sec.gov` and
   `huggingface.co` (cloud environment menu → Edit → Network access).
3. Later, not now: an LLM key for the fallback, entered as an environment variable (see
   `.env.example` when it exists), never pasted into chat or code.
4. An empty repository for it (the session can't create repositories).

## Sources

- Jev: [TypeSafe AI blog](https://typesafe.ai/blog/introducing-system-one-models-and-jev), [pricing](https://jevtypesafeai.com/pricing), [OpenRouter listing](https://openrouter.ai/typesafe/jev-1.13), [limits discussion](https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e), [project reference gist](https://gist.github.com/pjburnhill/adf8d28efcad9df037bfdece178ef965), [Tom's Hardware](https://www.tomshardware.com/tech-industry/artificial-intelligence/typesafe-ais-jev-offers-an-alternative-to-llms-that-claims-to-be-193x-faster-and-445x-cheaper-system-one-type-model-is-bespoke-for-probabilistic-decision-making)
- Laya: [Hugging Face](https://huggingface.co/convaiinnovations/laya), [AI Weekly](https://aiweekly.co/alerts/convai-ships-laya-a-421m-modernbert-decision-model-apache-20), [System One Models](https://systemonemodels.org/models/laya/)
- OpenJev: [razorback16/openjev](https://github.com/razorback16/openjev), [S1LV3RJ1NX/openjev](https://github.com/S1LV3RJ1NX/openjev), [NathanHB/open-jev](https://github.com/NathanHB/open-jev)
- RAG evidence: [FinanceBench (arXiv 2311.11944)](https://arxiv.org/abs/2311.11944)
- SEC data: [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [Accessing EDGAR data (fair access)](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data)
- Routers: [Not Diamond awesome-ai-model-routing](https://github.com/Not-Diamond/awesome-ai-model-routing)
- Model prices: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [BenchLM Gemini pricing](https://benchlm.ai/google/api-pricing)
- Datasets: [Banking77](https://huggingface.co/datasets/PolyAI/banking77), [CLINC150](https://huggingface.co/datasets/DeepPavlov/clinc150), [Bitext](https://github.com/bitext/customer-support-llm-chatbot-training-dataset)
- GST: [active registrations](https://a2ztaxcorp.net/nine-years-of-gst-taxpayer-base-crosses-1-67-crore-as-indias-digital-indirect-tax-ecosystem-scales-new-milestones-report-highlights-expansion-of-taxpayer-base-192-27-crore-returns-filed-an/), [GST Council copyright policy](https://www.gstcouncil.gov.in/copyright-policy)
