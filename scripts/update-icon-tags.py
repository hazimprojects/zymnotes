#!/usr/bin/env python3
"""
Kemaskini icon link tags pada semua HTML:
- Tukar/tambah apple-touch-icon PNG 180x180
- Tambah favicon-32x32.png
- Tambah msapplication-TileColor meta
- Tambah keseluruhan blok PWA untuk fail yang tiada icon tags langsung
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ICON_SVG_RE = re.compile(
    r'<link\s[^>]*?href=["\']\/icons\/icon\.svg\?v=3["\'][^>]*?rel=["\']icon["\'][^>]*?/?>|'
    r'<link\s[^>]*?rel=["\']icon["\'][^>]*?href=["\']\/icons\/icon\.svg\?v=3["\'][^>]*?/?>',
    re.IGNORECASE
)

APPLE_TOUCH_SVG_RE = re.compile(
    r'<link\s[^>]*?href=["\']\/icons\/icon\.svg\?v=3["\'][^>]*?rel=["\']apple-touch-icon["\'][^>]*?/?>|'
    r'<link\s[^>]*?rel=["\']apple-touch-icon["\'][^>]*?href=["\']\/icons\/icon\.svg\?v=3["\'][^>]*?/?>',
    re.IGNORECASE
)

NEW_ICON_SVG = '<link rel="icon" type="image/svg+xml" href="/icons/icon.svg?v=3" />'
NEW_FAVICON_PNG = '<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v=1" />'
NEW_APPLE_TOUCH = '<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=1" />'

TILE_COLOR_TAG = '<meta name="msapplication-TileColor" content="#9B77FF" />'

# Blok lengkap untuk halaman yang tiada icon tags langsung (bab-5-x, bab-6-x, bab-7-x)
FULL_PWA_BLOCK = """<link rel="manifest" href="/manifest.json?v=10" />
  <meta name="theme-color" content="#9B77FF" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="ZymNotes" />
  <meta name="msapplication-TileColor" content="#9B77FF" />
  <link rel="icon" type="image/svg+xml" href="/icons/icon.svg?v=3" />
  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v=1" />
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=1" />"""

changed: list[Path] = []
skipped: list[Path] = []

for html_file in sorted(ROOT.rglob("*.html")):
    text = html_file.read_text(encoding="utf-8")
    original = text

    has_icon_tag = ICON_SVG_RE.search(text) or 'favicon-32x32.png' in text
    has_apple = APPLE_TOUCH_SVG_RE.search(text) or 'apple-touch-icon.png' in text
    has_manifest = 'manifest.json' in text

    if not has_manifest and not has_icon_tag:
        # Fail tiada sebarang PWA tags — tambah keseluruhan blok sebelum </head>
        text = text.replace('</head>', '  ' + FULL_PWA_BLOCK + '\n</head>', 1)
    else:
        # Fail sudah ada sebahagian tags — kemaskini sahaja
        m_icon = ICON_SVG_RE.search(text)
        m_apple = APPLE_TOUCH_SVG_RE.search(text)

        if m_apple:
            text = APPLE_TOUCH_SVG_RE.sub(NEW_APPLE_TOUCH, text)
        if m_icon:
            text = ICON_SVG_RE.sub(NEW_ICON_SVG + '\n  ' + NEW_FAVICON_PNG, text)

        # Tambah msapplication-TileColor jika belum ada
        if TILE_COLOR_TAG not in text and 'apple-mobile-web-app-title' in text:
            text = re.sub(
                r'(<meta[^>]*?apple-mobile-web-app-title[^>]*?>)',
                r'\1\n  ' + TILE_COLOR_TAG,
                text
            )

    if text != original:
        html_file.write_text(text, encoding="utf-8")
        changed.append(html_file.relative_to(ROOT))
    else:
        skipped.append(html_file.relative_to(ROOT))

print(f"Dikemaskini: {len(changed)} fail")
for f in changed:
    print(f"  ✓ {f}")
if skipped:
    print(f"\nTidak berubah: {len(skipped)} fail")
    for f in skipped:
        print(f"  - {f}")
