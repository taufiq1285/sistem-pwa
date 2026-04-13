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

import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Search,
  Settings,
  Edit2,
  AlertTriangle,
  CheckCircle,
  FileText,
  ClipboardCheck,
  Users,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermintaanPerbaikanTab } from "@/components/features/penilaian/PermintaanPerbaikanTab";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getMahasiswaForGrading,
  updateNilai,
  batchUpdateNilai,
  getNilaiSummary,
  type BatchUpdateNilaiData,
} from "@/lib/api/nilai.api";
import { getKelas, updateKelas } from "@/lib/api/kelas.api";
import { getMyKelas } from "@/lib/api/dosen.api";
import { getMataKuliah } from "@/lib/api/mata-kuliah.api";
import type { NilaiWithMahasiswa, NilaiSummary } from "@/types/nilai.types";
import type { Kelas, BobotNilai } from "@/types/kelas.types";
import { toast } from "sonner";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import {
  calculateNilaiAkhir,
  getNilaiHuruf,
  getDefaultBobotNilai,
  validateBobotNilai,
} from "@/lib/validations/nilai.schema";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";

// ============================================================================
// COMPONENT
// ============================================================================

export default function DosenPenilaianPage() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mataKuliahList, setMataKuliahList] = useState<
    Array<{ id: string; nama_mk: string; kode_mk: string }>
  >([]);
  const [selectedMataKuliah, setSelectedMataKuliah] = useState<string>("");
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [mahasiswaList, setMahasiswaList] = useState<NilaiWithMahasiswa[]>([]);
  const [summary, setSummary] = useState<NilaiSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editedGrades, setEditedGrades] = useState<
    Map<string, Partial<NilaiWithMahasiswa>>
  >(new Map());

  // Bobot Nilai State
  const [showBobotDialog, setShowBobotDialog] = useState(false);
  const [currentBobot, setCurrentBobot] = useState<BobotNilai>(
    getDefaultBobotNilai(),
  );
  const [editingBobot, setEditingBobot] = useState<BobotNilai>(
    getDefaultBobotNilai(),
  );

  // Edit Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMahasiswa, setEditingMahasiswa] =
    useState<NilaiWithMahasiswa | null>(null);
  const [editFormData, setEditFormData] = useState({
    nilai_kuis: 0,
    nilai_tugas: 0,
    nilai_uts: 0,
    nilai_uas: 0,
    nilai_praktikum: 0,
    nilai_kehadiran: 0,
    keterangan: "",
  });

  // Confirmation Dialog State (untuk mencegah kesalahan input)
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [showSwitchKelasWarning, setShowSwitchKelasWarning] = useState(false);
  const [pendingKelasSwitch, setPendingKelasSwitch] = useState<string>("");
  const [showSwitchMataKuliahWarning, setShowSwitchMataKuliahWarning] =
    useState(false);
  const [pendingMataKuliahSwitch, setPendingMataKuliahSwitch] =
    useState<string>("");

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.dosen?.id) {
      loadMataKuliahDiajarkan();
    }
  }, [user?.dosen?.id]);

  useEffect(() => {
    if (selectedMataKuliah) {
      loadKelas();
    } else {
      setKelasList([]);
      setSelectedKelas("");
    }
  }, [selectedMataKuliah]);

  useEffect(() => {
    if (selectedKelas) {
      loadAllKelasData();
    }
  }, [selectedKelas]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load mata kuliah yang diajarkan oleh dosen
   */
  const loadMataKuliahDiajarkan = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!user?.dosen?.id) return;

      // 🎯 Fetch mata kuliah with offline caching
      const mataKuliahData = await cacheAPI(
        `dosen_mata_kuliah_${user?.dosen?.id}`,
        () => getMataKuliah({ is_active: true }),
        {
          ttl: 20 * 60 * 1000, // 20 minutes (mata kuliah jarang berubah)
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      const mataKuliahArray = mataKuliahData.map((mk: any) => ({
        id: mk.id,
        nama_mk: mk.nama_mk,
        kode_mk: mk.kode_mk,
      }));
      setMataKuliahList(mataKuliahArray);

      console.log("[Penilaian] Mata kuliah loaded:", mataKuliahArray.length);
    } catch (error) {
      console.error("Error loading mata kuliah:", error);
      toast.error("Gagal memuat data mata kuliah");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load kelas untuk mata kuliah yang dipilih
   */
  const loadKelas = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!user?.dosen?.id || !selectedMataKuliah) return;

      // 🎯 Load all kelas with offline caching
      const allKelas = await cacheAPI(
        `dosen_kelas_penilaian_${user?.dosen?.id}`,
        () => getMyKelas(),
        {
          ttl: 15 * 60 * 1000, // 15 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      setKelasList(allKelas as unknown as Kelas[]);
      console.log("[Penilaian] Kelas loaded:", allKelas.length);
    } catch (error) {
      console.error("Error loading kelas:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all kelas data in PARALLEL for better performance
   */
  const loadAllKelasData = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Run all API calls in PARALLEL using cacheAPI
      const [mahasiswaData, summaryData] = await Promise.all([
        cacheAPI(
          `dosen_mahasiswa_${selectedKelas}`,
          () => getMahasiswaForGrading(selectedKelas),
          {
            ttl: 5 * 60 * 1000, // 5 minutes (grading changes frequently)
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
        cacheAPI(
          `dosen_nilai_summary_${selectedKelas}`,
          () => getNilaiSummary(selectedKelas),
          {
            ttl: 5 * 60 * 1000, // 5 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
      ]);

      // Update states
      setMahasiswaList(mahasiswaData);
      setSummary(summaryData);
      setEditedGrades(new Map()); // Reset edited grades

      // Load bobot nilai (synchronous)
      loadBobotNilai();

      console.log(
        "[Penilaian] Kelas data loaded:",
        mahasiswaData.length,
        "students",
      );
    } catch (error) {
      console.error("Error loading kelas data:", error);
      toast.error("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  };

  // loadMahasiswaGrades removed (unused)

  // loadSummary removed (unused)

  const loadBobotNilai = () => {
    const kelas = kelasList.find((k) => k.id === selectedKelas);
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

    setEditingBobot((prev) => ({
      ...prev,
      [field]: clampedValue,
    }));
  };

  const handleSaveBobot = async () => {
    if (!isOnline) {
      toast.error(
        "Tidak dapat menyimpan bobot nilai saat offline. Hubungkan internet terlebih dahulu.",
      );
      return;
    }

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
      toast.success("Bobot nilai berhasil diperbarui");

      // Reload kelas to get updated data
      await loadKelas();

      // Recalculate all grades with new weights
      setEditedGrades(new Map());
    } catch (error) {
      console.error("Error saving bobot:", error);
      toast.error("Gagal menyimpan bobot nilai");
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
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue));

    const currentData = editedGrades.get(mahasiswaId) || {};
    const mahasiswa = mahasiswaList.find((m) => m.mahasiswa_id === mahasiswaId);

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
      currentBobot,
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
  // MATA KULIAH & KELAS SWITCHING WITH WARNING
  // ============================================================================

  const handleMataKuliahChange = (newMataKuliahId: string) => {
    // Check if there are unsaved changes
    if (editedGrades.size > 0) {
      setPendingMataKuliahSwitch(newMataKuliahId);
      setShowSwitchMataKuliahWarning(true);
    } else {
      setSelectedMataKuliah(newMataKuliahId);
      setSelectedKelas(""); // Reset kelas selection
    }
  };

  const confirmMataKuliahSwitch = () => {
    setEditedGrades(new Map()); // Discard unsaved changes
    setSelectedMataKuliah(pendingMataKuliahSwitch);
    setSelectedKelas(""); // Reset kelas selection
    setShowSwitchMataKuliahWarning(false);
    setPendingMataKuliahSwitch("");
  };

  const cancelMataKuliahSwitch = () => {
    setShowSwitchMataKuliahWarning(false);
    setPendingMataKuliahSwitch("");
  };

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
    setPendingKelasSwitch("");
  };

  const cancelKelasSwitch = () => {
    setShowSwitchKelasWarning(false);
    setPendingKelasSwitch("");
  };

  // ============================================================================
  // SAVE OPERATIONS
  // ============================================================================

  const handleSaveAll = () => {
    if (!isOnline) {
      toast.error(
        "Tidak dapat menyimpan nilai saat offline. Hubungkan internet terlebih dahulu.",
      );
      return;
    }
    if (editedGrades.size === 0) {
      toast.info("Tidak ada perubahan untuk disimpan");
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
        mata_kuliah_id: selectedMataKuliah,
        nilai_list: Array.from(editedGrades.entries()).map(
          ([mahasiswaId, data]) => ({
            mahasiswa_id: mahasiswaId,
            nilai_kuis: data.nilai_kuis,
            nilai_tugas: data.nilai_tugas,
            nilai_uts: data.nilai_uts,
            nilai_uas: data.nilai_uas,
            nilai_praktikum: data.nilai_praktikum,
            nilai_kehadiran: data.nilai_kehadiran,
            keterangan: data.keterangan || undefined,
          }),
        ),
      };

      await batchUpdateNilai(batchData);

      toast.success("Nilai berhasil disimpan");
      setEditedGrades(new Map());
      await loadAllKelasData();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error("Gagal menyimpan nilai");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingle = async (mahasiswaId: string) => {
    const data = editedGrades.get(mahasiswaId);
    if (!data) return;

    if (!isOnline) {
      toast.error(
        "Tidak dapat menyimpan nilai saat offline. Hubungkan internet terlebih dahulu.",
      );
      return;
    }

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

      toast.success("Nilai berhasil disimpan");

      // Remove from edited grades
      const newEditedGrades = new Map(editedGrades);
      newEditedGrades.delete(mahasiswaId);
      setEditedGrades(newEditedGrades);

      await loadAllKelasData();
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Gagal menyimpan nilai");
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
      nilai_praktikum:
        editedData?.nilai_praktikum ?? mahasiswa.nilai_praktikum ?? 0,
      nilai_kehadiran:
        editedData?.nilai_kehadiran ?? mahasiswa.nilai_kehadiran ?? 0,
      keterangan: editedData?.keterangan ?? mahasiswa.keterangan ?? "",
    });

    setShowEditDialog(true);
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEditDialog = async () => {
    if (!editingMahasiswa) return;

    if (!isOnline) {
      toast.error(
        "Tidak dapat menyimpan nilai saat offline. Hubungkan internet terlebih dahulu.",
      );
      return;
    }

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

      toast.success("Nilai berhasil disimpan");

      // Remove from edited grades if exists
      const newEditedGrades = new Map(editedGrades);
      newEditedGrades.delete(editingMahasiswa.mahasiswa_id);
      setEditedGrades(newEditedGrades);

      setShowEditDialog(false);
      setEditingMahasiswa(null);

      await loadAllKelasData();
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Gagal menyimpan nilai");
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

  // Get current selected mata kuliah info
  const currentMataKuliahInfo = mataKuliahList.find(
    (mk) => mk.id === selectedMataKuliah,
  );
  const currentMataKuliah = currentMataKuliahInfo?.nama_mk || "Tidak diketahui";
  const currentKodeMataKuliah = currentMataKuliahInfo?.kode_mk || "";

  // Get current selected kelas info
  const currentKelas = kelasList.find((k) => k.id === selectedKelas);
  const currentNamaKelas = currentKelas?.nama_kelas || "";

  const getDisplayValue = (
    mahasiswa: NilaiWithMahasiswa,
    field: keyof NilaiWithMahasiswa,
  ): string => {
    const edited = editedGrades.get(mahasiswa.mahasiswa_id);

    let value: number | undefined = undefined;

    if (edited && field in edited) {
      value = edited[field] as number;
    } else if (field in mahasiswa) {
      value = mahasiswa[field] as number;
    }

    // Return empty string for null/undefined values
    return value !== null && value !== undefined && !isNaN(value)
      ? value.toString()
      : "";
  };

  // Check if mahasiswa has been graded
  const isMahasiswaGraded = (mahasiswa: NilaiWithMahasiswa): boolean => {
    const gradeFields = [
      "nilai_uts",
      "nilai_uas",
      "nilai_praktikum",
      "nilai_kehadiran",
    ];
    return gradeFields.some((field) => {
      const edited = editedGrades.get(mahasiswa.mahasiswa_id);

      let value: number | undefined = undefined;

      if (edited && field in edited) {
        value = edited[field] as number;
      } else if (field in mahasiswa) {
        value = mahasiswa[field] as number;
      }

      return (
        value !== null && value !== undefined && !isNaN(value) && value > 0
      );
    });
  };

  // Get input styling based on whether value is empty or not
  const getInputClass = (
    mahasiswa: NilaiWithMahasiswa,
    field: keyof NilaiWithMahasiswa,
  ): string => {
    const hasValue = getDisplayValue(mahasiswa, field) !== "";
    const baseClass = "w-20 text-center border transition-colors";

    if (hasValue) {
      return `${baseClass} border-success/40 bg-success/5 focus:border-success focus:bg-success/10`;
    } else {
      return `${baseClass} border-border/50 bg-warning/5 focus:border-warning/60 focus:bg-warning/10 placeholder:text-muted-foreground/60`;
    }
  };

  const filteredMahasiswa = (mahasiswaList || []).filter((m) => {
    if (!m || !m.mahasiswa || !m.mahasiswa.user) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (m.mahasiswa.nim && m.mahasiswa.nim.toLowerCase().includes(query)) ||
      (m.mahasiswa.user.full_name &&
        m.mahasiswa.user.full_name.toLowerCase().includes(query))
    );
  });

  const hasChanges = editedGrades.size > 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && kelasList.length === 0) {
    return (
      <div className="role-page-shell">
        <div className="role-page-content flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="role-page-shell">
      <div className="role-page-content space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3">
              <div className="p-3 bg-linear-to-br from-primary to-accent rounded-2xl shadow-lg shadow-primary/30">
                <ClipboardCheck className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-primary to-accent dark:from-primary/80 dark:to-accent/80">
                  Penilaian Mahasiswa
                </h1>
                <p className="text-sm sm:text-base md:text-lg font-bold text-muted-foreground mt-1">
                  {selectedKelas
                    ? "Input nilai mahasiswa dengan visual indicators untuk kemudahan tracking"
                    : "Pilih mata kuliah dan kelas untuk memulai penilaian"}
                </p>
              </div>
            </div>
            <p className="text-sm sm:text-base font-semibold text-muted-foreground dark:text-muted-foreground/60 ml-1">
              Kelola nilai mahasiswa dengan mudah dan akurat
            </p>
          </div>
          {selectedKelas && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              {!isOnline && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning/10 border border-warning/30 rounded-lg px-3 py-1.5">
                  <WifiOff className="w-3.5 h-3.5" /> Offline — simpan
                  dinonaktifkan
                </span>
              )}
              <Button
                variant="outline"
                onClick={handleOpenBobotDialog}
                disabled={!isOnline}
                title={
                  !isOnline ? "Tidak dapat mengubah bobot saat offline" : ""
                }
                className="flex items-center gap-2 border-2 hover:bg-primary/5 font-semibold"
              >
                <Settings className="w-4 h-4" />
                Atur Bobot
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={!hasChanges || saving || !isOnline}
                title={!isOnline ? "Tidak dapat menyimpan saat offline" : ""}
                className="flex items-center gap-2 bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg shadow-primary/30 font-semibold px-6"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !isOnline ? (
                  <WifiOff className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {!isOnline
                  ? "Offline"
                  : `Simpan Semua ${hasChanges ? `(${editedGrades.size})` : ""}`}
              </Button>
            </div>
          )}
        </div>

        {/* Empty State - Belum Pilih Kelas */}
        {!selectedKelas && (
          <div className="space-y-8">
            {/* Welcome Card - Enhanced */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-primary/5 to-accent/10 dark:from-primary/10 dark:to-accent/20 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -mr-20 -mt-20" />
              <CardContent className="flex flex-col items-center justify-center py-16 relative">
                <div className="bg-linear-to-br from-primary to-accent p-5 rounded-full mb-6 shadow-xl shadow-primary/30">
                  <ClipboardCheck className="w-16 h-16 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-extrabold text-foreground dark:text-white mb-3">
                  Selamat Datang di Halaman Penilaian
                </h2>
                <p className="text-lg text-muted-foreground text-center max-w-2xl mb-8">
                  Untuk memulai memberikan nilai, silakan pilih mata kuliah dan
                  kelas yang Anda ajarkan
                </p>
              </CardContent>
            </Card>

            {/* Selection Steps Card - Enhanced */}
            <Card className="border-0 shadow-xl bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-card dark:via-primary/10 dark:to-accent/10 backdrop-blur-sm">
              <CardHeader className="border-b bg-linear-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2.5 bg-linear-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/30">
                    <FileText className="w-5 h-5 text-primary-foreground" />
                  </div>
                  Langkah 1: Pilih Mata Kuliah & Kelas
                </CardTitle>
                <CardDescription className="text-base font-semibold">
                  Pilih mata kuliah dan kelas yang akan dinilai. Pastikan Anda
                  memilih yang benar.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Mata Kuliah Selection - Enhanced */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center w-10 h-10 bg-linear-to-br from-primary to-accent text-primary-foreground rounded-full text-lg font-bold shadow-lg shadow-primary/30">
                        1
                      </span>
                      <Label
                        htmlFor="mata-kuliah-select"
                        className="text-lg font-bold"
                      >
                        Pilih Mata Kuliah
                      </Label>
                    </div>
                    <Select
                      value={selectedMataKuliah}
                      onValueChange={handleMataKuliahChange}
                    >
                      <SelectTrigger
                        id="mata-kuliah-select"
                        className="h-12 border-2 text-base"
                      >
                        <SelectValue placeholder="-- Pilih Mata Kuliah --" />
                      </SelectTrigger>
                      <SelectContent>
                        {mataKuliahList.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            Tidak ada mata kuliah tersedia
                          </div>
                        ) : (
                          mataKuliahList.map((mk) => (
                            <SelectItem key={mk.id} value={mk.id}>
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  {mk.nama_mk}
                                </span>
                                {mk.kode_mk && (
                                  <span className="text-xs text-muted-foreground">
                                    {mk.kode_mk}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {selectedMataKuliah && (
                      <div className="flex items-center gap-2 text-base font-semibold text-success bg-success/5 px-4 py-2 rounded-lg border-2 border-success/40">
                        <CheckCircle className="w-5 h-5" />
                        <span>Mata kuliah dipilih</span>
                      </div>
                    )}
                  </div>

                  {/* Kelas Selection - Enhanced */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold shadow-lg ${
                          selectedMataKuliah
                            ? "bg-linear-to-br from-primary to-accent text-primary-foreground shadow-primary/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        2
                      </span>
                      <Label
                        htmlFor="kelas-select"
                        className="text-lg font-bold"
                      >
                        Pilih Kelas
                      </Label>
                    </div>
                    <Select
                      value={selectedKelas}
                      onValueChange={handleKelasChange}
                      disabled={!selectedMataKuliah}
                    >
                      <SelectTrigger
                        id="kelas-select"
                        className="h-12 border-2 text-base"
                        disabled={!selectedMataKuliah}
                      >
                        <SelectValue
                          placeholder={
                            !selectedMataKuliah
                              ? "Pilih mata kuliah terlebih dahulu"
                              : kelasList.length === 0
                                ? "Tidak ada kelas tersedia"
                                : "-- Pilih Kelas --"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {kelasList.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            {selectedMataKuliah
                              ? "Tidak ada kelas untuk mata kuliah ini"
                              : "Pilih mata kuliah terlebih dahulu"}
                          </div>
                        ) : (
                          kelasList.map((kelas) => (
                            <SelectItem key={kelas.id} value={kelas.id}>
                              {kelas.nama_kelas}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {!selectedMataKuliah && (
                      <div className="flex items-center gap-2 text-base font-semibold text-muted-foreground bg-muted/60 px-4 py-2 rounded-lg border-2 border-border/70">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Pilih mata kuliah terlebih dahulu</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Helper - Enhanced */}
                {selectedMataKuliah && kelasList.length > 0 && (
                  <Alert className="mt-8 border-2 border-primary/20 bg-linear-to-r from-primary/5 to-accent/5 shadow-lg">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <AlertDescription className="text-base font-semibold">
                      <strong>Siap!</strong> Silakan pilih kelas untuk{" "}
                      <span className="text-primary">
                        {currentMataKuliahInfo?.nama_mk}
                      </span>{" "}
                      dan mulai memberikan nilai.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedMataKuliah && kelasList.length === 0 && (
                  <Alert className="mt-8 border-2 border-warning/40 bg-linear-to-r from-warning/5 to-warning/10 shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <AlertDescription className="text-base font-semibold">
                      Belum ada kelas untuk mata kuliah{" "}
                      <strong>{currentMataKuliahInfo?.nama_mk}</strong>. Silakan
                      hubungi admin untuk menambahkan kelas.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Info Card - Enhanced */}
            <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-accent/5 shadow-xl">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="bg-linear-to-br from-primary to-accent p-3 rounded-xl shadow-lg shadow-primary/30">
                    <Settings className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-foreground mb-3">
                      Informasi Penting
                    </h4>
                    <ul className="text-base font-semibold text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          Setiap mata kuliah dapat memiliki bobot nilai yang
                          berbeda
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          Anda dapat mengatur bobot nilai setelah memilih kelas
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          Pastikan memilih mata kuliah dan kelas yang benar
                          sebelum input nilai
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Container */}
        <Tabs defaultValue="penilaian" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-2 rounded-xl p-1 h-auto bg-linear-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20">
            <TabsTrigger
              value="penilaian"
              className="gap-2 rounded-lg py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-card"
            >
              <FileText className="h-4 w-4" />
              Penilaian Mahasiswa
            </TabsTrigger>
            <TabsTrigger
              value="permintaan"
              className="gap-2 rounded-lg py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-card"
            >
              <ClipboardCheck className="h-4 w-4" />
              Permintaan Perbaikan
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Penilaian (Existing Content) */}
          <TabsContent value="penilaian" className="space-y-6">
            {/* Class Info Card - Only show when kelas selected */}
            {selectedKelas && (
              <>
                {/* Active Class Banner - Enhanced */}
                <Card className="border-0 shadow-xl bg-linear-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 backdrop-blur-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -mr-20 -mt-20" />
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 bg-linear-to-br from-success to-success/80 rounded-xl shadow-lg shadow-success/30">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <CardTitle className="text-2xl font-bold">
                            Kelas Aktif
                          </CardTitle>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xl font-bold text-foreground">
                            {currentMataKuliahInfo?.kode_mk} -{" "}
                            {currentMataKuliahInfo?.nama_mk}
                          </p>
                          <p className="text-lg font-semibold text-muted-foreground">
                            Kelas:{" "}
                            <span className="text-primary font-bold">
                              {currentNamaKelas}
                            </span>{" "}
                            •{" "}
                            <span className="text-accent font-bold">
                              {mahasiswaList?.length || 0}
                            </span>{" "}
                            mahasiswa terdaftar
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (editedGrades.size > 0) {
                            setPendingKelasSwitch("");
                            setShowSwitchKelasWarning(true);
                          } else {
                            setSelectedKelas("");
                          }
                        }}
                        className="flex items-center gap-2 border-2 hover:bg-primary/5 font-semibold px-6"
                      >
                        <FileText className="w-4 h-4" />
                        Ganti Kelas
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Summary Cards - Enhanced Layout */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Bobot Nilai Card - Enhanced */}
                  <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-primary/5 to-accent/10 dark:from-primary/10 dark:to-accent/20 backdrop-blur-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <CardHeader className="pb-4 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-linear-to-br from-primary to-accent rounded-lg shadow-lg shadow-primary/30">
                              <Settings className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <CardTitle className="text-lg font-bold">
                              Bobot Penilaian
                            </CardTitle>
                          </div>
                          <CardDescription className="text-sm font-semibold">
                            Komponen nilai untuk{" "}
                            {currentMataKuliahInfo?.nama_mk}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOpenBobotDialog}
                          className="text-primary hover:text-primary/80 hover:bg-primary/10 font-semibold"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between items-center p-3 bg-background rounded-xl border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-sm font-bold text-muted-foreground">
                            UTS
                          </span>
                          <span className="text-lg font-black text-primary">
                            {currentBobot.uts}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-background rounded-xl border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-sm font-bold text-muted-foreground">
                            UAS
                          </span>
                          <span className="text-lg font-black text-primary">
                            {currentBobot.uas}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-background rounded-xl border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-sm font-bold text-muted-foreground">
                            Praktikum
                          </span>
                          <span className="text-lg font-black text-primary">
                            {currentBobot.praktikum}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-background rounded-xl border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-sm font-bold text-muted-foreground">
                            Kehadiran
                          </span>
                          <span className="text-lg font-black text-primary">
                            {currentBobot.kehadiran}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary Statistik - Enhanced */}
                  {summary && (
                    <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-success/5 to-success/10 dark:from-success/10 dark:to-success/20 backdrop-blur-sm overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-success/10 to-success/5 rounded-full blur-3xl -mr-16 -mt-16" />
                      <CardHeader className="pb-4 relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-linear-to-br from-success to-success/80 rounded-lg shadow-lg shadow-success/30">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <CardTitle className="text-lg font-bold">
                            Ringkasan Penilaian
                          </CardTitle>
                        </div>
                        <CardDescription className="text-sm font-semibold">
                          Status penilaian kelas ini
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-white rounded-xl border-2 border-success/40 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-muted-foreground mb-1">
                              Total Mahasiswa
                            </p>
                            <p className="text-3xl font-black text-foreground">
                              {summary.total_mahasiswa}
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border-2 border-success/40 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-muted-foreground mb-1">
                              Sudah Dinilai
                            </p>
                            <p className="text-3xl font-black text-success">
                              {summary.sudah_dinilai}
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border-2 border-success/40 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-muted-foreground mb-1">
                              Belum Dinilai
                            </p>
                            <p className="text-3xl font-black text-warning">
                              {summary.belum_dinilai}
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border-2 border-success/40 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs font-bold text-muted-foreground mb-1">
                              Rata-rata
                            </p>
                            <p className="text-3xl font-black text-primary">
                              {summary.rata_rata.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* Legend & Helper Info */}
            {selectedKelas && (
              <Alert className="border-primary/20 bg-primary/5">
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground mb-2">
                      Panduan Input Nilai:
                    </p>
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-warning/10 border-2 border-warning/60 rounded"></div>
                        <span className="text-muted-foreground">
                          Kotak kuning = Belum ada nilai
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-success/5 border-2 border-success/60 rounded"></div>
                        <span className="text-muted-foreground">
                          Kotak hijau = Sudah ada nilai
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Double-click baris untuk edit lengkap
                        </span>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Search */}
            {selectedKelas && (
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    placeholder="Cari mahasiswa (NIM atau nama)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Grades Table */}
            {selectedKelas && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Daftar Nilai Mahasiswa
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {filteredMahasiswa.length} mahasiswa • Double-click
                        baris untuk edit detail
                      </CardDescription>
                    </div>
                    {searchQuery && (
                      <div className="text-sm text-muted-foreground">
                        Hasil pencarian: {filteredMahasiswa.length} dari{" "}
                        {mahasiswaList.length}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Memuat data mahasiswa...
                        </p>
                      </div>
                    </div>
                  ) : filteredMahasiswa.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-muted/60 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        {searchQuery ? (
                          <Search className="w-8 h-8 text-muted-foreground/60" />
                        ) : (
                          <Users className="w-8 h-8 text-muted-foreground/60" />
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {searchQuery
                          ? "Tidak Ada Hasil Pencarian"
                          : "Belum Ada Mahasiswa"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery
                          ? `Tidak ditemukan mahasiswa dengan kata kunci "${searchQuery}"`
                          : "Kelas ini belum memiliki mahasiswa terdaftar"}
                      </p>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          onClick={() => setSearchQuery("")}
                        >
                          Hapus Pencarian
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>NIM</TableHead>
                            <TableHead>Nama</TableHead>
                            {/* HIDDEN: Kuis & Tugas (bobot 0%) */}
                            {/* <TableHead className="text-center">Kuis</TableHead>
                      <TableHead className="text-center">Tugas</TableHead> */}
                            <TableHead className="text-center">UTS</TableHead>
                            <TableHead className="text-center">UAS</TableHead>
                            <TableHead className="text-center">
                              Praktikum
                            </TableHead>
                            <TableHead className="text-center">
                              Kehadiran
                            </TableHead>
                            <TableHead className="text-center">
                              Nilai Akhir
                            </TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead className="w-32">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMahasiswa.map((mahasiswa, index) => {
                            const isEdited = editedGrades.has(
                              mahasiswa.mahasiswa_id,
                            );
                            const editedData = editedGrades.get(
                              mahasiswa.mahasiswa_id,
                            );

                            const nilaiAkhir =
                              editedData?.nilai_akhir ??
                              mahasiswa.nilai_akhir ??
                              0;
                            const nilaiHuruf =
                              editedData?.nilai_huruf ??
                              mahasiswa.nilai_huruf ??
                              "-";

                            return (
                              <TableRow
                                key={mahasiswa.mahasiswa_id}
                                className={
                                  isEdited
                                    ? "bg-warning/10 cursor-pointer"
                                    : "cursor-pointer"
                                }
                                onDoubleClick={() =>
                                  handleRowDoubleClick(mahasiswa)
                                }
                                title="Double-click untuk edit detail"
                              >
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center">
                                    {isMahasiswaGraded(mahasiswa) ? (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                                        <CheckCircle className="w-3 h-3" />
                                        Selesai
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                                        <AlertTriangle className="w-3 h-3" />
                                        Belum
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono">
                                  {mahasiswa.mahasiswa.nim}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {mahasiswa.mahasiswa.user.full_name}
                                </TableCell>
                                {/* HIDDEN: Nilai Kuis & Tugas (bobot 0%) */}
                                {/* <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={getDisplayValue(mahasiswa, "nilai_kuis")}
                              onChange={(e) =>
                                handleGradeChange(
                                  mahasiswa.mahasiswa_id,
                                  "nilai_kuis",
                                  e.target.value,
                                )
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
                              value={getDisplayValue(mahasiswa, "nilai_tugas")}
                              onChange={(e) =>
                                handleGradeChange(
                                  mahasiswa.mahasiswa_id,
                                  "nilai_tugas",
                                  e.target.value,
                                )
                              }
                              className="w-20 text-center"
                            />
                          </TableCell> */}
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    placeholder="-"
                                    value={getDisplayValue(
                                      mahasiswa,
                                      "nilai_uts",
                                    )}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        mahasiswa.mahasiswa_id,
                                        "nilai_uts",
                                        e.target.value,
                                      )
                                    }
                                    className={getInputClass(
                                      mahasiswa,
                                      "nilai_uts",
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    placeholder="-"
                                    value={getDisplayValue(
                                      mahasiswa,
                                      "nilai_uas",
                                    )}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        mahasiswa.mahasiswa_id,
                                        "nilai_uas",
                                        e.target.value,
                                      )
                                    }
                                    className={getInputClass(
                                      mahasiswa,
                                      "nilai_uas",
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    placeholder="-"
                                    value={getDisplayValue(
                                      mahasiswa,
                                      "nilai_praktikum",
                                    )}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        mahasiswa.mahasiswa_id,
                                        "nilai_praktikum",
                                        e.target.value,
                                      )
                                    }
                                    className={getInputClass(
                                      mahasiswa,
                                      "nilai_praktikum",
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    placeholder="-"
                                    value={getDisplayValue(
                                      mahasiswa,
                                      "nilai_kehadiran",
                                    )}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        mahasiswa.mahasiswa_id,
                                        "nilai_kehadiran",
                                        e.target.value,
                                      )
                                    }
                                    className={getInputClass(
                                      mahasiswa,
                                      "nilai_kehadiran",
                                    )}
                                  />
                                </TableCell>
                                <TableCell className="text-center font-bold">
                                  {typeof nilaiAkhir === "number"
                                    ? nilaiAkhir.toFixed(2)
                                    : "0.00"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span
                                    className={`px-2 py-1 rounded font-bold ${
                                      nilaiHuruf.startsWith("A")
                                        ? "bg-success/10 text-success"
                                        : nilaiHuruf.startsWith("B")
                                          ? "bg-info/10 text-info"
                                          : nilaiHuruf.startsWith("C")
                                            ? "bg-warning/10 text-warning"
                                            : nilaiHuruf.startsWith("D")
                                              ? "bg-warning/10 text-warning"
                                              : "bg-danger/10 text-danger"
                                    }`}
                                  >
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
                                          handleSaveSingle(
                                            mahasiswa.mahasiswa_id,
                                          );
                                        }}
                                        disabled={saving || !isOnline}                                      >
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
            )}

            {/* Unsaved Changes Warning */}
            {selectedKelas && hasChanges && (
              <Alert className="border-warning/40 bg-warning/5">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-warning">
                    <strong>Perhatian!</strong> Ada {editedGrades.size}{" "}
                    perubahan yang belum disimpan. Klik tombol{" "}
                    <strong>"Simpan Semua"</strong> di pojok kanan atas untuk
                    menyimpan.
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Tab 2: Permintaan Perbaikan (NEW) */}
          <TabsContent value="permintaan">
            {user?.dosen?.id ? (
              <PermintaanPerbaikanTab dosenId={user.dosen.id} />
            ) : (
              <Alert>
                <AlertDescription>
                  Anda harus login sebagai dosen untuk mengakses fitur ini
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        {/* Bobot Nilai Configuration Dialog - Enhanced */}
        <Dialog open={showBobotDialog} onOpenChange={setShowBobotDialog}>
          <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0">
            <div className="bg-linear-to-r from-primary to-accent p-6 text-primary-foreground">
              <DialogTitle className="text-2xl font-bold">
                Atur Bobot Nilai - {currentMataKuliah}
              </DialogTitle>
              <DialogDescription className="text-base font-semibold text-primary-foreground/80 mt-1">
                Sesuaikan bobot penilaian untuk mata kuliah{" "}
                <strong>{currentMataKuliah}</strong> (Kelas: {currentNamaKelas}
                ). Total harus 100%.
              </DialogDescription>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Kuis */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="kuis" className="text-right font-bold">
                  Kuis
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="kuis"
                    type="number"
                    min="0"
                    max="100"
                    value={editingBobot.kuis}
                    onChange={(e) => handleBobotChange("kuis", e.target.value)}
                    className="w-24 border-2"
                  />
                  <span className="text-sm font-bold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* Tugas */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tugas" className="text-right font-bold">
                  Tugas
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="tugas"
                    type="number"
                    min="0"
                    max="100"
                    value={editingBobot.tugas}
                    onChange={(e) => handleBobotChange("tugas", e.target.value)}
                    className="w-24 border-2"
                  />
                  <span className="text-sm font-bold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* UTS */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uts" className="text-right font-bold">
                  UTS
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="uts"
                    type="number"
                    min="0"
                    max="100"
                    value={editingBobot.uts}
                    onChange={(e) => handleBobotChange("uts", e.target.value)}
                    className="w-24 border-2"
                  />
                  <span className="text-sm font-bold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* UAS */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="uas" className="text-right font-bold">
                  UAS
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="uas"
                    type="number"
                    min="0"
                    max="100"
                    value={editingBobot.uas}
                    onChange={(e) => handleBobotChange("uas", e.target.value)}
                    className="w-24 border-2"
                  />
                  <span className="text-sm font-bold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* Praktikum */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="praktikum" className="text-right font-bold">
                  Praktikum
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="praktikum"
                    type="number"
                    min="0"
                    max="100"
                    value={editingBobot.praktikum}
                    onChange={(e) =>
                      handleBobotChange("praktikum", e.target.value)
                    }
                    className="w-24 border-2"
                  />
                  <span className="text-sm font-bold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* Kehadiran */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="kehadiran" className="text-right font-bold">
                  Kehadiran
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="kehadiran"
                    type="number"
                    min="0"
                    max="100"
                    value={editingBobot.kehadiran}
                    onChange={(e) =>
                      handleBobotChange("kehadiran", e.target.value)
                    }
                    className="w-24 border-2"
                  />
                  <span className="text-sm font-bold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="grid grid-cols-4 items-center gap-4 pt-4 border-t-2">
                <Label className="text-right font-black">Total</Label>
                <div className="col-span-3">
                  <div
                    className={`text-2xl font-black ${
                      validateBobotNilai(editingBobot).valid
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {validateBobotNilai(editingBobot).total}%
                  </div>
                  {!validateBobotNilai(editingBobot).valid && (
                    <p className="text-sm font-bold text-danger mt-1">
                      Total harus 100%
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 border-t bg-muted/40">
              <Button
                variant="outline"
                onClick={() => setShowBobotDialog(false)}
                className="border-2 font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveBobot}
                disabled={!validateBobotNilai(editingBobot).valid || saving || !isOnline}
                className="bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Bobot"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Mahasiswa Dialog - Enhanced */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
            <div className="bg-linear-to-r from-primary to-accent p-6 text-primary-foreground">
              <DialogTitle className="text-2xl font-bold">
                Edit Nilai Mahasiswa
              </DialogTitle>
              {editingMahasiswa && (
                <DialogDescription className="text-base font-semibold text-primary-foreground/80 mt-2">
                  <div className="space-y-1 mt-2">
                    <p className="font-mono text-base">
                      {editingMahasiswa.mahasiswa.nim}
                    </p>
                    <p className="font-bold text-lg">
                      {editingMahasiswa.mahasiswa.user.full_name}
                    </p>
                  </div>
                </DialogDescription>
              )}
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Grade Inputs - 2 columns */}
              <div className="grid grid-cols-2 gap-6">
                {/* HIDDEN: Nilai Kuis & Tugas (bobot 0%, tidak digunakan) */}
                {/* Kuis */}
                {/* <div className="space-y-2">
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
                  onChange={(e) =>
                    handleEditFormChange(
                      "nilai_kuis",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full"
                />
              </div> */}

                {/* Tugas */}
                {/* <div className="space-y-2">
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
                  onChange={(e) =>
                    handleEditFormChange(
                      "nilai_tugas",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full"
                />
              </div> */}

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
                    onChange={(e) =>
                      handleEditFormChange(
                        "nilai_uts",
                        parseFloat(e.target.value) || 0,
                      )
                    }
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
                    onChange={(e) =>
                      handleEditFormChange(
                        "nilai_uas",
                        parseFloat(e.target.value) || 0,
                      )
                    }
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
                    onChange={(e) =>
                      handleEditFormChange(
                        "nilai_praktikum",
                        parseFloat(e.target.value) || 0,
                      )
                    }
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
                    onChange={(e) =>
                      handleEditFormChange(
                        "nilai_kehadiran",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Calculated Grade Preview */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-primary font-medium">
                      Nilai Akhir
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {calculateNilaiAkhir(
                        editFormData.nilai_kuis,
                        editFormData.nilai_tugas,
                        editFormData.nilai_uts,
                        editFormData.nilai_uas,
                        editFormData.nilai_praktikum,
                        editFormData.nilai_kehadiran,
                        currentBobot,
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary font-medium">Grade</p>
                    <p className="text-2xl font-bold text-foreground">
                      {getNilaiHuruf(
                        calculateNilaiAkhir(
                          editFormData.nilai_kuis,
                          editFormData.nilai_tugas,
                          editFormData.nilai_uts,
                          editFormData.nilai_uas,
                          editFormData.nilai_praktikum,
                          editFormData.nilai_kehadiran,
                          currentBobot,
                        ),
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
                  onChange={(e) =>
                    handleEditFormChange("keterangan", e.target.value)
                  }
                  placeholder="Tambahkan catatan atau keterangan..."
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="p-6 border-t bg-muted/40">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingMahasiswa(null);
                }}
                className="border-2 font-semibold"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveEditDialog}
                disabled={saving || !isOnline}
                className="bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold"
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
        <AlertDialog
          open={showSaveConfirmDialog}
          onOpenChange={setShowSaveConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Konfirmasi Penyimpanan Nilai
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>Anda akan menyimpan nilai untuk:</p>
                  <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/20">
                    <p className="font-semibold text-foreground">
                      📚 {currentMataKuliah} - {currentNamaKelas}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Jumlah mahasiswa: {editedGrades.size} orang
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pastikan Anda sudah memilih{" "}
                    <strong>mata kuliah yang benar</strong> sebelum menyimpan.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmSave}
                className="bg-primary hover:bg-primary/90"
              >
                Ya, Simpan untuk {currentMataKuliah}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Switch Mata Kuliah Warning Dialog */}
        <AlertDialog
          open={showSwitchMataKuliahWarning}
          onOpenChange={setShowSwitchMataKuliahWarning}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Peringatan: Ada Perubahan Belum Disimpan!
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Anda memiliki <strong>{editedGrades.size} perubahan</strong>{" "}
                  yang belum disimpan untuk:
                </p>
                <div className="p-3 bg-warning/5 rounded-md border border-warning/30">
                  <p className="font-semibold text-warning">
                    📚 {currentMataKuliah} - {currentNamaKelas}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Jika Anda pindah mata kuliah sekarang, semua perubahan akan{" "}
                  <strong>hilang</strong>.
                </p>
                <p className="text-sm font-semibold text-warning">
                  Apakah Anda yakin ingin pindah mata kuliah tanpa menyimpan?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelMataKuliahSwitch}>
                Batal, Tetap di Mata Kuliah Ini
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmMataKuliahSwitch}
                className="bg-warning hover:bg-warning/90"
              >
                Ya, Pindah Mata Kuliah (Buang Perubahan)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Switch Kelas Warning Dialog */}
        <AlertDialog
          open={showSwitchKelasWarning}
          onOpenChange={setShowSwitchKelasWarning}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Peringatan: Ada Perubahan Belum Disimpan!
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Anda memiliki <strong>{editedGrades.size} perubahan</strong>{" "}
                  yang belum disimpan untuk:
                </p>
                <div className="p-3 bg-warning/5 rounded-md border border-warning/30">
                  <p className="font-semibold text-warning">
                    📚 {currentMataKuliah} - {currentNamaKelas}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Jika Anda pindah kelas sekarang, semua perubahan akan{" "}
                  <strong>hilang</strong>.
                </p>
                <p className="text-sm font-semibold text-warning">
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
                className="bg-warning hover:bg-warning/90"
              >
                Ya, Pindah Kelas (Buang Perubahan)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
