# Resumes

Four one-page resumes built from one source of truth: one combined version for the website and three role-specific versions for applications.

| file | for |
|---|---|
| `dist/Naman_Chordia_FDE_Resume.pdf` / `.docx` | Forward Deployed Engineer, Solutions / Integration Engineer |
| `dist/Naman_Chordia_AI_Engineer_Resume.pdf` / `.docx` | Applied AI Engineer, AI Engineer, LLM Engineer |
| `dist/Naman_Chordia_SDE_Resume.pdf` / `.docx` | Software Engineer, SDE, Backend / Full-Stack Engineer |
| `dist/Naman_Chordia_Resume.pdf` / `.docx` | General (the website's copy is `../public/resume/Naman_Chordia_Resume.pdf`) |

`dist/` copies include your phone number (for applications). Only the combined resume is copied to
`../public/resume/` (served by the website), without the phone number.

## Edit and rebuild

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install python-docx playwright pypdf pyyaml pdfminer.six pypdfium2 pillow
# Playwright needs a Chromium: set CHROME_PATH, or run `playwright install chromium` once.

python build.py --check     # PDFs + DOCX; fails if any PDF is not exactly one page
python layout.py dist/*.html   # line count and last-line fill per bullet (flags orphans)
python ats_check.py         # ATS parse test + JD keyword coverage -> ATS_REPORT.md
python render_pages.py dist/Naman_Chordia_FDE_Resume.pdf /tmp/pages   # PNG preview
```

All wording lives in `content.yaml`. Each bullet can carry a default `text` plus
`fde` / `ai` / `sde` rewrites, an `in:` list and a per-variant `rank`.

## Design choices (ATS and human)

- Single column, black on white, standard headings, no tables, icons, photos or skill bars.
- Embedded Source Sans 3 (SIL OFL, see `fonts/OFL.txt`); text is selectable and extracts in reading order.
- Dates in `Mon YYYY – Mon YYYY` form, right-aligned but in reading order after the title.
- Links are written out as text so they survive printing and parsing.
- A4 page size (India default); change `@page` in `build.py` for US Letter.
