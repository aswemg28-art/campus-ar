# Campus AR v0.5

Prototipe AR wajah bertema wisuda yang berjalan di browser modern. Tampilan kamera dan pelacakan MindAR berjalan di perangkat pengguna. Foto dirangkai dan diunduh sebagai PNG di browser; aplikasi tidak memiliki backend atau endpoint unggahan.

## Fitur

- Face tracking melalui MindAR Face Tracking 1.2.5 dan Three.js 0.175.0.
- Dua aksesori GLB ringan buatan khusus proyek: toga (dengan klip animasi `idle`) dan kacamata wisuda.
- Posisi filter berasal dari `src/data/filters.json`; indeks anchor resmi MindAR yang dipakai: `10` untuk topi dan `168` untuk kacamata.
- UI mobile-first, status kamera/wajah, izin ditolak dan langkah pemulihan, indikator loading, serta pilihan filter.
- Shutter membuat PNG lokal dari video kamera dan render WebGL; tombol unduh tidak mengirim gambar ke server. Foto tidak diarsipkan aplikasi.
- Filter terakhir disimpan di `localStorage` sebagai preferensi non-sensitif.
- Kamera depan aktif secara awal.

## Teknologi

Node.js 22+ disarankan, npm, Vite 6.4.6, Three.js 0.175.0, MindAR 1.2.5. MindAR 1.2.5 mensyaratkan Three.js 0.137+; rilis tersebut masih mengacu ke API warna lama. Plugin kecil dalam `vite.config.js` memetakan API itu ke `SRGBColorSpace` / `outputColorSpace` Three.js modern. MindAR dimuat saat pengguna memulai AR agar halaman awal dapat tampil sebelum model tracking diunduh. Npm overrides mengunci `tar` dan `@mapbox/node-pre-gyp` pada rilis perbaikan; audit dependency bersih.

## Instalasi dan jalankan

```sh
npm ci
npm run check
npm run dev
```

Buka URL Vite yang dicetak di terminal. Kamera memerlukan HTTPS atau `localhost`; izinkan kamera saat browser meminta. Untuk build lokal:

```sh
npm run build
npm run preview
```

`npm run check` memvalidasi versi dependency terkunci, signature dan struktur dasar GLB, klip animasi, serta konfigurasi anchor. Build Vite memvalidasi bundling modul dan aset.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` membangun dan menerbitkan saat ada push ke branch `main` atau pemicu manual. Workflow menggunakan URL subpath `/campus-ar/`, sesuai nama repository yang disarankan `campus-ar`.

1. Buat repository GitHub bernama `campus-ar`, lalu push isi folder proyek ini ke branch `main`.
2. Buka **Settings → Pages** dan pilih **GitHub Actions** sebagai build and deployment source.
3. Tunggu workflow **Deploy Campus AR to GitHub Pages** selesai. URL baru bisa dibagikan setelah langkah deploy sukses dan URL HTTPS dapat dibuka.
4. Jika repository memakai nama lain, ubah `base` pada `vite.config.js` agar sesuai nama repository sebelum push.

Deployment publik belum dilakukan dari workspace ini: folder yang tersedia bukan repository Git, dan belum memiliki remote GitHub. Tidak ada URL live atau QR deployment yang diklaim.

## Aset dan lisensi

`public/models/toga.glb` dan `public/models/glasses.glb` dibuat secara prosedural untuk proyek ini melalui `scripts/create-models.mjs`; keduanya bukan unduhan model pihak ketiga. Detail dan lisensi proyek dicatat dalam [docs/asset-licenses.md](docs/asset-licenses.md). Animasi `idle` adalah klip rotasi tassel yang ditanam di GLB toga dan dijalankan oleh `THREE.AnimationMixer`.

## Batasan dan privasi

- Uji kamera dan pelacakan harus dilakukan pada smartphone melalui HTTPS; belum diuji pada Android maupun iPhone.
- Perataan foto merender scene AR kedua kali pada resolusi kamera ke kanvas WebGL transparan ber-buffer tersimpan, lalu menggabungkannya ke frame kamera di Canvas 2D. Foto yang diunduh memakai orientasi selfie cermin. Perangkat dengan memori/GPU rendah bisa gagal saat render kedua; UI memberi umpan balik gagal.
- Paket model wajah MindAR membuat bundle awal AR relatif besar. Modul itu baru diunduh ketika pengguna memulai kamera.
- Pemrosesan wajah, tampilan kamera, dan komposit foto tetap di browser. Tidak ada backend, analitik, API key, atau unggahan file.
- Kesesuaian posisi aksesori untuk beragam wajah dan perangkat perlu dikalibrasi lewat uji fisik.

## Troubleshooting

- **Izin ditolak:** ketuk ikon izin di address bar atau buka pengaturan situs pada browser, setel kamera ke Izinkan, muat ulang, lalu pilih **Coba lagi**.
- **Kamera tidak tersedia:** gunakan HTTPS, browser versi terbaru, dan tutup aplikasi lain yang sedang memakai kamera.
- **Wajah tidak terdeteksi:** hadap kamera dengan cahaya cukup, lepas objek yang menutupi sebagian besar wajah, lalu tunggu status berubah.
- **Foto tidak terunduh:** izinkan unduhan di browser dan coba lagi; gambar hanya dibuat di perangkat.
- **Model gagal:** periksa koneksi saat asset modul dimuat pertama kali atau jalankan `npm run check`, kemudian muat ulang halaman.

## Panduan demo UTS (10 menit + 5 menit tanya jawab)

1. **0:00–1:00** Jelaskan ide dan buka tautan HTTPS di smartphone.
2. **1:00–2:00** Mulai studio, jelaskan izin kamera dan status pencarian wajah.
3. **2:00–4:00** Tunjukkan toga menempel saat kepala bergerak; amati tassel idle.
4. **4:00–6:00** Ganti kacamata dan kembali ke toga untuk memperlihatkan pergantian objek.
5. **6:00–7:00** Ambil foto, buka unduhan/galeri untuk memastikan file lokal tersedia.
6. **7:00–8:00** Tunjukkan alur pemulihan izin kamera di perangkat uji (batalkan izin lalu pulihkan).
7. **8:00–10:00** Jelaskan data filter JSON, anchor MindAR, loader GLB/animation mixer, kompatibilitas Three.js, dan batas privasi.
8. **10:00–15:00** Tanya jawab: bagaimana anchor mengikuti pose; cara kerja klip animasi; mengapa HTTPS dibutuhkan; di mana foto disimpan; apa yang belum diuji.

Rekam video demo 1–2 menit di smartphone setelah uji fisik; video belum direkam oleh workspace ini.
