/**
 * Login Form Component
 * Consistent visual style with AKBID landing pages.
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
      console.log("Login attempt:", {
        email: data.email,
        isOnline,
        navigatorOnline: navigator.onLine,
      });

      setError(null);
      await login(data);
      console.log("Login successful");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Login failed:", err);
      let errorMessage = "Login gagal. Silakan coba lagi.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-center akbid-font-display text-base font-semibold text-[#0F172A] sm:text-lg">
          Login untuk mengakses sistem sebagai:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge
            variant="outline"
            className="border-[#E8E0D8] bg-[#F8F3EE] px-3 py-1 text-[13px] font-semibold text-[#7B1D3A]"
          >
            <GraduationCap className="mr-1 h-3.5 w-3.5" />
            Mahasiswa
          </Badge>
          <Badge
            variant="outline"
            className="border-[#DDD4CB] bg-[#F5EEE8] px-3 py-1 text-[13px] font-semibold text-[#1E293B]"
          >
            <Users className="mr-1 h-3.5 w-3.5" />
            Dosen
          </Badge>
          <Badge
            variant="outline"
            className="border-[#D9CEC2] bg-[#F4EEE7] px-3 py-1 text-[13px] font-semibold text-[#334155]"
          >
            <FlaskConical className="mr-1 h-3.5 w-3.5" />
            Laboran
          </Badge>
          <Badge
            variant="outline"
            className="border-[#E8E0D8] bg-[#F1EBE4] px-3 py-1 text-[13px] font-semibold text-[#0F172A]"
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            Admin
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {!isOnline && (
          <Alert className="border-[#C7D2FE] bg-[#EEF2FF] shadow-sm">
            <WifiOff className="h-5 w-5 text-[#3730A3]" />
            <AlertTitle className="text-base font-semibold text-[#1E293B]">Mode Offline</AlertTitle>
            <AlertDescription className="text-sm text-[#334155]">
              Anda sedang offline. Sistem akan memakai kredensial tersimpan untuk login.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="shadow-sm">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-base font-semibold">Login Gagal</AlertTitle>
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <Mail className="h-4 w-4 text-[#7B1D3A]" />
            Email
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              {...register("email")}
              disabled={isSubmitting}
              className="h-11 border-[#E8E0D8] bg-white pl-11 text-[15px] focus-visible:border-[#7B1D3A] focus-visible:ring-[#7B1D3A]"
            />
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 text-sm font-medium text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <Lock className="h-4 w-4 text-[#7B1D3A]" />
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password Anda"
              {...register("password")}
              disabled={isSubmitting}
              className="h-11 border-[#E8E0D8] bg-white pl-11 pr-11 text-[15px] focus-visible:border-[#7B1D3A] focus-visible:ring-[#7B1D3A]"
            />
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#7B1D3A]"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-sm font-medium text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-12 w-full bg-[#7B1D3A] text-base font-semibold text-white transition-all duration-300 hover:bg-[#9B2448]"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {!isOnline ? "Login Offline..." : "Masuk..."}
            </>
          ) : !isOnline ? (
            <>
              <WifiOff className="mr-2 h-5 w-5" />
              Login Offline
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-5 w-5" />
              Masuk
            </>
          )}
        </Button>

        {!isOnline && (
          <Alert className="border-[#C7D2FE] bg-[#EEF2FF]">
            <AlertDescription className="text-sm text-[#1E293B]">
              <strong>Tips Login Offline:</strong> Masukkan email dan password yang sama dengan login online terakhir.
            </AlertDescription>
          </Alert>
        )}

        {!isSubmitting && (
          <div className="border-t border-[#E8E0D8] pt-3">
            <div className="flex items-start gap-2 text-xs text-slate-700 sm:text-[13px]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7B1D3A]" />
              <p>
                {isOnline ? (
                  <>
                    <span className="font-semibold text-[#0F172A]">Login Aman:</span>{" "}
                    Kredensial terenkripsi dan disimpan aman di perangkat untuk login offline.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-[#0F172A]">Mode Offline:</span>{" "}
                    Login memakai kredensial tersimpan terenkripsi, bukan password asli.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </form>

      <div className="space-y-2 border-t border-[#E8E0D8] pt-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
          <ShieldCheck className="h-4 w-4 text-[#7B1D3A]" />
          Panduan Login
        </p>
        <ul className="space-y-1.5 text-sm text-slate-700">
          <li>Gunakan email dan password yang didaftarkan saat registrasi.</li>
          <li>Login bisa dilakukan online, dan offline setelah login online pertama.</li>
          <li>Role akan otomatis terdeteksi setelah login berhasil.</li>
        </ul>
      </div>
    </div>
  );
}
