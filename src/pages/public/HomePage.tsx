/**
 * Landing Page - Sistem Praktikum PWA
 * Modern landing page dengan animasi dan efek interaktif
 */

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Baby,
  Calendar,
  BarChart3,
  Bell,
  Smartphone,
  Shield,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  UserCog,
  Wrench,
  Stethoscope,
  Sparkles,
  HeartPulse,
  Award,
  TrendingUp,
} from "lucide-react";

export function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Manajemen Jadwal",
      description:
        "Jadwal praktikum kebidanan yang terorganisir dengan baik untuk dosen dan mahasiswa",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <ClipboardCheck className="h-8 w-8" />,
      title: "Presensi Digital",
      description: "Sistem presensi mahasiswa yang akurat dan real-time",
      color: "from-green-500 to-green-600",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Penilaian & Nilai",
      description: "Sistem penilaian yang transparan dan mudah diakses",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Materi Praktikum",
      description:
        "Akses materi praktikum kebidanan kapan saja dan di mana saja",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: <Stethoscope className="h-8 w-8" />,
      title: "Laboratorium Kebidanan",
      description:
        "Manajemen alat praktikum dan laboratorium kebidanan yang efisien",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "Notifikasi",
      description: "Pengumuman dan notifikasi yang tepat waktu",
      color: "from-red-500 to-red-600",
    },
  ];

  const roles = [
    {
      icon: <GraduationCap className="h-12 w-12" />,
      title: "Mahasiswa",
      description:
        "Akses jadwal, materi, nilai, dan presensi praktikum kebidanan dengan mudah",
      color: "text-blue-600",
      bgColor: "bg-linear-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      iconBg: "bg-blue-500",
    },
    {
      icon: <UserCog className="h-12 w-12" />,
      title: "Dosen",
      description:
        "Kelola jadwal, nilai, dan materi praktikum kebidanan secara efisien",
      color: "text-green-600",
      bgColor: "bg-linear-to-br from-green-50 to-green-100",
      borderColor: "border-green-200",
      iconBg: "bg-green-500",
    },
    {
      icon: <Wrench className="h-12 w-12" />,
      title: "Laboran",
      description:
        "Atur inventaris dan persetujuan peminjaman laboratorium kebidanan",
      color: "text-orange-600",
      bgColor: "bg-linear-to-br from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      iconBg: "bg-orange-500",
    },
  ];

  const benefits = [
    "Akses offline dengan Progressive Web App",
    "Sinkronisasi data otomatis",
    "Notifikasi real-time",
    "Antarmuka yang modern dan responsif",
    "Keamanan data terjamin",
    "Mendukung praktikum kebidanan yang komprehensif",
  ];

  const highlights = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Multi-Role",
      description: "Mahasiswa, Dosen, Laboran & Admin",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Modul Lengkap",
      description: "6 Modul Praktikum Kebidanan",
      color: "from-green-500 to-green-600",
    },
    {
      icon: <Stethoscope className="h-6 w-6" />,
      title: "Fasilitas Modern",
      description: "9 Laboratorium & 1 Depo Alat",
      color: "from-pink-500 to-pink-600",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Aman & Terpercaya",
      description: "Data Tersinkronisasi Otomatis",
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-pink-50 overflow-hidden">
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

      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrollY > 50
            ? "bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200"
            : "bg-white/60 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Stethoscope className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                <Sparkles className="h-4 w-4 text-pink-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
                Akademi Kebidanan Mega Buana
              </span>
            </Link>
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  Masuk
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-linear-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200">
                  Daftar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
        <div
          className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-linear-to-r from-pink-100 to-blue-100 text-pink-700 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce">
            <Baby className="h-4 w-4" />
            <span>Akademi Kebidanan Mega Buana</span>
            <HeartPulse className="h-4 w-4 animate-pulse" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-8 leading-tight">
            <span className="bg-linear-to-r from-gray-900 via-blue-600 to-pink-600 bg-clip-text text-transparent">
              Sistem Informasi
            </span>
            <br />
            <span className="bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent relative">
              Praktikum
              <Sparkles className="h-12 w-12 text-yellow-500 absolute -top-4 -right-8 animate-spin-slow" />
            </span>
            <br />
            <span className="text-4xl sm:text-5xl lg:text-6xl bg-linear-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Akademi Kebidanan Mega Buana
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl sm:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            Sistem informasi praktikum kebidanan dengan fitur lengkap, akses
            offline, dan pengalaman pengguna yang modern
            <span className="inline-block animate-pulse">✨</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link to="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg px-10 py-7 bg-linear-to-r from-blue-600 to-pink-600 hover:from-blue-700 hover:to-pink-700 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 group"
              >
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-200" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-10 py-7 border-2 hover:bg-blue-50 hover:border-blue-600 hover:text-blue-600 transition-all duration-300 group"
              >
                Masuk
                <ArrowRight className="ml-2 h-5 w-4 group-hover:translate-x-2 transition-transform duration-200" />
              </Button>
            </Link>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {highlights.map((item, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="inline-flex items-center justify-center p-3 bg-linear-to-br from-blue-500 to-pink-500 rounded-xl mb-3 text-white group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </div>
                <div className="text-lg font-black text-gray-900 mb-1">
                  {item.title}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-linear-to-b from-white via-blue-50/30 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Fitur Unggulan</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 bg-linear-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
              Solusi Lengkap Praktikum
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistem praktikum kebidanan dengan fitur lengkap untuk memudahkan
              proses belajar mengajar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 border-gray-100 hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden relative"
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
                <CardHeader>
                  <div
                    className={`inline-flex p-4 bg-linear-to-br ${feature.color} rounded-2xl mb-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold group-hover:text-blue-600 transition-colors duration-200">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-24 bg-linear-to-b from-pink-50 via-white to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Users className="h-4 w-4" />
              <span>Multi-User Support</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 bg-linear-to-r from-gray-900 to-pink-600 bg-clip-text text-transparent">
              Dibuat untuk Semua Peran
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sistem yang memudahkan mahasiswa, dosen, dan laboran dalam
              mengelola praktikum kebidanan
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((role, index) => (
              <Card
                key={index}
                className={`border-2 ${role.borderColor} hover:shadow-2xl transition-all duration-500 hover:scale-105 group overflow-hidden relative`}
              >
                <div
                  className={`absolute inset-0 ${role.bgColor} opacity-50`}
                />
                <CardHeader className="relative">
                  <div
                    className={`${role.iconBg} p-5 rounded-2xl inline-block mb-4 text-white shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                  >
                    {role.icon}
                  </div>
                  <CardTitle className={`text-3xl font-black ${role.color}`}>
                    {role.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-base leading-relaxed font-medium">
                    {role.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <TrendingUp className="h-4 w-4" />
                <span>Keunggulan</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black mb-8 bg-linear-to-r from-gray-900 to-green-600 bg-clip-text text-transparent">
                Mengapa Memilih Sistem Kami?
              </h2>
              <p className="text-xl text-gray-700 mb-10 leading-relaxed">
                Dibangun dengan teknologi terkini untuk memberikan pengalaman
                terbaik dalam pengelolaan praktikum kebidanan
              </p>
              <div className="space-y-5">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-linear-to-r hover:from-blue-50 hover:to-pink-50 transition-all duration-300 group"
                  >
                    <CheckCircle2 className="h-7 w-7 text-green-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-lg text-gray-700 font-medium group-hover:text-gray-900 transition-colors duration-200">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-r from-blue-600 to-pink-600 rounded-3xl blur-2xl opacity-30 animate-pulse" />
              <div className="relative bg-linear-to-br from-blue-600 to-pink-600 rounded-3xl p-10 lg:p-14 text-white shadow-2xl">
                <div className="flex items-center justify-center p-6 bg-white/20 backdrop-blur-lg rounded-2xl mb-8">
                  <Smartphone className="h-24 w-24 text-white" />
                </div>
                <h3 className="text-3xl font-black mb-6">Akses Di Mana Saja</h3>
                <p className="text-xl text-blue-50 mb-8 leading-relaxed">
                  Dengan Progressive Web App, Anda dapat mengakses sistem ini
                  dari berbagai perangkat, bahkan tanpa koneksi internet
                </p>
                <div className="flex items-center space-x-3 text-blue-50 bg-white/10 backdrop-blur-lg p-4 rounded-xl">
                  <Shield className="h-6 w-6" />
                  <span className="font-semibold">
                    Data Anda aman dan tersinkronisasi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto text-white">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-lg px-6 py-3 rounded-full text-sm font-bold mb-8">
              <Zap className="h-4 w-4" />
              <span>Mulai Sekarang</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 leading-tight">
              Siap Memulai Praktikum
              <br />
              <span className="text-yellow-300">Lebih Baik?</span>
            </h2>
            <p className="text-2xl text-blue-50 mb-12 leading-relaxed">
              Bergabunglah sekarang dan rasakan kemudahan dalam mengelola
              praktikum kebidanan
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link to="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-12 py-8 bg-white text-blue-600 hover:bg-gray-50 shadow-2xl hover:shadow-white/50 transition-all duration-300 font-bold group"
                >
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-12 py-8 bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-600 shadow-xl transition-all duration-300 font-bold group"
                >
                  Masuk
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform duration-200" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <Stethoscope className="h-12 w-12 text-blue-400" />
                <Sparkles className="h-6 w-6 text-pink-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
              <span className="text-2xl font-bold text-white">
                Akademi Kebidanan Mega Buana
              </span>
            </div>
            <p className="text-gray-400 mb-8 text-lg">
              Sistem Informasi Praktikum - Platform praktikum kebidanan yang
              modern dan efisien
            </p>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500">
                &copy; {new Date().getFullYear()} Akademi Kebidanan Mega Buana.
                All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
