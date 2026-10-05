# Naman Chordia · portfolio, resumes and projects

This repository holds everything behind my professional profile. Proofline, the LLM report verifier, lives in its own
repository: [NamanChordia07/Proofline](https://github.com/NamanChordia07/Proofline).

| Path | What it is |
|---|---|
| `src/`, `public/` | The portfolio website (Next.js 16, TypeScript, Tailwind CSS 4, Motion). |
| `resume/` | Four one-page resumes (combined, FDE, AI Engineer, SDE) built from one YAML source into PDF and DOCX, with an ATS check. |
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

- **Look:** near-black (warm paper in light mode), one ember accent, Instrument Serif display type with
  italic accent words over Geist Sans and Mono. Dark is the default; the light theme is stored once chosen
  (no flash). Full-bleed layout up to 1560px.
- **Interaction:** the cursor carries a soft red light (bigger over anything clickable, brighter while scrolling;
  on phones it follows the finger), and every click or tap throws a ring of sparks. Cards lean toward the pointer
  and light their borders; the footer wordmark fills with ember under the cursor; numbers count up to their sourced
  values; section labels decode into place; the tech marquee speeds up and reverses with scroll; a reading-progress
  line runs along the top. Also: a portrait card that tilts in 3D, magnetic buttons, a ⌘K / Ctrl K command menu,
  live CSS visuals on each project card, a scroll-filled timeline. On phones, long text shows two lines with
  "Read more". Everything degrades to a still, complete page under reduced motion or without JavaScript.
- **Every number has a receipt.** Figures render through `Claim`, which shows its source on hover or keyboard
  focus (a bottom card on phones).
- **Real output, not mock-ups.** The Proofline case study and card embed the verifier's actual output, exported by
  `python -m proofline.export_demo <path-to-this-repo>/src/content/proofline-demo.json --html docs/demo` (run from a
  Proofline checkout).
- Static pages, per-route Open Graph images with the portrait, sitemap, robots, JSON-LD `Person`, canonical URLs,
  strict security headers. Axe WCAG 2.1 AA passes in both themes on desktop and mobile.

### Deploy to Vercel

1. Vercel → **Add New… → Project** → import `NamanChordia07/Portfolio`. Next.js is detected; keep the defaults
   (root directory `./`, `npm run build`).
2. Name the project `namanchordia` to get `namanchordia.vercel.app` (the URL the resumes print). If you use another
   name or a custom domain, set `NEXT_PUBLIC_SITE_URL=https://your-domain` in the project's environment variables,
   update `person.links` in `resume/content.yaml`, and rebuild the resumes (`cd resume && python build.py --check`).
3. Merge this branch into `main` (or set it as the production branch), and Vercel deploys on every push.

## Resumes

Four one-page versions come from `resume/content.yaml`: a combined resume (the only one on the website,
`public/resume/Naman_Chordia_Resume.pdf`) and FDE, AI Engineer and SDE versions for applications (`resume/dist/`,
with .docx). All four carry the phone number. See `resume/README.md`. Short version: edit
`resume/content.yaml`, then `python build.py --check`, `python layout.py dist/*.html`, `python ats_check.py`.
