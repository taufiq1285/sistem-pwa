/**
 * KuisListPage (Tugas Praktikum)
 *
 * Purpose: Main task list page for Dosen (Tugas Praktikum)
 * Route: /dosen/kuis
 * Features: View all tasks, filter, search, create new task
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Grid3x3,
  List,
  Loader2,
  AlertCircle,
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

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load quizzes on mount
   */
  useEffect(() => {
    loadQuizzes();
  }, [user]);

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
  const loadQuizzes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters: KuisFilters = {};

      // Filter by dosen if user is dosen
      if (user?.dosen?.id) {
        filters.dosen_id = user.dosen.id;
      }

      const data = await getKuis(filters);
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
          quiz.deskripsi?.toLowerCase().includes(query)
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

  // Get unique kelas for filter
  const kelasOptions = Array.from(
    new Set(quizzes.map((q) => q.kelas_id))
  ).filter(Boolean);

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
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
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

  // ============================================================================
  // RENDER - ERROR
  // ============================================================================

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={loadQuizzes}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN
  // ============================================================================

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 mb-6 text-white">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full translate-y-24 -translate-x-24 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              📋 Daftar Tugas Praktikum
            </h1>
            <p className="text-blue-100 mt-2 max-w-xl">
              Kelola tugas praktikum untuk mahasiswa. Fitur ini bersifat
              opsional - buat hanya jika diperlukan untuk praktikum tertentu.
            </p>
            <div className="flex gap-3 mt-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 backdrop-blur-sm">
                📝 Pre-Test
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 backdrop-blur-sm">
                📊 Post-Test
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/20 backdrop-blur-sm">
                📄 Laporan
              </span>
            </div>
          </div>

          <Button
            onClick={handleCreateQuiz}
            size="lg"
            className="gap-2 bg-white text-blue-700 hover:bg-blue-50 shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Buat Tugas Baru
          </Button>
        </div>
      </div>

      {/* Filters & Controls */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari tugas praktikum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-full lg:w-[180px]">
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

          {/* Kelas Filter */}
          {kelasOptions.length > 0 && (
            <Select value={kelasFilter} onValueChange={setKelasFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {kelasOptions.map((kelasId) => (
                  <SelectItem key={kelasId} value={kelasId}>
                    Kelas {kelasId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View Mode Toggle */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <Grid3x3 className="h-4 w-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Task List/Grid */}
      {filteredQuizzes.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Tidak ada tugas praktikum
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || kelasFilter !== "all"
                  ? "Tidak ada tugas yang sesuai dengan filter"
                  : "Belum ada tugas praktikum yang dibuat"}
              </p>
            </div>
            {!searchQuery &&
              statusFilter === "all" &&
              kelasFilter === "all" && (
                <Button onClick={handleCreateQuiz} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Buat Tugas Pertama
                </Button>
              )}
          </div>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
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

      {/* Results Count */}
      {filteredQuizzes.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Menampilkan {filteredQuizzes.length} dari {quizzes.length} tugas
          praktikum
        </div>
      )}
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
