/**
 * NilaiPage - Mahasiswa
 *
 * Purpose: View grades/assessments for all enrolled classes
 * Features:
 * - View all grades by semester/class
 * - See detailed breakdown (kuis, tugas, UTS, UAS, praktikum, kehadiran)
 * - View final grade (nilai_akhir) and letter grade (nilai_huruf)
 * - Filter by semester
 * - Download transcript (future feature)
 * - View IPK/GPA (future feature)
 */

import { useState, useEffect } from 'react';
import { Loader2, FileText, Download, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/hooks/useAuth';
import { getNilaiByMahasiswa } from '@/lib/api/nilai.api';
import type { Nilai } from '@/types/nilai.types';
import { toast } from 'sonner';
import { getGradeStatus } from '@/lib/validations/nilai.schema';

// ============================================================================
// COMPONENT
// ============================================================================

export default function MahasiswaNilaiPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [filteredNilai, setFilteredNilai] = useState<Nilai[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>('all');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.mahasiswa?.id) {
      loadNilai();
    }
     
  }, [user?.mahasiswa?.id]);

  useEffect(() => {
    filterNilai();
     
  }, [nilaiList, selectedSemester, selectedTahunAjaran]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadNilai = async () => {
    try {
      setLoading(true);
      if (!user?.mahasiswa?.id) return;

      const data = await getNilaiByMahasiswa(user.mahasiswa.id);
      setNilaiList(data);
    } catch (error) {
      console.error('Error loading nilai:', error);
      toast.error('Gagal memuat data nilai');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filterNilai = () => {
    let filtered = [...nilaiList];

    if (selectedSemester !== 'all') {
      filtered = filtered.filter(n =>
        n.kelas?.semester_ajaran?.toString() === selectedSemester
      );
    }

    if (selectedTahunAjaran !== 'all') {
      filtered = filtered.filter(n =>
        n.kelas?.tahun_ajaran === selectedTahunAjaran
      );
    }

    setFilteredNilai(filtered);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getSemesterOptions = () => {
    const semesters = new Set(
      nilaiList
        .map(n => n.kelas?.semester_ajaran)
        .filter(s => s !== undefined)
    );
    return Array.from(semesters).sort((a, b) => (b ?? 0) - (a ?? 0));
  };

  const getTahunAjaranOptions = () => {
    const years = new Set(
      nilaiList
        .map(n => n.kelas?.tahun_ajaran)
        .filter(y => y !== undefined)
    );
    return Array.from(years).sort().reverse();
  };

  const calculateIPK = (): number => {
    if (filteredNilai.length === 0) return 0;

    const totalNilai = filteredNilai.reduce((sum, n) => {
      return sum + (n.nilai_akhir || 0);
    }, 0);

    return totalNilai / filteredNilai.length;
  };

  const getTotalSKS = (): number => {
    return filteredNilai.reduce((sum, n) => {
      return sum + (n.kelas?.mata_kuliah?.sks || 0);
    }, 0);
  };

  const getGradeDistribution = () => {
    const distribution = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
    };

    filteredNilai.forEach(n => {
      const huruf = n.nilai_huruf?.charAt(0);
      if (huruf && huruf in distribution) {
        distribution[huruf as keyof typeof distribution]++;
      }
    });

    return distribution;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const ipk = calculateIPK();
  const totalSKS = getTotalSKS();
  const gradeDistribution = getGradeDistribution();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nilai Akademik</h1>
          <p className="text-gray-600">Lihat nilai dan transkrip Anda</p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => toast.info('Fitur download transkrip akan segera tersedia')}
        >
          <Download className="w-4 h-4" />
          Download Transkrip
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              IPK / GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <p className="text-3xl font-bold">{ipk.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total SKS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              <p className="text-3xl font-bold">{totalSKS}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mata Kuliah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <p className="text-3xl font-bold">{filteredNilai.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Grade A
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <p className="text-3xl font-bold">{gradeDistribution.A}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Filter Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Semester</SelectItem>
                {getSemesterOptions().map((sem) => (
                  <SelectItem key={sem} value={sem?.toString() || ''}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filter Tahun Ajaran</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTahunAjaran} onValueChange={setSelectedTahunAjaran}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {getTahunAjaranOptions().map((year) => (
                  <SelectItem key={year} value={year || ''}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Nilai</CardTitle>
          <CardDescription>
            Nilai akademik untuk semua mata kuliah yang Anda ambil
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNilai.length === 0 ? (
            <Alert>
              <AlertDescription>
                {nilaiList.length === 0
                  ? 'Belum ada data nilai'
                  : 'Tidak ada nilai yang sesuai dengan filter'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Kode MK</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead className="text-center">Semester</TableHead>
                    <TableHead className="text-center">Kuis</TableHead>
                    <TableHead className="text-center">Tugas</TableHead>
                    <TableHead className="text-center">UTS</TableHead>
                    <TableHead className="text-center">UAS</TableHead>
                    <TableHead className="text-center">Praktikum</TableHead>
                    <TableHead className="text-center">Kehadiran</TableHead>
                    <TableHead className="text-center">Nilai Akhir</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNilai.map((nilai, index) => {
                    const gradeStatus = getGradeStatus(nilai.nilai_akhir || 0);

                    return (
                      <TableRow key={nilai.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-mono">
                          {nilai.kelas?.mata_kuliah?.kode_mk}
                        </TableCell>
                        <TableCell className="font-medium">
                          {nilai.kelas?.mata_kuliah?.nama_mk}
                        </TableCell>
                        <TableCell className="text-center">
                          {nilai.kelas?.mata_kuliah?.sks}
                        </TableCell>
                        <TableCell className="text-center">
                          {nilai.kelas?.semester_ajaran}
                        </TableCell>
                        <TableCell className="text-center">
                          {nilai.nilai_kuis?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-center">
                          {nilai.nilai_tugas?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-center">
                          {nilai.nilai_uts?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-center">
                          {nilai.nilai_uas?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-center">
                          {nilai.nilai_praktikum?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-center">
                          {nilai.nilai_kehadiran?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {nilai.nilai_akhir?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded font-bold ${
                            nilai.nilai_huruf?.startsWith('A') ? 'bg-green-100 text-green-800' :
                            nilai.nilai_huruf?.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                            nilai.nilai_huruf?.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                            nilai.nilai_huruf?.startsWith('D') ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {nilai.nilai_huruf || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            gradeStatus.color === 'green'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {gradeStatus.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      {filteredNilai.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Nilai</CardTitle>
            <CardDescription>
              Sebaran nilai huruf untuk semester yang dipilih
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    grade === 'A' ? 'text-green-600' :
                    grade === 'B' ? 'text-blue-600' :
                    grade === 'C' ? 'text-yellow-600' :
                    grade === 'D' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-600">Grade {grade}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Keterangan Bobot Nilai</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Kuis:</span> 15%
            </div>
            <div>
              <span className="font-semibold">Tugas:</span> 20%
            </div>
            <div>
              <span className="font-semibold">UTS:</span> 25%
            </div>
            <div>
              <span className="font-semibold">UAS:</span> 30%
            </div>
            <div>
              <span className="font-semibold">Praktikum:</span> 5%
            </div>
            <div>
              <span className="font-semibold">Kehadiran:</span> 5%
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Nilai Akhir = (Kuis × 15%) + (Tugas × 20%) + (UTS × 25%) + (UAS × 30%) + (Praktikum × 5%) + (Kehadiran × 5%)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}