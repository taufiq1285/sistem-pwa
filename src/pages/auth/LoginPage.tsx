/**
 * Login Page
 * Page for user authentication with modern UI
 */

import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoginForm } from "@/components/forms/LoginForm";
import { useState, useEffect } from "react";
import {
  Stethoscope,
  Sparkles,
  Baby,
  HeartPulse,
  ArrowLeft,
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
      </div>

      <div
        className={`w-full max-w-md transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Main Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-pink-600 rounded-3xl blur-lg opacity-20" />

          {/* Card */}
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {/* Header Section */}
            <div className="bg-linear-to-br from-blue-600 to-pink-600 px-8 pt-10 pb-16 relative">
              {/* Decorative Circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

              {/* Logo */}
              <div className="flex justify-center mb-6 relative">
                <div className="relative">
                  <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl inline-block">
                    <Stethoscope className="h-12 w-12 text-white" />
                  </div>
                  <Sparkles className="h-6 w-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center relative">
                <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-lg px-4 py-2 rounded-full mb-4">
                  <Baby className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-semibold">
                    Akademi Kebidanan Mega Buana
                  </span>
                  <HeartPulse className="h-4 w-4 text-white animate-pulse" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2">
                  Selamat Datang
                </h1>
                <p className="text-blue-50 text-sm">
                  Masuk untuk mengakses sistem praktikum
                </p>
              </div>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-8 -mt-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                {/* Login Form */}
                <LoginForm onSuccess={handleSuccess} />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Belum punya akun?
                    </span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <Link
                    to="/register"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold text-base group transition-all duration-200"
                  >
                    <span>Daftar Sekarang</span>
                    <Sparkles className="h-4 w-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-200" />
                  </Link>
                </div>

                {/* Forgot Password */}
                <div className="text-center pt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    Lupa password?
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer in Card */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-lg px-4 py-2 rounded-full shadow-sm">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-gray-600 font-medium">
              Sistem Informasi Praktikum Aman & Terenkripsi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
