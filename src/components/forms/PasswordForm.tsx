/**
 * Modern password update form with input icons, show/hide toggles,
 * inline validation, password strength indicator, and cohesive brand design tokens.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconAlertCircle,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconLock,
  IconLockCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  passwordUpdateSchema,
  type PasswordUpdateFormData,
} from "@/lib/validations/auth.schema";
import { cn } from "@/lib/utils";

interface PasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

function getPasswordStrength(pass: string) {
  if (!pass) return { score: 0, label: "", colorClass: "", textClass: "" };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: "Lemah",
      colorClass: "bg-red-500",
      textClass: "text-red-500",
    };
  } else if (score === 2) {
    return {
      score: 2,
      label: "Cukup",
      colorClass: "bg-yellow-500",
      textClass: "text-yellow-600",
    };
  } else if (score === 3) {
    return {
      score: 3,
      label: "Kuat",
      colorClass: "bg-blue-500",
      textClass: "text-blue-600",
    };
  } else {
    return {
      score: 4,
      label: "Sangat Kuat",
      colorClass: "bg-emerald-500",
      textClass: "text-emerald-600",
    };
  }
}

export function PasswordForm({ onSuccess, onCancel }: PasswordFormProps) {
  const { updatePassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const passwordValue = watch("password") || "";

  const onSubmit = async (data: PasswordUpdateFormData) => {
    try {
      setError(null);
      setSuccess(null);

      await updatePassword(data.password);

      setSuccess("Password berhasil diubah!");
      reset();

      setTimeout(() => {
        onSuccess?.();
      }, 800);
    } catch (err: unknown) {
      let errorMessage = "Gagal memperbarui password. Silakan coba lagi.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const fieldClassName =
    "pl-9 pr-10 h-11 rounded-lg bg-white text-body border border-border shadow-sm transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/15 focus-visible:border-[#7c3aed] focus-visible:outline-hidden";

  const strength = getPasswordStrength(passwordValue);

  const isExpired =
    error &&
    (error.toLowerCase().includes("expire") ||
      error.toLowerCase().includes("kadaluarsa") ||
      error.toLowerCase().includes("token") ||
      error.toLowerCase().includes("invalid"));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Success Alert */}
      {success && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 flex gap-3 items-center">
          <IconCheck
            className="size-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <AlertDescription className="text-small font-medium">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <div className="space-y-2">
          {isExpired ? (
            <Alert
              variant="destructive"
              className="animate-shake border-red-200 bg-red-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center p-4"
            >
              <div className="flex gap-2 items-center">
                <IconAlertCircle
                  className="size-5 shrink-0 text-red-600"
                  aria-hidden="true"
                />
                <AlertDescription className="text-small font-medium text-red-900">
                  Link sudah kadaluarsa. Minta link baru.
                </AlertDescription>
              </div>
              <Link to="/forgot-password" className="sm:ml-auto">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  Minta link baru
                </Button>
              </Link>
            </Alert>
          ) : (
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
        </div>
      )}

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="field-new-password">Password Baru</Label>
        <div className="relative input-wrapper">
          <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            <IconLock className="h-4 w-4" aria-hidden="true" />
          </span>
          <Input
            id="field-new-password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 6 karakter"
            disabled={isSubmitting}
            autoComplete="new-password"
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? "field-new-password-error" : undefined
            }
            className={cn(
              fieldClassName,
              errors.password &&
                "border-red-500 focus-visible:ring-red-500/15 focus-visible:border-red-500",
            )}
            {...register("password")}
          />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-150"
            aria-label={
              showPassword ? "Sembunyikan password" : "Tampilkan password"
            }
          >
            {showPassword ? (
              <IconEyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <IconEye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Strength Indicator */}
        {passwordValue && (
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-4 gap-1.5 h-1.5">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "h-full rounded-full transition-colors duration-300",
                    index <= strength.score
                      ? strength.colorClass
                      : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
              ))}
            </div>
            <p className={cn("text-xs font-semibold mt-1", strength.textClass)}>
              Kekuatan Password: {strength.label}
            </p>
          </div>
        )}

        {errors.password && (
          <p
            id="field-new-password-error"
            role="alert"
            className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
          >
            <IconAlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="field-confirm-password">Konfirmasi Password Baru</Label>
        <div className="relative input-wrapper">
          <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            <IconLock className="h-4 w-4" aria-hidden="true" />
          </span>
          <Input
            id="field-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Ketik ulang password baru"
            disabled={isSubmitting}
            autoComplete="new-password"
            aria-required="true"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword
                ? "field-confirm-password-error"
                : undefined
            }
            className={cn(
              fieldClassName,
              errors.confirmPassword &&
                "border-red-500 focus-visible:ring-red-500/15 focus-visible:border-red-500",
            )}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-150"
            aria-label={
              showConfirmPassword
                ? "Sembunyikan password"
                : "Tampilkan password"
            }
          >
            {showConfirmPassword ? (
              <IconEyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <IconEye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p
            id="field-confirm-password-error"
            role="alert"
            className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
          >
            <IconAlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !!success}
          aria-busy={isSubmitting}
          className="flex-1 h-11 bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white font-semibold shadow-lg hover:opacity-95 transition-opacity"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />
              Menyimpan...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <IconLockCheck className="size-4" aria-hidden="true" />
              Simpan password baru
            </span>
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 border-border hover:bg-slate-50 text-text-secondary"
          >
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
