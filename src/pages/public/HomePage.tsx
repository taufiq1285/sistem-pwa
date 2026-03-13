/**
 * Landing Page - Sistem Praktikum PWA
 * Modern landing page dengan animasi dan efek interaktif
 */

import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import akbidLogo from "@/assets/LOGO AKBID MEGA BUANA GOL.png";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import { GlassCard } from "@/components/ui/glass-card";
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

  const featureToneStyles = {
    primary: {
      glow: "from-primary/18 to-primary/6",
      icon: "brand-gradient text-primary-foreground",
      title: "group-hover:text-primary",
    },
    success: {
      glow: "from-success/20 to-success/8",
      icon: "bg-linear-to-br from-success to-success/80 text-success-foreground",
      title: "group-hover:text-success",
    },
    info: {
      glow: "from-info/20 to-info/8",
      icon: "bg-linear-to-br from-info to-info/80 text-info-foreground",
      title: "group-hover:text-info",
    },
    warning: {
      glow: "from-warning/20 to-warning/8",
      icon: "bg-linear-to-br from-warning to-warning/80 text-warning-foreground",
      title: "group-hover:text-warning",
    },
    accent: {
      glow: "from-accent/70 to-accent/20",
      icon: "bg-linear-to-br from-foreground to-foreground/80 text-background",
      title: "group-hover:text-foreground",
    },
    danger: {
      glow: "from-destructive/18 to-destructive/6",
      icon: "bg-linear-to-br from-destructive to-destructive/80 text-destructive-foreground",
      title: "group-hover:text-destructive",
    },
  } as const;

  const roleToneStyles = {
    primary: {
      card: "border-primary/20 bg-linear-to-br from-primary/10 via-background to-primary/5",
      icon: "brand-gradient text-primary-foreground",
      title: "text-primary",
    },
    success: {
      card: "border-success/20 bg-linear-to-br from-success/10 via-background to-success/5",
      icon: "bg-linear-to-br from-success to-success/80 text-success-foreground",
      title: "text-success",
    },
    warning: {
      card: "border-warning/25 bg-linear-to-br from-warning/15 via-background to-warning/5",
      icon: "bg-linear-to-br from-warning to-warning/80 text-warning-foreground",
      title: "text-warning",
    },
  } as const;

  const highlightToneStyles = {
    primary: {
      icon: "brand-gradient text-primary-foreground",
    },
    success: {
      icon: "bg-linear-to-br from-success to-success/80 text-success-foreground",
    },
    warning: {
      icon: "bg-linear-to-br from-warning to-warning/80 text-warning-foreground",
    },
    info: {
      icon: "bg-linear-to-br from-info to-info/80 text-info-foreground",
    },
  } as const;

  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Manajemen Jadwal",
      description:
        "Jadwal praktikum kebidanan yang terorganisir dengan baik untuk dosen dan mahasiswa",
      tone: "primary",
    },
    {
      icon: <ClipboardCheck className="h-8 w-8" />,
      title: "Presensi Digital",
      description: "Sistem presensi mahasiswa yang akurat dan real-time",
      tone: "success",
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Penilaian & Nilai",
      description: "Sistem penilaian yang transparan dan mudah diakses",
      tone: "info",
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Materi Praktikum",
      description:
        "Akses materi praktikum kebidanan kapan saja dan di mana saja",
      tone: "warning",
    },
    {
      icon: <Stethoscope className="h-8 w-8" />,
      title: "Laboratorium Kebidanan",
      description:
        "Manajemen alat praktikum dan laboratorium kebidanan yang efisien",
      tone: "accent",
    },
    {
      icon: <Bell className="h-8 w-8" />,
      title: "Notifikasi",
      description: "Pengumuman dan notifikasi yang tepat waktu",
      tone: "danger",
    },
  ] as const;

  const roles = [
    {
      icon: <GraduationCap className="h-12 w-12" />,
      title: "Mahasiswa",
      description:
        "Akses jadwal, materi, nilai, dan presensi praktikum kebidanan dengan mudah",
      tone: "primary",
    },
    {
      icon: <UserCog className="h-12 w-12" />,
      title: "Dosen",
      description:
        "Kelola jadwal, nilai, dan materi praktikum kebidanan secara efisien",
      tone: "success",
    },
    {
      icon: <Wrench className="h-12 w-12" />,
      title: "Laboran",
      description:
        "Atur inventaris dan persetujuan peminjaman laboratorium kebidanan",
      tone: "warning",
    },
  ] as const;

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
      tone: "primary",
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "Modul Lengkap",
      description: "6 Modul Praktikum Kebidanan",
      tone: "success",
    },
    {
      icon: <Stethoscope className="h-6 w-6" />,
      title: "Fasilitas Modern",
      description: "9 Laboratorium & 1 Depo Alat",
      tone: "warning",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Aman & Terpercaya",
      description: "Data Tersinkronisasi Otomatis",
      tone: "info",
    },
  ] as const;

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-linear-to-br from-background via-background to-primary/5">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="bg-drift-slow absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/15 blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="bg-drift-slower absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-warning/20 blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div
          className="bg-drift-slower absolute left-1/2 top-1/2 h-200 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-info/10 blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
      </div>

      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrollY > 50
            ? "border-b border-border/70 bg-background/92 shadow-lg backdrop-blur-lg"
            : "bg-background/60 backdrop-blur-md"
        }`}
      >
        <div className="app-container">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3 group min-w-0">
              <div className="relative shrink-0 overflow-hidden rounded-full border border-warning/30 bg-background/80 p-1 shadow-md transition-transform duration-200 group-hover:scale-105">
                <img
                  src={akbidLogo}
                  alt="Logo Akademi Kebidanan Mega Buana"
                  className="h-10 w-10 rounded-full object-contain sm:h-11 sm:w-11"
                />
                <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-pulse text-warning sm:h-4 sm:w-4" />
              </div>
              <span className="text-gradient-brand hidden truncate text-lg font-bold sm:inline lg:text-xl">
                Akademi Kebidanan Mega Buana
              </span>
              <span className="text-gradient-brand text-sm font-bold sm:hidden">
                AKBID MB
              </span>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link to="/login">
                <ButtonEnhanced
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 transition-colors duration-200 hover:bg-accent hover:text-accent-foreground sm:h-10 sm:px-4"
                >
                  Masuk
                </ButtonEnhanced>
              </Link>
              <Link to="/register">
                <ButtonEnhanced
                  size="sm"
                  variant="gradient"
                  className="h-9 px-3 sm:h-10 sm:px-4 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Daftar
                </ButtonEnhanced>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="app-container py-12 sm:py-16 lg:py-24 relative">
        <div className="pointer-events-none absolute inset-x-4 bottom-6 top-6 rounded-4xl bg-linear-to-br from-background/60 via-background/20 to-transparent opacity-70 blur-3xl" />
        <div
          className={`relative text-center max-w-5xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-4xl border border-white/30 bg-background/20 backdrop-blur-sm" />
          {/* Badge */}
          <div className="mb-6 inline-flex max-w-full items-center space-x-2 rounded-full border border-primary/15 bg-linear-to-r from-primary/10 to-warning/15 px-4 py-2 text-xs font-medium text-primary shadow-lg transition-all duration-300 hover:shadow-xl sm:mb-8 sm:px-6 sm:py-3 sm:text-sm">
            <Baby className="h-4 w-4" />
            <span>Akademi Kebidanan Mega Buana</span>
            <HeartPulse className="h-4 w-4 animate-pulse" />
          </div>

          <div className="mb-6 flex justify-center sm:mb-8">
            <div className="rounded-full border border-warning/25 bg-background/80 p-2 shadow-2xl backdrop-blur-sm">
              <img
                src={akbidLogo}
                alt="Logo Akademi Kebidanan Mega Buana"
                className="h-28 w-28 object-contain sm:h-36 sm:w-36 lg:h-44 lg:w-44"
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black mb-6 sm:mb-8 leading-tight">
            <span className="bg-linear-to-r from-foreground via-primary to-primary bg-clip-text text-transparent">
              Sistem Informasi
            </span>
            <br />
            <span className="relative bg-linear-to-r from-primary via-info to-warning bg-clip-text text-transparent">
              Praktikum
              <Sparkles className="absolute -right-8 -top-4 hidden h-12 w-12 animate-spin-slow text-warning sm:block" />
            </span>
            <br />
            <span className="bg-linear-to-r from-primary to-warning bg-clip-text text-2xl text-transparent sm:text-5xl lg:text-6xl">
              Akademi Kebidanan Mega Buana
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-8 max-w-3xl px-2 text-base leading-relaxed text-muted-foreground sm:mb-12 sm:px-0 sm:text-xl lg:text-2xl">
            Sistem informasi praktikum kebidanan dengan fitur lengkap, akses
            offline, dan pengalaman pengguna yang modern
            <span className="inline-block animate-pulse">✨</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link to="/register">
              <ButtonEnhanced
                size="lg"
                variant="gradient"
                className="group w-full px-10 py-7 text-lg shadow-2xl transition-all duration-300 hover:shadow-primary/35 sm:w-auto"
              >
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-200" />
              </ButtonEnhanced>
            </Link>
            <Link to="/login">
              <ButtonEnhanced
                size="lg"
                variant="outline"
                className="group w-full border-2 border-border/70 bg-background/75 px-10 py-7 text-lg text-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground sm:w-auto"
              >
                Masuk
                <ArrowRight className="ml-2 h-5 w-4 group-hover:translate-x-2 transition-transform duration-200" />
              </ButtonEnhanced>
            </Link>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {highlights.map((item, index) => {
              const styles = highlightToneStyles[item.tone];

              return (
                <GlassCard
                  key={index}
                  intensity="medium"
                  className="interactive-card group rounded-2xl border border-white/40 bg-background/80 p-6 text-center shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
                >
                  <div
                    className={`mb-3 inline-flex items-center justify-center rounded-xl p-3 transition-transform duration-200 group-hover:scale-110 ${styles.icon}`}
                  >
                    {item.icon}
                  </div>
                  <div className="mb-1 text-lg font-black text-foreground">
                    {item.title}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {item.description}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-linear-to-b from-background via-primary/5 to-background py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/10 to-transparent" />
        <div className="app-container">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center space-x-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>Fitur Unggulan</span>
            </div>
            <h2 className="mb-6 bg-linear-to-r from-foreground to-primary bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
              Solusi Lengkap Praktikum
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Sistem praktikum kebidanan dengan fitur lengkap untuk memudahkan
              proses belajar mengajar
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const styles = featureToneStyles[feature.tone];

              return (
                <Card
                  key={index}
                  className="interactive-card group relative overflow-hidden border border-border/60 bg-background/90 shadow-lg transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl"
                >
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${styles.glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <CardHeader className="relative">
                    <div
                      className={`mb-4 inline-flex rounded-2xl p-4 shadow-lg transition-transform duration-300 group-hover:scale-110 ${styles.icon}`}
                    >
                      {feature.icon}
                    </div>
                    <CardTitle
                      className={`text-2xl font-bold text-foreground transition-colors duration-200 ${styles.title}`}
                    >
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="bg-linear-to-b from-warning/8 via-background to-primary/6 py-20 sm:py-24">
        <div className="app-container">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center space-x-2 rounded-full border border-info/15 bg-info/10 px-4 py-2 text-sm font-semibold text-info shadow-sm">
              <Users className="h-4 w-4" />
              <span>Multi-User Support</span>
            </div>
            <h2 className="mb-6 bg-linear-to-r from-foreground to-info bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
              Dibuat untuk Semua Peran
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              Sistem yang memudahkan mahasiswa, dosen, dan laboran dalam
              mengelola praktikum kebidanan
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {roles.map((role, index) => {
              const styles = roleToneStyles[role.tone];

              return (
                <Card
                  key={index}
                  className={`group relative overflow-hidden border bg-background/90 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl ${styles.card}`}
                >
                  <div className="absolute inset-0 bg-linear-to-br from-background/20 via-transparent to-white/5 opacity-70" />
                  <CardHeader className="relative">
                    <div
                      className={`mb-4 inline-block rounded-2xl p-5 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${styles.icon}`}
                    >
                      {role.icon}
                    </div>
                    <CardTitle className={`text-3xl font-black ${styles.title}`}>
                      {role.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-base font-medium leading-relaxed text-muted-foreground">
                      {role.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="app-container">
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
                    className="flex items-start space-x-4 p-4 rounded-xl hover:bg-primary/5 transition-all duration-300 group"
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
              <div className="absolute -inset-4 bg-linear-to-r from-blue-800 to-amber-600 rounded-3xl blur-2xl opacity-30 animate-pulse" />
              <div className="relative bg-linear-to-br from-blue-800 to-amber-600 rounded-3xl p-10 lg:p-14 text-white shadow-2xl">
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
      <section className="relative overflow-hidden bg-linear-to-r from-primary via-info to-warning py-20 sm:py-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="app-container relative">
          <div className="text-center max-w-4xl mx-auto text-white">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-lg px-6 py-3 rounded-full text-sm font-bold mb-8">
              <Zap className="h-4 w-4" />
              <span>Mulai Sekarang</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-8 leading-tight">
              Siap Memulai Praktikum
              <br />
              <span className="text-warning-foreground/90">Lebih Baik?</span>
            </h2>
            <p className="mb-12 text-2xl leading-relaxed text-primary-foreground/85">
              Bergabunglah sekarang dan rasakan kemudahan dalam mengelola
              praktikum kebidanan
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link to="/register">
                <ButtonEnhanced
                  size="lg"
                  className="group w-full bg-background px-12 py-8 text-lg font-bold text-primary transition-all duration-300 hover:bg-background/90 hover:shadow-white/40 sm:w-auto"
                >
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform duration-200" />
                </ButtonEnhanced>
              </Link>
              <Link to="/login">
                <ButtonEnhanced
                  size="lg"
                  className="group w-full border-2 border-white/70 bg-transparent px-12 py-8 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:bg-white/10 sm:w-auto"
                >
                  Masuk
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform duration-200" />
                </ButtonEnhanced>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground px-0 py-16 text-background">
        <div className="app-container">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="relative">
                <Stethoscope className="h-12 w-12 text-info" />
                <Sparkles className="absolute -right-2 -top-2 h-6 w-6 animate-pulse text-warning" />
              </div>
              <span className="text-2xl font-bold text-background">
                Akademi Kebidanan Mega Buana
              </span>
            </div>
            <p className="mb-8 text-lg text-background/70">
              Sistem Informasi Praktikum - Platform praktikum kebidanan yang
              modern dan efisien
            </p>
            <div className="border-t border-background/15 pt-8">
              <p className="text-background/55">
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
