# Panduan Ringkas Mod Bahasa Cina (ZH) – Terjemahan Manual

Mod paparan **tidak lagi** memanggil Google Translate. Semua ayat penuh datang daripada medan `translate` dalam `data/zh-units/*.json` (selepas `normalizeZhExplain` dalam `zh-mode.js`). Skrip bantu:

```bash
python3 scripts/enrich-zh-unit-translations.py data/zh-units/bab-X.json
```

Skrip ini membungkus label pendek sebagai `释义：…（原文：…）` supaya semakan kualiti minimum (≥4 aksara Cina) dipenuhi; kemudian editor boleh menggantinya dengan ayat Cina penuh yang lebih lancar.

**Jana semula ayat penuh daripada `bm_original` (contoh Bab 3):** skrip berasingan memanggil API terjemahan luar talian semasa penyuntingan repo (bukan semasa mod paparan pelajar):

```bash
pip install deep-translator   # sekali sahaja
python3 scripts/regen-bab3-zh-translates.py          # Bab 3 sahaja (wrapper)
python3 scripts/regen-zh-bab-translates.py --bab 4   # Bab 4
python3 scripts/regen-zh-bab-translates.py --bab 5   # Bab 5
```

Hasilnya perlu **disemak manusia** untuk nama khas (Sultan, jawatan, ejaan rasmi) supaya selari dengan nota BM.

## Pengharaman Terjemahan (Wajib)
Dalam teks Cina yang disunting, kategori berikut **hendaklah dikekalkan** dalam bentuk asal (BM / ejaan asal), dan jika perlu boleh diringi ringkasan Cina dalam kurungan:

1. **Nama orang** *(termasuk nama Sultan dan gelaran Sultan)*
2. **Nama organisasi rasmi**
3. **Singkatan organisasi rasmi**
4. **Perkataan bahasa Inggeris**
5. **Perkataan bahasa Arab**
6. **Istilah khusus bukan perkataan asal bahasa Cina**
   - Contoh: **waadat, styagraha, bushido, jus soli**

## Peraturan Umum
- Selain kategori di atas, baki kandungan boleh diterjemahkan ke Cina Ringkas yang mudah difahami pelajar Malaysia; elakkan campuran tatabahasa BM + partikel Cina (“的/在/由” selepas perkataan BM penuh).

## Contoh Perkataan Bab 1 hingga Bab 7 yang Langsung Tak Boleh Translate

### Bab 1
- Warisan Negara Bangsa
- Kesultanan Melayu Melaka
- Laksamana Cheng Ho
- Sultan Mansur Shah
- Bendahara Tun Perak
- waadat

### Bab 2
- Kebangkitan Nasionalisme
- Dato’ Onn Jaafar
- Dr. Burhanuddin al-Helmi
- UMNO
- PKMM
- satyagraha / styagraha

### Bab 3
- Konflik Dunia dan Pendudukan Jepun di Negara Kita
- Archduke Ferdinand
- Adolf Hitler
- Leftenan Adnan Saidi
- MPAJA
- bushido

### Bab 4
- Era Peralihan Kuasa British di Negara Kita
- British Military Administration
- Malayan Union
- Sir Harold MacMichael
- Sultan Hisamuddin Alam Shah
- Yang di-Pertuan Besar Tuanku Abdul Rahman

### Bab 5
- Persekutuan Tanah Melayu 1948
- Perjanjian Persekutuan Tanah Melayu 1948
- PUTERA-AMCJA
- API
- AWAS
- Piagam Atlantik

### Bab 6
- Ancaman Komunis dan Perisytiharan Darurat
- Parti Komunis Malaya (PKM)
- Communist International (Comintern)
- Special Branch
- Police Field Force (PFF)
- Senoi Praaq

### Bab 7
- Usaha ke Arah Kemerdekaan
- Communities Liaison Committee (CLC)
- Malayan Chinese Association (MCA)
- Parti Islam Se-Tanah Melayu (PAS)
- RIDA
- Parti Perikatan
