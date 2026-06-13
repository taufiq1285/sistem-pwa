/**
 * Modern login form with inline validation, offline PWA handling, and role-safe auth flow.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconLock,
  IconLogin,
  IconMail,
  IconWifiOff,
  IconX,
} from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOfflineContext } from "@/context/OfflineContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { loginSchema } from "@/lib/validations/auth.schema";
import { cn } from "@/lib/utils";

// Extend schema for local client-only rememberMe checkbox
const localLoginSchema = loginSchema.extend({
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof localLoginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

const LOCK_SECONDS = 30;
const MAX_FAILED_ATTEMPTS = 5;

function getFieldState(hasValue: boolean, hasError: boolean) {
  if (hasError) return "error";
  if (hasValue) return "valid";
  return "idle";
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const { isOffline } = useOfflineContext();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(localLoginSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const email = watch("email");
  const password = watch("password");
  const isInstitutionEmail = email.toLowerCase().endsWith("@akmb.ac.id");
  const remainingLockSeconds = lockedUntil
    ? Math.max(0, Math.ceil((lockedUntil - now) / 1000))
    : 0;
  const isLocked = remainingLockSeconds > 0;

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!lockedUntil) return undefined;

    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        setFailedAttempts(0);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const fieldClassName = useMemo(
    () =>
      "pl-9 pr-10 h-11 rounded-lg bg-white text-body border border-border shadow-sm transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/15 focus-visible:border-[#7c3aed] focus-visible:outline-hidden",
    [],
  );

  const onSubmit = async (data: LoginFormData) => {
    if (isLocked) return;

    try {
      setError(null);
      setIsSuccess(false);

      await login({
        email: data.email,
        password: data.password,
      });

      setIsSuccess(true);
      setFailedAttempts(0);
      onSuccess?.();
    } catch (err: unknown) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCK_SECONDS * 1000);
      }

      setError(
        err instanceof Error
          ? err.message
          : "Login gagal. Silakan periksa kembali kredensial Anda.",
      );
    }
  };

  const emailState = getFieldState(
    touchedFields.email && !!email,
    !!errors.email,
  );
  const passwordState = getFieldState(
    touchedFields.password && !!password,
    !!errors.password,
  );

  const isDisabled = isSubmitting || isLocked || isSuccess;

  return (
    <div className="space-y-7 animate-[fade-in_300ms_ease_both]">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Masuk ke akun Anda
        </h1>
        <p className="text-sm text-muted-foreground">
          Akses dashboard praktikum sesuai role Anda di SiPraktik AKMB.
        </p>
      </div>

      {isOffline && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-950 flex gap-3 items-center">
          <IconWifiOff
            className="size-5 shrink-0 text-amber-700"
            aria-hidden="true"
          />
          <AlertDescription className="text-small">
            Mode offline — gunakan kredensial terakhir
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert
          variant="destructive"
          className="animate-shake border-red-200 bg-red-50 flex gap-3 items-center animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <IconAlertCircle
            className="size-5 shrink-0 text-red-600"
            aria-hidden="true"
          />
          <AlertDescription className="text-small font-medium text-red-900">
            {isLocked
              ? `Terlalu banyak percobaan. Coba lagi dalam ${remainingLockSeconds} detik.`
              : error}
          </AlertDescription>
        </Alert>
      )}

      {isSuccess && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 flex gap-3 items-center">
          <IconCheck
            className="size-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <AlertDescription className="text-small font-medium">
            Berhasil! Mengarahkan ke dashboard...
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="field-login-email">Email</Label>
          <div className="relative input-wrapper">
            <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <IconMail className="h-4 w-4" aria-hidden="true" />
            </span>
            <Input
              id="field-login-email"
              type="email"
              placeholder="nama@akmb.ac.id"
              autoComplete="email"
              disabled={isDisabled}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={cn(
                errors.email && "field-login-email-error",
                isInstitutionEmail && "field-login-email-hint",
              )}
              className={cn(
                fieldClassName,
                emailState === "error" &&
                  "input-error border-red-500 focus-visible:ring-red-500/15 focus-visible:border-red-500",
                emailState === "valid" &&
                  "border-emerald-500 focus-visible:ring-emerald-500/15 focus-visible:border-emerald-500",
              )}
              {...register("email")}
              ref={(element) => {
                register("email").ref(element);
                emailRef.current = element;
              }}
            />
            {emailState === "error" && (
              <span className="absolute inset-y-0 right-3 flex items-center">
                <IconX className="h-4 w-4 text-red-600" aria-hidden="true" />
              </span>
            )}
            {emailState === "valid" && (
              <span className="absolute inset-y-0 right-3 flex items-center">
                <IconCheck
                  className="h-4 w-4 text-emerald-600"
                  aria-hidden="true"
                />
              </span>
            )}
          </div>
          {errors.email && (
            <p
              id="field-login-email-error"
              role="alert"
              className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
            >
              <IconAlertCircle
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {errors.email.message}
            </p>
          )}
          {isInstitutionEmail && !errors.email && (
            <p
              id="field-login-email-hint"
              className="text-small font-medium text-blue-700 flex items-center gap-1 mt-1.5 animate-field-error"
            >
              <IconCheck
                className="size-4 shrink-0 text-blue-600"
                aria-hidden="true"
              />
              Email institusi terdeteksi ✓
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="field-login-password">Password</Label>
          <div className="relative input-wrapper">
            <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <IconLock className="h-4 w-4" aria-hidden="true" />
            </span>
            <Input
              id="field-login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              autoComplete="current-password"
              disabled={isDisabled}
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "field-login-password-error" : undefined
              }
              className={cn(
                fieldClassName,
                passwordState === "error" &&
                  "input-error border-red-500 focus-visible:ring-red-500/15 focus-visible:border-red-500",
                passwordState === "valid" &&
                  "border-emerald-500 focus-visible:ring-emerald-500/15 focus-visible:border-emerald-500",
              )}
              {...register("password")}
            />
            <button
              type="button"
              disabled={isDisabled}
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
          {errors.password && (
            <p
              id="field-login-password-error"
              role="alert"
              className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
            >
              <IconAlertCircle
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <Controller
            control={control}
            name="rememberMe"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="field-login-remember"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  disabled={isDisabled}
                />
                <Label
                  htmlFor="field-login-remember"
                  className="mb-0 text-small font-medium text-text-secondary cursor-pointer select-none"
                >
                  Ingat saya
                </Label>
              </div>
            )}
          />
          <Link
            to="/forgot-password"
            className="text-small font-semibold text-[#7c3aed] hover:underline"
          >
            Lupa password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isDisabled}
          aria-busy={isSubmitting}
          className="h-11 w-full bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] text-white font-semibold shadow-lg hover:opacity-95 transition-opacity"
        >
          {isSubmitting ? (
            <>
              <IconLoader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Sedang masuk...
            </>
          ) : isSuccess ? (
            <>
              <IconCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Berhasil!
            </>
          ) : (
            <>
              <IconLogin className="mr-2 h-4 w-4" aria-hidden="true" />
              Masuk sekarang
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-small text-text-muted">
        Belum punya akun?{" "}
        <Link
          to="/register"
          className="font-semibold text-[#7c3aed] hover:underline"
        >
          Daftar
        </Link>
      </p>

      <div className="text-center pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-small font-semibold text-text-secondary hover:text-[#7c3aed] transition-colors"
        >
          <IconArrowLeft className="size-4" />← Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
