/**
 * Forgot Password Page
 * Page for password reset request
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import akbidLogo from "@/assets/akbid-logo-asli.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/config/routes.config";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Silakan masukkan alamat email Anda");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(
        err.message ||
          "Gagal mengirim email reset password. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="akbid-font-body akbid-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FDF8F5] px-4 py-8 sm:px-6 sm:py-10">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-[#7B1D3A]/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#1E293B]/20 blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg">
          <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-[#7B1D3A]/30 via-[#1E293B]/20 to-[#7B1D3A]/25 blur-lg" />
          <GlassCard
            intensity="high"
            glow
            className="relative overflow-hidden rounded-3xl border border-[#E8E0D8] bg-white/95 shadow-2xl"
          >
            <CardHeader className="space-y-4 bg-linear-to-br from-[#0F172A] via-[#1E293B] to-[#7B1D3A] px-6 py-8 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <img src={akbidLogo} alt="Logo Akademi Kebidanan Mega Buana" className="h-12 w-12 rounded-xl bg-white p-1 object-contain" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold text-white/80">
                  <Sparkles className="h-3.5 w-3.5 text-[#E8A5B5]" />
                  Tautan reset berhasil dikirim
                </div>
                <CardTitle className="akbid-font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Cek Email Anda
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-[15px] text-white/75 sm:text-base">
                  Kami telah mengirim link reset password ke{" "}
                  <strong>{email}</strong>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-6 py-6 sm:px-8">
              <Alert className="border-[#C7D2FE] bg-[#EEF2FF] text-[#1E293B]">
                <ShieldCheck className="h-4 w-4 text-[#7B1D3A]" />
                <AlertDescription className="text-[15px] leading-relaxed">
                  Klik tautan pada email untuk mengatur ulang password Anda.
                  Link akan kedaluwarsa dalam 1 jam.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                <Link to={ROUTES.LOGIN}>
                  <ButtonEnhanced
                    variant="outline"
                    className="h-11 w-full border-[#E8E0D8] bg-[#FDF8F5] text-[15px] font-semibold text-[#7B1D3A] hover:bg-[#F1EBE4]"
                    leadingIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Kembali ke Login
                  </ButtonEnhanced>
                </Link>
              </div>

              <div className="text-center text-[15px] text-muted-foreground">
                Tidak menerima email? Periksa folder spam atau{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="font-semibold text-[#7B1D3A] transition-colors hover:text-[#9B2448]"
                >
                  coba lagi
                </button>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="akbid-font-body akbid-auth-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FDF8F5] px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#7B1D3A]/15 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#1E293B]/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-128 w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0F172A]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-[#7B1D3A]/30 via-[#1E293B]/20 to-[#7B1D3A]/25 blur-lg" />
        <GlassCard
          intensity="high"
          glow
          className="relative overflow-hidden rounded-3xl border border-[#E8E0D8] bg-white/95 shadow-2xl"
        >
          <CardHeader className="space-y-4 bg-linear-to-br from-[#0F172A] via-[#1E293B] to-[#7B1D3A] px-6 py-8 text-center sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <img src={akbidLogo} alt="Logo Akademi Kebidanan Mega Buana" className="h-12 w-12 rounded-xl bg-white p-1 object-contain" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[13px] font-semibold text-white/80">
                <Mail className="h-3.5 w-3.5 text-[#E8A5B5]" />
                Pemulihan akses akun
              </div>
              <CardTitle className="akbid-font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Lupa Password?
              </CardTitle>
              <CardDescription className="mx-auto max-w-sm text-[15px] text-white/75 sm:text-base">
                Masukkan email Anda dan kami akan mengirimkan link untuk
                mengatur ulang password.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-destructive/20 bg-destructive/5"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-[#0F172A]">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11 border-[#E8E0D8] bg-[#FDF8F5] text-[15px] focus-visible:border-[#7B1D3A] focus-visible:ring-[#7B1D3A]"
                />
              </div>

              <ButtonEnhanced
                type="submit"
                className="h-11 w-full bg-[#7B1D3A] text-[15px] font-semibold text-white hover:bg-[#9B2448]"
                loading={loading}
                loadingText="Mengirim..."
                leadingIcon={<Mail className="h-4 w-4" />}
              >
                Kirim Link Reset
              </ButtonEnhanced>

              <div className="text-center">
                <Link to={ROUTES.LOGIN}>
                  <ButtonEnhanced
                    variant="ghost"
                    className="h-11 w-full text-[15px] font-medium text-slate-600 hover:bg-[#F1EBE4] hover:text-[#7B1D3A]"
                    leadingIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Kembali ke Login
                  </ButtonEnhanced>
                </Link>
              </div>
            </form>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}

