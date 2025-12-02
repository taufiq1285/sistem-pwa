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

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth.schema';
import { normalize } from '@/lib/utils/normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GraduationCap, Users, FlaskConical, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegisterFormProps {
  onSuccess?: () => void;
}

type ValidRole = RegisterFormData['role'];

// Role Configuration dengan icon, warna, dan deskripsi
const ROLE_CONFIG = {
  mahasiswa: {
    value: 'mahasiswa' as ValidRole,
    label: 'Mahasiswa',
    icon: GraduationCap,
    color: 'blue',
    bgClass: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    selectedClass: 'bg-blue-100 border-blue-500 ring-2 ring-blue-500',
    iconClass: 'text-blue-600',
    description: 'Saya adalah mahasiswa yang ingin mengakses materi kuliah dan jadwal praktikum',
    helperText: 'Pilih ini jika Anda adalah mahasiswa/peserta didik',
  },
  dosen: {
    value: 'dosen' as ValidRole,
    label: 'Dosen',
    icon: Users,
    color: 'green',
    bgClass: 'bg-green-50 hover:bg-green-100 border-green-200',
    selectedClass: 'bg-green-100 border-green-500 ring-2 ring-green-500',
    iconClass: 'text-green-600',
    description: 'Saya adalah dosen/pengajar yang akan mengelola kelas dan memberikan materi',
    helperText: 'Pilih ini jika Anda adalah dosen/pengajar',
  },
  laboran: {
    value: 'laboran' as ValidRole,
    label: 'Laboran',
    icon: FlaskConical,
    color: 'purple',
    bgClass: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    selectedClass: 'bg-purple-100 border-purple-500 ring-2 ring-purple-500',
    iconClass: 'text-purple-600',
    description: 'Saya adalah laboran yang akan mengelola inventaris dan jadwal laboratorium',
    helperText: 'Pilih ini jika Anda adalah laboran/pengelola lab',
  },
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<RegisterFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'mahasiswa', // ✅ DEFAULT ke mahasiswa (paling banyak)
    },
  });

  const selectedRole = watch('role') || 'mahasiswa';
  const roleConfig = ROLE_CONFIG[selectedRole];

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
        phone: pendingData.phone ? normalize.phone(pendingData.phone) : undefined,
        // Mahasiswa-specific fields
        ...(pendingData.role === 'mahasiswa' && {
          nim: pendingData.nim ? normalize.nim(pendingData.nim) : undefined,
          program_studi: pendingData.program_studi
            ? normalize.programStudi(pendingData.program_studi)
            : undefined,
        }),
        // Dosen-specific fields
        ...(pendingData.role === 'dosen' && {
          nip: pendingData.nip ? normalize.nim(pendingData.nip) : undefined,
        }),
      };

      await registerUser(normalizedData);
      setSuccess('Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.');
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err: unknown) {
      let errorMessage = 'Registrasi gagal. Silakan coba lagi.';
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* ===== ROLE SELECTION ===== */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Pilih Role Anda</Label>
          <p className="text-sm text-gray-600">
            Pilih sesuai dengan status Anda. <strong>Mahasiswa</strong> untuk peserta didik.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.values(ROLE_CONFIG).map((config) => {
              const Icon = config.icon;
              const isSelected = selectedRole === config.value;

              return (
                <Card
                  key={config.value}
                  className={cn(
                    'cursor-pointer transition-all border-2',
                    config.bgClass,
                    isSelected && config.selectedClass
                  )}
                  onClick={() => setValue('role', config.value, { shouldValidate: true })}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center gap-3">
                      <Icon className={cn('h-6 w-6', config.iconClass)} />
                      <CardTitle className="text-base">{config.label}</CardTitle>
                      {isSelected && (
                        <CheckCircle2 className={cn('h-5 w-5 ml-auto', config.iconClass)} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <CardDescription className="text-xs">
                      {config.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {errors.role && (
            <p className="text-sm text-red-500">{errors.role.message}</p>
          )}
        </div>

        {/* ===== SELECTED ROLE INFO ===== */}
        <Alert className={cn('border-2', `border-${roleConfig.color}-200 bg-${roleConfig.color}-50`)}>
          <AlertDescription className="flex items-start gap-2">
            <span className="font-semibold">Role dipilih:</span>
            <span>{roleConfig.label}</span>
          </AlertDescription>
        </Alert>

        {/* ===== BASIC INFO ===== */}
        <div className="space-y-4">
          <h3 className="font-semibold text-base border-b pb-2">Informasi Dasar</h3>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap *</Label>
            <Input
              id="full_name"
              placeholder="Nama lengkap sesuai identitas"
              {...register('full_name')}
              disabled={isSubmitting}
            />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon (Opsional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              {...register('phone')}
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ketik ulang password"
                {...register('confirmPassword')}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ===== ROLE-SPECIFIC FIELDS ===== */}
        {selectedRole === 'mahasiswa' && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Data Mahasiswa
            </h3>

            <div className="space-y-2">
              <Label htmlFor="nim">NIM *</Label>
              <Input
                id="nim"
                placeholder="Contoh: BD2321001"
                {...register('nim')}
                disabled={isSubmitting}
              />
              {getErrorMessage('nim') && (
                <p className="text-sm text-red-500">{getErrorMessage('nim')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="program_studi">Program Studi *</Label>
              <Input
                id="program_studi"
                placeholder="Contoh: Kebidanan"
                {...register('program_studi')}
                disabled={isSubmitting}
              />
              {getErrorMessage('program_studi') && (
                <p className="text-sm text-red-500">{getErrorMessage('program_studi')}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="angkatan">Angkatan *</Label>
                <Input
                  id="angkatan"
                  type="number"
                  placeholder="2024"
                  {...register('angkatan', { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                {getErrorMessage('angkatan') && (
                  <p className="text-sm text-red-500">{getErrorMessage('angkatan')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester *</Label>
                <Input
                  id="semester"
                  type="number"
                  placeholder="1"
                  {...register('semester', { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                {getErrorMessage('semester') && (
                  <p className="text-sm text-red-500">{getErrorMessage('semester')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedRole === 'dosen' && (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Data Dosen
            </h3>

            <div className="space-y-2">
              <Label htmlFor="nidn">NIDN *</Label>
              <Input
                id="nidn"
                placeholder="10 digit nomor NIDN"
                {...register('nidn')}
                disabled={isSubmitting}
                maxLength={10}
              />
              {getErrorMessage('nidn') && (
                <p className="text-sm text-red-500">{getErrorMessage('nidn')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nuptk">NUPTK (Opsional)</Label>
              <Input
                id="nuptk"
                placeholder="16 digit nomor NUPTK"
                {...register('nuptk')}
                disabled={isSubmitting}
                maxLength={16}
              />
              {getErrorMessage('nuptk') && (
                <p className="text-sm text-red-500">{getErrorMessage('nuptk')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nip">NIP (Opsional - Hanya PNS)</Label>
              <Input
                id="nip"
                placeholder="18 digit NIP PNS"
                {...register('nip')}
                disabled={isSubmitting}
              />
              {getErrorMessage('nip') && (
                <p className="text-sm text-red-500">{getErrorMessage('nip')}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gelar_depan">Gelar Depan (Opsional)</Label>
                <Input
                  id="gelar_depan"
                  placeholder="Dr."
                  {...register('gelar_depan')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gelar_belakang">Gelar Belakang (Opsional)</Label>
                <Input
                  id="gelar_belakang"
                  placeholder="M.Keb"
                  {...register('gelar_belakang')}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}

        {selectedRole === 'laboran' && (
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              Data Laboran
            </h3>

            <div className="space-y-2">
              <Label htmlFor="nip">NIP *</Label>
              <Input
                id="nip"
                placeholder="Nomor Induk Pegawai"
                {...register('nip')}
                disabled={isSubmitting}
              />
              {getErrorMessage('nip') && (
                <p className="text-sm text-red-500">{getErrorMessage('nip')}</p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? 'Membuat akun...' : 'Daftar Sekarang'}
        </Button>
      </form>

      {/* ===== CONFIRMATION DIALOG ===== */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pendaftaran</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Pastikan data Anda sudah benar sebelum melanjutkan:</p>
              <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">Role:</span>
                  <span className="text-gray-900">{pendingData?.role === 'mahasiswa' ? 'Mahasiswa' : pendingData?.role === 'dosen' ? 'Dosen' : 'Laboran'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Nama:</span>
                  <span className="text-gray-900">{pendingData?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Email:</span>
                  <span className="text-gray-900">{pendingData?.email}</span>
                </div>
              </div>
              <p className="text-red-600 font-semibold">
                ⚠️ Pastikan role yang dipilih sudah benar! Role tidak bisa diubah setelah registrasi.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)}>
              Cek Lagi
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              Ya, Daftar Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
