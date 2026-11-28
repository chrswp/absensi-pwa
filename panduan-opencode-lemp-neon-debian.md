# Panduan Lengkap Instalasi AI Agent (OpenCode) & Setup Stack LEMP + Neon di VPS Debian

Dokumentasi ini berisi panduan lengkap mulai dari persiapan VPS, pemilihan dan instalasi **OpenCode** di Debian, aturan keamanan (`AGENTS.md`), hingga *prompt* siap pakai untuk menginstal **LEMP Stack (Linux, Nginx, MariaDB, PHP)** serta integrasi database **Neon (Serverless PostgreSQL)**.

---

## Daftar Isi
1. [Persiapan VPS dan Kebutuhan Sistem](#1-persiapan-vps-dan-kebutuhan-sistem)
2. [Pemilihan CLI Agent untuk Administrasi Server](#2-pemilihan-cli-agent-untuk-administrasi-server)
3. [Langkah Instalasi OpenCode di VPS Debian](#3-langkah-instalasi-opencode-di-vps-debian)
4. [Konfigurasi Aturan Keamanan (`AGENTS.md`)](#4-konfigurasi-aturan-keamanan-agentsmd)
5. [Prompt Siap Pakai: Instalasi LEMP Stack & Integrasi Neon](#5-prompt-siap-pakai-instalasi-lemp-stack--integrasi-neon)
6. [Alur Eksekusi Aman di OpenCode](#6-alur-eksekusi-aman-di-opencode)
7. [Daftar Periksa Keamanan Server](#7-daftar-periksa-keamanan-server)

---

## 1. Persiapan VPS dan Kebutuhan Sistem

Sebelum menginstal AI agent di server, pastikan VPS memenuhi kebutuhan dasar berikut:

* **Sistem Operasi:** Debian 11 / Debian 12 (atau Ubuntu 22.04 / 24.04).
* **Spesifikasi Minimum:** 1 vCPU dan RAM 2 GB (tidak memerlukan GPU karena pemrosesan AI dilakukan melalui API eksternal).
* **Akses:** Akses SSH ke server dengan user yang memiliki hak `sudo`.
* **API Key LLM:** Siapkan API key dari penyedia model AI (seperti Anthropic Claude, OpenAI, Google Gemini, atau OpenRouter).

---

## 2. Pemilihan CLI Agent untuk Administrasi Server

Untuk tugas instalasi paket (`apt`) dan pengeditan file konfigurasi di `/etc/`, **CLI Agent berbasis terminal** lebih direkomendasikan dibandingkan tool otomasi workflow visual:

| Fitur | OpenCode | Claude Code | Open Interpreter |
| :--- | :--- | :--- | :--- |
| **Lisensi & Biaya** | Open-source (Gratis, bayar API) | Gratis CLI (Perlu akun/API Claude) | Open-source (Gratis, bayar API) |
| **Pilihan Model LLM** | Multi-provider (75+ model) | Khusus model Claude | Multi-provider & model lokal |
| **Keunggulan Utama** | Mode *Plan/Build* aman untuk pemula | Sangat akurat membaca log & struktur Linux | Antarmuka simpel berbasis perintah |
| **Instalasi di Linux** | Script resmi (`curl`) / npm | Script resmi / paket `apt` | Binary standalone via `curl` |

---

## 3. Langkah Instalasi OpenCode di VPS Debian

### Langkah 1: Perbarui Paket Sistem
Login ke VPS Debian Anda melalui SSH, lalu jalankan perintah pembaruan sistem dan instalasi dependensi dasar:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ca-certificates tmux
```

### Langkah 2: Jalankan Skrip Instalasi OpenCode
Unduh dan pasang OpenCode CLI menggunakan perintah resmi:

```bash
curl -fsSL https://opencode.ai/v2/install | bash
```

Muat ulang konfigurasi shell dan verifikasi hasil instalasi:

```bash
source ~/.bashrc
opencode --version
```

> **Catatan:** Jika muncul pesan `opencode: command not found`, tambahkan direktori binary ke `PATH` secara manual:
> ```bash
> echo 'export PATH="$HOME/.opencode/bin:$PATH"' >> ~/.bashrc
> source ~/.bashrc
> ```

### Langkah 3: Hubungkan API Key LLM
1. Jalankan sesi `tmux` (opsional, agar sesi tidak terputus jika koneksi SSH terputus):
   ```bash
   tmux new -s setup-server
   ```
2. Masuk ke direktori kerja dan jalankan OpenCode:
   ```bash
   opencode
   ```
3. Di dalam antarmuka OpenCode, ketik `/connect` lalu tekan **Enter**.
4. Pilih penyedia LLM yang Anda gunakan, tempelkan API key Anda, lalu pilih model aktif melalui perintah `/models`.

---

## 4. Konfigurasi Aturan Keamanan (`AGENTS.md`)

Sebelum memberikan perintah instalasi sistem, buat file `AGENTS.md` di direktori tempat Anda menjalankan OpenCode (misalnya `/root/AGENTS.md` atau folder proyek). OpenCode akan otomatis membaca file ini sebagai pedoman kerja.

```bash
cat << 'EOF' > AGENTS.md
# Server Administration Rules (Debian)

- Sistem operasi server ini adalah Debian. Gunakan `apt` untuk manajemen paket.
- Sebelum mengubah file konfigurasi sistem di `/etc/` (seperti konfigurasi Nginx atau PHP), selalu buat file backup dengan akhiran `.bak` terlebih dahulu.
- Sebelum me-restart layanan Nginx, selalu jalankan `sudo nginx -t` untuk memastikan sintaks valid.
- Jangan pernah mencetak atau menyimpan password database maupun connection string Neon secara terbuka di log atau script publik; simpan kredensial sensitif di dalam file `.env` dengan izin akses `600`.
- Jelaskan setiap langkah sebelum mengeksekusinya.
EOF
```

---

## 5. Prompt Siap Pakai: Instalasi LEMP Stack & Integrasi Neon

Pastikan OpenCode berada dalam **Plan Mode** (tekan tombol **Tab** untuk beralih antara *Plan* dan *Build*), lalu salin dan tempel prompt berikut setelah mengganti bagian di dalam tanda kurung siku `[...]`:

```text
Tolong bantu instal dan konfigurasi stack LEMP beserta integrasi database PostgreSQL Neon di server Debian ini. Lakukan secara bertahap dan minta konfirmasi sebelum menjalankan perintah instalasi atau mengubah konfigurasi sistem.

Detail kebutuhan saya:
1. **Update & Paket Dasar:** Perbarui daftar paket Debian dan pastikan `curl`, `ca-certificates`, `gnupg`, serta `unzip` terpasang.
2. **Web Server (Nginx):** Instal Nginx, aktifkan agar berjalan otomatis saat boot, dan buatkan server block baru di `/etc/nginx/sites-available/[NAMA_DOMAIN_ANDA]` dengan root direktori di `/var/www/[NAMA_FOLDER_WEB]` yang sudah mendukung pemrosesan file `.php`. Jangan lupa hapus link `default` jika bentrok, lalu uji dengan `nginx -t` sebelum reload.
3. **Database Lokal (MariaDB):** Instal `mariadb-server`, pastikan service berjalan, dan pandu saya untuk mengamankan instalasi dasar (membuat user admin aplikasi baru dengan hak akses penuh ke database `[NAMA_DB_LOKAL]`, tanpa menggunakan user root untuk aplikasi).
4. **PHP & Ekstensi:** Instal PHP-FPM versi bawaan terbaru di repositori Debian ini beserta ekstensi umum (`php-fpm`, `php-mysql`, `php-pgsql`, `php-curl`, `php-mbstring`, `php-xml`, `php-zip`, `php-bcmath`). Pastikan ekstensi `php-pgsql` dan `pdo_pgsql` aktif agar PHP bisa terhubung ke Neon.
5. **Integrasi Neon (Serverless Postgres):**
   - Instal paket `postgresql-client` di Debian agar saya bisa mengakses Neon langsung lewat terminal (`psql`).
   - Buatkan struktur direktori aplikasi di `/var/www/[NAMA_FOLDER_WEB]`, lalu siapkan file `.env` (dengan permission `chmod 600`) yang berisi variabel `DATABASE_URL="[PASTE_NEON_CONNECTION_STRING_ANDA]"`.
   - Buatkan satu file uji coba `/var/www/[NAMA_FOLDER_WEB]/test-db.php` (hanya bisa diakses dari localhost atau dilindungi sementara) menggunakan PHP PDO untuk mengetes koneksi SSL (`sslmode=require`) ke Neon serta koneksi ke MariaDB lokal, lalu jalankan tes koneksi lewat CLI (`php test-db.php`) untuk memverifikasi kedua database terhubung dengan sukses.

Mulai dengan mengecek versi OS Debian saat ini dan susun rencana langkah demi langkah terlebih dahulu.
```

### Keterangan Placeholder
* `[NAMA_DOMAIN_ANDA]`: Nama domain atau subdomain aplikasi Anda (contoh: `app.domainanda.com`).
* `[NAMA_FOLDER_WEB]`: Nama folder proyek di `/var/www/` (contoh: `app-web`).
* `[NAMA_DB_LOKAL]`: Nama database lokal di MariaDB (contoh: `db_lokal_app`).
* `[PASTE_NEON_CONNECTION_STRING_ANDA]`: String koneksi dari dashboard Neon, biasanya berbentuk:
  `postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require`

---

## 6. Alur Eksekusi Aman di OpenCode

1. **Tinjau Rencana (Plan Mode):** Baca daftar paket dan struktur konfigurasi yang diajukan oleh OpenCode sebelum mengeksekusi apa pun.
2. **Eksekusi Bertahap (Build Mode):** Tekan tombol **Tab** untuk masuk ke **Build Mode**, lalu instruksikan OpenCode untuk menjalankan tugas per tahap (misalnya: *"Lanjutkan eksekusi tahap 1 dan 2 terlebih dahulu"*).
3. **Verifikasi Layanan:** Pastikan status layanan aktif setelah instalasi selesai:
   ```bash
   sudo systemctl status nginx
   sudo systemctl status mariadb
   sudo systemctl status php*-fpm
   ```
4. **Bersihkan File Uji Coba:** Setelah koneksi ke Neon dan MariaDB terbukti berhasil melalui `php test-db.php`, minta OpenCode menghapus file `test-db.php` agar detail koneksi tidak terekspos ke publik.

---

## 7. Daftar Periksa Keamanan Server

* **Konfirmasi Perintah Sistem:** Selalu periksa perintah `sudo` yang diajukan agent sebelum menekan tombol setuju.
* **Proteksi Kredensial:** Pastikan file `.env` memiliki hak akses `600` (`chmod 600 .env`) dan tidak berada di dalam folder publik yang bisa diunduh langsung lewat browser (atur aturan blokir file tersembunyi `location ~ /\.` di konfigurasi Nginx).
* **Firewall (UFW):** Batasi port yang terbuka pada server hanya untuk SSH (`22`), HTTP (`80`), dan HTTPS (`443`).
* **Sertifikat SSL:** Setelah domain diarahkan ke IP VPS, pasang sertifikat SSL gratis menggunakan Certbot (`python3-certbot-nginx`) agar lalu lintas web terenkripsi HTTPS.
