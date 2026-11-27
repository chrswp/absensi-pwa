import { Link } from "react-router-dom";
import { Clock3, LockKeyhole } from "lucide-react";

export default function LoginScreen() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f3f8f6] px-4 py-10">
    <section className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-[0_30px_90px_-38px_rgba(15,118,110,.3)] sm:p-10">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white"><Clock3 size={26}/></div>
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Hadir-GSI · People & Payroll</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">Masuk ke ruang kerja</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Gunakan akun Neon Auth perusahaan untuk melanjutkan.</p>
      <Link to="/auth/sign-in" className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 text-sm font-bold text-white transition hover:bg-teal-800"><LockKeyhole size={16}/>Masuk dengan Neon Auth</Link>
      <p className="mt-5 text-xs text-slate-500">Belum punya akun? <Link to="/auth/sign-up" className="font-bold text-teal-700 hover:text-teal-900">Daftar di sini</Link></p>
    </section>
  </main>;
}
