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
      <div className="space-y-4">
        <p className="text-base font-bold text-gray-800 text-center">
          Login untuk mengakses sistem sebagai:
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 font-semibold text-sm px-3 py-1 hover:bg-blue-100 transition-colors"
          >
            <GraduationCap className="h-3 w-3 mr-1" />
            Mahasiswa
          </Badge>
          <Badge
            variant="outline"
            className="bg-green-50 border-green-200 text-green-700 font-semibold text-sm px-3 py-1 hover:bg-green-100 transition-colors"
          >
            <Users className="h-3 w-3 mr-1" />
            Dosen
          </Badge>
          <Badge
            variant="outline"
            className="bg-purple-50 border-purple-200 text-purple-700 font-semibold text-sm px-3 py-1 hover:bg-purple-100 transition-colors"
          >
            <FlaskConical className="h-3 w-3 mr-1" />
            Laboran
          </Badge>
          <Badge
            variant="outline"
            className="bg-gray-50 border-gray-200 text-gray-700 font-semibold text-sm px-3 py-1 hover:bg-gray-100 transition-colors"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Offline Warning */}
        {!isOnline && (
          <Alert className="bg-linear-to-r from-blue-50 to-blue-100 border-blue-200 shadow-md">
            <WifiOff className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 font-bold text-base">
              Mode Offline
            </AlertTitle>
            <AlertDescription className="text-blue-800 font-medium text-sm">
              Anda sedang offline. Sistem akan menggunakan kredensial tersimpan
              untuk login.
            </AlertDescription>
          </Alert>
        )}
        {/* Error Alert */}
        {error && isOnline && (
          <Alert variant="destructive" className="shadow-md">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-bold text-base">Login Gagal</AlertTitle>
            <AlertDescription className="font-medium text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}
        {/* Email Field */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="flex items-center gap-2 font-bold text-gray-800 text-sm"
          >
            <Mail className="h-4 w-4 text-blue-600" />
            Email
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              {...register("email")}
              disabled={isSubmitting}
              className="pl-11 h-11 text-base font-medium border-2 focus-visible:border-blue-500 focus-visible:ring-blue-500 transition-all"
            />
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {errors.email && (
            <p className="text-sm font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>
        {/* Password Field */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="flex items-center gap-2 font-bold text-gray-800 text-sm"
          >
            <Lock className="h-4 w-4 text-blue-600" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password Anda"
              {...register("password")}
              disabled={isSubmitting}
              className="pl-11 pr-11 h-11 text-base font-medium border-2 focus-visible:border-blue-500 focus-visible:ring-blue-500 transition-all"
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
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
            <p className="text-sm font-semibold text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>
        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-bold bg-linear-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              {!isOnline ? "Login Offline..." : "Masuk..."}
            </>
          ) : !isOnline ? (
            <>
              <WifiOff className="h-5 w-5 mr-2" />
              Login Offline
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5 mr-2" />
              Masuk
            </>
          )}
        </Button>
        {/* Helper Text */}
        {!isOnline && (
          <Alert className="bg-linear-to-r from-blue-50 to-blue-100 border-blue-200">
            <AlertDescription className="text-sm font-semibold text-blue-900">
              💡 <strong>Login Offline:</strong> Masukkan email dan password
              yang sama dengan saat login online terakhir kali.
            </AlertDescription>
          </Alert>
        )}
        {/* Security Info */}
        {!isSubmitting && (
          <div className="pt-3 border-t-2 border-gray-100">
            <div className="flex items-start gap-2 text-xs font-medium text-gray-700">
              <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <p>
                {isOnline ? (
                  <>
                    <span className="font-semibold text-gray-900">
                      Login Aman:
                    </span>{" "}
                    Kredensial Anda terenkripsi dan disimpan (ter-hash) di
                    perangkat untuk offline login. Data otomatis terhapus
                    setelah 30 hari atau saat logout.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">
                      Mode Offline:
                    </span>{" "}
                    Login menggunakan kredensial tersimpan yang telah
                    di-enkripsi. Password asli tidak pernah disimpan di
                    perangkat.
                  </>
                )}
              </p>
            </div>
          </div>
        )}{" "}
      </form>

      {/* Quick Guide */}
      <div className="space-y-3 pt-5 border-t-2 border-gray-100">
        <p className="text-sm font-black text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Panduan Login
        </p>
        <ul className="text-sm font-medium text-gray-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5">•</span>
            <span>
              Gunakan email dan password yang Anda daftarkan saat registrasi
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5">•</span>
            <span>
              Login dapat dilakukan saat online maupun offline (setelah login
              pertama kali)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold mt-0.5">•</span>
            <span>
              Role Anda akan otomatis terdeteksi setelah login berhasil
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
