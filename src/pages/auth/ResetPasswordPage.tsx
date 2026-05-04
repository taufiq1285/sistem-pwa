/**
 * Reset Password Page
 * Public landing page for Supabase password recovery links.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import akbidLogo from "@/assets/akbid-logo-asli.png";
import { PasswordForm } from "@/components/forms/PasswordForm";
import { GlassCard } from "@/components/ui/glass-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ROUTES } from "@/config/routes.config";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSuccess = () => {
    setIsSuccess(true);
    window.setTimeout(() => {
      navigate(ROUTES.LOGIN);
    }, 1800);
  };

  return (
    <div className="akbid-font-body akbid-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FDF8F5] px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-[#7B1D3A]/15 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-72 w-72 rounded-full bg-[#1E293B]/20 blur-3xl" />
      </div>

      <div
        className={`relative w-full max-w-lg transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-[#7B1D3A]/30 via-[#1E293B]/20 to-[#7B1D3A]/25 blur-lg opacity-50" />

        <GlassCard
          intensity="high"
          glow
          className="relative overflow-hidden rounded-3xl border border-[#E8E0D8] bg-white/95 shadow-2xl"
        >
          <div className="relative bg-linear-to-br from-[#0F172A] via-[#1E293B] to-[#7B1D3A] px-6 pb-14 pt-9 text-center sm:px-8 sm:pt-10">
            <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/10" />
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />

            <div className="relative mx-auto mb-6 inline-flex rounded-2xl bg-white/20 p-2.5 backdrop-blur-lg">
              <img
                src={akbidLogo}
                alt="Logo Akademi Kebidanan Mega Buana"
                className="h-14 w-14 rounded-xl bg-white p-1 object-contain"
              />
              <Sparkles className="absolute -right-2 -top-2 h-5 w-5 text-[#E8A5B5]" />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white/85">
                <KeyRound className="h-4 w-4 text-[#E8A5B5]" />
                Pemulihan Password
              </div>
              <h1 className="akbid-font-display text-2xl font-semibold text-white sm:text-3xl">
                Atur Ulang Password
              </h1>
              <p className="mx-auto max-w-sm text-sm text-white/75">
                Masukkan password baru untuk melanjutkan akses ke sistem
                praktikum.
              </p>
            </div>
          </div>

          <div className="px-4 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-7 space-y-5 rounded-2xl border border-[#E8E0D8] bg-[#FDF8F5] p-5 shadow-lg sm:-mt-8 sm:p-6">
              {isSuccess && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription>
                    Password berhasil diperbarui. Anda akan diarahkan ke halaman
                    login.
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="border-[#E8E0D8] bg-white text-[#334155]">
                <ShieldCheck className="h-4 w-4 text-[#7B1D3A]" />
                <AlertDescription>
                  Gunakan password baru yang aman. Setelah berhasil, login
                  online dan offline akan memakai password terbaru ini.
                </AlertDescription>
              </Alert>

              <PasswordForm onSuccess={handleSuccess} />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#E8E0D8] bg-[#F1EBE4] px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-[#7B1D3A]"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </Link>
            <span className="text-slate-500">
              Link reset ini mengikuti sesi pemulihan dari email Anda.
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
