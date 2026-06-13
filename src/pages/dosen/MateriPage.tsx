/**
 * MateriPage - Dosen
 *
 * Purpose: Manage learning materials for dosen
 * Features:
 * - Upload materi
 * - List all materi by kelas
 * - Edit/Delete materi
 * - Publish/Unpublish
 * - Filter by kelas, minggu
 * - View statistics
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Upload,
  Loader2,
  Search,
  BookOpen,
  FileText,
  Download,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import logger from "@/lib/utils/logger";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MateriList } from "@/components/features/materi/MateriCard";
import { MateriViewer } from "@/components/features/materi/MateriViewer";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getMateriByDosen,
  createMateri,
  updateMateri,
  deleteMateri,
  downloadMateri,
  publishMateri,
  type UploadMateriData,
} from "@/lib/api/materi.api";
import { getKelas } from "@/lib/api/kelas.api";
import { getMataKuliah } from "@/lib/api/mata-kuliah.api";
import type { Materi } from "@/types/materi.types";
import type { Kelas } from "@/types/kelas.types";
import type { MataKuliah } from "@/types/mata-kuliah.types";
import { toast } from "sonner";
import {
  cacheAPI,
  getCachedData,
  invalidateCache,
  invalidateCachePatternSync,
} from "@/lib/offline/api-cache";
import { MAX_FILE_SIZE, formatFileSize } from "@/lib/supabase/storage";
import { supabase } from "@/lib/supabase/client";
import { notifyMahasiswaMateriBaru } from "@/lib/api/notification.api";
import { cn } from "@/lib/utils";
import {
  CardListSkeleton,
  EmptyState,
  FileUploadZone,
  OfflineAwareContent,
} from "@/components/common";
import { useOfflineContext } from "@/context/OfflineContext";

// ============================================================================
// COMPONENT
// ============================================================================

const MASTER_DATA_CACHE_TTL = 60 * 1000;

export default function DosenMateriPage() {
  const { user } = useAuth();
  const { isOffline } = useOfflineContext();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredMateri, setFilteredMateri] = useState<Materi[]>([]);
  const [resolvedDosenId, setResolvedDosenId] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  // Filters
  const [selectedMataKuliah, setSelectedMataKuliah] = useState<string>("all");
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedMinggu, setSelectedMinggu] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload Dialog
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit Dialog
  const [editingMateri, setEditingMateri] = useState<Materi | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Viewer
  const [viewingMateri, setViewingMateri] = useState<Materi | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.dosen?.id) {
      loadData();
    }
  }, [user?.dosen?.id]);

  useEffect(() => {
    if (!user?.dosen?.id) {
      return;
    }

    const materiCacheKey = `dosen_materi_${resolvedDosenId || user.dosen.id}`;
    const mataKuliahCacheKey = "admin_master_mata_kuliah_materi";
    const kelasCacheKey = "admin_master_kelas_materi";

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: unknown;
      }>;

      if (customEvent.detail?.key === materiCacheKey) {
        const nextMateri = customEvent.detail?.data;
        if (Array.isArray(nextMateri)) {
          setMateriList(nextMateri as Materi[]);
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }

      if (customEvent.detail?.key === mataKuliahCacheKey) {
        const nextMataKuliah = customEvent.detail?.data;
        if (Array.isArray(nextMataKuliah)) {
          setMataKuliahList(nextMataKuliah as MataKuliah[]);
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }

      if (customEvent.detail?.key === kelasCacheKey) {
        const nextKelas = customEvent.detail?.data;
        if (Array.isArray(nextKelas)) {
          setKelasList(nextKelas as Kelas[]);
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }
    };

    window.addEventListener("cache:updated", handleCacheUpdated);

    return () => {
      window.removeEventListener("cache:updated", handleCacheUpdated);
    };
  }, [user?.dosen?.id, resolvedDosenId]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const getMahasiswaIds = async (kelasId: string): Promise<string[]> => {
    try {
      const { data } = await supabase
        .from("kelas_mahasiswa")
        .select("mahasiswa:mahasiswa_id(user_id)")
        .eq("kelas_id", kelasId)
        .eq("is_active", true);

      return (
        data
          ?.map((item: any) => item.mahasiswa?.user_id)
          .filter((userId: string | undefined): userId is string =>
            Boolean(userId),
          ) || []
      );
    } catch (error) {
      console.error("Failed to fetch mahasiswa IDs:", error);
      return [];
    }
  };

  const resolveDosenId = async (): Promise<string | null> => {
    if (!user?.id) {
      return user?.dosen?.id || null;
    }

    if (!navigator.onLine) {
      return resolvedDosenId || user?.dosen?.id || null;
    }

    try {
      const query = supabase.from("dosen").select("id").eq("user_id", user.id);

      if (typeof (query as any).maybeSingle !== "function") {
        return resolvedDosenId || user?.dosen?.id || null;
      }

      const { data, error } = await (query as any).maybeSingle();

      if (error) {
        throw error;
      }

      const nextDosenId = data?.id || user?.dosen?.id || null;
      setResolvedDosenId(nextDosenId);
      return nextDosenId;
    } catch (error) {
      logger.debug(
        "[Dosen MateriPage] Failed to resolve fresh dosen_id",
        error,
      );
      return resolvedDosenId || user?.dosen?.id || null;
    }
  };

  const invalidateMateriCaches = async () => {
    const dosenId = resolvedDosenId || user?.dosen?.id;
    if (!dosenId) return;

    await Promise.all([
      invalidateCache(`dosen_materi_${dosenId}`),
      user?.dosen?.id && user.dosen.id !== dosenId
        ? invalidateCache(`dosen_materi_${user.dosen.id}`)
        : Promise.resolve(),
      invalidateCachePatternSync("query_filtered_materi"),
      invalidateCachePatternSync("query_materi"),
      invalidateCachePatternSync("mahasiswa_materi_"),
    ]);
  };

  async function loadData(forceRefresh = false) {
    if (!user?.dosen?.id) return;

    try {
      setLoading(true);

      const dosenId = (await resolveDosenId()) || user.dosen.id;
      const dosenIds = Array.from(
        new Set([dosenId, user.dosen.id].filter(Boolean)),
      ) as string[];
      const materiCacheKey = `dosen_materi_${dosenId}`;
      const mataKuliahCacheKey = "admin_master_mata_kuliah_materi";
      const kelasCacheKey = "admin_master_kelas_materi";

      const [cachedMateriEntry, cachedMataKuliahEntry, cachedKelasEntry] =
        await Promise.all([
          getCachedData<Materi[]>(materiCacheKey),
          getCachedData<MataKuliah[]>(mataKuliahCacheKey),
          getCachedData<Kelas[]>(kelasCacheKey),
        ]);

      const hasCachedMateri = Array.isArray(cachedMateriEntry?.data);
      const hasCachedMataKuliah = Array.isArray(cachedMataKuliahEntry?.data);
      const hasCachedKelas = Array.isArray(cachedKelasEntry?.data);

      if (hasCachedMateri) {
        setMateriList(cachedMateriEntry.data);
      }

      if (hasCachedKelas) {
        setKelasList(cachedKelasEntry.data);
      }

      if (hasCachedMataKuliah) {
        setMataKuliahList(cachedMataKuliahEntry.data);
      }

      if (hasCachedMateri || hasCachedMataKuliah || hasCachedKelas) {
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(
          Math.max(
            cachedMateriEntry?.timestamp || 0,
            cachedMataKuliahEntry?.timestamp || 0,
            cachedKelasEntry?.timestamp || 0,
          ) || null,
        );
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedMateri || hasCachedMataKuliah || hasCachedKelas
            ? "Perangkat sedang offline. Menampilkan snapshot materi terakhir."
            : "Perangkat sedang offline dan belum ada snapshot materi tersimpan.",
        );
      }

      // Use cacheAPI with stale-while-revalidate for offline support
      const [materiData, mataKuliahData, kelasData] = await Promise.all([
        cacheAPI(
          materiCacheKey,
          async () => {
            const materiByDosen = await Promise.all(
              dosenIds.map((id) => getMateriByDosen(id)),
            );
            const materiMap = new Map<string, Materi>();
            materiByDosen.flat().forEach((materi) => {
              materiMap.set(materi.id, materi);
            });
            return Array.from(materiMap.values()).sort(
              (a, b) =>
                new Date((b as any).created_at || 0).getTime() -
                new Date((a as any).created_at || 0).getTime(),
            );
          },
          {
            ttl: 10 * 60 * 1000, // 10 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
        cacheAPI(mataKuliahCacheKey, () => getMataKuliah({ is_active: true }), {
          ttl: MASTER_DATA_CACHE_TTL,
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI(
          kelasCacheKey,
          () =>
            getKelas({
              is_active: true,
            }),
          {
            ttl: MASTER_DATA_CACHE_TTL,
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
      ]);

      const safeMateriData = Array.isArray(materiData) ? materiData : [];
      const safeMataKuliahData = Array.isArray(mataKuliahData)
        ? mataKuliahData
        : [];
      const safeKelasData = Array.isArray(kelasData) ? kelasData : [];

      setMateriList(safeMateriData);
      setMataKuliahList(safeMataKuliahData);
      setKelasList(safeKelasData);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
      logger.debug(
        "[Dosen MateriPage] Data loaded:",
        safeMateriData.length,
        "materi",
        "for dosen_id",
        dosenId,
        "checked ids",
        dosenIds,
      );
    } catch (error: any) {
      console.error("Error loading data:", error);
      if (materiList.length > 0 || kelasList.length > 0 || !navigator.onLine) {
        setIsOfflineData(true);
      }
      toast.error(error?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // FILTERING
  // ============================================================================

  function getMateriMataKuliahId(materi: Materi): string | null {
    return (
      (materi as any).mata_kuliah_id || (materi as any).mata_kuliah?.id || null
    );
  }

  const filterMateri = useCallback(() => {
    let filtered = [...materiList];

    // Filter by mata kuliah selected by dosen saat upload.
    if (selectedMataKuliah !== "all") {
      filtered = filtered.filter(
        (m) => getMateriMataKuliahId(m) === selectedMataKuliah,
      );
    }

    // Filter by kelas
    if (selectedKelas !== "all") {
      filtered = filtered.filter((m) => m.kelas_id === selectedKelas);
    }

    // Filter by minggu
    if (selectedMinggu !== "all") {
      const minggu = parseInt(selectedMinggu);
      filtered = filtered.filter((m) => m.minggu_ke === minggu);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.judul.toLowerCase().includes(query) ||
          m.deskripsi?.toLowerCase().includes(query),
      );
    }

    setFilteredMateri(filtered);
  }, [
    materiList,
    selectedMataKuliah,
    selectedKelas,
    selectedMinggu,
    searchQuery,
  ]);

  useEffect(() => {
    filterMateri();
  }, [filterMateri]);

  // ============================================================================
  // UPLOAD HANDLERS
  // ============================================================================

  async function handleUpload(formData: FormData) {
    if (!user?.dosen?.id) return;

    if (!navigator.onLine) {
      toast.error(
        "Upload materi belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const file = formData.get("file") as File;
      const mataKuliahId = formData.get("mata_kuliah_id") as string;
      const kelasId = formData.get("kelas_id") as string;
      const judul = formData.get("judul") as string;
      const deskripsi = formData.get("deskripsi") as string;
      const mingguKe = formData.get("minggu_ke") as string;
      const dosenId = await resolveDosenId();

      // Validate
      if (!file || !mataKuliahId || !kelasId || !judul || !dosenId) {
        toast.error("Semua field harus diisi");
        return;
      }

      const uploadData: UploadMateriData = {
        kelas_id: kelasId,
        mata_kuliah_id: mataKuliahId,
        dosen_id: dosenId,
        judul,
        deskripsi,
        file,
        minggu_ke: mingguKe ? parseInt(mingguKe) : undefined,
        is_downloadable: true,
      };

      const newMateri = await createMateri(uploadData, {
        onProgress: (progress) => setUploadProgress(progress),
      });

      // Add to list and publish
      const publishedMateri = await publishMateri(newMateri.id);
      setMateriList((prev) => [publishedMateri, ...prev]);

      // Notify mahasiswa in the kelas (best-effort, non-blocking)
      const mahasiswaIds = await getMahasiswaIds(kelasId);
      if (mahasiswaIds.length > 0) {
        const kelasNama =
          kelasList.find((kelas) => kelas.id === kelasId)?.nama_kelas ||
          "Kelas";

        notifyMahasiswaMateriBaru(
          mahasiswaIds,
          user?.full_name || "Dosen",
          judul,
          kelasNama,
          newMateri.id,
        ).catch((err) => {
          console.error("Failed to notify mahasiswa:", err);
        });
      }

      toast.success("Materi berhasil diupload");
      setShowUploadDialog(false);
      setSelectedMataKuliah("all");
      setSelectedKelas("all");
      setSelectedMinggu("all");
      setSearchQuery("");
      await invalidateMateriCaches();
      loadData(true); // Reload fresh data so mahasiswa cache stays in sync
    } catch (error: unknown) {
      console.error("Error uploading materi:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengupload materi",
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleOpenUploadDialog() {
    if (navigator.onLine) {
      await loadData(true);
    }
    setShowUploadDialog(true);
  }

  // ============================================================================
  // EDIT/DELETE HANDLERS
  // ============================================================================

  async function handleEdit(materi: Materi) {
    setEditingMateri(materi);
    setShowEditDialog(true);
  }

  async function handleUpdateMateri(formData: FormData) {
    if (!editingMateri) return;

    if (!navigator.onLine) {
      toast.error(
        "Perubahan materi belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    try {
      const judul = formData.get("judul") as string;
      const deskripsi = formData.get("deskripsi") as string;
      const mingguKe = formData.get("minggu_ke") as string;

      await updateMateri(editingMateri.id, {
        judul,
        deskripsi,
        minggu_ke: mingguKe ? parseInt(mingguKe) : undefined,
      });

      toast.success("Materi berhasil diupdate");
      setShowEditDialog(false);
      setEditingMateri(null);
      await invalidateMateriCaches();
      loadData(true);
    } catch (error: any) {
      console.error("Error updating materi:", error);
      toast.error(error.message || "Gagal mengupdate materi");
    }
  }

  async function handleDelete(materi: Materi) {
    if (!navigator.onLine) {
      toast.error(
        "Penghapusan materi belum didukung saat offline. Sambungkan internet terlebih dahulu.",
      );
      return;
    }

    if (!confirm(`Hapus materi "${materi.judul}"?`)) return;

    try {
      await deleteMateri(materi.id);
      setMateriList((prev) => prev.filter((m) => m.id !== materi.id));
      toast.success("Materi berhasil dihapus");
      await invalidateMateriCaches();
    } catch (error: any) {
      console.error("Error deleting materi:", error);
      toast.error(error.message || "Gagal menghapus materi");
    }
  }

  // ============================================================================
  // VIEW/DOWNLOAD HANDLERS
  // ============================================================================

  async function handleView(materi: Materi) {
    setViewingMateri(materi);
    setShowViewer(true);
  }

  async function handleDownload(materi: Materi) {
    try {
      await downloadMateri(materi.id);
      toast.success("Download dimulai");
    } catch (error: any) {
      console.error("Error downloading materi:", error);
      toast.error(error.message || "Gagal mendownload materi");
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell rounded-2xl p-5">
          <div className="h-20 w-full skeleton-shimmer rounded-xl" />
        </div>
        <CardListSkeleton count={4} />
      </div>
    );
  }

  const lastUpdatedLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(lastUpdatedAt)
    : null;

  return (
    <OfflineAwareContent
      hasData={materiList.length > 0}
      context="materi"
      onSync={() => loadData(true)}
    >
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        {/* Enhanced Header */}
        <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Materi Pembelajaran
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola materi pembelajaran untuk kelas Anda
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={loading || !navigator.onLine}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh Data
            </Button>
            <Button
              onClick={handleOpenUploadDialog}
              disabled={!navigator.onLine}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Upload Materi
            </Button>
          </div>
        </div>

        {(isOfflineData || !navigator.onLine) && (
          <Alert className="border-warning/40 bg-warning/10">
            <AlertDescription>
              Data materi dosen sedang memakai snapshot lokal dari perangkat.
              {lastUpdatedLabel
                ? ` Pembaruan terakhir: ${lastUpdatedLabel}.`
                : ""}
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Stats */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-primary/5 to-accent/10 dark:from-primary/10 dark:to-accent/20 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-primary/10 to-accent/10 rounded-full blur-2xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-2">
                  Total Materi
                </p>
                <p className="text-4xl font-black text-foreground">
                  {materiList.length}
                </p>
              </div>
              <div className="p-3 bg-linear-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/30">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </div>

          <div className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-2xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-2">
                  Published
                </p>
                <p className="text-4xl font-black text-success">
                  {materiList.filter((m) => (m as any).is_active).length}
                </p>
              </div>
              <div className="p-3 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-orange-400/10 to-amber-400/10 rounded-full blur-2xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-2">
                  Draft
                </p>
                <p className="text-4xl font-black text-warning">
                  {materiList.filter((m) => !(m as any).is_active).length}
                </p>
              </div>
              <div className="p-3 bg-linear-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/30">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-primary/5 to-accent/10 dark:from-primary/10 dark:to-accent/20 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-primary/10 to-accent/10 rounded-full blur-2xl -mr-12 -mt-12" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-2">
                  Total Downloads
                </p>
                <p className="text-4xl font-black text-accent">
                  {materiList.reduce(
                    (sum, m) => sum + ((m as any).download_count || 0),
                    0,
                  )}
                </p>
              </div>
              <div className="p-3 bg-linear-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/30">
                <Download className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="border-0 shadow-xl bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-slate-900 dark:via-primary/10 dark:to-accent/10 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Cari materi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-2 text-base font-semibold bg-white/90 dark:bg-card"
                  />
                </div>
              </div>

              <Select
                value={selectedMataKuliah}
                onValueChange={setSelectedMataKuliah}
              >
                <SelectTrigger className="h-12 border-2 font-semibold bg-white/90 dark:bg-card">
                  <SelectValue placeholder="Semua Mata Kuliah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                  {mataKuliahList.map((mataKuliah) => (
                    <SelectItem key={mataKuliah.id} value={mataKuliah.id}>
                      {mataKuliah.kode_mk
                        ? `${mataKuliah.kode_mk} - ${mataKuliah.nama_mk}`
                        : mataKuliah.nama_mk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="h-12 border-2 font-semibold bg-white/90 dark:bg-card">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMinggu} onValueChange={setSelectedMinggu}>
                <SelectTrigger className="h-12 border-2 font-semibold bg-white/90 dark:bg-card">
                  <SelectValue placeholder="Semua Minggu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Minggu</SelectItem>
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((minggu) => (
                    <SelectItem key={minggu} value={minggu.toString()}>
                      Minggu {minggu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Materi List */}
        {filteredMateri.length === 0 ? (
          <EmptyState
            variant={materiList.length === 0 ? "no-data" : "no-results"}
            context="materi"
            actionLabel={
              materiList.length === 0 ? "Upload Materi" : "Reset Filter"
            }
            onAction={
              materiList.length === 0
                ? handleOpenUploadDialog
                : () => {
                    setSelectedMataKuliah("all");
                    setSelectedKelas("all");
                    setSelectedMinggu("all");
                    setSearchQuery("");
                  }
            }
          />
        ) : (
          <div className="rounded-2xl border-0 shadow-xl bg-linear-to-br from-white to-primary/5 dark:from-slate-900 dark:to-primary/10 p-1">
            <MateriList
              materiList={filteredMateri}
              variant="dosen"
              showActions={true}
              showDosenActions={true}
              onView={handleView}
              onDownload={handleDownload}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}

        {/* Enhanced Upload Dialog */}
        <UploadDialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          onUpload={handleUpload}
          mataKuliahList={mataKuliahList}
          kelasList={kelasList}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

        {/* Enhanced Edit Dialog */}
        <EditDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditingMateri(null);
          }}
          onUpdate={handleUpdateMateri}
          materi={editingMateri}
        />

        {/* Viewer */}
        <MateriViewer
          materi={viewingMateri}
          open={showViewer}
          onClose={() => {
            setShowViewer(false);
            setViewingMateri(null);
          }}
        />
      </div>
    </OfflineAwareContent>
  );
}

// ============================================================================
// UPLOAD DIALOG
// ============================================================================

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => void;
  mataKuliahList: MataKuliah[];
  kelasList: Kelas[];
  uploading: boolean;
  uploadProgress: number;
}

function UploadDialog({
  open,
  onClose,
  onUpload,
  mataKuliahList,
  kelasList,
  uploading,
  uploadProgress,
}: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMataKuliahId, setSelectedMataKuliahId] = useState<string>("");
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [selectedMingguKe, setSelectedMingguKe] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!selectedFile) {
      toast.error("Pilih file materi terlebih dahulu");
      return;
    }
    formData.set("file", selectedFile);
    onUpload(formData);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0">
        <div className="bg-linear-to-r from-primary to-accent p-6 text-primary-foreground">
          <DialogTitle className="text-2xl font-bold">
            Upload Materi Pembelajaran
          </DialogTitle>
          <DialogDescription className="text-base font-semibold text-primary-foreground/80 mt-1">
            Upload materi pembelajaran untuk kelas Anda
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <Label htmlFor="mata_kuliah_id">Mata Kuliah *</Label>
            <Select
              value={selectedMataKuliahId}
              onValueChange={setSelectedMataKuliahId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih mata kuliah..." />
              </SelectTrigger>
              <SelectContent>
                {mataKuliahList.map((mataKuliah) => (
                  <SelectItem key={mataKuliah.id} value={mataKuliah.id}>
                    {mataKuliah.kode_mk
                      ? `${mataKuliah.kode_mk} - ${mataKuliah.nama_mk}`
                      : mataKuliah.nama_mk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="mata_kuliah_id"
              value={selectedMataKuliahId}
              required
            />
          </div>

          <div>
            <Label htmlFor="kelas_id">Kelas *</Label>
            <Select value={selectedKelasId} onValueChange={setSelectedKelasId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas..." />
              </SelectTrigger>
              <SelectContent>
                {kelasList.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.id}>
                    {kelas.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="kelas_id"
              value={selectedKelasId}
              required
            />
          </div>

          <div>
            <Label htmlFor="judul">Judul Materi *</Label>
            <Input
              id="judul"
              name="judul"
              required
              placeholder="e.g. Pengantar Algoritma"
            />
          </div>

          <div>
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              name="deskripsi"
              placeholder="Deskripsi materi..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="minggu_ke">Minggu Ke</Label>
            <Select
              value={selectedMingguKe}
              onValueChange={setSelectedMingguKe}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih minggu (opsional)..." />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((minggu) => (
                  <SelectItem key={minggu} value={minggu.toString()}>
                    Minggu {minggu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMingguKe && (
              <input type="hidden" name="minggu_ke" value={selectedMingguKe} />
            )}
          </div>

          <div>
            <Label>File *</Label>
            <FileUploadZone
              accept={[
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/plain",
                "image/*",
                "video/*",
                "application/zip",
                "application/x-rar-compressed",
              ]}
              maxSizeMB={Math.floor(MAX_FILE_SIZE / (1024 * 1024))}
              onFileSelect={setSelectedFile}
              isUploading={uploading}
              uploadProgress={uploadProgress}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max {formatFileSize(MAX_FILE_SIZE)}. Format: PDF, Word, Excel,
              PowerPoint, Images, Videos, Archives
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold py-6"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Materi
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
              className="border-2 font-semibold"
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EDIT DIALOG
// ============================================================================

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (formData: FormData) => void;
  materi: Materi | null;
}

function EditDialog({ open, onClose, onUpdate, materi }: EditDialogProps) {
  const [selectedMingguKe, setSelectedMingguKe] = useState<string>("");

  // Reset when materi changes
  useEffect(() => {
    if (materi) {
      setSelectedMingguKe(materi.minggu_ke?.toString() || "");
    }
  }, [materi]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onUpdate(formData);
  }

  if (!materi) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-0">
        <div className="bg-linear-to-r from-primary to-accent p-6 text-primary-foreground">
          <DialogTitle className="text-2xl font-bold">
            Edit Materi Pembelajaran
          </DialogTitle>
          <DialogDescription className="text-base font-semibold text-primary-foreground/80 mt-1">
            Update informasi materi
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <Label htmlFor="edit_judul">Judul Materi *</Label>
            <Input
              id="edit_judul"
              name="judul"
              required
              defaultValue={materi.judul}
            />
          </div>

          <div>
            <Label htmlFor="edit_deskripsi">Deskripsi</Label>
            <Textarea
              id="edit_deskripsi"
              name="deskripsi"
              defaultValue={materi.deskripsi || ""}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit_minggu_ke">Minggu Ke</Label>
            <Select
              value={selectedMingguKe}
              onValueChange={setSelectedMingguKe}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih minggu (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((minggu) => (
                  <SelectItem key={minggu} value={minggu.toString()}>
                    Minggu {minggu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMingguKe && (
              <input type="hidden" name="minggu_ke" value={selectedMingguKe} />
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold py-6"
            >
              Update Materi
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 font-semibold"
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
