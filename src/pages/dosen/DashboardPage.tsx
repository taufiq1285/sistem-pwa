import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  FileQuestion,
  ClipboardCheck,
  Calendar,
  BarChart3,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
  Package,
} from "lucide-react";
import {
  getDosenStats,
  getMyKelas,
  getUpcomingPracticum,
  getPendingGrading,
  getActiveKuis,
  getMyBorrowingRequests,
  type DosenStats,
  type KelasWithStats,
  type UpcomingPracticum as UpcomingPracticumType,
  type PendingGrading as PendingGradingType,
  type KuisWithStats,
  type MyBorrowingRequest,
} from "@/lib/api/dosen.api";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DosenStats | null>(null);
  const [myKelas, setMyKelas] = useState<KelasWithStats[]>([]);
  const [upcomingPracticum, setUpcomingPracticum] = useState<
    UpcomingPracticumType[]
  >([]);
  const [pendingGrading, setPendingGrading] = useState<PendingGradingType[]>(
    [],
  );
  const [activeKuis, setActiveKuis] = useState<KuisWithStats[]>([]);
  const [peminjamanRequests, setPeminjamanRequests] = useState<
    MyBorrowingRequest[]
  >([]);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    } else {
      // Clear data if no user
      setStats(null);
      setMyKelas([]);
      setUpcomingPracticum([]);
      setPendingGrading([]);
      setActiveKuis([]);
      setPeminjamanRequests([]);
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        statsData,
        kelasData,
        practicumData,
        gradingData,
        kuisData,
        peminjamanData,
      ] = await Promise.allSettled([
        getDosenStats(),
        getMyKelas(5),
        getUpcomingPracticum(5),
        getPendingGrading(5),
        getActiveKuis(5),
        getMyBorrowingRequests(5),
      ]);

      if (statsData.status === "fulfilled") {
        setStats(statsData.value);
      }

      if (kelasData.status === "fulfilled") {
        setMyKelas(kelasData.value || []);
      }

      if (practicumData.status === "fulfilled") {
        setUpcomingPracticum(practicumData.value || []);
      }

      if (gradingData.status === "fulfilled") {
        setPendingGrading(gradingData.value || []);
      }

      if (kuisData.status === "fulfilled") {
        setActiveKuis(kuisData.value || []);
      }

      if (peminjamanData.status === "fulfilled") {
        setPeminjamanRequests(peminjamanData.value || []);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Gagal memuat data dashboard. Silakan refresh halaman.");
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
  };

  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "menunggu":
        return "outline";
      case "disetujui":
        return "default";
      case "ditolak":
        return "destructive";
      case "dipinjam":
        return "secondary";
      case "dikembalikan":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "menunggu":
        return "Menunggu";
      case "disetujui":
        return "Disetujui";
      case "ditolak":
        return "Ditolak";
      case "dipinjam":
        return "Dipinjam";
      case "dikembalikan":
        return "Dikembalikan";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 🎨 Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              Selamat Datang Kembali! 👋
            </h1>
            <p className="text-blue-100 text-lg">{user?.email}</p>
            <p className="text-blue-200 text-sm mt-1">
              Dashboard Dosen • Sistem Praktikum PWA
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 🎨 Modern Stats Cards with Gradient */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/90">
                Total Kelas
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {stats?.totalKelas || 0}
              </div>
              <p className="text-xs text-blue-100 mt-1 font-medium">
                Kelas aktif diampu
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600"></div>
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/90">
                Total Mahasiswa
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {stats?.totalMahasiswa || 0}
              </div>
              <p className="text-xs text-green-100 mt-1 font-medium">
                Mahasiswa terdaftar
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600"></div>
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/90">
                Kuis Aktif
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileQuestion className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {stats?.activeKuis || 0}
              </div>
              <p className="text-xs text-purple-100 mt-1 font-medium">
                Sedang berjalan
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600"></div>
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/90">
                Pending Grading
              </CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white">
                {stats?.pendingGrading || 0}
              </div>
              <p className="text-xs text-orange-100 mt-1 font-medium">
                Perlu dinilai segera
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 🎨 Quick Actions with Modern Design */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="text-xl">⚡ Quick Actions</CardTitle>
            <CardDescription>Akses cepat ke fitur utama sistem</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Button
                variant="outline"
                className="h-auto flex-col gap-3 py-6 border-2 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all group"
                onClick={() => navigate("/dosen/kuis/create")}
              >
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-500 transition-colors">
                  <Plus className="h-6 w-6 text-blue-600 group-hover:text-white" />
                </div>
                <span className="font-semibold">Buat Kuis Baru</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-3 py-6 border-2 hover:border-green-500 hover:bg-green-50 hover:shadow-md transition-all group"
                onClick={() => navigate("/dosen/penilaian")}
              >
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-500 transition-colors">
                  <BarChart3 className="h-6 w-6 text-green-600 group-hover:text-white" />
                </div>
                <span className="font-semibold">Input Nilai</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-3 py-6 border-2 hover:border-purple-500 hover:bg-purple-50 hover:shadow-md transition-all group"
                onClick={() => navigate("/dosen/jadwal")}
              >
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-500 transition-colors">
                  <Calendar className="h-6 w-6 text-purple-600 group-hover:text-white" />
                </div>
                <span className="font-semibold">Kelola Jadwal</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-3 py-6 border-2 hover:border-orange-500 hover:bg-orange-50 hover:shadow-md transition-all group"
                onClick={() => navigate("/dosen/materi")}
              >
                <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-500 transition-colors">
                  <FileText className="h-6 w-6 text-orange-600 group-hover:text-white" />
                </div>
                <span className="font-semibold">Upload Materi</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 🎨 Content Grid - Modern Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 🔒 Kelas Saya - PRIVACY: Only shows this dosen's classes */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">📚 Kelas Saya</CardTitle>
                  <CardDescription>Kelas yang sedang Anda ampu</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {myKelas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    Belum ada kelas yang diampu
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Kelas Anda akan muncul di sini
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myKelas.map((kelas) => (
                    <div
                      key={kelas.id}
                      className="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                    >
                      <div className="shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {kelas.mata_kuliah_nama || "Praktikum"}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="text-xs font-medium"
                          >
                            {kelas.kode_kelas}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          {kelas.nama_kelas}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-blue-600 font-medium">
                            👥 {kelas.totalMahasiswa} mahasiswa
                          </span>
                          <span className="text-xs text-gray-500">
                            📅 {kelas.tahun_ajaran}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      📅 Jadwal Praktikum
                    </CardTitle>
                    <CardDescription>7 hari ke depan</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-purple-100"
                  onClick={() => navigate("/dosen/jadwal")}
                >
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {upcomingPracticum.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    Tidak ada jadwal minggu ini
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Jadwal Anda akan muncul di sini
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingPracticum.map((jadwal) => (
                    <div
                      key={jadwal.id}
                      className="flex gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer group"
                    >
                      <div className="shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">
                          {jadwal.mata_kuliah_nama}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5 font-medium">
                          {jadwal.kelas_nama} • {jadwal.topik}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-purple-600 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {dayNames[jadwal.hari.toLowerCase()] ||
                            jadwal.hari}, {formatDate(jadwal.tanggal_praktikum)}
                          , {formatTime(jadwal.jam_mulai)}-
                          {formatTime(jadwal.jam_selesai)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          📍 {jadwal.lab_nama}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Perlu Dinilai</CardTitle>
                <CardDescription>Kuis yang sudah dikumpulkan</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dosen/penilaian")}
              >
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {pendingGrading.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Tidak ada yang perlu dinilai
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingGrading.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate("/dosen/penilaian")}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.mahasiswa_nama}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          NIM: {item.mahasiswa_nim}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.mata_kuliah_nama} • {item.kuis_judul}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Dikumpulkan: {formatDate(item.submitted_at)}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2 flex-shrink-0">
                        Attempt #{item.attempt_number}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kuis Aktif</CardTitle>
                <CardDescription>Kuis yang sedang berjalan</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dosen/kuis")}
              >
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {activeKuis.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Tidak ada kuis aktif
                </p>
              ) : (
                <div className="space-y-3">
                  {activeKuis.map((kuis) => (
                    <div
                      key={kuis.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate("/dosen/kuis")}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {kuis.judul}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {kuis.kelas_nama}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(kuis.tanggal_mulai)} -{" "}
                          {formatDate(kuis.tanggal_selesai)}
                        </p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-sm font-medium">
                          {kuis.submitted_count}/{kuis.total_attempts}
                        </div>
                        <p className="text-xs text-gray-500">dikumpulkan</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Permintaan Peminjaman Alat</CardTitle>
              <CardDescription>
                Status peminjaman alat praktikum Anda
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dosen/peminjaman")}
            >
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {peminjamanRequests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Tidak ada permintaan peminjaman
              </p>
            ) : (
              <div className="space-y-3">
                {peminjamanRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate("/dosen/peminjaman")}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {request.inventaris_nama}
                        </h4>
                        <Badge
                          variant={getStatusVariant(request.status)}
                          className="text-xs"
                        >
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Kode: {request.inventaris_kode} • Lab:{" "}
                        {request.laboratorium_nama}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Jumlah: {request.jumlah_pinjam} • Pinjam:{" "}
                        {formatDate(request.tanggal_pinjam)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Rencana Kembali:{" "}
                        {formatDate(request.tanggal_kembali_rencana)}
                      </p>
                      {request.keperluan && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          "{request.keperluan}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
