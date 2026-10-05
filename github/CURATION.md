# GitHub curation plan

What a recruiter sees in the first ten seconds on github.com/NamanChordia07 is the profile
README, the pinned repositories and the contribution graph. This is the plan for each.

## 1. Repositories to create (the session cannot create them; GitHub returned 403)

| repository | visibility | contents | how |
|---|---|---|---|
| `NamanChordia07/proofline` | **public** | Proofline with its full history | Create it empty (no README, licence or .gitignore), then from the Portfolio repo: `git subtree split --prefix projects/proofline -b proofline-split && git push https://github.com/NamanChordia07/proofline.git proofline-split:main`. Or attach it to a session and ask Claude to push. Verified: a clean clone of the split passes lint, types, 71 tests and both challenge sets. |
| `NamanChordia07/NamanChordia07` | **public** | Everything in `github/profile/` (README.md and `.github/workflows/snake.yml`) | Create it empty, then ask Claude to push, or copy both files in. The snake image appears after the workflow's first run (Actions tab → Generate contribution snake → Run workflow). |
| `NamanChordia07/portfolio-site` (optional) | public | The website only | See section 4. |

The site and all three resumes already link to `github.com/NamanChordia07/proofline`; that
link is a 404 until the first row is done. **Do it before sending any application.**

After creating `proofline`, set its About box:
- Description: *Checks every number an LLM writes into a business report against the data, explains how a wrong one is wrong, and repairs it.*
- Website: the portfolio case study URL (once deployed)
- Topics: `llm`, `llm-evaluation`, `hallucination-detection`, `fact-checking`, `mcp`, `python`, `nlg`, `business-intelligence`

## 2. Pinned repositories

Pin at most what you can defend line by line. Right now that is:

1. `ai-voice-sales-agent` (public; published from your `naman-development` branch)
2. `proofline` (public, once created)
3. `portfolio-site`, if you create it (section 4)

`ai-voice-sales-agent` About box: *Outbound AI voice agent that qualifies sales leads over the phone:
streaming STT/LLM/TTS, barge-in, validated LLM actions, FreJun telephony.* Topics: `voice-ai`, `ai-agent`,
`llm`, `fastapi`, `openai`, `telephony`, `websockets`, `python`. Its history keeps Karthik's commits under
his name, which is the honest record of a two-person project.

Do **not** pin the college group repositories (`ankushkaudi/Windals`,
`Tanmayb25/Hospital-Inventory`, the `windalsweb*` sites, `American-Sign-Language-Detection`).
They are other people's repositories with CRUD-level work and would pull the profile down.
Two strong pins beat six weak ones. Add ORBIT or Vouch only once there is working code,
a README and tests to show.

## 3. Keep private

- `NamanChordia07/Portfolio` (this monorepo). It contains `strategy/` (your career notes and
  interview preparation) and `resume/dist/` (application copies **with your phone number**).
  Vercel deploys private repositories without any problem.
- `NamanChordia07/cluecode`. It is a commercial product; the live site is the evidence, and
  the resume describes the engineering. Offer a code walkthrough in interviews instead.

## 4. Optional: a public repository for the website

A public site repo is good SDE evidence (Next.js 16, TypeScript, Tailwind v4, Playwright and
axe accessibility tests, CSP headers). It must not include `strategy/`, `resume/` or
`projects/`. One way, from a fresh clone of the Portfolio repo:

```bash
git clone https://github.com/NamanChordia07/Portfolio.git site && cd site
git checkout claude/naman-professional-repositioning-dn5xnl   # or main, once merged
git filter-branch --index-filter 'git rm -r -q --cached --ignore-unmatch strategy resume projects github' --prune-empty HEAD
grep -rn "$(printf '%s' 'YOUR-PHONE-NUMBER')" . && echo "STOP: phone number still present"
git push https://github.com/NamanChordia07/portfolio-site.git HEAD:main
```

`public/resume/*.pdf` stays: those are the website copies without the phone number. Then
point Vercel at `portfolio-site` instead of `Portfolio`, or keep deploying from the private
repo and treat the public one as a mirror.

## 5. Contribution graph and hygiene

- Commit under the email on your GitHub account so work counts on the graph.
- Every public repository gets a README that starts with what it does and one result, a
  licence, and CI that is green. A red badge is worse than no badge.
- No secrets anywhere: keys only in `.env` (gitignored) or CI/Vercel secrets. `.env.example`
  files list the names only.
