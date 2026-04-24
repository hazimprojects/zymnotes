#!/usr/bin/env python3
"""Betulkan OG image dimensions dari 1424x748 kepada 1200x630 di semua HTML."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
changed = 0

for f in sorted(ROOT.rglob("*.html")):
    text = f.read_text(encoding="utf-8")
    new = text

    # Padankan content="1424" dalam konteks og:image:width
    new = re.sub(
        r'(<meta\b[^>]*\bog:image:width\b[^>]*\bcontent=")1424(")',
        r'\g<1>1200\2',
        new
    )
    new = re.sub(
        r'(<meta\b[^>]*\bcontent=")1424("[^>]*\bog:image:width\b)',
        r'\g<1>1200\2',
        new
    )
    # Padankan content="748" dalam konteks og:image:height
    new = re.sub(
        r'(<meta\b[^>]*\bog:image:height\b[^>]*\bcontent=")748(")',
        r'\g<1>630\2',
        new
    )
    new = re.sub(
        r'(<meta\b[^>]*\bcontent=")748("[^>]*\bog:image:height\b)',
        r'\g<1>630\2',
        new
    )

    if new != text:
        f.write_text(new, encoding="utf-8")
        changed += 1
        print(f"  ✓ {f.relative_to(ROOT)}")

print(f"\nDibetulkan: {changed} fail")
