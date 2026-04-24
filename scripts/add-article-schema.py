#!/usr/bin/env python3
"""
Tambah Article/LearningResource schema (LD+JSON) ke semua subtopik pages.
Ekstrak title dan description dari tag yang sedia ada.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NOTES_DIR = ROOT / "notes"

PUBLISHER = '{"@type": "EducationalOrganization", "name": "ZymNotes", "url": "https://zymnotes.com"}'

TITLE_RE = re.compile(r'<title>([^<]+)</title>', re.IGNORECASE)
DESC_RE = re.compile(
    r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\'][^>]*>|'
    r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\'][^>]*>',
    re.IGNORECASE
)
CANONICAL_RE = re.compile(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', re.IGNORECASE)

changed = 0
skipped = 0

# Hanya fail subtopik (bab-X-Y.html)
subtopic_files = sorted(NOTES_DIR.glob("bab-*-*.html"))

for path in subtopic_files:
    text = path.read_text(encoding="utf-8")

    if '"@type": "Article"' in text:
        skipped += 1
        continue

    title_m = TITLE_RE.search(text)
    desc_m = DESC_RE.search(text)
    canon_m = CANONICAL_RE.search(text)

    if not (title_m and (desc_m or canon_m)):
        print(f"  SKIP {path.name} — tiada title/description")
        skipped += 1
        continue

    title = title_m.group(1).strip()
    # Remove " | ZymNotes" suffix from title for headline
    headline = re.sub(r'\s*\|\s*ZymNotes\s*$', '', title).strip()
    description = (desc_m.group(1) or desc_m.group(2) or '').strip() if desc_m else ''
    url = canon_m.group(1).strip() if canon_m else f"https://zymnotes.com/notes/{path.name}"

    # Escape quotes in strings
    headline_safe = headline.replace('"', '\\"')
    desc_safe = description.replace('"', '\\"')

    schema = f"""  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{headline_safe}",
    "description": "{desc_safe}",
    "inLanguage": "ms-MY",
    "educationalLevel": "SPM",
    "publisher": {PUBLISHER},
    "url": "{url}"
  }}
  </script>"""

    # Sisip selepas BreadcrumbList schema yang sedia ada, atau sebelum </body>
    if '</script>\n</body>' in text:
        text = text.replace('</script>\n</body>', f'</script>\n{schema}\n</body>', 1)
    else:
        text = text.replace('</body>', schema + '\n</body>', 1)

    path.write_text(text, encoding="utf-8")
    changed += 1
    print(f"  ✓ {path.name}")

print(f"\nDikemaskini: {changed} fail, dilangkau: {skipped} fail")
