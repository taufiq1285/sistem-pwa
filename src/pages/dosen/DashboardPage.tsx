import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Package
} from 'lucide-react';
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
} from '@/lib/api/dosen.api';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DosenStats | null>(null);
  const [myKelas, setMyKelas] = useState<KelasWithStats[]>([]);
  const [upcomingPracticum, setUpcomingPracticum] = useState<UpcomingPracticumType[]>([]);
  const [pendingGrading, setPendingGrading] = useState<PendingGradingType[]>([]);
  const [activeKuis, setActiveKuis] = useState<KuisWithStats[]>([]);
  const [peminjamanRequests, setPeminjamanRequests] = useState<MyBorrowingRequest[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, kelasData, practicumData, gradingData, kuisData, peminjamanData] = await Promise.allSettled([
        getDosenStats(),
        getMyKelas(5),
        getUpcomingPracticum(5),
        getPendingGrading(5),
        getActiveKuis(5),
        getMyBorrowingRequests(5),
      ]);

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }

      if (kelasData.status === 'fulfilled') {
        setMyKelas(kelasData.value || []);
      }

      if (practicumData.status === 'fulfilled') {
        setUpcomingPracticum(practicumData.value || []);
      }

      if (gradingData.status === 'fulfilled') {
        setPendingGrading(gradingData.value || []);
      }

      if (kuisData.status === 'fulfilled') {
        setActiveKuis(kuisData.value || []);
      }

      if (peminjamanData.status === 'fulfilled') {
        setPeminjamanRequests(peminjamanData.value || []);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const dayNames: Record<string, string> = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu',
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'menunggu': return 'outline';
      case 'disetujui': return 'default';
      case 'ditolak': return 'destructive';
      case 'dipinjam': return 'secondary';
      case 'dikembalikan': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'menunggu': return 'Menunggu';
      case 'disetujui': return 'Disetujui';
      case 'ditolak': return 'Ditolak';
      case 'dipinjam': return 'Dipinjam';
      case 'dikembalikan': return 'Dikembalikan';
      default: return status;
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Dosen</h1>
          <p className="text-gray-500 mt-1">Selamat datang, {user?.email}</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Kelas</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalKelas || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Kelas aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Mahasiswa</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMahasiswa || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Semua kelas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Kuis Aktif</CardTitle>
              <FileQuestion className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeKuis || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Sedang berjalan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Grading</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingGrading || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Perlu dinilai</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Akses cepat ke fitur utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/dosen/kuis/create')}>
                <Plus className="h-5 w-5" />
                <span>Buat Kuis</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/dosen/penilaian')}>
                <BarChart3 className="h-5 w-5" />
                <span>Input Nilai</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/dosen/jadwal')}>
                <Calendar className="h-5 w-5" />
                <span>Lihat Jadwal</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/dosen/materi')}>
                <FileText className="h-5 w-5" />
                <span>Upload Materi</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ✅ FIXED: Kelas Saya - Removed "Lihat Semua" button */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Kelas Saya</CardTitle>
                <CardDescription>Kelas yang sedang diampu</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {myKelas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada kelas yang diampu</p>
              ) : (
                <div className="space-y-3">
                  {myKelas.map((kelas) => (
                    <div key={kelas.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{kelas.mata_kuliah_nama || 'Praktikum'}</h4>
                          <Badge variant="secondary" className="text-xs">{kelas.kode_kelas}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{kelas.nama_kelas}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {kelas.totalMahasiswa} mahasiswa • {kelas.tahun_ajaran}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                          {dayNames[jadwal.hari.toLowerCase()] || jadwal.hari}, {formatDate(jadwal.tanggal_praktikum)}, {formatTime(jadwal.jam_mulai)}-{formatTime(jadwal.jam_selesai)}
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
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/dosen/penilaian')}>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.mahasiswa_nama}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">NIM: {item.mahasiswa_nim}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.mata_kuliah_nama} • {item.kuis_judul}</p>
                        <p className="text-xs text-gray-500 mt-1">Dikumpulkan: {formatDate(item.submitted_at)}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 flex-shrink-0">Attempt #{item.attempt_number}</Badge>
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
                    <div key={kuis.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/dosen/kuis')}>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{kuis.judul}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{kuis.kelas_nama}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(kuis.tanggal_mulai)} - {formatDate(kuis.tanggal_selesai)}</p>
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
                  <div key={request.id} className="flex gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate('/dosen/peminjaman')}>
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{request.inventaris_nama}</h4>
                        <Badge variant={getStatusVariant(request.status)} className="text-xs">{getStatusLabel(request.status)}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Kode: {request.inventaris_kode} • Lab: {request.laboratorium_nama}</p>
                      <p className="text-xs text-gray-500 mt-1">Jumlah: {request.jumlah_pinjam} • Pinjam: {formatDate(request.tanggal_pinjam)}</p>
                      <p className="text-xs text-gray-500">Rencana Kembali: {formatDate(request.tanggal_kembali_rencana)}</p>
                      {request.keperluan && <p className="text-xs text-gray-600 mt-1 italic">"{request.keperluan}"</p>}
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