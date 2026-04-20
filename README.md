# ZymNotes

ZymNotes ialah **platform pendidikan digital tempatan** yang membina kandungan pembelajaran visual, mesra telefon dan lebih mudah diikuti untuk membantu pengguna belajar dengan lebih yakin.

Fokus semasa ZymNotes ialah **Sejarah Tingkatan 4**, dengan peluasan kandungan ke **Sejarah Tingkatan 5** dan bidang lain secara berperingkat. Platform ini dibina untuk menjadikan pengalaman ulang kaji lebih jelas, lebih tersusun dan lebih dekat dengan cara pelajar hari ini membaca serta belajar melalui skrin.

---

## Gambaran Ringkas

ZymNotes bermula daripada keperluan untuk menjadikan kandungan silibus yang padat lebih mudah didekati tanpa mengorbankan isi penting. Ia tidak cuba menggantikan buku teks sepenuhnya, tetapi berfungsi sebagai **bahan sokongan pembelajaran digital** yang lebih:

- visual
- tersusun
- mesra telefon
- mudah diteroka
- sesuai untuk ulang kaji berperingkat

Platform ini sesuai untuk:

- **pelajar** yang mahu nota yang lebih mudah dibaca
- **guru** yang mahu bahan sokongan tambahan
- **ibu bapa** yang mahu rujukan yang lebih jelas untuk membantu anak belajar

---

## Fokus Kandungan Semasa

Setakat ini, kandungan aktif tertumpu pada **Sejarah Tingkatan 4** dengan struktur berikut:

### Bab 1 · Warisan Negara Bangsa
- halaman utama bab
- subtopik 1.1 hingga 1.4

### Bab 2 · Kebangkitan Nasionalisme
- halaman utama bab
- subtopik 2.1 hingga 2.8

### Bab 3 · Konflik Dunia dan Pendudukan Jepun di Negara Kita
- halaman utama bab
- subtopik 3.1 hingga 3.9

### Bab 4 · Era Peralihan Kuasa British di Negara Kita
- halaman utama bab
- subtopik 4.1 hingga 4.7

### Bab 5 · Persekutuan Tanah Melayu 1948
- halaman utama bab
- subtopik 5.1 hingga 5.4

### Bab 6 · Ancaman Komunis dan Perisytiharan Darurat
- halaman utama bab
- subtopik 6.1 hingga 6.4

---

## Ciri-ciri Utama Platform

ZymNotes kini bukan sekadar himpunan nota statik. Repo semasa sudah merangkumi beberapa lapisan pengalaman pengguna yang lebih matang.

### Kandungan & Pembacaan
- nota visual yang lebih kemas dan terarah
- hierarki isi yang jelas untuk topik yang padat
- blok rumusan, info tambahan, glosari dan susunan bacaan
- kandungan yang mesra telefon pintar

### Pengalaman Ulang Kaji
- audio nota untuk beberapa subtopik
- sticky mini audio player
- reading progress bar pada halaman subtopik
- swipe navigation untuk pengguna mudah alih
- pintasan papan kekunci pada halaman nota

### Navigasi & Carian
- carian dalaman untuk koleksi nota
- global search overlay
- desktop floating table of contents untuk halaman tertentu
- mobile bottom navigation
- sparkle utility menu pada halaman nota terpilih

### Visual & Identiti
- dark mode
- sistem tema visual yang lebih modular
- identiti jenama ZymNotes yang lebih konsisten
- struktur halaman yang semakin menghampiri bentuk platform pembelajaran sebenar

---

## Struktur Projek

```text
zymnotes/
├── index.html
├── about.html
├── feedback.html
├── thank-you.html
├── README.md
├── manifest.json
├── sw.js
├── data/
│   └── updates.json
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
│   └── js/
│       └── main.js
└── notes/
    ├── index.html
    ├── bab-1.html
    ├── bab-1-1.html
    ├── bab-1-2.html
    ├── bab-1-3.html
    ├── bab-1-4.html
    ├── bab-2.html
    ├── bab-2-1.html
    ├── bab-2-2.html
    ├── bab-2-3.html
    ├── bab-2-4.html
    ├── bab-2-5.html
    ├── bab-2-6.html
    ├── bab-2-7.html
    ├── bab-2-8.html
    ├── bab-3.html
    ├── bab-3-1.html
    ├── bab-3-2.html
    ├── bab-3-3.html
    ├── bab-3-4.html
    ├── bab-3-5.html
    ├── bab-3-6.html
    ├── bab-3-7.html
    ├── bab-3-8.html
    ├── bab-3-9.html
    ├── bab-4.html
    ├── bab-4-1.html
    ├── bab-4-2.html
    ├── bab-4-3.html
    ├── bab-4-4.html
    ├── bab-4-5.html
    ├── bab-4-6.html
    ├── bab-4-7.html
    ├── bab-5.html
    ├── bab-5-1.html
    ├── bab-5-2.html
    ├── bab-5-3.html
    ├── bab-5-4.html
    ├── bab-6.html
    ├── bab-6-1.html
    ├── bab-6-2.html
    ├── bab-6-3.html
    └── bab-6-4.html
```
---

## Teknologi Digunakan

ZymNotes dibina sebagai laman statik yang ringan tetapi semakin kaya dari sudut pengalaman pengguna.

### Asas
- HTML
- CSS
- JavaScript
- Google Fonts (Nunito)

### Frontend Architecture
- CSS modular melalui `style.css` sebagai master stylesheet
- Import fail berasingan seperti:
  - `base.css`
  - `layout.css`
  - `ui.css`
  - `paper.css`
  - `responsive.css`
  - `themes.css`
  - `lab.css`
  - `print.css`

### Interaksi UI
- dark mode
- carian dalaman
- global search overlay
- mobile bottom navigation
- sticky audio player
- sparkle utility menu
- reading progress bar
- desktop floating TOC
- swipe dan keyboard navigation

### Sokongan Platform
- Web App Manifest
- service worker
- PWA install nudge
- Google Analytics

---

## Prinsip Reka Bentuk

ZymNotes dibina dengan beberapa prinsip utama:

### 1. Jelas
Isi penting perlu mudah dikenal pasti walaupun topik padat dan sarat fakta.

### 2. Visual tetapi berfungsi
Warna, blok, label dan komponen visual digunakan untuk membantu kefahaman, bukan sekadar hiasan.

### 3. Mesra telefon
Halaman dirancang supaya selesa dibaca pada skrin kecil kerana itu ialah peranti utama ramai pengguna.

### 4. Tersusun
Setiap bab dibina dengan aliran yang konsisten supaya pengguna tidak terasa hilang arah.

### 5. Berkembang secara terkawal
ZymNotes dikembangkan secara berperingkat dengan keutamaan kepada kualiti kandungan dan pengalaman pembelajaran.

---

## Status Semasa

ZymNotes sedang berkembang dengan arah yang semakin jelas sebagai **platform pendidikan digital**, bukan sekadar laman nota biasa.

Status semasa yang boleh dikenal pasti daripada repo:

- jenama utama telah bergerak ke **ZymNotes**
- kandungan Sejarah Tingkatan 4 kini meliputi **Bab 1 hingga Bab 6**
- pengalaman pengguna telah diperkaya dengan audio, carian, navigation tools dan komponen UX tambahan
- struktur frontend kini lebih modular dan lebih sesuai untuk perkembangan masa depan

---

## Cara Guna

1. Buka `index.html` untuk halaman utama platform  
2. Masuk ke `notes/index.html` untuk melihat koleksi nota semasa  
3. Pilih bab atau subtopik yang ingin dibaca  
4. Gunakan carian untuk mencari istilah, tokoh, konsep atau topik tertentu  
5. Pada halaman nota terpilih, gunakan audio, navigation aids dan reading tools yang tersedia  

---

## Deploy / Release Ringkas

Untuk elak cache versi aset tidak selari antara halaman HTML dan service worker, gunakan aliran berikut:

1. Kemaskini versi dalam `data/asset-versions.json` (sumber kebenaran tunggal):
   - `style_css`
   - `main_js`
   - `manifest`
2. Jalankan:
   ```bash
   python3 scripts/sync-asset-versions.py
   ```
3. Skrip akan:
   - kemas kini semua rujukan `style.css?v=`, `main.js?v=`, dan `manifest.json?v=` dalam fail HTML;
   - kemas kini entri berkaitan dalam `PRECACHE_URLS` di `sw.js`.
4. Commit perubahan yang terhasil (`*.html`, `sw.js`, dan/atau `data/asset-versions.json`).

Nota CI: workflow `.github/workflows/update-status.yml` turut menjalankan skrip ini secara automatik sebelum langkah commit.

---

## Arah Perkembangan

ZymNotes dibina dengan potensi untuk berkembang lebih jauh daripada fokus semasa.

Antara arah pengembangan yang selari dengan repo dan positioning semasa:

- peluasan kandungan ke **Sejarah Tingkatan 5**
- pengembangan audio ke lebih banyak bab
- pengukuhan struktur kandungan KSSM yang lebih luas
- penambahan elemen ulang kaji yang lebih interaktif
- penambahbaikan konsistensi identiti visual dan pengalaman platform

---

## Kedudukan Platform

ZymNotes tidak diposisikan sebagai pengganti tunggal kepada buku teks atau sumber rasmi. Sebaliknya, ia berfungsi sebagai:

- platform pembelajaran digital
- bahan sokongan ulang kaji
- ruang pembacaan yang lebih mesra pengguna
- lapisan visual dan navigasi tambahan untuk membantu pelajar memahami kandungan silibus dengan lebih yakin

---

## Hubungi

**ZymNotes**  
Malaysia  
Email: **hello@zymnotes.com**

---

## Lesen

Belum ditetapkan secara rasmi.

Jika ZymNotes ingin dibuka untuk penggunaan awam yang lebih luas, pengedaran semula, atau sumbangan komuniti pada masa hadapan, bahagian lesen boleh dikemas kini kemudian.
