/**
 * KelasStudentsCard Component
 * Displays classes with student enrollment info on dosen dashboard
 */

import { useState, useEffect } from 'react';
import { Users, Eye, BookOpen, Loader2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StudentsListDialog } from '@/components/dosen/Studentslistdialog';
import {
  getMyKelasWithStudents,
  getStudentStats,
  type KelasWithStudents,
  type StudentStats
} from '@/lib/api/dosen.api';
import { toast } from 'sonner';

export function KelasStudentsCard() {
  const [loading, setLoading] = useState(true);
  const [kelasList, setKelasList] = useState<KelasWithStudents[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    totalKelas: 0,
    averagePerKelas: 0,
  });
  const [selectedKelas, setSelectedKelas] = useState<KelasWithStudents | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [kelasData, statsData] = await Promise.all([
        getMyKelasWithStudents(),
        getStudentStats(),
      ]);
      setKelasList(kelasData);
      setStats(statsData);
    } catch {
      toast.error('Gagal memuat data mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = (kelas: KelasWithStudents) => {
    setSelectedKelas(kelas);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mahasiswa Terdaftar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mahasiswa Terdaftar
          </CardTitle>
          <CardDescription>
            Total {stats.totalStudents} mahasiswa di {stats.totalKelas} kelas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalStudents}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total Mahasiswa</div>
            </div>
            <div className="text-center border-x border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalKelas}
              </div>
              <div className="text-xs text-gray-600 mt-1">Total Kelas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.averagePerKelas}
              </div>
              <div className="text-xs text-gray-600 mt-1">Rata-rata/Kelas</div>
            </div>
          </div>

          {/* Classes List */}
          {kelasList.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada kelas aktif</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kelasList.map((kelas) => (
                <div
                  key={kelas.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{kelas.mata_kuliah_nama}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {kelas.nama_kelas}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {kelas.jumlah_mahasiswa}/{kelas.kuota} mahasiswa
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>
                          {Math.round((kelas.jumlah_mahasiswa / kelas.kuota) * 100)}% terisi
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewStudents(kelas)}
                    disabled={kelas.jumlah_mahasiswa === 0}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Mahasiswa
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Dialog */}
      {selectedKelas && (
        <StudentsListDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          kelasId={selectedKelas.id}
          kelasName={selectedKelas.nama_kelas}
          mataKuliahName={selectedKelas.mata_kuliah_nama}
        />
      )}
    </>
  );
}