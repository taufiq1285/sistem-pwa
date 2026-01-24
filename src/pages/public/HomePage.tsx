/**
 * Landing Page - Sistem Praktikum PWA
 * Halaman utama untuk sistem manajemen praktikum
 */

import { Link } from "react-router-dom";
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
  Zap,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  UserCog,
  Wrench,
  Stethoscope,
} from "lucide-react";

export function HomePage() {
  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Manajemen Jadwal",
      description:
        "Jadwal praktikum kebidanan yang terorganisir dengan baik untuk dosen dan mahasiswa",
    },
    {
      icon: <ClipboardCheck className="h-8 w-8" />,
      title: "Presensi Digital",
      description: "Sistem presensi mahasiswa yang akurat dan real-time",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Penilaian & Nilai",
      description: "Sistem penilaian yang transparan dan mudah diakses",
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Materi Praktikum",
      description:
        "Akses materi praktikum kebidanan kapan saja dan di mana saja",
    },
    {
      icon: <Stethoscope className="h-8 w-8" />,
      title: "Laboratorium Kebidanan",
      description:
        "Manajemen alat praktikum dan laboratorium kebidanan yang efisien",
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "Notifikasi",
      description: "Pengumuman dan notifikasi yang tepat waktu",
    },
  ];

  const roles = [
    {
      icon: <GraduationCap className="h-12 w-12" />,
      title: "Mahasiswa",
      description:
        "Akses jadwal, materi, nilai, dan presensi praktikum kebidanan dengan mudah",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: <UserCog className="h-12 w-12" />,
      title: "Dosen",
      description:
        "Kelola jadwal, nilai, dan materi praktikum kebidanan secara efisien",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: <Wrench className="h-12 w-12" />,
      title: "Laboran",
      description:
        "Atur inventaris dan persetujuan peminjaman laboratorium kebidanan",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
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

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Akademi Kebidanan Mega Buana
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Masuk</Button>
              </Link>
              <Link to="/register">
                <Button>Daftar</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Baby className="h-4 w-4" />
            <span>Akademi Kebidanan Mega Buana</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Sistem Informasi Praktikum
            <span className="block text-blue-600 mt-2">
              Akademi Kebidanan Mega Buana
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Sistem informasi praktikum kebidanan dengan fitur lengkap, akses
            offline, dan pengalaman pengguna yang modern
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8 py-6"
              >
                Masuk
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sistem praktikum kebidanan dengan fitur lengkap untuk memudahkan
              proses belajar mengajar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 hover:border-blue-500 hover:shadow-lg transition-all duration-300"
              >
                <CardHeader>
                  <div className="text-blue-600 mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 bg-linear-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Dibuat untuk Semua Peran
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sistem yang memudahkan mahasiswa, dosen, dan laboran dalam
              mengelola praktikum kebidanan
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((role, index) => (
              <Card
                key={index}
                className="border-2 hover:shadow-xl transition-all duration-300"
              >
                <CardHeader>
                  <div
                    className={`${role.bgColor} ${role.color} p-4 rounded-full inline-block mb-4`}
                  >
                    {role.icon}
                  </div>
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {role.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Mengapa Memilih Sistem Kami?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Dibangun dengan teknologi terkini untuk memberikan pengalaman
                terbaik dalam pengelolaan praktikum kebidanan
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-linear-to-br from-blue-500 to-blue-700 rounded-2xl p-8 lg:p-12 text-white">
              <Smartphone className="h-20 w-20 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Akses Di Mana Saja</h3>
              <p className="text-lg text-blue-100 mb-6">
                Dengan Progressive Web App, Anda dapat mengakses sistem ini dari
                berbagai perangkat, bahkan tanpa koneksi internet
              </p>
              <div className="flex items-center space-x-2 text-blue-100">
                <Shield className="h-5 w-5" />
                <span>Data Anda aman dan tersinkronisasi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-r from-blue-600 to-blue-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Siap Memulai Praktikum Kebidanan Lebih Baik?
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              Bergabunglah sekarang dan rasakan kemudahan dalam mengelola
              praktikum kebidanan
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto text-lg px-8 py-6"
                >
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white hover:text-blue-600"
                >
                  Masuk
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Stethoscope className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">
                Akademi Kebidanan Mega Buana
              </span>
            </div>
            <p className="text-gray-400 mb-6">
              Sistem Informasi Praktikum - Platform praktikum kebidanan yang
              modern dan efisien
            </p>
            <div className="border-t border-gray-800 pt-6">
              <p className="text-sm text-gray-500">
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
