/**
 * Register Form Component
 * Form for new user registration
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      setSuccess(null);
      await registerUser(data);
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  // Helper to safely get error message
  const getErrorMessage = (field: string): string | undefined => {
    return (errors as any)[field]?.message;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          placeholder="John Doe"
          {...register('full_name')}
          disabled={isSubmitting}
        />
        {errors.full_name && (
          <p className="text-sm text-red-500">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          {...register('email')}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+62 xxx xxx xxxx"
          {...register('phone')}
          disabled={isSubmitting}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Minimum 6 characters"
          {...register('password')}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          {...register('confirmPassword')}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          onValueChange={(value) => setValue('role', value as any)}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
            <SelectItem value="dosen">Dosen</SelectItem>
            <SelectItem value="laboran">Laboran</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      {/* Mahasiswa-specific fields */}
      {selectedRole === 'mahasiswa' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="nim">NIM</Label>
            <Input
              id="nim"
              placeholder="BD2321001"
              {...register('nim')}
              disabled={isSubmitting}
            />
            {getErrorMessage('nim') && (
              <p className="text-sm text-red-500">{getErrorMessage('nim')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="program_studi">Program Studi</Label>
            <Input
              id="program_studi"
              placeholder="Kebidanan"
              {...register('program_studi')}
              disabled={isSubmitting}
            />
            {getErrorMessage('program_studi') && (
              <p className="text-sm text-red-500">{getErrorMessage('program_studi')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="angkatan">Angkatan</Label>
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
              <Label htmlFor="semester">Semester</Label>
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
        </>
      )}

      {/* Staff fields (Dosen/Laboran/Admin) */}
      {selectedRole && ['dosen', 'laboran', 'admin'].includes(selectedRole) && (
        <>
          <div className="space-y-2">
            <Label htmlFor="nip">NIP</Label>
            <Input
              id="nip"
              placeholder="1234567890123456"
              {...register('nip')}
              disabled={isSubmitting}
            />
            {getErrorMessage('nip') && (
              <p className="text-sm text-red-500">{getErrorMessage('nip')}</p>
            )}
          </div>

          {selectedRole === 'dosen' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gelar_depan">Gelar Depan (Optional)</Label>
                <Input
                  id="gelar_depan"
                  placeholder="Dr."
                  {...register('gelar_depan')}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gelar_belakang">Gelar Belakang (Optional)</Label>
                <Input
                  id="gelar_belakang"
                  placeholder="M.Keb"
                  {...register('gelar_belakang')}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}
        </>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
}