/**
 * Reset Password Page component using the shared split-panel authentication layout.
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

/**
 * ResetPasswordPage component.
 */
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
                Password Anda telah diperbarui. Menghubungkan kembali, Anda akan
                diarahkan ke halaman login dalam 3 detik...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Buat password baru
                <span className="sr-only">Atur Ulang Password</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Password baru harus berbeda dari yang sebelumnya.
              </p>
            </div>

            <Alert className="border-indigo-100 bg-indigo-50/40 text-[#334155] flex gap-3 items-start p-4">
              <IconShieldCheck
                className="size-5 shrink-0 text-indigo-700 mt-0.5"
                aria-hidden="true"
              />
              <AlertDescription className="text-small leading-relaxed">
                Gunakan password baru yang aman. Setelah berhasil diubah, login
                online maupun offline di perangkat ini akan menggunakan password
                baru ini.
              </AlertDescription>
            </Alert>

            <PasswordForm onSuccess={handleSuccess} />

            <div className="border-t border-border pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-small">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 font-semibold text-[#7c3aed] hover:underline"
              >
                <IconArrowLeft className="size-4" />← Kembali ke halaman masuk
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
