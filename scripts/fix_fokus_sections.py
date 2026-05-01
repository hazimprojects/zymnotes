#!/usr/bin/env python3
"""Convert Fokus sections from paper-chip-list/paper-steps to compact-kingdom-grid."""
import re, os

BASE = "/home/user/zymnotes/notes"
K = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@62ecdc0d7ca5/assets"
IMG = '<img class="fluent-3d-emoji openmoji--inline" src="{src}" width="20" height="20" alt="" decoding="async" />'

def keycap(n):
    return IMG.format(src=f"{K}/Keycap%20{n}/3D/keycap_{n}_3d.png")

def kingdom(n, text):
    return f'<article class="paper-kingdom" data-cv-collectible="false">{keycap(n)} {text}</article>'

def grid(items):
    rows = "\n".join(kingdom(i+1, t) for i, t in enumerate(items))
    return f'<div class="paper-grid compact-kingdom-grid">\n{rows}\n</div>'

# Map of file -> new Fokus items (the ONLY thing being replaced is the cv-unit-body content)
FOKUS = {
    "bab-3-8.html": [
        "Semangat Antipenjajah dalam Kalangan Rakyat",
        "Perjuangan Menuntut Kemerdekaan di Tanah Melayu",
        "Kesedaran Politik di Sarawak dan Sabah",
    ],
    "bab-4-2.html": [
        "Latar Belakang Malayan Union",
        "Ciri-ciri Malayan Union",
        "Cara British Mendapatkan Persetujuan Sultan",
    ],
    "bab-4-3.html": [
        "Sebab Penentangan terhadap Malayan Union",
        "Penentangan Raja-raja Melayu",
        "Penentangan Rakyat dan Pertubuhan Melayu",
    ],
    "bab-4-4.html": [
        "Masalah Pewarisan Takhta Vyner Brooke",
        "Desakan Kerajaan British",
        "Masalah Kewangan Sarawak",
    ],
    "bab-4-5.html": [
        "Penentangan Penyerahan Sarawak",
        "Faktor Penentangan — Perlembagaan 1941",
        "Sokongan terhadap Penyerahan Sarawak",
    ],
    "bab-4-6.html": [
        "Memenuhi Kepentingan British",
        "Meneruskan Dasar British dalam Hubungan Luar",
        "Masalah Kewangan SBUB",
    ],
    "bab-4-7.html": [
        "Dasar British Menekan Gerakan Nasionalisme",
        "Kepentingan Sosioekonomi Penduduk Tempatan",
        "Kepelbagaian Etnik Masyarakat Sabah",
    ],
    "bab-5-1.html": [
        "Penubuhan Jawatankuasa Kerja (1946)",
        "Cadangan Perjanjian Persekutuan Tanah Melayu",
        "Penentangan PUTERA-AMCJA dan Perlembagaan Rakyat",
    ],
    "bab-5-2.html": [
        "Penentangan Orang Melayu terhadap Malayan Union",
        "Cadangan Raja-raja Melayu dan UMNO",
        "Sokongan Pentadbir British",
    ],
    "bab-5-3.html": [
        "Pentadbiran Persekutuan Tanah Melayu",
        "Kuasa Raja-raja Melayu",
        "Perundangan",
        "Kewarganegaraan",
    ],
    "bab-5-4.html": [
        "Mengembalikan Kedudukan Raja-raja Melayu",
        "Menjaga Kedudukan Istimewa Orang Melayu",
        "Membuka Ruang Kewarganegaraan",
        "Mewujudkan Kerjasama Kaum",
    ],
    "bab-6-1.html": [
        "Kemasukan Pengaruh Komunis dari China",
        "Kemasukan Pengaruh Komunis dari Indonesia",
        "Penubuhan Parti Komunis Malaya (PKM)",
    ],
    "bab-6-2.html": [
        "Latar Belakang dan Persidangan Calcutta",
        "Perisytiharan Darurat (1948)",
        "Tindakan Komunis Selepas Darurat",
    ],
    "bab-6-3.html": [
        "Penguatkuasaan Undang-undang dan Pasukan Keselamatan",
        "Rancangan Briggs dan Penempatan Semula",
        "Perang Saraf dan Kempen Rakyat",
        "Rundingan Baling (1955)",
    ],
    "bab-6-4.html": [
        "Kesan Politik — Kewarganegaraan dan MCA",
        "Kesan Sosioekonomi",
        "Penamatan Darurat (1960)",
    ],
    "bab-7-1.html": [
        "Kemunculan Gagasan Melayu Raya (1938)",
        "Penubuhan Parti Politik Pasca Perang Dunia Kedua",
        "Matang Politik Pelbagai Kaum (1949–1951)",
    ],
    "bab-7-2.html": [
        "Penubuhan Jawatankuasa Hubungan Antara Kaum (1949)",
        "Peranan dan Objektif CLC",
        "Kesan CLC terhadap Kerjasama Kaum",
    ],
    "bab-7-3.html": [
        "Pembentukan Sistem Ahli (1951)",
        "Ciri-ciri Sistem Ahli",
        "Kepentingan Sistem Ahli ke Arah Kemerdekaan",
    ],
    "bab-7-4.html": [
        "Latar Belakang Pendidikan Sebelum Merdeka",
        "Usaha Pembentukan Sistem Pendidikan Kebangsaan",
        "Kesan Sistem Pendidikan Kebangsaan",
    ],
    "bab-8-1.html": [
        "Pilihan Raya Peringkat Majlis Perbandaran",
        "Pilihan Raya Peringkat Negeri",
        "Pilihan Raya Umum Pertama (1955)",
    ],
}

# Regex to match everything inside the Fokus article's cv-unit-body
# Pattern: strip-sub containing "Fokus", then cv-unit-body, then closing </div></article>
FOKUS_PATTERN = re.compile(
    r'(<div class="paper-strip strip-sub">.*?Fokus [0-9.]+.*?</div><div class="cv-unit-body">)'
    r'(.*?)'
    r'(</div></article>)',
    re.DOTALL
)

changed = []
for fname, items in FOKUS.items():
    path = os.path.join(BASE, fname)
    with open(path, encoding="utf-8") as f:
        content = f.read()

    new_body = "\n" + grid(items) + "\n"

    def replacer(m):
        return m.group(1) + new_body + m.group(3)

    new_content, n = FOKUS_PATTERN.subn(replacer, content, count=1)
    if n == 1:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        changed.append(fname)
        print(f"✅ {fname}: {len(items)} items")
    else:
        print(f"⚠️  {fname}: pattern NOT found — skipped")

print(f"\nTotal changed: {len(changed)}/{len(FOKUS)}")
