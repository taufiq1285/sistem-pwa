/**
 * Reset Password Page
 * Uses AuthLayout split-panel wrapper.
 * Brand color: maroon #7B1D3A (consistent with landing page & login)
 * Logic: unchanged — PasswordForm handles all validation & submission
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PasswordForm } from "@/components/forms/PasswordForm";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ROUTES } from "@/config/routes.config";
import {
  IconArrowLeft,
  IconCircleCheck,
  IconShieldCheck,
} from "@tabler/icons-react";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setIsSuccess(true);
    window.setTimeout(() => {
      navigate(ROUTES.LOGIN, { replace: true });
    }, 3000);
  };

  return (
    <AuthLayout variant="reset">
      <div className="space-y-7 animate-[fade-in_300ms_ease_both]">
        {isSuccess ? (
          /* ── Success state ── */
          <div className="space-y-6 text-center animate-[fade-in_300ms_ease_both] py-4">
            <div className="flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <IconCircleCheck className="size-8" aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Password berhasil diubah!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Password Anda telah diperbarui. Anda akan diarahkan ke halaman
                login dalam 3 detik...
              </p>
            </div>
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:underline"
              style={{ color: "#7B1D3A" }}
            >
              <IconArrowLeft className="size-4" />
              Ke halaman login sekarang
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Buat password baru
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Password baru harus berbeda dari yang sebelumnya.
              </p>
            </div>

            {/* Security info — maroon accent */}
            <Alert
              className="flex gap-3 items-start p-4"
              style={{
                background: "rgba(123,29,58,0.05)",
                borderColor: "rgba(123,29,58,0.18)",
              }}
            >
              <IconShieldCheck
                className="size-5 shrink-0 mt-0.5"
                style={{ color: "#7B1D3A" }}
                aria-hidden="true"
              />
              <AlertDescription className="text-small leading-relaxed text-foreground/70">
                Gunakan password baru yang aman. Setelah berhasil diubah, login
                online maupun offline di perangkat ini akan menggunakan password
                baru ini.
              </AlertDescription>
            </Alert>

            {/* PasswordForm — logika tidak diubah */}
            <PasswordForm onSuccess={handleSuccess} />

            {/* Footer */}
            <div className="border-t border-border pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-small">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 font-semibold transition-colors hover:underline"
                style={{ color: "#7B1D3A" }}
              >
                <IconArrowLeft className="size-4" />
                Kembali ke halaman masuk
              </Link>
              <span className="text-text-muted">
                Sesi pemulihan dari email Anda.
              </span>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
