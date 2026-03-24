/**
 * Register Page
 * Page for new user registration with modern UI — konsisten dengan LoginPage
 */

import { useNavigate, Link } from "react-router-dom";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { GlassCard } from "@/components/ui/glass-card";
import { useState, useEffect } from "react";
import {
  Stethoscope,
  Sparkles,
  Baby,
  HeartPulse,
  ArrowLeft,
  UserPlus,
} from "lucide-react";

export function RegisterPage() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSuccess = () => {
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/70 px-4 py-8 sm:py-12">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-700/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-195 h-195 bg-blue-300/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
      </div>

      <div
        className={`w-full max-w-lg transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Main Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-linear-to-r from-primary/45 via-primary/30 to-accent/35 rounded-3xl blur-lg opacity-40" />

          <GlassCard
            intensity="high"
            className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/85 shadow-2xl dark:border-white/10 dark:bg-card/90"
          >
            {/* Header Section */}
            <div className="bg-linear-to-br from-blue-800 via-blue-700 to-indigo-700 px-6 sm:px-8 pt-9 sm:pt-10 pb-14 sm:pb-16 relative">
              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              {/* Logo */}
              <div className="flex justify-center mb-6 relative">
                <div className="relative">
                  <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl inline-block">
                    <UserPlus className="h-12 w-12 text-white" />
                  </div>
                  <Sparkles className="h-6 w-6 text-amber-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center relative">
                <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-lg px-4 py-2 rounded-full mb-4 border border-white/15">
                  <Baby className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-semibold">
                    Akademi Kebidanan Mega Buana
                  </span>
                  <HeartPulse className="h-4 w-4 text-white animate-pulse" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  Daftar Akun Baru
                </h1>
                <p className="text-primary-foreground/80 text-sm">
                  Isi data diri Anda untuk membuat akun sistem praktikum
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="px-4 sm:px-8 pb-6 sm:pb-8 -mt-7 sm:-mt-8">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 sm:p-6">
                <RegisterForm onSuccess={handleSuccess} />
              </div>
            </div>

            {/* Footer in Card */}
            <div className="bg-muted/40 px-6 sm:px-8 py-4 border-t border-border/50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Kembali ke Beranda</span>
              </Link>
              <div className="text-sm">
                <span className="text-muted-foreground">
                  Sudah punya akun?{" "}
                </span>
                <Link
                  to="/login"
                  className="font-bold text-primary hover:text-primary/80 transition-colors duration-200"
                >
                  Masuk
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/80 border border-slate-200 backdrop-blur-lg px-4 py-2 rounded-full shadow-sm">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Data Anda Aman &amp; Terenkripsi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
