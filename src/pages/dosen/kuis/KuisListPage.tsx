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
import { supabase } from "@/lib/supabase/client";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "draft" | "active" | "ended";

// ============================================================================
// COMPONENT
// ============================================================================

export default function KuisListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
        console.log("[Dosen KuisList] 🔄 Debounced load executing...");
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
            console.log("[Dosen KuisList] Raw payload received:", payload);

            // Only refresh if this kuis belongs to current dosen
            const oldData = payload.old as any;
            const newData = payload.new as any;

            if ((oldData && oldData.dosen_id === user.dosen.id) ||
                (newData && newData.dosen_id === user.dosen.id)) {
              console.log("[Dosen KuisList] Kuis changed for current dosen, debounced refresh...");
              debouncedLoad(true);
            } else {
              console.log("[Dosen KuisList] Kuis changed but not for current dosen, ignoring");
            }
          },
        )
        .subscribe();

      console.log("[Dosen KuisList] ✅ Realtime subscription active for dosen:", user.dosen.id);
    }

    // ✅ CUSTOM EVENT LISTENER: Listen for immediate kuis changes from API calls
    // This ensures instant UI update when createKuis/updateKuis/deleteKuis is called
    const handleKuisChanged = (event: any) => {
      const { action, kuis, dosenId } = event.detail;
      console.log("[Dosen KuisList] 📢 Custom event received:", { action, kuisId: kuis?.id, dosenId });

      // Only refresh if this kuis belongs to current dosen
      if (dosenId === user?.dosen?.id) {
        console.log("[Dosen KuisList] 🔄 Refreshing after custom event (debounced)...");
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
        console.log("[Dosen KuisList] 📢 Cache updated event received:", key);
        console.log("[Dosen KuisList] 🔄 Reloading data with fresh cache (debounced)...");
        debouncedLoad(true); // Force refresh with debounce
      }
    };

    // Add event listeners
    window.addEventListener('kuis:changed', handleKuisChanged);
    window.addEventListener('cache:updated', handleCacheUpdated);

    // Cleanup subscription and event listeners on unmount
    return () => {
      // Clear debounce timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      if (subscription) {
        console.log("[Dosen KuisList] Cleaning up subscription");
        subscription.unsubscribe();
      }
      window.removeEventListener('kuis:changed', handleKuisChanged);
      window.removeEventListener('cache:updated', handleCacheUpdated);
    };
  }, [user]);

  /**
   * ✅ Force refresh on mount after creating kuis
   * This ensures fresh data is loaded instead of stale cache
   */
  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      // Force refresh on mount to get fresh data
      console.log("[Dosen KuisList] 🔁 Auto-refreshing on mount to ensure fresh data...");
      loadQuizzes(true);
    }, 800); // Wait for cache invalidation to complete

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
        console.log("[Dosen KuisList] 🔁 Force refresh - bypassing cacheAPI...");
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
      console.log("[Dosen KuisList] Data loaded:", data.length, "quizzes");
      data.forEach((quiz, index) => {
        console.log(`[Dosen KuisList] Quiz ${index + 1}:`, {
          id: quiz.id,
          judul: quiz.judul,
          status: quiz.status,
          created_at: quiz.created_at,
        });
      });

      // Check for potential duplicates (same title)
      const titles = data.map(q => q.judul);
      const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
      if (duplicates.length > 0) {
        console.warn("[Dosen KuisList] ⚠️ Potential duplicate quiz titles detected:", duplicates);
      }

      setQuizzes(data);
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

    // Kelas filter
    if (kelasFilter !== "all") {
      filtered = filtered.filter((quiz) => quiz.kelas_id === kelasFilter);
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

  // Get unique kelas for filter with full kelas data
  const kelasOptions = Array.from(
    new Map(
      quizzes.filter((q) => q.kelas).map((q) => [q.kelas_id, q.kelas]),
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
  // RENDER - LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-100">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-indigo-600" />
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Memuat daftar tugas praktikum...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - ERROR
  // ============================================================================

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-8">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive" className="border-2 shadow-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-base font-semibold">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => loadQuizzes(true)} className="font-semibold">
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN
  // ============================================================================

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Hero Header */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-linear-to-r from-blue-600 via-purple-600 to-indigo-700 p-10 text-white">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-40 translate-x-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full translate-y-32 -translate-x-32 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl">
                  📋
                </div>
                <h1 className="text-5xl font-extrabold">
                  Daftar Tugas Praktikum
                </h1>
              </div>
              <p className="text-xl font-semibold text-blue-100 mt-3 max-w-2xl">
                Kelola tugas praktikum untuk mahasiswa. Fitur ini bersifat
                opsional - buat hanya jika diperlukan untuk praktikum tertentu.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg">
                  📝 Pre-Test
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg">
                  📊 Post-Test
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-bold bg-white/20 backdrop-blur-sm border-2 border-white/30 shadow-lg">
                  📄 Laporan
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreateQuiz}
                size="lg"
                className="gap-3 bg-white text-blue-700 hover:bg-blue-50 shadow-xl font-bold text-lg px-8 py-6"
              >
                <Plus className="h-6 w-6" />
                Buat Tugas Baru
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters & Controls */}
        <Card className="border-0 shadow-xl bg-linear-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/20 backdrop-blur-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search - Enhanced */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                  <SelectValue placeholder="Filter Mata Kuliah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                  {kelasOptions.map((kelas: any, index: number) => {
                    const kelasValue = String(
                      kelas.kelas_id ??
                        kelas.id ??
                        kelas.mata_kuliah?.id ??
                        index,
                    );

                    return (
                      <SelectItem key={kelasValue} value={kelasValue}>
                        {kelas.mata_kuliah?.kode_mk} -{" "}
                        {kelas.mata_kuliah?.nama_mk} ({kelas.nama_kelas})
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
          <Card className="border-0 shadow-xl bg-linear-to-br from-gray-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 p-16">
            <div className="text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-linear-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-xl">
                <AlertCircle className="h-12 w-12 text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
                  Tidak ada tugas praktikum
                </h3>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {searchQuery ||
                  statusFilter !== "all" ||
                  kelasFilter !== "all"
                    ? "Tidak ada tugas yang sesuai dengan filter"
                    : "Belum ada tugas praktikum yang dibuat"}
                </p>
              </div>
              {!searchQuery &&
                statusFilter === "all" &&
                kelasFilter === "all" && (
                  <Button
                    onClick={handleCreateQuiz}
                    className="gap-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-6 shadow-xl text-lg"
                  >
                    <Plus className="h-5 w-5" />
                    Buat Tugas Pertama
                  </Button>
                )}
            </div>
          </Card>
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
          <div className="mt-8 text-center p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 border-gray-200 dark:border-slate-700 shadow-lg">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Menampilkan{" "}
              <span className="text-indigo-600 dark:text-indigo-400 font-black">
                {filteredQuizzes.length}
              </span>{" "}
              dari{" "}
              <span className="text-purple-600 dark:text-purple-400 font-black">
                {quizzes.length}
              </span>{" "}
              tugas praktikum
            </p>
          </div>
        )}
      </div>
    </div>
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
