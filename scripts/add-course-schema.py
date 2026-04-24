#!/usr/bin/env python3
"""Tambah Course schema (LD+JSON) ke 7 fail chapter pages."""

from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

CHAPTERS = {
    1: "Warisan Negara Bangsa",
    2: "Kebangkitan Nasionalisme",
    3: "Konflik Dunia dan Pendudukan Jepun di Negara Kita",
    4: "Era Peralihan Kuasa British di Negara Kita",
    5: "Persekutuan Tanah Melayu 1948",
    6: "Ancaman Komunis dan Perisytiharan Darurat",
    7: "Usaha ke Arah Kemerdekaan",
}

PROVIDER = '{"@type": "EducationalOrganization", "name": "ZymNotes", "url": "https://zymnotes.com"}'

for num, title in CHAPTERS.items():
    path = ROOT / "notes" / f"bab-{num}.html"
    text = path.read_text(encoding="utf-8")

    if '"@type": "Course"' in text:
        print(f"  skip bab-{num}.html (Course schema sudah ada)")
        continue

    course_schema = f"""  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "Sejarah Tingkatan 4 Bab {num}: {title}",
    "description": "Nota Sejarah Tingkatan 4 Bab {num}: {title}. Nota visual untuk ulang kaji SPM.",
    "provider": {PROVIDER},
    "inLanguage": "ms-MY",
    "educationalLevel": "SPM",
    "url": "https://zymnotes.com/notes/bab-{num}.html"
  }}
  </script>"""

    # Sisip sebelum </body>
    text = text.replace("</body>", course_schema + "\n</body>", 1)
    path.write_text(text, encoding="utf-8")
    print(f"  ✓ bab-{num}.html — {title}")

print("Selesai.")
