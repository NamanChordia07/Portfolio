"""Measure every bullet's rendered line count and last-line fill, to cut orphans and fit one page.

    python layout.py dist/Naman_Chordia_FDE_Resume.html
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

from build import CHROME

JS = """
() => {
  const out = [];
  for (const el of document.querySelectorAll('li, p.summary, .contact')) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()];
    const lines = [];
    for (const r of rects) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.top - r.top) < 3) { last.right = Math.max(last.right, r.right); last.left = Math.min(last.left, r.left); }
      else lines.push({top: r.top, left: r.left, right: r.right});
    }
    const box = el.getBoundingClientRect();
    const lastLine = lines[lines.length - 1];
    const fill = lastLine ? (lastLine.right - box.left) / box.width : 0;
    out.push({text: el.textContent.slice(0, 70), lines: lines.length, fill: Math.round(fill * 100)});
  }
  const h = document.documentElement.scrollHeight;
  return {items: out, height: h};
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    page = b.new_page(viewport={"width": 794 - 106, "height": 1123})  # A4 width minus side margins, at 96 dpi
    for path in sys.argv[1:]:
        page.emulate_media(media="print")
        page.goto(Path(path).resolve().as_uri())
        page.evaluate("document.fonts.ready")
        res = page.evaluate(JS)
        print(f"== {path}  content height {res['height']}px (A4 printable ~ {1123 - 82}px)")
        for it in res["items"]:
            flag = "  <-- orphan" if it["lines"] > 1 and it["fill"] < 30 else ""
            print(f"  {it['lines']}L {it['fill']:3d}%  {it['text']}{flag}")
    b.close()
