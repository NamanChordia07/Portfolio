# Research notes

## Scope and honesty about method

The brief asked for ~50 resumes per role and 20-30 portfolios. From this environment the
network policy blocked direct fetches of job boards (Lever, Greenhouse, Built In) and most
sites; only search-engine summaries were reachable. So this is a synthesis of: current job
descriptions retrieved through search (OpenAI, Anthropic, Palantir FDE roles; Google,
Microsoft, Amazon early-career SDE; 2026 AI-engineer hiring guides), plus established
patterns from strong engineering resumes and portfolios that I know well. I did not read 150
individual resumes and do not claim to have.

## What the job descriptions ask for

**Forward Deployed Engineer** (OpenAI, Anthropic Applied AI, Palantir FDSE, India FDE postings)
- Own customer problems end to end: scope, build, deploy, iterate; "startup CTO"-like ownership (Palantir).
- Production code across frontend and backend, usually Python plus TypeScript/Java.
- For AI labs: production LLM experience, agent development, evaluation frameworks; Anthropic lists
  deliverables such as MCP servers, sub-agents and agent skills.
- Customer-facing communication; travel; comfort with ambiguity.
- Senior bars (4-5+ years at the labs). India entry-level FDE roles cite ~18-28 LPA and "2+ years
  shipping production systems". Palantir hires new-grad FDSEs.

**Applied AI Engineer**
- Integrate LLM APIs, build agents/tool use, RAG, and evals that catch regressions; reason about
  cost and latency; ship to production.
- 2026 hiring guides are blunt: an AI resume without evaluation reads as "shipped unevaluated
  features"; a linked repo with evals beats polished bullets.

**SDE (Google / Microsoft / Amazon, early career, India)**
- CS fundamentals (data structures, algorithms, OOP, OS), one strong language (Java/C++/Python),
  testing, debugging; distributed systems and cloud as pluses.

## Requirement → evidence matrix

| Requirement (from JDs) | Evidence you have | Strength |
|---|---|---|
| Ship production systems | ClueCode live (payments, auth, updates); report pipeline through SIT/UAT | Strong / confirm prod |
| Enterprise integration | Playwright checks across Salesforce, product UI, DB; Power Automate + Excel; Smartsheet (unconfirmed) | Strong |
| Python | Report pipeline, Streamlit app, Proofline | Strong |
| Java / Spring Boot | At-a-Glance migration | Medium (6 months) |
| TypeScript / frontend | Angular (work), Next.js + Electron + React (ClueCode) | Strong |
| SQL / databases | Query optimisation at IDeaS; Postgres schema with constraints in ClueCode | Strong |
| LLM integration | AI Builder commentary; Gemini streaming in ClueCode; Gemini/Claude in Proofline | Medium-strong |
| Evaluation / evals | Proofline benchmark (held-out protocol, ablations, baseline) | Strong (synthetic); needs a real-model run |
| Agents / tool use / MCP | Proofline MCP server; guarded generation loop | Medium |
| RAG / embeddings / vector DB | None | **Gap** |
| Fine-tuning | None | Gap (lower priority for FDE/applied roles) |
| Cloud (AWS/GCP/Azure), Kubernetes | Vercel, Neon, Docker only | **Gap** |
| Customer-facing work | Internal teams (SPM/service delivery); client reports | Unclear, confirm |
| CS fundamentals | Degree (8.9 CGPA); nothing visible on the resume | Show in interviews / a DSA-heavy project |

## Resume patterns applied

- One page, one column, reverse chronological; Experience before Projects except on the AI resume,
  where the strongest AI evidence is project work.
- Bullets as compressed case studies: action + technical specifics + outcome. Numbers only where real.
- Role-specific headline under the name matching the target title (helps both ATS and the 6-second skim).
- Skills grouped by what the role screens for, no proficiency bars, no soft-skill lists.
- Education at the bottom (you now have ~2 years of work); CGPA kept (8.9 is an asset in India).
- Old college CRUD projects removed; unmeasurable percentages removed.

## Portfolio patterns (from sites of engineers I know well)

Examples of the patterns, not templates copied: Lee Robinson (typographic minimalism, writing-first),
Brittany Chiang (sticky index + dense experience list), Rauno Freiberg and Emil Kowalski (restrained
motion, craft in details), Paco Coursey (almost no chrome), Josh Comeau (interactive explanations),
Anthony Fu (projects as a clean index), Simon Willison (show your work in public), Andrej Karpathy
(plain, content-dense). What the best share: one clear sentence of identity above the fold; work
presented as case studies with the problem, the approach, and a result; fast; quiet typography; no
stock imagery; dark mode done properly.

Design decisions for this portfolio are in `../README.md` (Portfolio section) and the final report.

## Sources

- Palantir FDSE new grad and experienced postings (jobs.lever.co/palantir, via search summaries)
- OpenAI Forward Deployed Engineer postings (builtin.com, via search summaries)
- Anthropic Forward Deployed Engineer / Applied AI postings (job-boards.greenhouse.io/anthropic, via search summaries)
- Google Software Engineer early career 2026, Microsoft Software Engineer India, Amazon SDE I (via search summaries)
- FDE and AI-engineer 2026 guides: tryexponent.com, fde.academy, secondtalent.com, levstack.io, kore1.com (via search summaries)
- LLM numeric hallucination work that frames Proofline: FinGround (arXiv 2604.23588), VeriFin (arXiv 2608.10213),
  Proof-Carrying Numbers (arXiv 2509.06902), FinVerBench (arXiv 2605.29586)
- Self-healing test tooling reviewed and rejected as a project idea: Playwright healer agent, Healwright, Healenium
