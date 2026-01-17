

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  BookOpen, 
  FileQuestion, 
  Award, 
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Info, // ✅ NEW: Info icon for messaging
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert'; // ✅ NEW: Alert component
// ❌ REMOVED: EnrollKelasDialog import
import {
  getMahasiswaStats,
  getMyKelas,
  getMyJadwal,
  type MahasiswaStats,
  type MyKelas,
  type JadwalMahasiswa,
} from '@/lib/api/mahasiswa.api';

export function DashboardPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MahasiswaStats | null>(null);
  const [myKelas, setMyKelas] = useState<MyKelas[]>([]);
  const [myJadwal, setMyJadwal] = useState<JadwalMahasiswa[]>([]);
  // ❌ REMOVED: enrollDialogOpen state

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, kelasData, jadwalData] = await Promise.allSettled([
        getMahasiswaStats(),
        getMyKelas(),
        getMyJadwal(5),
      ]);

      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }

      if (kelasData.status === 'fulfilled') {
        setMyKelas(kelasData.value);
      }

      if (jadwalData.status === 'fulfilled') {
        setMyJadwal(jadwalData.value);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    senin: 'Senin',
    selasa: 'Selasa',
    rabu: 'Rabu',
    kamis: 'Kamis',
    jumat: 'Jumat',
    sabtu: 'Sabtu',
    minggu: 'Minggu',
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
          <h1 className="text-3xl font-bold">Dashboard Mahasiswa</h1>
          <p className="text-gray-500 mt-1">Selamat datang, {user?.email}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Mata Kuliah</CardTitle>
              <BookOpen className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMataKuliah || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Mata kuliah aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Kuis Mendatang</CardTitle>
              <FileQuestion className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalKuis || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Belum dikerjakan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rata-rata Nilai</CardTitle>
              <Award className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.rataRataNilai ? stats.rataRataNilai.toFixed(1) : '-'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Semester ini</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Jadwal Hari Ini</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.jadwalHariIni || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Praktikum</p>
            </CardContent>
          </Card>
        </div>

        {/* ✅ UPDATED: Info Alert (Only if no classes) */}
        {myKelas.length === 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Anda belum terdaftar di kelas praktikum manapun. 
              Hubungi dosen pengampu atau koordinator program studi untuk pendaftaran kelas.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Kelas Saya</CardTitle>
              <CardDescription>Kelas yang sedang diikuti</CardDescription>
              {/* ❌ REMOVED: "+ Tambah" button */}
            </CardHeader>
            <CardContent>
              {myKelas.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Belum ada kelas yang diikuti</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Pendaftaran kelas dilakukan oleh dosen atau admin. 
                    Silakan hubungi dosen pengampu untuk informasi lebih lanjut.
                  </p>
                  {/* ❌ REMOVED: "Daftar Kelas Sekarang" button */}
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
                          <h4 className="font-medium text-sm">{kelas.mata_kuliah_nama}</h4>
                          <Badge variant="secondary" className="text-xs">{kelas.mata_kuliah_kode}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{kelas.nama_kelas}</p>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Jadwal Praktikum</CardTitle>
                <CardDescription>7 hari ke depan</CardDescription>
              </div>
              {myJadwal.length > 0 && (
                <Button variant="ghost" size="sm">
                  Lihat Semua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {myJadwal.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    {myKelas.length === 0 
                      ? 'Belum ada jadwal praktikum' 
                      : 'Tidak ada jadwal minggu ini'}
                  </p>
                  {myKelas.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
                      Jadwal akan muncul setelah Anda terdaftar di kelas praktikum
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
                        <h4 className="font-medium text-sm truncate">{jadwal.mata_kuliah_nama}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {jadwal.kelas_nama} {jadwal.topik && `• ${jadwal.topik}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          {dayNames[jadwal.hari] || jadwal.hari}, {formatDate(jadwal.tanggal_praktikum)}, {formatTime(jadwal.jam_mulai)}-{formatTime(jadwal.jam_selesai)}
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

      {/* ❌ REMOVED: EnrollKelasDialog component */}
    </div>
  );
}