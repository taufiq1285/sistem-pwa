/**
 * PenilaianPage - Dosen
 *
 * Purpose: Manage student grades/assessments
 * Features:
 * - View all students in a class
 * - Input/update grades (kuis, tugas, UTS, UAS, praktikum, kehadiran)
 * - Auto-calculate final grade (nilai_akhir) and letter grade (nilai_huruf)
 * - Batch update for multiple students
 * - Export grades (future feature)
 * - View statistics
 */

import { useState, useEffect } from 'react';
import { Save, Loader2, Search, Settings, Edit2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  getMahasiswaForGrading,
  updateNilai,
  batchUpdateNilai,
  getNilaiSummary,
  type BatchUpdateNilaiData,
} from '@/lib/api/nilai.api';
import { getKelas, updateKelas } from '@/lib/api/kelas.api';
import type { NilaiWithMahasiswa, NilaiSummary } from '@/types/nilai.types';
import type { Kelas, BobotNilai } from '@/types/kelas.types';
import { toast } from 'sonner';
import { calculateNilaiAkhir, getNilaiHuruf, getDefaultBobotNilai, validateBobotNilai } from '@/lib/validations/nilai.schema';

// ============================================================================
// COMPONENT
// ============================================================================

export default function DosenPenilaianPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [mahasiswaList, setMahasiswaList] = useState<NilaiWithMahasiswa[]>([]);
  const [summary, setSummary] = useState<NilaiSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editedGrades, setEditedGrades] = useState<Map<string, Partial<NilaiWithMahasiswa>>>(new Map());

  // Bobot Nilai State
  const [showBobotDialog, setShowBobotDialog] = useState(false);
  const [currentBobot, setCurrentBobot] = useState<BobotNilai>(getDefaultBobotNilai());
  const [editingBobot, setEditingBobot] = useState<BobotNilai>(getDefaultBobotNilai());

  // Edit Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMahasiswa, setEditingMahasiswa] = useState<NilaiWithMahasiswa | null>(null);
  const [editFormData, setEditFormData] = useState({
    nilai_kuis: 0,
    nilai_tugas: 0,
    nilai_uts: 0,
    nilai_uas: 0,
    nilai_praktikum: 0,
    nilai_kehadiran: 0,
    keterangan: '',
  });

  // Confirmation Dialog State (untuk mencegah kesalahan input)
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [showSwitchKelasWarning, setShowSwitchKelasWarning] = useState(false);
  const [pendingKelasSwitch, setPendingKelasSwitch] = useState<string>('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.dosen?.id) {
      loadKelas();
    }
     
  }, [user?.dosen?.id]);

  useEffect(() => {
    if (selectedKelas) {
      loadAllKelasData();
    }
     
  }, [selectedKelas]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadKelas = async () => {
    try {
      setLoading(true);
      if (!user?.dosen?.id) return;

      const data = await getKelas({ dosen_id: user.dosen.id });
      setKelasList(data);

      // Auto-select first kelas if available
      if (data.length > 0 && !selectedKelas) {
        setSelectedKelas(data[0].id);
      }
    } catch (error) {
      console.error('Error loading kelas:', error);
      toast.error('Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all kelas data in PARALLEL for better performance
   */
  const loadAllKelasData = async () => {
    try {
      setLoading(true);

      // Run all API calls in PARALLEL using Promise.all
      const [mahasiswaData, summaryData] = await Promise.all([
        getMahasiswaForGrading(selectedKelas),
        getNilaiSummary(selectedKelas),
      ]);

      // Update states
      setMahasiswaList(mahasiswaData);
      setSummary(summaryData);
      setEditedGrades(new Map()); // Reset edited grades

      // Load bobot nilai (synchronous)
      loadBobotNilai();
    } catch (error) {
      console.error('Error loading kelas data:', error);
      toast.error('Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  // loadMahasiswaGrades removed (unused)

  // loadSummary removed (unused)

  const loadBobotNilai = () => {
    const kelas = kelasList.find(k => k.id === selectedKelas);
    if (kelas?.bobot_nilai) {
      setCurrentBobot(kelas.bobot_nilai);
      setEditingBobot(kelas.bobot_nilai);
    } else {
      const defaultBobot = getDefaultBobotNilai();
      setCurrentBobot(defaultBobot);
      setEditingBobot(defaultBobot);
    }
  };

  // ============================================================================
  // BOBOT NILAI MANAGEMENT
  // ============================================================================

  const handleOpenBobotDialog = () => {
    setEditingBobot({ ...currentBobot });
    setShowBobotDialog(true);
  };

  const handleBobotChange = (field: keyof BobotNilai, value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue));

    setEditingBobot(prev => ({
      ...prev,
      [field]: clampedValue,
    }));
  };

  const handleSaveBobot = async () => {
    try {
      // Validate total = 100%
      const validation = validateBobotNilai(editingBobot);
      if (!validation.valid) {
        toast.error(`Total bobot harus 100%. Saat ini: ${validation.total}%`);
        return;
      }

      setSaving(true);

      // Update kelas with new bobot
      await updateKelas(selectedKelas, {
        bobot_nilai: editingBobot,
      });

      setCurrentBobot(editingBobot);
      setShowBobotDialog(false);
      toast.success('Bobot nilai berhasil diperbarui');

      // Reload kelas to get updated data
      await loadKelas();

      // Recalculate all grades with new weights
      setEditedGrades(new Map());
    } catch (error) {
      console.error('Error saving bobot:', error);
      toast.error('Gagal menyimpan bobot nilai');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // GRADE EDITING
  // ============================================================================

  const handleGradeChange = (
    mahasiswaId: string,
    field: string,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue));

    const currentData = editedGrades.get(mahasiswaId) || {};
    const mahasiswa = mahasiswaList.find(m => m.mahasiswa_id === mahasiswaId);

    if (!mahasiswa) return;

    // Merge current values with edited values
    const merged = {
      ...mahasiswa,
      ...currentData,
      [field]: clampedValue,
    };

    // Recalculate nilai_akhir and nilai_huruf using current bobot
    const nilaiAkhir = calculateNilaiAkhir(
      merged.nilai_kuis ?? 0,
      merged.nilai_tugas ?? 0,
      merged.nilai_uts ?? 0,
      merged.nilai_uas ?? 0,
      merged.nilai_praktikum ?? 0,
      merged.nilai_kehadiran ?? 0,
      currentBobot
    );

    const nilaiHuruf = getNilaiHuruf(nilaiAkhir);

    const updatedData = {
      ...currentData,
      [field]: clampedValue,
      nilai_akhir: nilaiAkhir,
      nilai_huruf: nilaiHuruf,
    };

    const newEditedGrades = new Map(editedGrades);
    newEditedGrades.set(mahasiswaId, updatedData);
    setEditedGrades(newEditedGrades);
  };

  // ============================================================================
  // KELAS SWITCHING WITH WARNING
  // ============================================================================

  const handleKelasChange = (newKelasId: string) => {
    // Check if there are unsaved changes
    if (editedGrades.size > 0) {
      setPendingKelasSwitch(newKelasId);
      setShowSwitchKelasWarning(true);
    } else {
      setSelectedKelas(newKelasId);
    }
  };

  const confirmKelasSwitch = () => {
    setEditedGrades(new Map()); // Discard unsaved changes
    setSelectedKelas(pendingKelasSwitch);
    setShowSwitchKelasWarning(false);
    setPendingKelasSwitch('');
  };

  const cancelKelasSwitch = () => {
    setShowSwitchKelasWarning(false);
    setPendingKelasSwitch('');
  };

  // ============================================================================
  // SAVE OPERATIONS
  // ============================================================================

  const handleSaveAll = () => {
    if (editedGrades.size === 0) {
      toast.info('Tidak ada perubahan untuk disimpan');
      return;
    }
    // Show confirmation dialog first
    setShowSaveConfirmDialog(true);
  };

  const confirmSave = async () => {
    try {
      setSaving(true);
      setShowSaveConfirmDialog(false);

      const batchData: BatchUpdateNilaiData = {
        kelas_id: selectedKelas,
        nilai_list: Array.from(editedGrades.entries()).map(([mahasiswaId, data]) => ({
          mahasiswa_id: mahasiswaId,
          nilai_kuis: data.nilai_kuis,
          nilai_tugas: data.nilai_tugas,
          nilai_uts: data.nilai_uts,
          nilai_uas: data.nilai_uas,
          nilai_praktikum: data.nilai_praktikum,
          nilai_kehadiran: data.nilai_kehadiran,
          keterangan: data.keterangan || undefined,
        })),
      };

      await batchUpdateNilai(batchData);

      toast.success('Nilai berhasil disimpan');
      setEditedGrades(new Map());
      await loadAllKelasData();
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingle = async (mahasiswaId: string) => {
    const data = editedGrades.get(mahasiswaId);
    if (!data) return;

    try {
      setSaving(true);

      await updateNilai(mahasiswaId, selectedKelas, {
        mahasiswa_id: mahasiswaId,
        kelas_id: selectedKelas,
        nilai_kuis: data.nilai_kuis,
        nilai_tugas: data.nilai_tugas,
        nilai_uts: data.nilai_uts,
        nilai_uas: data.nilai_uas,
        nilai_praktikum: data.nilai_praktikum,
        nilai_kehadiran: data.nilai_kehadiran,
        keterangan: data.keterangan || undefined,
      });

      toast.success('Nilai berhasil disimpan');

      // Remove from edited grades
      const newEditedGrades = new Map(editedGrades);
      newEditedGrades.delete(mahasiswaId);
      setEditedGrades(newEditedGrades);

      await loadAllKelasData();
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // EDIT DIALOG HANDLERS
  // ============================================================================

  const handleOpenEditDialog = (mahasiswa: NilaiWithMahasiswa) => {
    setEditingMahasiswa(mahasiswa);

    // Get current or edited values
    const editedData = editedGrades.get(mahasiswa.mahasiswa_id);

    setEditFormData({
      nilai_kuis: editedData?.nilai_kuis ?? mahasiswa.nilai_kuis ?? 0,
      nilai_tugas: editedData?.nilai_tugas ?? mahasiswa.nilai_tugas ?? 0,
      nilai_uts: editedData?.nilai_uts ?? mahasiswa.nilai_uts ?? 0,
      nilai_uas: editedData?.nilai_uas ?? mahasiswa.nilai_uas ?? 0,
      nilai_praktikum: editedData?.nilai_praktikum ?? mahasiswa.nilai_praktikum ?? 0,
      nilai_kehadiran: editedData?.nilai_kehadiran ?? mahasiswa.nilai_kehadiran ?? 0,
      keterangan: editedData?.keterangan ?? mahasiswa.keterangan ?? '',
    });

    setShowEditDialog(true);
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEditDialog = async () => {
    if (!editingMahasiswa) return;

    try {
      setSaving(true);

      await updateNilai(editingMahasiswa.mahasiswa_id, selectedKelas, {
        mahasiswa_id: editingMahasiswa.mahasiswa_id,
        kelas_id: selectedKelas,
        nilai_kuis: editFormData.nilai_kuis,
        nilai_tugas: editFormData.nilai_tugas,
        nilai_uts: editFormData.nilai_uts,
        nilai_uas: editFormData.nilai_uas,
        nilai_praktikum: editFormData.nilai_praktikum,
        nilai_kehadiran: editFormData.nilai_kehadiran,
        keterangan: editFormData.keterangan || undefined,
      });

      toast.success('Nilai berhasil disimpan');

      // Remove from edited grades if exists
      const newEditedGrades = new Map(editedGrades);
      newEditedGrades.delete(editingMahasiswa.mahasiswa_id);
      setEditedGrades(newEditedGrades);

      setShowEditDialog(false);
      setEditingMahasiswa(null);

      await loadAllKelasData();
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Gagal menyimpan nilai');
    } finally {
      setSaving(false);
    }
  };

  const handleRowDoubleClick = (mahasiswa: NilaiWithMahasiswa) => {
    handleOpenEditDialog(mahasiswa);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  // Get current selected kelas info
  const currentKelas = kelasList.find(k => k.id === selectedKelas);
  const currentMataKuliah = currentKelas?.mata_kuliah?.nama_mk || 'Tidak diketahui';
  const currentNamaKelas = currentKelas?.nama_kelas || '';

  const getDisplayValue = (mahasiswa: NilaiWithMahasiswa, field: keyof NilaiWithMahasiswa): number => {
    const edited = editedGrades.get(mahasiswa.mahasiswa_id);
    if (edited && field in edited) {
      return edited[field] as number;
    }
    return mahasiswa[field] as number ?? 0;
  };

  const filteredMahasiswa = mahasiswaList.filter(m => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.mahasiswa.nim.toLowerCase().includes(query) ||
      m.mahasiswa.user.full_name.toLowerCase().includes(query)
    );
  });

  const hasChanges = editedGrades.size > 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && kelasList.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Penilaian Mahasiswa</h1>
          <p className="text-gray-600">Input dan kelola nilai mahasiswa</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedKelas && (
            <Button
              variant="outline"
              onClick={handleOpenBobotDialog}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Atur Bobot Nilai
            </Button>
          )}
          <Button
            onClick={handleSaveAll}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Simpan Semua {hasChanges && `(${editedGrades.size})`}
          </Button>
        </div>
      </div>

      {/* Active Kelas Alert - PROMINENT */}
      {selectedKelas && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-base font-semibold text-blue-900 dark:text-blue-100">
            <div className="flex items-center gap-2">
              <span>Sedang menginput nilai untuk:</span>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-md">
                {currentMataKuliah} - {currentNamaKelas}
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Kelas Selection, Summary & Bobot Nilai */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pilih Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedKelas} onValueChange={handleKelasChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {kelasList.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.id}>
                    {kelas.mata_kuliah?.nama_mk} - {kelas.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Nilai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Mahasiswa</p>
                  <p className="text-2xl font-bold">{summary.total_mahasiswa}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sudah Dinilai</p>
                  <p className="text-2xl font-bold text-green-600">{summary.sudah_dinilai}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Belum Dinilai</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.belum_dinilai}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rata-rata</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summary.rata_rata.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedKelas && (
          <Card>
            <CardHeader>
              <CardTitle>Bobot Nilai Saat Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kuis:</span>
                  <span className="font-semibold">{currentBobot.kuis}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tugas:</span>
                  <span className="font-semibold">{currentBobot.tugas}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">UTS:</span>
                  <span className="font-semibold">{currentBobot.uts}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">UAS:</span>
                  <span className="font-semibold">{currentBobot.uas}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Praktikum:</span>
                  <span className="font-semibold">{currentBobot.praktikum}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kehadiran:</span>
                  <span className="font-semibold">{currentBobot.kehadiran}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari mahasiswa (NIM atau nama)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grades Table */}
      {selectedKelas ? (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Nilai Mahasiswa</CardTitle>
            <CardDescription>
              Nilai akan otomatis dihitung ketika Anda mengubah komponen nilai
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredMahasiswa.length === 0 ? (
              <Alert>
                <AlertDescription>
                  {searchQuery
                    ? 'Tidak ada mahasiswa yang sesuai dengan pencarian'
                    : 'Belum ada mahasiswa terdaftar di kelas ini'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>NIM</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-center">Kuis</TableHead>
                      <TableHead className="text-center">Tugas</TableHead>
                      <TableHead className="text-center">UTS</TableHead>
                      <TableHead className="text-center">UAS</TableHead>
                      <TableHead className="text-center">Praktikum</TableHead>
                      <TableHead className="text-center">Kehadiran</TableHead>
                      <TableHead className="text-center">Nilai Akhir</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                      <TableHead className="w-32">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMahasiswa.map((mahasiswa, index) => {
                      const isEdited = editedGrades.has(mahasiswa.mahasiswa_id);
                      const editedData = editedGrades.get(mahasiswa.mahasiswa_id);

                      const nilaiAkhir = editedData?.nilai_akhir ?? mahasiswa.nilai_akhir ?? 0;
                      const nilaiHuruf = editedData?.nilai_huruf ?? mahasiswa.nilai_huruf ?? '-';

                      return (
                        <TableRow
                          key={mahasiswa.mahasiswa_id}
                          className={isEdited ? 'bg-yellow-50 cursor-pointer' : 'cursor-pointer'}
                          onDoubleClick={() => handleRowDoubleClick(mahasiswa)}
                          title="Double-click untuk edit detail"
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono">{mahasiswa.mahasiswa.nim}</TableCell>
                          <TableCell className="font-medium">
                            {mahasiswa.mahasiswa.user.full_name}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={getDisplayValue(mahasiswa, 'nilai_kuis')}
                              onChange={(e) =>
                                handleGradeChange(mahasiswa.mahasiswa_id, 'nilai_kuis', e.target.value)
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={getDisplayValue(mahasiswa, 'nilai_tugas')}
                              onChange={(e) =>
                                handleGradeChange(mahasiswa.mahasiswa_id, 'nilai_tugas', e.target.value)
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={getDisplayValue(mahasiswa, 'nilai_uts')}
                              onChange={(e) =>
                                handleGradeChange(mahasiswa.mahasiswa_id, 'nilai_uts', e.target.value)
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={getDisplayValue(mahasiswa, 'nilai_uas')}
                              onChange={(e) =>
                                handleGradeChange(mahasiswa.mahasiswa_id, 'nilai_uas', e.target.value)
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={getDisplayValue(mahasiswa, 'nilai_praktikum')}
                              onChange={(e) =>
                                handleGradeChange(mahasiswa.mahasiswa_id, 'nilai_praktikum', e.target.value)
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={getDisplayValue(mahasiswa, 'nilai_kehadiran')}
                              onChange={(e) =>
                                handleGradeChange(mahasiswa.mahasiswa_id, 'nilai_kehadiran', e.target.value)
                              }
                              className="w-20 text-center"
                            />
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {typeof nilaiAkhir === 'number' ? nilaiAkhir.toFixed(2) : '0.00'}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 rounded font-bold ${
                              nilaiHuruf.startsWith('A') ? 'bg-green-100 text-green-800' :
                              nilaiHuruf.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                              nilaiHuruf.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                              nilaiHuruf.startsWith('D') ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {nilaiHuruf}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDialog(mahasiswa);
                                }}
                                disabled={saving}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              {isEdited && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveSingle(mahasiswa.mahasiswa_id);
                                  }}
                                  disabled={saving}
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  Simpan
                                </Button>
                              )}
                            </div>
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
      ) : (
        <Alert>
          <AlertDescription>
            Pilih kelas terlebih dahulu untuk melihat daftar mahasiswa
          </AlertDescription>
        </Alert>
      )}

      {/* Info */}
      {hasChanges && (
        <Alert>
          <AlertDescription>
            Ada {editedGrades.size} perubahan yang belum disimpan. Klik "Simpan Semua" untuk menyimpan semua perubahan.
          </AlertDescription>
        </Alert>
      )}

      {/* Bobot Nilai Configuration Dialog */}
      <Dialog open={showBobotDialog} onOpenChange={setShowBobotDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Atur Bobot Nilai</DialogTitle>
            <DialogDescription>
              Sesuaikan bobot penilaian untuk kelas ini. Total harus 100%.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            {/* Kuis */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kuis" className="text-right font-medium">
                Kuis
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="kuis"
                  type="number"
                  min="0"
                  max="100"
                  value={editingBobot.kuis}
                  onChange={(e) => handleBobotChange('kuis', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>

            {/* Tugas */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tugas" className="text-right font-medium">
                Tugas
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="tugas"
                  type="number"
                  min="0"
                  max="100"
                  value={editingBobot.tugas}
                  onChange={(e) => handleBobotChange('tugas', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>

            {/* UTS */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="uts" className="text-right font-medium">
                UTS
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="uts"
                  type="number"
                  min="0"
                  max="100"
                  value={editingBobot.uts}
                  onChange={(e) => handleBobotChange('uts', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>

            {/* UAS */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="uas" className="text-right font-medium">
                UAS
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="uas"
                  type="number"
                  min="0"
                  max="100"
                  value={editingBobot.uas}
                  onChange={(e) => handleBobotChange('uas', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>

            {/* Praktikum */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="praktikum" className="text-right font-medium">
                Praktikum
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="praktikum"
                  type="number"
                  min="0"
                  max="100"
                  value={editingBobot.praktikum}
                  onChange={(e) => handleBobotChange('praktikum', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>

            {/* Kehadiran */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kehadiran" className="text-right font-medium">
                Kehadiran
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="kehadiran"
                  type="number"
                  min="0"
                  max="100"
                  value={editingBobot.kehadiran}
                  onChange={(e) => handleBobotChange('kehadiran', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>

            {/* Total */}
            <div className="grid grid-cols-4 items-center gap-4 pt-4 border-t">
              <Label className="text-right font-bold">Total</Label>
              <div className="col-span-3">
                <div className={`text-lg font-bold ${
                  validateBobotNilai(editingBobot).valid
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {validateBobotNilai(editingBobot).total}%
                </div>
                {!validateBobotNilai(editingBobot).valid && (
                  <p className="text-sm text-red-600 mt-1">
                    Total harus 100%
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBobotDialog(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveBobot}
              disabled={!validateBobotNilai(editingBobot).valid || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mahasiswa Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Nilai Mahasiswa</DialogTitle>
            {editingMahasiswa && (
              <DialogDescription>
                <div className="space-y-1 mt-2">
                  <p className="font-mono text-sm">{editingMahasiswa.mahasiswa.nim}</p>
                  <p className="font-medium">{editingMahasiswa.mahasiswa.user.full_name}</p>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6 py-4 overflow-y-auto flex-1">
            {/* Grade Inputs - 2 columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Kuis */}
              <div className="space-y-2">
                <Label htmlFor="edit-kuis" className="font-medium">
                  Nilai Kuis ({currentBobot.kuis}%)
                </Label>
                <Input
                  id="edit-kuis"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editFormData.nilai_kuis}
                  onChange={(e) => handleEditFormChange('nilai_kuis', parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </div>

              {/* Tugas */}
              <div className="space-y-2">
                <Label htmlFor="edit-tugas" className="font-medium">
                  Nilai Tugas ({currentBobot.tugas}%)
                </Label>
                <Input
                  id="edit-tugas"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editFormData.nilai_tugas}
                  onChange={(e) => handleEditFormChange('nilai_tugas', parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </div>

              {/* UTS */}
              <div className="space-y-2">
                <Label htmlFor="edit-uts" className="font-medium">
                  Nilai UTS ({currentBobot.uts}%)
                </Label>
                <Input
                  id="edit-uts"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editFormData.nilai_uts}
                  onChange={(e) => handleEditFormChange('nilai_uts', parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </div>

              {/* UAS */}
              <div className="space-y-2">
                <Label htmlFor="edit-uas" className="font-medium">
                  Nilai UAS ({currentBobot.uas}%)
                </Label>
                <Input
                  id="edit-uas"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editFormData.nilai_uas}
                  onChange={(e) => handleEditFormChange('nilai_uas', parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </div>

              {/* Praktikum */}
              <div className="space-y-2">
                <Label htmlFor="edit-praktikum" className="font-medium">
                  Nilai Praktikum ({currentBobot.praktikum}%)
                </Label>
                <Input
                  id="edit-praktikum"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editFormData.nilai_praktikum}
                  onChange={(e) => handleEditFormChange('nilai_praktikum', parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </div>

              {/* Kehadiran */}
              <div className="space-y-2">
                <Label htmlFor="edit-kehadiran" className="font-medium">
                  Nilai Kehadiran ({currentBobot.kehadiran}%)
                </Label>
                <Input
                  id="edit-kehadiran"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editFormData.nilai_kehadiran}
                  onChange={(e) => handleEditFormChange('nilai_kehadiran', parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Calculated Grade Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Nilai Akhir</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {calculateNilaiAkhir(
                      editFormData.nilai_kuis,
                      editFormData.nilai_tugas,
                      editFormData.nilai_uts,
                      editFormData.nilai_uas,
                      editFormData.nilai_praktikum,
                      editFormData.nilai_kehadiran,
                      currentBobot
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 font-medium">Grade</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {getNilaiHuruf(
                      calculateNilaiAkhir(
                        editFormData.nilai_kuis,
                        editFormData.nilai_tugas,
                        editFormData.nilai_uts,
                        editFormData.nilai_uas,
                        editFormData.nilai_praktikum,
                        editFormData.nilai_kehadiran,
                        currentBobot
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-2">
              <Label htmlFor="edit-keterangan" className="font-medium">
                Keterangan (Opsional)
              </Label>
              <Textarea
                id="edit-keterangan"
                value={editFormData.keterangan}
                onChange={(e) => handleEditFormChange('keterangan', e.target.value)}
                placeholder="Tambahkan catatan atau keterangan..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingMahasiswa(null);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveEditDialog}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Nilai
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Konfirmasi Penyimpanan Nilai
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Anda akan menyimpan nilai untuk:</p>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  📚 {currentMataKuliah} - {currentNamaKelas}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Jumlah mahasiswa: {editedGrades.size} orang
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Pastikan Anda sudah memilih <strong>mata kuliah yang benar</strong> sebelum menyimpan.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ya, Simpan untuk {currentMataKuliah}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Switch Kelas Warning Dialog */}
      <AlertDialog open={showSwitchKelasWarning} onOpenChange={setShowSwitchKelasWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Peringatan: Ada Perubahan Belum Disimpan!
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Anda memiliki <strong>{editedGrades.size} perubahan</strong> yang belum disimpan untuk:</p>
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  📚 {currentMataKuliah} - {currentNamaKelas}
                </p>
              </div>
              <p className="text-sm text-gray-600">
                Jika Anda pindah kelas sekarang, semua perubahan akan <strong>hilang</strong>.
              </p>
              <p className="text-sm font-semibold text-orange-700">
                Apakah Anda yakin ingin pindah kelas tanpa menyimpan?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelKelasSwitch}>
              Batal, Tetap di Kelas Ini
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmKelasSwitch}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Ya, Pindah Kelas (Buang Perubahan)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}