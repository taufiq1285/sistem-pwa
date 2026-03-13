/**
 * KehadiranPage - Dosen (Redesigned)
 *
 * Purpose: Input student attendance records
 * Features:
 * - Select mata kuliah first (supporting multiple mata kuliah per dosen)
 * - Select kelas under that mata kuliah
 * - Select tanggal kehadiran
 * - Input attendance per kelas + tanggal (bulk)
 * - Clean, modern UI without view/report
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { getMyKelas } from "@/lib/api/dosen.api";
import { getMataKuliah } from "@/lib/api/mata-kuliah.api";
import { cacheAPI } from "@/lib/offline/api-cache";
import { supabase } from "@/lib/supabase/client";
import {
  BookOpen,
  Users,
  Calendar,
  Save,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  X,
  Download,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getKehadiranByJadwal,
  saveKehadiranBulk,
  getKehadiranForExport,
  type KehadiranStatus,
} from "@/lib/api/kehadiran.api";
import {
  exportKehadiranToCSV,
  formatExportFilename,
} from "@/lib/utils/kehadiran-export";
import { KehadiranHistory } from "@/components/features/kehadiran/KehadiranHistory";
import { cn } from "@/lib/utils";

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

interface MataKuliahOption {
  id: string;
  nama_mk: string;
  kode_mk: string;
}

interface KelasOption {
  id: string;
  nama_kelas: string;
  kode_kelas: string;
}

// ============================================================================
// STATUS CONSTANTS
// ============================================================================

const STATUS_OPTIONS: {
  value: KehadiranStatus;
  label: string;
  color: string;
  icon: string;
}[] = [
  {
    value: "hadir",
    label: "Hadir",
    color: "bg-success/10 text-success border-success/30",
    icon: "✓",
  },
  {
    value: "izin",
    label: "Izin",
    color: "bg-info/10 text-info border-info/30",
    icon: "📝",
  },
  {
    value: "sakit",
    label: "Sakit",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: "🏥",
  },
  {
    value: "alpha",
    label: "Alpha",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: "✗",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function DosenKehadiranPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Step selections
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliahOption[]>([]);
  const [selectedMataKuliah, setSelectedMataKuliah] = useState<string>("");

  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>("");

  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filters
  const [tahunAjaranFilter, setTahunAjaranFilter] = useState<string>("__all__");
  const [semesterFilter, setSemesterFilter] = useState<string>("__all__");
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<string[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<number[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState<"input" | "history">("input");

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.dosen?.id) {
      loadMataKuliah();
    }
  }, [user?.dosen?.id]);

  // Load kelas when mata kuliah changes
  useEffect(() => {
    if (selectedMataKuliah) {
      loadKelas(selectedMataKuliah);
      setSelectedKelas("");
      setAttendanceRecords([]);
    }
  }, [selectedMataKuliah]);

  // Load mahasiswa when kelas changes
  useEffect(() => {
    if (selectedKelas) {
      loadMahasiswaForKehadiran(selectedKelas);
    }
  }, [selectedKelas]);

  // ============================================================================
  // HANDLERS - LOAD DATA
  // ============================================================================

  const loadMataKuliah = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Use cacheAPI with stale-while-revalidate for offline support
      const mataKuliahData = await cacheAPI(
        `dosen_mk_kehadiran_${user?.dosen?.id}`,
        () => getMataKuliah(),
        {
          ttl: 20 * 60 * 1000, // 20 minutes (mata kuliah jarang berubah)
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      console.log(
        "🔍 DEBUG KehadiranPage: Fetched mata kuliah =",
        mataKuliahData,
      );

      // Convert to dropdown format
      const mataKuliahArray = mataKuliahData.map((mk: any) => ({
        id: mk.id,
        nama_mk: mk.nama_mk,
        kode_mk: mk.kode_mk,
      }));

      console.log("🔍 DEBUG KehadiranPage: mataKuliahArray =", mataKuliahArray);
      setMataKuliahList(mataKuliahArray);

      // Get kelas for filter options only
      const kelasData = await getMyKelas();
      console.log("🔍 DEBUG KehadiranPage: kelasData =", kelasData);

      // Extract unique filter options
      const tahunAjaranSet = new Set<string>();
      const semesterSet = new Set<number>();
      kelasData.forEach((k: any) => {
        if (k.tahun_ajaran) tahunAjaranSet.add(k.tahun_ajaran);
        if (k.semester_ajaran) semesterSet.add(k.semester_ajaran);
      });

      const tahunOptions = Array.from(tahunAjaranSet).sort().reverse(); // Terbaru dulu
      const semOptions = Array.from(semesterSet).sort((a, b) => a - b);

      setTahunAjaranOptions(tahunOptions);
      setSemesterOptions(semOptions);

      console.log("🔍 DEBUG Filter options:", { tahunOptions, semOptions });
    } catch (error) {
      console.error("Error loading mata kuliah:", error);
      toast.error("Gagal memuat daftar mata kuliah");
    } finally {
      setLoading(false);
    }
  };

  const loadKelas = async (mataKuliahId: string, forceRefresh = false) => {
    try {
      setLoading(true);

      console.log(
        "🔍 DEBUG KehadiranPage loadKelas: mataKuliahId =",
        mataKuliahId,
      );
      console.log("🔍 DEBUG KehadiranPage: mataKuliahList =", mataKuliahList);

      // Use cacheAPI for offline support
      const allKelas = await cacheAPI(
        `dosen_kelas_kehadiran_${user?.dosen?.id}`,
        () => getMyKelas(),
        {
          ttl: 15 * 60 * 1000, // 15 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      console.log("🔍 DEBUG KehadiranPage: allKelas =", allKelas);

      // Mata kuliah selected (for attendance record only, not for filtering kelas)
      console.log(
        "🔍 DEBUG KehadiranPage: Selected mata kuliah =",
        mataKuliahId,
      );

      // Filter kelas by tahun ajaran and semester (mata kuliah independent)
      const filteredKelas = allKelas.filter((kelas) => {
        // Filter by tahun ajaran if selected
        if (
          tahunAjaranFilter &&
          tahunAjaranFilter !== "__all__" &&
          kelas.tahun_ajaran !== tahunAjaranFilter
        )
          return false;

        // Filter by semester if selected
        if (
          semesterFilter &&
          semesterFilter !== "__all__" &&
          kelas.semester_ajaran.toString() !== semesterFilter
        )
          return false;

        return true;
      });
      console.log("🔍 DEBUG KehadiranPage: filteredKelas =", filteredKelas);

      // Transform to KelasOption format
      const uniqueKelas = filteredKelas.map((kelas: any) => ({
        id: kelas.id,
        nama_kelas: kelas.nama_kelas,
        kode_kelas: kelas.kode_kelas || "",
      }));

      setKelasList(uniqueKelas);
    } catch (error) {
      console.error("Error loading kelas:", error);
      toast.error("Gagal memuat daftar kelas");
    } finally {
      setLoading(false);
    }
  };

  const loadMahasiswaForKehadiran = async (kelasId: string) => {
    try {
      setLoading(true);

      // Get all mahasiswa in this kelas
      const { data: mahasiswaData, error: mahasiswaError } = await supabase
        .from("kelas_mahasiswa")
        .select("mahasiswa_id, mahasiswa(id, nim, user_id)")
        .eq("kelas_id", kelasId)
        .eq("is_active", true)
        .limit(100);

      if (mahasiswaError) throw mahasiswaError;

      // Get user data for names
      const mahasiswaIds = (mahasiswaData || []).map(
        (m) => m.mahasiswa.user_id,
      );
      const { data: usersData } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", mahasiswaIds);

      const usersMap = new Map(
        usersData?.map((u) => [u.id, u.full_name]) || [],
      );

      // Map to attendance records (default: hadir)
      const records = (mahasiswaData || []).map((item: any) => ({
        mahasiswa_id: item.mahasiswa_id,
        nim: item.mahasiswa.nim,
        nama: usersMap.get(item.mahasiswa.user_id) || "-",
        status: "hadir" as KehadiranStatus,
        keterangan: "",
      }));

      setAttendanceRecords(records);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error loading mahasiswa:", error);
      toast.error("Gagal memuat data mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HANDLERS - INPUT KEHADIRAN
  // ============================================================================

  const handleStatusChange = (mahasiswaId: string, status: KehadiranStatus) => {
    setAttendanceRecords((records) =>
      records.map((r) =>
        r.mahasiswa_id === mahasiswaId ? { ...r, status } : r,
      ),
    );
    setHasUnsavedChanges(true);
  };

  const handleKeteranganChange = (mahasiswaId: string, keterangan: string) => {
    setAttendanceRecords((records) =>
      records.map((r) =>
        r.mahasiswa_id === mahasiswaId ? { ...r, keterangan } : r,
      ),
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveAttendance = async () => {
    if (!selectedKelas) {
      toast.error("Pilih kelas terlebih dahulu");
      return;
    }

    try {
      setIsSavingAttendance(true);

      // Create kehadiran data per kelas + tanggal
      const bulkData = {
        kelas_id: selectedKelas,
        tanggal: selectedTanggal,
        kehadiran: attendanceRecords.map((r) => ({
          mahasiswa_id: r.mahasiswa_id,
          status: r.status,
          keterangan: r.keterangan || undefined,
        })),
      };

      // Save kehadiran per kelas + tanggal
      await saveKehadiranBulk({
        kelas_id: selectedKelas,
        mata_kuliah_id: selectedMataKuliah,
        tanggal: selectedTanggal,
        kehadiran: bulkData.kehadiran,
      });

      toast.success("Kehadiran berhasil disimpan");
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast.error(
        "Gagal menyimpan kehadiran: " + (error.message || "Unknown error"),
      );
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const handleExportAttendance = async () => {
    if (!selectedKelas || !selectedMataKuliah) {
      toast.error("Pilih kelas dan mata kuliah terlebih dahulu");
      return;
    }

    try {
      setLoading(true);

      // Get mata kuliah and kelas names
      const selectedMK = mataKuliahList.find(
        (mk) => mk.id === selectedMataKuliah,
      );
      const selectedKls = kelasList.find((k) => k.id === selectedKelas);

      // Fetch data
      const exportData = await getKehadiranForExport(
        selectedKelas,
        selectedTanggal,
      );

      if (exportData.length === 0) {
        toast.warning(
          "Tidak ada data kehadiran untuk diekspor. Silakan simpan kehadiran terlebih dahulu.",
        );
        return;
      }

      // Generate filename
      const filename = formatExportFilename(
        selectedMK?.nama_mk || "kehadiran",
        selectedKls?.nama_kelas || "kelas",
        selectedTanggal,
      );

      // Export
      exportKehadiranToCSV(exportData, filename);

      toast.success(`Data berhasil diekspor: ${filename}`);
    } catch (error: any) {
      console.error("Error exporting:", error);
      toast.error(
        "Gagal mengekspor data: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  // Calculate stats
  const stats = {
    hadir: attendanceRecords.filter((r) => r.status === "hadir").length,
    izin: attendanceRecords.filter((r) => r.status === "izin").length,
    sakit: attendanceRecords.filter((r) => r.status === "sakit").length,
    alpha: attendanceRecords.filter((r) => r.status === "alpha").length,
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="role-page-shell">
      <div className="role-page-content space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary via-primary/90 to-accent/85 p-5 sm:p-6 md:p-8 text-primary-foreground shadow-2xl shadow-primary/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 blur-2xl" />

          <div className="relative">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold flex items-center gap-3">
              📋 Kehadiran Praktikum
            </h1>
            <p className="text-sm sm:text-base md:text-lg font-semibold mt-2 max-w-xl">
              Input kehadiran mahasiswa praktikum. Pilih mata kuliah, kelas, dan
              tanggal kehadiran.
            </p>
          </div>
        </div>

        {/* Filter Card */}
        {(tahunAjaranOptions.length > 0 || semesterOptions.length > 0) && (
          <Card className="border-0 shadow-xl bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-slate-900 dark:via-primary/10 dark:to-accent/10 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b bg-linear-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Filter Kelas</CardTitle>
                </div>
                {(tahunAjaranFilter !== "__all__" ||
                  semesterFilter !== "__all__") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTahunAjaranFilter("__all__");
                      setSemesterFilter("__all__");
                    }}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    Reset Filter
                  </Button>
                )}
              </div>
              <CardDescription>
                Filter kelas berdasarkan tahun ajaran dan semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tahun Ajaran Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tahun Ajaran
                  </label>
                  <Select
                    value={tahunAjaranFilter}
                    onValueChange={setTahunAjaranFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tahun Ajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">
                        Semua Tahun Ajaran
                      </SelectItem>
                      {tahunAjaranOptions.map((ta) => (
                        <SelectItem key={ta} value={ta}>
                          {ta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semester Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Semester
                  </label>
                  <Select
                    value={semesterFilter}
                    onValueChange={setSemesterFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Semua Semester</SelectItem>
                      {semesterOptions.map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Step 1: Mata Kuliah */}
          <Card
            className={cn(
              "border-2 transition-all shadow-lg hover:shadow-xl",
              selectedMataKuliah
                ? "border-success/50 bg-success/5"
                : "border-gray-200",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    selectedMataKuliah
                      ? "bg-success text-primary-foreground"
                      : "bg-gray-200 text-gray-600",
                  )}
                >
                  1
                </div>
                <CardTitle className="text-base">Mata Kuliah</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedMataKuliah}
                onValueChange={setSelectedMataKuliah}
              >
                <SelectTrigger
                  className={cn(selectedMataKuliah && "border-success/60")}
                >
                  <SelectValue placeholder="Pilih mata kuliah..." />
                </SelectTrigger>
                <SelectContent>
                  {mataKuliahList.map((mk) => (
                    <SelectItem key={mk.id} value={mk.id}>
                      <div className="flex flex-col">
                        <span className="font-semibold">{mk.kode_mk}</span>
                        <span className="text-xs text-muted-foreground">
                          {mk.nama_mk}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMataKuliah && (
                <div className="mt-2 flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Mata kuliah dipilih</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Kelas */}
          <Card
            className={cn(
              "border-2 transition-all shadow-lg hover:shadow-xl",
              !selectedMataKuliah && "opacity-50",
              selectedKelas
                ? "border-success/50 bg-success/5"
                : "border-gray-200",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    selectedKelas
                      ? "bg-success text-primary-foreground"
                      : "bg-gray-200 text-gray-600",
                  )}
                >
                  2
                </div>
                <CardTitle className="text-base">Kelas</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedKelas}
                onValueChange={setSelectedKelas}
                disabled={!selectedMataKuliah}
              >
                <SelectTrigger
                  className={cn(selectedKelas && "border-success/60")}
                >
                  <SelectValue
                    placeholder={
                      selectedMataKuliah
                        ? "Pilih kelas..."
                        : "Pilih mata kuliah dulu"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas} ({kelas.kode_kelas})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedKelas && (
                <div className="mt-2 flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Kelas dipilih</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Tanggal */}
          <Card
            className={cn(
              "border-2 transition-all shadow-lg hover:shadow-xl",
              !selectedKelas && "opacity-50",
              selectedTanggal
                ? "border-success/50 bg-success/5"
                : "border-gray-200",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    selectedTanggal
                      ? "bg-success text-primary-foreground"
                      : "bg-gray-200 text-gray-600",
                  )}
                >
                  3
                </div>
                <CardTitle className="text-base">Tanggal Kehadiran</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={selectedTanggal}
                onChange={(e) => setSelectedTanggal(e.target.value)}
                disabled={!selectedKelas}
                className={cn(selectedTanggal && "border-success/60")}
              />
              {selectedTanggal && (
                <div className="mt-2 flex items-center gap-1 text-xs text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Tanggal: {formatDate(selectedTanggal)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        {selectedKelas && attendanceRecords.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-xl bg-linear-to-br from-success/5 to-success/10 dark:from-success/10 dark:to-success/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hadir</CardTitle>
                <div className="text-2xl">✓</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {stats.hadir}
                </div>
                <p className="text-xs text-muted-foreground">mahasiswa</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-linear-to-br from-info/5 to-info/10 dark:from-info/10 dark:to-info/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Izin</CardTitle>
                <div className="text-2xl">📝</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">
                  {stats.izin}
                </div>
                <p className="text-xs text-muted-foreground">mahasiswa</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-linear-to-br from-warning/5 to-warning/10 dark:from-warning/10 dark:to-warning/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sakit</CardTitle>
                <div className="text-2xl">🏥</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {stats.sakit}
                </div>
                <p className="text-xs text-muted-foreground">mahasiswa</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-linear-to-br from-danger/5 to-danger/10 dark:from-danger/10 dark:to-danger/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alpha</CardTitle>
                <div className="text-2xl">✗</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-danger">
                  {stats.alpha}
                </div>
                <p className="text-xs text-muted-foreground">mahasiswa</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Input and History */}
        {selectedKelas && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "input" | "history")}
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 rounded-xl p-1 h-auto bg-linear-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20">
              <TabsTrigger
                value="input"
                className="gap-2 rounded-lg py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-900"
              >
                <Calendar className="h-4 w-4" />
                Input Kehadiran
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="gap-2 rounded-lg py-2.5 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-900"
              >
                <History className="h-4 w-4" />
                Riwayat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-6">
              {/* Attendance Input Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Input Kehadiran</CardTitle>
                      <CardDescription>
                        {attendanceRecords.length} mahasiswa •{" "}
                        {formatDate(selectedTanggal)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      {hasUnsavedChanges && (
                        <StatusBadge status="warning" pulse>
                          <Clock className="h-3 w-3 mr-1" />
                          Belum disimpan
                        </StatusBadge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportAttendance}
                        disabled={loading || attendanceRecords.length === 0}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-muted-foreground">Memuat data...</p>
                    </div>
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
                              <TableHead className="w-25">NIM</TableHead>
                              <TableHead>Nama Mahasiswa</TableHead>
                              <TableHead className="w-37.5">Status</TableHead>
                              <TableHead>Keterangan</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceRecords.map((record) => {
                              return (
                                <TableRow key={record.mahasiswa_id}>
                                  <TableCell className="font-mono text-sm">
                                    {record.nim}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {record.nama}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={record.status}
                                      onValueChange={(value) =>
                                        handleStatusChange(
                                          record.mahasiswa_id,
                                          value as KehadiranStatus,
                                        )
                                      }
                                    >
                                      <SelectTrigger className="w-35">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.icon} {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      placeholder="Catatan (opsional)..."
                                      value={record.keterangan}
                                      onChange={(e) =>
                                        handleKeteranganChange(
                                          record.mahasiswa_id,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full"
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAttendanceRecords([]);
                            setHasUnsavedChanges(false);
                          }}
                        >
                          Reset
                        </Button>
                        <Button
                          onClick={handleSaveAttendance}
                          disabled={isSavingAttendance || !hasUnsavedChanges}
                          size="lg"
                          className="gap-2"
                        >
                          {isSavingAttendance ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Simpan Kehadiran
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <KehadiranHistory
                kelasId={selectedKelas}
                kelasNama={
                  kelasList.find((k) => k.id === selectedKelas)?.nama_kelas ||
                  ""
                }
                onSelectDate={(date) => {
                  setSelectedTanggal(date);
                  setActiveTab("input");
                  loadMahasiswaForKehadiran(selectedKelas);
                }}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!selectedKelas && (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Pilih Mata Kuliah dan Kelas
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Ikuti langkah di atas untuk mulai input kehadiran mahasiswa
                praktikum.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
