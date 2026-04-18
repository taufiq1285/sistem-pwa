/**
 * Register Form Component
 * Styled to match AKBID landing theme without changing core logic.
 */

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/validations/auth.schema";
import { normalize } from "@/lib/utils/normalize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
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
import {
  GraduationCap,
  Users,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  onSuccess?: () => void;
}

type ValidRole = RegisterFormData["role"];

type RoleStyle = {
  value: ValidRole;
  label: string;
  icon: typeof GraduationCap;
  bgClass: string;
  selectedClass: string;
  iconClass: string;
  description: string;
  helperText: string;
};

const ROLE_CONFIG: Record<ValidRole, RoleStyle> = {
  mahasiswa: {
    value: "mahasiswa",
    label: "Mahasiswa",
    icon: GraduationCap,
    bgClass: "bg-[#FDF8F5] hover:bg-[#F5EDE8] border-[#E8E0D8]",
    selectedClass:
      "bg-[#F5EDE8] border-[#7B1D3A] ring-2 ring-[#7B1D3A]/25 shadow-md",
    iconClass: "text-[#7B1D3A]",
    description: "Akses materi kuliah dan jadwal praktikum",
    helperText: "Untuk mahasiswa",
  },
  dosen: {
    value: "dosen",
    label: "Dosen",
    icon: Users,
    bgClass: "bg-[#F9F6F1] hover:bg-[#EEE7DF] border-[#DDD4CB]",
    selectedClass:
      "bg-[#EEE7DF] border-[#1E293B] ring-2 ring-[#1E293B]/25 shadow-md",
    iconClass: "text-[#1E293B]",
    description: "Kelola kelas, materi, dan aktivitas pembelajaran",
    helperText: "Untuk dosen/pengajar",
  },
  laboran: {
    value: "laboran",
    label: "Laboran",
    icon: FlaskConical,
    bgClass: "bg-[#F8F4EF] hover:bg-[#ECE4DC] border-[#D9CEC2]",
    selectedClass:
      "bg-[#ECE4DC] border-[#334155] ring-2 ring-[#334155]/25 shadow-md",
    iconClass: "text-[#334155]",
    description: "Kelola inventaris dan jadwal laboratorium",
    helperText: "Untuk laboran",
  },
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<RegisterFormData | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "mahasiswa",
    },
  });

  const selectedRole = watch("role") || "mahasiswa";
  const roleConfig = ROLE_CONFIG[selectedRole];

  useEffect(() => {
    if (error || success) {
      setShowAlert(false);
      setTimeout(() => setShowAlert(true), 10);
      setTimeout(() => {
        if (alertRef.current) {
          alertRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [error, success]);

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

      const normalizedData: RegisterFormData = {
        ...pendingData,
        full_name: normalize.fullName(pendingData.full_name),
        email: normalize.email(pendingData.email),
        phone: pendingData.phone ? normalize.phone(pendingData.phone) : undefined,
        ...(pendingData.role === "mahasiswa" && {
          nim: pendingData.nim ? normalize.nim(pendingData.nim) : undefined,
          program_studi: pendingData.program_studi
            ? normalize.programStudi(pendingData.program_studi)
            : undefined,
        }),
        ...(pendingData.role === "dosen" && {
          nip: pendingData.nip ? normalize.nim(pendingData.nip) : undefined,
        }),
      };

      await registerUser(normalizedData);
      setSuccess("Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.");
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err: unknown) {
      let errorMessage = "Registrasi gagal. Silakan coba lagi.";
      if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setPendingData(null);
    }
  };

  const getErrorMessage = (field: string): string | undefined => {
    const fieldError = errors[field as keyof RegisterFormData];
    return fieldError?.message as string | undefined;
  };

  const commonInputClass =
    "h-11 border-[#E8E0D8] bg-white text-[15px] focus-visible:border-[#7B1D3A] focus-visible:ring-[#7B1D3A]";

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {error && showAlert && (
          <div
            ref={alertRef}
            style={{ animation: "shake 0.5s ease-in-out, fadeIn 0.3s ease-in" }}
          >
            <Alert variant="destructive" className="relative overflow-hidden border border-red-200 bg-red-50 p-4 shadow-sm">
              <div className="relative flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div className="flex-1">
                  <h3 className="mb-1 text-base font-semibold text-red-900">Registrasi Gagal</h3>
                  <AlertDescription className="text-sm font-medium text-red-700">
                    {error}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {success && showAlert && (
          <div
            ref={alertRef}
            style={{ animation: "slideDown 0.4s ease-out, fadeIn 0.3s ease-in" }}
          >
            <Alert className="relative overflow-hidden border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <div className="relative flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="flex-1">
                  <h3 className="mb-1 text-base font-semibold text-emerald-900">Registrasi Berhasil</h3>
                  <AlertDescription className="text-sm font-medium text-emerald-700">
                    {success}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 flex items-center gap-2 text-base font-semibold text-[#0F172A]">
              <GraduationCap className="h-5 w-5 text-[#7B1D3A]" />
              Pilih Role Anda
            </Label>
            <p className="text-sm text-slate-600">Pilih sesuai status Anda di akademi</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.values(ROLE_CONFIG).map((config) => {
              const Icon = config.icon;
              const isSelected = selectedRole === config.value;

              return (
                <Card
                  key={config.value}
                  className={cn(
                    "cursor-pointer border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                    config.bgClass,
                    isSelected && config.selectedClass,
                  )}
                  onClick={() => setValue("role", config.value, { shouldValidate: true })}
                >
                  <CardContent className="p-3.5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className={cn("rounded-xl p-2.5", isSelected ? "bg-white shadow" : "bg-white/70") }>
                        <Icon className={cn("h-5 w-5", config.iconClass)} />
                      </div>

                      <div className="w-full">
                        <div className="flex items-center justify-center gap-1">
                          <CardTitle className="text-[15px] font-semibold text-[#0F172A]">
                            {config.label}
                          </CardTitle>
                          {isSelected && <CheckCircle2 className={cn("h-4 w-4 shrink-0", config.iconClass)} />}
                        </div>
                        <p className="mt-1 text-[13px] text-slate-500">{config.helperText}</p>
                        <CardDescription className="mt-1.5 text-[13px] leading-5 text-slate-600">
                          {config.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {errors.role && (
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertCircle className="h-4 w-4" />
              {errors.role.message}
            </p>
          )}
        </div>

        <Alert className="border border-[#E8E0D8] bg-[#F6F0EB] shadow-sm">
          <AlertDescription className="flex items-center gap-3 text-[15px] text-slate-700">
            <span className="rounded-lg bg-white p-1.5">
              <GraduationCap className={cn("h-4 w-4", roleConfig.iconClass)} />
            </span>
            <span>
              Role dipilih: <span className={cn("font-semibold", roleConfig.iconClass)}>{roleConfig.label}</span>
            </span>
          </AlertDescription>
        </Alert>

        <div className="space-y-5">
          <h3 className="flex items-center gap-2 border-b border-[#E8E0D8] pb-2 text-lg font-semibold text-[#0F172A]">
            <Users className="h-5 w-5 text-[#7B1D3A]" />
            Informasi Dasar
          </h3>

          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-semibold text-[#0F172A]">Nama Lengkap *</Label>
            <Input
              id="full_name"
              placeholder="Nama lengkap sesuai identitas"
              {...register("full_name")}
              disabled={isSubmitting}
              className={commonInputClass}
            />
            {errors.full_name && (
              <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-[#0F172A]">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              {...register("email")}
              disabled={isSubmitting}
              className={commonInputClass}
            />
            {errors.email && (
              <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-[#0F172A]">Nomor Telepon (Opsional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              {...register("phone")}
              disabled={isSubmitting}
              className={commonInputClass}
            />
            {errors.phone && (
              <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                <AlertCircle className="h-4 w-4" />
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-[#0F172A]">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                {...register("password")}
                disabled={isSubmitting}
                className={commonInputClass}
              />
              {errors.password && (
                <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#0F172A]">Konfirmasi Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ketik ulang password"
                {...register("confirmPassword")}
                disabled={isSubmitting}
                className={commonInputClass}
              />
              {errors.confirmPassword && (
                <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {selectedRole === "mahasiswa" && (
          <div className="space-y-4 rounded-2xl border border-[#E8E0D8] bg-[#F8F3EE] p-5 shadow-inner">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-[#0F172A]">
              <div className="rounded-lg bg-[#7B1D3A] p-2">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              Data Mahasiswa
            </h3>

            <div className="space-y-2">
              <Label htmlFor="nim" className="text-sm font-semibold text-[#0F172A]">NIM *</Label>
              <Input
                id="nim"
                placeholder="Contoh: BD2321001"
                {...register("nim")}
                disabled={isSubmitting}
                className={commonInputClass}
              />
              {getErrorMessage("nim") && (
                <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nim")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="program_studi" className="text-sm font-semibold text-[#0F172A]">Program Studi *</Label>
              <Input
                id="program_studi"
                placeholder="Contoh: Kebidanan"
                {...register("program_studi")}
                disabled={isSubmitting}
                className={commonInputClass}
              />
              {getErrorMessage("program_studi") && (
                <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("program_studi")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="angkatan" className="text-sm font-semibold text-[#0F172A]">Angkatan *</Label>
                <Input
                  id="angkatan"
                  type="number"
                  placeholder="2024"
                  {...register("angkatan", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className={commonInputClass}
                />
                {getErrorMessage("angkatan") && (
                  <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {getErrorMessage("angkatan")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester" className="text-sm font-semibold text-[#0F172A]">Semester *</Label>
                <Input
                  id="semester"
                  type="number"
                  placeholder="1"
                  {...register("semester", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className={commonInputClass}
                />
                {getErrorMessage("semester") && (
                  <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {getErrorMessage("semester")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedRole === "dosen" && (
          <div className="space-y-4 rounded-2xl border border-[#E8E0D8] bg-[#F7F3EF] p-5 shadow-inner">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-[#0F172A]">
              <div className="rounded-lg bg-[#1E293B] p-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              Data Dosen
            </h3>

            <div className="space-y-2">
              <Label htmlFor="nidn" className="text-sm font-semibold text-[#0F172A]">NIDN *</Label>
              <Input
                id="nidn"
                placeholder="10 digit nomor NIDN"
                {...register("nidn")}
                disabled={isSubmitting}
                maxLength={10}
                className={commonInputClass}
              />
              {getErrorMessage("nidn") && (
                <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nidn")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nuptk" className="text-sm font-semibold text-[#0F172A]">NUPTK (Opsional)</Label>
              <Input
                id="nuptk"
                placeholder="16 digit nomor NUPTK"
                {...register("nuptk")}
                disabled={isSubmitting}
                maxLength={16}
                className={commonInputClass}
              />
              {getErrorMessage("nuptk") && (
                <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nuptk")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip" className="text-sm font-semibold text-[#0F172A]">NIP (Opsional - Hanya PNS)</Label>
              <Input
                id="nip"
                placeholder="18 digit NIP PNS"
                {...register("nip")}
                disabled={isSubmitting}
                className={commonInputClass}
              />
              {getErrorMessage("nip") && (
                <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nip")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gelar_depan" className="text-sm font-semibold text-[#0F172A]">Gelar Depan (Opsional)</Label>
                <Input
                  id="gelar_depan"
                  placeholder="Dr."
                  {...register("gelar_depan")}
                  disabled={isSubmitting}
                  className={commonInputClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gelar_belakang" className="text-sm font-semibold text-[#0F172A]">Gelar Belakang (Opsional)</Label>
                <Input
                  id="gelar_belakang"
                  placeholder="M.Keb"
                  {...register("gelar_belakang")}
                  disabled={isSubmitting}
                  className={commonInputClass}
                />
              </div>
            </div>
          </div>
        )}

        {selectedRole === "laboran" && (
          <div className="space-y-4 rounded-2xl border border-[#E8E0D8] bg-[#F7F3EF] p-5 shadow-inner">
            <h3 className="flex items-center gap-3 text-lg font-semibold text-[#0F172A]">
              <div className="rounded-lg bg-[#334155] p-2">
                <FlaskConical className="h-5 w-5 text-white" />
              </div>
              Data Laboran
            </h3>

            <div className="space-y-2">
              <Label htmlFor="nip" className="text-sm font-semibold text-[#0F172A]">NIP *</Label>
              <Input
                id="nip"
                placeholder="Nomor Induk Pegawai"
                {...register("nip")}
                disabled={isSubmitting}
                className="h-11 border-[#E8E0D8] bg-white text-[15px] focus-visible:border-[#334155] focus-visible:ring-[#334155]"
              />
              {getErrorMessage("nip") && (
                <p className="flex items-center gap-1 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nip")}
                </p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="h-12 w-full bg-[#7B1D3A] text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#9B2448] hover:shadow-lg"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <AlertCircle className="mr-2 h-5 w-5 animate-spin" />
              Membuat Akun...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" />
              Daftar Sekarang
            </>
          )}
        </Button>
      </form>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg border border-[#E8E0D8]">
          <AlertDialogHeader>
            <AlertDialogTitle className="akbid-font-display text-2xl font-semibold text-[#0F172A]">
              Konfirmasi Pendaftaran
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[15px]">
              <div className="space-y-4">
                <div className="font-medium text-slate-700">Pastikan data Anda sudah benar sebelum melanjutkan:</div>
                <div className="space-y-2.5 rounded-xl border border-[#E8E0D8] bg-[#F8F3EE] p-4 text-[15px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Role:</span>
                    <span className="rounded-lg border border-[#E8E0D8] bg-white px-3 py-1 font-semibold text-[#0F172A]">
                      {pendingData?.role === "mahasiswa"
                        ? "Mahasiswa"
                        : pendingData?.role === "dosen"
                          ? "Dosen"
                          : "Laboran"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Nama:</span>
                    <span className="font-medium text-[#0F172A]">{pendingData?.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Email:</span>
                    <span className="font-medium text-[#0F172A]">{pendingData?.email}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  Pastikan role yang dipilih sudah benar. Role tidak bisa diubah setelah registrasi.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)} className="px-6 text-sm font-semibold">
              Cek Lagi
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="bg-linear-to-r from-[#7B1D3A] to-[#1E293B] px-6 text-sm font-semibold">
              Ya, Daftar Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
