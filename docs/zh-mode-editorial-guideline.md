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
- **Dilarang** menterjemah entiti nama khas (orang, institusi, gelaran rasmi, akronim) sehingga nama asal hilang.

### Prinsip pembetulan
- Jika literal mengelirukan, gunakan parafrasa ringkas yang mengekalkan maksud asal.
- Jika istilah BM perlu dikekalkan untuk konteks peperiksaan, simpan dalam `bm_focus_phrase`.

## 4) Guardrail Google Translate (wajib untuk mod auto-translate)

Memandangkan mod ini masih menggunakan Google Translate, layer guardrail berikut **mesti** aktif supaya output tidak menukar nama khas kepada terjemahan Cina yang tidak sesuai:

1. **Entity placeholder (sebelum panggilan API)**  
   Teks entiti penting diganti dengan placeholder sementara, contohnya:
   - Nama individu (termasuk pola `bin/binti`).
   - Nama institusi/organisasi rasmi.
   - Frasa sejarah rasmi (contoh: *Persekutuan Tanah Melayu*).
   - Akronim huruf besar (contoh: UMNO, PKMM).
2. **Entity restore (selepas terjemahan API)**  
   Placeholder dipulihkan kepada teks asal BM/EN/AR supaya ejaan rasmi kekal.
3. **Fail-safe**  
   Jika placeholder hilang atau rosak selepas terjemahan API, sistem perlu fallback kepada ayat asal + label amaran entiti.
4. **Semakan manual reviewer**  
   Reviewer perlu semak bahawa nama orang/institusi kekal tepat pada output sebenar UI, bukan hanya dalam data.

> Rujukan implementasi semasa: `assets/js/zh-mode.js` (fungsi `extractProtectedEntities`, `restoreProtectedEntities`).

## 5) Checklist QA per unit

Semua unit mesti lulus checklist berikut sebelum merge:

- [ ] **Makna ayat tepat**: Adakah terjemahan menyampaikan maksud asal BM tanpa tersasar?
- [ ] **Isi penting jelas**: Adakah fakta utama (siapa/apa/bila/mengapa/kesan) jelas?
- [ ] **Frasa BM sasaran kekal**: Adakah frasa penting BM disimpan pada `bm_focus_phrase`?
- [ ] **Istilah konsisten dengan glosari**: Adakah istilah utama selaras dengan `data/zh-glossary.json`?
- [ ] **Entiti nama khas kekal**: Nama orang, institusi, gelaran, akronim tidak diterjemah secara literal.

## 6) Semakan statik minimum

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

## 7) Proses review 2 lapis (wajib)

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

## 8) Konvensyen markup ZH explain dalam `notes/*.html`

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

## 9) Panduan terjemahan Bab 1 (Mod Bahasa Cina)

Panduan ini khusus untuk **Bab 1** dan perlu dijadikan rujukan utama semasa proses terjemahan/semakan ZH. Untuk bab lain, gunakan panduan umum sehingga senarai khusus bab diterbitkan.

### 9.1 Langsung tak sesuai translate (kekalkan seperti asal)

#### Jenama / platform
- HazimEdu

#### Nama bab / subtopik rasmi
- Warisan Negara Bangsa
- Latar Belakang Negara Bangsa Sebelum Kedatangan Barat
- Ciri-ciri Negara Bangsa Kesultanan Melayu Melaka
- Keunggulan Sistem Pentadbiran dan Undang-undang
- Peranan Pemerintah dan Rakyat

#### Nama kerajaan / entiti politik / kesultanan / dinasti
- Alam Melayu
- Kesultanan Melayu Melaka
- Johor-Riau
- Kesultanan Johor-Riau
- Funan
- Champa
- Srivijaya
- Kedah Tua
- Gangga Nagara
- Angkor
- Majapahit
- Dinasti Ming
- Melaka *(bila merujuk entiti politik / kerajaan sejarah)*

#### Nama tokoh / individu / gelaran nama khas
- Laksamana Cheng Ho
- Sultan Mansur Shah
- Raja Champa
- Bendahara Tun Perak
- Sultan Muzaffar Shah
- Sultan Alauddin Riayat Shah
- Sultan Mahmud Shah
- Nakhoda Jenal
- Nakhoda Diri
- Nakhoda Sahak
- Sang Sapurba
- Demang Lebar Daun

#### Nama jawatan tradisional yang lebih baik kekal asal
- Bendahara
- Penghulu Bendahari
- Temenggung
- Laksamana
- Syahbandar
- Bentara
- Orang Kaya
- Hulubalang
- Penghulu
- Pembesar Berempat

#### Nama tempat / wilayah / geografi khusus
- Palembang
- Sungai Mekong
- Teluk Cam Ranh
- Selatan Myanmar
- Segenting Kra
- China
- Semenanjung Tanah Melayu
- Pantai timur Sumatera
- Pahang
- Kuala Linggi
- Kelantan
- Rokan
- Inderagiri
- Kampar
- Lingga
- Patani
- Kedah
- Siantan

#### Nama undang-undang / sistem / dokumen / artifak rasmi
- Sistem Pembesar Empat Lipatan
- Hukum Kanun Melaka
- Undang-undang Laut Melaka
- Undang-Undang Laut Melaka
- Kutara Manawa
- Inskripsi Telaga Batu

#### Nama agama / budaya / kelompok khas
- Islam
- Dewa Siva
- Orang Laut

### 9.2 Sesuai translate sebagai kefahaman dengan dikekalkan bahasa asal

**Format wajib:** `asal（中文）`.

#### Istilah sejarah / politik utama
- negara bangsa（国家体系 / 国家形态）
- wilayah pengaruh（势力范围）
- kedaulatan（主权）
- lambang kebesaran（王权象征）
- waadat（君民约定 / 君民契约）
- sistem serah（进贡制度 / 上缴制度）
- sistem kerah（征调劳役制度）
- kawasan pegangan（封地 / 管辖区）
- Pentadbiran Pusat（中央行政）
- Pentadbiran Jajahan（地方行政 / 属地行政）
- hukum adat（传统习惯法）
- syariah Islam（伊斯兰教法）
- titah（王命）
- murka（君王震怒）
- kurnia（王赐）
- anugerah（恩赐）
- tulah（因冒犯君王而遭祸）
- rakyat merdeka（自由民）
- wilayah taklukan（征服地区）
- wilayah naungan（附属地区 / 属邦）
- perkahwinan diraja（王室联姻）
- cap mohor（王室印玺 / 官方印章）
- nobat（王室礼乐）
- regalia（王室器物）
- upacara persetiaan（效忠仪式）
- air sumpah（誓言之水）
- hamba abdi（奴仆）

#### Istilah jawatan / peranan tradisional
- sultan（苏丹）
- raja（国王 / 君主）
- Bendahara（宰相 / 首席大臣）
- Penghulu Bendahari（财政总管）
- Temenggung（治安与防务长官）
- Laksamana（海军统帅）
- Syahbandar（港务官）
- Bentara（传令官）
- Hulubalang（武将）
- Penghulu（地方首领）
- ulama（宗教学者）

#### Nama khas yang boleh dibantu dengan transliterasi / kefahaman
- Funan（扶南）
- Champa（占婆）
- Srivijaya（三佛齐 / 室利佛逝）
- Angkor（吴哥）
- Majapahit（满者伯夷）
- Dinasti Ming（明朝）
- Palembang（巨港）
- China（中国）
- Melaka（马六甲）
- Semenanjung Tanah Melayu（马来半岛）
- Pantai timur Sumatera（苏门答腊东岸）

**Nota penting:**
- Untuk kategori ini, BM asal mesti kekal di depan.
- Bahasa Cina hanya bantuan kefahaman.

### 9.3 Tiada masalah untuk translate terus

Kategori ini boleh diterjemah terus kerana teks asal BM sudah jelas.

#### Konsep umum / frasa penerangan
- berperingkat
- masa yang panjang
- mengikut keperluan zaman
- sistem pentadbiran
- undang-undang
- bantuan para pembesar
- ketaatan rakyat
- keamanan kerajaan
- kesejahteraan rakyat
- kelancaran pentadbiran
- menjadi panduan dalam pentadbiran
- menerima
- mengakui
- mematuhi pemerintahan raja
- setia kepada raja
- tidak menderhaka
- kemenangan yang gemilang / bercahaya
- sistem pemerintahan yang tersusun dan lengkap
- enam ciri utama
- kerajaan
- rakyat
- pemerintahan
- peperangan
- hubungan diplomatik
- agama
- kerjasama
- persefahaman
- permuafakatan
- ketua pentadbir
- ketua turus angkatan tentera
- penasihat sultan
- pemangku sultan
- perdagangan
- cukai
- perbendaharaan
- pelabuhan
- membeli senjata
- membina istana
- menjaga keselamatan kota
- panglima angkatan laut
- daerah
- kampung
- menjaga keamanan
- kebijaksanaan pemerintah
- agihan tugas yang jelas
- jenayah
- kekeluargaan
- ekonomi
- hukuman bunuh
- arif tentang undang-undang
- melaksanakan hukum dengan adil
- perkahwinan memerlukan saksi
- riba diharamkan
- akil baligh
- siuman
- melafazkan niat jual beli
- peranan nakhoda
- pelayaran
- jenayah di laut
- percukaian
- raja di laut
- pegawai penting
- ombak
- arus
- bulan
- bintang
- cukai perjalanan
- hasil perniagaan
- pemerintah
- saling melengkapi
- golongan pemerintah
- golongan diperintah
- kerabat diraja
- peniaga
- petani
- tukang
- nelayan
- hamba raja
- hamba berhutang
- hamba biasa
- pelindung rakyat
- penyatu masyarakat
- pemimpin negara
- menjaga keselamatan rakyat
- mewujudkan perpaduan
- memastikan kemakmuran dan kestabilan
- menggubal undang-undang
- menjadi perantara sultan dengan rakyat
- taat setia kepada pemerintah
- mematuhi arahan
- menjadi tentera
- menjadi pendayung kapal perang
- menyertai gotong-royong
- tenaga kerja
- tidak berlaku zalim kepada rakyat
- kesetiaan rakyat
- keadilan pemerintah
- saling bergantung
- kedaulatan raja terpelihara
- kesejahteraan rakyat terjamin
- negara menjadi stabil dan makmur
- diwarisi dari kerajaan Alam Melayu
- diperkukuh oleh Kesultanan Melayu Melaka
- hubungan erat pemerintah dan rakyat
- kerajaan menjadi kuat dan gemilang
- menjadi empayar yang terkenal
- berbangga dengan warisan sejarah
- menjaga perpaduan
- mempertahankan kedaulatan negara

## 10) Panduan terjemahan Bab 2 (Mod Bahasa Cina)

Panduan ini khusus untuk **Bab 2** dan melengkapkan panduan Bab 1. Gunakan senarai ini sebagai rujukan utama semasa terjemahan/semakan ZH untuk topik nasionalisme.

### 10.1 Apa yang langsung tak sesuai translate

Kekal seperti asal.

#### Jenama / platform
- HazimEdu

#### Nama bab / subtopik rasmi
- Kebangkitan Nasionalisme
- Maksud Nasionalisme
- Perkembangan Idea Nasionalisme di Barat
- Perkembangan Nasionalisme di Asia
- Perkembangan Nasionalisme di Asia Tenggara
- Kesedaran Nasionalisme di Negara Kita
- Faktor Kemunculan Gerakan Nasionalisme
- Perkembangan Nasionalisme
- Kesan Perkembangan Nasionalisme

#### Nama tokoh / individu
- Hans Kohn
- Profesor William R. Roff
- Dato’ Onn Jaafar
- Dr. Burhanuddin al-Helmi
- Dr. R. Suntharalingam
- Profesor Datuk Zainal Abidin Abdul Wahid
- Profesor Emeritus Tan Sri Dr. Khoo Kay Kim
- Raja James II
- Mary II
- Raja William of Orange
- John Locke
- George Washington
- Thomas Jefferson
- Jean Jacques Rousseau
- Voltaire
- Raja Louis XVI
- Bal Gangadhar Tilak
- Bipin Chandra Pal
- Mahatma Gandhi
- Muhammad Ali Jinnah
- Jawaharlal Nehru
- Dr. Sun Yat Sen
- Sayyid Jamal al-Din al-Afghani
- Sheikh Muhammad Abduh
- Khalifah Abdul Hamid II
- Tok Janggut
- Maharaja Mikado Meiji
- José Rizal
- Andres Bonifacio
- Emilio Aguinaldo
- Sergio Osmena
- U Ba Pe
- Saya San
- Aung San
- Kyaw Nein
- U Nu
- Dr. Ba Maw
- Nguyen Thai Hoc
- Ho Chi Minh
- Raden Adjeng Kartini
- Soekarno
- Raja Mongkut
- Raja Chulalongkorn
- Raja Vajiravudh
- Nai Pridi Phanomyong
- Field Marshal Phibulsongkram
- Sultan Muzaffar Shah
- Sultan Mahmud Shah
- Sultan Abdullah Mukarram Shah
- Penghulu Dol Said
- Dato' Maharaja Lela
- Dato' Bahaman
- Rentap
- Mat Salleh
- Haji Abdul Rahman Limbong
- Sheikh Muhammad Tahir Jalaluddin
- Haji Abbas Mohd Taha
- Syed Sheikh al-Hadi
- Zainal Abidin Ahmad (Za'ba)
- Muhammad Rakawi Yusuf
- Abdul Rahim Kajai
- Hajah Zainon Munshi Sulaiman (Ibu Zain)
- Fatimah Yaakub
- Ibrahim Haji Yaakob
- Ishak Haji Muhammad
- Ahmad Boestamam
- Harun Aminurrashid
- Johari Anang
- Rashid Rida
- Abdul Kadir Adabi
- Dato’ Undang Rembau Abdullah Haji Dahan
- Mohammad Eunos Abdullah
- Ustaz Abu Bakar Mohd Said (Abu Bakar al-Baqir)
- Raja Chulan Raja Abdullah
- Mahmud Mat
- Raja Uda Raja Muhammad
- O.T. Dussek
- Abdul Hadi Hassan
- Abdul Hadi Abdul Manan
- Buyong Adil
- Muhammad Yusof Ahmad (Tok Kenali)
- Muhammad Awi Anang
- Muhd Daud Abdul Ghani
- Haji Abd Rahman Kassim
- Mohammad Yaakob
- Mohammad Shamsudin Osman
- Zakaria Gunn
- Tan Jiak Kim
- Tan Cheng Lock
- G.V. Thaver
- Dr. A.M. Soosay
- Pandit Jawaharlal Nehru
- Sir Hussein Hasanal Abdoolcader
- E.E.C. Thuraisingham
- Tunku Abdul Rahman
- Tunku Yaacob
- Mohd Zain Ariffin

#### Nama tempat / negara / wilayah / entiti geopolitik
- Barat
- Asia
- Asia Tenggara
- Eropah
- England
- Belanda
- Perancis
- Amerika
- Amerika Syarikat
- British
- India
- Pakistan
- China
- Empayar Uthmaniyah
- Mesir
- Jepun
- Filipina
- Burma
- Myanmar
- Vietnam
- Indonesia
- Thailand
- Kelantan
- Singapura
- Pulau Pinang
- Johor Bahru
- Kuala Kangsar
- Pokok Sena
- Gunung Semanggol
- Tanah Melayu
- Negeri-negeri Selat
- Negeri-negeri Melayu Bersekutu
- Sarawak
- Sabah
- Kuching
- Jesselton
- Tawau
- Labuan
- Brunei
- Saigon
- Hanoi
- Johor Bahru
- Melaka
- Pulau Pinang
- Kuala Lumpur

#### Nama gerakan / revolusi / peristiwa / dasar / slogan / dokumen
- Revolusi Keagungan
- Revolusi Amerika
- Revolusi Perancis
- Bill of Rights
- Two Treatises of Government
- Perisytiharan Kemerdekaan
- The Social Contract
- Dahagi India 1857
- Perang Dunia Pertama
- Tiga Prinsip Rakyat (San Min Chu-i)
- Revolusi China 1911
- Gerakan Islah
- Gerakan Pan-Islamisme
- al-Urwah al-Wuthqa
- Gerakan Pemulihan Meiji
- bushido
- Liga Filipina
- Gerakan Propaganda
- Katipunan
- Kalayan
- Revolusi Filipina
- Persatuan Belia Buddha
- Isu Kasut
- Majlis Persatuan Am Kesatuan Burma
- Revolusi Pelajar
- Pemberontakan Saya San
- Perlembagaan Burma
- Parti Do Bama Asiayone
- Tribunal Indigène
- La Cloche Fêlée
- Parti Viet Nam Quoc Dang Dang (VNQDD)
- Parti Komunis Vietnam (PKV)
- Republik Demokratik Vietnam
- Muhammadiyah
- Sarekat Islam (SI)
- Partai Komunis Indonesia (PKI)
- Partai Nasionalis Indonesia (PNI)
- Sumpah Pemuda
- PPPKI
- Parti Rakyat
- Syarikat Hindia Timur Inggeris (SHTI)
- Persatuan al-Jamiah al-Khairiah
- Jawi Peranakan
- Sekola Melayu
- Al-Imam
- Neracha
- Pengasuh
- Fajar Sarawak
- Madrasah al-Attas
- Madrasah al-Masyhur
- Madrasah al-Idrisiyah
- Raffles Institution
- Malay College Kuala Kangsar (MCKK)
- Sultan Idris Training College (SITC)
- Pan-Islamisme
- Kaum Muda
- Maktab Melayu Kuala Kangsar (MCKK)
- Madrasah al-Khairiah al-Islamiyah
- Maahad al-Ehya Assharif
- Al-Ikhwan
- Tunas Melayu
- Warta Malaya
- Lembaga Malaya
- Utusan Melayu
- Pejabat Karang Mengarang
- Ikatan Pemuda Pelajar
- Ikatan Semenanjung Borneo
- Kesatuan Melayu Muda (KMM)
- Syarikat Jelutong Press
- Warta Jenaka
- Majlis
- Majalah Guru
- The Malay Mail
- The Malaya Tribune
- Lat Pau
- Modern Daily News
- Nanyang Tsung Hui Pao
- Chong Shin Yit Pao
- Nanyang Siang Pao
- Tamil Nesan
- Tamil Murasu
- The Indian
- Indian Pioneer
- Mari Kita Berjuang
- Angan-angan dengan Gurindam
- Sedarlah
- Semenanjung
- Serunai Pujangga
- Rumah Besar Tiang Sebatang
- Cerita Awang Putat
- Di Sini Kita Bukannya Orang Dagang
- Kesatuan Melayu Singapura (KMS)
- Persaudaraan Sahabat Pena (PASPAM)
- Persatuan Melayu Sarawak (PMS)
- Persatuan Orang Cina Peranakan British (SCBA)
- Persatuan India Taiping
- Persatuan India Pulau Pinang
- Persidangan India Se-Malaya
- Malayan Indian Association (MIA)
- Central Indian Association of Malaya (CIAM)
- Khalsa Diwan Malaya
- Straits Settlement Legislative Council (SSLC)
- Kesatuan Melayu Singapura (KMS)
- Malayan Civil Service (MCS)
- Dasar Desentralisasi
- Straits-born people
- Majalah Bulan Melayu
- Tabung Derma Pelajaran Tinggi
- Malayan Rubber Estate Owner Association
- Majlis Perundangan Negeri-negeri Selat (SSLC)

#### Istilah politik / identiti / kelompok yang lebih baik kekal
- nasionalisme
- nasionalisme Melayu
- Huachiao
- Kaum Muda
- Kaum Tua
- Straits-born people

### 10.2 Apa yang sesuai translate sebagai kefahaman dengan dikekalkan bahasa asal

**Format cadangan:** `asal（中文）`.

#### Istilah utama Bab 2
- nasionalisme（民族主义）
- nasionalisme Melayu（马来民族主义）
- kedaulatan rakyat（人民主权）
- hak asasi manusia（基本人权）
- raja berperlembagaan（君主立宪）
- pemerintahan raja mutlak（君主专制）
- imperialisme（帝国主义）
- sekularisme（世俗主义）
- kebebasan（自由）
- persamaan（平等）
- persaudaraan（博爱 / 兄弟情谊）
- hasrat umum（公共意志）
- demokrasi（民主）
- kebajikan sosial（社会福利）
- anti-Barat（反西方）
- anti-Dinasti Manchu（反满清）
- Pan-Islamisme（泛伊斯兰主义）
- bushido（武士道）
- Gerakan Islah（伊斯兰改革运动）
- Kaum Muda（新派宗教改革派）
- Kaum Tua（旧派宗教学者）
- Isu Kasut（鞋子事件）
- Golongan Mandarin（儒学官僚阶层）
- Melayu Raya（大马来概念 / 马来大同盟理念）
- Straits-born people（海峡土生群体）

#### Nama khas yang elok ada bantuan Cina
- Revolusi Keagungan（光荣革命）
- Revolusi Amerika（美国革命）
- Revolusi Perancis（法国大革命）
- Bill of Rights（权利法案）
- Perisytiharan Kemerdekaan（独立宣言）
- Tiga Prinsip Rakyat (San Min Chu-i)（三民主义）
- Revolusi China 1911（辛亥革命）
- Republik China（中华民国）
- Republik Demokratik Vietnam（越南民主共和国）
- Perang Dunia Pertama（第一次世界大战）
- Perang Dunia Kedua（第二次世界大战）
- Gerakan Pemulihan Meiji（明治维新）
- Sumpah Pemuda（青年誓言）
- Parti Rakyat（人民党）
- Parti Do Bama Asiayone（我缅人协会 / 我们缅甸人组织）
- Katipunan（秘密革命组织 Katipunan）
- Liga Filipina（菲律宾联盟）
- Hukum Kanun Melaka

> Walaupun ini nama khas Bab 1/2.5, jika muncul semula tetap elok kekal dengan bantuan Cina.

- Kesultanan Melayu Melaka（马六甲马来苏丹国）
- Syarikat Hindia Timur Inggeris (SHTI)（英国东印度公司）
- Malayan Civil Service (MCS)（马来亚文官服务）
- Dasar Desentralisasi（分权政策）
- Persatuan Belia Buddha（佛教青年会）
- Persatuan al-Jamiah al-Khairiah（慈善教育协会/组织）
- Madrasah al-Attas（阿塔斯宗教学校）
- Madrasah al-Masyhur（马斯胡尔宗教学校）
- Madrasah al-Idrisiyah（伊德里西亚宗教学校）
- Sultan Idris Training College (SITC)（苏丹依德理斯师范学院）
- Malay College Kuala Kangsar (MCKK)（瓜拉江沙马来学院）
- Raffles Institution（莱佛士书院）
- Jawi Peranakan（爪夷土生刊物）
- Al-Imam（《领袖》）
- Fajar Sarawak（《砂拉越曙光》）
- Majalah Bulan Melayu（《马来月刊》）
- Tamil Nesan（《泰米尔之友》）
- Tamil Murasu（《泰米尔鼓声》）

#### Nama negara/tempat yang masih baik kekal dengan bantuan Cina
- Tanah Melayu（马来亚）
- Negeri-negeri Selat（海峡殖民地）
- Negeri-negeri Melayu Bersekutu（马来联邦州）
- Asia Tenggara（东南亚）
- Empayar Uthmaniyah（奥斯曼帝国）
- Filipina（菲律宾）
- Burma（缅甸）
- Vietnam（越南）
- Indonesia（印度尼西亚）
- Thailand（泰国）
- Singapura（新加坡）
- Pulau Pinang（槟城）
- Johor Bahru（新山）
- Kuala Kangsar（瓜拉江沙）
- Saigon（西贡）
- Hanoi（河内）
- Kelantan（吉兰丹）

### 10.3 Apa yang tiada masalah untuk translate terus

Ini boleh terus diterjemah kerana teks BM asal sudah ada di atas.

#### Konsep umum / huraian biasa
- cinta akan bangsa dan negara
- membela bangsa dan tanah air
- mencapai kebebasan politik, ekonomi dan sosial
- menentang penjajahan
- membina jati diri
- mempertahankan identiti
- mempertahankan maruah bangsa
- menolak keganasan
- menamatkan penjajahan
- membina identiti bangsa
- mengekalkan kemerdekaan
- pemodenan negara
- dasar tidak bekerjasama
- gerakan radikal
- perjuangan tanpa kekerasan
- pendidikan Barat
- golongan intelektual
- gerakan sosioagama awal
- perubahan kepimpinan
- peranan akhbar
- gerakan revolusi
- perjuangan melalui politik
- perjuangan melalui penulisan
- perjuangan melalui pertubuhan atau persatuan
- kesedaran kebangsaan
- hak rakyat
- peluang pendidikan
- peluang pekerjaan
- pengawasan pemerintah
- kekangan kewangan
- media cetak
- penulisan kreatif
- karya kreatif
- perpaduan dan persatuan
- kesetiaan kepada tanah air
- membina keyakinan dan maruah bangsa
- menuntut kemerdekaan
- menentang penjajahan Barat
- menuntut hak yang sama
- penyatuan umat Islam
- penyatuan perjuangan
- mengekalkan identiti budaya
- menyemai rasa cinta kepada negara asal
- anti-imperialisme
- keadilan sosial
- kebajikan masyarakat
- peluang pendidikan lebih luas
- kebajikan rakyat
- pembaharuan masyarakat
- semangat cinta akan kebebasan
- meningkatkan taraf hidup
- memajukan perusahaan
- memberi peluang perwakilan
- meningkatkan martabat wanita
- membela hak masyarakat tempatan
- membina kesedaran massa
- membina negara bangsa
- membina negara yang berdaulat
- perpaduan masyarakat
- kebangkitan kaum wanita
- peranan wanita
- pelibatan rakyat dalam pentadbiran
- penguasaan ekonomi
- titik tolak penting ke arah kemerdekaan

#### Frasa tindakan / fungsi biasa
- menubuhkan persatuan
- menubuhkan sekolah
- menyebarkan idea
- mengkritik penindasan
- mengkritik ketidakadilan sosial
- menyedarkan masyarakat
- meningkatkan pendidikan
- menolak pemerintahan mutlak
- menuntut penubuhan universiti tempatan
- menuntut kebebasan
- membina kerajaan baharu
- menggalakkan perniagaan
- menerbitkan rencana
- membuka peluang pendidikan kepada wanita
- menubuhkan dana biasiswa
- menulis surat
- menerbitkan buku
- menggerakkan pendidikan
- menyeru masyarakat bangkit
- memperjuangkan nasib wanita
- memperjuangkan hak masyarakat
- menuntut perwakilan
- menuntut hak politik
- menuntut peluang dalam pentadbiran
- menyatukan suara rakyat

## 11) Panduan terjemahan Bab 3 (Mod Bahasa Cina)

Panduan ini khusus untuk **Bab 3** dan melengkapkan panduan Bab 1 serta Bab 2. Gunakan senarai ini sebagai rujukan utama semasa terjemahan/semakan ZH berkaitan konflik dunia dan pendudukan Jepun.

### 11.1 Apa yang langsung tak sesuai translate

Kekal seperti asal.

#### Jenama / platform
- HazimEdu

#### Nama bab / subtopik rasmi
- Konflik Dunia dan Pendudukan Jepun di Negara Kita
- Nasionalisme di Negara Kita Sebelum Perang Dunia
- Latar Belakang Perang Dunia
- Perang Dunia Kedua
- Perang Dunia Kedua di Asia Pasifik
- Faktor Kedatangan Jepun ke Negara Kita
- Dasar Pendudukan Jepun di Negara Kita
- Perjuangan Rakyat Menentang Pendudukan Jepun
- Perkembangan Gerakan Nasionalisme Tempatan dan Pendudukan Jepun
- Keadaan Negara Kita Selepas Kekalahan Jepun

#### Nama tokoh / individu
- Tok Janggut
- Archduke Ferdinand
- Sophie
- Woodrow Wilson
- Kaiser Wilhelm II
- Tsar Nicholas II
- Vladimir Lenin
- Sultan Mehmed VI
- Mustafa Kemal Atatürk
- Benito Mussolini
- Adolf Hitler
- Jeneral Hideki Tojo
- Subhas Chandra Bose
- Ahmad Murad Nasaruddin
- Leftenan Jeneral A.E. Percival
- Leftenan Adnan Saidi
- Leftenan Ibrahim Alla Ditta MC
- Koperal Yaakob Bidin
- Mejar Tengku Mahmood Mahyiddeen
- Leftenan Tunku Yusuf Tunku Yaakub
- Kapten Ibrahim Ismail
- Leftenan Tengku Osman Tengku Mohd Jiwa
- Pegawai Daerah Gerik, Kapten Mohd Salleh Haji Sulaiman
- Yeop Mahidin
- Gurchan Singh
- Sybil Kathigasu
- Sybil Medan Daly
- Dr. Abdon Clement Kathigasu
- Albert Kwok
- Datu Mustapha Datu Harun
- Dr. Burhanuddin al-Helmi
- Ibrahim Haji Yaakob
- Onan Haji Siraj
- Abang Haji Openg
- Empenit Adam
- Satem
- Tengku Noordin
- Abu Bakar
- Zakaria Gunn
- Orang Kaya-Kaya Abu Bakar
- Maharaja Hirohito
- Dato' Haji Abdul Razak bin Abdul Hamid
- Razak Sensei
- Lord Louis Mountbatten
- Jeneral Douglas MacArthur
- Leftenan Jeneral Masao Baba
- Mejar Jeneral Hiyoe Yamamura
- Jeneral Teizo Ishiguro
- Leftenan O. L. Roberts
- Haji Salleh Abdul Karim
- Kiai Salleh
- Tuan Haji Bakri Haji Mohd Saman
- Dato' Onn Jaafar
- Sultan Ibrahim
- Sultan Abu Bakar Ri'ayatuddin Al-Mu'adzam Shah
- Sultan Abdul Aziz Almustasim Billah Shah
- Archibald Anson
- Friedrich Von Paulus
- Franklin D. Roosevelt
- Winston Churchill
- Joseph Stalin

#### Nama negara / wilayah / tempat khusus
- Tanah Melayu
- British
- Timur Tengah
- Empayar Uthmaniyah
- Pasir Puteh
- Kelantan
- Rantau Balkan
- Eropah
- Austria-Hungary
- Serbia
- Jerman
- Britain
- Perancis
- Rusia
- Belgium
- Bulgaria
- Portugal
- Romania
- Greece
- Amerika Syarikat
- Belanda
- Austria
- Hungary
- Czechoslovakia
- Yugoslavia
- Poland
- Estonia
- Latvia
- Lithuania
- Lebanon
- Syria
- Iraq
- Eropah dan Afrika Utara
- Asia
- Asia Tenggara
- Habsyah (Ethiopia)
- Albania
- Rhineland
- Manchuria
- Denmark
- Norway
- Luxembourg
- Leningrad
- Moscow
- Stalingrad
- Normandy
- Calais
- Asia Pasifik
- Lautan Pasifik
- Tanah Besar Asia
- Kepulauan Asia Tenggara
- Korea
- China
- Indochina
- Laut China Selatan
- Pulau Hainan
- Hawaii
- Pearl Harbor
- Filipina
- Hong Kong
- Pulau Guam
- Pulau Wake
- Kota Bharu
- Singgora
- Thailand
- Miri
- Manila
- Burma
- Sandakan
- Darwin
- Laut Jawa
- Tokyo
- Pantai Kuala Pak Amat
- Pantai Sabak
- Pantai Badang
- Sarawak
- Sabah
- Miri
- Lutong
- Semenanjung Tanah Melayu
- Singapura
- Sumatera
- Pulau Borneo
- Pulau Jawa
- Jitra
- Alor Setar
- Pulau Pinang
- Ipoh
- Kuantan
- Slim River
- Port Swettenham
- Kuala Lumpur
- Muar
- Batu Pahat
- Mersing
- Johor Bahru
- Kuching
- Sibu
- Labuan
- Beaufort
- Jesselton
- Taiping
- Bukit Tinggi
- Perlis
- Kedah
- Terengganu
- Brunei
- Kuala Kangsar
- Bario
- Belait
- Trusan
- Baram
- Tutong
- Marudi
- Sungai Rajang
- Bintulu
- Mukah
- Kota Belud
- Menggatal
- Tuaran
- Petagas
- Kanowit
- Ayer Hitam
- Senggarang
- Rengit
- Batu Kikir
- Padang Lebar
- Alor Gajah
- Sungai Manik
- Teluk Anson
- Kampung Gajah
- Bidor
- Temerloh
- Raub
- Baling
- Teluk Intan
- Teluk Mak Intan
- Parit Raja
- Kuala Lipis
- Hiroshima
- Nagasaki
- Surrender Point
- Kota Kinabalu

#### Nama pertubuhan / pasukan / institusi / perjanjian / operasi / dokumen
- Enakmen Undang-Undang Islam 1904
- Criminal Intelligence Department (CID)
- Political Intelligence Bureau (PIB)
- Utusan Melayu
- Lembaga Melayu
- Lidah Teruna
- Pengasuh
- Cerita Tekukur
- Perang Dunia Pertama
- Perang Dunia Kedua
- Revolusi Industri
- Kuasa Tengah
- Pakatan Bertiga
- Triple Alliance
- Pelan Schlieffen
- Persidangan Damai Paris
- Deklarasi 14 Perkara
- Perjanjian Versailles
- Liga Bangsa-Bangsa
- To Vest in the High Commissioner Exceptional Power in Time of Public Emergency Enactment 1914
- Trading With Enemy Enactment 1914
- Naval and Military News (Emergency) Enactment 1914
- Kuasa Paksi
- Kuasa Bersekutu
- Fasisme
- Nazisme
- Parti Fasis
- Parti Nazi
- Krisis Manchuria
- Krisis Habsyah
- Blitzkrieg
- Operasi Barbarossa
- Operasi D-Day
- Perang Pasifik
- Pakatan Tiga Negara
- Pembaharuan Meiji
- Kawasan Lingkungan Sekemakmuran Asia Timur Raya
- Pemerintahan Tentera Tanah Melayu
- Kawasan Pertahanan Khas
- Syonan-to
- Malai Baru
- Kita Boruneo
- Kempeitai
- Koa Kunrenjo
- Institut Latihan Pemimpin-pemimpin Muda
- Rancangan Pengeluaran Lima Tahun
- Jawatankuasa Penyelidikan Bahan
- Rancangan Perindustrian Lima Tahun
- wang pokok pisang
- Hakko Ichiu
- Nippon Seishin
- Nippon Go
- Kimigayo
- Tenno Heika
- Ordinan Kawalan Barangan dan Bahan Penting
- Tambah Lebih Banyak Makanan
- Tentera Kebangsaan India
- Perang China-Jepun
- Landasan Kereta Api Maut
- Nyawa di Hujung Pedang
- Rejimen Askar Melayu
- MPAJA
- Force 136
- Kuomintang (KMT)
- Overseas Chinese Anti-Japanese Army (OCAJA)
- Tentera Bintang Satu
- Parti Komunis Malaya (PKM)
- Sekolah Latihan Khas
- South East Asia Command (SEAC)
- Askar Melayu Setia
- Gerila Wataniah Pahang
- Gerila Melayu Kedah
- Operasi Zipper
- “Harimau Malaya”
- Suara Harimau Malaya
- “Lion of Malaya”
- Pingat King George VI
- Istana Buckingham
- Operasi Semut
- Unit Khas Z Australia
- Jabatan Peninjauan Perkhidmatan Australia
- Australian Services Reconnaissance Department (SRD)
- Pemberontakan Jesselton
- Double Tenth
- KMM
- Giyu Gun
- Giyu Tai
- Pembela Tanah Air (PETA)
- KRIS
- PKMM
- Kakeo Kokokai
- Parti Kebangsaan Melayu Labuan (PKML)
- Parti Kebangsaan Melayu Tawau
- Little Boy
- Fat Man
- HMAS Kapunda
- Bintang Tiga
- Bintang Tiga PKM
- Gerakan Fi-Sabilillah
- Tentera Selempang Merah
- Khalifah Parang Panjang
- Dewan Perniagaan Cina Batu Pahat
- mahkamah komunis

#### Istilah khas / label khas yang lebih baik kekal
- Pan-Islamisme
- fatwa jihad
- Kuasa imperialis
- Pakatan ketenteraan
- Slav
- Orde baharu
- strategi serangan kilat
- romusha
- kekosongan kuasa politik

### 11.2 Apa yang sesuai translate sebagai kefahaman dengan dikekalkan bahasa asal

**Format cadangan:** `asal（中文）`.

#### Istilah konsep perang / politik / gerakan
- Pan-Islamisme（泛伊斯兰主义）
- fatwa jihad（圣战号召 / 圣战教令）
- kuasa imperialis（帝国主义列强）
- pakatan ketenteraan（军事同盟）
- Slav（斯拉夫民族）
- Fasisme（法西斯主义）
- Nazisme（纳粹主义）
- Blitzkrieg（闪电战）
- Operasi Barbarossa（巴巴罗萨行动）
- Operasi D-Day（诺曼底登陆 / D日行动）
- Orde baharu（新秩序）
- strategi serangan kilat（闪击战略）
- kekosongan kuasa politik（政治权力真空）
- romusha（劳工征调苦工）
- mahkamah komunis（共产党法庭）
- Gerakan Fi-Sabilillah（为圣道而战运动）

#### Nama dokumen / dasar / perjanjian yang elok dibantu dengan gloss Cina
- Enakmen Undang-Undang Islam 1904（1904年伊斯兰法令）
- Deklarasi 14 Perkara（十四点和平原则）
- Perjanjian Versailles（凡尔赛条约）
- Liga Bangsa-Bangsa（国际联盟）
- Perang Pasifik（太平洋战争）
- Pakatan Tiga Negara（三国同盟条约）
- Kawasan Lingkungan Sekemakmuran Asia Timur Raya（大东亚共荣圈）
- Pemerintahan Tentera Tanah Melayu（马来亚军政）
- Kawasan Pertahanan Khas（特别防区）
- Ordinan Kawalan Barangan dan Bahan Penting（重要物资管制条例）
- Tambah Lebih Banyak Makanan（增产粮食运动）
- Landasan Kereta Api Maut（死亡铁路）
- Gerakan Fi-Sabilillah（圣战保卫运动）
- Persidangan Damai Paris（巴黎和会）

#### Nama tempat / entiti yang elok kekal dengan bantuan Cina
- Empayar Uthmaniyah（奥斯曼帝国）
- Rantau Balkan（巴尔干地区）
- Tanah Melayu（马来亚）
- Asia Pasifik（亚太地区）
- Syonan-to（昭南岛）
- Malai Baru（新马来）
- Kita Boruneo（北婆罗洲合并行政区）
- Habsyah (Ethiopia)（阿比西尼亚 / 埃塞俄比亚）
- Pearl Harbor（珍珠港）
- Hiroshima（广岛）
- Nagasaki（长崎）
- Jesselton（亚庇旧称杰瑟顿）
- Teluk Anson（安顺）
- Teluk Intan（直落英丹）

#### Nama pertubuhan / pasukan / operasi yang elok kekal dengan bantuan Cina
- Kuasa Tengah（同盟国阵营 / 中央同盟）
- Pakatan Bertiga（协约国 / 三方协约）
- Kuasa Paksi（轴心国）
- Kuasa Bersekutu（同盟国）
- MPAJA（马来亚人民抗日军）
- Force 136（136部队）
- Kuomintang (KMT)（国民党）
- Overseas Chinese Anti-Japanese Army (OCAJA)（华侨抗日军）
- KMM（马来青年联盟）
- Giyu Gun（义勇军）
- Giyu Tai（义勇队）
- Pembela Tanah Air (PETA)（保卫祖国军）
- KRIS（半岛印尼人民联盟）
- PKMM（马来亚马来民族党）
- Kakeo Kokokai（日方统合华侨组织）
- Bintang Tiga（三星抗日力量 / 三星组织）
- Operasi Semut（蚂蚁行动）
- Operasi Zipper（拉链行动）

#### Istilah pendidikan / sosial Jepun yang elok kekal dengan gloss
- wang pokok pisang（香蕉钞）
- Hakko Ichiu（八纮一宇）
- Nippon Seishin（日本精神）
- Nippon Go（日语）
- Kimigayo（日本国歌《君之代》）
- Tenno Heika（天皇陛下）

### 11.3 Apa yang tiada masalah untuk translate terus

Ini boleh diterjemah terus kerana teks BM asal sudah ada di atas.

#### Konsep umum / huraian biasa
- semangat antipenjajah
- penentangan terbuka
- penindasan
- strategi baharu
- penulisan dan penerbitan
- penyampaian idea secara simbolik dan tersirat
- bahan mentah
- pampasan perang
- keruntuhan pemerintahan beraja
- kemunculan negara baharu
- serangan udara
- serangan darat
- serangan laut
- kerjasama kuasa besar
- keberkesanan strategi serangan balas
- keperluan perindustrian
- pengaruh golongan tentera
- sekatan ekonomi
- rancangan penaklukan wilayah di selatan
- eksploitasi sumber bahan mentah
- kepentingan strategik ketenteraan
- laluan kemaraan
- dasar pentadbiran
- dasar ekonomi
- dasar sosial
- ekonomi kawalan
- inflasi
- catuan makanan
- layanan terhadap penduduk
- kekejaman tentera
- perjuangan bersenjata
- perang gerila
- kerjasama dengan pihak luar
- penentangan individu
- semangat nasionalisme
- perkembangan nasionalisme tempatan
- kesedaran politik
- pengakhiran perang
- tindak balas orang Melayu
- usaha perundingan
- keretakan hubungan kaum
- ancaman kepada kerukunan hidup
- keamanan dunia
- kemusnahan harta benda
- kesengsaraan hidup
- kekurangan makanan
- keyakinan terhadap kebolehan sendiri
- perjuangan kemerdekaan yang lebih tersusun

#### Frasa tindakan / fungsi biasa
- memantau kegiatan politik
- menyekat pengaruh gerakan Islam
- mengawal kebangkitan nasionalisme
- mempertahankan agama
- menentang penjajahan Barat
- menyusun strategi baharu
- mengelakkan sekatan British
- mendapatkan bahan mentah
- meluaskan kawasan pasaran
- membina semula angkatan tentera
- menceroboh wilayah
- menawan bandar utama
- mengekalkan kedudukan raja
- melatih pemimpin tempatan
- mengawal pengeluaran barangan
- membiayai pendudukan
- membentuk semangat persaudaraan
- menanam kesetiaan
- menghormati kebudayaan Jepun
- menambah pengeluaran makanan
- membantu gerila
- menjalankan sabotaj
- menyebarkan propaganda
- mengumpulkan maklumat
- memulihkan keamanan
- menghalang pertumpahan darah
- mempertahankan maruah bangsa
- mempertahankan hak
- mempertahankan harta
- menjayakan operasi ketenteraan
- membangkitkan semangat juang rakyat
- mempercepat gerakan ke arah kemerdekaan

## 12) Panduan terjemahan Bab 4 (Mod Bahasa Cina)

Panduan ini khusus untuk **Bab 4** dan melengkapkan panduan Bab 1 hingga Bab 3. Gunakan senarai ini sebagai rujukan utama semasa terjemahan/semakan ZH berkaitan era peralihan kuasa British.

### 12.1 Apa yang langsung tak sesuai translate

Kekal seperti asal.

#### Jenama / platform
- HazimEdu

#### Nama bab / subtopik rasmi
- Era Peralihan Kuasa British di Negara Kita
- British Military Administration
- Gagasan Malayan Union
- Reaksi Penduduk Tempatan terhadap Malayan Union
- Penyerahan Sarawak kepada Kerajaan British
- Reaksi Penduduk Tempatan terhadap Penyerahan Sarawak
- Penyerahan Sabah kepada Kerajaan British
- Reaksi Penduduk Tempatan terhadap Penyerahan Sabah

#### Nama tokoh / individu
- Lord Mountbatten
- Brigedier Jeneral H.C. Willan
- Mejar Jeneral Ralph Hone
- George Henry Hall
- Sir Harold MacMichael
- A.T. Newboult
- Sultan Ibrahim ibni Almarhum Sultan Abu Bakar
- Sultan Hisamuddin Alam Shah ibni Almarhum Sultan Alauddin Sulaiman Shah
- Sultan Abu Bakar Ri'ayatuddin Al-Mu'adzam Shah
- Yang di-Pertuan Besar Tuanku Abdul Rahman
- Sultan Abdul Aziz Almustasim Billah Shah
- Sultan Badlishah
- Raja Perlis, Tuanku Syed Putra Jamalullail
- Sultan Ibrahim ibni Almarhum Sultan Muhammad IV
- Sultan Ismail Nasiruddin Shah ibni Almarhum Sultan Zainal Abidin
- Dato’ Onn Jaafar
- Sultan Hisamuddin Alam Shah
- Tuanku Permaisuri Perak, Raja Perempuan Kelsom
- Sultan Iskandar Shah
- Sir Edward Gent
- Za’ba
- Dato’ Nik Ahmad Kamil
- Tengku Mohamed
- Dato’ Abdul Wahab Abdul Aziz
- Wan Md Yussof
- Dato’ Hamzah Abdullah
- Dato’ Abdul Rahman Mohammad Yassin
- Cikgu Zaharah Abdullah
- Halimahton Abd Majid
- Saleha Mohd Ali
- Zaharah Tamin
- Datin Puteh Mariah Ibrahim Rashid
- Hasnah Ishak
- Frank Swettenham
- Roland Braddell
- Cecil Clementi Smith
- Richard Winstedt
- Frederick Weld
- George Maxwell
- Tuan Haji Hussain Che Dol
- Senu Abdul Rahman
- Ungku Omar Abdullah
- Dr. Hamzah
- Tunku Abdul Rahman
- L.D. Gammans
- David Rees Williams
- Vyner Brooke
- Anthony Brooke
- Bertram Brooke
- Oliver Stanley
- Gerard T. MacBryan
- Datu Patinggi Abang Haji Abdillah
- Datu Bandar Abang Haji Mustapha
- Datu Amar Abang Haji Suleiman
- Johari Anang
- Sharkawi Osman
- Charles Arden Clarke
- Cikgu Lily Eberwein
- Hajah Sipah Tuanku Othman
- Dayang Fauziah
- Cikgu Ajibah Abol
- Clement Attlee
- Awang Rambli
- Morshidi Sidek
- Bujang Suntong
- Duncan Stewart
- Rosli Dhoby
- C.F.C. Macaskie
- Sir Edward Twining
- Pengiran Muhd Yusof Jamil Umar
- H.M. Salleh
- Mandur Mohammad Syarif
- Imam Suhaili Yaakub
- Seruji Yaakub
- Tengku Noordin
- Zakaria Gunn
- Abu Bakar K. Ahmad
- Apong Kerahu
- Zulkifli Apong Abang Abdul Hadi

#### Nama tempat / negeri / lokasi khas
- Tanah Melayu
- Sarawak
- Sabah
- British
- London
- England
- Istana Iskandariah, Kuala Kangsar
- Kuala Kangsar
- Hotel Station
- Batu Pahat
- Parit Raja
- Alor Setar
- Titi Bumbung Lima
- Pulau Pinang
- Padang Francis Light School
- Ipoh
- Pekan Ahad, Jalan Datuk
- Kampung Baru
- Kuala Lumpur
- Padang Kelab Sultan Sulaiman
- Klang
- Istana Alam Shah
- Seremban
- Bangunan Kelab Sultan Sulaiman
- Istana Johor
- Kuching
- Port Swettenham
- Selangor
- Johor
- Pahang
- Negeri Sembilan
- Perak
- Kedah
- Kelantan
- Terengganu
- Kota Bharu
- Astana
- Sibu
- Miri
- Matu
- Kalaka
- Brunei
- Jesselton
- Kudat
- Sandakan
- Kota Kinabalu
- Labuan
- Sri Lanka
- India
- Burma

#### Nama pertubuhan / institusi / dasar / dokumen / rang undang-undang
- British Military Administration (BMA)
- Malayan Union
- British Borneo Civil Affairs Unit (BBCAU)
- Persekutuan Tanah Melayu 1948
- Syarikat Borneo Utara British (SBUB)
- Unit Perancang Tanah Melayu
- Kertas Putih 6724
- Persatuan Pelajar Melayu Britain
- Persatuan Cina Seberang Laut
- Negeri-negeri Melayu Bersekutu
- Negeri-negeri Melayu Tidak Bersekutu
- Negeri-negeri Selat
- Majlis Raja-Raja
- Majlis Eksekutif
- Majlis Perundangan Malayan Union
- Persidangan Raja-raja Melayu
- Lembaga Kesatuan Melayu Johor
- Pergerakan Melayu Semenanjung Johor
- SABERKAS
- Persatuan Melayu Kedah
- Perikatan Melayu Perak
- Persatuan Melayu Selangor
- Persatuan Melayu Johor
- Kesatuan Melayu Kedah
- Kesatuan Ulama Kedah
- United Malays National Organisation (UMNO)
- Kongres Melayu
- British Military Administration (BMA) di Sarawak
- Pejabat Tanah Jajahan
- Cession Bill
- Majlis Negeri
- Perlembagaan 1941
- Prinsip Kelapan Perlembagaan 1941
- Circular No. 9
- Pekeliling No. 9/1946
- Pergerakan Pemuda Melayu (PPM)
- Barisan Pemuda Sarawak (BPS)
- Persatuan Kebangsaan Melayu Sarawak (PKMS)
- Persatuan Melayu Miri
- Kesetiaan Muda Matu
- Persekutuan Bumiputera
- Sarawak Dayak Association (SDA)
- Rukun 13
- Utusan Sarawak
- Young Malay Association (YMA)
- Privy Council
- Sungkit Berdarah
- Angkatan Semangat Anak Negeri Sarawak (ASAS)
- Persaudaraan Sahabat Pena Sabah (PASPAS)
- Persatuan Kebangsaan Melayu di Sabah
- Barisan Pemuda Sabah (BARIP)
- Parti Kebangsaan Melayu Labuan (PKML)

#### Nama istilah / label khas / slogan / panggilan yang lebih baik kekal
- jus soli
- Hari Kematian
- Royalist
- Tanah Jajahan British
- Hari Penyerahan Sarawak
- Perlembagaan 1941
- sosioekonomi
- No Cession
- “Sarawak adalah hak kami”
- “Leburkan kolonial”
- “Kerajaan British Menipu Rakyat”
- “Humbankan Perjanjian MacMichael”
- “Kami Berkehendak Naungan, Bukan Penaklukan”
- “Jangan Kecewakan Kami”
- “Kekalkan Takhta Kerajaan Raja-raja Melayu”
- “MacMichael ialah Imperialis”
- “Daulat Tuanku!”
- “Hidup Melayu!”

### 12.2 Apa yang sesuai translate sebagai kefahaman dengan dikekalkan bahasa asal

**Format cadangan:** `asal（中文）`.

#### Pentadbiran / dasar / struktur perlembagaan
- British Military Administration (BMA)（英军政当局）
- Malayan Union（马来亚联邦方案 / 马来亚联盟）
- Persekutuan Tanah Melayu 1948（1948年马来亚联合邦）
- British Borneo Civil Affairs Unit (BBCAU)（英属婆罗洲民政事务单位）
- Unit Perancang Tanah Melayu（马来亚规划单位）
- Kertas Putih 6724（6724号白皮书）
- Cession Bill（割让法案）
- Majlis Negeri（州议会）
- Majlis Raja-Raja（马来统治者会议）
- Majlis Eksekutif（行政议会）
- Majlis Perundangan Malayan Union（马来亚联盟立法议会）
- Circular No. 9 / Pekeliling No. 9/1946（第9号通令）
- Tanah Jajahan British（英属殖民地）

#### Istilah undang-undang / politik / pentadbiran
- jus soli（属地主义出生公民权）
- Hari Kematian（死亡日）
- sosioekonomi（社会经济）
- Perlembagaan 1941（1941年宪法）
- Prinsip Kelapan Perlembagaan 1941（1941年宪法第八原则）
- Hari Penyerahan Sarawak（砂拉越割让日）

#### Pertubuhan / gerakan / parti yang elok dibantu dengan gloss Cina
- United Malays National Organisation (UMNO)（巫统）
- Kongres Melayu（马来人大会）
- Persatuan Pelajar Melayu Britain（旅英马来学生会）
- Persatuan Cina Seberang Laut（海外华人协会）
- SABERKAS（青年前锋协会）
- Persatuan Kebangsaan Melayu Sarawak (PKMS)（砂拉越马来民族协会）
- Pergerakan Pemuda Melayu (PPM)（马来青年运动）
- Barisan Pemuda Sarawak (BPS)（砂拉越青年阵线）
- Sarawak Dayak Association (SDA)（砂拉越达雅协会）
- Rukun 13（十三人团）
- Young Malay Association (YMA)（青年马来协会）
- Persaudaraan Sahabat Pena Sabah (PASPAS)（沙巴笔友联谊会）
- Barisan Pemuda Sabah (BARIP)（沙巴青年阵线）
- Parti Kebangsaan Melayu Labuan (PKML)（纳闽马来民族党）
- Angkatan Semangat Anak Negeri Sarawak (ASAS)（砂拉越本土儿女精神阵线）

#### Tempat / entiti yang elok dikekalkan dengan kefahaman Cina
- Tanah Melayu（马来亚）
- Sarawak（砂拉越）
- Sabah（沙巴）
- Negeri-negeri Melayu Bersekutu（马来联邦州）
- Negeri-negeri Melayu Tidak Bersekutu（马来非联邦州）
- Negeri-negeri Selat（海峡殖民地）
- Port Swettenham（巴生港旧称）
- Jesselton（亚庇旧称）
- Kota Kinabalu（亚庇）
- Astana（阿斯塔纳官邸）
- Labuan（纳闽）
- Brunei（文莱）

#### Slogan / poster / frasa perjuangan
- No Cession（不要割让）
- “Sarawak adalah hak kami” （砂拉越属于我们）
- “Leburkan kolonial” （打倒殖民主义）
- “Kerajaan British Menipu Rakyat” （英国政府欺骗人民）
- “Humbankan Perjanjian MacMichael” （打倒麦迈克条约）
- “Kami Berkehendak Naungan, Bukan Penaklukan” （我们要保护，不要征服）
- “Jangan Kecewakan Kami” （不要让我们失望）
- “Kekalkan Takhta Kerajaan Raja-raja Melayu” （维护马来统治者王位）
- “MacMichael ialah Imperialis” （麦迈克是帝国主义者）
- “Daulat Tuanku!” （陛下万岁）
- “Hidup Melayu!” （马来民族万岁）

#### Nama dokumen / alat / kapal yang elok dikekalkan dengan gloss
- Royalist（“Royalist”号舰）
- Privy Council（枢密院）
- Cession Bill（割让法案）

### 12.3 Apa yang tiada masalah untuk translate terus

Ini boleh diterjemah terus kerana teks BM asal sudah ada di atas.

#### Istilah konsep umum
- era peralihan kuasa
- kestabilan dan keamanan
- kepercayaan rakyat
- masalah kewangan
- masalah pewarisan takhta
- tenaga kerja
- sistem pentadbiran
- kewarganegaraan
- penjajahan baharu
- kedaulatan
- kuasa politik
- pemerintahan sendiri
- desakan
- tekanan
- paksaan politik
- bantahan
- demonstrasi
- persidangan
- rapat umum
- gerakan berpersatuan
- gerakan antipenyerahan
- gerakan nasionalisme
- peletakan jawatan beramai-ramai
- peluang pekerjaan
- taraf hidup rakyat
- hak rakyat
- kebangkitan nasionalisme
- pembangunan semula
- hubungan luar
- pertahanan
- kemajuan negeri
- kemajuan masyarakat tempatan
- kepentingan ekonomi
- kepentingan politik
- bahan mentah
- pasaran
- birokrasi Barat
- pengalaman pentadbiran moden

#### Frasa / huraian biasa
- mengembalikan kestabilan
- memulihkan keamanan
- membubarkan pasukan bersenjata
- mengawal jenayah
- membanteras keganasan
- membendung kongsi gelap
- memulihkan kehidupan harian
- membaiki kemudahan kesihatan
- membaiki prasarana awam
- memulihkan ekonomi
- meningkatkan pelaburan
- mengukuhkan pertahanan
- mendapatkan tandatangan sultan
- mengadakan kongres
- memulaukan upacara
- menyokong gerakan bantahan
- mengkritik kandungan perjanjian
- menghantar surat bantahan
- membawa kes ke mahkamah
- memajukan negeri
- membuka peluang pentadbiran
- meningkatkan taraf hidup
- mengorbankan masa dan tenaga
- menyebarkan kesedaran
- menubuhkan badan induk
- menyatukan orang Melayu
- mengetepikan wasiat
- mendapatkan persetujuan ketua tempatan
- menampal poster bantahan
- menubuhkan kumpulan sulit
- menghapuskan pegawai tinggi British
- menutup pejabat pertubuhan
- menekan gerakan kebangsaan
- mengehadkan peluang penduduk tempatan
- menawarkan jawatan kerajaan
- memberikan kenaikan pangkat
- memindahkan pemimpin aktif
- membangunkan semula negeri selepas perang

#### Keadaan / masalah hidup rakyat
- bekalan makanan sukar diperoleh
- ubat-ubatan tidak mencukupi
- harga barang melambung tinggi
- wabak penyakit
- kebuluran
- pasar gelap
- rasuah
- peras ugut
- menyorok barang
- kekurangan jentera
- kekurangan alat ganti
- kekurangan mesin
- kekurangan teknologi
- kemusnahan prasarana
- kemusnahan bandar
- masalah dana
- kelemahan organisasi
- masalah kewangan pertubuhan
- kekurangan pemimpin berkebolehan

## 13) Panduan terjemahan Bab 5 (Mod Bahasa Cina)

Panduan ini khusus untuk **Bab 5** dan melengkapkan panduan Bab 1 hingga Bab 4. Gunakan senarai ini sebagai rujukan utama semasa terjemahan/semakan ZH berkaitan Persekutuan Tanah Melayu 1948.

### 13.1 Apa yang langsung tak sesuai translate

Kekal seperti asal.

#### Jenama / platform
- HazimEdu

#### Nama bab / subtopik rasmi
- Persekutuan Tanah Melayu 1948
- Latar Belakang Penubuhan Persekutuan Tanah Melayu 1948
- Faktor Penubuhan Persekutuan Tanah Melayu 1948
- Ciri-ciri Persekutuan Tanah Melayu 1948
- Kesan Penubuhan Persekutuan Tanah Melayu 1948

#### Nama pentadbiran / perjanjian / perlembagaan / piagam
- Persekutuan Tanah Melayu 1948
- Perjanjian Persekutuan Tanah Melayu 1948
- Perjanjian Persekutuan Tanah Melayu
- Malayan Union
- Malayan Union 1946
- Perlembagaan Rakyat
- Perlembagaan Tanah Melayu 1957
- Piagam Atlantik
- Hari Hartal Se-Malaya

#### Nama pertubuhan / jawatankuasa / majlis / badan
- Jawatankuasa Kerja
- PUTERA-AMCJA
- Pusat Tenaga Rakyat (PUTERA)
- All Malaya Council of Joint Action (AMCJA)
- Parti Kebangsaan Melayu Malaya (PKMM)
- Angkatan Pemuda Insaf (API)
- Gerakan Angkatan Muda (GERAM)
- Hizbul Muslimin
- Barisan Tani Malaya (BATAS)
- Angkatan Wanita Sedar (AWAS)
- Pan-Malayan Federation of Trade Union (PMFTU)
- Malayan Democratic Union (MDU)
- Malayan Indian Congress (MIC)
- UMNO
- MCS
- Malayan Civil Service
- Dewan Perniagaan Cina
- Dewan Parlimen British
- Parlimen British
- Majlis Mesyuarat Persekutuan
- Majlis Perundangan Persekutuan
- Majlis Raja-Raja
- Dewan Perundangan Negeri
- Jawatankuasa Hubungan Antara Kaum
- Communities Liaison Committee (CLC)

#### Nama tokoh / individu
- Dato’ Onn Jaafar
- Dato’ Abdul Rahman Mohd Yassin
- Haji Megat Yunus
- A.T. Newboult
- K.K. O’Connor
- W.D. Godsall
- Dr. W. Linchan
- W. Linehan
- A. Williams
- D.C. Watherston
- Raja Kamaralzaman Raja Ngah Mansur
- Dato’ Hamzah Abdullah
- Haji Mohamad Sheriff Osman
- Dato’ Nik Ahmad Kamil Mahmud
- Theodore Adams
- Roland Braddell
- Ralph Hone
- Sir Ralph Hone
- Dr. Burhanuddin al-Helmi
- Ahmad Boestamam
- Aziz Ishak
- Abdul Samad Ismail
- Abu Bakar al-Baqir
- Musa Ahmad
- Shamsiah Fakeh
- Tan Cheng Lock
- Chan Loo
- John Eber
- John Thivy
- Dr. Ismail Abdul Rahman
- Malcolm MacDonald
- Sir Edward Gent
- L.D. Gammans
- David Rees Williams
- Sultan Perak
- Raja-raja Melayu
- Pesuruhjaya Tinggi British
- Raja Melayu
- Raja Berperlembagaan

#### Nama tempat / wilayah / entiti khusus
- Tanah Melayu
- Singapura
- England
- Kuala Kangsar
- Pulau Pinang
- King’s House, Kuala Lumpur
- Kuala Lumpur
- Perak
- Hulu Langat, Selangor
- Temerloh, Pahang
- Melaka
- Pulau Pinang
- Britain
- Amerika Syarikat
- Negeri-negeri Selat
- negeri Melayu

#### Nama karya / judul / istilah berjudul
- Suara Rakyat
- Testament Politik API

#### Istilah khas / label khas yang lebih baik kekal
- hartal
- naturalised
- rakyat Raja
- rakyat British
- tokoh politik nasional
- Bahasa Melayu *(sebagai label istilah rasmi dalam konteks kebangsaan)*
- bahasa Inggeris *(bila disebut sebagai syarat rasmi)*
- kedudukan istimewa orang Melayu
- kepentingan sah kaum lain

### 13.2 Apa yang sesuai translate sebagai kefahaman dengan dikekalkan bahasa asal

**Format cadangan:** `asal（中文）`.

#### Pentadbiran / perjanjian / struktur politik
- Persekutuan Tanah Melayu 1948（1948年马来亚联合邦）
- Perjanjian Persekutuan Tanah Melayu 1948（1948年马来亚联合邦协议）
- Malayan Union（马来亚联盟）
- Perlembagaan Rakyat（人民宪章 / 人民宪法方案）
- Perlembagaan Tanah Melayu 1957（1957年马来亚宪法）
- Piagam Atlantik（大西洋宪章）

#### Pertubuhan / gabungan / badan penting
- Jawatankuasa Kerja（工作委员会）
- PUTERA-AMCJA（PUTERA-AMCJA 联合阵线）
- Pusat Tenaga Rakyat (PUTERA)（人民力量中心）
- All Malaya Council of Joint Action (AMCJA)（全马联合行动理事会）
- Parti Kebangsaan Melayu Malaya (PKMM)（马来亚马来民族党）
- Angkatan Pemuda Insaf (API)（觉醒青年团）
- Gerakan Angkatan Muda (GERAM)（青年运动阵线）
- Hizbul Muslimin（穆斯林阵线）
- Barisan Tani Malaya (BATAS)（马来亚农民阵线）
- Angkatan Wanita Sedar (AWAS)（觉醒妇女阵线）
- Pan-Malayan Federation of Trade Union (PMFTU)（全马工会联合会）
- Malayan Democratic Union (MDU)（马来亚民主同盟）
- Malayan Indian Congress (MIC)（马来亚印度人国大党）
- Communities Liaison Committee (CLC)（族群联络委员会）
- Jawatankuasa Hubungan Antara Kaum（族群关系委员会）
- Dewan Perniagaan Cina（中华总商会 / 华人商会）
- MCS / Malayan Civil Service（马来亚文官服务）

#### Istilah politik / kenegaraan / kewarganegaraan
- hartal（总罢市 / 总罢业）
- Hari Hartal Se-Malaya（全马来亚大罢市日）
- dekolonisasi（非殖民化）
- kewarganegaraan（公民权）
- rakyat Raja（王属子民）
- rakyat British（英籍臣民）
- naturalised（归化人士）
- Raja Berperlembagaan（君主立宪君主）
- Bahasa Melayu（马来语）
- bahasa Inggeris（英语）
- kedudukan istimewa orang Melayu（马来人特殊地位）
- kepentingan sah kaum lain（其他族群的合法权益）

#### Tempat / entiti yang baik dikekalkan dengan bantuan Cina
- Tanah Melayu（马来亚）
- Singapura（新加坡）
- Negeri-negeri Selat（海峡殖民地）
- Melaka（马六甲）
- Pulau Pinang（槟城）
- Kuala Lumpur（吉隆坡）
- Kuala Kangsar（瓜拉江沙）
- Pulau Pinang（槟城）
- Britain（英国）
- Amerika Syarikat（美国）

#### Karya / judul / buku / akhbar
- Suara Rakyat（《人民之声》）
- Testament Politik API（《API政治遗嘱》）

### 13.3 Apa yang tiada masalah untuk translate terus

Ini boleh diterjemah terus kerana teks BM asal sudah ada di atas.

#### Konsep umum
- latar belakang penubuhan
- faktor penubuhan
- ciri-ciri utama
- kesan penubuhan
- kedudukan orang Melayu
- hubungan antara kaum
- kerjasama kaum
- kemerdekaan
- cadangan alternatif
- pentadbiran
- perundangan
- kuasa eksekutif
- kewarganegaraan secara pendaftaran
- kewarganegaraan secara kuat kuasa undang-undang
- kepentingan bersama
- syarat kewarganegaraan
- taraf naungan
- tanah jajahan
- kehakiman
- ketenteraman awam
- perdagangan
- komunikasi
- percukaian
- tingkah laku yang baik
- rekod jenayah
- taat setia
- kebebasan hak bersuara
- kebebasan berhimpun
- kebebasan menerbitkan akhbar
- pembelaan terhadap ketidakadilan
- prinsip
- falsafah perjuangan
- penyatuan
- kerajaan pusat yang kuat
- bendera kebangsaan
- lagu kebangsaan
- adat istiadat
- agama Islam
- tempat tinggal tetap
- kesetiaan tanpa berbelah bahagi
- perlindungan hak
- kestabilan politik
- kemajuan ekonomi
- perubahan pentadbiran
- tolak ansur antara kaum
- pembinaan negara
- penduduk asal
- ruang kewarganegaraan
- masyarakat yang lebih tersusun
- asas kerjasama politik
- asas kepada kemerdekaan

#### Frasa / huraian biasa
- diperkenalkan untuk menggantikan sistem lama
- ditolak oleh penduduk tempatan
- dibentuk untuk merangka asas perjanjian
- menolak proses perundingan yang tertutup
- dianggap tidak demokratik
- dilihat mengukuhkan British
- bersifat perkauman
- menjadi asas penting
- membebaskan tanah air daripada penjajahan
- menyatukan seluruh Tanah Melayu
- enggan berkompromi dengan penjajah
- memperjuangkan hak semua kaum
- membuka minda rakyat ke arah idea bebas dan merdeka
- membangkitkan perasaan anti-British
- berhadapan dengan pelbagai bentuk penindasan
- mengemukakan cadangan balas
- mewujudkan keamanan
- memulihkan ekonomi selepas perang
- meyakinkan British
- menjaga kedudukan dan kedaulatan
- memperketatkan syarat kewarganegaraan
- mengiktiraf hak penduduk asal
- memupuk persefahaman
- mewujudkan asas kerjasama politik
- merintis jalan kepada pembentukan perlembagaan
- mencapai kestabilan negara
- menggagalkan rancangan British
- mempertahankan maruah bangsa
- membentuk asas negara yang lebih stabil

#### Perkara yang boleh terus diterjemah dalam senarai isi
- kerajaan pusat
- kerajaan negeri
- ahli rasmi
- ahli tidak rasmi
- wakil British
- wakil UMNO
- wakil Raja-raja Melayu
- hal ehwal luar
- pertahanan
- hal kewangan
- keamanan
- kestabilan
- pelabur luar
- politik yang lebih stabil
- kemajuan politik dan ekonomi orang Melayu
- merah dan putih sebagai latar bendera
- menutup kedai
- memberhentikan kegiatan ekonomi
- kilang
- kedai
- sekolah
- pejabat
- ladang

## 14) Panduan terjemahan Bab 6 (Mod Bahasa Cina)

Panduan ini khusus untuk **Bab 6** dan melengkapkan panduan Bab 1 hingga Bab 5. Gunakan senarai ini sebagai rujukan utama semasa terjemahan/semakan ZH berkaitan ancaman komunis dan zaman darurat.

### 14.1 Apa yang langsung tak sesuai translate

Kekal seperti asal.

#### Jenama / platform
- HazimEdu

#### Nama bab / subtopik rasmi
- Ancaman Komunis dan Perisytiharan Darurat
- Kemasukan Pengaruh Komunis di Negara Kita
- Ancaman Komunis di Negara Kita
- Usaha Menangani Ancaman Komunis
- Kesan Zaman Darurat terhadap Negara Kita

#### Nama pertubuhan / parti / pasukan / badan / gerakan
- Parti Komunis Malaya (PKM)
- Parti Kuomintang (KMT)
- Parti Komunis China (PKC)
- Communist International (Comintern)
- Parti Komunis Nanyang (PKN)
- Main School
- Partai Komunis Indonesia (PKI)
- Malayan People’s Anti-Japanese Army (MPAJA)
- Bintang Tiga
- Pan-Malayan Federation of Trade Unions (PMFTU)
- PKMM
- MDU
- PUTERA-AMCJA
- Cawangan Khas (Special Branch)
- Special Constables (SC)
- Flying Squad
- Jungle Squad
- Jungle Companies
- Police Field Force (PFF)
- Pasukan Polis Hutan
- Senoi Praaq
- Auxiliary Police (AP)
- Police Volunteer Reserve
- Pasukan Askar Melayu
- Rejimen Askar Melayu
- Pasukan Askar Komanwel
- Sarawak Rangers
- Home Guard
- Radio Malaya
- Jabatan Penerangan
- Jawatankuasa Eksekutif Pusat PKM
- Jawatankuasa Hubungan Antara Kaum (CLC)
- Malayan Chinese Association (MCA)
- Parti Perikatan (UMNO–MCA–MIC)

#### Nama rancangan / operasi / kempen / polisi / rundingan / ordinan
- Trade Union Ordinance No. 9 of 1948
- Undang-Undang Darurat
- Rancangan Briggs
- Kempen Bulan Rakyat Melawan Penjahat
- Rundingan Baling
- Kawasan Hitam
- Kawasan Putih
- Kampung Baru

#### Nama tokoh / individu
- Karl Marx
- Friedrich Engels
- Tan Malaka
- Alimin
- Moeso
- Boedisoejitro
- Hasanoesi
- Winanta
- Soebakat
- Sutan Perpateh
- Arthur Walker
- John Allison
- Ian Cristian
- Sir Edward Gent
- Sir Henry Gurney
- Guy C. Madoc
- Barbara D.R. Wentworth
- Pesan Apot a/k Saad
- Big Nose
- Sir Gerald Templer
- Leftenan Jeneral Sir Harold Rowdon Briggs
- Chin Peng
- Tan Cheng Lock
- David Marshall
- Chen Tien
- Rashid Maidin
- Ahmad Boestamam
- Ishak Haji Muhammad
- Abu Bakar al-Baqir
- Khatijah Sidek

#### Nama karya / judul / istilah berjudul
- Communist Manifesto
- Das Kapital

#### Nama tempat / negeri / lokasi khas
- China
- Indonesia
- Moscow
- Muar
- Melaka
- Seremban
- Klang
- Kuala Lumpur
- Sungai Petani
- Seberang Perai
- Pulau Pinang
- Perak Utara
- Kedah
- Pulau Jawa
- Tanah Melayu
- Kuala Pilah, Negeri Sembilan
- Negeri Sembilan
- Sungai Siput, Perak
- Sungai Siput
- Perak
- Johor
- Ipoh
- Kluang
- Kulai
- Plentong
- Calcutta, India
- India
- Ladang Ephil
- Ladang Phin Soon
- Sheum Circus, Kampar, Perak
- Kampar
- Jalan Kuala Kubu Bharu
- Bukit Fraser
- Choh, Johor
- Balai Polis Kampung Jeram
- Temerloh, Pahang
- Balai Polis Kuala Krau
- Jerantut, Pahang
- Gua Musang, Kelantan
- Balai Polis Gua Musang
- Kajang, Selangor
- Muar, Johor
- Balai Polis Bukit Kepong
- Ulu Semur, Kelantan
- Kota Tinggi, Johor
- Balai Polis Kambau
- Taiping, Perak
- Pontian, Johor
- Balai Polis Chuan Seng
- Labis, Johor
- Tanjung Malim
- Melaka
- Terengganu
- Perlis
- Sekolah Inggeris, Baling, Kedah, Tanah Melayu
- Baling, Kedah
- Britain
- Australia
- New Zealand
- Afrika Timur
- Kenya
- Uganda
- Rhodesia
- Fiji

#### Nama etnik / kelompok khas / istilah komuniti tertentu
- Hailam
- Orang Asli
- Senoi
- Semai
- Temuan
- orang Iban
- Gurkha

#### Istilah khas / label khas / panggilan
- komunisme
- Republik Komunis
- zaman darurat
- kekosongan politik
- The Silent Killers
- Urang Perang
- Agi Idup Agi Ngelaban

### 14.2 Apa yang sesuai translate sebagai kefahaman dengan dikekalkan bahasa asal

**Format cadangan:** `asal（中文）`.

#### Fahaman / istilah teras
- komunisme（共产主义）
- komunis（共产党人 / 共产主义者）
- Republik Komunis（共产主义共和国）
- zaman darurat（紧急状态时期）
- darurat（紧急状态）
- kekosongan politik（政治真空）
- sosioekonomi（社会经济）
- perang saraf（心理战）
- pengampunan（大赦 / 赦免）
- perintah berkurung（宵禁）
- undang-undang darurat（紧急法令）

#### Parti / pasukan / badan yang baik dibantu dengan gloss Cina
- Parti Komunis Malaya (PKM)（马来亚共产党）
- Parti Kuomintang (KMT)（国民党）
- Parti Komunis China (PKC)（中国共产党）
- Communist International (Comintern)（共产国际）
- Parti Komunis Nanyang (PKN)（南洋共产党）
- Malayan People’s Anti-Japanese Army (MPAJA)（马来亚人民抗日军）
- Bintang Tiga（三星组织 / 三星抗日军）
- Pan-Malayan Federation of Trade Unions (PMFTU)（全马工会联合会）
- Cawangan Khas (Special Branch)（特别调查组 / 特别警察情报组）
- Special Constables (SC)（特别警员）
- Police Field Force (PFF)（警察野战部队）
- Senoi Praaq（塞诺依突击队）
- Auxiliary Police (AP)（辅助警察）
- Police Volunteer Reserve（警察志愿后备队）
- Home Guard（乡村保卫队 / 家园卫队）
- Sarawak Rangers（砂拉越游骑兵）
- Malayan Chinese Association (MCA)（马华公会）
- Parti Perikatan (UMNO–MCA–MIC)（联盟党）
- Jawatankuasa Hubungan Antara Kaum (CLC)（族群联络委员会）

#### Rancangan / polisi / rundingan / kempen
- Rancangan Briggs（布里格斯计划）
- Rundingan Baling（华玲和谈）
- Trade Union Ordinance No. 9 of 1948（1948年第9号工会条例）
- Kempen Bulan Rakyat Melawan Penjahat（全民抗匪月）
- Kawasan Hitam（黑区）
- Kawasan Putih（白区）
- Kampung Baru（新村）

#### Karya / slogan / istilah khas
- Communist Manifesto（《共产党宣言》）
- Das Kapital（《资本论》）
- Agi Idup Agi Ngelaban（只要活着就战斗）
- Urang Perang（战士）
- The Silent Killers（无声杀手）

#### Tempat / entiti yang elok dibantu dengan gloss
- Tanah Melayu（马来亚）
- China（中国）
- Indonesia（印度尼西亚）
- Moscow（莫斯科）
- Calcutta, India（印度加尔各答）
- Pulau Jawa（爪哇岛）
- Kuala Lumpur（吉隆坡）
- Pulau Pinang（槟城）
- Sungai Siput, Perak（霹雳双溪实必）
- Kuala Pilah, Negeri Sembilan（森美兰瓜拉庇劳）
- Baling, Kedah（吉打华玲）
- Tanjung Malim（丹绒马林）
- Bukit Fraser（福隆港）
- Gua Musang, Kelantan（吉兰丹话望生）

#### Etnik / kelompok
- Orang Asli（原住民）
- Hailam（海南人）
- Iban（伊班族）
- Senoi（塞诺依族）
- Semai（塞迈族）
- Temuan（特姆安族）
- Gurkha（廓尔喀兵）

### 14.3 Apa yang tiada masalah untuk translate terus

Ini boleh diterjemah terus kerana teks asal BM sudah ada di atas.

#### Konsep umum
- ancaman komunis
- perisytiharan darurat
- usaha menangani ancaman
- kesan zaman darurat
- keselamatan rakyat
- pasukan keselamatan
- infrastruktur
- ekonomi
- politik
- sosial
- rundingan kemerdekaan
- ideologi
- barang pengguna
- milik negara
- perjuangan bersenjata
- menubuhkan kerajaan
- melumpuhkan ekonomi
- merosakkan infrastruktur
- mengancam keselamatan rakyat
- mengancam pasukan keselamatan
- menimbulkan huru-hara
- menimbulkan ketakutan
- menghilangkan keyakinan rakyat
- penguatkuasaan undang-undang
- pemerkasaan pasukan keselamatan
- pendaftaran kebangsaan
- kad pengenalan
- tawaran pengampunan
- kempen rakyat
- memenangi hati rakyat
- mempengaruhi fikiran rakyat
- lawatan
- melonggarkan syarat kewarganegaraan
- hadiah wang tunai
- memenangi kepercayaan
- perkhidmatan penerangan
- penamatan darurat
- kos perbelanjaan
- penderitaan rakyat
- kesengsaraan
- hubungan kaum
- korban nyawa
- semangat mempertahankan negara

#### Frasa / huraian biasa
- mula masuk ke negara kita
- menyebarkan pengaruh
- mengukuhkan pengaruh
- menyusup ke dalam pertubuhan
- bekerjasama dengan British
- menentang Jepun
- menerima bantuan
- keluar dari hutan
- melakukan kekacauan
- membunuh orang yang dituduh bersubahat
- dibubarkan
- dibenarkan bergerak secara sah
- menyebarkan ideologi
- mempengaruhi pertubuhan lain
- meluluskan ordinan
- mengharamkan parti
- menahan tanpa perbicaraan
- mengenakan hukuman berat
- mengetatkan undang-undang senjata api
- menggeledah rumah
- memagar kampung
- memindahkan penduduk
- menjalankan risikan
- menyamar untuk mendapatkan maklumat
- mengawal ladang dan lombong
- memburu komunis
- menjaga kubu
- melatih anggota wanita
- mengesan tempat persembunyian
- mempertahankan bandar dan kampung
- membantu menentang ancaman
- membanteras gerila dalam hutan
- memusnahkan kubu operasi
- menjejak persembunyian komunis
- mengawal pergerakan penduduk
- membezakan orang awam dengan komunis
- memutuskan hubungan
- membekalkan makanan, maklumat dan ubat-ubatan
- melakukan propaganda
- merekrut ahli baharu
- dipaksa berpindah
- dilengkapi dengan kemudahan asas
- dipagari dengan kawat berduri
- menyebarkan syarat pengampunan
- memujuk supaya menyerah diri
- mendaftarkan diri secara sukarela
- mengeratkan hubungan masyarakat
- melarang keluar rumah
- membolehkan operasi lebih berkesan
- mendampingi rakyat
- mengadakan lawatan
- menubuhkan pusat komuniti
- menarik kaum bukan Melayu menjadi rakyat
- menggalakkan penyertaan dalam politik
- mendapatkan sokongan mereka
- menubuhkan kubu
- mendapatkan sokongan penduduk tempatan
- menimbulkan kesedaran
- memperkenalkan kawasan hitam dan putih
- membubarkan parti
- meletakkan senjata
- menyerah diri
- mengiktiraf sebagai parti politik yang sah
- rundingan gagal
- meningkatkan jumlah warganegara
- mempercepat kemerdekaan
- meningkatkan kos perbelanjaan
- mengganggu kegiatan ekonomi
- harga barang melambung tinggi
- peras ugut
- kesukaran memperoleh bekalan
- mematuhi pelbagai peraturan kerajaan
- catuan makanan
- merenggangkan hubungan kaum
- hidup secara terpisah
- kawalan ketat
- hidup dalam ketakutan
- membawa penderitaan besar
- berakhir selepas 12 tahun

#### Isi yang boleh diterjemah terus dalam bentuk senarai
- pengangkutan
- perhubungan
- lombong bijih timah
- ladang getah
- kilang estet
- rumah asap
- rumah kongsi
- kedai
- sekolah
- telefon dan telegraf
- paip air
- sistem pengairan
- skim hidroelektrik
- ancaman terhadap orang awam
- ancaman terhadap polis
- ancaman terhadap tentera
- bantuan kewangan
- bantuan logistik
- bantuan perubatan
- hadiah tangkapan
- lawatan ke sekolah, kampung dan hospital
- bekalan elektrik
- air paip
- rumah ibadat
- jawatankuasa kampung
- kutipan derma
- loteri kebajikan
- pengeluaran tanaman padi
- makanan harian
- ubi kayu
- keledek
- jagung

## 15) Panduan terjemahan Bab 7 (Mod Bahasa Cina)

Panduan ini khusus untuk **Bab 7** dan melengkapkan panduan Bab 1 hingga Bab 6. Gunakan senarai ini sebagai rujukan utama semasa terjemahan/semakan ZH berkaitan usaha ke arah kemerdekaan.

### 15.1 Apa yang langsung tak sesuai translate

Kekal seperti asal.

#### Jenama / platform
- HazimEdu

#### Nama bab / subtopik rasmi
- Usaha ke Arah Kemerdekaan
- Latar Belakang Idea Negara Merdeka
- Jawatankuasa Hubungan Antara Kaum
- Sistem Ahli
- Sistem Pendidikan Kebangsaan
- Penubuhan Parti Politik

#### Nama pertubuhan / parti / jawatankuasa / sistem / agensi / badan
- Jawatankuasa Hubungan Antara Kaum
- Communities Liaison Committee (CLC)
- Sistem Ahli
- Kesatuan Melayu Muda (KMM)
- Kesatuan Rakyat Indonesia Semenanjung (KRIS)
- Parti Kebangsaan Melayu Malaya (PKMM)
- Angkatan Pemuda Insaf (API)
- Persatuan Kebangsaan Melayu Sarawak (PKMS)
- Pergerakan Pemuda Melayu (PPM)
- United Malays National Organisation (UMNO)
- Parti Kebangsaan Melayu Labuan (PKML)
- Malayan Indian Congress (MIC)
- Hizbul Muslimin
- Majlis Agama Islam Tertinggi (MATA)
- Malayan Chinese Association (MCA)
- Parti Islam Se-Tanah Melayu (PAS)
- Independence of Malayan Party (IMP)
- RIDA
- Lembaga Pembangunan Industri Desa (RIDA)
- Majlis Perundangan Persekutuan (MPP)
- Jabatan Pilihan Raya
- Jabatan Rupa Bangsa Nasional
- Parti Perikatan
- Pusat Tenaga Rakyat (PUTERA)
- All Malaya Council of Joint Action (AMCJA)
- Persatuan Ceylonese Malaya
- Persatuan Eurasian Malaya
- People’s Progressive Party (PPP)
- Parti Negara
- BARIP
- Barisan Pemuda Sarawak (BPS)
- Persetiaan Melayu Kelantan
- Persatuan Melayu Semenanjung

#### Nama laporan / ordinan / penyata / manifesto / dokumen
- Testament Politik API
- Perlembagaan 1941
- Laporan Barnes 1951
- Laporan Fenn-Wu 1951
- Ordinan Pelajaran 1952
- Laporan Woodhead 1955
- Ordinan Pelajaran Koloni 1956
- Penyata Jawatankuasa Pelajaran 1956
- Penyata Razak
- Manifesto Perlembagaan Rakyat

#### Nama tokoh / individu
- Ibrahim Haji Yaakob
- Dr. Burhanuddin al-Helmi
- Ishak Haji Muhammad
- Ahmad Boestamam
- Datu Patinggi Abang Haji Abdillah
- Dato’ Onn Jaafar
- Tunku Abdul Rahman
- Tengku Noordin
- Zakaria Gunn
- John Thivy
- Abu Bakar al-Baqir
- Sheikh Fadhlulah Suhaimi
- Sheikh Abdullah Fahim
- Tan Cheng Lock
- Haji Ahmad Fuad Hassan
- Malcolm MacDonald
- E.E.C. Thuraisingham
- Dato’ Abdul Wahab Abdul Aziz
- Dato’ Panglima Bukit Gantang
- Mohd. Salleh Hakim
- Dr. Mustapha Osman
- Zainal Abidin Haji Abas
- Lee Tiang Keng
- C.C. Tan
- Yong Shook Lin
- Roland Braddell
- L.R. Doraisamy Iyer
- Dr. J.S. Goonting
- Sir Henry Gurney
- Tunku Yaacob ibni Almarhum Sultan Abdul Hamid Halim Shah
- Dato’ Mahmud Mat
- Dato’ Nik Ahmad Kamil
- H.S. Lee
- Dr. Ismail Abdul Rahman
- L.J. Barnes
- Dr. William P. Fenn
- Dr. Wu Teh Yao
- E.W. Woodhead
- Dato’ Abdul Razak Hussein
- Abang Haji Zaini
- Abang Haji Openg
- Mohamad Sirat Yaman
- Awang Rambli
- Rosli Dhoby
- Morshidi Sidek
- K.L. Devasar
- Mandur Syarif
- Imam Suhaili Yaakub
- Pengiran Ahmad
- Abang Mohd. Kassim Taha
- Ahmad Zaidi Adruce
- Dr. S. Kanapathippilai
- D.R. Seenivasagam
- Dato’ Hamzah Abdullah
- Heah Joo Seang
- P. Ramani

#### Nama tempat / negeri / wilayah khusus
- Tanah Melayu
- Sarawak
- Sabah
- Sibu
- Maahad al-Ehya Assharif, Gunung Semanggol, Perak
- Gunung Semanggol
- Perak
- Melaka
- Pulau Pinang
- Singapura
- Selangor
- Johor
- Jesselton
- Labuan
- Britain
- China
- Sarawak
- Sabah
- Negeri-negeri Selat

#### Nama slogan / label khas / istilah berjudul
- Melayu Raya
- “Merdeka”
- “Merdeka dengan Darah”
- “Hidup Melayu”
- “Hidup Melayu-Merdeka”
- “Tanah Melayu untuk Malayan”
- “Kesamaan dan Keadilan untuk Penduduk Tanah Melayu”

#### Nama kategori sekolah / struktur rasmi yang lebih baik kekal
- Sekolah Umum
- Sekolah Jenis Umum
- Sekolah Menengah Kebangsaan

### 15.2 Apa yang sesuai translate sebagai kefahaman dengan dikekalkan bahasa asal

**Format cadangan:** `asal（中文）`.

#### Istilah teras Bab 7
- negara merdeka（独立国家）
- berdaulat（主权独立）
- berkerajaan sendiri（自治）
- perpaduan rakyat berbilang kaum（多元族群团结）
- perpaduan antara kaum（族群团结）
- demokrasi（民主）
- negara Islam（伊斯兰国家）
- identiti kebangsaan（国家认同）
- pendidikan kebangsaan（国民教育）
- kerjasama politik antara kaum（跨族群政治合作）
- nasionalisme（民族主义）
- kestabilan（稳定）
- tolak ansur（互相让步）
- persefahaman（相互理解）
- muafakat（协商共识）
- toleransi（宽容）
- dekolonisasi（非殖民化）

#### Pertubuhan / sistem / badan yang baik dibantu dengan gloss Cina
- Jawatankuasa Hubungan Antara Kaum（族群联络委员会）
- Communities Liaison Committee (CLC)（族群联络委员会）
- Sistem Ahli（成员制行政制度）
- Kesatuan Melayu Muda (KMM)（马来青年联盟）
- Kesatuan Rakyat Indonesia Semenanjung (KRIS)（半岛印尼人民联盟）
- Parti Kebangsaan Melayu Malaya (PKMM)（马来亚马来民族党）
- Angkatan Pemuda Insaf (API)（觉醒青年团）
- Persatuan Kebangsaan Melayu Sarawak (PKMS)（砂拉越马来民族协会）
- Pergerakan Pemuda Melayu (PPM)（马来青年运动）
- United Malays National Organisation (UMNO)（巫统）
- Parti Kebangsaan Melayu Labuan (PKML)（纳闽马来民族党）
- Malayan Indian Congress (MIC)（马来亚印度人国大党）
- Hizbul Muslimin（穆斯林阵线）
- Majlis Agama Islam Tertinggi (MATA)（最高伊斯兰宗教理事会）
- Malayan Chinese Association (MCA)（马华公会）
- Parti Islam Se-Tanah Melayu (PAS)（泛马伊斯兰党）
- Independence of Malayan Party (IMP)（马来亚独立党）
- Parti Perikatan（联盟党）
- Pusat Tenaga Rakyat (PUTERA)（人民力量中心）
- All Malaya Council of Joint Action (AMCJA)（全马联合行动理事会）
- People’s Progressive Party (PPP)（人民进步党）
- Parti Negara（国家党）
- BARIP（青年阵线）
- Barisan Pemuda Sarawak (BPS)（砂拉越青年阵线）
- RIDA（乡村与工业发展局）

#### Dokumen / laporan / ordinan / penyata
- Testament Politik API（《API政治遗嘱》）
- Perlembagaan 1941（1941年宪法）
- Laporan Barnes 1951（1951年巴恩斯报告）
- Laporan Fenn-Wu 1951（1951年芬吴报告）
- Ordinan Pelajaran 1952（1952年教育法令）
- Laporan Woodhead 1955（1955年伍德黑德报告）
- Ordinan Pelajaran Koloni 1956（1956年殖民地教育法令）
- Penyata Jawatankuasa Pelajaran 1956（1956年教育委员会报告）
- Penyata Razak（拉扎克报告）
- Manifesto Perlembagaan Rakyat（人民宪章宣言）

#### Slogan / istilah khas
- Melayu Raya（大马来概念）
- “Merdeka” （独立）
- “Merdeka dengan Darah” （以鲜血争取独立）
- “Hidup Melayu” （马来民族万岁）
- “Hidup Melayu-Merdeka” （马来民族独立万岁）
- “Tanah Melayu untuk Malayan” （马来亚属于马来亚人）
- “Kesamaan dan Keadilan untuk Penduduk Tanah Melayu” （马来亚居民的平等与公正）

#### Tempat / entiti yang baik dikekalkan dengan bantuan Cina
- Tanah Melayu（马来亚）
- Sarawak（砂拉越）
- Sabah（沙巴）
- Sibu（诗巫）
- Gunung Semanggol（武吉森芒莪）
- Melaka（马六甲）
- Pulau Pinang（槟城）
- Singapura（新加坡）
- Jesselton（亚庇旧称杰瑟顿）
- Labuan（纳闽）
- Negeri-negeri Selat（海峡殖民地）

#### Kategori sekolah / struktur pendidikan
- sekolah vernakular Melayu（马来文源流学校）
- sekolah vernakular Cina（华文源流学校）
- sekolah vernakular Tamil（淡米尔文源流学校）
- sekolah aliran agama（宗教学校）
- sekolah Inggeris（英文学校）
- sekolah mubaligh Kristian（基督教传教士学校）
- Sekolah Umum（国民小学）
- Sekolah Jenis Umum（国民型小学）
- Sekolah Menengah Kebangsaan（国民中学）

### 15.3 Apa yang tiada masalah untuk translate terus

Ini boleh diterjemah terus kerana teks BM asal sudah ada di atas.

#### Konsep umum
- usaha ke arah kemerdekaan
- idea negara merdeka
- kesedaran politik
- perkembangan politik antarabangsa
- perkembangan politik serantau
- organisasi politik
- perjuangan kemerdekaan
- pendekatan berbeza
- matlamat yang sama
- kerjasama antara kaum
- berkerajaan sendiri
- latihan pentadbiran
- perpaduan kaum
- sistem pendidikan yang seragam
- identiti bangsa
- taat setia kepada tanah air
- jurang ekonomi dan sosial
- keadilan sosial
- dasar ekonomi yang mengutamakan rakyat
- satu bangsa yang teguh
- bahasa kebangsaan
- bahasa rasmi yang tunggal
- hak politik
- kepentingan bersama
- hala tuju bersama
- kesamaan dan keadilan
- kedudukan istimewa orang Melayu
- kepentingan sah kaum lain
- pengalaman pilihan raya
- kedudukan ekonomi orang Melayu
- kewarganegaraan bukan Melayu
- pendidikan kebangsaan
- semangat perpaduan
- integrasi
- nilai kewarganegaraan
- identiti sepunya
- kesetiaan kepada negara
- kestabilan negara
- keharmonian masyarakat
- permuafakatan
- kesederhanaan dalam perjuangan
- parti pelbagai kaum
- parti bercorak kebangsaan

#### Frasa / huraian biasa
- mencetuskan aspirasi rakyat
- membawa ideologi masing-masing
- menanam semangat kebangsaan
- bekerjasama dengan kaum lain
- mendaulatkan hak rakyat
- menekankan pemerintahan demokrasi
- menentang penyerahan negeri kepada British
- rela berkorban jiwa
- menuntut kemerdekaan penuh
- menyatukan orang Melayu
- mempertahankan hak bangsa
- mempertahankan kedudukan Raja-raja Melayu
- menentang Malayan Union
- menjalankan dasar tidak bekerjasama dengan penjajah
- menjaga kepentingan masyarakat
- menerima Tanah Melayu sebagai tanah air
- melafazkan taat setia
- mencadangkan sistem pendidikan yang seragam
- membina satu rupa bangsa penduduk
- menjadikan tempat tinggal kekal
- mengkaji pendidikan Cina
- mencadangkan penambahbaikan
- menggunakan bahasa rasmi Persekutuan
- menyatukan semua murid pelbagai kaum
- menyeragamkan sukatan pelajaran
- menyeragamkan peperiksaan
- menitikberatkan bahasa Inggeris
- mempertingkat pengajaran bahasa
- membina perasaan kekitaan
- memupuk perpaduan
- melahirkan generasi muda yang bersatu
- melatih penduduk tempatan menerajui pentadbiran
- memberi pendedahan mentadbir kerajaan
- kabinet bayangan
- menyediakan asas penting
- memupuk sokongan seluruh penduduk
- membincangkan langkah pembentukan gabungan parti
- mendesak pilihan raya Persekutuan
- memilih logo kapal layar
- melambangkan kesediaan menempuh cabaran
- membuka jalan kepada kerjasama politik yang lebih luas
- membina negara yang stabil serta berdaulat

#### Isi yang boleh diterjemah terus dalam bentuk senarai
- persamaan daerah
- persamaan darah
- persamaan kebudayaan
- persamaan bahasa
- politik
- ekonomi
- agama
- sosial
- kebudayaan
- satu kewarganegaraan
- sistem persekolahan yang sama
- bahasa pengantar utama
- kandungan kurikulum yang seragam
- sekolah rendah
- sekolah menengah
- peperiksaan
- sukatan pelajaran
- buku teks berlatarbelakangkan unsur tempatan
- pendidikan sivik
- pembangunan industri desa
- hal ehwal dalam negeri
- kesihatan
- pertanian dan perhutanan
- tanah, lombong dan perhubungan
- kerajaan tempatan
- perancang bandar
- pengangkutan
- hasil bumi
- penyiaran dan pencetakan
- hubungan negeri Melayu dengan Negeri-negeri Selat
- hal ehwal menunaikan haji
- pendaftaran kerakyatan
- perkahwinan
- kematian
- pilihan raya majlis bandaran
- pilihan raya majlis negeri
- pilihan raya majlis perundangan
- semangat nasionalisme
- kemajuan politik
- kemajuan sosial
- keadilan sosioekonomi
- demokrasi berparlimen

## 16) Guardrail fleksibel (elak terjemahan terlalu rigid)

Untuk memastikan Mod Bahasa Cina tidak terlalu kaku apabila berdepan istilah baharu yang belum tersenarai, ikut kaedah keputusan berikut.

### 16.1 Prinsip umum
- Senarai Bab 1–Bab 7 ialah **rujukan utama**, bukan had mutlak.
- Jika istilah tiada dalam senarai, reviewer/translator perlu guna **corak kategori sedia ada** (kekal asal, `asal（中文）`, atau terjemah terus).
- Keutamaan sentiasa pada **ketepatan makna sejarah**, bukan terjemahan literal.

### 16.2 Kaedah keputusan untuk istilah yang tidak tersenarai
1. **Kenal pasti jenis istilah**:
   - Nama khas (tokoh, tempat, institusi, undang-undang, operasi, dokumen, slogan rasmi).
   - Istilah konsep (politik, pentadbiran, sosial, ekonomi, budaya).
   - Frasa huraian umum.
2. **Padankan ikut corak terdekat** dalam bab berkaitan:
   - Jika serupa nama khas rasmi → biasanya **kekal asal**.
   - Jika istilah penting peperiksaan tetapi perlukan bantuan kefahaman → guna **`asal（中文）`**.
   - Jika frasa deskriptif umum tanpa risiko ubah fakta → **boleh terjemah terus**.
3. **Semak konteks ayat penuh**:
   - Elak memilih padanan hanya berdasarkan satu perkataan.
   - Pastikan hubungan sebab-akibat dan peranan aktor sejarah kekal tepat.

### 16.3 Peraturan fallback pantas
- Jika ragu antara “kekal asal” vs “terjemah terus”, pilih lebih selamat:
  **kekal asal + gloss `asal（中文）`**.
- Jika istilah muncul berulang dalam unit sama, kekalkan padanan yang sama untuk konsistensi.
- Jika masih tidak pasti, tanda untuk semakan reviewer sejarah sebelum dimuktamadkan.

### 16.4 Contoh penerapan corak
- Nama organisasi baharu yang serupa gaya dengan senarai rasmi: kekal nama asal, tambah gloss Cina bila perlu.
- Frasa tindakan umum (contoh bentuk “meningkatkan…”, “memupuk…”, “menubuhkan…”) boleh diterjemah terus selagi maksud tidak tersasar.
- Istilah ideologi/konsep sensitif: utamakan format `asal（中文）` supaya istilah BM kekal untuk rujukan peperiksaan.
