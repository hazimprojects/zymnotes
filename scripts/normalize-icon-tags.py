#!/usr/bin/env python3
"""
Normalisasi icon link tags pada semua HTML.
Buang semua icon/favicon/apple-touch link tags yang sedia ada,
kemudian tambah semula set yang betul sekali sahaja.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Padankan SEMUA variasi icon dan apple-touch link tags (termasuk duplikasi)
ICON_LINK_RE = re.compile(
    r'\s*<link\s[^>]*?(?:rel=["\']icon["\']|rel=["\']apple-touch-icon["\']|'
    r'rel=["\']shortcut icon["\'])[^>]*?/?>\s*(?:\n|(?=<))|'
    r'\s*<link\s[^>]*?(?:href=["\'][^"\']*icon[^"\']*["\'])[^>]*?(?:rel=["\']icon["\']|'
    r'rel=["\']apple-touch-icon["\'])[^>]*?/?>\s*(?:\n|(?=<))',
    re.IGNORECASE
)

# Lebih spesifik — padankan tags yang mengandungi path icon
SPECIFIC_ICON_RE = re.compile(
    r'[ \t]*<link[^>]*(?:\/icons\/(?:icon|apple-touch-icon|favicon)[^"\']*)[^>]*/?>[ \t]*\n?',
    re.IGNORECASE
)

# Set icon tags yang betul
CORRECT_ICON_BLOCK_WITH_INDENT = (
    '  <link rel="icon" type="image/svg+xml" href="/icons/icon.svg?v=3" />\n'
    '  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v=1" />\n'
    '  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=1" />\n'
)

CORRECT_ICON_BLOCK_NO_INDENT = (
    '<link rel="icon" type="image/svg+xml" href="/icons/icon.svg?v=3" />\n'
    '<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png?v=1" />\n'
    '<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png?v=1" />\n'
)

# Semak jika icon tags sudah betul (tiada duplikasi)
def is_clean(text: str) -> bool:
    svgs = len(re.findall(r'<link[^>]+icon\.svg[^>]+>', text, re.IGNORECASE))
    pngs = len(re.findall(r'favicon-32x32\.png', text))
    apples = len(re.findall(r'apple-touch-icon\.png', text))
    return svgs == 1 and pngs == 1 and apples == 1

changed: list[Path] = []
skipped: list[Path] = []

for html_file in sorted(ROOT.rglob("*.html")):
    text = html_file.read_text(encoding="utf-8")
    original = text

    if is_clean(text):
        skipped.append(html_file.relative_to(ROOT))
        continue

    # Kira bilangan icon tags sekarang
    svg_count = len(re.findall(r'<link[^>]+icon\.svg[^>]+>', text, re.IGNORECASE))
    png_count = len(re.findall(r'favicon-32x32\.png', text))
    apple_count = len(re.findall(r'apple-touch-icon\.png', text))

    # Buang SEMUA icon link tags yang berkaitan dengan /icons/
    text = SPECIFIC_ICON_RE.sub('', text)

    # Cari lokasi yang sesuai untuk sisip semula icon tags
    # Keutamaan: selepas manifest.json tag, atau sebelum </head>
    manifest_match = re.search(
        r'(<link[^>]*manifest\.json[^>]*/?>[ \t]*\n?)',
        text, re.IGNORECASE
    )

    if manifest_match:
        insert_pos = manifest_match.end()
        # Semak indent yang digunakan
        line_start = text.rfind('\n', 0, manifest_match.start()) + 1
        indent = re.match(r'^[ \t]*', text[line_start:]).group()
        block = ''.join(f'{indent}{line}\n' if not line.endswith('\n') else f'{indent}{line}'
                        for line in CORRECT_ICON_BLOCK_NO_INDENT.strip().split('\n'))
        text = text[:insert_pos] + block + '\n' + text[insert_pos:]
    else:
        # Sisip sebelum </head>
        text = text.replace('</head>', CORRECT_ICON_BLOCK_WITH_INDENT + '</head>', 1)

    if text != original:
        html_file.write_text(text, encoding="utf-8")
        changed.append(html_file.relative_to(ROOT))
        n = f"svg:{svg_count}→1 png:{png_count}→1 apple:{apple_count}→1"
        print(f"  ✓ {html_file.relative_to(ROOT)} ({n})")

print(f"\nDibersihkan: {len(changed)} fail")
print(f"Sudah bersih: {len(skipped)} fail")
