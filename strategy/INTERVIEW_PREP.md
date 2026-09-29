# Interview preparation

## Questions you will get, and how to answer them honestly

**"Walk me through your time at IDeaS."**
Three steps, one company: Software Developer Intern (Jan–Jun 2025, dashboard modernisation in
Angular and Spring Boot), Business Intelligence & Automation Intern (Jul–Oct 2025, mailbox and
reporting automation), then full-time AI & Automation Developer from November 2025 (forecast-review
pipeline with LLM commentary, Playwright configuration checks, pricing analytics). Say what the
conversion changed: you went from assigned tasks to owning pipelines through SIT, UAT and hypercare.

**"ClueCode reads screens during interviews. Is it a cheating tool?"**
- It is an ordinary visible window. It does not hide from screen sharing, recording or
  proctoring, and the prompts do not try to disguise AI output. That is a deliberate product
  boundary (it is in the README).
- It is aimed at practice and learning (Hint and Explain modes exist for that) and at work
  where AI help is allowed.
- Then move to what the interviewer should care about: the lease protocol, idempotent webhooks,
  the Electron security model.
Rehearse this until it is calm and short. Fix the site copy first (see `AUDIT.md`).

**"Proofline and ClueCode were both built in September 2026. Did AI write them?"**
Say how you built them: with AI coding assistants, the way most engineers build in 2026, and
you own every design decision. Then prove it by explaining the design without notes. Before
any interview, make sure you can:
- explain why display precision matters ("12%" = [11.5, 12.5)) and what the ±1% ablation showed;
- walk through how "It was up 5.7% vs forecast" gets its metric, entity and basis;
- explain the held-out protocol and why first-run numbers are the honest ones, including the
  heldout3 label bug and why fixing labels (not the extractor) was legitimate;
- explain ClueCode's session lease: why a partial unique index, why server-clock relative
  seconds, what happens on crash, sleep, second device, payment lapse;
- explain webhook idempotency (unique `(provider, event_id)`) and why Checkout's client-side
  verify changes no state.
Best of all: extend Proofline yourself (the LLM-assisted attribution fallback in DESIGN.md), and
run `proofline eval-llm` with your Gemini key so you have real-model numbers you produced.

**"Your benchmark is synthetic and you wrote the templates. Why trust it?"**
Agree with the limitation, then explain the mitigations: independent ground truth, held-out
families run once, ablations and a baseline on the same data. Then say what real-model
evaluation would add, and show `eval-llm` results if you have run it.

**"What did the LLM commentary in the forecast reviews look like? How did you check it?"**
This is the bridge to Proofline. Describe the real process at work (without confidential
detail), what went wrong or could go wrong, and why that motivated a deterministic verifier.

**"Walk me through the At-a-Glance migration."**
Legacy JSP/Struts → Angular + Spring Boot; single-day → date-range APIs and the SQL work that
needed; why a database-driven feature toggle (per-client rollout, instant rollback) instead of a
big-bang switch.

**"Tell me about a time you dealt with an ambiguous business problem."** (FDE)
Use the care-mailbox automation or the G3 checks: who asked, what the actual problem was once
you dug in, what you built, what it saved, what you would do differently.

## Confidentiality rules for interviews

Describe employer work by what it does, not how IDeaS implements it internally. No client
names, internal URLs, database names, schemas, screenshots or code. "A revenue-management
platform's client setup" is fine; table names are not.

## Things to practise

- 2-minute walkthroughs of Proofline and ClueCode architecture, drawn on a whiteboard.
- One system design question per week (rate limiter, webhook processor, job scheduler, report pipeline).
- DSA for SDE loops: arrays/strings, hashing, two pointers, BFS/DFS, heaps, DP basics; ~150 problems.
