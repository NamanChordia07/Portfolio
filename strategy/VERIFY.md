# Verify before sending any resume

I had no access to our earlier conversations in this session, so work details came from your
old resume, the brief you wrote, and your repositories. Everything below is phrased
conservatively. Confirm each item, and where the answer is a number, add it: numbers are the
single biggest improvement still available.

## Must confirm (the resume is wrong if these are)

| # | Claim on the resume | Question | If different |
|---|---|---|---|
| 1 | "Business Intelligence & Automation **Intern**, Jul 2025 – Present" | Is this still your title? Were you converted (e.g. Associate / Software / Automation Engineer)? | Use the real title. An "intern" title for 14+ months after graduating is the first thing a screener will question. |
| 2 | Forecast-review pipeline "Dockerised, through SIT/UAT" | Did it reach production? How many clients or reports has it produced? | Say "deployed to production" only if true; add volume. |
| 3 | "LLM-written commentary (Microsoft AI Builder)" | Was AI Builder the model interface? Any other models (Gemini, Azure OpenAI)? | Name what you used. |
| 4 | G3 Playwright checks "across Salesforce, the product UI and database, in Docker" | Is the Salesforce part automated, or read from an export? Is the DB check a direct query? | Adjust the verbs. |
| 5 | "saving the team ~3 hours of manual tracking" | Per day, per week, or total? | Write "~3 hours/day" (or /week). Without a period it reads as vague. |
| 6 | Streamlit pricing app "split into config, validation, calculation and chart services" | Accurate description of the structure? Who uses it, how often? | Add users or frequency if known. |
| 7 | ClueCode "270+ automated tests" | Your repo's status doc records 279 passing runs (138 web, 13 shared, 67 desktop unit, 11 security/a11y, 43 web E2E, 7 installer); the source has ~200 test declarations. | Keep "270+" only if that is your latest green run; otherwise "200+". |
| 8 | Portfolio URL `namanchordia.vercel.app` | Is this the project name you will deploy under? | Change `person.links` in `resume/content.yaml` and rebuild. |
| 9 | Proofline link `github.com/NamanChordia07/proofline` | That repo does not exist yet. | Create it (steps in `strategy/REPORT.md`) before sending, or the link 404s. |
| 10 | Cyber Cell "5+ workshops and CTFs, 150+ students" | Unchanged from your old resume. Still accurate? | |

## Numbers worth finding (each one upgrades a bullet)

- Forecast reviews: reports generated per month, clients covered, time per report before vs. after.
- G3 checks: checks per client onboarding, minutes saved per onboarding, misconfigurations caught.
- Pricing app: users, analyses per week, time per analysis before vs. after.
- At-a-Glance: API latency before/after the query work; number of clients migrated by the toggle.
- Proofline on a real model: run `proofline eval-llm --provider gemini --n 5` with your key and
  report first-draft vs. final error rate. This single number would be the strongest line on
  the AI resume.

## Things I deliberately left out

- ORBIT and Vouch (no code found).
- Smartsheet (listed in your brief, but I could not tell what the integration does).
- "HRR" and "decision validation" specifics in the pricing app (unclear meaning; kept generic).
- Internal project codenames (ROA, Elevate, V1_FR / V2_FR): replaced with descriptions a
  recruiter understands and that do not expose internal naming.
- Anything about PID forms.
