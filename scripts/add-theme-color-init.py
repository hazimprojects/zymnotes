#!/usr/bin/env python3
"""
Tambah inline script terus selepas meta[name="theme-color"] pada semua HTML.
Script ini berjalan SEGERA dalam <head> (synchronous) — sebelum sebarang JS
external dimuatkan — supaya Chrome/Android PWA paparkan warna yang betul
dari saat pertama render, bukan tunggu main.js di hujung body.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Inline script — minified, ~185 chars
INLINE = (
    '<script>'
    '!function(){'
    "try{var t=localStorage.getItem('zymnotes-theme')"
    "||((window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light');"
    "var m=document.querySelector('meta[name=\"theme-color\"]');"
    "if(m)m.content=t==='dark'?'#0D0F1A':'#ffffff'}"
    'catch(e){}'
    '}()'
    '</script>'
)

# Padankan meta theme-color dalam pelbagai format
THEME_META_RE = re.compile(
    r'(<meta\s+(?:name=["\']theme-color["\'][^>]*?content=["\']#[0-9a-fA-F]{6}["\']'
    r'|content=["\']#[0-9a-fA-F]{6}["\'][^>]*?name=["\']theme-color["\'])'
    r'[^>]*?/?>)',
    re.IGNORECASE
)

changed = 0
skipped = 0

for f in sorted(ROOT.rglob("*.html")):
    text = f.read_text(encoding="utf-8")

    if "zymnotes-theme" in text and "theme-color" in text.lower():
        skipped += 1
        continue  # already has inline script

    m = THEME_META_RE.search(text)
    if not m:
        skipped += 1
        continue

    insert_pos = m.end()
    # Cari indent baris semasa
    line_start = text.rfind('\n', 0, m.start()) + 1
    indent = re.match(r'^[ \t]*', text[line_start:]).group()

    new_text = text[:insert_pos] + '\n' + indent + INLINE + text[insert_pos:]
    f.write_text(new_text, encoding="utf-8")
    changed += 1
    print(f"  ✓ {f.relative_to(ROOT)}")

print(f"\nDitambah inline script: {changed} fail, dilangkau: {skipped} fail")
