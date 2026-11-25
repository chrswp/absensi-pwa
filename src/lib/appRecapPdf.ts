import { jsPDF } from "jspdf";

const ink: [number, number, number] = [31, 48, 56];
const teal: [number, number, number] = [15, 118, 110];
const muted: [number, number, number] = [103, 121, 127];
const pale: [number, number, number] = [235, 247, 244];

export function downloadAppRecapPdf() {
  const pdf = new jsPDF({ format: "a4", unit: "mm" });
  const pageWidth = 210;
  const pageHeight = 297;
  const left = 18;
  const right = 18;
  const contentWidth = pageWidth - left - right;
  let y = 34;

  const header = (title: string, subtitle: string) => {
    pdf.setFillColor(...teal);
    pdf.rect(0, 0, pageWidth, 9, "F");
    pdf.setTextColor(...teal);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(21);
    pdf.text(title, left, 25);
    pdf.setTextColor(...muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(subtitle, left, 31);
    pdf.setDrawColor(220, 231, 229);
    pdf.line(left, 37, pageWidth - right, 37);
    y = 46;
  };
  const newPage = (title: string, subtitle: string) => {
    pdf.addPage();
    header(title, subtitle);
  };
  const ensure = (height: number) => {
    if (y + height > pageHeight - 20) newPage("HadirUpah | Rekap Aplikasi", "Dokumen produk dan alur operasional");
  };
  const section = (title: string) => {
    ensure(13);
    y += 3;
    pdf.setTextColor(...teal);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(title, left, y);
    y += 7;
  };
  const paragraph = (text: string) => {
    pdf.setTextColor(...ink);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    const lines = pdf.splitTextToSize(text, contentWidth) as string[];
    ensure(lines.length * 5 + 3);
    pdf.text(lines, left, y);
    y += lines.length * 5 + 3;
  };
  const bullets = (items: string[]) => {
    for (const item of items) {
      pdf.setTextColor(...teal);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.text("-", left + 1, y);
      pdf.setTextColor(...ink);
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(item, contentWidth - 7) as string[];
      ensure(lines.length * 5 + 2);
      pdf.text(lines, left + 7, y);
      y += lines.length * 5 + 2;
    }
    y += 2;
  };
  const flow = (steps: string[]) => {
    for (let index = 0; index < steps.length; index++) {
      const lines = pdf.splitTextToSize(`${index + 1}. ${steps[index]}`, contentWidth - 9) as string[];
      const height = Math.max(12, lines.length * 4.5 + 7);
      ensure(height + 3);
      pdf.setFillColor(...pale);
      pdf.roundedRect(left, y - 4, contentWidth, height, 2, 2, "F");
      pdf.setFillColor(...teal);
      pdf.circle(left + 5, y + 1, 2.2, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text(String(index + 1), left + 4.1, y + 2.2);
      pdf.setTextColor(...ink);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(lines, left + 10, y + 1);
      y += height + 3;
    }
    y += 2;
  };
  const wireBox = (title: string, rows: string[]) => {
    const rowHeights = rows.map((row) => (pdf.splitTextToSize(row, contentWidth - 14) as string[]).length * 4 + 4);
    const total = 13 + rowHeights.reduce((sum, height) => sum + height, 0);
    ensure(total + 5);
    pdf.setFillColor(249, 251, 250);
    pdf.setDrawColor(211, 228, 224);
    pdf.roundedRect(left, y - 4, contentWidth, total, 3, 3, "FD");
    pdf.setFillColor(...teal);
    pdf.roundedRect(left, y - 4, contentWidth, 9, 3, 3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(title, left + 5, y + 2);
    let rowY = y + 11;
    pdf.setTextColor(...ink);
    pdf.setFont("courier", "normal");
    pdf.setFontSize(8);
    rows.forEach((row, index) => {
      const lines = pdf.splitTextToSize(row, contentWidth - 14) as string[];
      pdf.text(lines, left + 6, rowY);
      rowY += rowHeights[index];
    });
    y += total + 7;
  };

  pdf.setFillColor(...teal);
  pdf.rect(0, 0, pageWidth, 90, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.circle(179, 36, 20, "F");
  pdf.setTextColor(...teal);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text("HU", 170, 42);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text("DOKUMEN PRODUK", left, 30);
  pdf.setFontSize(30);
  pdf.text("HadirUpah", left, 48);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(13);
  pdf.text("Rekap fitur, halaman, wireframe, dan alur kerja", left, 59);
  pdf.setFontSize(9);
  pdf.text("Versi demo lokal | 2025", left, 73);
  y = 111;
  section("Gambaran singkat");
  paragraph("HadirUpah adalah aplikasi web mobile-first untuk membantu HR dan karyawan mengelola kehadiran, permohonan izin/cuti, serta informasi pengupahan. Aplikasi memiliki dua peran: satu akun Admin/HR untuk pengelolaan tim dan akun masing-masing karyawan untuk aktivitas pribadi.");
  section("Cakupan dokumen");
  bullets(["Fitur dan hak akses menurut peran.", "Peta halaman serta wireframe tekstual.", "Workflow login, absensi, pengajuan, pengelolaan akun, dan penggajian.", "Aturan hitung upah dan batasan versi demo/PWA."]);

  newPage("1. Fitur dan hak akses", "Apa yang dapat dilakukan oleh HR dan karyawan");
  section("Admin / HR");
  bullets(["Dashboard HR: jumlah karyawan, kehadiran hari ini, pengajuan menunggu, total upah bulanan, dan ringkasan status hadir.", "Kelola data karyawan: identitas, username/password awal, jabatan, upah, insentif, jam dan hari kerja, nomor telepon, email, kontak darurat, serta rekening bank.", "Kelola akun demo karyawan dan reset password akun ke password awal 1234.", "Tinjau seluruh permohonan, lalu setujui atau tolak.", "Lihat penggajian seluruh tim, buat slip gaji berbagi, serta membagikan bukti transfer berbasis ringkasan slip."]);
  section("Karyawan");
  bullets(["Clock in dan clock out dengan selfie, timestamp, lokasi GPS, alamat geocoding, dan koordinat.", "Bagikan bukti absensi menggunakan fitur berbagi perangkat.", "Lihat akumulasi upah hari ini dan breakdown upah per tanggal.", "Ajukan izin, sakit, datang terlambat, pulang awal, atau cuti; pantau status persetujuan.", "Lihat ringkasan gaji dan bagikan slip yang tersedia."]);
  section("Komponen kehadiran dan upah");
  bullets(["Jam kerja awal default 07.00-17.00; hari kerja default Senin-Sabtu.", "Insentif per hari dapat disetel untuk kerja pada hari Minggu atau hari libur nasional.", "Upah harian dihitung sebagai upah bulanan dibagi 26.", "Upah lembur per jam menggunakan rumus upah bulanan dibagi 173; estimasi lembur memakai waktu pulang melewati jam selesai kerja."]);

  newPage("2. Peta halaman", "Navigasi utama dan tujuan tiap layar");
  wireBox("LOGIN", ["HadirUpah | Username | Password | Masuk", "Akun demo: admin / 1234, user-demo / 1234"]);
  wireBox("ADMIN / HR - SIDEBAR", ["Ringkasan | Pengajuan | Penggajian | Karyawan", "Ringkasan: KPI tim + status kehadiran", "Pengajuan: daftar permohonan + setujui/tolak", "Penggajian: slip dan daftar upah tim", "Karyawan: data akun, profil, dan upah"]);
  wireBox("KARYAWAN - MENU HAMBURGER", ["Ringkasan | Absensi | Pengajuan | Upah harian | Penggajian", "Ringkasan: status kerja + akumulasi upah hari ini", "Absensi: selfie + GPS + clock in/out", "Pengajuan: status permohonan", "Upah harian: rincian per tanggal"]);
  wireBox("MODAL TAMBAH KARYAWAN (HR)", ["Akun: username + password awal", "Profil: nama, jabatan, telepon, email, kontak darurat", "Bank: nama bank + nomor rekening", "Kompensasi: bulanan + insentif hari libur/Minggu", "Jadwal: jam mulai/selesai + pilihan hari kerja"]);

  newPage("3. Wireframe ringkas", "Susunan konten dari bagian atas ke bawah");
  wireBox("LOGIN - MOBILE / DESKTOP", ["[Logo HadirUpah]", "[Masuk ke akun Anda]", "[Username_________________]", "[Password_________________] [Masuk]", "[Info akun demo] | [Panel nilai produk di desktop]"]);
  wireBox("DASHBOARD HR", ["[Header: Menu] [Tanggal] [Akun HR]", "[Total karyawan] [Hadir] [Menunggu] [Total upah]", "[Status kehadiran tim - nama, jabatan, status, jam]", "[Menu: Pengajuan | Penggajian | Karyawan]"]);
  wireBox("DASHBOARD KARYAWAN", ["[Header: Menu] [Sapaan] [Akun]", "[Jadwal] [Clock in] [Clock out]", "[Selfie] [Lokasi/alamat + koordinat] [Bagikan bukti]", "[Akumulasi upah hari ini] [Pengajuan saya]"]);
  wireBox("DECK MODAL PENGAJUAN", ["[Buat pengajuan] [Tutup]", "[Jenis: Izin / Sakit / Terlambat / Pulang awal / Cuti]", "[Tanggal] [Keterangan] [Kirim pengajuan]"]);

  newPage("4. Workflow operasional", "Urutan penggunaan sesuai peran");
  section("Workflow login dan HR");
  flow(["Pengguna masuk menggunakan akun demo atau akun karyawan yang dibuat HR.", "Admin/HR masuk ke dashboard HR; karyawan masuk ke dashboard pribadinya.", "HR menambahkan karyawan, mengatur identitas, username/password awal, kompensasi, rekening, dan jadwal.", "HR meninjau daftar absensi serta pengajuan, kemudian menyetujui atau menolak permohonan.", "HR membuka Penggajian untuk melihat angka tim dan membagikan slip/ringkasan transfer."]);
  section("Workflow karyawan");
  flow(["Buka Absensi, ambil selfie, dan izinkan akses lokasi.", "Aplikasi mengambil koordinat GPS lalu meminta alamat melalui layanan geocoding.", "Tekan Clock in; timestamp dan bukti absensi dicatat. Saat selesai, tekan Clock out.", "Bagikan bukti absensi atau buka Upah harian untuk rincian berdasarkan tanggal.", "Untuk izin/cuti, buka menu hamburger, pilih Buat pengajuan, isi jenis/tanggal/keterangan, lalu kirim.", "Pantau hasil keputusan HR pada halaman Pengajuan."]);

  newPage("5. Logika data dan batasan", "Keterangan penting untuk penggunaan demo");
  section("Ringkasan perhitungan");
  bullets(["Upah harian = upah bulanan / 26.", "Tarif lembur per jam = upah bulanan / 173.", "Estimasi lembur diakumulasi dari waktu clock out yang melewati jam selesai kerja karyawan.", "Insentif harian berlaku berdasarkan nominal yang diatur untuk karyawan saat bekerja pada hari Minggu/hari non-kerja terjadwal; kalender tanggal libur nasional belum otomatis terhubung.", "Dashboard HR menampilkan total upah bulanan dasar; komponen lain memerlukan verifikasi payroll sebelum pembayaran aktual."]);
  section("Penyimpanan, keamanan, dan PWA");
  bullets(["Versi saat ini adalah demo tanpa backend; akun, password, absensi, pengajuan, dan profil disimpan di localStorage browser.", "Data tidak tersinkron antarpengguna/perangkat dan dapat hilang jika data browser dibersihkan.", "Password demo disimpan lokal dan bukan autentikasi aman untuk penggunaan produksi. Jangan gunakan data rekening atau identitas nyata pada demo.", "PWA menyediakan manifest, ikon, dan service worker untuk instalasi serta cache shell saat offline setelah aset dimuat.", "Akses GPS memerlukan izin browser; alamat geocoding membutuhkan koneksi internet. Fitur berbagi bergantung dukungan perangkat/browser."]);
  section("Perlu dipersiapkan sebelum produksi");
  bullets(["Backend database dan autentikasi berotorisasi per peran.", "Penyimpanan aman untuk foto absensi dan data personal/rekening.", "Sumber kalender hari libur nasional dan validasi aturan payroll.", "Audit log, kebijakan retensi data, backup, dan proteksi privasi."]);

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setDrawColor(220, 231, 229);
    pdf.line(left, pageHeight - 14, pageWidth - right, pageHeight - 14);
    pdf.setTextColor(...muted);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("HadirUpah | Dokumen rekap aplikasi", left, pageHeight - 8);
    pdf.text(`${page} / ${pages}`, pageWidth - right, pageHeight - 8, { align: "right" });
  }
  pdf.save("HadirUpah-Rekap-Aplikasi.pdf");
}
