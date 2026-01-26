/**
 * IMPROVED Login Form Component
 *
 * Improvements:
 * 1. Better visual design with icons
 * 2. Role badges to show what roles can login
 * 3. Better loading states
 * 4. Improved error handling with icons
 * 5. Helper text and tips
 * 6. Eye icon for password visibility
 * 7. Better offline handling - supports offline login
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  WifiOff,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  FlaskConical,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setError(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log("🔵 Login attempt:", {
        email: data.email,
        isOnline,
        navigatorOnline: navigator.onLine,
      });

      if (!isOnline) {
        setError("Mode Offline - Mencoba login dengan kredensial tersimpan...");
      } else {
        setError(null);
      }

      await login(data);
      console.log("✅ Login successful");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("❌ Login failed:", err);
      let errorMessage = "Login gagal. Silakan coba lagi.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Info Badges */}
      <div className="space-y-3">
        <p className="text-sm text-gray-600 text-center">
          Login untuk mengakses sistem sebagai:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700"
          >
            <GraduationCap className="h-3 w-3 mr-1" />
            Mahasiswa
          </Badge>
          <Badge
            variant="outline"
            className="bg-green-50 border-green-200 text-green-700"
          >
            <Users className="h-3 w-3 mr-1" />
            Dosen
          </Badge>
          <Badge
            variant="outline"
            className="bg-purple-50 border-purple-200 text-purple-700"
          >
            <FlaskConical className="h-3 w-3 mr-1" />
            Laboran
          </Badge>
          <Badge
            variant="outline"
            className="bg-gray-50 border-gray-200 text-gray-700"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Offline Warning */}
        {!isOnline && (
          <Alert className="bg-blue-50 border-blue-200">
            <WifiOff className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Mode Offline</AlertTitle>
            <AlertDescription className="text-blue-700">
              Anda sedang offline. Sistem akan menggunakan kredensial tersimpan
              untuk login.
            </AlertDescription>
          </Alert>
        )}
        {/* Error Alert */}
        {error && isOnline && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Login Gagal</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            Email
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              {...register("email")}
              disabled={isSubmitting}
              className="pl-10"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>
        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gray-500" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password Anda"
              {...register("password")}
              disabled={isSubmitting}
              className="pl-10 pr-10"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>
        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {!isOnline ? "Login Offline..." : "Masuk..."}
            </>
          ) : !isOnline ? (
            <>
              <WifiOff className="h-4 w-4 mr-2" />
              Login Offline
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              Masuk
            </>
          )}
        </Button>
        {/* Helper Text */}
        {!isOnline && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm text-blue-800">
              💡 <strong>Login Offline:</strong> Masukkan email dan password
              yang sama dengan saat login online terakhir kali.
            </AlertDescription>
          </Alert>
        )}
        {/* Security Info */}
        {!isSubmitting && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <p>
                {isOnline ? (
                  <>
                    Login Anda aman dan terenkripsi. Kredensial akan disimpan
                    (ter-hash) di perangkat untuk offline login. Data otomatis
                    terhapus setelah 30 hari atau saat logout.
                  </>
                ) : (
                  <>
                    Mode Offline: Login menggunakan kredensial tersimpan yang
                    telah di-enkripsi. Password asli tidak pernah disimpan di
                    perangkat.
                  </>
                )}
              </p>
            </div>
          </div>
        )}{" "}
      </form>

      {/* Quick Guide */}
      <div className="space-y-2 pt-4 border-t">
        <p className="text-sm font-semibold text-gray-700">Panduan Login:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>
              Gunakan email dan password yang Anda daftarkan saat registrasi
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>
              Login dapat dilakukan saat online maupun offline (setelah login
              pertama kali)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>
              Role Anda akan otomatis terdeteksi setelah login berhasil
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
