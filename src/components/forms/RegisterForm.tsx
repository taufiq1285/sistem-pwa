/**
 * IMPROVED Register Form Component
 *
 * Improvements:
 * 1. Visual role cards with icons and descriptions
 * 2. Default to mahasiswa (most common role)
 * 3. Clear visual feedback for selected role
 * 4. Confirmation dialog to prevent mistakes
 * 5. Role-specific helper text
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
  CardHeader,
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

// Role Configuration dengan icon, warna, dan deskripsi
const ROLE_CONFIG = {
  mahasiswa: {
    value: "mahasiswa" as ValidRole,
    label: "Mahasiswa",
    icon: GraduationCap,
    color: "blue",
    bgClass: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    selectedClass: "bg-blue-100 border-blue-500 ring-2 ring-blue-500",
    iconClass: "text-blue-600",
    description:
      "Saya adalah mahasiswa yang ingin mengakses materi kuliah dan jadwal praktikum",
    helperText: "Pilih ini jika Anda adalah mahasiswa/peserta didik",
  },
  dosen: {
    value: "dosen" as ValidRole,
    label: "Dosen",
    icon: Users,
    color: "green",
    bgClass: "bg-green-50 hover:bg-green-100 border-green-200",
    selectedClass: "bg-green-100 border-green-500 ring-2 ring-green-500",
    iconClass: "text-green-600",
    description:
      "Saya adalah dosen/pengajar yang akan mengelola kelas dan memberikan materi",
    helperText: "Pilih ini jika Anda adalah dosen/pengajar",
  },
  laboran: {
    value: "laboran" as ValidRole,
    label: "Laboran",
    icon: FlaskConical,
    color: "purple",
    bgClass: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    selectedClass: "bg-purple-100 border-purple-500 ring-2 ring-purple-500",
    iconClass: "text-purple-600",
    description:
      "Saya adalah laboran yang akan mengelola inventaris dan jadwal laboratorium",
    helperText: "Pilih ini jika Anda adalah laboran/pengelola lab",
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
      role: "mahasiswa", // ✅ DEFAULT ke mahasiswa (paling banyak)
    },
  });

  const selectedRole = watch("role") || "mahasiswa";
  const roleConfig = ROLE_CONFIG[selectedRole];

  // Auto-scroll to alert when error or success appears with animation trigger
  useEffect(() => {
    if (error || success) {
      setShowAlert(false);
      // Trigger animation
      setTimeout(() => setShowAlert(true), 10);

      // Scroll to alert
      setTimeout(() => {
        if (alertRef.current) {
          alertRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [error, success]);

  const onSubmit = async (data: RegisterFormData) => {
    // Show confirmation dialog
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
          nip: pendingData.nip ? normalize.nim(pendingData.nip) : undefined,
        }),
      };

      await registerUser(normalizedData);
      setSuccess(
        "Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.",
      );
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err: unknown) {
      let errorMessage = "Registrasi gagal. Silakan coba lagi.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setPendingData(null);
    }
  };

  const getErrorMessage = (field: string): string | undefined => {
    const fieldError = errors[field as keyof RegisterFormData];
    return fieldError?.message as string | undefined;
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {error && showAlert && (
          <div
            ref={alertRef}
            style={{
              animation: "shake 0.5s ease-in-out, fadeIn 0.3s ease-in",
            }}
          >
            <Alert
              variant="destructive"
              className="border-2 border-red-600 bg-linear-to-r from-red-50 to-red-100 shadow-xl p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-red-600 opacity-5 animate-pulse"></div>
              <div className="relative flex gap-4 items-start">
                <AlertCircle className="h-8 w-8 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-black text-xl text-red-900 mb-2">
                    Registrasi Gagal!
                  </h3>
                  <AlertDescription className="text-lg text-red-800 font-semibold">
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
            style={{
              animation: "slideDown 0.4s ease-out, fadeIn 0.3s ease-in",
            }}
          >
            <Alert className="border-2 border-green-600 bg-linear-to-r from-green-50 to-green-100 shadow-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-green-600 opacity-5 animate-pulse"></div>
              <div className="relative flex gap-4 items-start">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-black text-xl text-green-900 mb-2">
                    Registrasi Berhasil!
                  </h3>
                  <AlertDescription className="text-lg text-green-800 font-semibold">
                    {success}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* ===== ROLE SELECTION ===== */}
        <div className="space-y-5">
          <div>
            <Label className="text-lg font-black text-gray-900 flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-pink-600" />
              Pilih Role Anda
            </Label>
            <p className="text-base font-semibold text-gray-700">
              Pilih sesuai dengan status Anda di akademi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.values(ROLE_CONFIG).map((config) => {
              const Icon = config.icon;
              const isSelected = selectedRole === config.value;

              return (
                <Card
                  key={config.value}
                  className={cn(
                    "cursor-pointer transition-all border-2 hover:scale-105 hover:shadow-xl",
                    config.bgClass,
                    isSelected && config.selectedClass,
                  )}
                  onClick={() =>
                    setValue("role", config.value, { shouldValidate: true })
                  }
                >
                  <CardHeader className="p-6 pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          isSelected
                            ? "bg-white shadow-md"
                            : "bg-opacity-20 bg-white",
                        )}
                      >
                        <Icon className={cn("h-7 w-7", config.iconClass)} />
                      </div>
                      <CardTitle className="text-lg font-bold">
                        {config.label}
                      </CardTitle>
                      {isSelected && (
                        <CheckCircle2
                          className={cn("h-6 w-6 ml-auto", config.iconClass)}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <CardDescription className="text-sm font-medium leading-relaxed">
                      {config.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {errors.role && (
            <p className="text-base font-bold text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.role.message}
            </p>
          )}
        </div>

        {/* ===== SELECTED ROLE INFO ===== */}
        <Alert
          className={cn(
            "border-2 bg-linear-to-r shadow-md",
            roleConfig.color === "blue" &&
              "from-blue-50 to-blue-100 border-blue-300",
            roleConfig.color === "green" &&
              "from-green-50 to-green-100 border-green-300",
            roleConfig.color === "purple" &&
              "from-purple-50 to-purple-100 border-purple-300",
          )}
        >
          <AlertDescription className="flex items-center gap-3 text-base font-semibold">
            <span
              className={cn(
                "p-1.5 rounded-lg",
                roleConfig.color === "blue" && "bg-blue-100",
                roleConfig.color === "green" && "bg-green-100",
                roleConfig.color === "purple" && "bg-purple-100",
              )}
            >
              <GraduationCap className={cn("h-4 w-4", roleConfig.iconClass)} />
            </span>
            <span>
              Role dipilih:{" "}
              <span className={cn("font-black", roleConfig.iconClass)}>
                {roleConfig.label}
              </span>
            </span>
          </AlertDescription>
        </Alert>

        {/* ===== BASIC INFO ===== */}
        <div className="space-y-6">
          <h3 className="font-black text-xl text-gray-900 border-b-2 border-gray-200 pb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Informasi Dasar
          </h3>

          <div className="space-y-3">
            <Label
              htmlFor="full_name"
              className="text-base font-bold text-gray-800"
            >
              Nama Lengkap *
            </Label>
            <Input
              id="full_name"
              placeholder="Nama lengkap sesuai identitas"
              {...register("full_name")}
              disabled={isSubmitting}
              className="h-12 text-base font-medium border-2 focus-visible:border-pink-500 focus-visible:ring-pink-500"
            />
            {errors.full_name && (
              <p className="text-base font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="email"
              className="text-base font-bold text-gray-800"
            >
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              {...register("email")}
              disabled={isSubmitting}
              className="h-12 text-base font-medium border-2 focus-visible:border-pink-500 focus-visible:ring-pink-500"
            />
            {errors.email && (
              <p className="text-base font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="phone"
              className="text-base font-bold text-gray-800"
            >
              Nomor Telepon (Opsional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              {...register("phone")}
              disabled={isSubmitting}
              className="h-12 text-base font-medium border-2 focus-visible:border-pink-500 focus-visible:ring-pink-500"
            />
            {errors.phone && (
              <p className="text-base font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="text-base font-bold text-gray-800"
              >
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                {...register("password")}
                disabled={isSubmitting}
                className="h-12 text-base font-medium border-2 focus-visible:border-pink-500 focus-visible:ring-pink-500"
              />
              {errors.password && (
                <p className="text-base font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="confirmPassword"
                className="text-base font-bold text-gray-800"
              >
                Konfirmasi Password *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ketik ulang password"
                {...register("confirmPassword")}
                disabled={isSubmitting}
                className="h-12 text-base font-medium border-2 focus-visible:border-pink-500 focus-visible:ring-pink-500"
              />
              {errors.confirmPassword && (
                <p className="text-base font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ===== ROLE-SPECIFIC FIELDS ===== */}
        {selectedRole === "mahasiswa" && (
          <div className="space-y-5 p-6 bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 shadow-inner">
            <h3 className="font-black text-xl text-blue-900 flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              Data Mahasiswa
            </h3>

            <div className="space-y-3">
              <Label
                htmlFor="nim"
                className="text-base font-bold text-gray-800"
              >
                NIM *
              </Label>
              <Input
                id="nim"
                placeholder="Contoh: BD2321001"
                {...register("nim")}
                disabled={isSubmitting}
                className="h-12 text-base font-medium border-2 focus-visible:border-blue-500 focus-visible:ring-blue-500 bg-white"
              />
              {getErrorMessage("nim") && (
                <p className="text-base font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nim")}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="program_studi"
                className="text-base font-bold text-gray-800"
              >
                Program Studi *
              </Label>
              <Input
                id="program_studi"
                placeholder="Contoh: Kebidanan"
                {...register("program_studi")}
                disabled={isSubmitting}
                className="h-12 text-base font-medium border-2 focus-visible:border-blue-500 focus-visible:ring-blue-500 bg-white"
              />
              {getErrorMessage("program_studi") && (
                <p className="text-base font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("program_studi")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label
                  htmlFor="angkatan"
                  className="text-base font-bold text-gray-800"
                >
                  Angkatan *
                </Label>
                <Input
                  id="angkatan"
                  type="number"
                  placeholder="2024"
                  {...register("angkatan", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="h-12 text-base font-medium border-2 focus-visible:border-blue-500 focus-visible:ring-blue-500 bg-white"
                />
                {getErrorMessage("angkatan") && (
                  <p className="text-base font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {getErrorMessage("angkatan")}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="semester"
                  className="text-base font-bold text-gray-800"
                >
                  Semester *
                </Label>
                <Input
                  id="semester"
                  type="number"
                  placeholder="1"
                  {...register("semester", { valueAsNumber: true })}
                  disabled={isSubmitting}
                  className="h-12 text-base font-medium border-2 focus-visible:border-blue-500 focus-visible:ring-blue-500 bg-white"
                />
                {getErrorMessage("semester") && (
                  <p className="text-base font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {getErrorMessage("semester")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedRole === "dosen" && (
          <div className="space-y-5 p-6 bg-linear-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 shadow-inner">
            <h3 className="font-black text-xl text-green-900 flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              Data Dosen
            </h3>

            <div className="space-y-3">
              <Label
                htmlFor="nidn"
                className="text-base font-bold text-gray-800"
              >
                NIDN *
              </Label>
              <Input
                id="nidn"
                placeholder="10 digit nomor NIDN"
                {...register("nidn")}
                disabled={isSubmitting}
                maxLength={10}
                className="h-12 text-base font-medium border-2 focus-visible:border-green-500 focus-visible:ring-green-500 bg-white"
              />
              {getErrorMessage("nidn") && (
                <p className="text-base font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nidn")}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="nuptk"
                className="text-base font-bold text-gray-800"
              >
                NUPTK (Opsional)
              </Label>
              <Input
                id="nuptk"
                placeholder="16 digit nomor NUPTK"
                {...register("nuptk")}
                disabled={isSubmitting}
                maxLength={16}
                className="h-12 text-base font-medium border-2 focus-visible:border-green-500 focus-visible:ring-green-500 bg-white"
              />
              {getErrorMessage("nuptk") && (
                <p className="text-base font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nuptk")}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="nip"
                className="text-base font-bold text-gray-800"
              >
                NIP (Opsional - Hanya PNS)
              </Label>
              <Input
                id="nip"
                placeholder="18 digit NIP PNS"
                {...register("nip")}
                disabled={isSubmitting}
                className="h-12 text-base font-medium border-2 focus-visible:border-green-500 focus-visible:ring-green-500 bg-white"
              />
              {getErrorMessage("nip") && (
                <p className="text-base font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nip")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label
                  htmlFor="gelar_depan"
                  className="text-base font-bold text-gray-800"
                >
                  Gelar Depan (Opsional)
                </Label>
                <Input
                  id="gelar_depan"
                  placeholder="Dr."
                  {...register("gelar_depan")}
                  disabled={isSubmitting}
                  className="h-12 text-base font-medium border-2 focus-visible:border-green-500 focus-visible:ring-green-500 bg-white"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="gelar_belakang"
                  className="text-base font-bold text-gray-800"
                >
                  Gelar Belakang (Opsional)
                </Label>
                <Input
                  id="gelar_belakang"
                  placeholder="M.Keb"
                  {...register("gelar_belakang")}
                  disabled={isSubmitting}
                  className="h-12 text-base font-medium border-2 focus-visible:border-green-500 focus-visible:ring-green-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {selectedRole === "laboran" && (
          <div className="space-y-5 p-6 bg-linear-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 shadow-inner">
            <h3 className="font-black text-xl text-purple-900 flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
              Data Laboran
            </h3>

            <div className="space-y-3">
              <Label
                htmlFor="nip"
                className="text-base font-bold text-gray-800"
              >
                NIP *
              </Label>
              <Input
                id="nip"
                placeholder="Nomor Induk Pegawai"
                {...register("nip")}
                disabled={isSubmitting}
                className="h-12 text-base font-medium border-2 focus-visible:border-purple-500 focus-visible:ring-purple-500 bg-white"
              />
              {getErrorMessage("nip") && (
                <p className="text-base font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {getErrorMessage("nip")}
                </p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold bg-linear-to-r from-pink-600 to-blue-600 hover:from-pink-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <AlertCircle className="h-5 w-5 mr-2 animate-spin" />
              Membuat Akun...
            </>
          ) : (
            <>
              <UserPlus className="h-5 w-5 mr-2" />
              Daftar Sekarang
            </>
          )}
        </Button>
      </form>

      {/* ===== CONFIRMATION DIALOG ===== */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">
              Konfirmasi Pendaftaran
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <div className="space-y-4">
                <div className="font-semibold text-gray-900">
                  Pastikan data Anda sudah benar sebelum melanjutkan:
                </div>
                <div className="bg-linear-to-br from-gray-50 to-gray-100 p-5 rounded-xl space-y-3 text-base border-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Role:</span>
                    <span className="font-black text-gray-900 bg-white px-3 py-1 rounded-lg border">
                      {pendingData?.role === "mahasiswa"
                        ? "Mahasiswa"
                        : pendingData?.role === "dosen"
                          ? "Dosen"
                          : "Laboran"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Nama:</span>
                    <span className="font-semibold text-gray-900">
                      {pendingData?.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Email:</span>
                    <span className="font-semibold text-gray-900">
                      {pendingData?.email}
                    </span>
                  </div>
                </div>
                <div className="text-red-600 font-bold bg-red-50 p-4 rounded-lg border-2 border-red-200 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  Pastikan role yang dipilih sudah benar! Role tidak bisa diubah
                  setelah registrasi.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setPendingData(null)}
              className="text-base font-semibold px-6"
            >
              Cek Lagi
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSubmit}
              className="bg-linear-to-r from-pink-600 to-blue-600 text-base font-bold px-6"
            >
              Ya, Daftar Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
