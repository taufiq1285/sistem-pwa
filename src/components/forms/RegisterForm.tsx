/**
 * Modern multi-role registration form with dynamic fields, accessibility compliance,
 * validation feedback, and custom design tokens for each role.
 */

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBook2,
  IconCalendar,
  IconCertificate,
  IconCheck,
  IconCircleCheck,
  IconEye,
  IconEyeOff,
  IconFlask,
  IconHash,
  IconId,
  IconLoader2,
  IconLock,
  IconMail,
  IconPhone,
  IconSchool,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/validations/auth.schema";
import { normalize } from "@/lib/utils/normalize";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  onSuccess?: () => void;
}

type ValidRole = RegisterFormData["role"];

const ROLE_CONFIG = {
  mahasiswa: {
    value: "mahasiswa" as ValidRole,
    label: "Mahasiswa",
    icon: IconSchool,
    description:
      "Saya adalah mahasiswa yang ingin mengakses materi kuliah dan jadwal praktikum.",
    selectedBorder: "border-[#0d9488]",
    selectedBg: "bg-[#f0fdfa]",
    accentColor: "text-[#0d9488]",
    accentBg: "bg-[#0d9488]/15",
  },
  dosen: {
    value: "dosen" as ValidRole,
    label: "Dosen",
    icon: IconUsers,
    description:
      "Saya adalah dosen/pengajar yang akan mengelola kelas dan memberikan materi.",
    selectedBorder: "border-[#1d4ed8]",
    selectedBg: "bg-[#eff6ff]",
    accentColor: "text-[#1d4ed8]",
    accentBg: "bg-[#1d4ed8]/15",
  },
  laboran: {
    value: "laboran" as ValidRole,
    label: "Laboran",
    icon: IconFlask,
    description:
      "Saya adalah laboran yang akan mengelola inventaris dan jadwal laboratorium.",
    selectedBorder: "border-[#c2410c]",
    selectedBg: "bg-[#fff7ed]",
    accentColor: "text-[#c2410c]",
    accentBg: "bg-[#c2410c]/15",
  },
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<RegisterFormData | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      role: "mahasiswa",
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = watch("role") || "mahasiswa";
  const email = watch("email") || "";
  const isInstitutionEmail = email.toLowerCase().endsWith("@akmb.ac.id");

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const hasError = (fieldName: string) => {
    return fieldName in errors;
  };

  const getFieldClassName = (
    fieldName: string,
    hasLeftIcon = true,
    hasRightIcon = false,
  ) => {
    const hasErr = fieldName in errors;
    return cn(
      "h-11 rounded-lg bg-white text-body border border-border shadow-sm transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--role-focus-ring)]/15 focus-visible:border-[var(--role-focus-ring)] focus-visible:outline-hidden",
      hasLeftIcon ? "pl-9" : "pl-3.5",
      hasRightIcon ? "pr-10" : "pr-3.5",
      hasErr &&
        "input-error border-red-500 focus-visible:ring-red-500/15 focus-visible:border-red-500",
    );
  };

  const getErrorMessage = (fieldName: string): string | undefined => {
    const fieldError = errors[fieldName as keyof RegisterFormData];
    return fieldError?.message as string | undefined;
  };

  const onSubmit = async (data: RegisterFormData) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    if (!pendingData) return;

    try {
      setError(null);
      setSuccess(null);
      setShowConfirmDialog(false);

      // Normalize data before registration
      const normalizedData: RegisterFormData = {
        ...pendingData,
        full_name: normalize.fullName(pendingData.full_name),
        email: normalize.email(pendingData.email),
        phone: pendingData.phone
          ? normalize.phone(pendingData.phone)
          : undefined,
        // Mahasiswa-specific fields
        ...(pendingData.role === "mahasiswa" && {
          nim: pendingData.nim ? normalize.nim(pendingData.nim) : undefined,
          program_studi: pendingData.program_studi
            ? normalize.programStudi(pendingData.program_studi)
            : undefined,
        }),
        // Dosen-specific fields
        ...(pendingData.role === "dosen" && {
          nidn: pendingData.nidn ? pendingData.nidn.trim() : undefined,
          nuptk: pendingData.nuptk ? pendingData.nuptk.trim() : undefined,
          nip: pendingData.nip ? normalize.nim(pendingData.nip) : undefined,
          gelar_depan: pendingData.gelar_depan?.trim() || undefined,
          gelar_belakang: pendingData.gelar_belakang?.trim() || undefined,
        }),
        // Laboran-specific fields
        ...(pendingData.role === "laboran" && {
          nip: pendingData.nip ? pendingData.nip.trim() : undefined,
        }),
      } as RegisterFormData;

      await registerUser(normalizedData);
      setSuccess(
        "Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.",
      );
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Registrasi gagal. Silakan coba lagi.",
      );
    } finally {
      setPendingData(null);
    }
  };

  return (
    <div
      data-role={selectedRole}
      className="space-y-7 animate-[fade-in_300ms_ease_both]"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Buat akun baru
        </h1>
        <p className="text-sm text-muted-foreground">
          Daftar ke SiPraktik AKMB dan pilih role sesuai kebutuhan praktikum.
        </p>
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ===== ROLE SELECTION ===== */}
        <div className="space-y-3">
          <Label className="text-body font-semibold">Pilih Role Anda</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(ROLE_CONFIG).map((config) => {
              const Icon = config.icon;
              const isSelected = selectedRole === config.value;

              return (
                <div
                  key={config.value}
                  data-role={config.value}
                  className={cn(
                    "cursor-pointer rounded-xl border-2 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm select-none flex flex-col justify-between",
                    isSelected
                      ? `${config.selectedBg} ${config.selectedBorder} ring-2 ring-indigo-500/5 shadow-sm`
                      : "bg-white border-border hover:border-slate-300",
                  )}
                  onClick={() =>
                    setValue("role", config.value, { shouldValidate: true })
                  }
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          isSelected
                            ? `${config.accentBg} ${config.accentColor}`
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <Icon className="size-5" />
                      </div>
                      <span className="font-semibold text-text-primary text-small">
                        {config.label}
                      </span>
                      {isSelected && (
                        <IconCircleCheck
                          className="size-5 ml-auto text-(--role-accent)"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="mt-2 text-small text-text-secondary leading-normal">
                      {config.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          {errors.role && (
            <p
              id="field-register-role-error"
              role="alert"
              className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
            >
              <IconAlertCircle
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {errors.role.message}
            </p>
          )}
        </div>

        {/* ===== BASIC INFO ===== */}
        <div className="space-y-4">
          <h3 className="font-semibold text-heading border-b border-border pb-2 text-text-primary">
            Informasi Dasar
          </h3>

          {/* Nama Lengkap */}
          <div className="space-y-2">
            <Label htmlFor="field-register-fullname">Nama Lengkap *</Label>
            <div className="relative input-wrapper">
              <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <IconUser className="h-4 w-4" aria-hidden="true" />
              </span>
              <Input
                id="field-register-fullname"
                placeholder="Nama lengkap sesuai identitas"
                aria-required="true"
                aria-invalid={hasError("full_name")}
                aria-describedby={
                  hasError("full_name")
                    ? "field-register-fullname-error"
                    : undefined
                }
                className={getFieldClassName("full_name")}
                {...register("full_name")}
              />
            </div>
            {errors.full_name && (
              <p
                id="field-register-fullname-error"
                role="alert"
                className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
              >
                <IconAlertCircle
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="field-register-email">Email *</Label>
            <div className="relative input-wrapper">
              <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <IconMail className="h-4 w-4" aria-hidden="true" />
              </span>
              <Input
                id="field-register-email"
                type="email"
                placeholder="nama@akmb.ac.id"
                autoComplete="email"
                aria-required="true"
                aria-invalid={hasError("email")}
                aria-describedby={cn(
                  hasError("email") && "field-register-email-error",
                  isInstitutionEmail && "field-register-email-hint",
                )}
                className={getFieldClassName("email")}
                {...register("email")}
                ref={(element) => {
                  register("email").ref(element);
                  emailRef.current = element;
                }}
              />
            </div>
            {errors.email && (
              <p
                id="field-register-email-error"
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
                id="field-register-email-hint"
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

          {/* Nomor Telepon */}
          <div className="space-y-2">
            <Label htmlFor="field-register-phone">
              Nomor Telepon (Opsional)
            </Label>
            <div className="relative input-wrapper">
              <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <IconPhone className="h-4 w-4" aria-hidden="true" />
              </span>
              <Input
                id="field-register-phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                autoComplete="tel"
                aria-invalid={hasError("phone")}
                aria-describedby={
                  hasError("phone") ? "field-register-phone-error" : undefined
                }
                className={getFieldClassName("phone")}
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p
                id="field-register-phone-error"
                role="alert"
                className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
              >
                <IconAlertCircle
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="field-register-password">Password *</Label>
              <div className="relative input-wrapper">
                <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <IconLock className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  id="field-register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={hasError("password")}
                  aria-describedby={
                    hasError("password")
                      ? "field-register-password-error"
                      : undefined
                  }
                  className={getFieldClassName("password", true, true)}
                  {...register("password")}
                />
                <button
                  type="button"
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
                  id="field-register-password-error"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="field-register-confirmpassword">
                Konfirmasi Password *
              </Label>
              <div className="relative input-wrapper">
                <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <IconLock className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  id="field-register-confirmpassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ketik ulang password"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={hasError("confirmPassword")}
                  aria-describedby={
                    hasError("confirmPassword")
                      ? "field-register-confirmpassword-error"
                      : undefined
                  }
                  className={getFieldClassName("confirmPassword", true, true)}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
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
                  id="field-register-confirmpassword-error"
                  role="alert"
                  className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                >
                  <IconAlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ===== ROLE-SPECIFIC FIELDS ===== */}
        {selectedRole === "mahasiswa" && (
          <div className="p-5 rounded-2xl border bg-teal-50 border-teal-200 animate-card-in space-y-4">
            <h3 className="font-semibold text-heading flex items-center gap-2 border-b border-teal-200 pb-2 mb-4 text-[#0d9488]">
              <IconSchool className="size-5 bg-[#0d9488] text-white p-0.5 rounded" />
              Data Mahasiswa
            </h3>

            {/* NIM */}
            <div className="space-y-2">
              <Label htmlFor="field-register-nim">NIM *</Label>
              <div className="relative input-wrapper">
                <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <IconId className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  id="field-register-nim"
                  placeholder="Contoh: BD2321001"
                  aria-required="true"
                  aria-invalid={hasError("nim")}
                  aria-describedby={
                    getErrorMessage("nim")
                      ? "field-register-nim-error"
                      : undefined
                  }
                  className={getFieldClassName("nim")}
                  {...register("nim")}
                />
              </div>
              {getErrorMessage("nim") && (
                <p
                  id="field-register-nim-error"
                  role="alert"
                  className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                >
                  <IconAlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {getErrorMessage("nim")}
                </p>
              )}
            </div>

            {/* Program Studi */}
            <div className="space-y-2">
              <Label htmlFor="field-register-programstudi">
                Program Studi *
              </Label>
              <div className="relative input-wrapper">
                <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <IconSchool className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  id="field-register-programstudi"
                  placeholder="Contoh: Kebidanan"
                  aria-required="true"
                  aria-invalid={hasError("program_studi")}
                  aria-describedby={
                    getErrorMessage("program_studi")
                      ? "field-register-programstudi-error"
                      : undefined
                  }
                  className={getFieldClassName("program_studi", true)}
                  {...register("program_studi")}
                />
              </div>
              {getErrorMessage("program_studi") && (
                <p
                  id="field-register-programstudi-error"
                  role="alert"
                  className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                >
                  <IconAlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {getErrorMessage("program_studi")}
                </p>
              )}
            </div>

            {/* Angkatan & Semester */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field-register-angkatan">Angkatan *</Label>
                <div className="relative input-wrapper">
                  <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    <IconCalendar className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Input
                    id="field-register-angkatan"
                    type="number"
                    placeholder="2024"
                    aria-required="true"
                    aria-invalid={hasError("angkatan")}
                    aria-describedby={
                      getErrorMessage("angkatan")
                        ? "field-register-angkatan-error"
                        : undefined
                    }
                    className={getFieldClassName("angkatan", true)}
                    {...register("angkatan", { valueAsNumber: true })}
                  />
                </div>
                {getErrorMessage("angkatan") && (
                  <p
                    id="field-register-angkatan-error"
                    role="alert"
                    className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                  >
                    <IconAlertCircle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {getErrorMessage("angkatan")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-register-semester">Semester *</Label>
                <div className="relative input-wrapper">
                  <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    <IconHash className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Input
                    id="field-register-semester"
                    type="number"
                    placeholder="1"
                    aria-required="true"
                    aria-invalid={hasError("semester")}
                    aria-describedby={
                      getErrorMessage("semester")
                        ? "field-register-semester-error"
                        : undefined
                    }
                    className={getFieldClassName("semester", true)}
                    {...register("semester", { valueAsNumber: true })}
                  />
                </div>
                {getErrorMessage("semester") && (
                  <p
                    id="field-register-semester-error"
                    role="alert"
                    className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                  >
                    <IconAlertCircle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {getErrorMessage("semester")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedRole === "dosen" && (
          <div className="p-5 rounded-2xl border bg-blue-50 border-blue-200 animate-card-in space-y-4">
            <h3 className="font-semibold text-heading flex items-center gap-2 border-b border-blue-200 pb-2 mb-4 text-[#1d4ed8]">
              <IconUsers className="size-5 bg-[#1d4ed8] text-white p-0.5 rounded" />
              Data Dosen
            </h3>

            {/* NIDN */}
            <div className="space-y-2">
              <Label htmlFor="field-register-nidn">NIDN *</Label>
              <div className="relative input-wrapper">
                <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <IconId className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  id="field-register-nidn"
                  placeholder="10 digit nomor NIDN"
                  maxLength={10}
                  aria-required="true"
                  aria-invalid={hasError("nidn")}
                  aria-describedby={
                    getErrorMessage("nidn")
                      ? "field-register-nidn-error"
                      : undefined
                  }
                  className={getFieldClassName("nidn")}
                  {...register("nidn")}
                />
              </div>
              {getErrorMessage("nidn") && (
                <p
                  id="field-register-nidn-error"
                  role="alert"
                  className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                >
                  <IconAlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {getErrorMessage("nidn")}
                </p>
              )}
            </div>

            {/* NUPTK */}
            <div className="space-y-2">
              <Label htmlFor="field-register-nuptk">NUPTK (Opsional)</Label>
              <div className="relative input-wrapper">
                <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <IconId className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  id="field-register-nuptk"
                  placeholder="16 digit nomor NUPTK"
                  maxLength={16}
                  aria-invalid={hasError("nuptk")}
                  aria-describedby={
                    getErrorMessage("nuptk")
                      ? "field-register-nuptk-error"
                      : undefined
                  }
                  className={getFieldClassName("nuptk")}
                  {...register("nuptk")}
                />
              </div>
              {getErrorMessage("nuptk") && (
                <p
                  id="field-register-nuptk-error"
                  role="alert"
                  className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                >
                  <IconAlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {getErrorMessage("nuptk")}
                </p>
              )}
            </div>

            {/* NIP */}
            <div className="space-y-2">
              <Label htmlFor="field-register-dosen-nip">
                NIP (Opsional - Hanya PNS)
              </Label>
              <div className="relative input-wrapper">
                <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <IconId className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  id="field-register-dosen-nip"
                  placeholder="18 digit NIP PNS"
                  aria-invalid={hasError("nip")}
                  aria-describedby={
                    getErrorMessage("nip")
                      ? "field-register-dosen-nip-error"
                      : undefined
                  }
                  className={getFieldClassName("nip")}
                  {...register("nip")}
                />
              </div>
              {getErrorMessage("nip") && (
                <p
                  id="field-register-dosen-nip-error"
                  role="alert"
                  className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                >
                  <IconAlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {getErrorMessage("nip")}
                </p>
              )}
            </div>

            {/* Gelar Depan & Gelar Belakang */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field-register-gelardepan">
                  Gelar Depan (Opsional)
                </Label>
                <div className="relative input-wrapper">
                  <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    <IconCertificate className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Input
                    id="field-register-gelardepan"
                    placeholder="Dr."
                    className={getFieldClassName("gelar_depan", true)}
                    {...register("gelar_depan")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-register-gelarbelakang">
                  Gelar Belakang (Opsional)
                </Label>
                <div className="relative input-wrapper">
                  <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                    <IconCertificate className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <Input
                    id="field-register-gelarbelakang"
                    placeholder="M.Keb"
                    className={getFieldClassName("gelar_belakang", true)}
                    {...register("gelar_belakang")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedRole === "laboran" && (
          <div className="p-5 rounded-2xl border bg-orange-50 border-orange-200 animate-card-in space-y-4">
            <h3 className="font-semibold text-heading flex items-center gap-2 border-b border-orange-200 pb-2 mb-4 text-[#c2410c]">
              <IconFlask className="size-5 bg-[#c2410c] text-white p-0.5 rounded" />
              Data Laboran
            </h3>

            {/* NIP */}
            <div className="space-y-2">
              <Label htmlFor="field-register-laboran-nip">NIP *</Label>
              <div className="relative input-wrapper">
                <span className="input-icon pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                  <IconId className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  id="field-register-laboran-nip"
                  placeholder="Nomor Induk Pegawai"
                  aria-required="true"
                  aria-invalid={hasError("nip")}
                  aria-describedby={
                    getErrorMessage("nip")
                      ? "field-register-laboran-nip-error"
                      : undefined
                  }
                  className={getFieldClassName("nip")}
                  {...register("nip")}
                />
              </div>
              {getErrorMessage("nip") && (
                <p
                  id="field-register-laboran-nip-error"
                  role="alert"
                  className="field-error flex items-center gap-1.5 text-sm text-destructive mt-1"
                >
                  <IconAlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {getErrorMessage("nip")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isSubmitting || !!success}
          aria-busy={isSubmitting}
          className="h-11 w-full bg-linear-to-r from-(--role-sidebar-from) to-(--role-sidebar-to) text-white font-semibold shadow-lg hover:opacity-95 transition-opacity"
        >
          {isSubmitting ? (
            <>
              <IconLoader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Sedang memproses...
            </>
          ) : (
            <>
              <IconUserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Daftar sekarang
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-small text-text-muted">
        Sudah punya akun?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#7c3aed] hover:underline"
        >
          Masuk
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

      {/* ===== CONFIRMATION DIALOG ===== */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[480px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-display text-text-primary">
              Konfirmasi Pendaftaran
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <p className="text-small text-text-secondary">
                Pastikan data pendaftaran Anda di bawah ini sudah benar sebelum
                melanjutkan:
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-small">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-secondary">
                    Role:
                  </span>
                  <span className="text-text-primary font-medium capitalize">
                    {pendingData?.role}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-secondary">
                    Nama Lengkap:
                  </span>
                  <span className="text-text-primary font-medium">
                    {pendingData?.full_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-text-secondary">
                    Email:
                  </span>
                  <span className="text-text-primary font-medium">
                    {pendingData?.email}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 flex gap-2 items-start">
                <IconAlertCircle
                  className="size-5 shrink-0 text-amber-700 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-small leading-relaxed">
                  <strong>Peringatan:</strong> Role yang dipilih tidak dapat
                  diubah setelah registrasi berhasil.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel
              onClick={() => setPendingData(null)}
              className="h-10 rounded-lg text-small border border-border bg-white text-text-secondary hover:bg-slate-50 hover:text-text-primary transition"
            >
              Cek Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSubmit}
              data-role={pendingData?.role || selectedRole}
              className="h-10 rounded-lg text-small bg-linear-to-r from-(--role-sidebar-from) to-(--role-sidebar-to) text-white border-0 shadow-md hover:opacity-95 transition-opacity"
            >
              Ya, Daftar Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
