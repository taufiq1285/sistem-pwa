import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Info,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import { networkDetector } from "@/lib/offline/network-detector";
import { cacheAPI } from "@/lib/offline/api-cache";
import {
  getMahasiswaStats,
  getMyKelas,
  getMyJadwal,
  type MahasiswaStats,
  type MyKelas,
  type JadwalMahasiswa,
} from "@/lib/api/mahasiswa.api";

export function DashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MahasiswaStats | null>(null);
  const [myKelas, setMyKelas] = useState<MyKelas[]>([]);
  const [myJadwal, setMyJadwal] = useState<JadwalMahasiswa[]>([]);
  // ❌ REMOVED: enrollDialogOpen state

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    } else {
      // Clear data if no user
      setStats(null);
      setMyKelas([]);
      setMyJadwal([]);
    }
  }, [user?.id]);

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log(
        "[Mahasiswa Dashboard] Fetching data... (forceRefresh:",
        forceRefresh,
        ")",
      );

      // Use cacheAPI with stale-while-revalidate for offline support
      const [statsData, kelasData, jadwalData] = await Promise.all([
        cacheAPI(`mahasiswa_stats_${user?.id}`, () => getMahasiswaStats(), {
          ttl: 10 * 60 * 1000, // 10 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI(`mahasiswa_kelas_${user?.id}`, () => getMyKelas(), {
          ttl: 10 * 60 * 1000, // 10 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI(`mahasiswa_jadwal_${user?.id}`, () => getMyJadwal(5), {
          ttl: 5 * 60 * 1000, // 5 minutes (schedule changes more frequently)
          forceRefresh,
          staleWhileRevalidate: true,
        }),
      ]);

      setStats(statsData);
      setMyKelas(kelasData);
      setMyJadwal(jadwalData);

      console.log("[Mahasiswa Dashboard] Data loaded successfully");
    } catch (error) {
      // Handle offline mode gracefully
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - showing cached dashboard data");
      } else {
        console.error("Error fetching dashboard data:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const dayNames: Record<string, string> = {
    monday: "Senin",
    tuesday: "Selasa",
    wednesday: "Rabu",
    thursday: "Kamis",
    friday: "Jumat",
    saturday: "Sabtu",
    sunday: "Minggu",
    senin: "Senin",
    selasa: "Selasa",
    rabu: "Rabu",
    kamis: "Kamis",
    jumat: "Jumat",
    sabtu: "Sabtu",
    minggu: "Minggu",
  };

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <DashboardSkeleton />
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="role-page-shell surface-grid min-h-screen bg-background">
      <div className="role-page-content app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          {/* Header */}
          <GlassCard
            intensity="high"
            glow
            className="overflow-hidden rounded-4xl border border-border/50 bg-background/80 px-4 py-4 shadow-xl sm:px-6"
          >
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <div className="shrink-0 rounded-2xl bg-linear-to-br from-emerald-600 via-teal-600 to-blue-700 p-2.5 shadow-lg shadow-emerald-500/25 sm:p-3">
                <BookOpen className="h-6 w-6 text-white sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Ringkasan pembelajaran
                </p>
                <h1 className="mt-1 bg-linear-to-r from-emerald-700 via-teal-700 to-blue-800 bg-clip-text text-2xl font-extrabold leading-tight text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-blue-400 sm:text-4xl lg:text-5xl">
                  Dashboard Mahasiswa
                </h1>
                <p className="mt-2 text-sm font-semibold text-foreground/80 sm:text-base lg:text-lg">
                  Selamat datang, {" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {user?.full_name || user?.email}
                  </span>
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Info Alert (Only if no classes) */}
          {myKelas.length === 0 && (
            <Alert className="border-info/20 bg-info/10 text-info shadow-sm">
              <Info className="h-4 w-4" />
              <AlertDescription className="font-medium text-info/90">
                Anda belum terdaftar di kelas praktikum manapun. Hubungi dosen
                pengampu atau koordinator program studi untuk pendaftaran kelas.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Stats Cards */}
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Total Kelas"
              value={stats?.totalKelasPraktikum || 0}
              icon={BookOpen}
              color="green"
              description="Kelas praktikum aktif"
            />
            <DashboardCard
              title="Praktikum Hari Ini"
              value={stats?.jadwalHariIni || 0}
              icon={Calendar}
              color="blue"
              description="Agenda terjadwal"
            />
            <DashboardCard
              title="Minggu Ini"
              value={myJadwal.length || 0}
              icon={Clock}
              color="purple"
              description="Sesi 7 hari ke depan"
            />
            <DashboardCard
              title="Progress"
              value={
                stats?.totalKelasPraktikum
                  ? Math.round(
                      ((stats?.totalKelasPraktikum || 0) /
                        (stats?.totalKelasPraktikum || 1)) *
                        100,
                    )
                  : 0
              }
              icon={TrendingUp}
              color="amber"
              suffix="%"
              description="Kesiapan semester ini"
            />
          </div>

          {/* Welcome Banner */}
          {myKelas.length > 0 && (
            <GlassCard
              intensity="high"
              glow
              className="interactive-card overflow-hidden border-white/20 bg-linear-to-r from-emerald-600/95 via-teal-600/95 to-blue-700/95 text-white shadow-2xl"
            >
              <div className="absolute inset-0 bg-grid-white/10" />
              <CardContent className="relative p-5 sm:p-8">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm sm:h-20 sm:w-20 sm:rounded-3xl">
                    <Sparkles className="h-7 w-7 sm:h-10 sm:w-10" />
                  </div>
                  <div className="flex-1">
                    <h2 className="mb-1.5 text-xl font-extrabold sm:mb-2 sm:text-3xl">
                      Semangat Belajar! 🚀
                    </h2>
                    <p className="text-sm font-semibold leading-relaxed text-emerald-100 sm:text-lg">
                      Kamu terdaftar di {" "}
                      <span className="font-extrabold text-white">
                        {stats?.totalKelasPraktikum}
                      </span>{" "}
                      kelas praktikum. Jangan lupa cek jadwal hari ini ya!
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <Trophy className="h-24 w-24 text-white/20" />
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* My Classes */}
            <GlassCard
              intensity="high"
              className="group relative overflow-hidden border-border/50 bg-background/75 shadow-xl"
            >
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-emerald-400/15 blur-3xl" />
              <CardHeader className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-xl bg-linear-to-br from-emerald-500 to-green-600 p-2.5 shadow-lg shadow-emerald-500/20">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      Kelas Saya
                    </CardTitle>
                    <CardDescription className="mt-1 text-base font-medium text-muted-foreground">
                      {stats?.totalKelasPraktikum || 0} kelas praktikum yang
                      diikuti
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                {myKelas.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mb-4 inline-flex rounded-full bg-emerald-500/10 p-4">
                      <BookOpen className="h-12 w-12 text-emerald-500" />
                    </div>
                    <p className="mb-2 text-lg font-bold text-foreground">
                      Belum ada kelas yang diikuti
                    </p>
                    <p className="mx-auto max-w-sm text-base font-medium text-muted-foreground">
                      Pendaftaran kelas dilakukan oleh dosen atau admin. Silakan
                      hubungi dosen pengampu untuk informasi lebih lanjut.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myKelas.map((kelas) => (
                      <div
                        key={kelas.id}
                        className="interactive-card group flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:shadow-md"
                      >
                        <div className="shrink-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-green-600 shadow-lg transition-transform group-hover:scale-110">
                            <BookOpen className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">
                              {kelas.mata_kuliah_nama}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="border-0 bg-emerald-500/15 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                            >
                              {kelas.mata_kuliah_kode}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-muted-foreground">
                            {kelas.nama_kelas}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-muted-foreground/80">
                            {kelas.sks} SKS • {kelas.tahun_ajaran}
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </GlassCard>

            {/* Upcoming Schedule */}
            <GlassCard
              intensity="high"
              className="group relative overflow-hidden border-border/50 bg-background/75 shadow-xl"
            >
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-teal-400/15 blur-3xl" />
              <CardHeader className="relative">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded-xl bg-linear-to-br from-teal-500 to-cyan-600 p-2.5 shadow-lg shadow-teal-500/20">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      Jadwal Praktikum
                    </CardTitle>
                    <CardDescription className="mt-1 text-base font-medium text-muted-foreground">
                      {stats?.jadwalHariIni || 0} praktikum hari ini • 7 hari ke
                      depan
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                {myJadwal.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mb-4 inline-flex rounded-full bg-teal-500/10 p-4">
                      <Calendar className="h-12 w-12 text-teal-500" />
                    </div>
                    <p className="mb-2 text-lg font-bold text-foreground">
                      {myKelas.length === 0
                        ? "Belum ada jadwal praktikum"
                        : "Tidak ada jadwal minggu ini"}
                    </p>
                    {myKelas.length === 0 && (
                      <p className="mx-auto max-w-sm text-base font-medium text-muted-foreground">
                        Jadwal akan muncul setelah Anda terdaftar di kelas
                        praktikum
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myJadwal.map((jadwal) => (
                      <div
                        key={jadwal.id}
                        className="interactive-card group flex gap-3 rounded-2xl border border-teal-500/15 bg-teal-500/5 p-4 shadow-sm transition-all duration-300 hover:border-teal-500/30 hover:bg-teal-500/10 hover:shadow-md"
                      >
                        <div className="shrink-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-cyan-600 shadow-lg transition-transform group-hover:scale-110">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-bold text-foreground">
                            {jadwal.mata_kuliah_nama}
                          </h4>
                          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                            {jadwal.kelas_nama} {jadwal.topik && `• ${jadwal.topik}`}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs font-bold text-foreground/80">
                            <Clock className="h-3 w-3" />
                            {dayNames[jadwal.hari] || jadwal.hari}, {formatDate(jadwal.tanggal_praktikum)}, {formatTime(jadwal.jam_mulai)}-
                            {formatTime(jadwal.jam_selesai)}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {jadwal.lab_nama}
                          </div>
                        </div>
                        <AlertCircle className="h-5 w-5 text-teal-500 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
