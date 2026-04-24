#!/usr/bin/env python3
"""Tukar default theme-color dari #9B77FF ke #ffffff di semua HTML (bukan msapplication-TileColor)."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Hanya padankan meta name="theme-color", bukan msapplication-TileColor
PATTERN = re.compile(
    r'(<meta\s+name=["\']theme-color["\'][^>]*?content=["\'])#9B77FF(["\'][^>]*?/?>)',
    re.IGNORECASE
)
PATTERN2 = re.compile(
    r'(<meta\s+content=["\'])#9B77FF(["\'][^>]*?name=["\']theme-color["\'][^>]*?/?>)',
    re.IGNORECASE
)

changed = 0
for f in sorted(ROOT.rglob("*.html")):
    text = f.read_text(encoding="utf-8")
    new = PATTERN.sub(r'\g<1>#ffffff\2', text)
    new = PATTERN2.sub(r'\g<1>#ffffff\2', new)
    if new != text:
        f.write_text(new, encoding="utf-8")
        changed += 1
        print(f"  ✓ {f.relative_to(ROOT)}")

print(f"\nDikemaskini: {changed} fail")

# Pastikan msapplication-TileColor masih ungu
still_purple = sum(1 for f in ROOT.rglob("*.html") if "#9B77FF" in f.read_text())
print(f"Masih ada #9B77FF (msapplication-TileColor): {still_purple} fail")
