# Final report: professional repositioning

Date: 29 September 2026. Branch: `claude/naman-professional-repositioning-dn5xnl`.

## 1. Career positioning

**Software engineer who turns messy, real-world workflows into reliable systems: automation
where it is enough, AI where it earns its place, and the checks that make both safe to ship.**

The positioning is deliberately one idea that works for all three targets:

- **FDE:** you already do forward-deployed work internally: you take a cross-system manual process
  (Salesforce + product + DB, a care mailbox, client report assembly), automate it and take it
  through SIT/UAT. ClueCode proves you can own a product end to end, including payments and deployment.
- **Applied AI:** LLM commentary in production-bound report automation, a live multimodal Gemini app,
  and Proofline, whose held-out benchmark with ablations and a baseline answers the 2026 question
  "how do you know it works?".
- **SDE:** Java/Spring Boot + Angular modernization, and ClueCode's backend design (database-enforced
  leases, idempotent webhooks, security model, 270+ tests). AI is the differentiator, not the identity.

Cybersecurity is kept as one line (and it quietly strengthens ClueCode's security story).

## 2. Current professional identity (one line per surface)

- Resume headline (FDE): *Software Engineer · Enterprise Automation, Integration & Applied AI*
- Resume headline (AI): *Applied AI Engineer · LLM Systems, Evaluation & Automation*
- Resume headline (SDE): *Software Engineer · Backend, Full-Stack & Automation*
- Website: *"I build automation and AI systems for messy, real-world workflows, and the checks that make them safe to ship."*
- Suggested LinkedIn headline: *Software Engineer, AI & Automation at IDeaS (a SAS company) · Building Proofline · Shipped ClueCode*

## 3. Experience discovered

I had **no access to our earlier conversations** in this session. Sources used: your old resume, the
brief you wrote (which lists the work areas), your private `cluecode` repository, and the Windals and
Hospital-Inventory group repos. Findings:

| Area | What the evidence supports |
|---|---|
| IDeaS, AI & Automation Developer (full-time, Nov 2025 – present) | Forecast-review report pipeline (Python; PDF/Word/Excel; charts; AI Builder commentary; Docker; SIT/UAT/hypercare; standard vs limited-history builds). G3 configuration checks with Playwright across Salesforce/UI/DB in Docker. Streamlit pricing analytics (BAR trends, property/chain extraction, decision validation; modular services). |
| IDeaS, BI & Automation Intern (Jul – Oct 2025) | Power Automate care-mailbox automation (~3 h saved). |
| IDeaS, Software Developer Intern (Jan – Jun 2025) | At-a-Glance JSP/Struts → Angular + Spring Boot; REST APIs; SQL/Streams optimisation; date-range APIs; SQL-migration feature toggle. |
| IFM Engineering (Jul – Dec 2024) | Security audits (XSS, SQLi, misconfiguration), scan automation. |
| ClueCode (Sep 2026, live) | Verified from the repo: Electron 44 + Next.js 16 + Neon/Drizzle + Better Auth + Razorpay; DB-enforced session leases; signed idempotent webhooks; DPAPI BYOK; strict Electron security; threat model; 279 recorded passing test runs (~200 declarations). |
| ORBIT, Vouch | **No code found** in any repository this session could reach. Not listed. |

Everything I could not confirm is listed in `strategy/VERIFY.md`, with the exact questions.

## 4. Projects retained

Proofline (new), ClueCode, and the IDeaS work (forecast reviews, G3 checks, pricing app, care mailbox,
At-a-Glance). Security internship as one line; Cyber Cell and Data Viz-a-thon combined into one line.

## 5. Projects removed

Real-Time Job Tracking Portal (group CRUD project; the 50%/30% figures were not measured), Hospital
Inventory (MERN CRUD; the 40% figure is not defensible), the Coursera certificate (replaced by real
Spring Boot work), and the relevant-coursework line.

## 6. New project ideas considered

| Idea | Decision |
|---|---|
| **Proofline**: deterministic verification of numbers in LLM-written reports | **Built** |
| Self-healing Playwright locators | Rejected: crowded (Playwright healer agent, Healwright, Healenium) |
| Agent tracing / observability | Rejected: Langfuse, Phoenix, Braintrust |
| RAG over PDFs, chatbots | Rejected: generic |
| ORBIT rebuild | Not done: it is your project and its state is unknown |
| Next for you to build (in order) | (a) Proofline LLM-assisted attribution + real-model eval; (b) a small RAG or retrieval feature *inside* a real workflow, measured (fills the biggest AI keyword gap honestly); (c) ORBIT with a fixed task suite and success-rate/cost metrics |

## 7. Projects actually built

**Proofline** (`projects/proofline`, ~2,100 lines of source plus tests):

- fact-sheet computation (ratio-of-sums, bases from column suffixes or the previous period, IDs and derivations);
- number parsing with display-precision intervals, hedges, K/M/lakh/crore, bps and points;
- clause-aware claim attribution (metric, entity, basis, direction, polarity, anaphora, headings);
- verification with diagnosis (value, direction, basis, entity, metric, scale, currency, points/percent);
- minimal repair; guarded generation loop with Gemini and Claude providers (official SDKs);
- CLI (exit code gating), MCP server (4 tools), HTML provenance report;
- benchmark: 3 domains, 9 error types, independent ground truth, dev + 3 held-out families, 3 ablations, naive baseline;
- 62 tests, 93% coverage, `mypy --strict`, `ruff`, CI.

Measured, first run per held-out family: **98.9–100% of injected errors caught at 1.1–4.5% false
alarms, vs 16–20% for a naive lookup**; the naive lookup catches **0%** of direction, basis, entity,
metric and points/percent errors. After fixing what the held-out runs exposed: 99.9–100% recall at
0.03–1.1% false alarms. Not yet measured: real-model error rates (`proofline eval-llm` exists; run it).

**Important:** I built Proofline in this session. Before it goes in front of an interviewer you must
own it: read the code, run it, run `eval-llm` with your key, and ideally build the LLM-assisted
attribution extension yourself. `strategy/INTERVIEW_PREP.md` lists what you must be able to explain.

## 8. Why these projects matter

- Proofline is evidence of the single most-requested 2026 AI-engineering skill (evaluation), framed
  around a real enterprise failure mode you have lived (LLM commentary over numbers), and it is safe
  to open-source. It also gives you an MCP server, which Anthropic's FDE posting names directly.
- ClueCode is production full-stack engineering with the details senior engineers look for:
  invariants in the database, idempotency, a threat model, and tests.
- The IDeaS work is real enterprise integration, the core of FDE work.

## 9. Resume changes

- Three role-specific one-page resumes from one YAML source; PDF + DOCX + public (no phone) copies.
- Title line per role; 2-line summary; experience rewritten as action + specifics + outcome; internal
  codenames replaced with descriptions; company written as *IDeaS Revenue Solutions (a SAS company)*.
- Unmeasured percentages removed; the only work metric kept is the one you stated (~3 hours).
- Education moved to the bottom (you now have ~2 years of work); CGPA kept.
- Every bullet tuned to at most two lines with no orphan words (`resume/layout.py`).

## 10. ATS testing

`resume/ats_check.py` (report in `resume/ATS_REPORT.md`). All six PDFs **pass**: one page, text
extracts in reading order, every bullet contiguous, standard headings, contact fields and all role
date ranges parse, fonts embedded, no images. Core JD-term coverage: **FDE 90%, AI 93%, SDE 95%**.
Missing terms were added only where there was evidence ("hallucination", "full-stack",
"customer-care", "production"); the rest are real gaps (see section 16).

Not done: Jobscan / Resume Worded. They need an account and the specific job description; the network
here blocks them anyway. Run them per application with the JD you are applying to; aim for the
coverage you see above, and never paste in keywords you cannot defend.

## 11. Hiring-manager assessment (after revisions)

**Would I interview?** For FDE and Applied AI roles at strong mid-size AI companies and Indian
product companies at ~15–30 LPA: yes, and Proofline plus ClueCode would be the reason. For the frontier
labs' FDE roles (4–5+ years required) and Google/Microsoft/Amazon SDE loops: the resume can get a
screen, but experience length and DSA will decide.

**Strongest evidence:** ClueCode's backend design; Proofline's evaluation protocol; the breadth of
real integration work at IDeaS.

**What looks weak or will be challenged:**
1. ~~Intern title~~ Resolved: full-time AI & Automation Developer since Nov 2025, now on every resume and the site.
2. Few work metrics. Add volumes and time saved (list in `VERIFY.md`).
3. Both projects dated September 2026. Expect "did AI write this?"; prepare as in `INTERVIEW_PREP.md`.
4. ClueCode's category (screen-reading AI overlay). Change the site copy before applying (see `AUDIT.md`).
5. Proofline's benchmark is synthetic; get real-model numbers.
6. No customer-facing evidence stated for FDE; add it if true.

## 12. Portfolio architecture

Next.js 16 App Router, TypeScript (strict), Tailwind CSS 4, Motion, Geist fonts. All routes static:
`/`, `/work/proofline`, `/work/cluecode`, `/work/enterprise-automation`, `/resume`, plus per-route
Open Graph/Twitter images, `sitemap.xml`, `robots.txt`, `icon.svg`. Content lives in
`src/content/site.ts` (typed; every number is a sourced `Claim`) and `src/content/proofline-demo.json`
(exported from the engine). Security headers include a strict CSP. Tests: Vitest (content integrity,
including a check that headline numbers match the exported benchmark) and Playwright (every page ×
desktop/mobile, axe WCAG 2.1 AA in light and dark, downloads, demo interaction, theme persistence,
mobile menu, tooltips, overflow, SEO, 404). CI workflows for the site and for Proofline.

## 13. Design rationale

- **Original concept, not a template:** "every number has a receipt". Dotted-underlined figures reveal
  their source; the hero is a real verification receipt; the Proofline demo lets a visitor inspect
  real verdicts. The site demonstrates the way you think instead of describing it.
- Premium minimal: typographic hierarchy, generous spacing, a faint grid only in the hero, one accent
  colour reserved for verified states (green) with red/amber for contradicted/unverifiable.
- No stock imagery, particles, neon or gratuitous motion; CSS load-in only, off under reduced motion.
- Case studies follow problem → decisions → evidence → limitations, the order a senior engineer reads.

## 14. Vercel URL

**Not deployed from here.** This environment's network policy blocks `api.vercel.com`, and there is
no Vercel token. Everything is ready for Vercel's GitHub import, which needs no token: see
"Deploy to Vercel" in the root `README.md`. Expected URL: `https://namanchordia.vercel.app` (if that
project name is free; otherwise update `NEXT_PUBLIC_SITE_URL` and the resume link as described).

## 15. Interview risks

See `strategy/INTERVIEW_PREP.md`. Top four: ClueCode's category; AI-assisted
authorship of recent projects; a synthetic benchmark; confidentiality when describing IDeaS work.

## 16. Skills to strengthen next

1. **Real-model evaluation**: run `proofline eval-llm` on Gemini and Claude; publish the numbers.
2. **Retrieval (RAG, embeddings, a vector store, reranking)**: the largest AI-JD gap; build it into a
   real workflow and measure it, rather than a PDF chatbot.
3. **Cloud**: one AWS or GCP deployment with IaC (a Proofline API on Cloud Run/Lambda is a natural fit),
   plus basic Kubernetes literacy.
4. **DSA and system design** for SDE loops: ~150 problems; one design problem a week.
5. **Customer-facing evidence** for FDE: write up (internally-safe) one engagement where you gathered
   requirements from a non-engineering stakeholder and shipped against them.
6. **Agents**: tool-using agents with evals (ORBIT is the natural home, with a fixed task suite).
