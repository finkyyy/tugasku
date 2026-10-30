# TugasKu

Aplikasi web single-page (PWA) untuk melacak tugas kuliah. Dibangun dengan HTML5, Tailwind CSS (CDN), Vanilla JS ES6+, dan Supabase JS v2 (CDN).

## Fitur
- Tambah tugas dengan nama tugas dan deadline (datetime-local)
- Filter: Semua / Belum Dikerjakan / Sudah Dikerjakan
- Tandai selesai / batal selesai
- Hapus tugas
- Peringatan deadline (merah jika belum selesai dan deadline < 24 jam atau sudah lewat)
- Tampilan responsif (mobile & desktop)
- Mendukung instalasi sebagai PWA (dengan manifest dan service worker)

## Langkah Menjalankan

### 1. Buat Project Supabase
1. Buka [supabase.com](https://supabase.com) dan buat project baru.
2. Catat `Project URL` dan `anon public` key dari Settings > API.

### 2. Jalankan Skema Database
1. Buka SQL Editor di Supabase.
2. Salin isi file `schema.sql` lalu jalankan.
3. Skema ini idempotent (aman dijalankan ulang). Policy bersifat publik **hanya untuk demo/tanpa login**. Sangat disarankan menambahkan autentikasi dan policy per-user jika aplikasi dipublikasikan.

### 3. Konfigurasi Kredensial
1. Buka file `app.js`.
2. Ganti `YOUR_SUPABASE_URL` dan `YOUR_SUPABASE_KEY` dengan kredensial dari Supabase.
3. **Gunakan `anon key`, jangan pernah gunakan `service_role` key** di sisi klien.

### 4. Jalankan Aplikasi Secara Lokal
**Disarankan pakai static server** (beberapa browser membatasi fetch jika dibuka langsung dari file):

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Lalu buka [http://localhost:8000](http://localhost:8000).

## Deployment

- **GitHub Pages**: Jika di-host di subfolder (mis. `https://username.github.io/nama-repo/`), pastikan `start_url`, `scope`, dan path service worker/manifest sesuai base path. Saat ini manifest menggunakan path relatif (`./`) sehingga bisa berfungsi, namun perlu diuji.
- **Netlify/Vercel/Cloudflare Pages**: Bisa deploy langsung sebagai static site. Pastikan tidak meng-upload kredensial nyata dan pastikan file PWA (`manifest.webmanifest`, `sw.js`, `icons/`) ikut ter-deploy.

## Catatan Keamanan
- Jangan commit kredensial nyata. Gunakan placeholder seperti saat ini.
- File ini menggunakan RLS dengan policy publik untuk demo. Untuk penggunaan produksi, tambahkan Supabase Auth dan batasi akses per user.
- Semua input pengguna di-escape untuk mencegah XSS.
- Service worker tidak mencache request ke `*.supabase.co`.

## Catatan
- Waktu deadline disimpan dalam format UTC (ISO) dan ditampilkan sesuai zona waktu lokal browser.
- Jika Supabase belum dikonfigurasi, aplikasi akan menampilkan pesan error di UI.
