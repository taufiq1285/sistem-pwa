/**
 * Login Page
 * Page for user authentication with modern UI
 */

import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoginForm } from "@/components/forms/LoginForm";
import { GlassCard } from "@/components/ui/glass-card";
import { useState, useEffect } from "react";
import akbidLogo from "@/assets/akbid-logo-asli.png";
import {
  Sparkles,
  ArrowLeft,
  Shield,
} from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "dosen":
          navigate("/dosen");
          break;
        case "mahasiswa":
          navigate("/mahasiswa");
          break;
        case "laboran":
          navigate("/laboran");
          break;
        default:
          navigate("/");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSuccess = () => {
    // Navigation handled by useEffect above
  };

  return (
    <div className="min-h-screen akbid-font-body akbid-auth-shell bg-[#FDF8F5] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-[#7B1D3A]/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1E293B]/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-195 h-195 bg-[#0F172A]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
      </div>

      <div
        className={`w-full max-w-md sm:max-w-lg transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Main Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-linear-to-r from-primary/45 via-primary/30 to-accent/35 rounded-3xl blur-lg opacity-40" />

          {/* Card */}
          <GlassCard
            intensity="high"
            className="relative overflow-hidden rounded-3xl border border-[#E8E0D8] bg-white/95 shadow-2xl dark:border-white/10 dark:bg-card/90"
          >
            {/* Header Section */}
            <div className="bg-linear-to-br from-[#0F172A] via-[#1E293B] to-[#7B1D3A] px-6 sm:px-8 pt-9 sm:pt-10 pb-14 sm:pb-16 relative">
              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              {/* Logo */}
              <div className="flex justify-center mb-6 relative">
                <div className="relative">
                  <div className="p-2.5 bg-white/20 backdrop-blur-lg rounded-2xl inline-block">
                    <img
                      src={akbidLogo}
                      alt="Logo Akademi Kebidanan Mega Buana"
                      className="h-14 w-14 rounded-xl object-contain bg-white p-1"
                    />
                  </div>
                  <Sparkles className="h-5 w-5 text-[#E8A5B5] absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center relative">
                <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-lg px-4 py-2 rounded-full mb-4 border border-white/15">
                  <Shield className="h-4 w-4 text-[#E8A5B5]" />
                  <span className="text-white text-sm font-semibold akbid-font-display">
                    Akademi Kebidanan Mega Buana
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-semibold akbid-font-display text-white mb-2">
                  Selamat Datang
                </h1>
                <p className="text-white/75 text-sm">
                  Masuk untuk mengakses sistem praktikum
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="px-4 sm:px-8 pb-6 sm:pb-8 -mt-7 sm:-mt-8">
              <div className="bg-[#FDF8F5] rounded-2xl shadow-lg border border-[#E8E0D8] p-5 sm:p-6 space-y-6">
                {/* Login Form */}
                <LoginForm onSuccess={handleSuccess} />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#FDF8F5] text-slate-500">
                      Belum punya akun?
                    </span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                    <Link
                      to="/register"
                      className="inline-flex items-center space-x-2 text-[#7B1D3A] hover:text-[#9B2448] font-semibold text-base group transition-all duration-200"
                    >
                      <span>Daftar Sekarang</span>
                      <Sparkles className="h-4 w-4 text-[#7B1D3A] group-hover:scale-125 group-hover:rotate-12 transition-all duration-200" />
                    </Link>
                  </div>

                {/* Forgot Password */}
                <div className="text-center pt-2">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-slate-500 hover:text-[#7B1D3A] transition-colors duration-200"
                    >
                      Lupa password?
                    </Link>
                </div>
              </div>
            </div>

            {/* Footer in Card */}
            <div className="bg-[#F1EBE4] px-6 sm:px-8 py-4 border-t border-[#E8E0D8]">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-sm text-slate-600 hover:text-[#7B1D3A] transition-colors duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/90 border border-[#E8E0D8] backdrop-blur-lg px-4 py-2 rounded-full shadow-sm">
            <Shield className="h-4 w-4 text-[#7B1D3A]" />
            <span className="text-xs text-slate-600 font-medium">
              Sistem Informasi Praktikum Aman & Terenkripsi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

