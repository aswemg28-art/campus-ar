# Test cases dan hasil

Pengujian lokal terakhir: **2026-11-25**. Build dibuat pada dua mode: base lokal dan subpath `/campus-ar/`.

| ID | Skenario | Kriteria berhasil | Status | Bukti / catatan |
|---|---|---|---|---|
| TC-01 | Aplikasi dibuka | UI tampil tanpa error fatal | Belum diuji di browser | Build produksi sukses; pemeriksaan browser masih diperlukan. |
| TC-02 | Izin kamera diberikan | Kamera dapat diakses dan AR dimulai | Belum diuji di perangkat | Kamera butuh HTTPS atau localhost; belum ada sesi fisik. |
| TC-03 | Wajah menghadap kamera | Face tracking mendeteksi wajah | Belum diuji di perangkat | Tidak mengklaim deteksi tanpa kamera/wajah nyata. |
| TC-04 | Kepala bergerak | Aksesori mengikuti pose | Belum diuji di perangkat | Anchor MindAR terhubung ke grup Three.js. |
| TC-05 | Filter toga | Model toga tampil pada posisi kepala | Belum diuji di perangkat | GLB dan anchor 10 lolos pemeriksaan struktur. |
| TC-06 | Filter kacamata | Model tampil pada area mata | Belum diuji di perangkat | GLB dan anchor 168 lolos pemeriksaan struktur. |
| TC-07 | Animasi | Animasi terus berjalan | Struktur terverifikasi; runtime belum diuji | GLB memuat klip `idle`; `AnimationMixer` memutarnya saat aktif. |
| TC-08 | Ganti filter berulang | Tidak menumpuk model | Struktur kode ditinjau; runtime belum diuji | Objek lama dilepas dan geometri/material dibersihkan. |
| TC-09 | Ambil foto | Foto memuat kamera + AR dan tersimpan lokal | Belum diuji di perangkat | Implementasi menggabungkan frame lokal menggunakan Canvas2D + WebGL. |
| TC-10 | Izin ditolak | Pesan dan langkah pemulihan tampil | Belum diuji di browser | Pemetaan `NotAllowedError` tersedia. |
| TC-11 | Model gagal dimuat | UI tetap berjalan dengan pesan error | Belum diuji di browser | Penolakan loader ditangani; shutter nonaktif tanpa aksesori aktif. |
| TC-12 | Muat ulang | Aplikasi dapat dimulai lagi | Belum diuji di browser | Preferensi filter tersimpan di localStorage. |
| TC-13 | GitHub Pages | Situs HTTPS dapat dibuka | Konfigurasi siap; belum dideploy | Workflow Actions tersedia; butuh repository dan aktivasi Pages. |
| TC-14 | Privasi | Tidak ada unggahan video/foto/wajah | Inspeksi source lokal | Tidak ada backend atau fetch/upload foto; model tracking dipaketkan bersama aplikasi. |
| BUILD-01 | Instalasi dependency | Dependency konsisten | Lulus | `npm ci`; Three.js 0.175.0, MindAR 1.2.5, Vite 6.4.6; `npm audit` melaporkan 0 kerentanan. |
| BUILD-02 | Asset check | GLB/anchor/animasi sah secara struktural | Lulus | `npm run check`. |
| BUILD-03 | Build produksi lokal | Bundler berhasil | Lulus | `GITHUB_PAGES=true npm run build`. Entrypoint ~589 KB dan chunk MindAR ~2.14 MB (total JS ~906 KB gzip); chunk MindAR baru diminta saat AR dimulai. |
| BUILD-04 | Jalur subpath Pages | Aset menggunakan base repo | Lulus | Build memakai base `/campus-ar/`; preview menyajikan halaman, chunk JS, dan kedua GLB pada URL subpath dengan HTTP 200. |
| BUILD-05 | Lint/typecheck | Jika tersedia | Tidak tersedia | Belum ada konfigurasi ESLint atau TypeScript dalam proyek. |
