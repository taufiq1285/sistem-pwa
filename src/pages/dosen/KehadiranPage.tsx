/**
 * KehadiranPage - Dosen
 *
 * Purpose: Input and view student attendance records
 * Features:
 * - Input attendance per jadwal praktikum (bulk)
 * - View attendance report by kelas with date range
 * - Edit/delete individual attendance records
 * - Statistics and summary view
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { Search, RefreshCw, Edit2, Trash2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getKehadiranByJadwal,
  getKehadiranByKelas,
  saveKehadiranBulk,
  updateKehadiran,
  deleteKehadiran,
  type KehadiranStatus,
} from '@/lib/api/kehadiran.api';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceRecord {
  mahasiswa_id: string;
  nim: string;
  nama: string;
  status: KehadiranStatus;
  keterangan: string;
  kehadiran_id?: string;
}

interface JadwalOption {
  id: string;
  kelas_nama: string;
  mata_kuliah_nama: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
}

interface KelasOption {
  id: string;
  nama_kelas: string;
  mata_kuliah_nama: string;
}

// ============================================================================
// STATUS CONSTANTS
// ============================================================================

const STATUS_OPTIONS: { value: KehadiranStatus; label: string; color: string }[] = [
  { value: 'hadir', label: 'Hadir', color: 'bg-green-100 text-green-800' },
  { value: 'izin', label: 'Izin', color: 'bg-blue-100 text-blue-800' },
  { value: 'sakit', label: 'Sakit', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alpha', label: 'Alpha', color: 'bg-red-100 text-red-800' },
];


// ============================================================================
// COMPONENT
// ============================================================================

export default function DosenKehadiranPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE - GENERAL
  // ============================================================================

  const [loading, setLoading] = useState(false);
  const [jadwalList, setJadwalList] = useState<JadwalOption[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);

  // ============================================================================
  // STATE - TAB 1: INPUT KEHADIRAN
  // ============================================================================

  const [selectedJadwal, setSelectedJadwal] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [editingRecords, setEditingRecords] = useState<Set<string>>(new Set());

  // ============================================================================
  // STATE - TAB 2: VIEW/REPORT
  // ============================================================================

  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportRecords, setReportRecords] = useState<any[]>([]);
  const [reportStats, setReportStats] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // ============================================================================
  // STATE - EDIT DIALOG
  // ============================================================================

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<AttendanceRecord>>({});

  // ============================================================================
  // STATE - DELETE DIALOG
  // ============================================================================

  const [deletingRecord] = useState<AttendanceRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.dosen?.id) {
      loadJadwalAndKelas();
    }
  }, [user?.dosen?.id]);

  // ============================================================================
  // HANDLERS - LOAD DATA
  // ============================================================================

  const loadJadwalAndKelas = async () => {
    try {
      setLoading(true);

      // Get current dosen's classes
      const { data: kelasData, error: kelasError } = await supabase
        .from('kelas')
        .select('id, nama_kelas, mata_kuliah_id')
        .eq('dosen_id', user?.dosen?.id || '');

      if (kelasError) throw kelasError;

      // Enrich kelas dengan mata kuliah info
      const enrichedKelas = await Promise.all(
        (kelasData || []).map(async (k: any) => {
          const { data: mkData } = await supabase
            .from('mata_kuliah')
            .select('nama_mk')
            .eq('id', k.mata_kuliah_id)
            .single();

          return {
            id: k.id,
            nama_kelas: k.nama_kelas,
            mata_kuliah_nama: mkData?.nama_mk || '-',
          };
        })
      );

      setKelasList(enrichedKelas);

      // Get jadwal for dosen's classes
      if (enrichedKelas.length > 0) {
        const kelasIds = enrichedKelas.map(k => k.id);
        const { data: jadwalData, error: jadwalError } = await supabase
          .from('jadwal_praktikum')
          .select('id, kelas_id, tanggal_praktikum, jam_mulai, jam_selesai')
          .in('kelas_id', kelasIds)
          .order('tanggal_praktikum', { ascending: false });

        if (jadwalError) throw jadwalError;

        // Enrich jadwal dengan kelas & mata kuliah info
        const enrichedJadwal = (jadwalData || []).map((j: any) => {
          const kelas = enrichedKelas.find(k => k.id === j.kelas_id);
          return {
            id: j.id,
            kelas_nama: kelas?.nama_kelas || '-',
            mata_kuliah_nama: kelas?.mata_kuliah_nama || '-',
            tanggal: j.tanggal_praktikum,
            jam_mulai: j.jam_mulai,
            jam_selesai: j.jam_selesai,
          };
        });

        setJadwalList(enrichedJadwal);
      }
    } catch (error) {
      console.error('Error loading jadwal and kelas:', error);
      toast.error('Gagal memuat jadwal dan kelas');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForJadwal = async (jadwalId: string) => {
    try {
      setLoading(true);

      // Get kehadiran records
      const kehadiran = await getKehadiranByJadwal(jadwalId);

      // Get all mahasiswa in this kelas (from jadwal)
      const { data: jadwalData } = await supabase
        .from('jadwal_praktikum')
        .select('kelas_id')
        .eq('id', jadwalId)
        .single();

      if (!jadwalData) throw new Error('Jadwal not found');

      // Get mahasiswa in this kelas - dari kelas_mahasiswa (enrollment)
      const { data: mahasiswaData, error: mahasiswaError } = await supabase
        .from('kelas_mahasiswa')
        .select('mahasiswa_id, mahasiswa(id, nim, user_id)')
        .eq("kelas_id", jadwalData.kelas_id!)
        .limit(100);

      if (mahasiswaError) throw mahasiswaError;

      // Get user data untuk mendapat full_name
      const mahasiswaIds = (mahasiswaData || []).map(m => m.mahasiswa.user_id);
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', mahasiswaIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u.full_name]) || []);

      // Map to attendance records
      const records = (mahasiswaData || []).map((item: any) => {
        const existing = kehadiran.find(k => k.mahasiswa_id === item.mahasiswa_id);
        return {
          mahasiswa_id: item.mahasiswa_id,
          nim: item.mahasiswa.nim,
          nama: usersMap.get(item.mahasiswa.user_id) || '-',
          status: (existing?.status || 'hadir') as KehadiranStatus,
          keterangan: existing?.keterangan || '',
          kehadiran_id: existing?.id,
        };
      });

      setAttendanceRecords(records);
      setEditingRecords(new Set());
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast.error('Gagal memuat data kehadiran');
    } finally {
      setLoading(false);
    }
  };

  const loadReportForKelas = async (kelasId: string, start: string, end: string) => {
    try {
      setIsLoadingReport(true);

      // Get kehadiran by kelas
      const kehadiran = await getKehadiranByKelas(kelasId, start, end);

      // Group by mahasiswa and calculate stats
      const mahasiswaMap = new Map<string, any>();

      kehadiran.forEach(record => {
        const key = record.mahasiswa_id;
        if (!mahasiswaMap.has(key)) {
          mahasiswaMap.set(key, {
            mahasiswa_id: record.mahasiswa_id,
            nim: record.mahasiswa.nim,
            nama: record.mahasiswa.user.full_name,
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpha: 0,
            records: [],
          });
        }

        const mhs = mahasiswaMap.get(key);
        mhs[record.status]++;
        mhs.records.push(record);
      });

      const reportData = Array.from(mahasiswaMap.values());

      // Calculate summary stats
      let totalHadir = 0, totalIzin = 0, totalSakit = 0, totalAlpha = 0;
      reportData.forEach(mhs => {
        totalHadir += mhs.hadir;
        totalIzin += mhs.izin;
        totalSakit += mhs.sakit;
        totalAlpha += mhs.alpha;
      });

      setReportRecords(reportData);
      setReportStats({
        totalHadir,
        totalIzin,
        totalSakit,
        totalAlpha,
        totalStudents: reportData.length,
      });
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Gagal memuat laporan kehadiran');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // ============================================================================
  // HANDLERS - INPUT KEHADIRAN
  // ============================================================================

  const handleStatusChange = (mahasiswaId: string, status: KehadiranStatus) => {
    setAttendanceRecords(records =>
      records.map(r =>
        r.mahasiswa_id === mahasiswaId ? { ...r, status } : r
      )
    );
    setEditingRecords(prev => new Set(prev).add(mahasiswaId));
  };

  const handleKeteranganChange = (mahasiswaId: string, keterangan: string) => {
    setAttendanceRecords(records =>
      records.map(r =>
        r.mahasiswa_id === mahasiswaId ? { ...r, keterangan } : r
      )
    );
    setEditingRecords(prev => new Set(prev).add(mahasiswaId));
  };

  const handleSaveAttendance = async () => {
    if (!selectedJadwal) {
      toast.error('Pilih jadwal terlebih dahulu');
      return;
    }

    try {
      setIsSavingAttendance(true);

      const bulkData = {
        jadwal_id: selectedJadwal,
        tanggal: new Date().toISOString().split('T')[0],
        kehadiran: attendanceRecords.map(r => ({
          mahasiswa_id: r.mahasiswa_id,
          status: r.status,
          keterangan: r.keterangan || undefined,
        })),
      };

      await saveKehadiranBulk(bulkData);
      toast.success('Kehadiran berhasil disimpan');
      setEditingRecords(new Set());

      // Reload data
      await loadAttendanceForJadwal(selectedJadwal);
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error('Gagal menyimpan kehadiran: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // ============================================================================
  // HANDLERS - VIEW/REPORT
  // ============================================================================

  const handleLoadReport = () => {
    if (!selectedKelas || !startDate || !endDate) {
      toast.error('Pilih kelas dan tanggal range');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Tanggal awal harus sebelum tanggal akhir');
      return;
    }

    loadReportForKelas(selectedKelas, startDate, endDate);
  };

  // ============================================================================
  // HANDLERS - EDIT/DELETE
  // ============================================================================

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditFormData({
      status: record.status,
      keterangan: record.keterangan,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord?.kehadiran_id) {
      toast.error('Record ID not found');
      return;
    }

    try {
      await updateKehadiran(editingRecord.kehadiran_id, {
        status: editFormData.status,
        keterangan: editFormData.keterangan,
      });
      toast.success('Kehadiran berhasil diupdate');
      setIsEditDialogOpen(false);

      // Reload report
      if (selectedKelas && startDate && endDate) {
        await loadReportForKelas(selectedKelas, startDate, endDate);
      }
    } catch (error: any) {
      toast.error('Gagal mengupdate kehadiran: ' + (error.message || 'Unknown error'));
    }
  };

  const confirmDelete = async () => {
    if (!deletingRecord?.kehadiran_id) {
      toast.error('Record ID not found');
      return;
    }

    try {
      await deleteKehadiran(deletingRecord.kehadiran_id);
      toast.success('Kehadiran berhasil dihapus');
      setIsDeleteDialogOpen(false);

      // Reload report
      if (selectedKelas && startDate && endDate) {
        await loadReportForKelas(selectedKelas, startDate, endDate);
      }
    } catch (error: any) {
      toast.error('Gagal menghapus kehadiran: ' + (error.message || 'Unknown error'));
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kehadiran Praktikum</h1>
          <p className="text-muted-foreground">Input dan lihat kehadiran mahasiswa</p>
        </div>
        <Button variant="outline" onClick={loadJadwalAndKelas}>
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="input" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">Input Kehadiran</TabsTrigger>
          <TabsTrigger value="report">View/Report</TabsTrigger>
        </TabsList>

        {/* ================================================================== */}
        {/* TAB 1: INPUT KEHADIRAN */}
        {/* ================================================================== */}

        <TabsContent value="input" className="space-y-6">
          {/* Jadwal Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Pilih Jadwal Praktikum</CardTitle>
              <CardDescription>Pilih jadwal untuk input kehadiran</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedJadwal} onValueChange={(value) => {
                  setSelectedJadwal(value);
                  loadAttendanceForJadwal(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jadwal praktikum..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jadwalList.map(jadwal => (
                      <SelectItem key={jadwal.id} value={jadwal.id}>
                        {jadwal.mata_kuliah_nama} - {jadwal.kelas_nama} ({formatDate(jadwal.tanggal)} {formatTime(jadwal.jam_mulai)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Input Table */}
          {selectedJadwal && (
            <Card>
              <CardHeader>
                <CardTitle>Input Kehadiran</CardTitle>
                <CardDescription>Atur status kehadiran untuk setiap mahasiswa</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : attendanceRecords.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Tidak ada mahasiswa dalam kelas ini atau belum ada data.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>NIM</TableHead>
                            <TableHead>Nama</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Keterangan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceRecords.map(record => (
                            <TableRow key={record.mahasiswa_id}>
                              <TableCell className="font-mono text-sm">{record.nim}</TableCell>
                              <TableCell>{record.nama}</TableCell>
                              <TableCell>
                                <Select
                                  value={record.status}
                                  onValueChange={(value) => handleStatusChange(record.mahasiswa_id, value as KehadiranStatus)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map(option => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Catatan..."
                                  value={record.keterangan}
                                  onChange={(e) => handleKeteranganChange(record.mahasiswa_id, e.target.value)}
                                  className="w-full"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedJadwal('');
                          setAttendanceRecords([]);
                          setEditingRecords(new Set());
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={handleSaveAttendance}
                        disabled={isSavingAttendance || editingRecords.size === 0}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSavingAttendance ? 'Menyimpan...' : 'Simpan Kehadiran'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ================================================================== */}
        {/* TAB 2: VIEW/REPORT */}
        {/* ================================================================== */}

        <TabsContent value="report" className="space-y-6">
          {/* Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Laporan</CardTitle>
              <CardDescription>Pilih kelas dan tanggal untuk melihat laporan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="report-kelas">Kelas</Label>
                  <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasList.map(kelas => (
                        <SelectItem key={kelas.id} value={kelas.id}>
                          {kelas.mata_kuliah_nama} - {kelas.nama_kelas}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="start-date">Dari Tanggal</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Sampai Tanggal</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={handleLoadReport} disabled={isLoadingReport}>
                  <Search className="h-4 w-4 mr-2" />
                  {isLoadingReport ? 'Loading...' : 'Tampilkan Laporan'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          {reportStats && (
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportStats.totalStudents}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Hadir</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{reportStats.totalHadir}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Izin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{reportStats.totalIzin}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Sakit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{reportStats.totalSakit}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Alpha</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{reportStats.totalAlpha}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Report Table */}
          {reportRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detail Kehadiran</CardTitle>
                <CardDescription>Rekap kehadiran per mahasiswa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NIM</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead className="text-center">Hadir</TableHead>
                        <TableHead className="text-center">Izin</TableHead>
                        <TableHead className="text-center">Sakit</TableHead>
                        <TableHead className="text-center">Alpha</TableHead>
                        <TableHead className="text-center">Persentase</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportRecords.map(record => {
                        const total = record.hadir + record.izin + record.sakit + record.alpha;
                        const persentase = total > 0 ? Math.round((record.hadir / total) * 100) : 0;
                        return (
                          <TableRow key={record.mahasiswa_id}>
                            <TableCell className="font-mono text-sm">{record.nim}</TableCell>
                            <TableCell>{record.nama}</TableCell>
                            <TableCell className="text-center">{record.hadir}</TableCell>
                            <TableCell className="text-center">{record.izin}</TableCell>
                            <TableCell className="text-center">{record.sakit}</TableCell>
                            <TableCell className="text-center">{record.alpha}</TableCell>
                            <TableCell className="text-center font-medium">{persentase}%</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const firstRecord = record.records[0];
                                  if (firstRecord) {
                                    handleEditRecord({
                                      mahasiswa_id: record.mahasiswa_id,
                                      nim: record.nim,
                                      nama: record.nama,
                                      status: firstRecord.status,
                                      keterangan: firstRecord.keterangan || '',
                                      kehadiran_id: firstRecord.id,
                                    });
                                  }
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedKelas && reportStats === null && !isLoadingReport && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Klik "Tampilkan Laporan" untuk melihat data kehadiran.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* ================================================================== */}
      {/* EDIT DIALOG */}
      {/* ================================================================== */}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kehadiran</DialogTitle>
            <DialogDescription>Update status kehadiran mahasiswa</DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">{editingRecord.nama}</Label>
                <p className="text-sm text-muted-foreground">{editingRecord.nim}</p>
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editFormData.status || 'hadir'}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, status: value as KehadiranStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-keterangan">Keterangan</Label>
                <Textarea
                  id="edit-keterangan"
                  placeholder="Tambahkan catatan..."
                  value={editFormData.keterangan || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, keterangan: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* DELETE DIALOG */}
      {/* ================================================================== */}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Kehadiran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus record kehadiran ini?
            </DialogDescription>
          </DialogHeader>

          {deletingRecord && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="text-sm font-medium">Record yang akan dihapus:</p>
                <p className="text-lg font-bold mt-1">{deletingRecord.nama}</p>
                <p className="text-sm text-muted-foreground">{deletingRecord.nim}</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
