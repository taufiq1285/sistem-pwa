/**
 * PresensiPage - Mahasiswa
 * View attendance records and statistics
 */

import { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import {
  getMahasiswaKehadiran,
  type MahasiswaKehadiranRecord,
  type KehadiranStatus,
} from '@/lib/api/kehadiran.api';
import { toast } from 'sonner';

export default function PresensiPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MahasiswaKehadiranRecord[]>([]);

  useEffect(() => {
    loadPresensi();
  }, []);

  const loadPresensi = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('User tidak terautentikasi');
        return;
      }

      // Get mahasiswa profile
      const { data: mahasiswaData, error: mahasiswaError } = await supabase
        .from('mahasiswa')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (mahasiswaError) throw mahasiswaError;
      if (!mahasiswaData) {
        toast.error('Profil mahasiswa tidak ditemukan');
        return;
      }

      // Load kehadiran records
      const data = await getMahasiswaKehadiran(mahasiswaData.id);
      setRecords(data);
    } catch (error) {
      console.error('Error loading presensi:', error);
      toast.error('Gagal memuat data presensi');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = records.length;
    const hadir = records.filter(r => r.status === 'hadir').length;
    const izin = records.filter(r => r.status === 'izin').length;
    const sakit = records.filter(r => r.status === 'sakit').length;
    const alpha = records.filter(r => r.status === 'alpha').length;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, izin, sakit, alpha, persentase };
  };

  const getStatusBadge = (status: KehadiranStatus) => {
    const variants: Record<KehadiranStatus, { color: string; icon: any; label: string }> = {
      hadir: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle2,
        label: 'Hadir'
      },
      izin: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: Clock,
        label: 'Izin'
      },
      sakit: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: AlertCircle,
        label: 'Sakit'
      },
      alpha: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle,
        label: 'Alpha'
      },
    };

    const variant = variants[status];
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Memuat data presensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Presensi Praktikum</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Rekap kehadiran praktikum Anda
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pertemuan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hadir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-3xl font-bold text-green-600">{stats.hadir}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Izin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="text-3xl font-bold text-blue-600">{stats.izin}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sakit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div className="text-3xl font-bold text-yellow-600">{stats.sakit}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alpha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div className="text-3xl font-bold text-red-600">{stats.alpha}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Persentase Kehadiran */}
      <Card>
        <CardHeader>
          <CardTitle>Persentase Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-primary">
              {stats.persentase}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    stats.persentase >= 75
                      ? 'bg-green-600'
                      : stats.persentase >= 50
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${stats.persentase}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {stats.persentase >= 75
                  ? 'Kehadiran Anda sangat baik!'
                  : stats.persentase >= 50
                  ? 'Tingkatkan kehadiran Anda'
                  : 'Perhatian! Kehadiran di bawah standar'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Presensi */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Presensi</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <Alert>
              <Calendar className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              <AlertDescription>
                Belum ada data presensi. Data akan muncul setelah dosen melakukan absensi.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Topik</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(record.jadwal?.tanggal_praktikum || '')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {record.jadwal?.kelas?.mata_kuliah?.nama_mk || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {record.jadwal?.kelas?.nama_kelas || '-'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.jadwal?.topik || 'Praktikum'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {record.jadwal?.laboratorium?.nama_lab || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatTime(record.jadwal?.jam_mulai || '')} -{' '}
                        {formatTime(record.jadwal?.jam_selesai || '')}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(record.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}