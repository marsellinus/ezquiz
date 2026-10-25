# 🚀 Interactive Quiz & Random Picker Platform (Quizizz-Style Platform)

Aplikasi Web Edukasi Interaktif & Platform Kuis Serbaguna untuk Guru, Dosen, dan Author Soal. Platform ini memiliki **2 Mode Utama**:

1. **Mode 1: Interactive Live Quiz System (Quizizz-Style)**: Sesi kuis interaktif real-time menggunakan Kode Game, mendukung Multi-Kelas, Papan Skor (Leaderboard), Anti-Cheat Pindah Tab, Sensor Kata Kasar (Profanity Filter), Rekap Nilai Per Batch/Sesi, dan Export CSV Excel.
2. **Mode 2: Random Picker Soal**: Pengocok soal acak publik (`/p/[slug]`) dengan fitur Text-To-Speech (audio bacakan soal), mode proyektor fullscreen, dan sistem anti-repeat.

---

## 🌟 Fitur Unggulan

### 🎮 Mode 1: Interactive Live Quiz (Quizizz-Style)
- **Multi-Kelas & Rombel**: Peserta dapat memilih/mengisi kelas (`X IPA 1`, `XII MIPA 2`, dsb.), memudahkan rekapitulasi nilai per rombel.
- **Papan Skor Real-Time (Live Leaderboard)**: Mode kecepatan (*Dynamic Speed Bonus*) & poin tetap (*Fixed Point*).
- **Anti-Cheat Pindah Tab**: Deteksi otomatis ketika siswa berpindah tab/keluar aplikasi di HP. Jumlah pelanggaran tercatat khusus untuk laporan Guru.
- **Smart Profanity Filter**: Sensor otomatis untuk mencegah peserta iseng mendaftar menggunakan kata-kata kasar di layar proyektor.
- **1-Click Kick / Banned**: Guru dapat mengeluarkan peserta iseng langsung dari lobby Host Control dengan 1x klik (`✕ Kick`).
- **Control Play & Stop**: Kode Game dapat dibuka/ditutup secara langsung oleh Guru.
- **Rekapitulasi Nilai & Detail Jawaban**: Halaman analitik lengkap (`/author/quizzes/[id]/analytics`) untuk memfilter nilai per sesi/batch/kelas, melihat lembar jawaban per siswa, serta men-download file Excel (`.csv`).
- **Import & Export Template CSV**: Pembuatan kuis masal dengan 1x upload CSV (Template CSV 7-kolom disediakan).

### 🎲 Mode 2: Random Picker Soal
- **Zero-Auth Public Link (`/p/[slug]`)**: Peserta dapat mengocok soal tanpa perlu login.
- **🔊 Text-to-Speech (Audio Bacakan Soal)**: Membaca teks soal secara otomatis untuk memudahkan presentasi lisan.
- **⛶ Mode Proyektor / Fullscreen**: Tampilan kartu soal yang bersih untuk proyektor kelas.
- **✅ Tiga Tipe Soal Interaktif**: Setiap kartu soal bisa disetel sebagai **Pilihan Ganda** (satu jawaban), **Pilihan Ganda Multi Jawaban** (centang banyak), atau **Essay/Uraian**. Author mengisi opsi + kunci di editor; siswa menjawab langsung di layar publik dan melihat benar/salah saat itu juga. Tanpa poin, tanpa leaderboard — murni latihan. Penilaian di server (`POST /api/public/[slug]/answer`) sehingga kunci tidak pernah ikut terkirim ke browser; essay tidak dinilai otomatis, hanya menampilkan pembahasan.
- **Aturan Randomisasi**: Setting anti-repeat (*Allow Repeat*, *Prevent Immediate Repeat*, *No Repeat Until All Shown*).

---

## 📦 Tech Stack

- **Framework**: Next.js (App Router, React 19, TypeScript)
- **Styling & UI**: Tailwind CSS, Lucide React, Framer Motion
- **Database**: PostgreSQL
- **ORM**: Prisma 7 (`@prisma/adapter-pg` & `pg` driver adapter)
- **Authentication**: Auth.js (NextAuth)
- **Deployment**: Support Cloudflare Tunnel, Vercel, Railway, Render, VPS (Docker / PM2)

> **📁 Penyimpanan Media Upload:** File yang di-upload author disimpan di `UPLOAD_DIR`
> (default `./public/uploads`, di Docker memakai volume `/app/uploads`) dan **disajikan
> lewat route `GET /api/uploads/<nama-file>`**. Jangan mengandalkan `public/` untuk file
> runtime — Next.js production (`next start`) hanya menyajikan aset `public/` yang ada
> saat `next build`, sehingga file yang di-upload setelah deploy akan 404 jika diakses
> langsung dari `/uploads/...`.
>
> **🔒 Keamanan Upload (anti webshell):** `POST /api/upload` hanya menerima ekstensi dari
> allowlist eksplisit (`.jpg .jpeg .png .gif .webp .avif .bmp .mp4 .webm .mov .m4v .pdf
> .txt .csv .zip .doc(x) .xls(x) .ppt(x)`) dan **isi file harus cocok dengan ekstensinya**
> (magic-number check), sehingga `.php`, `.phtml`, `.phar`, `.jsp`, `.asp`, `.cgi`, `.sh`,
> `.exe`, `.html`, `.svg`, dan `.htaccess` — juga polyglot `GIF89a<?php …` yang di-rename
> jadi `.jpg` — ditolak dengan `415`. Nama file di disk selalu di-generate ulang (tidak
> pernah dari input user). Saat disajikan, route `/api/uploads` mengirim `Content-Type`
> eksplisit + `X-Content-Type-Options: nosniff` + `Content-Security-Policy: sandbox`, jadi
> file tersimpan hanya bisa diunduh/ditampilkan, tidak pernah dieksekusi.

---

## ⚙️ Cara Deploy Aplikasi

Berikut adalah **3 Pilihan Cara Deploy** yang dapat Anda pilih sesuai kebutuhan:

---

### 🌐 Opsi A: Cloudflare Tunnel (Sangat Mudah — Dari Komputer Lokal ke Internet/HP)

Gunakan metode ini jika Anda ingin menguji aplikasi dari laptop lokal ke seluruh smartphone siswa via internet secara gratis dan instan:

1. **Install Cloudflared CLI**:
   - **Linux**: `sudo apt-get install cloudflared` atau unduh dari website Cloudflare.
   - **Windows**: Download `cloudflared.exe` dari [Cloudflare Developers](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).
   - **macOS**: `brew install cloudflare/cloudflare-one/cloudflared`

2. **Jalankan Aplikasi Lokal**:
   ```bash
   pnpm install
   pnpm prisma db push
   pnpm dev
   ```

3. **Aktifkan Quick Tunnel**:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   *Cloudflare akan memberikan URL publik HTTPS instan (contoh: `https://xxxx.trycloudflare.com`) yang bisa langsung dibuka di HP siswa.*

---

### ⚡ Opsi B: Deploy ke Vercel + Database Online (Supabase / Neon / Prisma Postgres)

Cocok untuk produksi permanent berkinerja tinggi:

1. **Siapkan Database PostgreSQL Online**:
   - Buat database gratis di [Neon.tech](https://neon.tech), [Supabase.com](https://supabase.com), atau [Prisma Postgres](https://console.prisma.io).
   - Dapatkan `DATABASE_URL` (contoh: `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).

2. **Push Kode ke GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Ready"
   git push origin main
   ```

3. **Import Project di Vercel**:
   - Buka [Vercel Dashboard](https://vercel.com/new).
   - Import repository GitHub Anda.
   - Tambahkan Environment Variables di Vercel:
     - `DATABASE_URL` = (Connection string PostgreSQL online)
     - `NEXTAUTH_SECRET` = (Isikan string acak, misal: `openssl rand -base64 32`)
     - `NEXTAUTH_URL` = `https://nama-app-anda.vercel.app`

4. **Jalankan Migration**:
   Di terminal lokal, arahkan Prisma ke database online dan push schema:
   ```bash
   DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require" npx prisma db push
   ```

5. **Deploy**: Klik tombol **Deploy** di Vercel. Aplikasi siap digunakan!

---

### 🐳 Opsi C: Deploy ke VPS Linux (Ubuntu + PM2 + Nginx / Docker)

Cocok untuk instalasi server sekolah / kampus milik sendiri:

1. **Clone Repository & Install Dependencies di VPS**:
   ```bash
   git clone <URL_REPO_ANDA> /var/www/joki
   cd /var/www/joki
   pnpm install
   ```

2. **Setup Environment (.env)**:
   Buat file `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/online_exam"
   NEXTAUTH_SECRET="buat_secret_acak_di_sini"
   NEXTAUTH_URL="http://IP_VPS_ANDA:3000"
   UPLOAD_DIR="/var/www/joki/uploads"
   ```

   > Gunakan folder di luar hasil build (contoh `uploads/` di root project) agar file
   > upload tidak hilang saat rebuild. Folder dibuat otomatis oleh aplikasi.

3. **Build & Migration**:
   ```bash
   npx prisma db push
   pnpm run build
   ```

4. **Jalankan Server dengan PM2**:
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "quiz-app" -- start -- -p 3000
   pm2 save
   pm2 startup
   ```

5. **(Opsional) Setup Reverse Proxy Nginx & SSL Certbot**:
   Arahkan domain sekolah ke IP VPS dan konfigurasi Nginx di `/etc/nginx/sites-available/default` ke `http://127.0.0.1:3000`.

---

## 🛠️ Environment Variables (.env)

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/online_exam"

# NextAuth / Auth.js Configuration
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Media upload (default: ./public/uploads). File disajikan via /api/uploads/<nama-file>.
# Di Docker/compose: UPLOAD_DIR="/app/uploads" (volume uploads_data).
UPLOAD_DIR="/var/www/joki/uploads"

# Cloudflare Token (Opsional)
CLOUDFLARE_API_TOKEN="cfk_xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 👥 Akun Demo Default

- **Email Author / Guru**: `author@example.com`
- **Password**: `Author123!`
- **Halaman Login**: `http://localhost:3000/login`
- **Join Kode Peserta**: `http://localhost:3000/join`

---

## 📄 Lisensi & Kontribusi

Dikembangkan untuk kebutuhan pembelajaran dan kuis interaktif sekolah/kampus. Silakan digunakan dan dikembangkan lebih lanjut! 🎓
