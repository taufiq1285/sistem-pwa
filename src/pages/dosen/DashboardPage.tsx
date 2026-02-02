import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { networkDetector } from "@/lib/offline/network-detector";
import { cacheAPI } from "@/lib/offline/api-cache";
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
  XCircle,
  AlertTriangle,
  Award,
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
  const [activeKuis, setActiveKuis] = useState<KuisWithStats[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<KelasWithStats | null>(
    null,
  );
  const [kelasMahasiswa, setKelasMahasiswa] = useState<any[]>([]);
  const [loadingMahasiswa, setLoadingMahasiswa] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasDataChanges, setHasDataChanges] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (user?.id) {
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
              filter: `dosen_id=eq.${user.id}`,
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
                  (oldData && (oldData as any).dosen_id === user.id) ||
                  (newData && (newData as any).dosen_id === user.id)
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
      setActiveKuis([]);
    }
  }, [user?.id]);

  // Fetch assignments yang diberikan admin kepada dosen ini
  const fetchAssignments = async (forceRefresh = false) => {
    try {
      if (!user?.id) {
        setAssignments([]);
        return;
      }

      // Use cacheAPI for assignments with offline support
      const assignmentsData = await cacheAPI(
        `dosen_assignments_${user?.id}`,
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
            .eq("dosen_id", user.id)
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

      // Fetch assignments juga
      await fetchAssignments(forceRefresh);

      console.log("📞 Calling dashboard APIs with caching...");
      // Use cacheAPI with stale-while-revalidate for offline support
      const [statsData, kelasData, practicumData, gradingData, kuisData] =
        await Promise.all([
          cacheAPI(`dosen_stats_${user?.id}`, () => getDosenStats(), {
            ttl: 10 * 60 * 1000, // 10 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(`dosen_kelas_${user?.id}`, () => getMyKelas(5), {
            ttl: 10 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(
            `dosen_practicum_${user?.id}`,
            () => getUpcomingPracticum(5),
            {
              ttl: 5 * 60 * 1000, // 5 minutes (schedule changes frequently)
              forceRefresh,
              staleWhileRevalidate: true,
            },
          ),
          cacheAPI(`dosen_grading_${user?.id}`, () => getPendingGrading(5), {
            ttl: 5 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          cacheAPI(`dosen_kuis_${user?.id}`, () => getActiveKuis(20), {
            ttl: 5 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          }),
        ]);

      setStats(statsData);
      setMyKelas(kelasData || []);
      setUpcomingPracticum(practicumData || []);
      setPendingGrading(gradingData || []);
      setActiveKuis(kuisData || []);

      console.log("✅ Dashboard data loaded successfully");
    } catch (err) {
      // Handle offline mode gracefully
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - showing cached dashboard data");
        setError(null); // Don't show error in offline mode
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
          mahasiswa:nim(
            nim,
            full_name,
            email,
            phone
          )
        `,
        )
        .eq("kelas_id", kelasId);

      if (error) throw error;
      setKelasMahasiswa(
        data?.map((item) => (item as any).mahasiswa).filter(Boolean) || [],
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                      Dashboard Dosen
                    </h1>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-1">
                      Selamat datang,{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {user?.full_name || user?.email}
                      </span>
                    </p>
                  </div>
                  {hasDataChanges && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-100 to-amber-100 text-orange-900 rounded-full text-sm font-bold border-2 border-orange-300 shadow-lg">
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse"></div>
                      Data diperbarui
                    </div>
                  )}
                </div>
                {lastRefresh && (
                  <p className="text-base font-semibold text-gray-500 dark:text-gray-400 ml-1">
                    Terakhir diperbarui:{" "}
                    {lastRefresh.toLocaleTimeString("id-ID")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isRefreshing && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Memperbarui data...</span>
                  </div>
                )}
                {hasDataChanges && !isRefreshing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasDataChanges(false);
                      setIsRefreshing(true);
                      fetchDashboardData().finally(() => {
                        setIsRefreshing(false);
                        setLastRefresh(new Date());
                      });
                    }}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 font-semibold border-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Perbarui
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsRefreshing(true);
                    setHasDataChanges(false); // Clear change indicator on manual refresh
                    fetchDashboardData().finally(() => {
                      setIsRefreshing(false);
                      setLastRefresh(new Date());
                    });
                  }}
                  disabled={loading || isRefreshing}
                  className="font-semibold border-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 shadow-lg"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Quick Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-0 shadow-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm font-semibold mb-1">
                        Total Assignment
                      </p>
                      <p className="text-4xl font-extrabold">
                        {assignments.length}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Users className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-linear-to-br from-blue-500 to-cyan-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-semibold mb-1">
                        Jadwal Minggu Ini
                      </p>
                      <p className="text-4xl font-extrabold">
                        {upcomingPracticum.length}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Calendar className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-linear-to-br from-orange-500 to-amber-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-semibold mb-1">
                        Perlu Dinilai
                      </p>
                      <p className="text-4xl font-extrabold">
                        {pendingGrading.length}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Edit className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-linear-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-semibold mb-1">
                        Kuis Aktif
                      </p>
                      <p className="text-4xl font-extrabold">
                        {activeKuis.length}
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Target className="h-7 w-7" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Welcome Banner */}
            {assignments.length > 0 && (
              <Card className="border-0 shadow-xl bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-white/10" />
                <CardContent className="p-8 relative">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="h-10 w-10" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-extrabold mb-2">
                        Selamat Mengajar! 👨‍🏫
                      </h2>
                      <p className="text-lg font-semibold text-indigo-100">
                        Kamu memiliki{" "}
                        <span className="font-extrabold text-white">
                          {assignments.length} assignment
                        </span>{" "}
                        dengan{" "}
                        <span className="font-extrabold text-white">
                          {assignments.reduce(
                            (sum, a) => sum + a.total_mahasiswa,
                            0,
                          )}{" "}
                          mahasiswa
                        </span>
                        . Semua berjalan lancar!
                      </p>
                    </div>
                    <div className="hidden md:block">
                      <Award className="h-24 w-24 text-white/20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Assignment Saya */}
              <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2.5 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100">
                          Assignment Diberikan
                        </CardTitle>
                      </div>
                      <CardDescription className="text-base font-semibold text-gray-700 dark:text-gray-400">
                        {assignments.length} assignment dengan{" "}
                        {assignments.reduce(
                          (sum, a) => sum + a.total_mahasiswa,
                          0,
                        )}{" "}
                        mahasiswa
                      </CardDescription>
                    </div>
                    {assignments.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dosen/jadwal")}
                        className="hover:bg-blue-100 font-semibold"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Kelola Jadwal
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                        <Users className="h-12 w-12 text-blue-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-2">
                        Belum ada assignment yang diberikan
                      </p>
                      <p className="text-base font-medium text-gray-600">
                        Hubungi admin untuk penugasan assignment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map((assignment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-4 border-2 border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
                          onClick={() => navigate("/dosen/jadwal")}
                        >
                          <div className="shrink-0">
                            <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <BookOpen className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base text-gray-900">
                                {assignment.mata_kuliah.nama_mk}
                              </h4>
                              <Badge
                                variant="secondary"
                                className="text-sm bg-blue-100 text-blue-700 font-semibold"
                              >
                                {assignment.mata_kuliah.kode_mk}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold text-gray-700 mt-1">
                              {assignment.kelas.nama_kelas} •{" "}
                              {assignment.kelas.tahun_ajaran}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm font-bold text-blue-600">
                                <Users className="h-3 w-3 mr-1" />
                                {assignment.total_mahasiswa} mahasiswa
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                <Calendar className="h-3 w-3 mr-1" />
                                {assignment.total_jadwal} jadwal
                              </span>
                              <span className="text-sm font-semibold text-gray-500">
                                {assignment.kelas.semester_ajaran} semester
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Jadwal Mengajar */}
              <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2.5 bg-linear-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg shadow-purple-500/30">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold text-purple-900 dark:text-purple-100">
                          Jadwal Mengajar
                        </CardTitle>
                      </div>
                      <CardDescription className="text-base font-semibold text-gray-700 dark:text-gray-400">
                        Praktikum 7 hari ke depan
                      </CardDescription>
                    </div>
                    {upcomingPracticum.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dosen/jadwal")}
                        className="hover:bg-purple-100 font-semibold"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat Semua
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {upcomingPracticum.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex p-4 bg-purple-50 rounded-full mb-4">
                        <Calendar className="h-12 w-12 text-purple-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-2">
                        Tidak ada jadwal minggu ini
                      </p>
                      <p className="text-base font-medium text-gray-600">
                        Jadwal praktikum akan muncul di sini
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingPracticum.map((jadwal) => (
                        <div
                          key={jadwal.id}
                          className="flex gap-3 p-4 border-2 border-purple-100 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
                        >
                          <div className="shrink-0">
                            <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Calendar className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base truncate text-gray-900">
                              {jadwal.mata_kuliah_nama}
                            </h4>
                            <p className="text-sm font-semibold text-gray-700 mt-1">
                              {jadwal.kelas_nama} • {jadwal.topik}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm font-bold text-purple-600">
                                <Clock className="h-3 w-3 mr-1" />
                                {dayNames[jadwal.hari.toLowerCase()] ||
                                  jadwal.hari}
                                , {formatDate(jadwal.tanggal_praktikum)}
                              </span>
                              <span className="text-sm font-bold text-purple-600">
                                {formatTime(jadwal.jam_mulai)} -{" "}
                                {formatTime(jadwal.jam_selesai)}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-600">
                              📍 {jadwal.lab_nama}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Menunggu Penilaian */}
              <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2.5 bg-linear-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/30">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold text-orange-900 dark:text-orange-100">
                          Menunggu Penilaian
                        </CardTitle>
                      </div>
                      <CardDescription className="text-base font-semibold text-gray-700 dark:text-gray-400">
                        {stats?.pendingGrading || 0} tugas perlu dinilai
                      </CardDescription>
                    </div>
                    {pendingGrading.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dosen/penilaian")}
                        className="hover:bg-orange-100 font-semibold"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat Semua
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {pendingGrading.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex p-4 bg-green-50 rounded-full mb-4">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-2">
                        Semua tugas sudah dinilai
                      </p>
                      <p className="text-base font-medium text-gray-600">
                        Kerja bagus! 🎉
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingGrading.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-4 border-2 border-orange-100 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
                          onClick={() =>
                            navigate(`/dosen/penilaian?task=${item.id}`)
                          }
                        >
                          <div className="shrink-0">
                            <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Edit className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base truncate text-gray-900">
                              {item.mahasiswa_nama}
                            </h4>
                            <p className="text-sm font-semibold text-gray-600 mt-0.5">
                              NIM: {item.mahasiswa_nim}
                            </p>
                            <p className="text-sm font-semibold text-gray-600 mt-0.5">
                              {item.mata_kuliah_nama} • {item.kuis_judul}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm text-orange-600 font-bold">
                                Attempt #{item.attempt_number}
                              </span>
                              <span className="text-sm text-gray-400">
                                📅 {formatDate(item.submitted_at)}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tugas Aktif */}
              <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-xl bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2.5 bg-linear-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/30">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                          Tugas Aktif
                        </CardTitle>
                      </div>
                      <CardDescription className="text-base font-semibold text-gray-700 dark:text-gray-400">
                        {stats?.activeKuis || 0} kuis sedang berjalan
                      </CardDescription>
                    </div>
                    {activeKuis.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dosen/kuis")}
                        className="hover:bg-indigo-100 font-semibold"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Kelola
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  {activeKuis.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex p-4 bg-indigo-50 rounded-full mb-4">
                        <XCircle className="h-12 w-12 text-indigo-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-2">
                        Tidak ada tugas aktif
                      </p>
                      <p className="text-base font-medium text-gray-600">
                        Buat tugas baru untuk memulai kembali
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeKuis.map((kuis) => (
                        <div
                          key={kuis.id}
                          className="flex items-center gap-3 p-4 border-2 border-indigo-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
                          onClick={() => navigate(`/dosen/kuis/${kuis.id}`)}
                        >
                          <div className="shrink-0">
                            <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-base truncate text-gray-900">
                                {kuis.judul}
                              </h4>
                              <Badge
                                variant="outline"
                                className={
                                  kuis.status === "published"
                                    ? "bg-green-100 text-green-700 border-green-300 font-bold"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-300 font-bold"
                                }
                              >
                                {kuis.status === "published" ? "✅ Published" : "📝 Draft"}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold text-gray-700 mt-1">
                              {kuis.kelas_nama}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm font-bold text-indigo-600">
                                ⏰ {formatDate(kuis.tanggal_mulai)} -{" "}
                                {formatDate(kuis.tanggal_selesai)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm font-bold text-green-600">
                                ✅ {kuis.submitted_count}/{kuis.total_attempts}
                              </span>
                              <span className="text-sm font-semibold text-gray-600">
                                Dikumpulkan
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedKelas.mata_kuliah_nama || "Praktikum"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedKelas.nama_kelas}
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {selectedKelas.kode_kelas}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedKelas.totalMahasiswa}
                    </div>
                    <div className="text-sm text-gray-500">Mahasiswa</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700">
                      Tahun Ajaran
                    </div>
                    <div className="text-gray-900">
                      {selectedKelas.tahun_ajaran}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-700">Semester</div>
                    <div className="text-gray-900">
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
                        className="h-12 bg-gray-200 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : kelasMahasiswa.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      Belum ada mahasiswa terdaftar
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {kelasMahasiswa.map((mahasiswa, index) => (
                        <div
                          key={mahasiswa?.nim || index}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                            {mahasiswa?.full_name?.charAt(0) || "M"}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {mahasiswa?.full_name || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500">
                              NIM: {mahasiswa?.nim || "Unknown"}
                            </div>
                            {mahasiswa?.email && (
                              <div className="text-xs text-gray-400">
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
                  Lihat Penilaian
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
