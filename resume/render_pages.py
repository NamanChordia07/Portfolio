"""Render PDF pages to PNG for visual review:  python render_pages.py dist/X.pdf out_dir"""
import sys
from pathlib import Path

import pypdfium2 as pdfium

pdf_path, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
pdf = pdfium.PdfDocument(str(pdf_path))
for i in range(len(pdf)):
    pdf[i].render(scale=float(sys.argv[3]) if len(sys.argv) > 3 else 1.6).to_pil().save(out / f"{pdf_path.stem}_p{i + 1}.png")
print(len(pdf), "page(s)")
