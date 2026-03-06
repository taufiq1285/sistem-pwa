/**
 * Register Page - MODERN UI
 * Page for new user registration with modern design
 */

import { useNavigate, Link } from "react-router-dom";
import { RegisterForm } from "@/components/forms/RegisterForm";
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
    // Redirect to login after successful registration
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/70 to-amber-50/80 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:py-12 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/10 blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
      </div>

      <div
        className={`w-full max-w-4xl transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Main Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-blue-700/40 via-blue-500/40 to-amber-400/40 blur-lg opacity-70" />

          {/* Card */}
          <div className="relative overflow-hidden rounded-3xl border border-blue-100/70 bg-white/90 shadow-2xl backdrop-blur-xl">
            {/* Header Section */}
            <div className="relative bg-linear-to-br from-blue-800 via-blue-700 to-sky-700 px-5 pb-14 pt-8 sm:px-8 sm:pt-10 sm:pb-16">
              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
              <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-300/20" />

              {/* Logo */}
              <div className="relative mb-5 flex justify-center sm:mb-6">
                <div className="relative">
                  <div className="inline-block rounded-2xl bg-white/20 p-3 backdrop-blur-lg sm:p-4">
                    <UserPlus className="h-10 w-10 text-white sm:h-12 sm:w-12" />
                  </div>
                  <Sparkles className="absolute -right-2 -top-2 h-5 w-5 animate-pulse text-amber-300 sm:h-6 sm:w-6" />
                </div>
              </div>

              {/* Title */}
              <div className="relative text-center">
                <div className="mb-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white/15 px-3 py-2 text-center backdrop-blur-lg sm:mb-4 sm:px-4">
                  <Baby className="h-4 w-4 text-amber-200" />
                  <span className="text-xs font-semibold text-blue-50 sm:text-sm">
                    Akademi Kebidanan Mega Buana
                  </span>
                  <HeartPulse className="h-4 w-4 animate-pulse text-amber-200" />
                </div>
                <h1 className="mb-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Daftar Akun Baru
                </h1>
                <p className="mx-auto max-w-xl text-xs text-blue-100 sm:text-sm">
                  Isi data diri Anda untuk membuat akun sistem praktikum
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="-mt-7 px-4 pb-6 sm:-mt-8 sm:px-8 sm:pb-8">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-lg sm:p-8">
                <RegisterForm onSuccess={handleSuccess} />
              </div>
            </div>

            {/* Footer in Card */}
            <div className="border-t border-blue-100/70 bg-slate-50/90 px-4 py-4 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/"
                  className="group inline-flex items-center gap-2 text-sm text-slate-600 transition-colors duration-200 hover:text-blue-700"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                  <span>Kembali ke Beranda</span>
                </Link>
                <div className="text-sm">
                  <span className="text-slate-600">Sudah punya akun? </span>
                  <Link
                    to="/login"
                    className="font-bold text-blue-700 transition-colors duration-200 hover:text-blue-800"
                  >
                    Masuk
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-5 text-center sm:mt-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-lg">
            <Stethoscope className="h-4 w-4 text-blue-700" />
            <span className="text-xs font-medium text-slate-600">
              Data Anda Aman & Terenkripsi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
