import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import "./auth.css";

export default function AuthPage() {
  const { path = "sign-in" } = useParams();
  const isSignUp = path === "sign-up";
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminSetupToken, setAdminSetupToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isSignUp) await authClient.signUp({ username, password, ...(adminSetupToken ? { adminSetupToken } : {}) });
      else await authClient.signIn({ username, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Autentikasi gagal. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="hadir-auth min-h-screen px-4 py-10 sm:py-16">
    <div className="mx-auto mb-8 max-w-md text-center">
      <div className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-teal-700">HADIR-GSI · PEOPLE & PAYROLL</div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Akses ruang kerja Anda</h1>
      <p className="mt-2 text-sm text-slate-600">Masuk atau buat akun dengan username untuk mengelola kehadiran dan payroll.</p>
    </div>
    <div className="hadir-auth-card mx-auto max-w-md rounded-[28px] border border-teal-100 bg-white p-5 shadow-[0_30px_90px_-38px_rgba(15,118,110,.3)] sm:p-8">
      <h2 className="text-2xl font-semibold text-slate-900">{isSignUp ? "Buat akun" : "Masuk"}</h2>
      <p className="mt-2 text-sm text-slate-500">{isSignUp ? "Gunakan username yang sudah didaftarkan Admin." : "Masukkan username dan password Anda."}</p>
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium text-slate-800">Username
          <input required autoComplete="username" minLength={3} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-teal-600" />
        </label>
        <label className="block text-sm font-medium text-slate-800">Password
          <input required type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={isSignUp ? 6 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-teal-600" />
          {isSignUp && <span className="mt-1 block text-xs font-normal text-slate-500">Minimal 6 karakter.</span>}
        </label>
        {isSignUp && <label className="block text-sm font-medium text-slate-800">Kode setup Admin <span className="font-normal text-slate-500">(khusus Admin pertama)</span>
          <input type="password" autoComplete="off" value={adminSetupToken} onChange={(event) => setAdminSetupToken(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-base outline-none focus:border-teal-600" />
          <span className="mt-1 block text-xs font-normal text-slate-500">Karyawan dapat mengosongkan kolom ini.</span>
        </label>}
        {error && <div role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</div>}
        <button disabled={busy} className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Memproses..." : isSignUp ? "Buat akun" : "Masuk"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        {isSignUp ? "Sudah punya akun? " : "Belum punya akun? "}
        <Link className="font-semibold text-teal-700 underline" to={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>{isSignUp ? "Masuk" : "Daftar"}</Link>
      </p>
    </div>
  </main>;
}
