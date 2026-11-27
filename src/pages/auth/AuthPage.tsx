import { AuthView } from "@neondatabase/auth/react";
import { useParams } from "react-router-dom";
import "./auth.css";

export default function AuthPage() {
  const { path = "sign-in" } = useParams();
  return <main className="hadir-auth min-h-screen px-4 py-10 sm:py-16">
    <div className="mx-auto mb-8 max-w-md text-center">
      <div className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-teal-700">Hadir-GSI · People & Payroll</div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Akses ruang kerja Anda</h1>
      <p className="mt-2 text-sm text-slate-600">Masuk atau daftarkan akun untuk mengelola kehadiran dan payroll.</p>
    </div>
    <div className="hadir-auth-card mx-auto max-w-md rounded-[28px] border border-teal-100 bg-white p-5 shadow-[0_30px_90px_-38px_rgba(15,118,110,.3)] sm:p-8">
      <AuthView path={path} redirectTo="/" />
    </div>
  </main>;
}
