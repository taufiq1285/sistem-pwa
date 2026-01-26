import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { BookOpen, Calendar, Clock, MapPin, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert"; // ✅ NEW: Alert component
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
      <div className="p-8">
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
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-extrabold">Dashboard Mahasiswa</h1>
          <p className="text-gray-500 mt-1">Selamat datang, {user?.email}</p>
        </div>

        {/* Info Alert (Only if no classes) */}
        {myKelas.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Anda belum terdaftar di kelas praktikum manapun. Hubungi dosen
              pengampu atau koordinator program studi untuk pendaftaran kelas.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Classes */}
          <Card className="border-0 shadow-xl p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Kelas Saya
              </CardTitle>
              <CardDescription>
                {stats?.totalKelasPraktikum || 0} kelas praktikum yang diikuti
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myKelas.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Belum ada kelas yang diikuti
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Pendaftaran kelas dilakukan oleh dosen atau admin. Silakan
                    hubungi dosen pengampu untuk informasi lebih lanjut.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myKelas.map((kelas) => (
                    <div
                      key={kelas.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">
                            {kelas.mata_kuliah_nama}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {kelas.mata_kuliah_kode}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {kelas.nama_kelas}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {kelas.sks} SKS • {kelas.tahun_ajaran}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card className="border-0 shadow-xl p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Jadwal Praktikum
              </CardTitle>
              <CardDescription>
                {stats?.jadwalHariIni || 0} praktikum hari ini • 7 hari ke depan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myJadwal.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    {myKelas.length === 0
                      ? "Belum ada jadwal praktikum"
                      : "Tidak ada jadwal minggu ini"}
                  </p>
                  {myKelas.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
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
                      className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {jadwal.mata_kuliah_nama}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {jadwal.kelas_nama}{" "}
                          {jadwal.topik && `• ${jadwal.topik}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          {dayNames[jadwal.hari] || jadwal.hari},{" "}
                          {formatDate(jadwal.tanggal_praktikum)},{" "}
                          {formatTime(jadwal.jam_mulai)}-
                          {formatTime(jadwal.jam_selesai)}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {jadwal.lab_nama}
                        </div>
                      </div>
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
