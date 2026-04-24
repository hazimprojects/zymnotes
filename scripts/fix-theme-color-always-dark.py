#!/usr/bin/env python3
"""
Set theme-color to always #0D0F1A (dark navy) and remove the inline
init script that tried to switch it dynamically.

Chrome Android PWA standalone mode does not respond to dynamic meta
content changes — the status bar color is only read on page load.
Since we can't guarantee real-time switching, we keep it always dark
for a consistent, elegant look.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

INLINE_SCRIPT_RE = re.compile(
    r'\n[ \t]*<script>!function\(\)\{try\{var t=localStorage\.getItem\(\'zymnotes-theme\'.*?\}\(\)</script>',
    re.DOTALL
)

THEME_COLOR_RE = re.compile(
    r'(<meta\s+name=["\']theme-color["\']\s+content=)["\']#[0-9a-fA-F]{6}["\']\s*/>',
    re.IGNORECASE
)

changed = 0
skipped = 0

for f in sorted(ROOT.rglob("*.html")):
    text = f.read_text(encoding="utf-8")
    original = text

    # Remove inline init script
    text = INLINE_SCRIPT_RE.sub('', text)

    # Set theme-color to always-dark
    text = THEME_COLOR_RE.sub(r'\1"#0D0F1A" />', text)

    if text != original:
        f.write_text(text, encoding="utf-8")
        changed += 1
        print(f"  ✓ {f.relative_to(ROOT)}")
    else:
        skipped += 1

print(f"\nDikemaskini: {changed} fail, tidak berubah: {skipped} fail")
