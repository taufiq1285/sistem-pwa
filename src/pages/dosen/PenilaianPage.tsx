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
import { useSearchParams } from "react-router-dom";
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
  RefreshCw,
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
  getNilaiHistoryByDosen,
  type BatchUpdateNilaiData,
  type NilaiHistoryByDosenItem,
} from "@/lib/api/nilai.api";
import { getKelas, updateKelas } from "@/lib/api/kelas.api";
import { getMataKuliah } from "@/lib/api/mata-kuliah.api";
import type { NilaiWithMahasiswa, NilaiSummary } from "@/types/nilai.types";
import type { Kelas, BobotNilai } from "@/types/kelas.types";
import type { MataKuliah } from "@/types/mata-kuliah.types";
import { toast } from "sonner";
import { cacheAPI } from "@/lib/offline/api-cache";
import { supabase } from "@/lib/supabase/client";
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

const MASTER_DATA_CACHE_TTL = 60 * 1000;

const normalizePenilaianBobot = (bobot?: BobotNilai | null): BobotNilai => {
  const defaultBobot = getDefaultBobotNilai();
  if (!bobot) {
    return defaultBobot;
  }

  const normalized: BobotNilai = {
    kuis: Number(bobot.kuis ?? defaultBobot.kuis) || 0,
    tugas: Number(bobot.tugas ?? defaultBobot.tugas) || 0,
    uts: Number(bobot.uts ?? defaultBobot.uts) || 0,
    uas: Number(bobot.uas ?? defaultBobot.uas) || 0,
    praktikum: Number(bobot.praktikum ?? defaultBobot.praktikum) || 0,
    kehadiran: Number(bobot.kehadiran ?? defaultBobot.kehadiran) || 0,
  };

  const total =
    normalized.kuis +
    normalized.tugas +
    normalized.uts +
    normalized.uas +
    normalized.praktikum +
    normalized.kehadiran;

  normalized.praktikum = Math.max(
    0,
    Math.min(100, normalized.praktikum + (100 - total)),
  );

  return normalized;
};

async function getActiveKelasForPenilaianDirect(): Promise<Kelas[]> {
  const { data, error } = await supabase
    .from("kelas")
    .select(
      `
        id,
        nama_kelas,
        kode_kelas,
        mata_kuliah_id,
        dosen_id,
        ruangan,
        kuota,
        is_active,
        semester_ajaran,
        tahun_ajaran,
        bobot_nilai,
        created_at,
        updated_at
      `,
    )
    .eq("is_active", true)
    .order("nama_kelas", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as Kelas[];
}

export default function DosenPenilaianPage() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [searchParams] = useSearchParams();
  const kelasFromQuery = searchParams.get("kelas") || "";

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [dosenKelasList, setDosenKelasList] = useState<Kelas[]>([]);
  const [selectedMataKuliah, setSelectedMataKuliah] = useState<string>("");
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>("");
  const [mahasiswaList, setMahasiswaList] = useState<NilaiWithMahasiswa[]>([]);
  const [summary, setSummary] = useState<NilaiSummary | null>(null);
  const [nilaiHistory, setNilaiHistory] = useState<NilaiHistoryByDosenItem[]>(
    [],
  );
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("penilaian");
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
      loadNilaiHistory();
    }
  }, [user?.dosen?.id]);

  useEffect(() => {
    if (selectedMataKuliah) {
      loadKelas(true);
    } else {
      setSelectedKelas("");
    }
  }, [selectedMataKuliah, dosenKelasList]);

  useEffect(() => {
    if (!user?.dosen?.id || selectedMataKuliah || kelasList.length > 0) {
      return;
    }

    getActiveKelasForPenilaianDirect()
      .then((kelasData) => {
        if (kelasData.length > 0) {
          setDosenKelasList(kelasData);
          setKelasList(kelasData);
        }
      })
      .catch((error) => {
        console.error("[Penilaian] Direct kelas preload failed:", error);
      });
  }, [user?.dosen?.id, selectedMataKuliah, kelasList.length]);

  useEffect(() => {
    if (selectedKelas && selectedMataKuliah) {
      loadAllKelasData();
      return;
    }

    setMahasiswaList([]);
    setSummary(null);
    setEditedGrades(new Map());
  }, [selectedKelas, selectedMataKuliah]);

  useEffect(() => {
    if (!kelasFromQuery || dosenKelasList.length === 0) {
      return;
    }

    const targetKelas = dosenKelasList.find(
      (kelas) => kelas.id === kelasFromQuery,
    );
    if (!targetKelas?.mata_kuliah_id) {
      return;
    }

    if (selectedMataKuliah !== targetKelas.mata_kuliah_id) {
      setSelectedMataKuliah(targetKelas.mata_kuliah_id);
      return;
    }

    if (selectedKelas !== targetKelas.id) {
      setSelectedKelas(targetKelas.id);
    }
  }, [dosenKelasList, kelasFromQuery, selectedKelas, selectedMataKuliah]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load master mata kuliah dan kelas dari admin.
   * Penilaian sengaja tidak dikunci ke assignment dosen agar dosen bisa
   * menilai kombinasi kelas + mata kuliah sesuai kebutuhan akademik.
   */
  const loadMataKuliahDiajarkan = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!user?.dosen?.id) return;

      const [mataKuliahData, kelasData] = await Promise.all([
        cacheAPI(
          "admin_master_mata_kuliah_penilaian",
          () => getMataKuliah({ is_active: true }),
          {
            ttl: MASTER_DATA_CACHE_TTL,
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
        cacheAPI(
          "admin_master_kelas_penilaian",
          () => getKelas({ is_active: true }),
          {
            ttl: MASTER_DATA_CACHE_TTL,
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
      ]);

      let resolvedKelasData = Array.isArray(kelasData) ? kelasData : [];
      if (resolvedKelasData.length === 0) {
        resolvedKelasData = await getActiveKelasForPenilaianDirect();
      }

      setMataKuliahList(Array.isArray(mataKuliahData) ? mataKuliahData : []);
      setDosenKelasList(resolvedKelasData);
      setKelasList(resolvedKelasData);

      console.log(
        "[Penilaian] Master data loaded:",
        Array.isArray(mataKuliahData) ? mataKuliahData.length : 0,
        "mata kuliah,",
        resolvedKelasData.length,
        "kelas",
      );
    } catch (error) {
      console.error("Error loading mata kuliah:", error);
      toast.error("Gagal memuat master mata kuliah dan kelas");
    } finally {
      setLoading(false);
    }
  };

  const loadNilaiHistory = async () => {
    if (!user?.dosen?.id) return;

    try {
      setLoadingHistory(true);
      const historyData = await getNilaiHistoryByDosen(user.dosen.id);
      setNilaiHistory(historyData);
    } catch (error) {
      console.error("Error loading nilai history:", error);
      toast.error("Gagal memuat riwayat nilai tersimpan");
    } finally {
      setLoadingHistory(false);
    }
  };

  /**
   * Load kelas aktif dari master admin.
   * Kelas tidak difilter berdasarkan mata kuliah karena penilaian memakai
   * kombinasi bebas: mata kuliah pilihan dosen + kelas aktif pilihan dosen.
   */
  const loadKelas = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!user?.dosen?.id || !selectedMataKuliah) return;

      let allKelas =
        dosenKelasList.length > 0
          ? dosenKelasList
          : await cacheAPI(
              "admin_master_kelas_penilaian",
              () => getKelas({ is_active: true }),
              {
                ttl: MASTER_DATA_CACHE_TTL,
                forceRefresh,
                staleWhileRevalidate: true,
              },
            );

      if ((!Array.isArray(allKelas) || allKelas.length === 0) && isOnline) {
        allKelas = await cacheAPI(
          "admin_master_kelas_penilaian",
          () => getKelas({ is_active: true }),
          {
            ttl: MASTER_DATA_CACHE_TTL,
            forceRefresh: true,
            staleWhileRevalidate: true,
          },
        );
      }

      if (!Array.isArray(allKelas) || allKelas.length === 0) {
        allKelas = await getActiveKelasForPenilaianDirect();
      }

      const filteredKelas = allKelas.map((kelas): Kelas => kelas);

      setKelasList(filteredKelas);
      setSelectedKelas((currentSelectedKelas) =>
        filteredKelas.some((kelas) => kelas.id === currentSelectedKelas)
          ? currentSelectedKelas
          : "",
      );
      console.log("[Penilaian] Kelas loaded:", filteredKelas.length);
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
      if (!selectedKelas || !selectedMataKuliah) {
        setMahasiswaList([]);
        setSummary(null);
        setEditedGrades(new Map());
        return;
      }

      const [mahasiswaData, summaryData] = await Promise.all([
        getMahasiswaForGrading(selectedKelas, selectedMataKuliah),
        getNilaiSummary(selectedKelas, selectedMataKuliah),
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
    const nextBobot = normalizePenilaianBobot(kelas?.bobot_nilai);
    setCurrentBobot(nextBobot);
    setEditingBobot(nextBobot);
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
      const normalizedBobot = normalizePenilaianBobot(editingBobot);
      const validation = validateBobotNilai(normalizedBobot);
      if (!validation.valid) {
        toast.error(`Total bobot harus 100%. Saat ini: ${validation.total}%`);
        return;
      }

      setSaving(true);

      // Update kelas with new bobot
      await updateKelas(selectedKelas, {
        bobot_nilai: normalizedBobot,
      });

      setCurrentBobot(normalizedBobot);
      setEditingBobot(normalizedBobot);
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
      setActiveTab("penilaian");
    }
  };

  const confirmKelasSwitch = () => {
    setEditedGrades(new Map()); // Discard unsaved changes
    setSelectedKelas(pendingKelasSwitch);
    setActiveTab("penilaian");
    setShowSwitchKelasWarning(false);
    setPendingKelasSwitch("");
  };

  const cancelKelasSwitch = () => {
    setShowSwitchKelasWarning(false);
    setPendingKelasSwitch("");
  };

  const handleRefreshMasterData = async () => {
    if (!isOnline) {
      toast.error("Tidak dapat refresh data master saat offline");
      return;
    }

    await Promise.all([loadMataKuliahDiajarkan(true), loadNilaiHistory()]);
    toast.success("Master mata kuliah dan kelas diperbarui");
  };

  const handleOpenNilaiHistory = (item: NilaiHistoryByDosenItem) => {
    if (editedGrades.size > 0) {
      toast.warning(
        "Simpan atau batalkan perubahan nilai sebelum membuka riwayat lain.",
      );
      return;
    }

    setSelectedMataKuliah(item.mata_kuliah_id);
    setSelectedKelas(item.kelas_id);
    setActiveTab("penilaian");
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
        dosen_id: user?.dosen?.id ?? null,
        bobot_nilai: currentBobot,
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

      const savedNilai = await batchUpdateNilai(batchData);

      if (savedNilai.length !== batchData.nilai_list.length) {
        throw new Error(
          `${batchData.nilai_list.length - savedNilai.length} nilai belum tersimpan.`,
        );
      }

      toast.success("Nilai berhasil disimpan");
      setEditedGrades(new Map());
      await loadAllKelasData(true);
      await loadNilaiHistory();
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error("Gagal menyimpan nilai", {
        description:
          error instanceof Error
            ? error.message
            : "Periksa koneksi atau akses Supabase.",
      });
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
        mata_kuliah_id: selectedMataKuliah,
        dosen_id: user?.dosen?.id ?? null,
        bobot_nilai: currentBobot,
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

      await loadAllKelasData(true);
      await loadNilaiHistory();
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Gagal menyimpan nilai", {
        description:
          error instanceof Error
            ? error.message
            : "Periksa koneksi atau akses Supabase.",
      });
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
        mata_kuliah_id: selectedMataKuliah,
        dosen_id: user?.dosen?.id ?? null,
        bobot_nilai: currentBobot,
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

      await loadAllKelasData(true);
      await loadNilaiHistory();
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Gagal menyimpan nilai", {
        description:
          error instanceof Error
            ? error.message
            : "Periksa koneksi atau akses Supabase.",
      });
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
  const totalHistoryNilai = nilaiHistory.reduce(
    (sum, item) => sum + item.total_nilai,
    0,
  );

  const formatHistoryDate = (date?: string | null) => {
    if (!date) return "Belum ada tanggal";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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
  const activeTabConfig = {
    penilaian: {
      title: "Penilaian Mahasiswa",
      description: selectedKelas
        ? "Input dan pantau nilai sesuai kombinasi kelas + mata kuliah."
        : "Pilih mata kuliah dan kelas aktif dari master admin.",
      icon: ClipboardCheck,
    },
    permintaan: {
      title: "Permintaan Perbaikan Nilai",
      description:
        "Review pengajuan mahasiswa, pilih bentuk perbaikan, lalu beri instruksi yang jelas.",
      icon: ClipboardCheck,
    },
    history: {
      title: "History Nilai Tersimpan",
      description:
        "Buka kembali nilai yang pernah disimpan tanpa harus mencari kombinasi dari awal.",
      icon: CheckCircle,
    },
  }[activeTab];
  const HeaderIcon = activeTabConfig.icon;

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
      <div className="role-page-content space-y-6">
        {/* Enhanced Header */}
        <div className="rounded-[28px] border border-primary/10 bg-white/80 p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur dark:bg-card/80 sm:flex sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <div className="rounded-2xl bg-linear-to-br from-primary to-accent p-3 shadow-lg shadow-primary/25">
                <HeaderIcon className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="bg-linear-to-r from-primary to-accent bg-clip-text text-2xl font-extrabold tracking-tight text-transparent dark:from-primary/80 dark:to-accent/80 sm:text-3xl">
                  {activeTabConfig.title}
                </h1>
                <p className="mt-1 text-sm font-semibold text-muted-foreground sm:text-base">
                  {activeTabConfig.description}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex w-full flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={handleRefreshMasterData}
              disabled={loading || !isOnline}
              title={
                !isOnline
                  ? "Tidak dapat refresh data master saat offline"
                  : "Ambil ulang mata kuliah dan kelas dari master admin"
              }
              className="flex items-center gap-2 rounded-xl border-2 bg-white/70 font-semibold hover:bg-primary/5"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>
            {selectedKelas && (
              <>
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
                className="flex items-center gap-2 rounded-xl border-2 bg-white/70 font-semibold hover:bg-primary/5"
              >
                <Settings className="w-4 h-4" />
                Atur Bobot
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={!hasChanges || saving || !isOnline}
                title={!isOnline ? "Tidak dapat menyimpan saat offline" : ""}
                className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-accent px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-accent/90"
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
              </>
            )}
          </div>
        </div>

        {/* Empty State - Belum Pilih Kelas */}
        {!selectedKelas && activeTab !== "permintaan" && (
          <div className="space-y-4">
            {/* Welcome Card - Enhanced */}
            <Card className="hidden">
              <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
              <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-3xl bg-linear-to-br from-primary to-accent p-4 shadow-xl shadow-primary/25">
                    <ClipboardCheck className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                      Mulai Penilaian
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
                      Pilih mata kuliah dan kelas aktif dari master admin.
                      Nilai akan tersimpan khusus untuk kombinasi yang dipilih.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/15 bg-white/80 px-4 py-3 text-sm font-semibold text-primary shadow-sm">
                  Kelas + Mata Kuliah
                </div>
              </CardContent>
            </Card>

            {/* Selection Steps Card - Enhanced */}
            <Card className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white/95 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:bg-card/90">
              <CardHeader className="border-b border-slate-100 bg-linear-to-r from-sky-50 via-white to-emerald-50 px-5 py-4 dark:from-primary/10 dark:to-accent/10">
                <CardTitle className="flex items-center gap-3 text-base font-extrabold sm:text-lg">
                  <div className="rounded-2xl bg-linear-to-br from-primary to-accent p-2 shadow-lg shadow-primary/20">
                    <FileText className="h-4 w-4 text-primary-foreground" />
                  </div>
                  Mulai Penilaian
                </CardTitle>
                <CardDescription className="text-xs font-semibold sm:text-sm">
                  Pilih mata kuliah dan kelas. History nilai tetap tersedia di
                  bawah agar dosen bisa lanjut tanpa mencari ulang.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {/* Mata Kuliah Selection - Enhanced */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                        1
                      </span>
                      <Label
                        htmlFor="mata-kuliah-select"
                        className="text-sm font-extrabold"
                      >
                        Mata Kuliah
                      </Label>
                    </div>
                    <Select
                      value={selectedMataKuliah}
                      onValueChange={handleMataKuliahChange}
                    >
                      <SelectTrigger
                        id="mata-kuliah-select"
                        className="h-11 rounded-xl border-slate-200 bg-white"
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
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-3 py-1.5 text-xs font-semibold text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span>Mata kuliah dipilih</span>
                      </div>
                    )}
                  </div>

                  {/* Kelas Selection - Enhanced */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                          selectedMataKuliah
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        2
                      </span>
                      <Label
                        htmlFor="kelas-select"
                        className="text-sm font-extrabold"
                      >
                        Kelas
                      </Label>
                    </div>
                    <Select
                      value={selectedKelas}
                      onValueChange={handleKelasChange}
                      onOpenChange={(open) => {
                        if (
                          open &&
                          selectedMataKuliah &&
                          kelasList.length === 0 &&
                          isOnline
                        ) {
                          void loadKelas(true);
                        }
                      }}
                      disabled={!selectedMataKuliah}
                    >
                      <SelectTrigger
                        id="kelas-select"
                        className="h-11 rounded-xl border-slate-200 bg-white"
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
                              ? "Tidak ada kelas aktif tersedia"
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
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-border/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Pilih mata kuliah agar nilai masuk ke konteks yang benar</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Helper - Enhanced */}
                {selectedMataKuliah && kelasList.length > 0 && (
                  <Alert className="mt-3 border border-primary/20 bg-primary/5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-sm font-semibold">
                      <strong>Siap!</strong> Silakan pilih kelas untuk{" "}
                      <span className="text-primary">
                        {currentMataKuliahInfo?.nama_mk}
                      </span>{" "}
                      dan mulai memberikan nilai.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedMataKuliah && kelasList.length === 0 && (
                  <Alert className="mt-3 border border-warning/40 bg-warning/5">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-sm font-semibold">
                      Belum ada kelas aktif dari master admin. Silakan hubungi
                      admin untuk menambahkan atau mengaktifkan kelas.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* History Nilai Tersimpan */}
            <Card className="hidden">
              <CardHeader className="border-b border-emerald-100 bg-linear-to-r from-emerald-50 via-white to-sky-50 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-base font-extrabold sm:text-lg">
                      <div className="rounded-2xl bg-linear-to-br from-emerald-600 to-sky-600 p-2 shadow-lg shadow-emerald-600/20">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      History Nilai Tersimpan
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs font-semibold sm:text-sm">
                      Nilai yang sudah pernah Anda simpan akan muncul di sini,
                      tanpa harus memilih mata kuliah dan kelas dulu.
                    </CardDescription>
                  </div>
                  <div className="w-fit rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-extrabold text-emerald-700 shadow-sm">
                    {nilaiHistory.length} kombinasi | {totalHistoryNilai} nilai
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {loadingHistory ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm font-semibold text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat history nilai...
                  </div>
                ) : nilaiHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm font-semibold text-muted-foreground">
                    Belum ada nilai tersimpan untuk dosen ini. Setelah dosen
                    menyimpan nilai, history akan muncul otomatis di sini.
                  </div>
                ) : (
                  <div className="grid max-h-[280px] gap-2 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                    {nilaiHistory.map((item) => (
                      <button
                        key={`${item.kelas_id}-${item.mata_kuliah_id}`}
                        type="button"
                        onClick={() => handleOpenNilaiHistory(item)}
                        className="group rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900">
                              {item.nama_mk}
                            </p>
                            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                              {item.kode_mk || "Tanpa kode"} | Kelas{" "}
                              {item.nama_kelas}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            Buka
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                          <div className="rounded-lg bg-sky-50 px-2 py-1.5">
                            <p className="text-[9px] font-bold uppercase text-sky-700">
                              Dinilai
                            </p>
                            <p className="text-sm font-black text-slate-900">
                              {item.total_nilai}
                            </p>
                          </div>
                          <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                            <p className="text-[9px] font-bold uppercase text-emerald-700">
                              Rata
                            </p>
                            <p className="text-sm font-black text-slate-900">
                              {item.rata_rata.toFixed(1)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                            <p className="text-[9px] font-bold uppercase text-amber-700">
                              Update
                            </p>
                            <p className="truncate text-[11px] font-black text-slate-900">
                              {formatHistoryDate(item.terakhir_update)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card - Enhanced */}
            <Card className="hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-linear-to-br from-primary to-accent p-3 shadow-lg shadow-primary/25">
                    <Settings className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-3 text-lg font-extrabold text-foreground">
                      Informasi Penting
                    </h4>
                    <ul className="flex flex-wrap gap-2 text-sm font-semibold text-muted-foreground">
                      <li className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5">
                        Bobot dapat berbeda per mata kuliah
                      </li>
                      <li className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5">
                        Atur bobot setelah memilih kelas
                      </li>
                      <li className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5">
                        Pastikan kombinasi sudah benar
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Container */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="rounded-[24px] border border-slate-200/80 bg-white/75 p-3 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.45)] backdrop-blur sm:p-4"
        >
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-slate-100/80 p-1">
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
            <TabsTrigger
              value="history"
              className="gap-2 rounded-lg py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-card"
            >
              <CheckCircle className="h-4 w-4" />
              History Nilai
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
                            |{" "}
                            <span className="text-accent font-bold">
                              {mahasiswaList?.length || 0}
                            </span>{" "}
                            mahasiswa terdaftar
                          </p>
                          <p className="max-w-3xl text-sm font-semibold text-muted-foreground">
                            Mahasiswa yang sama dapat memiliki nilai berbeda
                            untuk mata kuliah berbeda. Data di halaman ini hanya
                            untuk kombinasi mata kuliah dan kelas yang sedang
                            aktif.
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
                            Hadir
                          </span>
                          <span className="text-lg font-black text-primary">
                            {currentBobot.kehadiran}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-background rounded-xl border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-sm font-bold text-muted-foreground">
                            Tugas
                          </span>
                          <span className="text-lg font-black text-primary">
                            {currentBobot.tugas}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-background rounded-xl border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                          <span className="text-sm font-bold text-muted-foreground">
                            Kuis
                          </span>
                          <span className="text-lg font-black text-primary">
                            {currentBobot.kuis}%
                          </span>
                        </div>
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
              <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Mata Kuliah Aktif
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-foreground">
                      {currentMataKuliahInfo?.nama_mk || "Belum dipilih"}
                    </p>
                    {currentKodeMataKuliah && (
                      <p className="text-xs font-semibold text-muted-foreground">
                        {currentKodeMataKuliah}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Kelas Aktif
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-foreground">
                      {currentNamaKelas || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Roster Ditampilkan
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-foreground">
                      {filteredMahasiswa.length} dari {mahasiswaList.length}{" "}
                      mahasiswa
                    </p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Catatan: roster mahasiswa boleh sama saat mata kuliah diganti,
                  tetapi nilai yang dimuat mengikuti mata kuliah aktif.
                </p>
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
              </div>
            )}

            {/* Grades Table */}
            {selectedKelas && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Daftar Nilai Mahasiswa -{" "}
                        {currentMataKuliahInfo?.nama_mk || "Mata Kuliah"} /{" "}
                        Kelas {currentNamaKelas || "-"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {filteredMahasiswa.length} mahasiswa dalam konteks
                        mata kuliah aktif | Double-click baris untuk edit
                        detail
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
                            <TableHead className="text-center">
                              Hadir ({currentBobot.kehadiran}%)
                            </TableHead>
                            <TableHead className="text-center">
                              Tugas ({currentBobot.tugas}%)
                            </TableHead>
                            <TableHead className="text-center">
                              Kuis ({currentBobot.kuis}%)
                            </TableHead>
                            <TableHead className="text-center">
                              Praktikum ({currentBobot.praktikum}%)
                            </TableHead>
                            <TableHead className="text-center">
                              UTS ({currentBobot.uts}%)
                            </TableHead>
                            <TableHead className="text-center">
                              UAS ({currentBobot.uas}%)
                            </TableHead>
                            <TableHead className="text-center">
                              Nilai Akhir
                            </TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead className="text-center">Lulus</TableHead>
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

                            const nilaiAkhir = calculateNilaiAkhir(
                              editedData?.nilai_kuis ?? mahasiswa.nilai_kuis ?? 0,
                              editedData?.nilai_tugas ?? mahasiswa.nilai_tugas ?? 0,
                              editedData?.nilai_uts ?? mahasiswa.nilai_uts ?? 0,
                              editedData?.nilai_uas ?? mahasiswa.nilai_uas ?? 0,
                              editedData?.nilai_praktikum ??
                                mahasiswa.nilai_praktikum ??
                                0,
                              editedData?.nilai_kehadiran ??
                                mahasiswa.nilai_kehadiran ??
                                0,
                              currentBobot,
                            );
                            const nilaiHuruf = getNilaiHuruf(nilaiAkhir);

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
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    placeholder="-"
                                    value={getDisplayValue(
                                      mahasiswa,
                                      "nilai_tugas",
                                    )}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        mahasiswa.mahasiswa_id,
                                        "nilai_tugas",
                                        e.target.value,
                                      )
                                    }
                                    className={getInputClass(
                                      mahasiswa,
                                      "nilai_tugas",
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
                                      "nilai_kuis",
                                    )}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        mahasiswa.mahasiswa_id,
                                        "nilai_kuis",
                                        e.target.value,
                                      )
                                    }
                                    className={getInputClass(
                                      mahasiswa,
                                      "nilai_kuis",
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
                                <TableCell className="text-center">
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-bold ${
                                      nilaiAkhir >= 60
                                        ? "bg-success/10 text-success"
                                        : "bg-danger/10 text-danger"
                                    }`}
                                  >
                                    {nilaiAkhir >= 60 ? "Lulus" : "Tidak"}
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
                                        disabled={saving || !isOnline}
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

          <TabsContent value="history" className="mt-4">
            <Card className="overflow-hidden rounded-[22px] border border-emerald-100 bg-white/95 shadow-sm">
              <CardHeader className="border-b border-emerald-100 bg-linear-to-r from-emerald-50 via-white to-sky-50 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-base font-extrabold sm:text-lg">
                      <div className="rounded-2xl bg-linear-to-br from-emerald-600 to-sky-600 p-2 shadow-lg shadow-emerald-600/20">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      History Nilai Tersimpan
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs font-semibold sm:text-sm">
                      Pilih salah satu history untuk membuka detail nilai pada
                      kombinasi mata kuliah dan kelas tersebut.
                    </CardDescription>
                  </div>
                  <div className="w-fit rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-extrabold text-emerald-700 shadow-sm">
                    {nilaiHistory.length} kombinasi | {totalHistoryNilai} nilai
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {loadingHistory ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 text-sm font-semibold text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat history nilai...
                  </div>
                ) : nilaiHistory.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm font-semibold text-muted-foreground">
                    Belum ada nilai tersimpan untuk dosen ini. Setelah dosen
                    menyimpan nilai, history akan muncul otomatis di sini.
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {nilaiHistory.map((item) => (
                      <button
                        key={`${item.kelas_id}-${item.mata_kuliah_id}`}
                        type="button"
                        onClick={() => handleOpenNilaiHistory(item)}
                        className="group rounded-xl border border-slate-200 bg-linear-to-br from-white to-slate-50 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900">
                              {item.nama_mk}
                            </p>
                            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                              {item.kode_mk || "Tanpa kode"} | Kelas{" "}
                              {item.nama_kelas}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            Buka
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                          <div className="rounded-lg bg-sky-50 px-2 py-1.5">
                            <p className="text-[9px] font-bold uppercase text-sky-700">
                              Dinilai
                            </p>
                            <p className="text-sm font-black text-slate-900">
                              {item.total_nilai}
                            </p>
                          </div>
                          <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                            <p className="text-[9px] font-bold uppercase text-emerald-700">
                              Rata
                            </p>
                            <p className="text-sm font-black text-slate-900">
                              {item.rata_rata.toFixed(1)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                            <p className="text-[9px] font-bold uppercase text-amber-700">
                              Update
                            </p>
                            <p className="truncate text-[11px] font-black text-slate-900">
                              {formatHistoryDate(item.terakhir_update)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-extrabold">Komponen tidak dipakai?</p>
                    <p className="mt-1 font-medium leading-relaxed">
                      Isi bobot komponen tersebut dengan <strong>0%</strong>,
                      lalu pindahkan bobotnya ke komponen lain sampai total
                      tetap <strong>100%</strong>.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingBobot(getDefaultBobotNilai())}
                    className="shrink-0 border-amber-300 bg-white font-bold text-amber-900 hover:bg-amber-100"
                  >
                    Pakai Default
                  </Button>
                </div>
              </div>

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
                disabled={
                  !validateBobotNilai(editingBobot).valid || saving || !isOnline
                }
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
