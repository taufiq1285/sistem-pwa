/**
 * KuisListPage (Tugas Praktikum)
 *
 * Purpose: Main task list page for Dosen (Tugas Praktikum)
 * Route: /dosen/kuis
 * Features: View all tasks, filter, search, create new task
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import logger from "@/lib/utils/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuizCard } from "@/components/features/kuis/QuizCard";
import { useAuth } from "@/lib/hooks/useAuth";
import { getKuis } from "@/lib/api/kuis.api";
import type { Kuis, KuisFilters, UI_LABELS } from "@/types/kuis.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import {
  CardListSkeleton,
  ErrorFallback,
  EmptyState,
  OfflineAwareContent,
} from "@/components/common";
import { useOfflineContext } from "@/context/OfflineContext";
import { supabase } from "@/lib/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "draft" | "active" | "ended";
const CONTEXT_SEPARATOR = "::";

async function enrichQuizListStats(quizzes: Kuis[]): Promise<Kuis[]> {
  if (quizzes.length === 0) {
    return quizzes;
  }

  const quizIds = quizzes.map((quiz) => quiz.id);

  const [
    { data: soalRows, error: soalError },
    { data: attemptRows, error: attemptError },
  ] = await Promise.all([
    supabase.from("soal").select("id, kuis_id, poin").in("kuis_id", quizIds),
    supabase
      .from("attempt_kuis")
      .select(
        "id, kuis_id, status, total_poin, jawaban(poin_diperoleh, feedback)",
      )
      .in("kuis_id", quizIds),
  ]);

  if (soalError) {
    throw soalError;
  }

  if (attemptError) {
    throw attemptError;
  }

  const soalStats = new Map<string, { totalSoal: number; totalPoin: number }>();
  for (const row of soalRows || []) {
    const current = soalStats.get(row.kuis_id) || {
      totalSoal: 0,
      totalPoin: 0,
    };
    current.totalSoal += 1;
    current.totalPoin += row.poin || 0;
    soalStats.set(row.kuis_id, current);
  }

  const attemptStats = new Map<
    string,
    {
      totalAttempts: number;
      submittedCount: number;
      pendingReviewCount: number;
      gradedCount: number;
    }
  >();
  for (const row of (attemptRows || []) as any[]) {
    const current = attemptStats.get(row.kuis_id) || {
      totalAttempts: 0,
      submittedCount: 0,
      pendingReviewCount: 0,
      gradedCount: 0,
    };

    const hasReviewResult =
      row.status === "graded" ||
      row.total_poin != null ||
      (row.jawaban || []).some(
        (jawaban: any) =>
          jawaban.poin_diperoleh != null || Boolean(jawaban.feedback?.trim?.()),
      );

    if (row.status === "submitted" || row.status === "graded") {
      current.totalAttempts += 1;
      current.submittedCount += 1;
    }
    if (row.status === "submitted" && !hasReviewResult) {
      current.pendingReviewCount += 1;
    }
    if (hasReviewResult) {
      current.gradedCount += 1;
    }

    attemptStats.set(row.kuis_id, current);
  }

  return quizzes.map((quiz) => {
    const quizSoalStats = soalStats.get(quiz.id);
    const quizAttemptStats = attemptStats.get(quiz.id);

    return {
      ...quiz,
      total_soal: quizSoalStats?.totalSoal || 0,
      total_poin: quizSoalStats?.totalPoin || 0,
      total_attempts: quizAttemptStats?.totalAttempts || 0,
      submitted_count: quizAttemptStats?.submittedCount || 0,
      pending_review_count: quizAttemptStats?.pendingReviewCount || 0,
      graded_count: quizAttemptStats?.gradedCount || 0,
    } as Kuis;
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function KuisListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOffline } = useOfflineContext();

  // State
  const [quizzes, setQuizzes] = useState<Kuis[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Kuis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [kelasFilter, setKelasFilter] = useState<string>("all");

  // Debounce ref to prevent multiple rapid loads
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load quizzes on mount
   */
  useEffect(() => {
    loadQuizzes();

    // Debounced load function to prevent multiple rapid calls
    const debouncedLoad = (forceRefresh = false) => {
      // Clear existing timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      // Set new timeout (300ms debounce)
      loadTimeoutRef.current = setTimeout(() => {
        logger.debug("[Dosen KuisList] 🔄 Debounced load executing...");
        loadQuizzes(forceRefresh);
      }, 300);
    };

    // Set up realtime subscription for kuis changes
    let subscription: any = null;

    if (user?.dosen?.id) {
      subscription = supabase
        .channel("dosen-kuis-changes")
        .on(
          "postgres_changes",
          {
            event: "*", // INSERT, UPDATE, DELETE
            schema: "public",
            table: "kuis",
          },
          (payload) => {
            logger.debug("[Dosen KuisList] Raw payload received:", payload);

            // Only refresh if this kuis belongs to current dosen
            const oldData = payload.old as any;
            const newData = payload.new as any;

            if (
              (oldData && oldData.dosen_id === user.dosen.id) ||
              (newData && newData.dosen_id === user.dosen.id)
            ) {
              logger.debug(
                "[Dosen KuisList] Kuis changed for current dosen, debounced refresh...",
              );
              debouncedLoad(true);
            } else {
              logger.debug(
                "[Dosen KuisList] Kuis changed but not for current dosen, ignoring",
              );
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "attempt_kuis",
          },
          () => {
            logger.debug(
              "[Dosen KuisList] Attempt changed, refreshing quiz stats...",
            );
            debouncedLoad(true);
          },
        )
        .subscribe();

      logger.debug(
        "[Dosen KuisList] ✅ Realtime subscription active for dosen:",
        user.dosen.id,
      );
    }

    // ✅ CUSTOM EVENT LISTENER: Listen for immediate kuis changes from API calls
    // This ensures instant UI update when createKuis/updateKuis/deleteKuis is called
    const handleKuisChanged = (event: any) => {
      const { action, kuis, dosenId } = event.detail;
      logger.debug("[Dosen KuisList] 📢 Custom event received:", {
        action,
        kuisId: kuis?.id,
        dosenId,
      });

      // Only refresh if this kuis belongs to current dosen
      if (dosenId === user?.dosen?.id) {
        logger.debug(
          "[Dosen KuisList] 🔄 Refreshing after custom event (debounced)...",
        );
        debouncedLoad(true); // Force refresh with debounce
      }
    };

    // ✅ CACHE UPDATE LISTENER: Listen for background cache updates
    // When stale-while-revalidate completes, reload the data
    const handleCacheUpdated = (event: any) => {
      const { key } = event.detail;
      const cacheKey = `dosen_kuis_${user?.dosen?.id || "all"}`;

      // Only reload if this cache key is relevant
      if (key === cacheKey) {
        logger.debug("[Dosen KuisList] 📢 Cache updated event received:", key);
        logger.debug(
          "[Dosen KuisList] 🔄 Reloading data with fresh cache (debounced)...",
        );
        debouncedLoad(true); // Force refresh with debounce
      }
    };

    // Add event listeners
    window.addEventListener("kuis:changed", handleKuisChanged);
    window.addEventListener("cache:updated", handleCacheUpdated);

    // Cleanup subscription and event listeners on unmount
    return () => {
      // Clear debounce timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      if (subscription) {
        logger.debug("[Dosen KuisList] Cleaning up subscription");
        subscription.unsubscribe();
      }
      window.removeEventListener("kuis:changed", handleKuisChanged);
      window.removeEventListener("cache:updated", handleCacheUpdated);
    };
  }, [user]);

  /**
   * ✅ Force refresh on mount after creating kuis
   * This ensures fresh data is loaded instead of stale cache
   */
  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      // Force refresh on mount to get fresh data
      logger.debug(
        "[Dosen KuisList] 🔁 Auto-refreshing on mount to ensure fresh data...",
      );
      loadQuizzes(true);
    }, 300); // ✅ Dipercepat dari 800ms ke 300ms

    return () => clearTimeout(refreshTimer);
  }, [user?.dosen?.id]);

  /**
   * Apply filters when data or filters change
   */
  useEffect(() => {
    applyFilters();
  }, [quizzes, searchQuery, statusFilter, kelasFilter]);

  // ============================================================================
  // HANDLERS - DATA LOADING
  // ============================================================================

  /**
   * Load all quizzes
   */
  const loadQuizzes = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: KuisFilters = {};

      // Filter by dosen if user is dosen
      if (user?.dosen?.id) {
        filters.dosen_id = user.dosen.id;
      }

      // ✅ FIX: When forceRefresh, bypass cacheAPI completely to get FRESH data
      // This prevents stale cache after creating/updating/deleting kuis
      let data: Kuis[];
      if (forceRefresh) {
        logger.debug(
          "[Dosen KuisList] 🔁 Force refresh - bypassing cacheAPI...",
        );
        // Bypass cache, call API directly
        data = await getKuis(filters, { forceRefresh: true });
      } else {
        // Use cacheAPI with stale-while-revalidate for offline support
        data = await cacheAPI(
          `dosen_kuis_${user?.dosen?.id || "all"}`,
          () => getKuis(filters, { forceRefresh }),
          {
            ttl: 5 * 60 * 1000, // 5 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          },
        );
      }

      // ✅ DETAILED LOGGING: Log each quiz with ID and title to identify duplicates
      logger.debug("[Dosen KuisList] Data loaded:", data.length, "quizzes");
      data.forEach((quiz, index) => {
        logger.debug(`[Dosen KuisList] Quiz ${index + 1}:`, {
          id: quiz.id,
          judul: quiz.judul,
          status: quiz.status,
          created_at: quiz.created_at,
        });
      });

      // Check for potential duplicates (same title)
      const titles = data.map((q) => q.judul);
      const duplicates = titles.filter(
        (title, index) => titles.indexOf(title) !== index,
      );
      if (duplicates.length > 0) {
        logger.debug(
          "[Dosen KuisList] ⚠️ Potential duplicate quiz titles detected:",
          duplicates,
        );
      }

      const enrichedData = await enrichQuizListStats(data);
      setQuizzes(enrichedData);
    } catch (err: any) {
      setError(err.message || "Gagal memuat daftar tugas praktikum");
      toast.error("Gagal memuat daftar tugas praktikum", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply filters to quiz list
   */
  const applyFilters = () => {
    let filtered = [...quizzes];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (quiz) =>
          quiz.judul.toLowerCase().includes(query) ||
          quiz.deskripsi?.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((quiz) => {
        const status = getQuizStatusFromDates(quiz);
        return status === statusFilter;
      });
    }

    // Kelas + mata kuliah filter. The same class can contain multiple
    // mata kuliah, so kelas_id alone is not enough context.
    if (kelasFilter !== "all") {
      const [kelasId, mataKuliahId = "no-mk"] =
        kelasFilter.split(CONTEXT_SEPARATOR);
      filtered = filtered.filter((quiz) => {
        const quizMataKuliahId =
          quiz.mata_kuliah_id || quiz.mata_kuliah?.id || "no-mk";
        return quiz.kelas_id === kelasId && quizMataKuliahId === mataKuliahId;
      });
    }

    setFilteredQuizzes(filtered);
  };

  // ============================================================================
  // HANDLERS - NAVIGATION
  // ============================================================================

  /**
   * Navigate to create new quiz
   */
  const handleCreateQuiz = () => {
    navigate("/dosen/kuis/create");
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // Get unique kelas + mata kuliah contexts for filter.
  const kelasOptions = Array.from(
    new Map(
      quizzes
        .filter((q) => q.kelas)
        .map((q) => [
          `${q.kelas_id}${CONTEXT_SEPARATOR}${q.mata_kuliah_id || q.mata_kuliah?.id || "no-mk"}`,
          {
            value: `${q.kelas_id}${CONTEXT_SEPARATOR}${q.mata_kuliah_id || q.mata_kuliah?.id || "no-mk"}`,
            nama_kelas: q.kelas?.nama_kelas || "-",
            mata_kuliah: q.mata_kuliah || q.kelas?.mata_kuliah,
          },
        ]),
    ).values(),
  );

  // Count by status
  const statusCounts = {
    all: quizzes.length,
    draft: quizzes.filter((q) => getQuizStatusFromDates(q) === "draft").length,
    active: quizzes.filter((q) => getQuizStatusFromDates(q) === "active")
      .length,
    ended: quizzes.filter((q) => getQuizStatusFromDates(q) === "ended").length,
  };

  // ============================================================================
  // Loading state
  if (isLoading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
          <div className="space-y-2">
            <div className="h-8 w-48 skeleton-shimmer rounded-md" />
            <div className="h-4 w-72 skeleton-shimmer rounded-md" />
          </div>
        </div>
        <CardListSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return <ErrorFallback message={error} onRetry={() => loadQuizzes(true)} />;
  }

  // Offline state forced
  if (isOffline && !quizzes?.length) {
    return <EmptyState variant="offline" context="kuis" />;
  }

  // Empty state
  if (!quizzes?.length) {
    return (
      <EmptyState
        variant="no-data"
        context="kuis"
        actionLabel="Buat Tugas Pertama"
        onAction={handleCreateQuiz}
      />
    );
  }

  // ============================================================================
  // RENDER - MAIN
  // ============================================================================

  return (
    <OfflineAwareContent
      hasData={quizzes.length > 0}
      context="kuis"
      onSync={() => loadQuizzes(true)}
    >
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Daftar Tugas Praktikum
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola tugas praktikum untuk mahasiswa. Fitur ini bersifat
              opsional - buat hanya jika diperlukan untuk praktikum tertentu.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => loadQuizzes(true)}
              variant="outline"
              className="font-semibold"
              title="Refresh daftar tugas"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCreateQuiz}
              className="bg-linear-to-r from-primary to-accent text-primary-foreground font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Tugas Baru
            </Button>
          </div>
        </div>

        {/* Enhanced Filters & Controls */}
        <Card className="border-0 shadow-xl bg-linear-to-br from-white via-primary/5 to-accent/5 dark:from-slate-900 dark:via-primary/10 dark:to-accent/10 backdrop-blur-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search - Enhanced */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Cari tugas praktikum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 text-base font-semibold"
              />
            </div>

            {/* Status Filter - Enhanced */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-full lg:w-50 h-12 border-2 font-semibold">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua ({statusCounts.all})</SelectItem>
                <SelectItem value="draft">
                  Draft ({statusCounts.draft})
                </SelectItem>
                <SelectItem value="active">
                  Aktif ({statusCounts.active})
                </SelectItem>
                <SelectItem value="ended">
                  Diarsipkan ({statusCounts.ended})
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Kelas Filter - Enhanced */}
            {kelasOptions.length > 0 && (
              <Select value={kelasFilter} onValueChange={setKelasFilter}>
                <SelectTrigger className="w-full lg:w-70 h-12 border-2 font-semibold">
                  <SelectValue placeholder="Filter Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas & Mata Kuliah</SelectItem>
                  {kelasOptions.map((kelas: any) => {
                    const kelasValue = String(kelas.value);
                    return (
                      <SelectItem key={kelasValue} value={kelasValue}>
                        {kelas.nama_kelas}
                        {kelas.mata_kuliah?.nama_mk
                          ? ` - ${kelas.mata_kuliah.nama_mk}`
                          : ""}
                        {kelas.mata_kuliah?.kode_mk
                          ? ` - ${kelas.mata_kuliah.kode_mk}`
                          : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            {/* View Mode Toggle - Enhanced */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
            >
              <TabsList className="border-2 shadow-lg">
                <TabsTrigger value="grid" className="gap-2 font-semibold">
                  <Grid3x3 className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2 font-semibold">
                  <List className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>

        {/* Enhanced Task List/Grid */}
        {filteredQuizzes.length === 0 ? (
          <EmptyState
            variant="no-results"
            actionLabel="Reset Filter"
            onAction={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setKelasFilter("all");
            }}
          />
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-6",
            )}
          >
            {filteredQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                onUpdate={loadQuizzes}
                onDelete={loadQuizzes}
                compact={viewMode === "list"}
              />
            ))}
          </div>
        )}

        {/* Results Count - Enhanced */}
        {filteredQuizzes.length > 0 && (
          <div className="mt-8 text-center p-4 bg-white/50 dark:bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border/50 shadow-lg">
            <p className="text-base font-semibold text-muted-foreground">
              Menampilkan{" "}
              <span className="text-primary font-black">
                {filteredQuizzes.length}
              </span>{" "}
              dari{" "}
              <span className="text-accent font-black">{quizzes.length}</span>{" "}
              tugas praktikum
            </p>
          </div>
        )}
      </div>
    </OfflineAwareContent>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get quiz status (simplified - no date validation)
 * Status based only on publish state:
 * - draft: Belum dipublish
 * - active: Sudah dipublish (mahasiswa bisa akses)
 */
function getQuizStatusFromDates(quiz: Kuis): StatusFilter {
  const status = quiz.status || "draft";

  // Map database status to filter status
  if (status === "published") {
    return "active"; // Published quiz is active
  } else if (status === "draft") {
    return "draft";
  } else if (status === "archived") {
    return "ended";
  }

  return "draft"; // Default
}
