# Panduan Editorial Mod Bahasa Cina (ZH)

Dokumen ini menetapkan standard penulisan, semakan kualiti, dan aliran review untuk kandungan sejarah HazimEdu dalam Mod Bahasa Cina.

## 1) Gaya bahasa Cina (untuk pelajar menengah Malaysia)

### Prinsip gaya utama
- **Ringkas dan terus kepada maksud**: utamakan ayat pendek, satu idea utama setiap ayat.
- **Natural dan mudah difahami**: guna istilah umum Mandarin moden, elak struktur terlalu klasik/sastera.
- **Berorientasi peperiksaan sejarah**: kekalkan konsep fakta, sebab-akibat, dan istilah penting.
- **Sokong konteks Malaysia**: terjemahan perlu mengekalkan konteks Sejarah KSSM (contoh: Kesultanan Melayu Melaka, Negeri-negeri Melayu Bersekutu).

### Nada dan struktur ayat
- Nada neutral-akademik, bukan gaya berita sensasi.
- Elak ayat berlapis yang panjang; pecahkan kepada 2–3 ayat pendek jika perlu.
- Elak penggunaan kata ganti tidak jelas (contoh: “其”, “该”) jika subjek boleh jadi kabur.

### Praktik yang digalakkan
- Terjemah mengikut **makna unit**, bukan demi perkataan.
- Ulang istilah teras yang sama dalam unit yang sama untuk bantu memori pelajar.
- Jika istilah BM penting dikekalkan, letakkan istilah BM pada metadata `bm_focus_phrase`.

## 2) Istilah sejarah standard (glossary canonical)

### Sumber canonical
- Semua istilah sejarah **wajib selaras** dengan glosari rasmi projek di:
  - `data/zh-glossary.json`

### Kaedah penggunaan glosari
- Jika istilah sudah wujud dalam glosari, **jangan cipta varian baru**.
- Jika istilah belum wujud, tambah cadangan istilah baru melalui review subjek sejarah sebelum digunakan secara meluas.
- Kekalkan ejaan/skrip yang konsisten (Simplified Chinese untuk mod ini).

### Contoh amalan konsisten
- Satu istilah BM → satu istilah ZH canonical dalam semua unit.
- Elak pertukaran sinonim tanpa sebab (contoh satu unit guna A, unit lain guna B untuk istilah sama).

## 3) Larangan terjemahan literal yang mengelirukan

### Larangan utama
- **Dilarang** terjemah perkataan demi perkataan jika menukar maksud sejarah.
- **Dilarang** terjemah frasa teknikal BM kepada frasa ZH yang kedengaran semula jadi tetapi lari konteks KSSM.
- **Dilarang** menghilangkan unsur sebab-akibat, tempoh masa, atau pelaku sejarah.

### Prinsip pembetulan
- Jika literal mengelirukan, gunakan parafrasa ringkas yang mengekalkan maksud asal.
- Jika istilah BM perlu dikekalkan untuk konteks peperiksaan, simpan dalam `bm_focus_phrase`.

## 4) Checklist QA per unit

Semua unit mesti lulus checklist berikut sebelum merge:

- [ ] **Makna ayat tepat**: Adakah terjemahan menyampaikan maksud asal BM tanpa tersasar?
- [ ] **Isi penting jelas**: Adakah fakta utama (siapa/apa/bila/mengapa/kesan) jelas?
- [ ] **Frasa BM sasaran kekal**: Adakah frasa penting BM disimpan pada `bm_focus_phrase`?
- [ ] **Istilah konsisten dengan glosari**: Adakah istilah utama selaras dengan `data/zh-glossary.json`?

## 5) Semakan statik minimum

Gunakan skrip semakan statik untuk mengesan unit yang belum lengkap medan wajib:

```bash
python3 scripts/check-zh-units.py
```

Skrip akan flag unit yang tiada:
- `key_points_zh`
- `bm_focus_phrase`

Jika dataset unit berada di laluan lain, berikan path secara eksplisit:

```bash
python3 scripts/check-zh-units.py data/zh-units.json data/zh-units/*.json
```

Selain semakan unit, glosari juga wajib lulus lint:

```bash
python3 scripts/check-zh-glossary.py
```

Semakan padanan coverage ID antara `notes/*.html` dan unit ZH juga wajib lulus:

```bash
python3 scripts/check-zh-coverage.py
```

Skrip ini akan:
- ekstrak semua `data-zh-unit-id` daripada fail `notes/*.html`,
- ekstrak semua `source_id` daripada `data/zh-units/*.json`,
- lapor ID hilang / berlebihan,
- kesan konflik `source_id` pendua merentas fail unit,
- keluarkan liputan ringkas per bab (peratus rollout).

### Checklist QA pra-release (ZH rollout)

Sebelum release kandungan ZH, jalankan set semakan berikut mengikut turutan:

```bash
python3 scripts/check-zh-units.py && \
python3 scripts/check-zh-glossary.py && \
python3 scripts/check-zh-coverage.py
```

Rujuk panduan khusus glosari di `docs/zh-glossary-editorial-guideline.md`.

## 6) Proses review 2 lapis (wajib)

Setiap perubahan kandungan ZH perlu melalui **dua lapisan review**:

1. **Reviewer Bahasa (ZH)**
   - Semak kelancaran bahasa, ketepatan makna, dan keterbacaan pelajar menengah.
   - Sahkan checklist QA item 1–3.

2. **Reviewer Subjek Sejarah**
   - Semak ketepatan fakta sejarah, konteks KSSM, dan konsistensi istilah canonical.
   - Sahkan checklist QA item 2 dan 4.

### Kriteria lulus
- Perubahan hanya boleh diluluskan apabila **kedua-dua reviewer memberi sign-off**.
- Jika ada konflik, keputusan fakta oleh reviewer subjek sejarah mengatasi pilihan gaya bahasa.

## 7) Konvensyen markup ZH explain dalam `notes/*.html`

### Komponen sasaran (selain `.paper-chip`)
Untuk rollout explain inline, elemen berikut dianggap sasaran utama:
- `.point-heading`
- `.point-line`
- blok rumusan/kesimpulan seperti `.summary-paper`, `.conclusion-paper`, `.master-summary-paper`
- blok formula (jika digunakan): `.formula-block`

### Bila guna `data-zh-mode="explain"`
Gunakan `data-zh-mode="explain"` pada ayat/heading yang:
- mengandungi **soalan fokus** subtopik,
- ayat **fokus bab** (ringkasan konteks subtopik),
- ayat **kesimpulan/rumusan** yang menjadi idea teras untuk ulang kaji.

Elakkan meletakkan `data-zh-mode="explain"` pada setiap ayat fakta kecil; utamakan ayat berimpak tinggi untuk kefahaman.

### Di mana letak `data-zh-unit-id`
- Letak `data-zh-unit-id` **pada elemen sasaran itu sendiri**, bukan pada parent wrapper umum.
- Setiap `data-zh-unit-id` mesti unik dalam satu fail.
- Konvensyen nama disyorkan:
  - `bX-Y-soalan-heading`
  - `bX-Y-soalan-line-1`, `bX-Y-soalan-line-2`
  - `bX-Y-fokus-line`
  - `bX-Y-conclusion-board`, `bX-Y-conclusion-line`
  - `bX-Y-rumusan-*`

Contoh:

```html
<p class="point-heading" data-zh-mode="explain" data-zh-unit-id="b2-7-soalan-heading">...</p>
<p class="point-line" data-zh-mode="explain" data-zh-unit-id="b2-7-fokus-line">...</p>
<article class="paper-board summary-paper conclusion-paper" data-zh-mode="explain" data-zh-unit-id="b2-7-conclusion-board">...</article>
```
