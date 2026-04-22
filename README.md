# ZymNotes

**ZymNotes** ialah platform nota ulang kaji digital untuk pelajar Malaysia, dibina dengan identiti baharu: **nota yang jelas, visual, mesra telefon, dan bertunjangkan buku teks KSSM**.

> Tagline semasa: **"Nota Ulang Kaji Generasi Baharu"**.

---

## Identiti Terkini

ZymNotes kini diposisikan sebagai:

- **platform sokongan pembelajaran**, bukan pengganti buku teks;
- **ruang bacaan berstruktur** untuk topik yang padat;
- **pengalaman ulang kaji moden** yang menggabungkan nota, audio, carian, dan bantuan bahasa.

Nada dan arah brand semasa menekankan:

1. **Kejelasan isi** — kandungan disusun semula supaya mudah diikuti.
2. **Reka bentuk berfungsi** — visual membantu pemahaman, bukan hiasan semata-mata.
3. **Mobile-first** — pengalaman utama dioptimumkan untuk telefon pintar.
4. **Pertumbuhan berperingkat** — kualiti kandungan didahulukan berbanding kuantiti.

---

## Skop Kandungan Semasa (Aktif)

Fokus aktif semasa ialah **Sejarah Tingkatan 4 (KSSM)**:

- **Bab 1** · Warisan Negara Bangsa
- **Bab 2** · Kebangkitan Nasionalisme
- **Bab 3** · Konflik Dunia dan Pendudukan Jepun di Negara Kita
- **Bab 4** · Era Peralihan Kuasa British di Negara Kita
- **Bab 5** · Persekutuan Tanah Melayu 1948
- **Bab 6** · Ancaman Komunis dan Perisytiharan Darurat
- **Bab 7** · Usaha ke Arah Kemerdekaan

Setiap bab mempunyai halaman bab utama dan pecahan subtopik (contoh: `bab-4-1.html`, `bab-4-2.html`, dan seterusnya).

---

## Ciri Utama Platform

### 1) Pengalaman Nota
- susunan nota berhierarki (tajuk, poin, rumusan, glosari);
- komponen "paper-style" untuk pembacaan lebih fokus;
- kata kunci visual untuk membezakan idea utama dan sokongan.

### 2) Pembelajaran Interaktif Ringan
- carian dalaman pada halaman koleksi nota;
- global search overlay;
- progress indicator untuk bacaan subtopik;
- pintasan papan kekunci dan swipe navigation (halaman tertentu).

### 3) Audio & Sokongan Akses
- audio nota tersedia untuk set subtopik terpilih;
- sticky mini audio player untuk pengalaman dengar + baca.

### 4) Mod Bahasa Cina (ZH Mode)
- sokongan unit kandungan ZH melalui `data/zh-units/`;
- glosari dwibahasa melalui `data/zh-glossary.json`;
- skrip audit/generasi untuk menjaga kualiti istilah dan liputan.

### 5) Keupayaan Web App
- PWA manifest + service worker;
- strategi versioning aset untuk kurangkan isu cache tidak sepadan.

---

## Struktur Repo (Terkini)

```text
zymnotes/
├── index.html
├── about.html
├── feedback.html
├── thank-you.html
├── 404.html
├── manifest.json
├── sw.js
├── README.md
├── notes/
│   ├── index.html
│   ├── bab-1.html ... bab-7.html
│   └── bab-*-*.html (subtopik)
├── quiz/
│   └── bab-1-1.html
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── ui.css
│   │   ├── paper.css
│   │   ├── keywords.css
│   │   ├── responsive.css
│   │   ├── themes.css
│   │   ├── lab.css
│   │   └── print.css
│   ├── js/
│   │   ├── main.js
│   │   ├── zh-mode.js
│   │   └── subtopic-lab.js
│   ├── audio/
│   └── og-image.png
├── data/
│   ├── asset-versions.json
│   ├── updates.json
│   ├── zh-glossary.json
│   ├── zh-chip-sentences.json
│   ├── zh-comprehension.json
│   └── zh-units/
├── scripts/
│   ├── sync-asset-versions.py
│   ├── bump-versions.py
│   ├── add-og-tags.py
│   ├── generate-updates.py
│   └── check-zh-*.py / gen-zh-*.py / regen-zh-units.py
├── docs/
│   ├── zh-mode-editorial-guideline.md
│   ├── zh-glossary-editorial-guideline.md
│   └── (dokumen audit/perancangan)
├── _templates/
│   ├── nota-bab.html
│   └── nota-subtopik.html
├── icons/
├── robots.txt
├── sitemap.xml
└── _headers
```

---

## Stack Teknologi

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Typography:** Google Fonts (Plus Jakarta Sans)
- **App shell:** Service Worker + Manifest (PWA)
- **Analitik:** Google Analytics (`gtag`)
- **Automasi kandungan:** Python scripts untuk versioning aset, SEO tags, update feed, dan pipeline ZH mode

---

## Aliran Kerja Disyorkan (Versioning Aset)

Sumber kebenaran utama versi aset ialah `data/asset-versions.json`.

### Langkah ringkas
1. Kemas kini nilai versi dalam `data/asset-versions.json`.
2. Jalankan:
   ```bash
   python3 scripts/sync-asset-versions.py
   ```
3. Semak perubahan pada fail HTML dan `sw.js`.
4. Commit semua fail berkaitan agar cache web konsisten.

---

## Cara Jalankan Secara Lokal

Disebabkan projek ini laman statik, anda boleh:

1. Buka `index.html` terus di pelayar; atau
2. Guna local static server (disyorkan untuk ujian service worker/PWA), contohnya:
   ```bash
   python3 -m http.server 8080
   ```
   kemudian buka `http://localhost:8080`.

---

## Peta Halaman Utama

- `index.html` — landing/utama
- `notes/index.html` — direktori nota + carian
- `about.html` — naratif platform & latar pengasas
- `feedback.html` — borang maklum balas
- `thank-you.html` — halaman selepas hantar maklum balas

---

## Roadmap Ringkas

Keutamaan perkembangan seterusnya:

- pengukuhan kualiti kandungan Bab 1–7;
- peluasan audio ke lebih banyak subtopik;
- penambahbaikan konsistensi istilah dalam ZH mode;
- peluasan kandungan ke skop KSSM lain secara terkawal.

---

## Hubungi

**ZymNotes (Malaysia)**  
Email: **hello@zymnotes.com**

---

## Lesen

Belum ditetapkan secara rasmi.

Jika projek dibuka untuk pengedaran/sumbangan awam pada skala lebih luas, fail lesen akan ditambah kemudian.
