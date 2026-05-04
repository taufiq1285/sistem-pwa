/**
 * NilaiPage Enhanced - Mahasiswa
 *
 * Purpose: View grades/assessments with cumulative view and revision requests
 * Features:
 * - View grades per class OR per mata kuliah (cumulative)
 * - Request grade revisions
 * - Track revision request history
 */

import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  TrendingUp,
  Award,
  Edit,
  History,
  BookOpen,
  Send,
  X,
  Loader2,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/hooks/useAuth";
import { getNilaiByMahasiswa } from "@/lib/api/nilai.api";
import {
  getPermintaanByMahasiswa,
  createPermintaan,
  getDosenOptionsForPermintaan,
  type DosenPermintaanOption,
} from "@/lib/api/permintaan-perbaikan.api";
import type { Nilai } from "@/types/nilai.types";
import type {
  PermintaanPerbaikanWithRelations,
  KomponenNilai,
} from "@/types/permintaan-perbaikan.types";
import {
  BENTUK_PERBAIKAN_LABELS,
  STATUS_PERMINTAAN_LABELS,
} from "@/types/permintaan-perbaikan.types";
import { toast } from "sonner";
import { getGradeStatus } from "@/lib/validations/nilai.schema";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";

// ============================================================================
// TYPES
// ============================================================================

interface NilaiKumulatifPerMK {
  mata_kuliah_id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  total_kelas: number;
  nilai_kumulatif: number; // Average across all classes
  nilai_huruf: string;
  kelas_list: Nilai[];
}

const DEFAULT_KOMPONEN_PERBAIKAN: KomponenNilai = "praktikum";

// ============================================================================
// COMPONENT
// ============================================================================

export default function MahasiswaNilaiPageEnhanced() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [permintaanList, setPermintaanList] = useState<
    PermintaanPerbaikanWithRelations[]
  >([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>("all");

  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  // Permintaan Perbaikan Dialog
  const [permintaanDialogOpen, setPermintaanDialogOpen] = useState(false);
  const [selectedNilai, setSelectedNilai] = useState<Nilai | null>(null);
  const [alasanPermintaan, setAlasanPermintaan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dosenOptions, setDosenOptions] = useState<DosenPermintaanOption[]>([]);
  const [selectedTargetDosenId, setSelectedTargetDosenId] = useState("");

  const nilaiCacheKey = user?.mahasiswa?.id
    ? `mahasiswa_nilai_${user.mahasiswa.id}`
    : null;
  const permintaanCacheKey = user?.mahasiswa?.id
    ? `mahasiswa_permintaan_${user.mahasiswa.id}`
    : null;

  // Load data
  useEffect(() => {
    if (user?.mahasiswa?.id) {
      loadData();
    }
  }, [user?.mahasiswa?.id]);

  useEffect(() => {
    if (!nilaiCacheKey || !permintaanCacheKey) {
      return;
    }

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: Nilai[] | PermintaanPerbaikanWithRelations[];
      }>;

      if (customEvent.detail?.key === nilaiCacheKey) {
        const nextNilai = customEvent.detail?.data;
        if (Array.isArray(nextNilai)) {
          setNilaiList(nextNilai as Nilai[]);
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }

      if (customEvent.detail?.key === permintaanCacheKey) {
        const nextPermintaan = customEvent.detail?.data;
        if (Array.isArray(nextPermintaan)) {
          setPermintaanList(
            nextPermintaan as PermintaanPerbaikanWithRelations[],
          );
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }
    };

    window.addEventListener("cache:updated", handleCacheUpdated);

    return () => {
      window.removeEventListener("cache:updated", handleCacheUpdated);
    };
  }, [nilaiCacheKey, permintaanCacheKey]);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (!user?.mahasiswa?.id || !nilaiCacheKey || !permintaanCacheKey) return;

      const [cachedNilaiEntry, cachedPermintaanEntry] = await Promise.all([
        getCachedData<Nilai[]>(nilaiCacheKey),
        getCachedData<PermintaanPerbaikanWithRelations[]>(permintaanCacheKey),
      ]);

      const hasCachedNilai = Array.isArray(cachedNilaiEntry?.data);
      const hasCachedPermintaan = Array.isArray(cachedPermintaanEntry?.data);
      const hasAnyCachedData = hasCachedNilai || hasCachedPermintaan;

      if (hasAnyCachedData && !forceRefresh) {
        setNilaiList(hasCachedNilai ? cachedNilaiEntry!.data : []);
        setPermintaanList(
          hasCachedPermintaan ? cachedPermintaanEntry!.data : [],
        );
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(
          Math.max(
            cachedNilaiEntry?.timestamp || 0,
            cachedPermintaanEntry?.timestamp || 0,
          ) || null,
        );
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasAnyCachedData
            ? "Perangkat sedang offline. Menampilkan data nilai tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada data nilai tersimpan.",
        );
      }

      const shouldForceServerRefresh = forceRefresh || navigator.onLine;

      // Use cacheAPI with stale-while-revalidate for offline support
      const [nilaiData, permintaanData] = await Promise.all([
        cacheAPI(nilaiCacheKey, () => getNilaiByMahasiswa(user.mahasiswa.id), {
          ttl: 15 * 60 * 1000,
          forceRefresh: shouldForceServerRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI(
          permintaanCacheKey,
          () => getPermintaanByMahasiswa(user.mahasiswa.id),
          {
            ttl: 5 * 60 * 1000,
            forceRefresh: shouldForceServerRefresh,
            staleWhileRevalidate: true,
          },
        ),
      ]);

      setNilaiList(nilaiData);
      setPermintaanList(permintaanData);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
      console.log("[NilaiPage] Data loaded:", nilaiData.length, "nilai");
    } catch (error: any) {
      console.error("Error loading data:", error);
      if (
        nilaiList.length > 0 ||
        permintaanList.length > 0 ||
        !navigator.onLine
      ) {
        setIsOfflineData(true);
      }
      toast.error(error?.message || "Gagal memuat data nilai");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    await loadData(true);
  };

  const activeNilaiList = useMemo(
    () =>
      nilaiList.filter((nilai) => {
        const kelasActive = nilai.kelas?.is_active ?? true;
        const mataKuliahActive = nilai.kelas?.mata_kuliah?.is_active ?? true;
        return kelasActive && mataKuliahActive;
      }),
    [nilaiList],
  );

  // Filter nilai
  const getFilteredNilai = (): Nilai[] => {
    let filtered = [...activeNilaiList];

    if (selectedSemester !== "all") {
      filtered = filtered.filter(
        (n) => n.kelas?.semester_ajaran?.toString() === selectedSemester,
      );
    }

    if (selectedTahunAjaran !== "all") {
      filtered = filtered.filter(
        (n) => n.kelas?.tahun_ajaran === selectedTahunAjaran,
      );
    }

    return filtered;
  };

  // Group nilai per mata kuliah
  const getNilaiKumulatifPerMK = (): NilaiKumulatifPerMK[] => {
    const filtered = getFilteredNilai();
    const grouped = new Map<
      string,
      {
        mata_kuliah_id: string;
        kode_mk: string;
        nama_mk: string;
        sks: number;
        kelas_list: Nilai[];
      }
    >();

    filtered.forEach((nilai) => {
      const mataKuliahId =
        nilai.kelas?.mata_kuliah?.id ||
        nilai.mata_kuliah_id ||
        `kelas-${nilai.kelas?.id || nilai.kelas_id}`;
      const kodeMk =
        nilai.kelas?.mata_kuliah?.kode_mk || nilai.kelas?.kode_kelas || "-";
      const namaMk =
        nilai.kelas?.mata_kuliah?.nama_mk ||
        nilai.kelas?.nama_kelas ||
        "Mata kuliah tidak diketahui";
      const sks = nilai.kelas?.mata_kuliah?.sks || 0;

      if (!grouped.has(mataKuliahId)) {
        grouped.set(mataKuliahId, {
          mata_kuliah_id: mataKuliahId,
          kode_mk: kodeMk,
          nama_mk: namaMk,
          sks,
          kelas_list: [],
        });
      }

      grouped.get(mataKuliahId)!.kelas_list.push(nilai);
    });

    return Array.from(grouped.values()).map((group) => {
      const totalNilai = group.kelas_list.reduce(
        (sum, n) => sum + (n.nilai_akhir || 0),
        0,
      );
      const avgNilai =
        group.kelas_list.length > 0 ? totalNilai / group.kelas_list.length : 0;

      // Calculate letter grade from average
      let nilaiHuruf = "E";
      if (avgNilai >= 85) nilaiHuruf = "A";
      else if (avgNilai >= 70) nilaiHuruf = "B";
      else if (avgNilai >= 55) nilaiHuruf = "C";
      else if (avgNilai >= 40) nilaiHuruf = "D";

      return {
        mata_kuliah_id: group.mata_kuliah_id,
        kode_mk: group.kode_mk,
        nama_mk: group.nama_mk,
        sks: group.sks,
        total_kelas: group.kelas_list.length,
        nilai_kumulatif: avgNilai,
        nilai_huruf: nilaiHuruf,
        kelas_list: group.kelas_list,
      };
    });
  };

  // Open permintaan dialog
  const handleAjukanPerbaikan = (nilai: Nilai) => {
    setSelectedNilai(nilai);
    setAlasanPermintaan("");
    setSelectedTargetDosenId(nilai.dosen_id || "");
    setPermintaanDialogOpen(true);

    if (nilai.dosen_id) {
      setDosenOptions([]);
      return;
    }

    getDosenOptionsForPermintaan()
      .then((options) => {
        setDosenOptions(options);
        if (options.length === 1) {
          setSelectedTargetDosenId(options[0].id);
        }
      })
      .catch((error) => {
        console.error("Error loading dosen options:", error);
        toast.error("Gagal memuat pilihan dosen tujuan");
      });
  };

  // Submit permintaan
  const handleSubmitPermintaan = async () => {
    if (!selectedNilai || !alasanPermintaan.trim()) {
      toast.error("Alasan permintaan harus diisi");
      return;
    }

    const targetDosenId = selectedNilai.dosen_id || selectedTargetDosenId;
    if (!targetDosenId) {
      toast.error("Pilih dosen tujuan perbaikan nilai");
      return;
    }

    if (!navigator.onLine) {
      toast.error(
        "Pengajuan perbaikan nilai belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const nilaiLama = Number(selectedNilai.nilai_akhir ?? 0);

      await createPermintaan({
        mahasiswa_id: user?.mahasiswa?.id ?? "",
        nilai_id: selectedNilai.id,
        kelas_id: selectedNilai.kelas_id,
        mata_kuliah_id:
          selectedNilai.mata_kuliah_id || selectedNilai.kelas?.mata_kuliah?.id,
        target_dosen_id: targetDosenId,
        komponen_nilai: DEFAULT_KOMPONEN_PERBAIKAN,
        nilai_lama: nilaiLama,
        alasan_permintaan: alasanPermintaan,
      });

      toast.success("Permintaan perbaikan nilai berhasil diajukan");
      setPermintaanDialogOpen(false);
      loadData(); // Reload data
    } catch (error) {
      console.error("Error submitting permintaan:", error);
      toast.error("Gagal mengajukan permintaan");
    } finally {
      setSubmitting(false);
    }
  };

  // Helpers
  const getSemesterOptions = () => {
    const semesters = new Set(
      activeNilaiList
        .map((n) => n.kelas?.semester_ajaran)
        .filter((s) => s !== undefined),
    );
    return Array.from(semesters).sort((a, b) => (b ?? 0) - (a ?? 0));
  };

  const getTahunAjaranOptions = () => {
    const years = new Set(
      activeNilaiList
        .map((n) => n.kelas?.tahun_ajaran)
        .filter((y) => y !== undefined),
    );
    return Array.from(years).sort().reverse();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }

    return new Date(lastUpdatedAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdatedAt]);

  const getDosenPenilaiLabel = (nilai: Nilai) => {
    if (nilai.dosen?.user?.full_name) {
      return nilai.dosen.user.full_name;
    }

    if (nilai.dosen_id) {
      return "Dosen penilai";
    }

    return "Belum tercatat";
  };

  const getDosenPenilaiMeta = (nilai: Nilai) => {
    return nilai.dosen?.nip || nilai.dosen?.user?.email || null;
  };

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <DashboardSkeleton />
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const filteredNilai = getFilteredNilai();
  const nilaiKumulatif = getNilaiKumulatifPerMK();

  // Calculate statistics
  const calculateStats = () => {
    const avgNilai =
      filteredNilai.length > 0
        ? filteredNilai.reduce((sum, n) => sum + (n.nilai_akhir || 0), 0) /
          filteredNilai.length
        : 0;

    const gradeCounts = {
      A: filteredNilai.filter((n) => n.nilai_huruf?.startsWith("A")).length,
      B: filteredNilai.filter((n) => n.nilai_huruf?.startsWith("B")).length,
      C: filteredNilai.filter((n) => n.nilai_huruf?.startsWith("C")).length,
      D: filteredNilai.filter((n) => n.nilai_huruf?.startsWith("D")).length,
      E: filteredNilai.filter((n) => n.nilai_huruf?.startsWith("E")).length,
    };

    return {
      total: filteredNilai.length,
      avgNilai,
      gradeCounts,
    };
  };

  const stats = calculateStats();

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <GlassCard
          intensity="medium"
          className="overflow-hidden rounded-[30px] border-white/40 bg-linear-to-br from-white via-[#f5fbff] to-[#eefaf7] shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-card"
        >
          <CardContent className="relative p-6 sm:p-8">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative">
                <div className="mb-3 inline-flex items-center rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                  Ringkasan nilai mahasiswa
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Nilai Akademik
                </h1>
                <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground sm:text-base">
                  Nilai ditampilkan sesuai kelas dan mata kuliah yang dipilih
                  dosen saat penilaian.
                </p>
                {(isOfflineData || lastUpdatedLabel) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {isOfflineData && (
                      <span className="inline-flex items-center gap-1 font-medium text-warning">
                        <WifiOff className="h-4 w-4" />
                        Menampilkan data nilai tersimpan lokal
                      </span>
                    )}
                    {lastUpdatedLabel && (
                      <span>Update terakhir: {lastUpdatedLabel}</span>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleRefreshData}
                disabled={loading}
                className="relative w-full gap-2 rounded-xl border-2 bg-white/80 font-semibold shadow-sm sm:w-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh Nilai
              </Button>
            </div>
          </CardContent>
        </GlassCard>

        {isOfflineData && (
          <Alert className="border-warning/30 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/10 dark:text-warning">
            <AlertDescription>
              Halaman nilai tetap bisa dibuka dari cache lokal saat offline.
              Data yang tampil adalah snapshot terakhir yang berhasil disimpan.
              Pengajuan perbaikan nilai tetap memerlukan koneksi internet agar
              benar-benar terkirim ke server.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {activeNilaiList.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              title="Total Nilai"
              value={stats.total}
              icon={FileText}
              color="blue"
            />
            <DashboardCard
              title="Rata-rata"
              value={Number(stats.avgNilai.toFixed(2))}
              icon={TrendingUp}
              color="green"
            />
            <DashboardCard
              title="Grade A & B"
              value={stats.gradeCounts.A + stats.gradeCounts.B}
              icon={Award}
              color="green"
            />
            <DashboardCard
              title="Permintaan"
              value={permintaanList.length}
              icon={History}
              color="amber"
            />
          </div>
        )}

        {/* Filters */}
        <GlassCard
          intensity="low"
          className="rounded-[24px] border-white/40 bg-white/90 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:bg-card"
        >
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold">Filter Tampilan</h2>
                <p className="text-xs font-medium text-muted-foreground">
                  Saring nilai berdasarkan semester dan tahun ajaran.
                </p>
              </div>
              <Badge variant="outline" className="rounded-full">
                {filteredNilai.length} nilai
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger className="rounded-xl border-2 bg-white">
                  <SelectValue placeholder="Semua Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  {getSemesterOptions().map((sem) => (
                    <SelectItem key={sem} value={sem?.toString() || ""}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedTahunAjaran}
                onValueChange={setSelectedTahunAjaran}
              >
                <SelectTrigger className="rounded-xl border-2 bg-white">
                  <SelectValue placeholder="Semua Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {getTahunAjaranOptions().map((year) => (
                    <SelectItem key={year} value={year || ""}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </GlassCard>

        {/* Tabs */}
        <Tabs defaultValue="per-kelas" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-2xl bg-white/80 p-1 shadow-sm md:grid-cols-3">
            <TabsTrigger
              value="per-kelas"
              className="gap-2 rounded-xl py-2.5 font-semibold"
            >
              <FileText className="h-4 w-4" />
              Per Kelas
            </TabsTrigger>
            <TabsTrigger
              value="per-mk"
              className="gap-2 rounded-xl py-2.5 font-semibold"
            >
              <BookOpen className="h-4 w-4" />
              Rekap Mata Kuliah
            </TabsTrigger>
            <TabsTrigger
              value="permintaan"
              className="gap-2 rounded-xl py-2.5 font-semibold"
            >
              <History className="h-4 w-4" />
              Riwayat Permintaan ({permintaanList.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Per Kelas */}
          <TabsContent value="per-kelas">
            <GlassCard
              intensity="low"
              className="overflow-hidden rounded-[26px] border-white/40 bg-white/95 p-0 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:bg-card"
            >
              <CardHeader className="border-b bg-linear-to-r from-primary/5 to-accent/5 p-5">
                <CardTitle className="text-xl font-extrabold">
                  Nilai Per Kelas
                </CardTitle>
                <CardDescription>
                  Nilai yang tersimpan untuk setiap kombinasi kelas dan mata
                  kuliah.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {filteredNilai.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/30">
                    <AlertDescription className="text-muted-foreground">
                      Belum ada data nilai
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/60">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Kode MK</TableHead>
                            <TableHead>Mata Kuliah</TableHead>
                            <TableHead>Kelas</TableHead>
                            <TableHead>Dosen Penilai</TableHead>
                            <TableHead className="text-center">
                              Praktikum
                            </TableHead>
                            <TableHead className="text-center">
                              Nilai Akhir
                            </TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead>Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredNilai.map((nilai, index) => (
                            <TableRow
                              key={nilai.id}
                              className="hover:bg-primary/5"
                            >
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="rounded-full font-mono"
                                >
                                  {nilai.kelas?.mata_kuliah?.kode_mk || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[220px] font-semibold">
                                {nilai.kelas?.mata_kuliah?.nama_mk ||
                                  "Mata kuliah tidak diketahui"}
                              </TableCell>
                              <TableCell>
                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
                                  Kelas {nilai.kelas?.nama_kelas || "-"}
                                </span>
                              </TableCell>
                              <TableCell className="min-w-[160px]">
                                <div className="font-semibold">
                                  {getDosenPenilaiLabel(nilai)}
                                </div>
                                {getDosenPenilaiMeta(nilai) ? (
                                  <div className="text-xs text-muted-foreground">
                                    {getDosenPenilaiMeta(nilai)}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    Nilai lama atau belum disimpan dosen
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {nilai.nilai_praktikum?.toFixed(1) || "0.0"}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-lg font-black text-primary">
                                  {nilai.nilai_akhir?.toFixed(2) || "0.00"}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <StatusBadge
                                  status={
                                    nilai.nilai_huruf?.startsWith("A")
                                      ? "success"
                                      : nilai.nilai_huruf?.startsWith("B")
                                        ? "info"
                                        : nilai.nilai_huruf?.startsWith("C")
                                          ? "warning"
                                          : "error"
                                  }
                                  pulse={false}
                                >
                                  {nilai.nilai_huruf || "-"}
                                </StatusBadge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 rounded-xl"
                                  onClick={() => handleAjukanPerbaikan(nilai)}
                                >
                                  <Edit className="h-3 w-3" />
                                  Ajukan Perbaikan
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </TabsContent>

          {/* Tab: Rekap Mata Kuliah */}
          <TabsContent value="per-mk">
            <GlassCard
              intensity="low"
              className="overflow-hidden rounded-[26px] border-white/40 bg-white/95 p-0 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:bg-card"
            >
              <CardHeader className="border-b bg-linear-to-r from-primary/5 to-accent/5 p-5">
                <CardTitle className="text-xl font-extrabold">
                  Rekap Nilai Per Mata Kuliah
                </CardTitle>
                <CardDescription>
                  Jika satu mata kuliah memiliki beberapa record nilai, bagian
                  ini menampilkan rata-ratanya. Detail tiap record tetap ada di
                  tab Per Kelas.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {nilaiKumulatif.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/30">
                    <AlertDescription className="text-muted-foreground">
                      Belum ada data nilai
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/60">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Kode MK</TableHead>
                            <TableHead>Mata Kuliah</TableHead>
                            <TableHead className="text-center">SKS</TableHead>
                            <TableHead className="text-center">
                              Total Record
                            </TableHead>
                            <TableHead className="text-center">
                              Rata-rata Nilai
                            </TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {nilaiKumulatif.map((mk, index) => (
                            <TableRow
                              key={mk.mata_kuliah_id}
                              className="hover:bg-primary/5"
                            >
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="rounded-full font-mono"
                                >
                                  {mk.kode_mk || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[220px] font-semibold">
                                {mk.nama_mk}
                              </TableCell>
                              <TableCell className="text-center">
                                {mk.sks}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">
                                  {mk.total_kelas}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-lg font-black text-primary">
                                  {mk.nilai_kumulatif.toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <StatusBadge
                                  status={
                                    mk.nilai_huruf.startsWith("A")
                                      ? "success"
                                      : mk.nilai_huruf.startsWith("B")
                                        ? "info"
                                        : mk.nilai_huruf.startsWith("C")
                                          ? "warning"
                                          : "error"
                                  }
                                  pulse={false}
                                >
                                  {mk.nilai_huruf}
                                </StatusBadge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </TabsContent>

          {/* Tab: Riwayat Permintaan */}
          <TabsContent value="permintaan">
            <GlassCard
              intensity="low"
              className="overflow-hidden rounded-[26px] border-white/40 bg-white/95 p-0 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:bg-card"
            >
              <CardHeader className="border-b bg-linear-to-r from-primary/5 to-accent/5 p-5">
                <CardTitle className="text-xl font-extrabold">
                  Riwayat Permintaan Perbaikan Nilai
                </CardTitle>
                <CardDescription>
                  Status permintaan perbaikan nilai yang pernah Anda ajukan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                {permintaanList.length === 0 ? (
                  <Alert className="border-border/60 bg-muted/30">
                    <AlertDescription className="text-muted-foreground">
                      Belum ada permintaan perbaikan nilai
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mata Kuliah</TableHead>
                          <TableHead>Dosen Tujuan</TableHead>
                          <TableHead>Konteks</TableHead>
                          <TableHead className="text-center">
                            Nilai Lama
                          </TableHead>
                          <TableHead className="text-center">
                            Nilai Baru
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Bentuk Perbaikan</TableHead>
                          <TableHead>Instruksi Dosen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permintaanList.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">
                              {req.mata_kuliah?.nama_mk ||
                                req.kelas?.mata_kuliah?.nama_mk}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {req.target_dosen?.user?.full_name || "-"}
                              </div>
                              {req.target_dosen?.nip && (
                                <div className="text-xs text-muted-foreground">
                                  {req.target_dosen.nip}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="rounded-full">
                                Nilai Mata Kuliah
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {req.nilai_lama}
                            </TableCell>
                            <TableCell className="text-center">
                              {req.nilai_baru ? (
                                <span className="font-bold text-success">
                                  {req.nilai_baru}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const statusMap: Record<
                                  string,
                                  "warning" | "success" | "error" | "offline"
                                > = {
                                  pending: "warning",
                                  approved: "success",
                                  rejected: "error",
                                  cancelled: "offline",
                                };
                                return (
                                  <StatusBadge
                                    status={statusMap[req.status] || "warning"}
                                    pulse={false}
                                  >
                                    {
                                      STATUS_PERMINTAAN_LABELS[
                                        req.status as keyof typeof STATUS_PERMINTAAN_LABELS
                                      ]
                                    }
                                  </StatusBadge>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(req.created_at)}
                            </TableCell>
                            <TableCell>
                              {req.bentuk_perbaikan ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-full"
                                >
                                  {
                                    BENTUK_PERBAIKAN_LABELS[
                                      req.bentuk_perbaikan
                                    ]
                                  }
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs text-sm">
                              <span className="line-clamp-2">
                                {req.instruksi_perbaikan ||
                                  req.response_dosen ||
                                  "-"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Dialog: Ajukan Permintaan Perbaikan */}
        <Dialog
          open={permintaanDialogOpen}
          onOpenChange={setPermintaanDialogOpen}
        >
          <DialogContent className="sm:max-w-125">
            <DialogHeader>
              <DialogTitle>Ajukan Permintaan Perbaikan Nilai</DialogTitle>
              <DialogDescription>
                {selectedNilai?.kelas?.mata_kuliah?.nama_mk} -{" "}
                {selectedNilai?.kelas?.nama_kelas}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Mata Kuliah
                  </Label>
                  <div className="mt-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold">
                    {selectedNilai?.kelas?.mata_kuliah?.nama_mk ||
                      "Mata kuliah tidak diketahui"}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Dosen Tujuan
                  </Label>
                  {selectedNilai?.dosen_id ? (
                    <div className="mt-1 rounded-xl bg-white px-3 py-2 text-sm">
                      <div className="font-semibold">
                        {selectedNilai.dosen?.user?.full_name ||
                          "Dosen penilai"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Otomatis mengikuti dosen yang memasukkan nilai ini.
                      </div>
                    </div>
                  ) : (
                    <Select
                      value={selectedTargetDosenId}
                      onValueChange={setSelectedTargetDosenId}
                    >
                      <SelectTrigger className="mt-1 rounded-xl bg-white">
                        <SelectValue placeholder="Pilih dosen tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {dosenOptions.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">
                            Tidak ada dosen tersedia
                          </div>
                        ) : (
                          dosenOptions.map((dosen) => (
                            <SelectItem key={dosen.id} value={dosen.id}>
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  {dosen.full_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {dosen.nip || dosen.email || "Dosen"}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Nilai Saat Ini
                </Label>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Nilai Mata Kuliah</p>
                    <p className="text-xs text-muted-foreground">
                      Pengajuan akan direview dosen, lalu nilai diperbarui lewat
                      halaman Penilaian.
                    </p>
                  </div>
                  <span className="text-2xl font-black text-primary">
                    {Number(selectedNilai?.nilai_akhir ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <Label>
                  Alasan Permintaan <span className="text-danger">*</span>
                </Label>
                <Textarea
                  value={alasanPermintaan}
                  onChange={(e) => setAlasanPermintaan(e.target.value)}
                  placeholder="Jelaskan alasan Anda mengajukan perbaikan nilai..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPermintaanDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Batal
              </Button>
              <Button
                onClick={handleSubmitPermintaan}
                disabled={
                  submitting ||
                  !alasanPermintaan.trim() ||
                  !(selectedNilai?.dosen_id || selectedTargetDosenId) ||
                  !navigator.onLine
                }
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-1" />
                )}
                Kirim Permintaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
