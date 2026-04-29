/**
 * KuisListPage - Mahasiswa (Tugas Praktikum)
 *
 * Purpose: Display list of available tasks for students
 * Route: /mahasiswa/kuis
 * Features: Filter by status, search, task cards, start task, view results
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileQuestion,
  Clock,
  Calendar,
  Trophy,
  Search,
  Play,
  Eye,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer,
  Upload,
  RefreshCw,
  WifiOff,
} from "lucide-react";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// API & Hooks
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getUpcomingQuizzes,
  getAttempts,
  getOfflineAttemptSummariesForMahasiswa,
  syncPendingOfflineQuizSubmissions,
} from "@/lib/api/kuis.api";
import type { UpcomingQuiz } from "@/types/kuis.types";
import { toast } from "sonner";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";
import { supabase } from "@/lib/supabase/client";

// Utils
import { cn } from "@/lib/utils";

type QuizStatus =
  | "all"
  | "upcoming"
  | "ongoing"
  | "completed"
  | "missed"
  | "history";

type TaskKind = "tes" | "laporan" | "tugas";

function detectTaskKind(quiz: UpcomingQuiz): TaskKind {
  if (quiz.tipe_kuis === "essay") return "laporan";
  if (quiz.tipe_kuis === "pilihan_ganda") return "tes";

  const judul = quiz.judul?.toLowerCase() || "";

  // Fallback lama untuk data yang belum punya tipe_kuis
  const durasi = quiz.durasi_menit;
  if (durasi == null || durasi <= 0) return "laporan";

  // Backward-compatible keyword detection
  if (judul.includes("laporan") || judul.includes("report")) return "laporan";
  if (judul.includes("test") || judul.includes("tes") || judul.includes("kuis"))
    return "tes";

  return "tugas";
}

/**
 * Hitung sisa waktu hingga tanggal_selesai
 * Returns: string seperti "2 hari 3 jam" atau null jika sudah lewat
 */
function getDeadlineCountdown(tanggalSelesai: string): string | null {
  const end = new Date(tanggalSelesai).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} hari ${hours} jam lagi`;
  if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
  return `${minutes} menit lagi`;
}

export default function KuisListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState<UpcomingQuiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<UpcomingQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuizStatus>("all");
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const quizzesCacheKey = user?.mahasiswa?.id
    ? `mahasiswa_kuis_${user.mahasiswa.id}`
    : null;

  const applyOfflineAttemptOverrides = async (
    items: UpcomingQuiz[],
  ): Promise<UpcomingQuiz[]> => {
    if (!user?.mahasiswa?.id || items.length === 0) {
      return items;
    }

    const offlineAttempts = await getOfflineAttemptSummariesForMahasiswa(
      user.mahasiswa.id,
    );

    return items.map((quiz) => {
      const relatedAttempts = offlineAttempts.filter(
        (attempt) => attempt.kuis_id === quiz.id,
      );
      const latestAttempt = offlineAttempts
        .filter((attempt) => attempt.kuis_id === quiz.id)
        .sort((a, b) => {
          const aTime =
            a.offline_submitted_at ||
            a.submitted_at ||
            a.updated_at ||
            a.started_at ||
            "";
          const bTime =
            b.offline_submitted_at ||
            b.submitted_at ||
            b.updated_at ||
            b.started_at ||
            "";
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        })[0];

      if (!latestAttempt) {
        return quiz;
      }

      const bestOfflineScore =
        relatedAttempts.length > 0
          ? Math.max(
              ...relatedAttempts.map((attempt) =>
                typeof attempt.nilai_akhir === "number"
                  ? attempt.nilai_akhir
                  : (attempt.total_poin ?? 0),
              ),
            )
          : quiz.best_score;

      if (
        latestAttempt.offline_submit_pending ||
        latestAttempt.status === "submitted" ||
        latestAttempt.status === "graded"
      ) {
        return {
          ...quiz,
          status: "completed",
          can_attempt: false,
          best_score:
            typeof bestOfflineScore === "number"
              ? bestOfflineScore
              : quiz.best_score,
          last_attempt_at:
            latestAttempt.offline_submitted_at ||
            latestAttempt.submitted_at ||
            latestAttempt.started_at ||
            quiz.last_attempt_at,
        };
      }

      return {
        ...quiz,
        best_score:
          typeof bestOfflineScore === "number"
            ? bestOfflineScore
            : quiz.best_score,
      };
    });
  };

  useEffect(() => {
    if (user?.mahasiswa?.id) loadQuizzes();

    // Set up realtime subscription for kuis changes
    let subscription: any = null;

    if (user?.mahasiswa?.id) {
      subscription = supabase
        .channel("mahasiswa-kuis-changes")
        .on(
          "postgres_changes",
          {
            event: "*", // INSERT, UPDATE, DELETE
            schema: "public",
            table: "kuis",
          },
          (payload) => {
            console.log("[KuisList] Kuis changed, refreshing...", payload);
            // Force refresh to ensure we get the latest data
            loadQuizzes(true);
          },
        )
        .subscribe();
    }

    const handleKuisChanged = () => {
      loadQuizzes(true);
    };

    window.addEventListener("kuis:changed", handleKuisChanged);

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      window.removeEventListener("kuis:changed", handleKuisChanged);
    };
  }, [user?.mahasiswa?.id]);

  useEffect(() => {
    applyFilters();
  }, [quizzes, searchQuery, statusFilter]);

  useEffect(() => {
    if (!quizzesCacheKey) {
      return;
    }

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: UpcomingQuiz[];
      }>;

      if (customEvent.detail?.key !== quizzesCacheKey) {
        return;
      }

      const nextQuizzes = customEvent.detail?.data;
      if (!Array.isArray(nextQuizzes)) {
        return;
      }

      applyOfflineAttemptOverrides(nextQuizzes).then((updatedQuizzes) => {
        setQuizzes(updatedQuizzes);
        setIsOfflineData(false);
        setLastUpdatedAt(Date.now());
      });
    };

    window.addEventListener("cache:updated", handleCacheUpdated);
    return () =>
      window.removeEventListener("cache:updated", handleCacheUpdated);
  }, [quizzesCacheKey]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (
      status &&
      ["all", "upcoming", "ongoing", "completed", "missed", "history"].includes(
        status,
      )
    ) {
      setStatusFilter(
        status === "completed" || status === "missed"
          ? "history"
          : (status as QuizStatus),
      );
    }
  }, [searchParams]);

  const loadQuizzes = async (forceRefresh = false) => {
    if (!user?.mahasiswa?.id || !quizzesCacheKey) {
      setError("Data mahasiswa tidak ditemukan");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        await syncPendingOfflineQuizSubmissions(user.mahasiswa.id);
      }

      const shouldUseCachedSnapshot = !forceRefresh || !navigator.onLine;
      const cachedQuizzesEntry = shouldUseCachedSnapshot
        ? await getCachedData<UpcomingQuiz[]>(quizzesCacheKey)
        : null;
      const cachedQuizzes = Array.isArray(cachedQuizzesEntry?.data)
        ? cachedQuizzesEntry.data
        : [];

      if (shouldUseCachedSnapshot && cachedQuizzes.length > 0) {
        setQuizzes(await applyOfflineAttemptOverrides(cachedQuizzes));
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(cachedQuizzesEntry?.timestamp || null);
        setIsLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          cachedQuizzes.length > 0
            ? "Perangkat sedang offline. Menampilkan daftar tugas praktikum tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada daftar tugas praktikum tersimpan.",
        );
      }

      // Use cacheAPI with stale-while-revalidate for offline support
      const data = await cacheAPI(
        quizzesCacheKey,
        () => getUpcomingQuizzes(user.mahasiswa.id),
        {
          ttl: 5 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );
      setQuizzes(await applyOfflineAttemptOverrides(data));
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
      console.log("[KuisList] Data loaded:", data.length, "quizzes");
    } catch (err: any) {
      const errorMessage =
        err?.message || "Gagal memuat daftar tugas praktikum";
      setError(errorMessage);
      if (!navigator.onLine && quizzes.length > 0) {
        setIsOfflineData(true);
      } else {
        toast.error("Gagal memuat tugas praktikum", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...quizzes];
    if (statusFilter !== "all") {
      filtered = filtered.filter((quiz) =>
        statusFilter === "history"
          ? quiz.status === "completed" || quiz.status === "missed"
          : quiz.status === statusFilter,
      );
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (quiz) =>
          quiz.judul.toLowerCase().includes(query) ||
          quiz.nama_mk.toLowerCase().includes(query) ||
          quiz.kode_mk.toLowerCase().includes(query) ||
          quiz.nama_kelas.toLowerCase().includes(query),
      );
    }
    setFilteredQuizzes(filtered);
  };

  const handleStartQuiz = (quizId: string) =>
    navigate(`/mahasiswa/kuis/${quizId}/attempt`);
  const handleViewResults = async (quizId: string) => {
    if (!user?.mahasiswa?.id) {
      toast.error("Data mahasiswa tidak ditemukan");
      return;
    }

    try {
      const offlineAttempts = await getOfflineAttemptSummariesForMahasiswa(
        user.mahasiswa.id,
      );

      let candidateAttempts = offlineAttempts.filter(
        (attempt) => attempt.kuis_id === quizId,
      );

      if (navigator.onLine) {
        const onlineAttempts = await getAttempts({
          kuis_id: quizId,
          mahasiswa_id: user.mahasiswa.id,
        });

        candidateAttempts = [...onlineAttempts, ...candidateAttempts];
      }

      const latestAttempt = candidateAttempts
        .filter(
          (attempt) =>
            attempt.status === "submitted" ||
            attempt.status === "graded" ||
            attempt.offline_submit_pending,
        )
        .sort((a, b) => {
          const aTime =
            a.offline_submitted_at ||
            a.submitted_at ||
            a.updated_at ||
            a.started_at ||
            "";
          const bTime =
            b.offline_submitted_at ||
            b.submitted_at ||
            b.updated_at ||
            b.started_at ||
            "";
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        })[0];

      if (!latestAttempt?.id) {
        toast.warning("Hasil tugas belum ditemukan. Membuka halaman tugas...");
        navigate(`/mahasiswa/kuis/${quizId}/attempt`);
        return;
      }

      navigate(`/mahasiswa/kuis/${quizId}/result/${latestAttempt.id}`);
    } catch (error) {
      console.error("Failed to open quiz result:", error);
      toast.error("Gagal membuka hasil tugas");
      navigate(`/mahasiswa/kuis/${quizId}/attempt`);
    }
  };
  const handleStatusChange = (status: QuizStatus) => {
    setStatusFilter(status);
    setSearchParams({ status });
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, "info" | "success" | "offline" | "error"> =
      {
        upcoming: "info",
        ongoing: "success",
        completed: "offline",
        missed: "error",
      };
    const labels: Record<string, string> = {
      upcoming: "Belum Dimulai",
      ongoing: "Sedang Berlangsung",
      completed: "Selesai",
      missed: "Terlewat",
    };
    return (
      <StatusBadge
        status={statusMap[status] || "info"}
        pulse={status === "ongoing"}
        dot={true}
      >
        {labels[status] || status}
      </StatusBadge>
    );
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      upcoming: <Clock className="h-4 w-4 text-primary" />,
      ongoing: <Play className="h-4 w-4 text-success" />,
      completed: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
      missed: <XCircle className="h-4 w-4 text-danger" />,
    };
    return (
      icons[status as keyof typeof icons] || (
        <FileQuestion className="h-4 w-4" />
      )
    );
  };

  const getCountByStatus = (status: QuizStatus): number => {
    if (status === "all") return quizzes.length;
    if (status === "history") {
      return quizzes.filter(
        (q) => q.status === "completed" || q.status === "missed",
      ).length;
    }
    return quizzes.filter((q) => q.status === status).length;
  };

  const QuizCard = ({ quiz }: { quiz: UpcomingQuiz }) => {
    const canStart = quiz.status === "ongoing" && quiz.can_attempt;
    const isCompleted = quiz.status === "completed";
    const hasBestScore = typeof quiz.best_score === "number";
    const hasAttemptHistory = (quiz.attempts_used || 0) > 0;
    const canViewResult =
      hasAttemptHistory && (isCompleted || !quiz.can_attempt || hasBestScore);
    const isPassed =
      hasBestScore && quiz.best_score! >= (quiz.passing_score || 0);

    const taskKind = detectTaskKind(quiz);
    const isLaporan = taskKind === "laporan";
    const isTes = taskKind === "tes";

    // Get type label
    const getTypeLabel = () => {
      if (isTes) return "CBT";
      if (isLaporan) return "LAPORAN";
      return "TUGAS";
    };

    const formatDuration = (): string => {
      const durasi = quiz.durasi_menit;
      if (durasi == null || durasi <= 0) return "Tanpa timer";
      return `${durasi} menit`;
    };

    const getDeadlineLabel = (): string => {
      if (!quiz.tanggal_selesai) return "Batas akhir fleksibel";

      return `Batas akhir: ${formatDate(quiz.tanggal_selesai)}`;
    };

    const typeConfig = isLaporan
      ? {
          cardClass:
            "border border-amber-300/70 bg-[#2f2b27] text-white shadow-[0_18px_40px_-24px_rgba(245,158,11,0.35)]",
          strip: "bg-gradient-to-r from-amber-700 via-amber-500 to-amber-200",
          chip: "border border-amber-300 bg-[#fff2d8] text-amber-900",
          summary:
            "border border-amber-300 bg-gradient-to-r from-[#f6e6ca] to-[#f3e5d5] text-amber-900",
          surface: "border-white/10 bg-[#24211d]",
          meta: "text-amber-50/78",
          action: "bg-warning hover:bg-warning/90 text-white",
          ghostButton:
            "border-white/10 bg-white/5 text-amber-50 hover:bg-white/10 hover:text-white",
        }
      : {
          cardClass:
            "border border-blue-300/80 bg-[#2f2f2b] text-white shadow-[0_18px_40px_-24px_rgba(59,130,246,0.35)]",
          strip: "bg-gradient-to-r from-blue-800 via-blue-500 to-blue-300",
          chip: "border border-blue-200 bg-blue-50 text-blue-800",
          summary:
            "border border-blue-200 bg-gradient-to-r from-[#d7e9fb] to-[#cfe2f7] text-blue-900",
          surface: "border-white/10 bg-[#262823]",
          meta: "text-white/72",
          action: "bg-primary hover:bg-primary/90 text-primary-foreground",
          ghostButton:
            "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white",
        };

    return (
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
          typeConfig.cardClass,
        )}
      >
        <div className={cn("absolute inset-x-0 top-0 h-[3px]", typeConfig.strip)} />
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                {getStatusBadge(quiz.status)}
                <Badge
                  variant="outline"
                  className={cn("border px-2.5 py-1 font-semibold", typeConfig.chip)}
                >
                  {getTypeLabel()}
                </Badge>
              </div>
              <CardTitle className="mb-1 text-lg leading-tight text-white">
                {quiz.judul}
              </CardTitle>
              <CardDescription className={cn("text-sm", typeConfig.meta)}>
                {quiz.kode_mk} - {quiz.nama_mk}
                {quiz.nama_kelas && ` • ${quiz.nama_kelas}`}
              </CardDescription>
              {quiz.dosen_name && (
                <p className={cn("mt-1 text-xs font-medium", typeConfig.meta)}>
                  Dosen: {quiz.dosen_name}
                </p>
              )}
              {/* Label tipe penilaian */}
              <p
                className={cn(
                  "mt-3 rounded-xl px-3.5 py-2 text-xs font-medium shadow-sm",
                  isLaporan
                    ? "border border-amber-300 bg-gradient-to-r from-[#f6e6ca] to-[#f3e5d5] text-amber-900"
                    : "border border-blue-200 bg-gradient-to-r from-[#d7e9fb] to-[#cfe2f7] text-blue-900",
                )}
              >
                {isLaporan
                  ? "📄 Laporan • Dinilai Manual oleh Dosen"
                  : "🖥️ CBT • Nilai Otomatis oleh Sistem"}
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-white/10 p-2.5">
              {getStatusIcon(quiz.status)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className={cn("rounded-xl border px-3 py-2.5", typeConfig.surface)}>
              <div className={cn("flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider", typeConfig.meta)}>
                <Timer className="h-3.5 w-3.5" />
                {isLaporan ? "Rentang tugas" : "Durasi CBT"}
              </div>
              <p className="mt-1 font-semibold text-white">{formatDuration()}</p>
            </div>
            <div className={cn("rounded-xl border px-3 py-2.5", typeConfig.surface)}>
              <div className={cn("flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider", typeConfig.meta)}>
                <FileQuestion className="h-3.5 w-3.5" />
                Soal
              </div>
              <p className="mt-1 font-semibold text-white">{quiz.total_soal} soal</p>
            </div>
            <div className={cn("rounded-xl border px-3 py-2.5", typeConfig.surface)}>
              <div className={cn("flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider", typeConfig.meta)}>
                <Calendar className="h-3.5 w-3.5" />
                Mulai
              </div>
              <p className="mt-1 text-xs font-semibold text-white">
                {formatDate(quiz.tanggal_mulai)}
              </p>
            </div>
            <div className={cn("rounded-xl border px-3 py-2.5", typeConfig.surface)}>
              <div
                className={cn(
                  "flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider",
                  quiz.status === "ongoing" && quiz.tanggal_selesai
                    ? "text-warning"
                    : typeConfig.meta,
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                Batas akhir
              </div>
              <p
                className={cn(
                  "mt-1 text-xs font-semibold",
                  quiz.status === "ongoing" && quiz.tanggal_selesai
                    ? "text-warning"
                    : "text-white",
                )}
              >
                {getDeadlineLabel()}
              </p>
            </div>
          </div>

          {/* HIDDEN: Attempts info (not used - all quiz = 1 attempt) */}
          {/* {!isLaporan && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
              <span className="text-muted-foreground">Percobaan</span>
              <span className="font-semibold">
                {quiz.attempts_used} / {quiz.max_attempts}
              </span>
            </div>
          )} */}

          {/* For LAPORAN, show submission status */}
          {isLaporan && (
            <div className="flex items-center justify-between rounded-xl border border-amber-300/40 bg-amber-50/10 p-3 text-sm">
              <span className="font-medium text-amber-200">Status</span>
              <span className="font-semibold text-amber-100">
                {quiz.status === "completed"
                  ? "Sudah Dikirim"
                  : "Belum Dikirim"}
              </span>
            </div>
          )}

          {hasBestScore && (
            <div
              className={cn(
                "flex items-center justify-between p-3 rounded-lg text-sm",
                isPassed
                  ? "bg-success/5 border border-success/30"
                  : "bg-danger/5 border border-danger/30",
              )}
            >
              <div className="flex items-center gap-2">
                <Trophy
                  className={cn(
                    "h-4 w-4",
                    isPassed ? "text-emerald-300" : "text-rose-300",
                  )}
                />
                <span className="font-medium">
                  {isLaporan ? "Nilai Laporan" : "Nilai Terbaik"}
                </span>
              </div>
              <span
                className={cn(
                  "font-bold text-lg",
                  isPassed ? "text-emerald-300" : "text-rose-300",
                )}
              >
                {quiz.best_score}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {/* LAPORAN: If completed (submitted), show "Lihat Hasil", otherwise show "Kirim Laporan" */}
            {isLaporan ? (
              quiz.status === "completed" ? (
                <Button
                  variant="outline"
                  onClick={() => handleViewResults(quiz.id)}
                  className={cn("min-h-10 flex-1 gap-2", typeConfig.ghostButton)}
                >
                  <Eye className="h-4 w-4" />
                  Lihat Hasil
                </Button>
              ) : canStart ? (
                <Button
                  onClick={() => handleStartQuiz(quiz.id)}
                  className={cn("min-h-10 flex-1 gap-2", typeConfig.action)}
                >
                  <Upload className="h-4 w-4" />
                  Kirim Laporan
                </Button>
              ) : null
            ) : (
              <>
                {/* TES/TUGAS: Original logic */}
                {canStart && (
                  <Button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className={cn("min-h-10 flex-1 gap-2", typeConfig.action)}
                  >
                    <Play className="h-4 w-4" />
                    {quiz.attempts_used > 0 ? "Lanjutkan CBT" : "Mulai CBT"}
                  </Button>
                )}
                {canViewResult && (
                  <Button
                    variant="outline"
                    onClick={() => handleViewResults(quiz.id)}
                    className={cn("min-h-10 flex-1 gap-2", typeConfig.ghostButton)}
                  >
                    <Eye className="h-4 w-4" />
                    Lihat Hasil
                  </Button>
                )}
              </>
            )}
            {quiz.status === "upcoming" && (
              <Button
                variant="outline"
                disabled
                className={cn("min-h-10 flex-1", typeConfig.ghostButton)}
              >
                <Clock className="h-4 w-4 mr-2" />
                Belum Dimulai
              </Button>
            )}
            {quiz.status === "missed" && (
              <Button
                variant="outline"
                disabled
                className="min-h-10 flex-1 border-rose-400/30 bg-rose-500/10 text-rose-200"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Terlewat
              </Button>
            )}
            {quiz.status === "ongoing" &&
              !quiz.can_attempt &&
              !canViewResult && (
                <Button
                  variant="outline"
                  disabled
                  className={cn("min-h-10 flex-1", typeConfig.ghostButton)}
                >
                  Percobaan Habis
                </Button>
              )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">
              Memuat daftar tugas praktikum...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => loadQuizzes(true)}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  const lastUpdatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {(isOfflineData || !navigator.onLine) && (
        <Alert className="border-warning/40 bg-warning/10">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Mode Offline</AlertTitle>
          <AlertDescription>
            Daftar tugas praktikum sedang menggunakan snapshot lokal dari
            perangkat.
            {lastUpdatedLabel
              ? ` Pembaruan terakhir: ${lastUpdatedLabel}.`
              : ""}
          </AlertDescription>
        </Alert>
      )}
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-primary via-primary/90 to-accent/85 p-8 text-primary-foreground">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full translate-y-24 -translate-x-24 blur-2xl" />

        <div className="relative flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              📋 Tugas Praktikum
            </h1>
            <p className="text-primary-foreground/80 mt-2 max-w-xl">
              Kerjakan tugas praktikum sesuai jadwal yang tersedia. Perhatikan
              batas waktu pengerjaan!
            </p>
            <div className="flex gap-3 mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 backdrop-blur-sm border border-white/30">
                🧪 TES - Pilihan Ganda
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 backdrop-blur-sm border border-white/30">
                📄 LAPORAN - Upload File
              </span>
            </div>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={() => loadQuizzes(true)}
            variant="secondary"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            title="Refresh daftar tugas"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            status: "upcoming" as const,
            label: "Akan Datang",
            Icon: Clock,
            iconWrap: "bg-primary/10",
            iconColor: "text-primary",
          },
          {
            status: "ongoing" as const,
            label: "Berlangsung",
            Icon: Play,
            iconWrap: "bg-success/10",
            iconColor: "text-success",
          },
          {
            status: "history" as const,
            label: "Riwayat",
            Icon: CheckCircle2,
            iconWrap: "bg-muted/60",
            iconColor: "text-muted-foreground",
          },
        ].map(({ status, label, Icon, iconWrap, iconColor }) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", iconWrap)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">
                    {getCountByStatus(status)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari tugas praktikum, mata kuliah, atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs
              value={statusFilter}
              onValueChange={(v) => handleStatusChange(v as QuizStatus)}
            >
              <TabsList>
                <TabsTrigger value="all">
                  Semua ({getCountByStatus("all")})
                </TabsTrigger>
                <TabsTrigger value="upcoming">Akan Datang</TabsTrigger>
                <TabsTrigger value="ongoing">Berlangsung</TabsTrigger>
                <TabsTrigger value="history">
                  Riwayat ({getCountByStatus("history")})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-muted rounded-full">
                  <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Tidak Ada Tugas</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Tidak ada tugas praktikum yang sesuai dengan pencarian Anda"
                    : statusFilter === "all"
                      ? "Belum ada tugas praktikum yang tersedia"
                      : statusFilter === "history"
                        ? "Belum ada tugas praktikum yang masuk riwayat"
                        : `Tidak ada tugas praktikum dengan status "${statusFilter}"`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
