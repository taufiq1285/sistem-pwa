import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
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
  Package
} from 'lucide-react';
import {
  getDosenStats,
  getMyMataKuliah,
  getUpcomingPracticum,
  getPendingGrading,
  getActiveKuis,
  getMyBorrowingRequests,
  type DosenStats,
  type MataKuliahWithStats,
  type UpcomingPracticum as UpcomingPracticumType,
  type PendingGrading as PendingGradingType,
  type KuisWithStats,
  type MyBorrowingRequest,
} from '@/lib/api/dosen.api';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DosenStats | null>(null);
  const [mataKuliah, setMataKuliah] = useState<MataKuliahWithStats[]>([]);
  const [upcomingPracticum, setUpcomingPracticum] = useState<UpcomingPracticumType[]>([]);
  const [pendingGrading, setPendingGrading] = useState<PendingGradingType[]>([]);
  const [activeKuis, setActiveKuis] = useState<KuisWithStats[]>([]);
  const [peminjamanRequests, setPeminjamanRequests] = useState<MyBorrowingRequest[]>([]);

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, mkData, practicumData, gradingData, kuisData, peminjamanData] = await Promise.all([
        getDosenStats(),
        getMyMataKuliah(5),
        getUpcomingPracticum(5),
        getPendingGrading(5),
        getActiveKuis(5),
        getMyBorrowingRequests(5),
      ]);

      setStats(statsData);
      setMataKuliah(mkData);
      setUpcomingPracticum(practicumData);
      setPendingGrading(gradingData);
      setActiveKuis(kuisData);
      setPeminjamanRequests(peminjamanData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Format time
  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // Day name mapping
  const dayNames: Record<string, string> = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu',
  };

  // Status badge variant mapping
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'borrowed':
        return 'secondary';
      case 'returned':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Status label mapping
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      case 'borrowed':
        return 'Dipinjam';
      case 'returned':
        return 'Dikembalikan';
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
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Dosen</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang, {user?.full_name || user?.email}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dosen/mata-kuliah')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Kelas
              </CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalKelas || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Kelas aktif</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dosen/mahasiswa')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Mahasiswa
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMahasiswa || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Semua kelas</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dosen/kuis')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Kuis Aktif
              </CardTitle>
              <FileQuestion className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeKuis || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Sedang berjalan</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/dosen/penilaian')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Grading
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingGrading || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Perlu dinilai</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Akses cepat ke fitur utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button variant="outline" className="justify-start" onClick={() => navigate('/dosen/kuis')}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Kuis
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/dosen/penilaian')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Input Nilai
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/dosen/jadwal')}>
                <Calendar className="mr-2 h-4 w-4" />
                Lihat Jadwal
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/dosen/materi')}>
                <FileText className="mr-2 h-4 w-4" />
                Upload Materi
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Courses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mata Kuliah Saya</CardTitle>
                <CardDescription>Mata kuliah yang diampu</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dosen/mata-kuliah')}>
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {mataKuliah.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada mata kuliah</p>
              ) : (
                <div className="space-y-3">
                  {mataKuliah.map((mk) => (
                    <div
                      key={mk.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/dosen/mata-kuliah')}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{mk.nama_mk}</h4>
                          <Badge variant="secondary" className="text-xs">{mk.kode_mk}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {mk.totalKelas} kelas • {mk.totalMahasiswa} mahasiswa • {mk.sks} SKS
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Practicum */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Jadwal Praktikum</CardTitle>
                <CardDescription>7 hari ke depan</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dosen/jadwal')}>
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingPracticum.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Tidak ada jadwal minggu ini</p>
              ) : (
                <div className="space-y-3">
                  {upcomingPracticum.map((jadwal) => (
                    <div key={jadwal.id} className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{jadwal.mata_kuliah_nama}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{jadwal.kelas_nama} • {jadwal.topik}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          {dayNames[jadwal.hari.toLowerCase()] || jadwal.hari},{' '}
                          {formatDate(jadwal.tanggal_praktikum)},{' '}
                          {formatTime(jadwal.jam_mulai)}-{formatTime(jadwal.jam_selesai)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">📍 {jadwal.lab_nama}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Grading */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Perlu Dinilai</CardTitle>
                <CardDescription>Kuis yang sudah dikumpulkan</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dosen/penilaian')}>
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {pendingGrading.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Tidak ada yang perlu dinilai</p>
              ) : (
                <div className="space-y-3">
                  {pendingGrading.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/dosen/penilaian')}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.mahasiswa_nama}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">NIM: {item.mahasiswa_nim}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.mata_kuliah_nama} • {item.kuis_judul}</p>
                        <p className="text-xs text-gray-500 mt-1">Dikumpulkan: {formatDate(item.submitted_at)}</p>
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

          {/* Active Kuis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kuis Aktif</CardTitle>
                <CardDescription>Kuis yang sedang berjalan</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dosen/kuis')}>
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {activeKuis.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Tidak ada kuis aktif</p>
              ) : (
                <div className="space-y-3">
                  {activeKuis.map((kuis) => (
                    <div
                      key={kuis.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate('/dosen/kuis')}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{kuis.judul}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{kuis.kelas_nama}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(kuis.tanggal_mulai)} - {formatDate(kuis.tanggal_selesai)}
                        </p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-sm font-medium">{kuis.submitted_count}/{kuis.total_attempts}</div>
                        <p className="text-xs text-gray-500">dikumpulkan</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NEW SECTION: Borrowing Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Permintaan Peminjaman Alat</CardTitle>
              <CardDescription>Status peminjaman alat praktikum Anda</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dosen/peminjaman')}>
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {peminjamanRequests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Tidak ada permintaan peminjaman</p>
            ) : (
              <div className="space-y-3">
                {peminjamanRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/dosen/peminjaman')}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{request.inventaris_nama}</h4>
                        <Badge variant={getStatusVariant(request.status)} className="text-xs">
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Kode: {request.inventaris_kode} • Lab: {request.laboratorium_nama}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Jumlah: {request.jumlah_pinjam} • Pinjam: {formatDate(request.tanggal_pinjam)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Rencana Kembali: {formatDate(request.tanggal_kembali_rencana)}
                      </p>
                      {request.keperluan && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{request.keperluan}"</p>
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