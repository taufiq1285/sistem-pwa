import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { networkDetector } from "@/lib/offline/network-detector";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";
import { getLogbookStats } from "@/lib/api/logbook.api";
import type { LogbookStats } from "@/types/logbook.types";
import { RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Calendar,
  ArrowRight,
  Clock,
  AlertCircle,
  BookOpen,
  Target,
  Eye,
  Edit,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import {
  getDosenStats,
  getMyKelas,
  getUpcomingPracticum,
  getPendingGrading,
  getActiveKuis,
  refreshDosenData,
  checkDosenAssignmentChanges,
  type DosenStats,
  type KelasWithStats,
  type UpcomingPracticum as UpcomingPracticumType,
  type PendingGrading as PendingGradingType,
  type KuisWithStats,
} from "@/lib/api/dosen.api";

// Interface untuk assignment yang diberikan admin kepada dosen
interface DosenAssignment {
  dosen_id: string;
  mata_kuliah_id: string;
  kelas_id: string;
  total_jadwal: number;
  total_mahasiswa: number;
  tanggal_mulai: string;
  tanggal_selesai: string;

  // Join data
  mata_kuliah: {
    id: string;
    nama_mk: string;
    kode_mk: string;
  };
  kelas: {
    id: string;
    nama_kelas: string;
    kode_kelas: string;
    tahun_ajaran: string;
    semester_ajaran: number;
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentDosenId = user?.dosen?.id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DosenStats | null>(null);
  const [assignments, setAssignments] = useState<DosenAssignment[]>([]);
  const [myKelas, setMyKelas] = useState<KelasWithStats[]>([]);
  const [upcomingPracticum, setUpcomingPracticum] = useState<
    UpcomingPracticumType[]
  >([]);
  const [pendingGrading, setPendingGrading] = useState<PendingGradingType[]>(
    [],
  );
  const [logbookStats, setLogbookStats] = useState<LogbookStats | null>(null);
  const [activeKuis, setActiveKuis] = useState<KuisWithStats[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<KelasWithStats | null>(
    null,
  );
  const [kelasMahasiswa, setKelasMahasiswa] = useState<any[]>([]);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasDataChanges, setHasDataChanges] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastOfflineSnapshotAt, setLastOfflineSnapshotAt] = useState<
    number | null
  >(null);

  const lastOfflineSnapshotLabel = useMemo(() => {
    if (!lastOfflineSnapshotAt) {
      return null;
    }

    return new Date(lastOfflineSnapshotAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastOfflineSnapshotAt]);

  useEffect(() => {
    if (user?.id && currentDosenId) {
      fetchAssignments();
      fetchDashboardData();

      // Set up real-time subscription untuk dashboard data
      const setupRealtimeSubscriptions = () => {
        // Subscribe ke kelas changes
        const kelasSubscription = supabase
          .channel("kelas-changes")
          .on(
            "postgres_changes",
            {
              event: "*", // INSERT, UPDATE, DELETE
              schema: "public",
              table: "kelas",
              filter: `dosen_id=eq.${currentDosenId}`,
            },
            () => {
              console.log("Kelas changed, refreshing dashboard...");
              setHasDataChanges(true);
              setIsRefreshing(true);
              fetchDashboardData().finally(() => {
                setIsRefreshing(false);
                setLastRefresh(new Date());
              });
            },
          )
          .subscribe();

        // Subscribe ke kuis changes
        const kuisSubscription = supabase
          .channel("kuis-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "kuis",
            },
            (payload) => {
              console.log("Kuis changed, refreshing dashboard...", payload);
              setHasDataChanges(true);
              setIsRefreshing(true);
              // Force refresh on DELETE to ensure cache is cleared
              const shouldForceRefresh = payload.eventType === "DELETE";
              fetchDashboardData(shouldForceRefresh).finally(() => {
                setIsRefreshing(false);
                setLastRefresh(new Date());
              });
            },
          )
          .subscribe();

        // Subscribe ke jadwal_praktikum changes (admin delete)
        const jadwalSubscription = supabase
          .channel("jadwal-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "jadwal_praktikum",
            },
            (payload) => {
              console.log(
                "Jadwal praktikum changed, refreshing dashboard...",
                payload,
              );
              // Check if this affects current dosen
              if (
                payload.eventType === "DELETE" ||
                payload.eventType === "UPDATE"
              ) {
                // Check if the change affects current dosen
                const oldData = payload.old as any;
                const newData = payload.new as any;

                if (
                  (oldData && (oldData as any).dosen_id === currentDosenId) ||
                  (newData && (newData as any).dosen_id === currentDosenId)
                ) {
                  setHasDataChanges(true);
                  setIsRefreshing(true);
                  fetchDashboardData().finally(() => {
                    setIsRefreshing(false);
                    setLastRefresh(new Date());
                  });
                }
              }
            },
          )
          .subscribe();

        // Subscribe ke dosen_mata_kuliah changes (admin delete)
        const dosenMkSubscription = supabase
          .channel("dosen-mk-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "dosen_mata_kuliah",
            },
            (payload) => {
              console.log(
                "Dosen mata kuliah changed, refreshing dashboard...",
                payload,
              );
              if (
                payload.eventType === "DELETE" ||
                payload.eventType === "UPDATE"
              ) {
                setHasDataChanges(true);
                setIsRefreshing(true);
                fetchDashboardData().finally(() => {
                  setIsRefreshing(false);
                  setLastRefresh(new Date());
                });
              }
            },
          )
          .subscribe();

        // Subscribe ke kuis_attempt changes (untuk grading updates)
        const attemptSubscription = supabase
          .channel("attempt-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "kuis_attempt",
            },
            () => {
              console.log("Kuis attempt changed, refreshing dashboard...");
              setHasDataChanges(true);
              setIsRefreshing(true);
              fetchDashboardData().finally(() => {
                setIsRefreshing(false);
                setLastRefresh(new Date());
              });
            },
          )
          .subscribe();

        return () => {
          // Cleanup all subscriptions
          kelasSubscription.unsubscribe();
          kuisSubscription.unsubscribe();
          attemptSubscription.unsubscribe();
          jadwalSubscription.unsubscribe();
          dosenMkSubscription.unsubscribe();
        };
      };

      // ✅ Only setup real-time subscriptions when ONLINE
      let cleanup: (() => void) | undefined;
      if (networkDetector.isOnline()) {
        try {
          cleanup = setupRealtimeSubscriptions();
        } catch (error) {
          console.warn(
            "⚠️ Failed to setup real-time subscriptions (offline mode?):",
            error,
          );
          cleanup = undefined;
        }
      } else {
        console.log("ℹ️ Offline mode - skipping real-time subscriptions");
      }

      // Check for data changes setiap 10 detik (only when online)
      const changeCheckInterval = setInterval(async () => {
        try {
          // Skip if offline
          if (!networkDetector.isOnline()) {
            return;
          }

          const result = await checkDosenAssignmentChanges();

          if (result.hasChanges) {
            console.log("🔔 Data changes detected, refreshing dashboard...");
            setHasDataChanges(true);
            setIsRefreshing(true);

            // Force refresh with cache clearing
            const refreshResult = await refreshDosenData();

            if (refreshResult.success) {
              await fetchDashboardData();
              setLastRefresh(new Date());
            }

            setIsRefreshing(false);
            setHasDataChanges(false);
          }
        } catch (error) {
          // Silently fail in offline mode
          if (!networkDetector.isOnline()) {
            console.log("ℹ️ Offline mode - skipping data change check");
          } else {
            console.error("Error checking data changes:", error);
          }
        }
      }, 10000);

      // Auto-refresh setiap 30 detik sebagai fallback (only when online)
      const intervalId = setInterval(() => {
        // Skip if offline
        if (!networkDetector.isOnline()) {
          return;
        }

        setIsRefreshing(true);
        fetchDashboardData().finally(() => {
          setIsRefreshing(false);
          setLastRefresh(new Date());
        });
      }, 30000);

      // Cleanup on unmount
      return () => {
        cleanup?.();
        clearInterval(intervalId);
        clearInterval(changeCheckInterval);
      };
    } else {
      // Clear data if no user
      setStats(null);
      setAssignments([]);
      setMyKelas([]);
      setUpcomingPracticum([]);
      setPendingGrading([]);
      setLogbookStats(null);
      setActiveKuis([]);
      setIsOfflineData(false);
      setLastOfflineSnapshotAt(null);
    }
  }, [user?.id, currentDosenId]);

  // Fetch assignments yang diberikan admin kepada dosen ini
  const fetchAssignments = async (forceRefresh = false) => {
    try {
      if (!currentDosenId) {
        setAssignments([]);
        setIsOfflineData(false);
        return;
      }

      // Use cacheAPI for assignments with offline support
      const assignmentsData = await cacheAPI(
        `dosen_assignments_${currentDosenId}`,
        async () => {
          // Get assignments for this dosen (similar logic to admin page)
          const { data: rawData, error } = await (supabase as any)
            .from("jadwal_praktikum")
            .select(
              `
              dosen_id,
              mata_kuliah_id,
              kelas_id,
              mata_kuliah:mata_kuliah!inner(id, nama_mk, kode_mk),
              kelas:kelas!inner(id, nama_kelas, kode_kelas, tahun_ajaran, semester_ajaran)
            `,
            )
            .eq("dosen_id", currentDosenId)
            .eq("is_active", true);

          if (error) throw error;
          if (!rawData || rawData.length === 0) {
            return [];
          }

          // Group by unique assignment (dosen + mata_kuliah + kelas)
          const assignmentMap = new Map<string, any>();

          rawData.forEach((item: any) => {
            const key = `${item.dosen_id}-${item.mata_kuliah_id}-${item.kelas_id}`;

            if (!assignmentMap.has(key)) {
              assignmentMap.set(key, {
                dosen_id: item.dosen_id,
                mata_kuliah_id: item.mata_kuliah_id,
                kelas_id: item.kelas_id,
                total_jadwal: 0,
                total_mahasiswa: 0,
                tanggal_mulai: "",
                tanggal_selesai: "",
                mata_kuliah: item.mata_kuliah,
                kelas: item.kelas,
                jadwalDetail: [],
              });
            }
          });

          // Get detailed schedules and mahasiswa count for each assignment
          const assignmentsWithDetails = [];

          for (const [key, assignment] of assignmentMap) {
            // Get all jadwal for this assignment
            const { data: jadwalData, error: jadwalError } = await (
              supabase as any
            )
              .from("jadwal_praktikum")
              .select(
                `
                id,
                tanggal_praktikum,
                hari,
                jam_mulai,
                jam_selesai,
                topik,
                status
              `,
              )
              .eq("dosen_id", assignment.dosen_id)
              .eq("mata_kuliah_id", assignment.mata_kuliah_id)
              .eq("kelas_id", assignment.kelas_id)
              .eq("is_active", true)
              .order("tanggal_praktikum", { ascending: true });

            // Get mahasiswa count for this kelas
            const mahasiswaResult: any = await (supabase as any)
              .from("mahasiswa")
              .select("*", { count: "exact", head: true })
              .eq("kelas_id", assignment.kelas_id)
              .eq("is_active", true);

            const { count: mahasiswaCount } = mahasiswaResult;

            if (jadwalError) {
              console.warn(
                "Error fetching jadwal details for assignment:",
                key,
                jadwalError,
              );
              continue;
            }

            const jadwalDetail = jadwalData || [];
            const dates = (jadwalDetail as any[])
              .map((j) => j.tanggal_praktikum)
              .filter(Boolean);

            assignmentsWithDetails.push({
              ...assignment,
              total_jadwal: jadwalDetail.length,
              total_mahasiswa: mahasiswaCount || 0,
              tanggal_mulai: dates.length > 0 ? dates[0] : "",
              tanggal_selesai: dates.length > 0 ? dates[dates.length - 1] : "",
            });
          }

          return assignmentsWithDetails;
        },
        {
          ttl: 10 * 60 * 1000, // 10 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      setAssignments(assignmentsData);
    } catch (error: any) {
      // Silently fail in offline mode
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - using cached assignments data");
      } else {
        console.error("Error fetching assignments:", error);
      }
      // Don't show error toast for assignments, just log it
    }
  };

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      console.log("🔄 fetchDashboardData called...");
      setLoading(true);
      setError(null);

      const cacheIdentity = currentDosenId || user?.id || "anonymous";
      const statsCacheKey = `dosen_stats_${cacheIdentity}`;
      const kelasCacheKey = `dosen_kelas_${cacheIdentity}`;
      const practicumCacheKey = `dosen_practicum_${cacheIdentity}`;
      const gradingCacheKey = `dosen_grading_${cacheIdentity}`;
      const logbookCacheKey = `dosen_logbook_${cacheIdentity}`;
      const kuisCacheKey = `dosen_kuis_${cacheIdentity}`;
      const assignmentsCacheKey = `dosen_assignments_${cacheIdentity}`;

      const [
        cachedStatsEntry,
        cachedKelasEntry,
        cachedPracticumEntry,
        cachedGradingEntry,
        cachedLogbookEntry,
        cachedKuisEntry,
        cachedAssignmentsEntry,
      ] = await Promise.all([
        getCachedData<DosenStats>(statsCacheKey),
        getCachedData<KelasWithStats[]>(kelasCacheKey),
        getCachedData<UpcomingPracticumType[]>(practicumCacheKey),
        getCachedData<PendingGradingType[]>(gradingCacheKey),
        getCachedData<LogbookStats>(logbookCacheKey),
        getCachedData<KuisWithStats[]>(kuisCacheKey),
        getCachedData<DosenAssignment[]>(assignmentsCacheKey),
      ]);

      const hasCachedData =
        !!cachedStatsEntry?.data ||
        Array.isArray(cachedKelasEntry?.data) ||
        Array.isArray(cachedPracticumEntry?.data) ||
        Array.isArray(cachedGradingEntry?.data) ||
        !!cachedLogbookEntry?.data ||
        Array.isArray(cachedKuisEntry?.data) ||
        Array.isArray(cachedAssignmentsEntry?.data);

      if (hasCachedData) {
        setStats(cachedStatsEntry?.data ?? null);
        setMyKelas(
          Array.isArray(cachedKelasEntry?.data) ? cachedKelasEntry.data : [],
        );
        setUpcomingPracticum(
          Array.isArray(cachedPracticumEntry?.data)
            ? cachedPracticumEntry.data
            : [],
        );
        setPendingGrading(
          Array.isArray(cachedGradingEntry?.data)
            ? cachedGradingEntry.data
            : [],
        );
        setLogbookStats(cachedLogbookEntry?.data ?? null);
        setActiveKuis(
          Array.isArray(cachedKuisEntry?.data) ? cachedKuisEntry.data : [],
        );
        setAssignments(
          Array.isArray(cachedAssignmentsEntry?.data)
            ? cachedAssignmentsEntry.data
            : [],
        );
        setIsOfflineData(!navigator.onLine);
        setLastOfflineSnapshotAt(
          Math.max(
            cachedStatsEntry?.timestamp || 0,
            cachedKelasEntry?.timestamp || 0,
            cachedPracticumEntry?.timestamp || 0,
            cachedGradingEntry?.timestamp || 0,
            cachedLogbookEntry?.timestamp || 0,
            cachedKuisEntry?.timestamp || 0,
            cachedAssignmentsEntry?.timestamp || 0,
          ) || null,
        );
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan snapshot dashboard dosen terakhir."
            : "Perangkat sedang offline dan belum ada snapshot dashboard dosen tersimpan.",
        );
      }

      // Fetch assignments juga
      await fetchAssignments(forceRefresh);

      console.log("📞 Calling dashboard APIs with caching...");
      // Use cacheAPI with stale-while-revalidate for offline support
      const [statsData, kelasData, practicumData, gradingData, logbookData, kuisData] =
        await Promise.all([
          cacheAPI(statsCacheKey, () => getDosenStats(forceRefresh), {
            ttl: 10 * 60 * 1000, // 10 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(kelasCacheKey, () => getMyKelas(5), {
            ttl: 10 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(practicumCacheKey, () => getUpcomingPracticum(5), {
            ttl: 5 * 60 * 1000, // 5 minutes (schedule changes frequently)
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(gradingCacheKey, () => getPendingGrading(5), {
            ttl: 5 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(
            logbookCacheKey,
            () =>
              getLogbookStats({
                dosen_id: currentDosenId || undefined,
              }),
            {
              ttl: 5 * 60 * 1000,
              forceRefresh,
              staleWhileRevalidate: true,
            },
          ),
          cacheAPI(kuisCacheKey, () => getActiveKuis(20), {
            ttl: 5 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          }),
        ]);

      setStats(statsData);
      setMyKelas(kelasData || []);
      setUpcomingPracticum(practicumData || []);
      setPendingGrading(gradingData || []);
      setLogbookStats(logbookData || null);
      setActiveKuis(kuisData || []);
      setIsOfflineData(false);
      setLastOfflineSnapshotAt(Date.now());

      console.log("✅ Dashboard data loaded successfully");
    } catch (err) {
      // Handle offline mode gracefully
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - showing cached dashboard data");
        setError(null); // Don't show error in offline mode
        setIsOfflineData(true);
      } else {
        console.error("Error fetching dashboard data:", err);
        setError("Gagal memuat data dashboard. Silakan refresh halaman.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch mahasiswa for selected kelas
  const fetchMahasiswaByKelas = async (kelasId: string) => {
    try {
      setLoadingMahasiswa(true);

      // ✅ Skip if offline
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - skipping mahasiswa fetch");
        setKelasMahasiswa([]);
        return;
      }

      const { data, error } = await supabase
        .from("kelas_mahasiswa" as any)
        .select(
          `
          mahasiswa:mahasiswa_id(
            nim,
            users:user_id(
              full_name,
              email
            )
          )
        `,
        )
        .eq("kelas_id", kelasId)
        .eq("is_active", true);

      if (error) throw error;
      setKelasMahasiswa(
        data
          ?.map((item: any) => {
            const mahasiswa = item?.mahasiswa;
            if (!mahasiswa) return null;

            return {
              nim: mahasiswa.nim,
              full_name: mahasiswa.users?.full_name || "Unknown",
              email: mahasiswa.users?.email || "",
            };
          })
          .filter(Boolean) || [],
      );
    } catch (err) {
      // Silently fail in offline mode
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - could not fetch mahasiswa");
      } else {
        console.error("Error fetching mahasiswa:", err);
      }
      setKelasMahasiswa([]);
    } finally {
      setLoadingMahasiswa(false);
    }
  };

  // Handle kelas click
  const handleKelasClick = (kelas: KelasWithStats) => {
    setSelectedKelas(kelas);
    fetchMahasiswaByKelas(kelas.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const dayNames: Record<string, string> = {
    monday: "Senin",
    tuesday: "Selasa",
    wednesday: "Rabu",
    thursday: "Kamis",
    friday: "Jumat",
    saturday: "Sabtu",
    sunday: "Minggu",
  };

  const totalAssignedStudents = assignments.reduce(
    (sum, assignment) => sum + assignment.total_mahasiswa,
    0,
  );
  const totalStudentsInActiveClasses = myKelas.reduce(
    (sum, kelas) => sum + kelas.totalMahasiswa,
    0,
  );
  const upcomingPrimary = upcomingPracticum[0] || null;
  const upcomingSecondary = upcomingPracticum.slice(1, 4);
  const kelasPreview = myKelas.slice(0, 4);
  const draftKuisCount = activeKuis.filter((kuis) => kuis.status === "draft").length;
  const publishedKuisCount = activeKuis.filter(
    (kuis) => kuis.status === "published",
  ).length;
  const pendingLogbookCount =
    (logbookStats?.submitted || 0) + (logbookStats?.reviewed || 0);
  const needsAttentionCount = pendingLogbookCount + activeKuis.length;

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

  return (
    <>
      <div className="surface-grid min-h-screen bg-background">
        <div className="app-container py-4 sm:py-6 lg:py-8">
          <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
            {/* Header */}
            <GlassCard
              intensity="high"
              glow
              className="overflow-hidden rounded-4xl border border-border/50 bg-background/80 p-4 shadow-xl sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="rounded-3xl bg-linear-to-br from-primary via-primary/90 to-accent/80 p-3 shadow-lg shadow-primary/25">
                      <Sparkles className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/80">
                        Ringkasan Mengajar
                      </p>
                      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Selamat datang, {user?.full_name || user?.email}
                      </h1>
                      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                        {upcomingPrimary
                          ? `Praktikum terdekat Anda adalah ${upcomingPrimary.mata_kuliah_nama} untuk ${upcomingPrimary.kelas_nama}.`
                          : myKelas.length > 0
                            ? "Belum ada praktikum terdekat yang terjadwal, tetapi kelas aktif Anda sudah siap dikelola."
                            : "Dashboard ini merangkum jadwal, kelas aktif, dan tindak lanjut penting secara singkat."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                        >
                          {myKelas.length} kelas aktif
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                        >
                          {totalStudentsInActiveClasses} mahasiswa dalam kelas aktif
                        </Badge>
                        {hasDataChanges && (
                          <Badge className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning hover:bg-warning/15">
                            Ada pembaruan data
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  {isRefreshing && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Memperbarui data...</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsRefreshing(true);
                      setHasDataChanges(false); // Clear change indicator on manual refresh
                      // ✅ FIX: Force refresh to clear cache after cleanup
                      fetchDashboardData(true).finally(() => {
                        setIsRefreshing(false);
                        setLastRefresh(new Date());
                      });
                    }}
                    disabled={loading || isRefreshing}
                    className="font-semibold border-2 w-full sm:w-auto"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/dosen/jadwal")}
                    className="w-full sm:w-auto"
                  >
                    Lihat Jadwal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {lastRefresh && (
                <p className="mt-4 text-xs font-medium text-muted-foreground sm:text-sm">
                  Terakhir diperbarui {lastRefresh.toLocaleTimeString("id-ID")}
                </p>
              )}
            </GlassCard>

            {error && (
              <Alert className="border-destructive/30 bg-destructive/10 text-destructive shadow-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold text-inherit">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {(isOfflineData || !navigator.onLine) && (
              <Alert className="border-warning/40 bg-warning/10 shadow-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium text-foreground">
                  Dashboard dosen sedang memakai snapshot lokal dari perangkat.
                  {lastOfflineSnapshotLabel
                    ? ` Pembaruan terakhir: ${lastOfflineSnapshotLabel}.`
                    : ""}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/60 bg-card/90 shadow-sm">
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Kelas Aktif
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {myKelas.length}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      kelas yang sedang Anda tangani
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/90 shadow-sm">
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="rounded-2xl bg-accent/15 p-2.5 text-accent">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Praktikum Terdekat
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {upcomingPracticum.length}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      sesi dalam 7 hari ke depan
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/90 shadow-sm">
                <CardContent className="flex items-start gap-3 p-5">
                  <div className="rounded-2xl bg-warning/15 p-2.5 text-warning">
                    <Edit className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Perlu Diperhatikan
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {needsAttentionCount}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      item tindak lanjut aktif
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              <Card className="border-border/60 bg-card/90 shadow-sm">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Praktikum Berikutnya</CardTitle>
                      <CardDescription>
                        Fokus utama saat Anda membuka dashboard
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/dosen/jadwal')}
                    >
                      Semua jadwal
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!upcomingPrimary ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                      <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                      <p className="mt-3 font-semibold text-foreground">
                        Belum ada praktikum terjadwal
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Jadwal praktikum yang aktif akan muncul di sini.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/8 to-accent/10 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <Badge
                              variant="secondary"
                              className="rounded-full bg-primary/10 px-3 py-1 text-primary"
                            >
                              Sesi terdekat
                            </Badge>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">
                                {upcomingPrimary.mata_kuliah_nama}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {upcomingPrimary.kelas_nama}
                                {upcomingPrimary.topik
                                  ? ` • ${upcomingPrimary.topik}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/dosen/jadwal')}
                          >
                            Buka jadwal
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-background/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Hari
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {dayNames[upcomingPrimary.hari.toLowerCase()] ||
                                upcomingPrimary.hari}
                              , {formatDate(upcomingPrimary.tanggal_praktikum)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-background/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Jam
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {formatTime(upcomingPrimary.jam_mulai)} -{' '}
                              {formatTime(upcomingPrimary.jam_selesai)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-background/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Laboratorium
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                              {upcomingPrimary.lab_nama}
                            </p>
                          </div>
                        </div>
                      </div>

                      {upcomingSecondary.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-muted-foreground">
                            Jadwal sesudahnya
                          </p>
                          {upcomingSecondary.map((jadwal) => (
                            <button
                              key={jadwal.id}
                              type="button"
                              onClick={() => navigate('/dosen/jadwal')}
                              className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40"
                            >
                              <div>
                                <p className="font-semibold text-foreground">
                                  {jadwal.mata_kuliah_nama}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {jadwal.kelas_nama} •{" "}
                                  {formatDate(jadwal.tanggal_praktikum)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-foreground">
                                  {formatTime(jadwal.jam_mulai)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {jadwal.lab_nama}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/90 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Perlu Diperhatikan</CardTitle>
                  <CardDescription>
                    Tindak lanjut yang paling relevan saat ini
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    type="button"
                    onClick={() => navigate('/dosen/logbook-review')}
                    className="flex w-full items-start gap-3 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="rounded-2xl bg-warning/15 p-2.5 text-warning">
                      <Edit className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        Logbook perlu direview
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {pendingLogbookCount}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {pendingLogbookCount > 0
                          ? `${logbookStats?.submitted || 0} diajukan, ${logbookStats?.reviewed || 0} siap diberi nilai.`
                          : 'Belum ada logbook yang menunggu review.'}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/dosen/kuis')}
                    className="flex w-full items-start gap-3 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        Tugas Praktikum
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {activeKuis.length}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activeKuis.length > 0
                          ? `${draftKuisCount} draft, ${publishedKuisCount} dipublikasikan. ${activeKuis[0].judul} termasuk di dalamnya.`
                          : 'Belum ada tugas praktikum pada kelas yang Anda tangani.'}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                  </button>

                  <div className="rounded-2xl bg-muted/35 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      Ringkasan cepat
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Assignment aktif</span>
                        <span className="font-semibold text-foreground">
                          {assignments.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Mahasiswa terjangkau</span>
                        <span className="font-semibold text-foreground">
                          {totalAssignedStudents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Status dashboard</span>
                        <span className="font-semibold text-foreground">
                          {isOfflineData || !navigator.onLine
                            ? 'Snapshot lokal'
                            : 'Online'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 bg-card/90 shadow-sm">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Kelas Aktif</CardTitle>
                    <CardDescription>
                      Ringkasan kelas yang sedang Anda tangani
                    </CardDescription>
                  </div>
                  {myKelas.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/dosen/penilaian')}
                    >
                      Buka penilaian
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {myKelas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
                    <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-3 font-semibold text-foreground">
                      Belum ada kelas aktif
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kelas akan muncul setelah ada jadwal praktikum aktif untuk dosen ini.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {kelasPreview.map((kelas) => (
                      <button
                        key={kelas.id}
                        type="button"
                        onClick={() => handleKelasClick(kelas)}
                        className="rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">
                              {kelas.mata_kuliah_nama || 'Praktikum'}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {kelas.nama_kelas}
                            </p>
                          </div>
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Mahasiswa</span>
                            <span className="font-semibold text-foreground">
                              {kelas.totalMahasiswa}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Tahun ajaran</span>
                            <span className="font-semibold text-foreground">
                              {kelas.tahun_ajaran}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {myKelas.length > kelasPreview.length && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {myKelas.length - kelasPreview.length} kelas lainnya tersedia di halaman penilaian.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Kelas Detail Modal */}
      <Dialog
        open={!!selectedKelas}
        onOpenChange={() => setSelectedKelas(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5" />
              Detail Kelas
            </DialogTitle>
            <DialogDescription className="text-base font-semibold">
              Informasi lengkap kelas dan daftar mahasiswa
            </DialogDescription>
          </DialogHeader>

          {selectedKelas && (
            <div className="space-y-6">
              {/* Info Kelas */}
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedKelas.mata_kuliah_nama || "Praktikum"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedKelas.nama_kelas}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {selectedKelas.kode_kelas}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {selectedKelas.totalMahasiswa}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Mahasiswa
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <div className="font-medium text-muted-foreground">
                      Tahun Ajaran
                    </div>
                    <div className="text-foreground">
                      {selectedKelas.tahun_ajaran}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <div className="font-medium text-muted-foreground">
                      Semester
                    </div>
                    <div className="text-foreground">
                      {selectedKelas.semester_ajaran || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Daftar Mahasiswa */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Daftar Mahasiswa ({kelasMahasiswa.length})
                </h4>

                {loadingMahasiswa ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-12 bg-muted/50 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : kelasMahasiswa.length === 0 ? (
                  <div className="text-center py-8 bg-muted/40 rounded-lg">
                    <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Belum ada mahasiswa terdaftar
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {kelasMahasiswa.map((mahasiswa, index) => (
                        <div
                          key={mahasiswa?.nim || index}
                          className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors"
                        >
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                            {mahasiswa?.full_name?.charAt(0) || "M"}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {mahasiswa?.full_name || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              NIM: {mahasiswa?.nim || "Unknown"}
                            </div>
                            {mahasiswa?.email && (
                              <div className="text-xs text-muted-foreground/60">
                                {mahasiswa.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedKelas(null)}
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => {
                    setSelectedKelas(null);
                    navigate(`/dosen/penilaian?kelas=${selectedKelas.id}`);
                  }}
                >
                  Buka Penilaian
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
