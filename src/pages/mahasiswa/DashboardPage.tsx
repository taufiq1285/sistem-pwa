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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-page-shell min-h-screen bg-linear-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950">
      <div className="role-page-content p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30 shrink-0">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 leading-tight">
                Dashboard Mahasiswa
              </h1>
              <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">
                Selamat datang,{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {user?.full_name || user?.email}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert (Only if no classes) */}
        {myKelas.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50 shadow-lg">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 font-semibold">
              Anda belum terdaftar di kelas praktikum manapun. Hubungi dosen
              pengampu atau koordinator program studi untuk pendaftaran kelas.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="interactive-card border border-white/20 shadow-lg bg-linear-to-br from-emerald-500 to-green-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-semibold mb-1">
                    Total Kelas
                  </p>
                  <p className="text-4xl font-extrabold">
                    {stats?.totalKelasPraktikum || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <BookOpen className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="interactive-card border border-white/20 shadow-lg bg-linear-to-br from-blue-500 to-cyan-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-semibold mb-1">
                    Praktikum Hari Ini
                  </p>
                  <p className="text-4xl font-extrabold">
                    {stats?.jadwalHariIni || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="interactive-card border border-white/20 shadow-lg bg-linear-to-br from-purple-500 to-violet-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-semibold mb-1">
                    Minggu Ini
                  </p>
                  <p className="text-4xl font-extrabold">
                    {myJadwal.length || 0}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Clock className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="interactive-card border border-white/20 shadow-lg bg-linear-to-br from-orange-500 to-amber-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-semibold mb-1">
                    Progress
                  </p>
                  <p className="text-4xl font-extrabold">
                    {stats?.totalKelasPraktikum
                      ? Math.round(
                          ((stats?.totalKelasPraktikum || 0) /
                            (stats?.totalKelasPraktikum || 1)) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Banner */}
        {myKelas.length > 0 && (
          <Card className="interactive-card border-0 shadow-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/10" />
            <CardContent className="p-5 sm:p-8 relative">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-2xl sm:rounded-3xl flex items-center justify-center backdrop-blur-sm shrink-0">
                  <Sparkles className="h-7 w-7 sm:h-10 sm:w-10" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-3xl font-extrabold mb-1.5 sm:mb-2">
                    Semangat Belajar! 🚀
                  </h2>
                  <p className="text-sm sm:text-lg font-semibold text-emerald-100 leading-relaxed">
                    Kamu terdaftar di{" "}
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
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Classes */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2.5 bg-linear-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    Kelas Saya
                  </CardTitle>
                  <CardDescription className="text-base font-semibold text-gray-700 dark:text-gray-400 mt-1">
                    {stats?.totalKelasPraktikum || 0} kelas praktikum yang
                    diikuti
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {myKelas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-4">
                    <BookOpen className="h-12 w-12 text-emerald-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    Belum ada kelas yang diikuti
                  </p>
                  <p className="text-base font-medium text-gray-600 max-w-sm mx-auto">
                    Pendaftaran kelas dilakukan oleh dosen atau admin. Silakan
                    hubungi dosen pengampu untuk informasi lebih lanjut.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myKelas.map((kelas) => (
                    <div
                      key={kelas.id}
                      className="interactive-card flex items-center gap-3 p-4 border-2 border-emerald-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                      <div className="shrink-0">
                        <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900">
                            {kelas.mata_kuliah_nama}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-emerald-100 text-emerald-700 font-semibold"
                          >
                            {kelas.mata_kuliah_kode}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-gray-600 mt-1">
                          {kelas.nama_kelas}
                        </p>
                        <p className="text-xs font-semibold text-gray-500 mt-1">
                          {kelas.sks} SKS • {kelas.tahun_ajaran}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <CardHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2.5 bg-linear-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg shadow-teal-500/30">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-teal-900 dark:text-teal-100">
                    Jadwal Praktikum
                  </CardTitle>
                  <CardDescription className="text-base font-semibold text-gray-700 dark:text-gray-400 mt-1">
                    {stats?.jadwalHariIni || 0} praktikum hari ini • 7 hari ke
                    depan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {myJadwal.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 bg-teal-50 rounded-full mb-4">
                    <Calendar className="h-12 w-12 text-teal-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-2">
                    {myKelas.length === 0
                      ? "Belum ada jadwal praktikum"
                      : "Tidak ada jadwal minggu ini"}
                  </p>
                  {myKelas.length === 0 && (
                    <p className="text-base font-medium text-gray-600 max-w-sm mx-auto">
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
                      className="interactive-card flex gap-3 p-4 border-2 border-teal-100 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all duration-300 shadow-sm hover:shadow-md group"
                    >
                      <div className="shrink-0">
                        <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate text-gray-900">
                          {jadwal.mata_kuliah_nama}
                        </h4>
                        <p className="text-xs font-semibold text-gray-600 mt-0.5">
                          {jadwal.kelas_nama}{" "}
                          {jadwal.topik && `• ${jadwal.topik}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-700">
                          <Clock className="h-3 w-3" />
                          {dayNames[jadwal.hari] || jadwal.hari},{" "}
                          {formatDate(jadwal.tanggal_praktikum)},{" "}
                          {formatTime(jadwal.jam_mulai)}-
                          {formatTime(jadwal.jam_selesai)}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {jadwal.lab_nama}
                        </div>
                      </div>
                      <AlertCircle className="h-5 w-5 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
