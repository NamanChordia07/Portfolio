# Naman Chordia · portfolio, resumes and projects

This repository holds everything behind my professional profile:

| Path | What it is |
|---|---|
| `src/`, `public/` | The portfolio website (Next.js 16, TypeScript, Tailwind CSS 4, Motion). |
| `projects/proofline/` | **Proofline**: verifies every number in LLM-written reports. Python library, CLI, MCP server, benchmark. Its own README, tests and CI. |
| `resume/` | Three one-page resumes (FDE, AI Engineer, SDE) built from one YAML source into PDF and DOCX, with an ATS check. |
| `strategy/` | Positioning, project audit, research, claims to verify, interview preparation, and the final report. |

## Website

```bash
npm install
npm run dev            # http://localhost:3000
npm run check          # lint + typecheck + unit tests + production build
npm run test:e2e       # Playwright: pages, downloads, demo, theme, mobile, SEO, axe WCAG 2.1 AA (light + dark)
# if Playwright's own Chromium is not installed:  CHROME_PATH=/path/to/chrome npm run test:e2e
```

Design notes:

- **Concept: every number has a receipt.** Figures on the site render through `Claim`, which shows its
  source on hover or keyboard focus (a bottom card on phones). It is the Proofline idea applied to the site itself.
- **Real output, not mock-ups.** The Proofline case study embeds the verifier's actual output, exported by
  `python -m proofline.export_demo src/content/proofline-demo.json` (run from `projects/proofline`).
- Typography-led, quiet layout: Geist Sans and Mono, one accent colour used only for verified states, light
  and dark themes (system default, stored choice, no flash), CSS-only load-in motion that respects reduced motion.
- Static pages, per-route Open Graph images, sitemap, robots, JSON-LD `Person`, canonical URLs, strict security headers.

### Deploy to Vercel

1. Vercel → **Add New… → Project** → import `NamanChordia07/Portfolio`. Next.js is detected; keep the defaults
   (root directory `./`, `npm run build`).
2. Name the project `namanchordia` to get `namanchordia.vercel.app` (the URL the resumes print). If you use another
   name or a custom domain, set `NEXT_PUBLIC_SITE_URL=https://your-domain` in the project's environment variables,
   update `person.links` in `resume/content.yaml`, and rebuild the resumes (`cd resume && python build.py --check`).
3. Merge this branch into `main` (or set it as the production branch), and Vercel deploys on every push.

## Give Proofline its own public repository

The resumes link to `github.com/NamanChordia07/proofline`. Create that empty public repository, then:

```bash
git subtree split --prefix projects/proofline -b proofline-split
git push https://github.com/NamanChordia07/proofline.git proofline-split:main
```

The split repository includes its own CI (`projects/proofline/.github/workflows/ci.yml`).

## Resumes

See `resume/README.md`. Short version: edit `resume/content.yaml`, then `python build.py --check`,
`python layout.py dist/*.html`, `python ats_check.py`.
