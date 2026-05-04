/**
 * LogbookPage - Mahasiswa
 *
 * Purpose: Digital logbook untuk mencatat pengalaman praktikum
 * Features:
 * - Create logbook per jadwal praktikum
 * - Edit draft logbook
 * - Submit logbook for review
 * - View nilai and feedback from dosen
 * - Track logbook status (draft → submitted → reviewed → graded)
 */

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import {
  Loader2,
  BookOpen,
  Plus,
  Edit,
  Send,
  Eye,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getLogbook,
  createLogbook,
  updateLogbook,
  submitLogbook,
  deleteLogbook,
} from "@/lib/api/logbook.api";
import { notifyDosenLogbookSubmitted } from "@/lib/api/notification.api";
import {
  cacheAPI,
  getCachedData,
  invalidateCache,
} from "@/lib/offline/api-cache";
import { queueManager } from "@/lib/offline/queue-manager";
import type {
  LogbookEntry,
  CreateLogbookData,
  SubmitLogbookData,
} from "@/types/logbook.types";
import type { Jadwal } from "@/types/jadwal.types";
import { toast } from "sonner";
import { SKILL_KEBIDANAN } from "@/types/logbook.types";

// ============================================================================
// COMPONENT
// ============================================================================

export default function MahasiswaLogbookPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [logbookList, setLogbookList] = useState<LogbookEntry[]>([]);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookEntry | null>(
    null,
  );
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<CreateLogbookData>>({
    prosedur_dilakukan: "",
    hasil_observasi: "",
    skill_dipelajari: [],
    kendala_dihadapi: "",
    refleksi: "",
    catatan_tambahan: "",
  });

  // Submit validation
  const [submitting, setSubmitting] = useState(false);

  const jadwalCacheKey = user?.mahasiswa?.id
    ? `mahasiswa_logbook_jadwal_${user.mahasiswa.id}`
    : null;
  const logbookCacheKey = user?.mahasiswa?.id
    ? `mahasiswa_logbook_entries_${user.mahasiswa.id}`
    : null;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.mahasiswa?.id) {
      loadData(true);
    }
  }, [user?.mahasiswa?.id]);

  useEffect(() => {
    if (!user?.mahasiswa?.id || !logbookCacheKey) {
      return;
    }

    const refreshLogbookEntries = () => {
      Promise.all([
        logbookCacheKey ? invalidateCache(logbookCacheKey) : Promise.resolve(),
        jadwalCacheKey ? invalidateCache(jadwalCacheKey) : Promise.resolve(),
      ]).finally(() => {
        loadData(true);
      });
    };

    const subscription = supabase
      .channel(`mahasiswa-logbook-${user.mahasiswa.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "logbook_entries",
          filter: `mahasiswa_id=eq.${user.mahasiswa.id}`,
        },
        refreshLogbookEntries,
      )
      .subscribe();

    const handleLogbookChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ mahasiswa_id?: string }>;
      if (
        !customEvent.detail?.mahasiswa_id ||
        customEvent.detail.mahasiswa_id === user.mahasiswa.id
      ) {
        refreshLogbookEntries();
      }
    };

    const handleWindowFocus = () => {
      refreshLogbookEntries();
    };

    window.addEventListener("logbook:changed", handleLogbookChanged);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("logbook:changed", handleLogbookChanged);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [user?.mahasiswa?.id, jadwalCacheKey, logbookCacheKey]);

  useEffect(() => {
    if (!jadwalCacheKey && !logbookCacheKey) {
      return;
    }

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: Jadwal[] | LogbookEntry[];
      }>;

      if (customEvent.detail?.key === jadwalCacheKey) {
        const nextJadwal = customEvent.detail?.data;
        if (Array.isArray(nextJadwal)) {
          setJadwalList(nextJadwal as Jadwal[]);
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }

      if (customEvent.detail?.key === logbookCacheKey) {
        const nextLogbook = customEvent.detail?.data;
        if (Array.isArray(nextLogbook)) {
          setLogbookList(
            (nextLogbook as LogbookEntry[]).filter(
              (item): item is LogbookEntry => item != null && "id" in item,
            ),
          );
          setIsOfflineData(false);
          setLastUpdatedAt(Date.now());
        }
      }
    };

    window.addEventListener("cache:updated", handleCacheUpdated);
    return () =>
      window.removeEventListener("cache:updated", handleCacheUpdated);
  }, [jadwalCacheKey, logbookCacheKey]);

  useEffect(() => {
    const handleJadwalChanged = () => {
      loadData(true);
    };

    window.addEventListener("jadwal:changed", handleJadwalChanged);
    return () => {
      window.removeEventListener("jadwal:changed", handleJadwalChanged);
    };
  }, [user?.mahasiswa?.id, jadwalCacheKey, logbookCacheKey]);

  useEffect(() => {
    if (!selectedLogbook) {
      return;
    }

    const latestLogbook = logbookList.find(
      (logbook) => logbook.id === selectedLogbook.id,
    );

    if (latestLogbook && latestLogbook !== selectedLogbook) {
      setSelectedLogbook(latestLogbook);
    }
  }, [logbookList, selectedLogbook]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async function loadData(forceRefresh = false) {
    if (!user?.mahasiswa?.id) return;

    try {
      setLoading(true);

      if (!jadwalCacheKey || !logbookCacheKey) {
        return;
      }

      const [cachedJadwalEntry, cachedLogbookEntry] = await Promise.all([
        getCachedData<Jadwal[]>(jadwalCacheKey),
        getCachedData<LogbookEntry[]>(logbookCacheKey),
      ]);

      const cachedJadwal = Array.isArray(cachedJadwalEntry?.data)
        ? cachedJadwalEntry.data
        : [];
      const cachedLogbook = Array.isArray(cachedLogbookEntry?.data)
        ? cachedLogbookEntry.data.filter(
            (item): item is LogbookEntry => item != null && "id" in item,
          )
        : [];
      const hasCachedData = cachedJadwal.length > 0 || cachedLogbook.length > 0;

      if (hasCachedData) {
        setJadwalList(cachedJadwal);
        setLogbookList(cachedLogbook);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(
          Math.max(
            cachedJadwalEntry?.timestamp || 0,
            cachedLogbookEntry?.timestamp || 0,
          ) || null,
        );
        setLoading(false);
      }

      if (!navigator.onLine) {
        if (!hasCachedData) {
          throw new Error(
            "Perangkat sedang offline dan data logbook belum pernah tersimpan di perangkat ini.",
          );
        }
        return;
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan logbook tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada data logbook tersimpan.",
        );
      }

      const allJadwalData = await cacheAPI(
        jadwalCacheKey,
        async () => {
          const { data, error } = await (supabase as any)
            .from("jadwal_praktikum")
            .select(
              `
                *,
                mata_kuliah:mata_kuliah_id (
                  id,
                  nama_mk,
                  kode_mk,
                  sks
                ),
                laboratorium:laboratorium_id (
                  id,
                  nama_lab,
                  kode_lab,
                  kapasitas
                ),
                kelas:kelas_id (
                  nama_kelas,
                  kode_kelas,
                  mata_kuliah:mata_kuliah_id (
                    nama_mk
                  )
                ),
                dosen:dosen_id (
                  id,
                  user:user_id (
                    full_name
                  )
                )
              `,
            )
            .eq("status", "approved")
            .eq("is_active", true)
            .order("tanggal_praktikum", { ascending: true });

          if (error) {
            throw error;
          }

          return (data || []) as Jadwal[];
        },
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      const myJadwal = Array.isArray(allJadwalData) ? allJadwalData : [];

      const logbookData = await cacheAPI(
        logbookCacheKey,
        () =>
          getLogbook({
            mahasiswa_id: user.mahasiswa.id,
          }),
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      setJadwalList(myJadwal);
      setLogbookList(
        logbookData.filter((l): l is LogbookEntry => l != null && "id" in l),
      );
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (error: any) {
      console.error("Error loading data:", error);
      if (
        !navigator.onLine &&
        (jadwalList.length > 0 || logbookList.length > 0)
      ) {
        setIsOfflineData(true);
      } else {
        toast.error(error.message || "Gagal memuat data");
      }
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // CREATE LOGBOOK
  // ============================================================================

  function openCreateDialog(jadwal: Jadwal) {
    setSelectedJadwal(jadwal);
    setFormData({
      prosedur_dilakukan: "",
      hasil_observasi: "",
      skill_dipelajari: [],
      kendala_dihadapi: "",
      refleksi: "",
      catatan_tambahan: "",
    });
    setShowCreateDialog(true);
  }

  async function handleCreateLogbook() {
    if (!selectedJadwal) return;

    // Validate required fields
    if (!formData.prosedur_dilakukan || !formData.hasil_observasi) {
      toast.error("Prosedur dan Hasil Observasi harus diisi");
      return;
    }

    if (!navigator.onLine) {
      try {
        setSubmitting(true);
        const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const now = new Date().toISOString();
        await queueManager.enqueue("logbook_entry", "create", {
          id: tempId,
          jadwal_id: selectedJadwal.id,
          mahasiswa_id: user?.mahasiswa?.id,
          status: "draft",
          ...formData,
          created_at: now,
          updated_at: now,
        });
        const tempLogbook = {
          id: tempId,
          jadwal_id: selectedJadwal.id,
          mahasiswa_id: user?.mahasiswa?.id ?? "",
          status: "draft",
          ...formData,
          created_at: now,
          updated_at: now,
          jadwal: selectedJadwal,
        } as unknown as LogbookEntry;
        setLogbookList((prev) => [tempLogbook, ...prev]);
        setShowCreateDialog(false);
        toast.success("Logbook disimpan lokal. Akan dikirim saat online.");
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan logbook secara lokal");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);

      const data: CreateLogbookData = {
        jadwal_id: selectedJadwal.id,
        ...formData,
      };

      await createLogbook(data);

      toast.success("Logbook berhasil dibuat");
      setShowCreateDialog(false);
      if (logbookCacheKey) await invalidateCache(logbookCacheKey);
      loadData(true);
    } catch (error: any) {
      console.error("Error creating logbook:", error);
      toast.error(error.message || "Gagal membuat logbook");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================================
  // EDIT LOGBOOK
  // ============================================================================

  function openEditDialog(logbook: LogbookEntry) {
    setSelectedLogbook(logbook);
    setFormData({
      prosedur_dilakukan: logbook.prosedur_dilakukan || "",
      hasil_observasi: logbook.hasil_observasi || "",
      skill_dipelajari: logbook.skill_dipelajari || [],
      kendala_dihadapi: logbook.kendala_dihadapi || "",
      refleksi: logbook.refleksi || "",
      catatan_tambahan: logbook.catatan_tambahan || "",
    });
    setShowEditDialog(true);
  }

  async function handleUpdateLogbook() {
    if (!selectedLogbook) return;

    if (!navigator.onLine) {
      try {
        setSubmitting(true);
        await queueManager.enqueue("logbook_entry", "update", {
          id: selectedLogbook.id,
          ...formData,
          updated_at: new Date().toISOString(),
        });
        setLogbookList((prev) =>
          prev.map((l) =>
            l.id === selectedLogbook.id ? { ...l, ...formData } : l,
          ),
        );
        setShowEditDialog(false);
        toast.success(
          "Perubahan disimpan lokal. Akan disinkronkan saat online.",
        );
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan perubahan secara lokal");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);

      await updateLogbook({
        id: selectedLogbook.id,
        ...formData,
      });

      toast.success("Logbook berhasil diperbarui");
      setShowEditDialog(false);
      if (logbookCacheKey) await invalidateCache(logbookCacheKey);
      loadData(true);
    } catch (error: any) {
      console.error("Error updating logbook:", error);
      toast.error(error.message || "Gagal memperbarui logbook");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================================
  // SUBMIT LOGBOOK
  // ============================================================================

  function openSubmitDialog(logbook: LogbookEntry) {
    setSelectedLogbook(logbook);
    setShowSubmitDialog(true);
  }

  async function handleSubmitLogbook() {
    if (!selectedLogbook) return;

    // Validate required fields before submit (online and offline)
    if (
      !selectedLogbook.prosedur_dilakukan ||
      !selectedLogbook.hasil_observasi ||
      !selectedLogbook.skill_dipelajari ||
      selectedLogbook.skill_dipelajari.length === 0
    ) {
      toast.error(
        "Mohon lengkapi semua field wajib (Prosedur, Hasil Observasi, Skill)",
      );
      return;
    }

    if (!navigator.onLine) {
      try {
        setSubmitting(true);
        const submittedAt = new Date().toISOString();
        await queueManager.enqueue("logbook_entry", "update", {
          id: selectedLogbook.id,
          status: "submitted",
          submitted_at: submittedAt,
          prosedur_dilakukan: selectedLogbook.prosedur_dilakukan,
          hasil_observasi: selectedLogbook.hasil_observasi,
          skill_dipelajari: selectedLogbook.skill_dipelajari,
        });
        setLogbookList((prev) =>
          prev.map((l) =>
            l.id === selectedLogbook.id
              ? { ...l, status: "submitted", submitted_at: submittedAt }
              : l,
          ),
        );
        setShowSubmitDialog(false);
        toast.success(
          "Logbook dikantri untuk pengiriman. Akan dikirim saat online.",
        );
      } catch (err: any) {
        toast.error(err.message || "Gagal mengantri logbook");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);

      const data: SubmitLogbookData = {
        id: selectedLogbook.id,
        prosedur_dilakukan: selectedLogbook.prosedur_dilakukan,
        hasil_observasi: selectedLogbook.hasil_observasi,
        skill_dipelajari: selectedLogbook.skill_dipelajari,
      };

      await submitLogbook(data);

      toast.success("Logbook berhasil diserahkan untuk direview");

      // Notify dosen (best-effort, non-blocking)
      if (selectedLogbook.jadwal_id) {
        try {
          const { data: jadwalData } = await (supabase as any)
            .from("jadwal_praktikum")
            .select("kelas_id, dosen_id, mata_kuliah_id, tanggal_praktikum")
            .eq("id", selectedLogbook.jadwal_id)
            .maybeSingle();

          const { data: kelasData } = jadwalData?.kelas_id
            ? await supabase
                .from("kelas")
                .select("dosen_id, mata_kuliah_id, nama_kelas")
                .eq("id", jadwalData.kelas_id)
                .eq("is_active", true)
                .maybeSingle()
            : { data: null };

          const dosenId = jadwalData?.dosen_id || kelasData?.dosen_id;
          let mataKuliahId = jadwalData?.mata_kuliah_id || null;

          if (!mataKuliahId && jadwalData?.kelas_id) {
            const { data: latestJadwalMkData } = await (supabase as any)
              .from("jadwal_praktikum")
              .select("mata_kuliah_id")
              .eq("kelas_id", jadwalData.kelas_id)
              .eq("is_active", true)
              .not("mata_kuliah_id", "is", null)
              .order("tanggal_praktikum", { ascending: false })
              .limit(1);

            mataKuliahId = latestJadwalMkData?.[0]?.mata_kuliah_id || null;
          }

          if (!mataKuliahId) {
            mataKuliahId = kelasData?.mata_kuliah_id || null;
          }

          if (dosenId) {
            // Get dosen's user_id
            const { data: dosenData } = await supabase
              .from("dosen")
              .select("user_id")
              .eq("id", dosenId)
              .single();

            if (dosenData?.user_id) {
              // Get mata kuliah name
              const mataKuliahData = mataKuliahId
                ? await supabase
                    .from("mata_kuliah")
                    .select("nama_mk")
                    .eq("id", mataKuliahId)
                    .eq("is_active", true)
                    .maybeSingle()
                : null;

              notifyDosenLogbookSubmitted(
                dosenData.user_id,
                user?.full_name || "Mahasiswa",
                kelasData?.nama_kelas || "Kelas",
                mataKuliahData?.data?.nama_mk || "Mata Kuliah",
                jadwalData?.tanggal_praktikum ||
                  selectedLogbook.jadwal?.tanggal_praktikum ||
                  new Date().toISOString(),
                selectedLogbook.id,
              ).catch((err) => {
                console.error("Failed to notify dosen:", err);
              });
            }
          }
        } catch (notifError) {
          console.error("Failed to send logbook notification:", notifError);
        }
      }

      setShowSubmitDialog(false);
      if (logbookCacheKey) await invalidateCache(logbookCacheKey);
      loadData(true);
    } catch (error: any) {
      console.error("Error submitting logbook:", error);
      toast.error(error.message || "Gagal menyerahkan logbook");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================================
  // DELETE LOGBOOK
  // ============================================================================

  async function handleDeleteLogbook(id: string) {
    if (!navigator.onLine) {
      // Jika ini logbook lokal (belum pernah sync), hapus dari state saja
      if (id.startsWith("offline-")) {
        if (!confirm("Yakin ingin menghapus logbook ini?")) return;
        setLogbookList((prev) => prev.filter((l) => l.id !== id));
        toast.success("Logbook lokal dihapus.");
      } else {
        toast.error(
          "Penghapusan logbook belum didukung saat offline. Sambungkan internet untuk menghapus.",
        );
      }
      return;
    }

    if (!confirm("Yakin ingin menghapus logbook ini?")) return;

    try {
      await deleteLogbook(id);
      toast.success("Logbook berhasil dihapus");
      if (logbookCacheKey) await invalidateCache(logbookCacheKey);
      loadData(true);
    } catch (error: any) {
      console.error("Error deleting logbook:", error);
      toast.error(error.message || "Gagal menghapus logbook");
    }
  }

  // ============================================================================
  // VIEW LOGBOOK
  // ============================================================================

  function openViewDialog(logbook: LogbookEntry) {
    setSelectedLogbook(logbook);
    setShowViewDialog(true);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  function getStatusBadge(status: string) {
    const config: Record<
      string,
      {
        label: string;
        icon: typeof Clock;
        className: string;
        dotClassName: string;
      }
    > = {
      draft: {
        label: "Draft",
        icon: FileText,
        className: "border-slate-200 bg-slate-50 text-slate-700",
        dotClassName: "bg-slate-400",
      },
      submitted: {
        label: "Menunggu Dinilai",
        icon: Clock,
        className: "border-sky-200 bg-sky-50 text-sky-800",
        dotClassName: "bg-sky-500",
      },
      reviewed: {
        label: "Menunggu Dinilai",
        icon: Clock,
        className: "border-amber-200 bg-amber-50 text-amber-800",
        dotClassName: "bg-amber-500",
      },
      graded: {
        label: "Dinilai",
        icon: CheckCircle2,
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClassName: "bg-emerald-500",
      },
    };
    const badge = config[status] || {
      label: status,
      icon: AlertCircle,
      className: "border-slate-200 bg-slate-50 text-slate-700",
      dotClassName: "bg-slate-400",
    };
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${badge.className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClassName}`} />
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  }

  function hasLogbook(jadwalId: string): boolean {
    return logbookList.some((l) => l.jadwal_id === jadwalId);
  }

  function getLogbookByJadwalId(jadwalId: string): LogbookEntry | undefined {
    return logbookList.find((l) => l.jadwal_id === jadwalId);
  }

  function toggleSkill(skill: string) {
    const currentSkills = formData.skill_dipelajari || [];
    if (currentSkills.includes(skill)) {
      setFormData({
        ...formData,
        skill_dipelajari: currentSkills.filter((s) => s !== skill),
      });
    } else {
      setFormData({
        ...formData,
        skill_dipelajari: [...currentSkills, skill],
      });
    }
  }

  function getJadwalWithoutLogbook(): Jadwal[] {
    return jadwalList.filter((j) => !hasLogbook(j.id));
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const isOffline = !navigator.onLine;
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }

    return new Date(lastUpdatedAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdatedAt]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Logbook Praktikum</h1>
        </div>
        <p className="text-muted-foreground">
          Catat pengalaman, hasil observasi, dan refleksi pembelajaran Anda
          selama praktikum kebidanan
        </p>
      </div>

      {(isOfflineData || isOffline) && (
        <Alert className="mb-6 border-warning/40 bg-warning/10">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Anda sedang melihat snapshot logbook tersimpan di perangkat.
            {lastUpdatedLabel
              ? ` Pembaruan terakhir: ${lastUpdatedLabel}.`
              : ""}
            {!navigator.onLine
              ? " Aksi buat, edit, kirim, dan hapus logbook sementara dinonaktifkan saat offline."
              : ""}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="my-logbook" className="mb-6">
        <TabsList>
          <TabsTrigger value="my-logbook">
            <FileText className="h-4 w-4 mr-2" />
            Logbook Saya ({logbookList.length})
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            Buat Logbook Baru
          </TabsTrigger>
        </TabsList>

        {/* My Logbooks Tab */}
        <TabsContent value="my-logbook" className="space-y-4">
          {logbookList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 text-muted-foreground/60 mb-4" />
                <p className="text-muted-foreground mb-2">
                  Belum ada logbook. Buat logbook pertama Anda!
                </p>
                {jadwalList.length === 0 ? (
                  <p className="text-sm text-warning">
                    Tidak ada jadwal praktikum aktif untuk Anda.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ada {jadwalList.length} jadwal praktikum tersedia.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {logbookList
                .filter((l): l is LogbookEntry => l != null)
                .map((logbook) => (
                  <Card
                    key={logbook.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              {logbook.jadwal?.topik || "Praktikum"}
                            </h3>
                            {getStatusBadge(logbook.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {logbook.jadwal?.tanggal_praktikum &&
                              format(
                                new Date(logbook.jadwal.tanggal_praktikum),
                                "dd MMMM yyyy",
                              )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Lab: {logbook.jadwal?.laboratorium?.nama_lab || "-"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openViewDialog(logbook)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {logbook.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(logbook)}
                                disabled={isOffline}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteLogbook(logbook.id)}
                                disabled={isOffline}
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openSubmitDialog(logbook)}
                                disabled={isOffline}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {(logbook.status === "reviewed" ||
                            logbook.status === "graded") && (
                            <div className="text-right">
                              {logbook.nilai != null && (
                                <div className="text-2xl font-bold text-success">
                                  {logbook.nilai}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preview */}
                      {logbook.prosedur_dilakukan && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Prosedur:</span>{" "}
                          <span className="text-muted-foreground line-clamp-1">
                            {logbook.prosedur_dilakukan}
                          </span>
                        </div>
                      )}

                      {logbook.skill_dipelajari &&
                        logbook.skill_dipelajari.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {logbook.skill_dipelajari.map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                      {logbook.dosen_feedback && (
                        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <p className="mb-1 text-xs font-medium text-primary">
                            Feedback Dosen:
                          </p>
                          <p className="text-sm text-primary">
                            {logbook.dosen_feedback}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Create Logbook Tab */}
        <TabsContent value="create">
          {jadwalList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-16 w-16 text-warning mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  Tidak ada jadwal praktikum aktif
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Anda belum terdaftar di kelas mana pun atau belum ada jadwal
                  praktikum yang dijadwalkan untuk kelas Anda.
                </p>
                <p className="text-xs text-muted-foreground/60 mt-4">
                  Hubungi dosen atau admin jika Anda merasa ini adalah
                  kesalahan.
                </p>
              </CardContent>
            </Card>
          ) : getJadwalWithoutLogbook().length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-success mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  Semua jadwal praktikum sudah memiliki logbook!
                </p>
                <p className="text-sm text-muted-foreground">
                  Anda telah membuat logbook untuk semua {jadwalList.length}{" "}
                  jadwal praktikum.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getJadwalWithoutLogbook().map((jadwal) => (
                <Card
                  key={jadwal.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    if (isOffline) {
                      toast.error(
                        "Pembuatan logbook baru belum didukung saat offline. Sambungkan internet untuk melanjutkan.",
                      );
                      return;
                    }
                    openCreateDialog(jadwal);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      {typeof jadwal.kelas === "object" &&
                      jadwal.kelas?.nama_kelas
                        ? jadwal.kelas.nama_kelas
                        : jadwal.kelas_relation?.nama_kelas || "Kelas"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-1">
                      {jadwal.topik || "Praktikum"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {jadwal.tanggal_praktikum &&
                        format(
                          new Date(jadwal.tanggal_praktikum),
                          "dd MMM yyyy",
                        )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lab: {jadwal.laboratorium?.nama_lab}
                    </p>
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      disabled={isOffline}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Logbook
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Logbook Baru</DialogTitle>
            <DialogDescription>
              {selectedJadwal?.topik} -{" "}
              {selectedJadwal?.tanggal_praktikum &&
                format(
                  new Date(selectedJadwal.tanggal_praktikum),
                  "dd MMM yyyy",
                )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Prosedur */}
            <div>
              <Label htmlFor="prosedur">
                Prosedur yang Dilakukan <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="prosedur"
                placeholder="Jelaskan prosedur/praktikum yang Anda lakukan..."
                value={formData.prosedur_dilakukan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prosedur_dilakukan: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            {/* Hasil Observasi */}
            <div>
              <Label htmlFor="observasi">
                Hasil Observasi <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="observasi"
                placeholder="Catat hasil observasi/pemeriksaan yang Anda dapatkan..."
                value={formData.hasil_observasi}
                onChange={(e) =>
                  setFormData({ ...formData, hasil_observasi: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Skill Dipelajari */}
            <div>
              <Label>
                Skill yang Dipelajari <span className="text-danger">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SKILL_KEBIDANAN.map((skill) => {
                  const isSelected = formData.skill_dipelajari?.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs p-2 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-muted-foreground border-border/50 hover:bg-muted/40"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Dipilih: {formData.skill_dipelajari?.length || 0} skill
              </p>
            </div>

            {/* Kendala */}
            <div>
              <Label htmlFor="kendala">Kendala yang Dihadapi</Label>
              <Textarea
                id="kendala"
                placeholder="Apakah ada kesulitan atau kendala saat praktikum?"
                value={formData.kendala_dihadapi}
                onChange={(e) =>
                  setFormData({ ...formData, kendala_dihadapi: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Refleksi */}
            <div>
              <Label htmlFor="refleksi">Refleksi Pembelajaran</Label>
              <Textarea
                id="refleksi"
                placeholder="Apa yang Anda pelajari dari praktikum ini?"
                value={formData.refleksi}
                onChange={(e) =>
                  setFormData({ ...formData, refleksi: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Catatan Tambahan */}
            <div>
              <Label htmlFor="catatan">Catatan Tambahan</Label>
              <Textarea
                id="catatan"
                placeholder="Catatan tambahan (opsional)"
                value={formData.catatan_tambahan}
                onChange={(e) =>
                  setFormData({ ...formData, catatan_tambahan: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleCreateLogbook} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Draft"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Logbook</DialogTitle>
            <DialogDescription>
              Status: <span className="text-warning">Draft</span> - Anda masih
              bisa mengubah logbook ini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Same fields as create */}
            <div>
              <Label htmlFor="edit-prosedur">
                Prosedur yang Dilakukan <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="edit-prosedur"
                value={formData.prosedur_dilakukan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prosedur_dilakukan: e.target.value,
                  })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-observasi">
                Hasil Observasi <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="edit-observasi"
                value={formData.hasil_observasi}
                onChange={(e) =>
                  setFormData({ ...formData, hasil_observasi: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label>
                Skill yang Dipelajari <span className="text-danger">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SKILL_KEBIDANAN.map((skill) => {
                  const isSelected = formData.skill_dipelajari?.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs p-2 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-muted-foreground border-border/50 hover:bg-muted/40"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-kendala">Kendala yang Dihadapi</Label>
              <Textarea
                id="edit-kendala"
                value={formData.kendala_dihadapi}
                onChange={(e) =>
                  setFormData({ ...formData, kendala_dihadapi: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-refleksi">Refleksi Pembelajaran</Label>
              <Textarea
                id="edit-refleksi"
                value={formData.refleksi}
                onChange={(e) =>
                  setFormData({ ...formData, refleksi: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-catatan">Catatan Tambahan</Label>
              <Textarea
                id="edit-catatan"
                value={formData.catatan_tambahan}
                onChange={(e) =>
                  setFormData({ ...formData, catatan_tambahan: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateLogbook} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Logbook untuk Review</DialogTitle>
            <DialogDescription>
              Pastikan semua data sudah lengkap sebelum diserahkan ke dosen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-sm">
              {selectedLogbook?.prosedur_dilakukan ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-danger" />
              )}
              <span>Prosedur Dilakukan</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {selectedLogbook?.hasil_observasi ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-danger" />
              )}
              <span>Hasil Observasi</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {selectedLogbook?.skill_dipelajari &&
              selectedLogbook.skill_dipelajari.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertCircle className="h-4 w-4 text-danger" />
              )}
              <span>
                Skill yang Dipelajari (
                {selectedLogbook?.skill_dipelajari?.length || 0})
              </span>
            </div>

            {selectedLogbook?.skill_dipelajari && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedLogbook.skill_dipelajari.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmitLogbook} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyerahkan...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit ke Dosen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Logbook</DialogTitle>
            <DialogDescription>
              {selectedLogbook?.jadwal?.topik} -{" "}
              {selectedLogbook?.jadwal?.tanggal_praktikum &&
                format(
                  new Date(selectedLogbook.jadwal.tanggal_praktikum),
                  "dd MMM yyyy",
                )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              {selectedLogbook && getStatusBadge(selectedLogbook.status)}
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Prosedur
              </p>
              <p className="text-sm mt-1">
                {selectedLogbook?.prosedur_dilakukan || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Hasil Observasi
              </p>
              <p className="text-sm mt-1">
                {selectedLogbook?.hasil_observasi || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Skill yang Dipelajari
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedLogbook?.skill_dipelajari &&
                selectedLogbook.skill_dipelajari.length > 0 ? (
                  selectedLogbook.skill_dipelajari.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground/60">-</p>
                )}
              </div>
            </div>

            {selectedLogbook?.kendala_dihadapi && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Kendala
                </p>
                <p className="text-sm mt-1">
                  {selectedLogbook.kendala_dihadapi}
                </p>
              </div>
            )}

            {selectedLogbook?.refleksi && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Refleksi
                </p>
                <p className="text-sm mt-1">{selectedLogbook.refleksi}</p>
              </div>
            )}

            {selectedLogbook?.nilai != null && (
              <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                <p className="text-sm font-medium text-success mb-1">
                  Nilai: {selectedLogbook.nilai}
                </p>
              </div>
            )}

            {selectedLogbook?.dosen_feedback && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="mb-1 text-sm font-medium text-primary">
                  Feedback Dosen:
                </p>
                <p className="text-sm text-primary">
                  {selectedLogbook.dosen_feedback}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
