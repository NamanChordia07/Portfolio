# Project audit

Scores are 1-5, judged as a hiring manager for each role would judge them. Evidence column
says where the facts come from; nothing here is taken on faith from the old resume alone.

| Project | Tech depth | AI depth | SWE depth | Business value | Differentiation | Interview value | FDE | AI Eng | SDE | Status | Evidence | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Proofline** (LLM report verification) | 5 | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 4 | Built and tested (Sep 2026) | `projects/proofline`, 58 tests, benchmark | **BUILD → KEEP (lead AI/FDE project)** |
| **ClueCode** (desktop AI assistant, subscriptions) | 5 | 3 | 5 | 3 | 4 | 5 | 4 | 3 | 5 | Live at cluecode.in | private repo `NamanChordia07/cluecode`, docs, ~200 test declarations / 279 recorded passing runs | **KEEP (lead SDE project)**, with positioning caveat below |
| Forecast-review report automation (IDeaS) | 4 | 3 | 4 | 5 | 3 | 5 | 5 | 4 | 4 | Work, SIT/UAT per brief | your brief | **KEEP** as top work bullet |
| G3 configuration checks with Playwright (IDeaS) | 3 | 1 | 4 | 4 | 3 | 4 | 5 | 2 | 4 | Work | your brief | **KEEP** |
| Pricing analytics app, Streamlit (IDeaS) | 3 | 1 | 3 | 4 | 2 | 3 | 4 | 3 | 3 | Work | your brief | **KEEP**, one bullet, reframed as architecture not "a dashboard" |
| Customer-care mailbox automation (IDeaS) | 2 | 1 | 2 | 4 | 2 | 3 | 4 | 1 | 2 | Work, ~3 h saved | old resume + brief | **KEEP**, one bullet, the only hard metric |
| At-a-Glance migration, JSP/Struts → Angular + Spring Boot (IDeaS) | 3 | 0 | 4 | 4 | 3 | 4 | 3 | 1 | 5 | Work (Jan-Jun 2025) | old resume | **KEEP** (the Java evidence) |
| Security internship (IFM) | 2 | 0 | 2 | 3 | 1 | 2 | 2 | 1 | 2 | Done (2024) | old resume | **KEEP as one line**; supports maturity, not identity |
| ORBIT (AI browser agent) | ? | ? | ? | ? | ? | ? | - | - | - | **No code found** in any repo this session can see | brief only | **HOLD**: send the repo; list only when there is something to show (see below) |
| Vouch (formerly CheatCheck) | ? | ? | ? | ? | ? | ? | - | - | - | **No code found** | brief only | **HOLD** |
| Real-Time Job Tracking Portal (Windals) | 2 | 0 | 2 | 2 | 1 | 1 | 1 | 0 | 1 | Group college project (2023-24) | `ankushkaudi/Windals`: CRUD station/shift allocation | **REMOVE**; "50% visibility" / "30% fewer errors" were unmeasured |
| Hospital Inventory (MERN) | 1 | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | College project (2023) | `Tanmayb25/Hospital-Inventory` | **REMOVE**; "40% fewer shortages" is not defensible |
| Coursera Spring Boot certificate | - | - | - | - | - | - | - | - | - | - | old resume | **REMOVE**; real Spring Boot work replaces it |
| Cyber Cell Technical Head, Data Viz-a-thon | - | - | - | - | 2 | 2 | 2 | 1 | 1 | Done | old resume | **KEEP as one combined line** (teaching and communication) |

## Ideas considered and not built

| Idea | Why not |
|---|---|
| Self-healing Playwright locators with a mutation benchmark | Crowded in 2026 (Microsoft's Playwright healer agent, Healwright, Healenium). Would read as a clone. |
| Generic agent tracing / observability dashboard | Langfuse, Phoenix, Braintrust own this; low differentiation for the effort. |
| RAG chatbot over PDFs | Exactly the generic project the brief rules out. |
| Rebuilding ORBIT from scratch | It is your project; its current state is unknown. Building a parallel one would duplicate or overwrite your work. |

## Why Proofline was the one to build

It is the missing piece that connects everything else: the forecast-review pipeline at
IDeaS already has an LLM writing commentary over numbers, and the obvious failure mode is a
wrong number in front of a client. Proofline turns that into an engineering story with
evaluation rigour (held-out protocol, ablations, a baseline), which is what 2026 AI and FDE
job descriptions ask for and what your profile lacked. It is safe to open-source (synthetic
data, no employer code) and cheap to run (no model needed to verify).

## ClueCode positioning risk

ClueCode is your strongest engineering artifact. It also sits in the "screen-reading AI
overlay" category associated with interview-cheating tools, and it began life as
"OA Coder" (online assessment). Its site lists "Interviews" and "Meetings ... while the call
carries on" as use cases, and its prompt formats multiple-choice answers. The product does
the right things (it is an ordinary visible window, it does not evade screen sharing or
proctoring, Hint mode exists), but a recruiter at Google, Anthropic or Amazon who visits the
site before reading the code may reject on sight. Before applying:

1. Remove the "Interviews" and live-"Meetings" use cases from cluecode.in; lead with learning
   and practice (Hint and Explain modes).
2. Rename anything that still says "OA Coder" (release repo name, internal strings).
3. On the resume it is described by what it is technically, which is accurate and defensible.
4. Prepare the answer in `INTERVIEW_PREP.md`.

If you are not willing to change the site copy, drop ClueCode from the AI and FDE resumes
and keep it only on the SDE resume.

## ORBIT and Vouch

No repositories for either were visible to this session (the only repos on your account I
could reach were `Portfolio` and `cluecode`). Under the honesty rule they cannot appear as
completed work. If ORBIT exists, the strongest framing would be a browser agent with an
evaluation harness (task success rate, steps, cost per task on a fixed task set); send the
repo and it can be audited and added as "In development" or completed.
