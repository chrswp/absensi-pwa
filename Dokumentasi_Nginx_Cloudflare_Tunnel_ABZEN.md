# Dokumentasi Infrastruktur Web ABZEN

## Nginx, Cloudflare DNS/Proxy, Cloudflare Tunnel, Reverse Proxy, dan Skenario Implementasi

**Dokumen:** Panduan teknis dan catatan implementasi\
**Tanggal kasus:** 28 November 2026\
**Lingkungan:** Debian GNU/Linux 13 (Trixie), KVM/QEMU, Nginx,
Cloudflare Tunnel\
**Domain utama:** `abzen.cloud`\
**Subdomain:** `www.abzen.cloud`, `gsi.abzen.cloud`

------------------------------------------------------------------------

## 1. Ringkasan eksekutif

Dokumen ini menjelaskan peran Nginx, DNS Cloudflare, Cloudflare Proxy,
Cloudflare Tunnel, proxy, dan reverse proxy; bagaimana komponen-komponen
tersebut bekerja bersama; skenario penggunaan yang dapat dikembangkan;
serta dokumentasi troubleshooting dan penyelesaian kasus `abzen.cloud`.

Kasus yang diselesaikan adalah website tidak dapat diakses dari internet
meskipun Nginx berjalan normal di VPS. VPS menggunakan alamat jaringan
privat `192.168.205.68`, sedangkan alamat publik yang terlihat dari
internet adalah `192.154.204.145`. SSH dapat diakses melalui port publik
`2327`. Karena akses ke gateway/provider tidak tersedia, port forwarding
inbound 80/443 tidak dapat dikonfigurasi sendiri.

Solusi yang diterapkan adalah Cloudflare Tunnel. Program `cloudflared`
pada VPS membuat koneksi keluar (outbound) yang persisten ke jaringan
Cloudflare. Request pengunjung masuk ke Cloudflare, lalu diteruskan
melalui tunnel ke Nginx lokal pada `http://localhost:80`. Dengan
demikian, VPS tidak memerlukan port inbound 80/443 yang terbuka dari
internet.

Hasil akhir yang telah diverifikasi untuk domain utama:

``` text
curl -I https://abzen.cloud
HTTP/2 200
server: cloudflare
```

`www.abzen.cloud` juga dilaporkan menghasilkan hasil yang sama oleh
pengguna.

> Catatan status: konfigurasi route Cloudflare untuk `gsi.abzen.cloud`
> terlihat pada log `cloudflared`, dan record DNS CNAME untuk `gsi`
> terlihat pada dashboard. Server block Nginx untuk GSI telah disiapkan
> sebagai instruksi, tetapi keberhasilan akhir `https://gsi.abzen.cloud`
> belum dikonfirmasi dalam percakapan.

------------------------------------------------------------------------

## 2. Topologi dan komponen

### 2.1 Topologi yang digunakan

``` text
                    PENGUNJUNG / INTERNET
                             |
                             | HTTPS :443
                             v
                    CLOUDFLARE EDGE
              DNS + Proxy + TLS + Proteksi
                             |
                             | melalui tunnel
                             v
                  CLOUDFLARE TUNNEL
                    (cloudflared)
                             ^
                             | koneksi outbound
                             |
+-----------------------------------------------------+
| VPS: vm547                                          |
| Debian 13 / KVM-QEMU                                |
|                                                     |
|  eth0: 192.168.205.68                               |
|  gateway: 192.168.205.1                             |
|                                                     |
|  cloudflared service                                |
|        |                                            |
|        v                                            |
|  Nginx :80                                          |
|        |                                            |
|        +--> /var/www/abzen.cloud/html               |
|        |                                            |
|        +--> /var/www/gsi.abzen.cloud/html           |
+-----------------------------------------------------+
```

Alur request untuk `https://abzen.cloud`:

1.  Browser meminta `abzen.cloud`.
2.  DNS mengarahkan nama domain ke layanan Cloudflare.
3.  Cloudflare menerima koneksi HTTPS pengunjung.
4.  Cloudflare mencocokkan hostname dengan route tunnel.
5.  Cloudflare meneruskan request melalui koneksi tunnel yang telah
    dibuat `cloudflared`.
6.  `cloudflared` mengirim request ke origin lokal
    `http://localhost:80`.
7.  Nginx memilih server block berdasarkan HTTP `Host` header.
8.  Nginx mengirim file dari document root yang sesuai.
9.  Response kembali melalui tunnel dan Cloudflare ke browser.

### 2.2 Komponen dan fungsinya

  -----------------------------------------------------------------------
  Komponen                            Fungsi
  ----------------------------------- -----------------------------------
  Domain                              Nama yang digunakan pengunjung,
                                      misalnya `abzen.cloud`

  DNS                                 Menerjemahkan nama domain menjadi
                                      tujuan jaringan

  Cloudflare DNS                      Mengelola DNS zone domain

  Cloudflare Proxy (orange cloud)     Menerima trafik web melalui
                                      jaringan edge Cloudflare

  Cloudflare Tunnel                   Jalur aman dari jaringan Cloudflare
                                      ke konektor di server

  `cloudflared`                       Agent/connector yang berjalan di
                                      VPS dan mempertahankan tunnel

  Nginx                               Web server dan reverse proxy di
                                      sisi origin

  Server block                        Memilih konfigurasi website
                                      berdasarkan hostname/port

  Document root                       Direktori file website, misalnya
                                      `/var/www/gsi.abzen.cloud/html`

  TLS/HTTPS                           Enkripsi koneksi antara browser dan
                                      Cloudflare; koneksi origin tunnel
                                      dapat menggunakan HTTP lokal
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 3. Memahami istilah: proxy dan reverse proxy

### 3.1 Proxy (forward proxy)

Forward proxy bertindak sebagai perantara untuk client ketika client
mengakses server tujuan.

``` text
Client -> Forward Proxy -> Internet/Server tujuan
```

Contoh penggunaan: - Proxy kantor untuk mengatur akses internet
karyawan. - Filtering kategori website. - Logging akses internet. -
Caching konten yang sesuai kebijakan. - Menyembunyikan alamat IP client
dari server tujuan (tergantung implementasi).

Pada forward proxy, proxy biasanya mewakili sisi client.

### 3.2 Reverse proxy

Reverse proxy berada di depan satu atau lebih server aplikasi.
Pengunjung mengakses reverse proxy, lalu reverse proxy memilih backend
yang sesuai.

``` text
Pengunjung -> Reverse Proxy -> Backend A
                           -> Backend B
                           -> Backend C
```

Contoh: - Nginx menerima `app.example.com` lalu meneruskan ke aplikasi
Node.js `127.0.0.1:3000`. - Nginx menerima `api.example.com` lalu
meneruskan ke backend API `127.0.0.1:8000`. - Nginx melakukan TLS
termination, routing hostname/path, load balancing, dan pengaturan
header.

Reverse proxy tidak otomatis membuka akses jaringan dari internet.
Reverse proxy hanya dapat memproses request yang sudah mencapai mesin
tempat reverse proxy berjalan.

### 3.3 Apakah Nginx pada kasus ini merupakan reverse proxy?

Pada konfigurasi website statis, Nginx berfungsi terutama sebagai web
server yang menyajikan file HTML. Nginx juga memiliki kemampuan reverse
proxy melalui `proxy_pass`.

Cloudflare berada di depan Nginx dan berperan sebagai
proxy/reverse-proxy edge untuk trafik web. Cloudflare Tunnel menyediakan
jalur koneksi dari edge ke konektor di VPS. `cloudflared` bukan
pengganti Nginx; keduanya memiliki fungsi berbeda.

### 3.4 Mengapa reverse proxy lokal tidak menyelesaikan masalah port?

Jika request internet tidak dapat mencapai VPS, Nginx reverse proxy di
VPS tidak akan pernah menerima request tersebut.

Reverse proxy lokal menyelesaikan routing setelah request tiba di
server. Masalah inbound NAT/firewall harus ditangani di jaringan
provider, atau dihindari menggunakan mekanisme seperti Cloudflare Tunnel
yang membuat koneksi outbound.

------------------------------------------------------------------------

## 4. Memahami DNS Cloudflare dan status Proxy

### 4.1 DNS saja versus DNS + Proxy

Pada record DNS biasa (DNS-only / awan abu-abu), DNS mengembalikan
alamat tujuan origin secara langsung.

Pada record Proxied (awan oranye), pengunjung mendapatkan alamat edge
Cloudflare. Request web masuk ke Cloudflare terlebih dahulu.

Perlu diingat: - A record mengarah ke alamat IPv4. - AAAA record
mengarah ke alamat IPv6. - CNAME mengarahkan satu nama ke nama DNS
lain. - Proxy status menentukan apakah trafik HTTP/HTTPS melewati
Cloudflare Proxy atau hanya resolusi DNS. - Record CNAME ke tunnel harus
menunjuk ke hostname tunnel yang benar, biasanya berbentuk
`<UUID>.cfargotunnel.com`.

### 4.2 Record untuk Cloudflare Tunnel

Untuk hostname yang dilayani oleh named tunnel, record DNS umumnya
berupa CNAME ke alamat tunnel:

  Type    Name            Target
  ------- --------------- ----------------------------------
  CNAME   `@` atau apex   `<TUNNEL-UUID>.cfargotunnel.com`
  CNAME   `www`           `<TUNNEL-UUID>.cfargotunnel.com`
  CNAME   `gsi`           `<TUNNEL-UUID>.cfargotunnel.com`

Cloudflare dashboard atau perintah `cloudflared tunnel route dns` dapat
membuat record untuk hostname. Untuk apex domain, dashboard Cloudflare
dapat mengelola flattening CNAME sehingga apex tetap dapat digunakan.

**Penting:** gunakan target tunnel aktual dari dashboard, jangan menebak
atau menyalin UUID contoh. Pastikan setiap hostname juga mempunyai
Public Hostname / Published Application Route yang sesuai.

### 4.3 Record A yang menyebabkan masalah pada kasus ini

Pada awalnya DNS Cloudflare memperlihatkan:

  Type    Name    Content                     Proxy
  ------- ------- --------------------------- ---------
  A       `@`     `192.154.204.145`           Proxied
  A       `www`   `192.154.204.145`           Proxied
  CNAME   `gsi`   `<UUID>.cfargotunnel.com`   Proxied

Record `@` dan `www` masih menunjuk ke public IP VPS, bukan ke tunnel.
Karena origin publik tidak menerima koneksi pada port web, request
menghasilkan Cloudflare 521.

Perbaikannya adalah mengubah record `@` dan `www` agar menggunakan
target CNAME tunnel yang sama dengan tunnel yang benar, bukan alamat IP
publik lama.

IP hasil `dig` yang terlihat setelah record diproxy, misalnya
`104.21.x.x` dan `172.67.x.x`, adalah alamat edge Cloudflare. IP
tersebut bukan bukti bahwa record origin sudah benar. Periksa target
record di dashboard Cloudflare atau query DNS yang sesuai untuk
memverifikasi konfigurasi.

------------------------------------------------------------------------

## 5. Cloudflare Tunnel

### 5.1 Apa itu Cloudflare Tunnel?

Cloudflare Tunnel menghubungkan jaringan Cloudflare dengan layanan di
jaringan privat melalui koneksi outbound yang dibuat oleh `cloudflared`.

Konsep dasarnya:

``` text
Browser -> Cloudflare Edge -> Tunnel -> cloudflared -> localhost:80
```

Keuntungan: - Tidak perlu membuka inbound port 80/443 pada router atau
NAT provider. - VPS dapat berada di belakang NAT. - Tidak perlu memasang
public IP langsung pada interface VPS. - Dapat mempublikasikan beberapa
hostname melalui satu tunnel. - Koneksi dari `cloudflared` ke Cloudflare
dipertahankan dari sisi server. - Dapat dikombinasikan dengan Cloudflare
DNS, TLS, WAF, dan Access sesuai kebutuhan paket/fitur.

Batasan dan perhatian: - Tunnel memerlukan koneksi internet outbound
yang berfungsi. - Jika service `cloudflared` berhenti, hostname yang
bergantung pada tunnel tidak dapat mencapai origin. - DNS dan Public
Hostname harus sama-sama benar. - Tunnel bukan pengganti autentikasi
aplikasi; aplikasi admin tetap harus diamankan. - Token tunnel adalah
kredensial sensitif dan harus dijaga.

### 5.2 Named tunnel dan service

Named tunnel dibuat di dashboard Cloudflare atau melalui CLI. Dashboard
memberikan token untuk menghubungkan konektor. Instalasi sebagai service
systemd membuat konektor berjalan otomatis setelah reboot.

Pemeriksaan:

``` bash
sudo systemctl status cloudflared --no-pager
sudo journalctl -u cloudflared -n 50 --no-pager
```

Log yang baik dapat memperlihatkan: - `Registered tunnel connection` -
beberapa koneksi edge terdaftar - connectivity pre-check `PASS` -
`Environment is healthy` - konfigurasi ingress yang memuat hostname dan
service origin

Jangan pernah menempelkan token lengkap ke tiket publik, chat grup,
dokumentasi publik, atau repository.

### 5.3 Public Hostname / Published Application Route

Setiap hostname yang dipublikasikan perlu diarahkan ke service lokal.

Contoh:

  Hostname            Service
  ------------------- -------------------------
  `abzen.cloud`       `http://localhost:80`
  `www.abzen.cloud`   `http://localhost:80`
  `gsi.abzen.cloud`   `http://localhost:80`
  `app.abzen.cloud`   `http://localhost:3000`
  `api.abzen.cloud`   `http://localhost:8000`

Beberapa hostname dapat menggunakan port Nginx yang sama karena Nginx
memilih server block berdasarkan hostname request.

### 5.4 Tunnel bukan DNS

Membuat tunnel tidak selalu berarti semua hostname otomatis siap
digunakan. Untuk setiap hostname: 1. Route hostname harus dibuat pada
tunnel. 2. DNS hostname harus diarahkan ke tunnel. 3. Origin service
harus berjalan. 4. Aplikasi/web server harus dapat melayani hostname
tersebut.

Dashboard dapat membuat DNS route saat menambahkan Public Hostname,
tetapi hasilnya tetap perlu diverifikasi.

------------------------------------------------------------------------

## 6. Nginx: web server dan server block

### 6.1 Fungsi Nginx

Nginx dapat digunakan sebagai: - Web server untuk file statis
HTML/CSS/JavaScript. - Reverse proxy untuk Node.js, Python, PHP-FPM, dan
layanan lain. - Load balancer. - TLS termination endpoint jika TLS
diakhiri di Nginx. - Router berdasarkan hostname dan URL path. -
Penyedia access log dan error log.

### 6.2 Struktur konfigurasi Debian

Pada instalasi Debian yang menggunakan layout `sites-available`:

``` text
/etc/nginx/
├── nginx.conf
├── sites-available/
│   ├── abzen.cloud
│   └── gsi.abzen.cloud
└── sites-enabled/
    ├── abzen.cloud -> ../sites-available/abzen.cloud
    └── gsi.abzen.cloud -> ../sites-available/gsi.abzen.cloud

/var/www/
├── abzen.cloud/
│   └── html/
│       └── index.html
└── gsi.abzen.cloud/
    └── html/
        └── index.html
```

`sites-available` menyimpan file konfigurasi. `sites-enabled` berisi
symlink konfigurasi yang diaktifkan. Pastikan `nginx.conf` memuat
direktif include untuk `sites-enabled` sebelum memakai pola ini.

### 6.3 Server block website statis ABZEN

File: `/etc/nginx/sites-available/abzen.cloud`

``` nginx
server {
    listen 80;
    listen [::]:80;

    server_name abzen.cloud www.abzen.cloud;

    root /var/www/abzen.cloud/html;
    index index.html index.htm;

    access_log /var/log/nginx/abzen.cloud.access.log;
    error_log /var/log/nginx/abzen.cloud.error.log;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

HTML sederhana:

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ABZEN - Under Construction</title>
</head>
<body>
    <h1>WELCOME - UNDER CONSTRUCTION</h1>
</body>
</html>
```

### 6.4 Server block website GSI ABZEN

File: `/etc/nginx/sites-available/gsi.abzen.cloud`

``` nginx
server {
    listen 80;
    listen [::]:80;

    server_name gsi.abzen.cloud;

    root /var/www/gsi.abzen.cloud/html;
    index index.html index.htm;

    access_log /var/log/nginx/gsi.abzen.cloud.access.log;
    error_log /var/log/nginx/gsi.abzen.cloud.error.log;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

HTML:

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GSI ABZEN - Under Construction</title>
</head>
<body>
    <h1>WELCOME -- GSI ABZEN UNDER CONSTRUCTION</h1>
</body>
</html>
```

### 6.5 Aktivasi server block

``` bash
sudo mkdir -p /var/www/gsi.abzen.cloud/html

sudo chown -R www-data:www-data /var/www/gsi.abzen.cloud
sudo chmod -R 755 /var/www/gsi.abzen.cloud

sudo ln -s /etc/nginx/sites-available/gsi.abzen.cloud \
  /etc/nginx/sites-enabled/gsi.abzen.cloud

sudo nginx -t
sudo systemctl reload nginx
```

Jika symlink sudah ada, jangan membuat duplikat. Periksa dengan:

``` bash
ls -l /etc/nginx/sites-enabled/
```

Uji virtual host secara lokal:

``` bash
curl -I -H "Host: gsi.abzen.cloud" http://127.0.0.1
```

Uji konten spesifik:

``` bash
curl -H "Host: gsi.abzen.cloud" http://127.0.0.1
```

### 6.6 Bagaimana Nginx memilih website?

Jika beberapa server block mendengarkan port 80, Nginx mencocokkan nilai
HTTP `Host` dengan `server_name`.

Contoh: - Request dengan Host `abzen.cloud` dilayani server block
ABZEN. - Request dengan Host `gsi.abzen.cloud` dilayani server block
GSI. - Keduanya dapat menggunakan `localhost:80` sebagai origin dari
Cloudflare Tunnel.

Ini memungkinkan satu VPS melayani banyak website tanpa harus
menyediakan satu IP publik per website.

------------------------------------------------------------------------

## 7. Nginx sebagai reverse proxy untuk aplikasi

Website statis dilayani langsung dari document root. Untuk aplikasi yang
berjalan sebagai service lokal, Nginx dapat meneruskan request dengan
`proxy_pass`.

### 7.1 Contoh Node.js pada port 3000

Aplikasi berjalan di `127.0.0.1:3000`.

``` nginx
server {
    listen 80;
    server_name app.abzen.cloud;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Di Cloudflare Tunnel, route `app.abzen.cloud` dapat diarahkan ke:

``` text
http://localhost:80
```

Alur request:

``` text
Browser
  -> Cloudflare
  -> Tunnel
  -> Nginx :80
  -> Node.js :3000
```

Alternatifnya, tunnel dapat diarahkan langsung ke
`http://localhost:3000`, tetapi menggunakan Nginx di depan aplikasi
memberi satu titik routing, logging, dan kebijakan reverse proxy.

### 7.2 Contoh backend API pada port 8000

``` nginx
server {
    listen 80;
    server_name api.abzen.cloud;

    location / {
        proxy_pass http://127.0.0.1:8000;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.3 Contoh routing berdasarkan path

Satu hostname dapat meneruskan path yang berbeda ke aplikasi yang
berbeda:

``` nginx
server {
    listen 80;
    server_name portal.abzen.cloud;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

Perhatikan perilaku trailing slash pada `proxy_pass`; penambahan atau
penghilangan slash dapat memengaruhi path yang diteruskan ke backend.
Uji sesuai struktur URL aplikasi.

### 7.4 WebSocket

Aplikasi yang menggunakan WebSocket memerlukan header upgrade:

``` nginx
location /socket/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

------------------------------------------------------------------------

## 8. Skenario arsitektur yang dapat dijalankan

### Skenario A --- Website statis multi-domain

``` text
Cloudflare Tunnel
       |
       v
    Nginx :80
       |
       +--> abzen.cloud       -> /var/www/abzen.cloud/html
       |
       +--> gsi.abzen.cloud   -> /var/www/gsi.abzen.cloud/html
       |
       +--> docs.abzen.cloud  -> /var/www/docs.abzen.cloud/html
```

Kegunaan: - Landing page perusahaan. - Website profil. - Dokumentasi. -
Halaman maintenance/under construction.

### Skenario B --- Multi-application server

``` text
Cloudflare Tunnel
       |
       v
    Nginx :80
       |
       +--> app.abzen.cloud  -> Node.js :3000
       +--> api.abzen.cloud  -> Python API :8000
       +--> admin.abzen.cloud -> PHP-FPM / aplikasi internal
       +--> gsi.abzen.cloud  -> static website
```

Kegunaan: - Hosting beberapa aplikasi pada satu VPS. - Pemisahan
frontend, backend API, dan admin. - Pengembangan aplikasi internal.

### Skenario C --- Tunnel langsung ke aplikasi

``` text
Cloudflare
    |
    v
Tunnel
    |
    +--> app.abzen.cloud -> http://localhost:3000
    +--> api.abzen.cloud -> http://localhost:8000
```

Kegunaan: - Deploy cepat untuk service sederhana. - Tidak memerlukan
Nginx untuk routing hostname. - Cocok bila jumlah service sedikit.

Konsekuensi: - Routing dan kebijakan HTTP tersebar pada konfigurasi
tunnel. - Fitur reverse proxy Nginx tidak digunakan. - Untuk banyak
aplikasi, Nginx dapat memberi struktur yang lebih terpusat.

### Skenario D --- Nginx reverse proxy dan Cloudflare Tunnel

``` text
Internet
   |
Cloudflare Edge
   |
Cloudflare Tunnel
   |
cloudflared
   |
Nginx :80
   |
   +--> static website
   +--> Node.js :3000
   +--> Python API :8000
   +--> PHP application
```

Ini adalah pola yang direkomendasikan untuk mengembangkan VPS ABZEN
menjadi multi-application server.

### Skenario E --- Public origin dengan NAT port forwarding

Jika provider memberikan port forwarding:

``` text
Internet
  |
Public IP :80/:443
  |
Provider NAT / Firewall
  |
VPS private IP :80/:443
  |
Nginx
```

Kelebihan: - Tidak bergantung pada tunnel untuk mencapai origin. - Dapat
menggunakan reverse proxy Nginx dan TLS di origin.

Kekurangan: - Memerlukan dukungan dan konfigurasi provider. - Port
inbound harus dibuka dan diamankan. - IP publik dan aturan NAT harus
benar.

### Skenario F --- Cloudflare Proxy tanpa Tunnel

``` text
Browser
  |
Cloudflare Proxy
  |
Public IP origin :80/:443
  |
Nginx
```

Cloudflare Proxy menyamarkan origin dari DNS publik dan memberi fitur
edge, tetapi origin tetap harus dapat dijangkau Cloudflare melalui port
yang didukung. Ini bukan pengganti NAT/port forwarding.

### Skenario G --- Private application dengan Cloudflare Access

Tunnel dapat digunakan untuk mempublikasikan aplikasi internal, lalu
aksesnya dibatasi menggunakan Cloudflare Access.

``` text
User
  |
Cloudflare Access (identity / policy)
  |
Cloudflare Tunnel
  |
Private application
```

Kegunaan: - Dashboard administrator. - Tool internal. - Monitoring. -
Panel pengelolaan. - Aplikasi development.

Jangan menganggap URL yang tidak mudah ditebak sebagai kontrol keamanan.
Terapkan autentikasi dan kebijakan akses.

------------------------------------------------------------------------

## 9. Dokumentasi kasus ABZEN --- 28 November 2026

### 9.1 Kondisi awal

Domain: - `abzen.cloud` - `www.abzen.cloud`

IP publik yang digunakan pada DNS: - `192.154.204.145`

VPS: - Hostname: `vm547` - OS: Debian GNU/Linux 13 (Trixie) -
Virtualisasi: KVM/QEMU - Kernel: `6.12.101+deb13-amd64` - Interface:
`eth0` - IP interface: `192.168.205.68/23` - Gateway: `192.168.205.1`

SSH: - Public IP: `192.154.204.145` - Public port: `2327` - Jalur SSH
yang diketahui: public port `2327` menuju service SSH VPS. Pemetaan
internal port 22 merupakan inferensi yang perlu dibedakan dari
konfigurasi provider yang telah diverifikasi.

### 9.2 Gejala awal

Perintah:

``` bash
sudo nginx -t
```

menghasilkan:

``` text
syntax is ok
test is successful
```

Namun:

``` bash
curl -I http://abzen.cloud
```

menghasilkan:

``` text
curl: (7) Failed to connect to abzen.cloud port 80
```

### 9.3 Pemeriksaan Nginx

``` bash
sudo ss -tulpn | grep ':80'
```

Hasil menunjukkan Nginx listen pada:

``` text
0.0.0.0:80
[::]:80
```

Uji lokal:

``` bash
curl -I http://127.0.0.1
```

menghasilkan HTTP 200.

Uji private IP:

``` bash
curl -I http://192.168.205.68
```

menghasilkan HTTP 200.

Kesimpulan: Nginx berjalan dan menerima koneksi pada interface lokal.

### 9.4 Pemeriksaan IP dan routing

`ip addr` menunjukkan:

``` text
eth0
inet 192.168.205.68/23
```

`ip route` menunjukkan:

``` text
default via 192.168.205.1 dev eth0 onlink
192.168.204.0/23 dev eth0 proto kernel scope link src 192.168.205.68
```

IP publik terdeteksi dari VPS menggunakan:

``` bash
curl -4 https://ifconfig.me
```

Hasil:

``` text
192.154.204.145
```

Informasi ini menunjukkan interface VPS menggunakan IP privat dan trafik
keluar terlihat menggunakan IP publik. Ini konsisten dengan lingkungan
NAT, walaupun detail implementasi NAT berada di sisi provider dan tidak
dapat diperiksa dari akses SSH saja.

### 9.5 Firewall

UFW:

``` text
Status: inactive
```

iptables INPUT:

``` text
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
```

Dengan bukti tersebut, tidak ditemukan aturan INPUT iptables yang
memblokir koneksi. Firewall/provider di luar VPS tetap mungkin
memengaruhi trafik inbound.

### 9.6 Identifikasi sistem

`hostnamectl` dan `/etc/os-release` menunjukkan: - Debian GNU/Linux 13
(Trixie). - Virtualization: KVM. - Hardware vendor/model virtual: QEMU /
Standard PC.

IPInfo untuk public IP mengembalikan: - ASN: AS397373 - Organisasi: H4Y
Technologies LLC - Hostname yang terdeteksi: `nyelvb.onineoride.com`

Data tersebut mengidentifikasi informasi jaringan IP, bukan bukti pasti
nama perusahaan reseller tempat layanan VPS dibeli.

### 9.7 Diagnosis awal

Nginx sehat secara lokal, tetapi koneksi inbound ke public IP port 80
gagal. Karena akses gateway/provider tidak tersedia, pengaturan NAT/port
forwarding tidak dapat dilakukan dari VPS.

Reverse proxy Nginx lokal tidak menyelesaikan jalur inbound yang belum
mencapai VPS.

### 9.8 Migrasi nameserver ke Cloudflare

Nameserver awal:

``` text
ns1.idwebhost.id
ns2.idwebhost.id
```

Nameserver Cloudflare yang diberikan:

``` text
aldo.ns.cloudflare.com
lucy.ns.cloudflare.com
```

Verifikasi:

``` bash
dig @1.1.1.1 NS abzen.cloud +short
dig @8.8.8.8 NS abzen.cloud +short
dig @9.9.9.9 NS abzen.cloud +short
```

Ketiga resolver mengembalikan nameserver Cloudflare tersebut.

### 9.9 Instalasi dan koneksi Tunnel

Tunnel dibuat melalui Cloudflare dashboard. `cloudflared` dipasang
sebagai service systemd.

Status yang terverifikasi:

``` text
cloudflared.service
Active: active (running)
```

Log menunjukkan: - Tunnel connections terdaftar. - DNS resolution untuk
endpoint tunnel berhasil. - UDP/QUIC connectivity berhasil. - TCP/HTTP2
connectivity berhasil. - Cloudflare API reachable. - Environment
healthy.

Log konfigurasi ingress kemudian memperlihatkan:

``` text
hostname: abzen.cloud
service: http://localhost:80

hostname: www.abzen.cloud
service: http://localhost:80

hostname: gsi.abzen.cloud
service: http://localhost:80
```

### 9.10 Kesalahan DNS yang ditemukan

Pada dashboard Cloudflare, record awal terlihat sebagai berikut:

  Type    Name    Content                     Proxy
  ------- ------- --------------------------- ---------
  A       `@`     `192.154.204.145`           Proxied
  A       `www`   `192.154.204.145`           Proxied
  CNAME   `gsi`   `<UUID>.cfargotunnel.com`   Proxied

Walaupun record A menggunakan Cloudflare Proxy, record tersebut tetap
menunjuk ke origin public IP. Karena origin tidak dapat dijangkau pada
jalur web, request menghasilkan:

``` text
HTTP/1.1 521
Server: cloudflare
```

Perbaikan: - Record `@` diubah agar mengarah ke target CNAME tunnel. -
Record `www` diubah agar mengarah ke target CNAME tunnel. - Record `gsi`
sudah menggunakan target tunnel.

Gunakan target CNAME aktual yang sama dengan tunnel, bukan UUID contoh.

### 9.11 Verifikasi akhir domain utama

Perintah:

``` bash
curl -I https://abzen.cloud
```

menghasilkan:

``` text
HTTP/2 200
server: cloudflare
cf-cache-status: DYNAMIC
```

Pengguna juga mengonfirmasi `www.abzen.cloud` menghasilkan hasil yang
sama.

Status yang terverifikasi: - `abzen.cloud`: berhasil HTTP/2 200. -
`www.abzen.cloud`: pengguna melaporkan hasil sama. - `cloudflared`:
active/running. - Nginx localhost:80: HTTP 200. - SSH port 2327: tidak
diubah.

### 9.12 Pekerjaan GSI yang disiapkan

DNS: - `gsi.abzen.cloud` terlihat sebagai CNAME menuju tunnel.

Tunnel: - Log menunjukkan ingress `gsi.abzen.cloud` ke
`http://localhost:80`.

Server block yang disiapkan:

``` nginx
server {
    listen 80;
    listen [::]:80;

    server_name gsi.abzen.cloud;

    root /var/www/gsi.abzen.cloud/html;
    index index.html index.htm;

    access_log /var/log/nginx/gsi.abzen.cloud.access.log;
    error_log /var/log/nginx/gsi.abzen.cloud.error.log;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

HTML:

``` html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GSI ABZEN - Under Construction</title>
</head>
<body>
    <h1>WELCOME -- GSI ABZEN UNDER CONSTRUCTION</h1>
</body>
</html>
```

Langkah aktivasi:

``` bash
sudo mkdir -p /var/www/gsi.abzen.cloud/html
sudo chown -R www-data:www-data /var/www/gsi.abzen.cloud
sudo chmod -R 755 /var/www/gsi.abzen.cloud

sudo ln -s /etc/nginx/sites-available/gsi.abzen.cloud \
  /etc/nginx/sites-enabled/gsi.abzen.cloud

sudo nginx -t
sudo systemctl reload nginx
```

Verifikasi lokal:

``` bash
curl -I -H "Host: gsi.abzen.cloud" http://127.0.0.1
```

Verifikasi publik:

``` bash
curl -I https://gsi.abzen.cloud
```

**Status GSI:** route tunnel dan DNS sudah terlihat dalam bukti
percakapan, tetapi hasil akhir akses publik belum dikonfirmasi.

------------------------------------------------------------------------

## 10. Troubleshooting dan interpretasi kode status

  -------------------------------------------------------------------------------
  Gejala                          Arti umum               Pemeriksaan utama
  ------------------------------- ----------------------- -----------------------
  `curl: (7) Failed to connect`   Koneksi TCP tidak       Service listen,
                                  berhasil dibuat         routing, firewall, NAT

  HTTP 200                        Request berhasil        Periksa isi halaman

  HTTP 404                        Resource/route tidak    Nginx `root`,
                                  ditemukan               `try_files`, hostname

  HTTP 502                        Gateway/proxy tidak     `cloudflared` ke
                                  mendapat respons origin origin, Nginx/backend
                                  yang valid              

  HTTP 521                        Cloudflare tidak dapat  Pastikan DNS
                                  membangun koneksi ke    benar-benar ke Tunnel
                                  origin yang dituju      atau origin dapat
                                                          dijangkau

  HTTP 522                        Koneksi ke origin       Jaringan, firewall,
                                  timeout                 origin

  HTTP 525/526                    Masalah                 Mode TLS dan sertifikat
                                  handshake/validasi SSL  origin
                                  pada jalur origin       
                                  tertentu                

  Cloudflare 1033                 Tunnel tidak            Status tunnel,
                                  tersedia/terhubung      connector, route
                                  untuk hostname          
  -------------------------------------------------------------------------------

Kode error dapat memiliki penyebab yang berbeda menurut arsitektur.
Selalu periksa log dan jalur request, jangan menyimpulkan hanya dari
kode status.

### 10.1 Pemeriksaan Nginx

``` bash
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo ss -tulpn | grep -E ':80|:443'
curl -I http://127.0.0.1:80
```

Log:

``` bash
sudo tail -n 50 /var/log/nginx/error.log
sudo tail -n 50 /var/log/nginx/access.log
```

### 10.2 Pemeriksaan Cloudflared

``` bash
sudo systemctl status cloudflared --no-pager
sudo journalctl -u cloudflared -n 50 --no-pager
```

### 10.3 Pemeriksaan DNS

``` bash
dig NS abzen.cloud +short
dig A abzen.cloud +short
dig CNAME abzen.cloud +short
dig A www.abzen.cloud +short
dig CNAME www.abzen.cloud +short
```

Untuk melihat record langsung dari resolver tertentu:

``` bash
dig @1.1.1.1 NS abzen.cloud +short
dig @8.8.8.8 NS abzen.cloud +short
```

Catatan: record proxied dapat menghasilkan IP edge Cloudflare saat query
A. Untuk memverifikasi tujuan tunnel, periksa target record di dashboard
Cloudflare atau konfigurasi route DNS tunnel.

### 10.4 Memeriksa virtual host tertentu

``` bash
curl -I -H "Host: gsi.abzen.cloud" http://127.0.0.1
```

Jika perintah ini menghasilkan 200, Nginx telah memilih server block
yang sesuai dan origin lokal melayani hostname tersebut.

------------------------------------------------------------------------

## 11. Keamanan dan praktik terbaik

### 11.1 Lindungi token tunnel

-   Jangan membagikan token `cloudflared`.
-   Jangan menyimpan token dalam repository Git publik.
-   Batasi permission file konfigurasi/credential.
-   Jika token terlanjur terekspos, rotasi/revoke sesuai mekanisme
    Cloudflare.

### 11.2 Amankan SSH

-   Pertahankan akses SSH yang sudah berfungsi pada port 2327.
-   Gunakan SSH key bila tersedia.
-   Nonaktifkan login root langsung jika sesuai kebijakan server.
-   Batasi sumber IP SSH jika memungkinkan.
-   Jangan mengubah port SSH tanpa memastikan jalur akses alternatif
    tersedia.

### 11.3 Batasi port aplikasi

Untuk aplikasi backend yang hanya diakses melalui Nginx, bind service ke
loopback:

``` text
127.0.0.1:3000
127.0.0.1:8000
```

Hindari membuka port backend langsung ke internet jika tidak dibutuhkan.

### 11.4 Pahami header IP pengunjung

Di belakang Cloudflare, alamat koneksi yang dilihat Nginx dapat berupa
alamat konektor lokal atau alamat perantara. Untuk memperoleh IP
pengunjung asli, konfigurasi trusted proxy/real IP harus dilakukan
dengan benar berdasarkan rentang IP Cloudflare dan header yang sesuai.

Jangan mempercayai header `X-Forwarded-For` dari sembarang sumber.
Batasi trusted proxy hanya pada proxy yang benar-benar dipercaya.
Pastikan log dan aplikasi tidak salah menganggap semua header dari
client sebagai IP asli.

### 11.5 HTTPS dan mode SSL

Pada arsitektur ini: - Browser ke Cloudflare menggunakan HTTPS. -
Cloudflare Tunnel membawa request ke `cloudflared`. - Origin lokal dapat
menggunakan HTTP `localhost:80`. - HTTPS pada browser tetap aktif
meskipun origin lokal menggunakan HTTP melalui tunnel.

Untuk koneksi lokal pada satu host, HTTP loopback lazim digunakan. Untuk
origin terpisah atau jaringan yang tidak sepenuhnya dipercaya, evaluasi
HTTPS dan validasi sertifikat origin.

### 11.6 Backup konfigurasi

Backup direktori konfigurasi dan website:

``` bash
sudo tar -czf nginx-backup-$(date +%F).tar.gz \
  /etc/nginx \
  /var/www
```

Simpan backup di lokasi aman di luar VPS atau ke storage terpisah.
Jangan memasukkan secret/token tunnel ke backup yang tidak terenkripsi
atau lokasi publik.

------------------------------------------------------------------------

## 12. Checklist operasional

### Saat menambahkan domain baru

-   [ ] Buat document root atau siapkan aplikasi backend.
-   [ ] Buat file server block Nginx.
-   [ ] Tetapkan `server_name` yang benar.
-   [ ] Tetapkan `root` atau `proxy_pass`.
-   [ ] Buat symlink ke `sites-enabled`.
-   [ ] Jalankan `nginx -t`.
-   [ ] Reload Nginx.
-   [ ] Uji lokal dengan header Host.
-   [ ] Tambahkan Public Hostname pada Cloudflare Tunnel.
-   [ ] Pastikan DNS hostname mengarah ke tunnel.
-   [ ] Uji HTTPS dari jaringan eksternal.
-   [ ] Periksa access/error log jika gagal.

### Saat terjadi website down

-   [ ] Apakah DNS mengarah ke tujuan yang benar?
-   [ ] Apakah Cloudflare Tunnel berstatus Connected/Healthy?
-   [ ] Apakah `cloudflared` aktif?
-   [ ] Apakah Nginx aktif?
-   [ ] Apakah origin lokal merespons?
-   [ ] Apakah server block cocok dengan hostname?
-   [ ] Apakah backend aplikasi aktif?
-   [ ] Apakah ada perubahan firewall atau konfigurasi provider?
-   [ ] Apakah log Nginx dan cloudflared menunjukkan error?

### Saat mengubah Nginx

Selalu gunakan urutan:

``` bash
sudo nginx -t && sudo systemctl reload nginx
```

Jangan restart service secara membabi buta ketika reload cukup. Jika
`nginx -t` gagal, jangan reload sampai error diperbaiki.

------------------------------------------------------------------------

## 13. Rekomendasi pengembangan infrastruktur ABZEN

Dengan satu VPS dan satu named tunnel, beberapa layanan dapat dijalankan
berdasarkan hostname.

  Hostname              Fungsi                Origin yang disarankan
  --------------------- --------------------- -----------------------------------
  `abzen.cloud`         Website utama         Nginx static root
  `www.abzen.cloud`     Alias website utama   Nginx static root
  `gsi.abzen.cloud`     Website GSI           Nginx static root
  `app.abzen.cloud`     Frontend aplikasi     Nginx → frontend/service
  `api.abzen.cloud`     Backend API           Nginx → `127.0.0.1:8000`
  `dev.abzen.cloud`     Development           Nginx → port aplikasi development
  `admin.abzen.cloud`   Panel administrasi    Nginx + Cloudflare Access

Rekomendasi: 1. Gunakan satu Cloudflare Tunnel untuk beberapa hostname
selama kebutuhan dan kapasitasnya sesuai. 2. Jadikan Nginx sebagai satu
titik routing internal untuk aplikasi yang jumlahnya bertambah. 3.
Pisahkan document root dan log setiap website. 4. Bind backend ke
`127.0.0.1` jika hanya diakses melalui Nginx. 5. Gunakan Cloudflare
Access untuk aplikasi administratif atau internal. 6. Buat backup
konfigurasi sebelum perubahan besar. 7. Pantau kapasitas CPU, RAM, disk,
dan koneksi VPS.

------------------------------------------------------------------------

## 14. Referensi resmi

-   Nginx documentation: https://nginx.org/en/docs/
-   Nginx beginner's guide:
    https://nginx.org/en/docs/beginners_guide.html
-   Nginx reverse proxy:
    https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/
-   Cloudflare DNS: https://developers.cloudflare.com/dns/
-   Cloudflare Proxy status:
    https://developers.cloudflare.com/dns/proxy-status/
-   Cloudflare Tunnel:
    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
-   Create a remotely-managed tunnel:
    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel/
-   Cloudflare Tunnel troubleshooting:
    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/troubleshooting/

------------------------------------------------------------------------

## 15. Kesimpulan

Kasus `abzen.cloud` menunjukkan bahwa website dapat dioperasikan dari
VPS dengan IP privat di belakang NAT tanpa membuka inbound port 80/443,
dengan menggunakan Cloudflare Tunnel.

Peran setiap komponen harus dibedakan: - DNS menentukan nama domain dan
tujuan. - Cloudflare Proxy menerima dan memproses trafik web di edge. -
Cloudflare Tunnel menyediakan jalur outbound antara Cloudflare dan
jaringan VPS. - `cloudflared` mempertahankan koneksi tunnel. - Nginx
melayani website dan melakukan routing berdasarkan hostname. - Nginx
reverse proxy meneruskan request ke backend aplikasi jika diperlukan.

Keberhasilan `https://abzen.cloud` dan `https://www.abzen.cloud` dengan
HTTP/2 200 membuktikan jalur utama telah berfungsi. Pola yang sama dapat
digunakan untuk menambahkan website dan aplikasi lain pada VPS yang
sama, dengan konfigurasi DNS, tunnel route, dan server block yang
konsisten.

**Akhir dokumen.**
