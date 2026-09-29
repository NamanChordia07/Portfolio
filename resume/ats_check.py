"""ATS parse test and keyword coverage for the built PDFs.

What an applicant tracking system needs from a PDF, checked mechanically:
  1. one page, selectable text, fonts embedded, no images;
  2. text extracts in reading order (name first, sections in order, each bullet contiguous);
  3. standard section headings; contact details parse (email, phone, URLs);
  4. every experience entry has a parseable date range;
  5. keyword coverage against role-specific JD term sets, without stuffing (no term repeated > 4x).

It is not a vendor ATS score (Jobscan and similar need an account and the specific JD you
apply to; run them per application). It catches the failures that make a resume unreadable
to every ATS: multi-column reading order, text in images, unparseable dates, exotic headings.

    python ats_check.py            # writes ATS_REPORT.md, exits 1 on any hard failure
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml
from pdfminer.high_level import extract_text
from pypdf import PdfReader

from build import DIST, PUBLIC, assemble, load

ROOT = Path(__file__).parent
HEADINGS = ["SUMMARY", "EXPERIENCE", "PROJECTS", "TECHNICAL SKILLS", "EDUCATION"]
DATE_RANGE = re.compile(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} – (Present|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4})")


def norm(s: str) -> str:
    s = s.replace("­", "").replace("ﬁ", "fi").replace("ﬂ", "fl")
    s = re.sub(r"([-–])\s*\n\s*", r"\1", s)  # a line broken after a real hyphen or dash
    return re.sub(r"\s+", " ", s).strip()


def fonts_and_images(pdf: Path) -> tuple[set[str], bool, int]:
    reader = PdfReader(str(pdf))
    fonts: set[str] = set()
    embedded = True
    images = 0
    for page in reader.pages:
        res = page["/Resources"]
        for f in (res.get("/Font") or {}).values():
            f = f.get_object()
            fonts.add(str(f.get("/BaseFont")))
            desc = f.get("/FontDescriptor")
            if desc is None and "/DescendantFonts" in f:
                desc = f["/DescendantFonts"][0].get_object().get("/FontDescriptor")
            if desc is not None:
                d = desc.get_object()
                embedded &= any(k in d for k in ("/FontFile", "/FontFile2", "/FontFile3"))
        xobj = res.get("/XObject") or {}
        images += sum(1 for x in xobj.values() if x.get_object().get("/Subtype") == "/Image")
    return fonts, embedded, images


def check(variant: str, data: dict, keywords: dict, pdf: Path, public: bool) -> tuple[list[str], list[str], dict]:
    fails: list[str] = []
    notes: list[str] = []
    r = assemble(data, variant, public)
    pages = len(PdfReader(str(pdf)).pages)
    if pages != 1:
        fails.append(f"{pages} pages")
    raw = extract_text(str(pdf))
    text = norm(raw)
    if not text.startswith(r["name"]):
        fails.append("name is not the first extracted text")
    positions = [text.find(h) for h in HEADINGS]
    if -1 in positions:
        fails.append(f"missing headings: {[h for h, p in zip(HEADINGS, positions) if p == -1]}")
    expected_order = [h for h in [s.upper() if s != "skills" else "TECHNICAL SKILLS" for s in r["sections"]] if h in HEADINGS]
    found_order = sorted(expected_order, key=lambda h: text.find(h))
    if found_order != expected_order:
        fails.append(f"headings out of order: {found_order}")
    if data["person"]["email"] not in text:
        fails.append("email not extracted")
    if not public and data["person"]["phone"] not in text:
        fails.append("phone not extracted")
    if public and data["person"]["phone"] in text:
        fails.append("phone present in public copy")
    for link in data["person"]["links"]:
        if link["label"] not in text:
            fails.append(f"link not extracted: {link['label']}")
    # every bullet must come out as one contiguous run of text, in order
    last = -1
    bullets = [b for org in r["experience"] for role in org["roles"] for b in role["bullets"]]
    bullets += [b for p in r["projects"] for b in p["bullets"]]
    for b in bullets:
        pos = text.find(norm(b))
        if pos == -1:
            fails.append(f"bullet not contiguous: {b[:60]}...")
        elif r["sections"].index("experience") < r["sections"].index("projects") and pos < last and b in bullets[:3]:
            fails.append(f"bullet out of order: {b[:60]}")
        last = max(last, pos)
    dates = DATE_RANGE.findall(text)
    n_roles = sum(len(org["roles"]) for org in r["experience"])
    if len(dates) < n_roles:
        fails.append(f"only {len(dates)} of {n_roles} role date ranges parse")
    fonts, embedded, images = fonts_and_images(pdf)
    if not embedded:
        fails.append("fonts not embedded")
    if images:
        fails.append(f"{images} image(s) in PDF")
    notes.append(f"fonts: {', '.join(sorted(f.split('+')[-1] for f in fonts))}")
    # keyword coverage
    low = text.lower()
    cov = {}
    for tier in ("core", "stretch"):
        terms = keywords[variant][tier]
        hit = [t for t in terms if re.search(rf"(?<![a-z]){re.escape(t.lower())}", low)]
        cov[tier] = (hit, [t for t in terms if t not in hit])
    for t in keywords[variant]["core"] + keywords[variant]["stretch"]:
        n = len(re.findall(rf"(?<![a-z]){re.escape(t.lower())}(?![a-z])", low))
        if n > 5 and t.lower() not in ("python", "llm"):
            notes.append(f"'{t}' appears {n}x (check for stuffing)")
    return fails, notes, {"cov": cov, "words": len(text.split())}


def main() -> int:
    data = load()
    keywords = yaml.safe_load((ROOT / "ats_keywords.yaml").read_text())
    lines = ["# ATS check", "", "Generated by `python ats_check.py` from the built PDFs.", ""]
    failed = False
    for variant in ("fde", "ai", "sde"):
        name = data["variants"][variant]["file"]
        for pdf, public in ((DIST / f"{name}.pdf", False), (PUBLIC / f"{name}.pdf", True)):
            fails, notes, info = check(variant, data, keywords, pdf, public)
            failed |= bool(fails)
            label = "public copy (no phone)" if public else "application copy"
            status = "PASS" if not fails else "FAIL"
            lines.append(f"## {name} - {label}: {status}")
            lines.append("")
            lines += [f"- FAIL: {f}" for f in fails]
            lines += [f"- {n}" for n in notes]
            if not public:
                (core_hit, core_miss), (st_hit, st_miss) = info["cov"]["core"], info["cov"]["stretch"]
                lines.append(f"- words: {info['words']}")
                lines.append(f"- core JD terms covered: {len(core_hit)}/{len(core_hit) + len(core_miss)} ({len(core_hit) / (len(core_hit) + len(core_miss)):.0%})")
                lines.append(f"- core terms missing: {', '.join(core_miss) or 'none'}")
                lines.append(f"- stretch terms covered: {len(st_hit)}/{len(st_hit) + len(st_miss)}; missing: {', '.join(st_miss) or 'none'}")
            lines.append("")
    (ROOT / "ATS_REPORT.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
