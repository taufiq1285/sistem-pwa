/**
 * Forgot Password Page
 * Uses AuthLayout split-panel wrapper.
 * Brand color: maroon #7B1D3A (consistent with landing page & login)
 * Email: bebas (tidak dibatasi domain)
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconLoader2,
  IconMail,
  IconMailCheck,
  IconSend,
  IconShield,
} from "@tabler/icons-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/config/routes.config";
import { cn } from "@/lib/utils";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
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
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      setError(
        (err instanceof Error ? err.message : null) ??
          "Gagal mengirim email reset password. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "pl-9 h-11 rounded-lg bg-white text-body border border-border shadow-sm transition duration-150 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1D3A]/15 focus-visible:border-[#7B1D3A]";

  /* ── Success state ── */
  if (success) {
    return (
      <AuthLayout variant="forgot">
        <div className="space-y-6 text-center animate-[fade-in_300ms_ease_both]">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <IconMailCheck className="size-8" aria-hidden="true" />
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Email terkirim!
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kami telah mengirim link reset password ke{" "}
              <strong className="text-foreground">{email}</strong>. Silakan
              periksa kotak masuk atau folder spam Anda.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-3">
            <Link to={ROUTES.LOGIN} className="block w-full">
              <Button
                variant="outline"
                className="h-11 w-full font-semibold flex items-center justify-center gap-2"
              >
                <IconArrowLeft className="size-4" />
                Kembali ke login
              </Button>
            </Link>

            <p className="text-center text-small text-text-muted">
              Tidak menerima email?{" "}
              <button
                onClick={() => setSuccess(false)}
                className="font-semibold transition-colors hover:underline"
                style={{ color: "#7B1D3A" }}
              >
                Coba kirim lagi
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  /* ── Form state ── */
  return (
    <AuthLayout variant="forgot">
      <div className="space-y-7 animate-[fade-in_300ms_ease_both]">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Lupa password?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Masukkan email Anda. Kami akan kirimkan link untuk reset password.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <Alert
            variant="destructive"
            className="animate-shake border-red-200 bg-red-50 flex gap-3 items-center"
          >
            <IconAlertCircle
              className="size-5 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <AlertDescription className="text-small font-medium text-red-900">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Alamat Email</Label>
            <div className="relative input-wrapper">
              <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <IconMail className="h-4 w-4" aria-hidden="true" />
              </span>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                aria-required="true"
                className={cn(
                  inputCls,
                  error &&
                    "border-red-500 focus-visible:ring-red-500/15 focus-visible:border-red-500",
                )}
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full text-white font-semibold shadow-lg hover:opacity-92 transition-opacity flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, #7B1D3A, #9B2448)",
              boxShadow: "0 4px 20px rgba(123,29,58,0.35)",
            }}
          >
            {loading ? (
              <>
                <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />
                Mengirim...
              </>
            ) : (
              <>
                <IconSend className="size-4" aria-hidden="true" />
                Kirim link reset
              </>
            )}
          </Button>

          {/* Back link */}
          <div className="text-center pt-1">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-2 text-small font-semibold transition-colors hover:underline"
              style={{ color: "#7B1D3A" }}
            >
              <IconArrowLeft className="size-4" />
              Kembali ke halaman masuk
            </Link>
          </div>
        </form>

        {/* Security note */}
        <div
          className="flex items-center gap-2 text-xs text-muted-foreground pt-1"
        >
          <IconShield className="size-3.5 shrink-0" style={{ color: "#7B1D3A" }} />
          <span>Link reset berlaku selama 1 jam setelah dikirim</span>
        </div>
      </div>
    </AuthLayout>
  );
}
