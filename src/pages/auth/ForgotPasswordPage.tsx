/**
 * Forgot Password Page
 * Page for password reset request
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
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
        err.message || "Gagal mengirim email reset password. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-background via-muted to-primary/5 px-4 py-8 sm:px-6 sm:py-10">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg">
          <div className="absolute -inset-1 rounded-4xl-linear-to-r from-blue-700/40 via-sky-500/30 to-amber-400/40 blur-lg" />
          <GlassCard
            intensity="high"
            glow
            className="relative overflow-hidden rounded-4xl border border-white/20 bg-background/85 shadow-2xl"
          >
            <CardHeader className="space-y-4 bg-linear-to-br from-blue-800 via-blue-700 to-sky-700 px-6 py-8 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <CheckCircle2 className="h-9 w-9 text-emerald-300" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-blue-50">
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  Tautan reset berhasil dikirim
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Cek Email Anda
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-sm text-blue-100 sm:text-base">
                  Kami telah mengirim link reset password ke <strong>{email}</strong>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-6 py-6 sm:px-8">
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                  Klik tautan pada email untuk mengatur ulang password Anda. Link
                  akan kedaluwarsa dalam 1 jam.
                </AlertDescription>
              </Alert>

              <div className="grid gap-3">
                <Link to={ROUTES.LOGIN}>
                  <ButtonEnhanced
                    variant="outline"
                    className="h-11 w-full border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    leadingIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Kembali ke Login
                  </ButtonEnhanced>
                </Link>
              </div>

              <div className="text-center text-sm text-slate-600">
                Tidak menerima email? Periksa folder spam atau{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="font-semibold text-blue-700 transition-colors hover:text-blue-800"
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-background via-muted to-primary/5 px-4 py-8 sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-128 w-lg -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="absolute -inset-1 rounded-4xl bg-linear-to-r from-blue-700/40 via-sky-500/30 to-amber-400/40 blur-lg" />
        <GlassCard
          intensity="high"
          glow
          className="relative overflow-hidden rounded-4xl border border-white/20 bg-background/85 shadow-2xl"
        >
          <CardHeader className="space-y-4 bg-linear-to-br from-blue-800 via-blue-700 to-sky-700 px-6 py-8 text-center sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <KeyRound className="h-9 w-9 text-white" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-blue-50">
                <Mail className="h-3.5 w-3.5 text-amber-200" />
                Pemulihan akses akun
              </div>
              <CardTitle className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Lupa Password?
              </CardTitle>
              <CardDescription className="mx-auto max-w-sm text-sm text-blue-100 sm:text-base">
                Masukkan email Anda dan kami akan mengirimkan link untuk
                mengatur ulang password.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
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
                  className="h-11 border-blue-100 bg-white/90 focus-visible:ring-blue-500"
                />
              </div>

              <ButtonEnhanced
                type="submit"
                className="h-11 w-full shadow-lg shadow-primary/20"
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
                    className="h-11 w-full text-slate-600 hover:bg-blue-50 hover:text-blue-800"
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
