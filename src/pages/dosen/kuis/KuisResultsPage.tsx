/**
 * KuisResultsPage (Tugas Praktikum) - FIXED VERSION
 *
 * Purpose: Task results and analytics page for Dosen
 * Route: /dosen/kuis/:kuisId/results
 * Features: View statistics, student attempts, scores, question analysis, auto-sync nilai
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 *
 * FIXES APPLIED:
 * 1. Changed getAttemptByKuis to getAttemptsByKuis
 * 2. Changed all attempt.nilai to attempt.total_poin
 * 3. Changed all attempt.waktu_mulai to attempt.started_at
 * 4. Changed all attempt.waktu_selesai to attempt.submitted_at
 * 5. Changed all status === 'completed' to status === 'graded'
 * 6. Removed unused FileText import
 * 7. Updated all UI labels for "Tugas Praktikum"
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Award,
  Clock,
  Download,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";
import logger from "@/lib/utils/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
// FIXED: Changed import
import {
  getAttemptById,
  getKuisById,
  getAttemptsByKuis,
  gradeAnswer,
  finalizeAttemptGrading,
} from "@/lib/api/kuis.api";
import type { AttemptKuis, Kuis } from "@/types/kuis.types";
import type { AttemptWithStudent } from "@/lib/api/kuis.api";
import { syncNilaiPraktikumFromAttempts } from "@/lib/api/nilai.api";
import { notifyMahasiswaTugasGraded } from "@/lib/api/notification.api";
import { openLaporanFileInNewTab } from "@/lib/api/laporan-storage.api";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CardListSkeleton } from "@/components/common";
import {
  checkAnswerCorrect,
  getAnswerLabel,
  getCorrectAnswerLabel,
} from "@/lib/utils/quiz-scoring";

// ============================================================================
// TYPES
// ============================================================================

interface QuizStatistics {
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  averageTime: number; // in minutes
}

interface GradingState {
  [jawabanId: string]: {
    poin_diperoleh: number;
    feedback: string;
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function KuisResultsPage() {
  const { kuisId } = useParams<{ kuisId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedAttemptId = searchParams.get("attempt");

  // State
  const [quiz, setQuiz] = useState<Kuis | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithStudent[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<
    AttemptWithStudent[]
  >([]);
  const [statistics, setStatistics] = useState<QuizStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptKuis | null>(
    null,
  );
  const [selectedCbtAttemptId, setSelectedCbtAttemptId] = useState<
    string | null
  >(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewGradingState, setReviewGradingState] = useState<GradingState>(
    {},
  );

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Check if quiz is CBT (auto-graded: pilihan_ganda, benar_salah, jawaban_singkat)
   */
  const isAutoGradedQuiz = (quizData: Kuis | null): boolean => {
    if (!quizData?.soal || quizData.soal.length === 0) return false;

    // ✅ DEBUG: Log soal types for troubleshooting
    logger.debug("🔍 [isAutoGradedQuiz] Checking quiz:", {
      judul: quizData.judul,
      soal_count: quizData.soal.length,
      soal_types: quizData.soal.map((s: any) => ({
        tipe_soal: s.tipe_soal,
        tipe: s.tipe,
      })),
    });

    // ✅ FIX: Check both database field "tipe" and TypeScript "tipe_soal"
    const result = quizData.soal.every((s: any) => {
      const tipe = s.tipe_soal || s.tipe; // Support both field names
      return (
        tipe === "pilihan_ganda" ||
        tipe === "benar_salah" ||
        tipe === "jawaban_singkat"
      );
    });

    logger.debug("✅ [isAutoGradedQuiz] Result:", result);
    return result;
  };

  /**
   * Detect laporan mode from structured data, not from free-text title.
   */
  const isLaporanQuiz = (quizData: Kuis | null): boolean => {
    if (!quizData) return false;

    if (quizData.tipe_kuis === "essay") {
      return true;
    }

    if (!quizData.soal || quizData.soal.length === 0) {
      return false;
    }

    return quizData.soal.every((s: any) => {
      const tipe = s.tipe_soal || s.tipe;
      return tipe === "file_upload";
    });
  };

  /**
   * Calculate duration between two dates
   */
  const calculateDuration = (start: string, end: string): string => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / 1000 / 60);

    if (minutes < 60) {
      return `${minutes} menit`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}j ${remainingMinutes}m`;
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load quiz and attempts on mount
   */
  useEffect(() => {
    if (!kuisId) return;
    loadQuizData();
  }, [kuisId]);

  /**
   * Apply search filter
   */
  useEffect(() => {
    applySearch();
  }, [attempts, searchQuery]);

  useEffect(() => {
    if (
      !isLaporanQuiz(quiz) ||
      filteredAttempts.length === 0 ||
      reviewLoading
    ) {
      return;
    }

    const stillExists = filteredAttempts.some(
      (attempt) => attempt.id === selectedAttempt?.id,
    );

    if (stillExists) {
      return;
    }

    const preferredAttempt =
      filteredAttempts.find(
        (attempt) =>
          attempt.status === "submitted" || attempt.status === "graded",
      ) || filteredAttempts[0];

    void handleOpenLaporanReview(preferredAttempt.id, true);
  }, [filteredAttempts, quiz, reviewLoading]);

  useEffect(() => {
    if (!isAutoGradedQuiz(quiz) || filteredAttempts.length === 0) {
      return;
    }

    const stillExists = filteredAttempts.some(
      (attempt) => attempt.id === selectedCbtAttemptId,
    );

    if (stillExists) {
      return;
    }

    setSelectedCbtAttemptId(filteredAttempts[0].id);
  }, [filteredAttempts, quiz, selectedCbtAttemptId]);

  useEffect(() => {
    if (!requestedAttemptId || !quiz || filteredAttempts.length === 0) {
      return;
    }

    const matchedAttempt = filteredAttempts.find(
      (attempt) => attempt.id === requestedAttemptId,
    );

    if (!matchedAttempt) {
      return;
    }

    if (isLaporanQuiz(quiz)) {
      void handleOpenLaporanReview(requestedAttemptId, true);
    } else {
      setSelectedCbtAttemptId(requestedAttemptId);
      setActiveTab("overview");
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("attempt");
    setSearchParams(nextParams, { replace: true });
  }, [
    requestedAttemptId,
    quiz,
    filteredAttempts,
    searchParams,
    setSearchParams,
  ]);

  // ============================================================================
  // HANDLERS - DATA LOADING
  // ============================================================================

  /**
   * Load quiz and attempts data
   */
  const loadQuizData = async () => {
    if (!kuisId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load quiz
      const quizData = await getKuisById(kuisId);
      setQuiz(quizData);

      // FIXED: Changed function name
      const attemptsData = await getAttemptsByKuis(kuisId);
      setAttempts(attemptsData);

      // Calculate statistics
      const stats = calculateStatistics(attemptsData, quizData);
      setStatistics(stats);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data hasil tugas praktikum");
      toast.error("Gagal memuat data hasil tugas praktikum", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply search filter
   */
  const applySearch = () => {
    if (!searchQuery) {
      setFilteredAttempts(attempts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = attempts.filter(
      (attempt) =>
        attempt.mahasiswa?.user?.full_name.toLowerCase().includes(query) ||
        attempt.mahasiswa?.nim.toLowerCase().includes(query),
    );

    setFilteredAttempts(filtered);
  };

  // ============================================================================
  // HANDLERS - ACTIONS
  // ============================================================================

  /**
   * View individual attempt
   */
  const handleViewAttempt = (attemptId: string) => {
    if (!laporanMode) {
      setSelectedCbtAttemptId(attemptId);
      setActiveTab("overview");
      return;
    }

    void handleOpenLaporanReview(attemptId, true);
  };

  const handleOpenLaporanReview = async (
    attemptId: string,
    forceOpen: boolean = false,
  ) => {
    if (!forceOpen && selectedAttempt?.id === attemptId) {
      setSelectedAttempt(null);
      setReviewGradingState({});
      return;
    }

    setReviewLoading(true);

    try {
      const attemptDetail = await getAttemptById(attemptId);
      setSelectedAttempt(attemptDetail);

      const initialGrading: GradingState = {};
      attemptDetail.jawaban?.forEach((jawaban) => {
        initialGrading[jawaban.id] = {
          poin_diperoleh: jawaban.poin_diperoleh || 0,
          feedback: jawaban.feedback || "",
        };
      });
      setReviewGradingState(initialGrading);
    } catch (err: any) {
      toast.error("Gagal memuat detail laporan", {
        description: err.message,
      });
      setSelectedAttempt(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewGradeChange = (
    jawabanId: string,
    field: "poin_diperoleh" | "feedback",
    value: number | string,
  ) => {
    setReviewGradingState((prev) => ({
      ...prev,
      [jawabanId]: {
        ...prev[jawabanId],
        [field]: value,
      },
    }));
  };

  const calculateReviewTotalScore = () => {
    if (!selectedAttempt?.jawaban) return 0;

    return selectedAttempt.jawaban.reduce((sum, jawaban) => {
      const grading = reviewGradingState[jawaban.id];
      return sum + (grading?.poin_diperoleh || jawaban.poin_diperoleh || 0);
    }, 0);
  };

  const getSelectedAttemptSoal = (soalId: string) => {
    return (
      selectedAttempt?.kuis?.soal?.find((soal) => soal.id === soalId) || null
    );
  };

  const getReviewJawabanForSoal = (soal: any) => {
    const exactMatch =
      selectedAttempt?.jawaban?.find((item) => item.soal_id === soal.id) ||
      null;

    if (exactMatch) {
      return exactMatch;
    }

    const tipeSoal = (soal as any)?.tipe_soal || (soal as any)?.tipe;
    if (tipeSoal !== "file_upload" || !selectedAttempt?.jawaban?.length) {
      return null;
    }

    // Fallback untuk data lama / soal yang pernah diganti:
    // cari kiriman file yang masih ada tetapi soal_id lama sudah tidak cocok lagi.
    const currentSoalIds = new Set(
      (selectedAttempt.kuis?.soal || []).map((currentSoal) => currentSoal.id),
    );

    return (
      selectedAttempt.jawaban.find((item) => {
        const hasFile = Boolean(getResolvedReviewFileSubmission(item).url);
        const soalMasihAda = item.soal_id
          ? currentSoalIds.has(item.soal_id)
          : false;
        return hasFile && !soalMasihAda;
      }) || null
    );
  };

  const getResolvedReviewFileSubmission = (jawaban: any) => {
    if (!jawaban) {
      return { url: null, name: "File laporan", type: "", size: 0 };
    }

    // Urutan prioritas:
    // 1. file_url (field khusus upload laporan)
    // 2. jawaban_mahasiswa (bisa berisi signed URL / public URL / storage path)
    // 3. jawaban (alias backward compatibility)
    const url =
      jawaban?.file_url ||
      (typeof jawaban?.jawaban_mahasiswa === "string" &&
      jawaban.jawaban_mahasiswa.trim()
        ? jawaban.jawaban_mahasiswa
        : null) ||
      (typeof jawaban?.jawaban === "string" && jawaban.jawaban.trim()
        ? jawaban.jawaban
        : null);

    // Nama file: dari file_name, atau ekstrak dari URL
    const derivedName = url
      ? decodeURIComponent(url.split("/").pop()?.split("?")[0] || "").replace(
          /^\d+_/,
          "",
        ) || // Hapus timestamp prefix
        "File laporan"
      : "File laporan";

    return {
      url,
      name: jawaban?.file_name || derivedName,
      type: jawaban?.file_type || "",
      size: jawaban?.file_size || 0,
    };
  };

  const attemptHasUploadedFile = (
    attempt: AttemptWithStudent | AttemptKuis | null,
  ) => {
    if (!attempt?.jawaban || attempt.jawaban.length === 0) {
      return false;
    }

    return attempt.jawaban.some((jawaban) =>
      Boolean(getResolvedReviewFileSubmission(jawaban).url),
    );
  };

  const attemptHasReviewResult = (
    attempt: AttemptWithStudent | AttemptKuis | null,
  ) => {
    if (!attempt) return false;

    if (attempt.status === "graded") return true;
    if (attempt.total_poin !== null && attempt.total_poin !== undefined) {
      return true;
    }

    return (attempt.jawaban || []).some(
      (jawaban: any) =>
        (jawaban?.poin_diperoleh !== null &&
          jawaban?.poin_diperoleh !== undefined) ||
        Boolean(jawaban?.feedback?.trim?.()),
    );
  };

  const handleOpenReviewFile = async (jawaban: any) => {
    const submission = getResolvedReviewFileSubmission(jawaban);

    if (!submission.url) {
      toast.error("File laporan belum tersedia.", {
        description:
          "Mahasiswa belum mengupload file atau URL file tidak ditemukan.",
      });
      return;
    }

    // Resolve URL — re-generate signed URL jika expired
    try {
      await openLaporanFileInNewTab({
        fileUrl: submission.url,
        fileType: submission.type,
        fileName: submission.name,
      });
    } catch (err: any) {
      console.error("[KuisResultsPage] handleOpenReviewFile error:", err);
      toast.error("Gagal membuka file laporan.", {
        description: err.message,
      });
    }
  };

  const handleSaveLaporanReview = async () => {
    if (!selectedAttempt?.jawaban) return;

    if (!navigator.onLine) {
      toast.error("Penilaian laporan membutuhkan koneksi internet.");
      return;
    }

    setReviewSaving(true);

    try {
      let hasReviewedAnswer = false;

      for (const jawaban of selectedAttempt.jawaban) {
        const grading = reviewGradingState[jawaban.id];
        if (!grading) continue;

        hasReviewedAnswer = true;

        const poinDiperoleh = grading.poin_diperoleh;
        const maxPoin = getSelectedAttemptSoal(jawaban.soal_id)?.poin || 0;

        await gradeAnswer(
          jawaban.id,
          poinDiperoleh,
          poinDiperoleh === maxPoin,
          grading.feedback,
        );
      }

      const scoreAfterSave = calculateReviewTotalScore();

      // Pastikan halaman hasil mahasiswa tidak tetap membaca status lama
      // ketika notifikasi nilai sudah terkirim.
      const finalizedAttempt = await finalizeAttemptGrading(selectedAttempt.id);

      if (!hasReviewedAnswer) {
        logger.debug(
          "[KuisResultsPage] Laporan disimpan tanpa jawaban yang digrade, attempt tetap dipaksa graded:",
          selectedAttempt.id,
        );
      }

      if (selectedAttempt.kuis?.kelas_id) {
        await syncNilaiPraktikumFromAttempts(
          selectedAttempt.mahasiswa_id,
          selectedAttempt.kuis.kelas_id,
          selectedAttempt.kuis.mata_kuliah_id ?? null,
        );
      }

      if (finalizedAttempt.status === "graded") {
        const { data: mahasiswaData, error: mahasiswaError } = await supabase
          .from("mahasiswa")
          .select("user_id")
          .eq("id", selectedAttempt.mahasiswa_id)
          .single();

        if (mahasiswaError) {
          throw mahasiswaError;
        }

        if (mahasiswaData?.user_id) {
          await notifyMahasiswaTugasGraded(
            mahasiswaData.user_id,
            selectedAttempt.kuis?.judul || "Laporan Praktikum",
            scoreAfterSave,
            selectedAttempt.id,
            selectedAttempt.kuis_id,
            selectedAttempt.kuis?.tipe_kuis ?? null,
          );
        }
      } else {
        logger.debug(
          "[KuisResultsPage] Notification skipped because attempt is not graded yet:",
          finalizedAttempt.id,
          finalizedAttempt.status,
        );
      }

      const refreshedAttempt = await getAttemptById(finalizedAttempt.id);
      setSelectedAttempt(refreshedAttempt);
      setAttempts((prev) =>
        prev.map((attempt) =>
          attempt.id === refreshedAttempt.id
            ? ({ ...attempt, ...refreshedAttempt } as AttemptWithStudent)
            : attempt,
        ),
      );

      const refreshedGrading: GradingState = {};
      refreshedAttempt.jawaban?.forEach((jawaban) => {
        refreshedGrading[jawaban.id] = {
          poin_diperoleh: jawaban.poin_diperoleh || 0,
          feedback: jawaban.feedback || "",
        };
      });
      setReviewGradingState(refreshedGrading);

      await loadQuizData();
      window.dispatchEvent(
        new CustomEvent("kuis:changed", {
          detail: {
            action: "attempt-graded",
            kuis: selectedAttempt.kuis,
            dosenId: selectedAttempt.kuis?.dosen_id,
          },
        }),
      );
      toast.success("Penilaian laporan berhasil disimpan");
    } catch (err: any) {
      toast.error("Gagal menyimpan penilaian laporan", {
        description: err.message,
      });
    } finally {
      setReviewSaving(false);
    }
  };

  /**
   * Export results to CSV
   */
  const handleExport = () => {
    try {
      const csvContent = [
        [
          "NIM",
          "Nama",
          "Percobaan",
          "Nilai",
          "Status",
          "Waktu Mulai",
          "Waktu Selesai",
        ].join(","),
        ...filteredAttempts.map((attempt) =>
          [
            attempt.mahasiswa.nim,
            attempt.mahasiswa.user.full_name,
            attempt.attempt_number,
            // FIXED: Changed nilai to total_poin
            attempt.total_poin ?? 0,
            attempt.status,
            // FIXED: Changed waktu_mulai to started_at
            new Date(attempt.started_at).toLocaleString(),
            // FIXED: Changed waktu_selesai to submitted_at
            attempt.submitted_at
              ? new Date(attempt.submitted_at).toLocaleString()
              : "-",
          ].join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hasil-tugas-${quiz?.judul || "quiz"}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Hasil tugas praktikum berhasil diexport");
    } catch (error) {
      toast.error("Gagal export hasil tugas praktikum");
    }
  };

  /**
   * Navigate back
   */
  const handleBack = () => {
    navigate("/dosen/kuis");
  };

  const getLaporanUploadBadge = (attempt: AttemptWithStudent) => {
    if (attemptHasUploadedFile(attempt)) {
      return (
        <StatusBadge status="success" pulse={false}>
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Sudah Upload
        </StatusBadge>
      );
    }

    return (
      <StatusBadge status="offline" pulse={false}>
        <Clock className="mr-1 h-3 w-3" />
        Belum Upload
      </StatusBadge>
    );
  };

  const getLaporanReviewBadge = (attempt: AttemptWithStudent) => {
    const hasUploadedFile = attemptHasUploadedFile(attempt);

    if (attemptHasReviewResult(attempt)) {
      return (
        <StatusBadge status="success" pulse={false}>
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Sudah Dinilai
        </StatusBadge>
      );
    }

    if (attempt.status === "submitted" && hasUploadedFile) {
      return (
        <StatusBadge status="warning" pulse={false}>
          <Clock className="mr-1 h-3 w-3" />
          Menunggu Penilaian
        </StatusBadge>
      );
    }

    return (
      <StatusBadge status="info" pulse={false}>
        <AlertCircle className="mr-1 h-3 w-3" />
        Belum Ada Kiriman
      </StatusBadge>
    );
  };

  // ============================================================================
  // RENDER - LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell rounded-2xl p-5">
          <div className="h-20 w-full skeleton-shimmer rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-[96px] skeleton-shimmer rounded-xl" />
          <div className="h-[96px] skeleton-shimmer rounded-xl" />
          <div className="h-[96px] skeleton-shimmer rounded-xl" />
          <div className="h-[96px] skeleton-shimmer rounded-xl" />
        </div>
        <CardListSkeleton count={4} />
      </div>
    );
  }

  // ============================================================================
  // RENDER - ERROR
  // ============================================================================

  if (error || !quiz || !statistics) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell flex items-center justify-between rounded-2xl p-5">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        <Alert variant="destructive" className="rounded-2xl border-2 shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Gagal memuat data hasil tugas praktikum"}
          </AlertDescription>
        </Alert>

        <div>
          <Button onClick={loadQuizData}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN
  // ============================================================================

  const laporanMode = isLaporanQuiz(quiz);
  const selectedCbtAttempt =
    filteredAttempts.find((attempt) => attempt.id === selectedCbtAttemptId) ||
    filteredAttempts[0] ||
    null;
  const selectedCbtScorePercentage = selectedCbtAttempt
    ? getAttemptPercentage(selectedCbtAttempt, quiz)
    : 0;
  const selectedCbtPassed = selectedCbtAttempt
    ? isAttemptPassed(selectedCbtAttempt, quiz)
    : false;
  const selectedCbtSummary = getAttemptAutoGradedSummary(
    selectedCbtAttempt,
    quiz,
  );
  const selectedCbtCorrectCount = selectedCbtSummary.correctCount;
  const selectedCbtTotalPoin =
    (selectedCbtAttempt?.total_poin || 0) > 0
      ? selectedCbtAttempt?.total_poin || 0
      : selectedCbtSummary.totalPoin;
  const selectedCbtQuestionCount = quiz?.soal?.length || 0;
  const selectedCbtWrongCount = Math.max(
    selectedCbtQuestionCount - selectedCbtCorrectCount,
    0,
  );

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{quiz.judul}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hasil & Analisis Tugas Praktikum
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {laporanMode ? (
          // LAPORAN MODE: Show submission status
          <>
            {/* Total Submissions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Submission
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalAttempts}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics.completedAttempts} mahasiswa
                </p>
              </CardContent>
            </Card>

            {/* Sudah Upload */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Sudah Upload
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {statistics.completedAttempts}
                </div>
                <p className="text-xs text-muted-foreground">
                  Laporan diterima
                </p>
              </CardContent>
            </Card>

            {/* Belum Upload */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Belum Upload
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {statistics.totalAttempts - statistics.completedAttempts}
                </div>
                <p className="text-xs text-muted-foreground">
                  Menunggu submission
                </p>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Tingkat Penyelesaian
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalAttempts > 0
                    ? (
                        (statistics.completedAttempts /
                          statistics.totalAttempts) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
                <Progress
                  value={
                    statistics.totalAttempts > 0
                      ? (statistics.completedAttempts /
                          statistics.totalAttempts) *
                        100
                      : 0
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          // CBT MODE: Show score statistics
          <>
            {/* Total Students */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Peserta
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalAttempts}
                </div>
                <p className="text-xs text-muted-foreground">
                  {statistics.completedAttempts} sudah mengerjakan
                </p>
              </CardContent>
            </Card>

            {/* Average Score */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Rata-rata Skor
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.averageScore.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  berbasis total poin kuis
                </p>
                <Progress value={statistics.averageScore} className="mt-1" />
              </CardContent>
            </Card>

            {/* Highest Score */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Skor Tertinggi
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {statistics.highestScore.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Terendah: {statistics.lowestScore.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            {/* Pass Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Tingkat Kelulusan
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.passRate.toFixed(0)}%
                </div>
                <Progress value={statistics.passRate} className="mt-2" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {isAutoGradedQuiz(quiz) && (
        <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="border border-border/60 bg-white/95 shadow-xl dark:bg-card">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>Daftar Mahasiswa</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pilih mahasiswa untuk melihat ringkasan nilai otomatis dan
                  rincian hasil CBT di panel kanan.
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari mahasiswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredAttempts.length === 0 ? (
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Tidak ada hasil yang sesuai."
                      : "Belum ada mahasiswa yang mengerjakan tugas ini."}
                  </p>
                </div>
              ) : (
                filteredAttempts.map((attempt) => {
                  const isSelected = selectedCbtAttempt?.id === attempt.id;
                  const isPassed = isAttemptPassed(attempt, quiz);
                  const scorePercentage = getAttemptPercentage(attempt, quiz);

                  return (
                    <button
                      key={attempt.id}
                      type="button"
                      onClick={() => setSelectedCbtAttemptId(attempt.id)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="mt-0.5">
                          <AvatarFallback>
                            {attempt.mahasiswa?.user?.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "M"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div>
                            <p className="truncate font-medium">
                              {attempt.mahasiswa?.user?.full_name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {attempt.mahasiswa?.nim || "-"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge
                              status={isPassed ? "success" : "error"}
                              pulse={false}
                            >
                              {isPassed ? "Lulus" : "Tidak Lulus"}
                            </StatusBadge>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span>
                              {attempt.submitted_at && attempt.started_at
                                ? calculateDuration(
                                    attempt.started_at,
                                    attempt.submitted_at,
                                  )
                                : "-"}
                            </span>
                            <span className="font-semibold text-foreground">
                              {scorePercentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border border-primary/20 bg-white/95 shadow-xl dark:bg-card">
            <CardHeader className="space-y-2">
              <div>
                <CardTitle>Panel Review Hasil CBT</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Nilai CBT dihitung otomatis. Panel ini dipakai untuk meninjau
                  hasil mahasiswa dan membuka detail lengkap bila diperlukan.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCbtAttempt ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                  <div className="max-w-md space-y-3">
                    <Award className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      Belum ada mahasiswa yang dipilih
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pilih satu mahasiswa dari panel kiri untuk melihat hasil
                      otomatis dan ringkasan CBT.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Informasi Mahasiswa
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="font-semibold">
                          {selectedCbtAttempt.mahasiswa?.user?.full_name ||
                            "Unknown"}
                        </p>
                        <p className="text-muted-foreground">
                          NIM: {selectedCbtAttempt.mahasiswa?.nim || "-"}
                        </p>
                        <div className="pt-2">
                          <StatusBadge
                            status={selectedCbtPassed ? "success" : "error"}
                            pulse={false}
                          >
                            {selectedCbtPassed ? "Lulus" : "Tidak Lulus"}
                          </StatusBadge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Ringkasan Hasil
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-3xl font-bold">
                          {selectedCbtTotalPoin}
                        </p>
                        <p className="text-muted-foreground">
                          dari {getQuizMaxPoin(quiz)} poin
                        </p>
                        <Progress
                          value={selectedCbtScorePercentage}
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Jawaban Otomatis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Benar</span>
                          <span className="font-semibold text-success">
                            {selectedCbtCorrectCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Salah</span>
                          <span className="font-semibold text-destructive">
                            {selectedCbtWrongCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Durasi</span>
                          <span className="font-medium">
                            {selectedCbtAttempt.submitted_at &&
                            selectedCbtAttempt.started_at
                              ? calculateDuration(
                                  selectedCbtAttempt.started_at,
                                  selectedCbtAttempt.submitted_at,
                                )
                              : "-"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="rounded-2xl border border-info/25 bg-info/8 px-4 py-3 text-sm text-info">
                    Nilai CBT dihitung otomatis oleh sistem berdasarkan jawaban
                    benar dan salah. Rincian per soal sekarang bisa ditinjau
                    langsung di panel ini tanpa pindah halaman.
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-card/80">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          Rincian Per Soal
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Review jawaban mahasiswa terhadap kunci jawaban
                          langsung dari halaman hasil CBT.
                        </p>
                      </div>
                      <div className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {quiz?.soal?.length || 0} soal
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(quiz?.soal || []).map((soal: any, index) => {
                        const normalizedSoal = {
                          ...soal,
                          tipe_soal: soal?.tipe_soal || soal?.tipe,
                          opsi_jawaban:
                            soal?.opsi_jawaban || soal?.pilihan_jawaban || null,
                        };
                        const jawaban = (
                          selectedCbtAttempt?.jawaban || []
                        ).find(
                          (item: any) => item?.soal_id === normalizedSoal.id,
                        );
                        const jawabanMahasiswa =
                          jawaban?.jawaban ?? jawaban?.jawaban_mahasiswa ?? "";
                        const isCorrect =
                          typeof jawaban?.is_correct === "boolean"
                            ? jawaban.is_correct
                            : checkAnswerCorrect(
                                normalizedSoal,
                                jawabanMahasiswa,
                              );

                        return (
                          <div
                            key={normalizedSoal.id}
                            className="rounded-xl border border-border/60 bg-background/80 px-4 py-3"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1 space-y-2">
                                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                  <div className="space-y-1">
                                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                                      {normalizedSoal.pertanyaan}
                                    </p>
                                    {normalizedSoal.penjelasan && (
                                      <p className="line-clamp-1 text-xs text-muted-foreground">
                                        {normalizedSoal.penjelasan}
                                      </p>
                                    )}
                                  </div>

                                  <span
                                    className={cn(
                                      "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
                                      isCorrect
                                        ? "bg-success/10 text-success"
                                        : "bg-destructive/10 text-destructive",
                                    )}
                                  >
                                    {isCorrect ? "Benar" : "Salah"}
                                  </span>
                                </div>

                                <div className="grid gap-2 md:grid-cols-2">
                                  <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      Jawaban
                                    </p>
                                    <p className="mt-1 line-clamp-1 text-sm font-medium text-foreground">
                                      {getAnswerLabel(
                                        normalizedSoal,
                                        jawabanMahasiswa,
                                      )}
                                    </p>
                                  </div>

                                  <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      Kunci
                                    </p>
                                    <p className="mt-1 line-clamp-1 text-sm font-medium text-primary">
                                      {getCorrectAnswerLabel(normalizedSoal)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {laporanMode && (
        <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="border border-border/60 bg-white/95 shadow-xl dark:bg-card">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle>Daftar Mahasiswa</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pilih mahasiswa di sini, lalu panel kanan langsung berubah
                  menjadi area review dan penilaian.
                </p>
                {/* Counter: sudah dinilai / total */}
                {filteredAttempts.length > 0 &&
                  (() => {
                    const gradedCount = filteredAttempts.filter((a) =>
                      attemptHasReviewResult(a),
                    ).length;
                    const submittedCount = filteredAttempts.filter(
                      (a) =>
                        a.status === "submitted" && !attemptHasReviewResult(a),
                    ).length;
                    return (
                      <div className="flex gap-2 flex-wrap mt-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3" />
                          {gradedCount} dinilai
                        </span>
                        {submittedCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            {submittedCount} menunggu review
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                          {filteredAttempts.length} total
                        </span>
                      </div>
                    );
                  })()}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari mahasiswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredAttempts.length === 0 ? (
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Tidak ada mahasiswa yang cocok dengan pencarian."
                      : "Belum ada data laporan untuk tugas ini."}
                  </p>
                </div>
              ) : (
                filteredAttempts.map((attempt) => {
                  const isSelected = selectedAttempt?.id === attempt.id;
                  const isGraded = attemptHasReviewResult(attempt);
                  const isSubmitted = attempt.status === "submitted";

                  // Color-code: graded=hijau, submitted=kuning, belum submit=abu
                  const rowBg = isGraded
                    ? "border-green-200 bg-green-50/60 dark:border-green-800 dark:bg-green-900/20"
                    : isSubmitted
                      ? "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-900/20"
                      : "border-border/60 bg-background";

                  return (
                    <button
                      key={attempt.id}
                      type="button"
                      onClick={() =>
                        void handleOpenLaporanReview(attempt.id, true)
                      }
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition hover:shadow-sm",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
                          : rowBg + " hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="mt-0.5">
                          <AvatarFallback>
                            {attempt.mahasiswa?.user?.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "M"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div>
                            <p className="truncate font-medium">
                              {attempt.mahasiswa?.user?.full_name || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {attempt.mahasiswa?.nim || "-"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getLaporanUploadBadge(attempt)}
                            {getLaporanReviewBadge(attempt)}
                          </div>
                          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span>
                              {attempt.submitted_at
                                ? new Date(attempt.submitted_at).toLocaleString(
                                    "id-ID",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )
                                : "Belum submit"}
                            </span>
                            <span className="font-semibold text-foreground">
                              {isGraded
                                ? getAttemptEffectivePoints(attempt, quiz)
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="border border-primary/20 bg-white/95 shadow-xl dark:bg-card">
            <CardHeader className="space-y-2">
              <div>
                <CardTitle>Panel Penilaian Laporan</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Semua aktivitas review dilakukan di sini: lihat file, tulis
                  feedback, beri nilai, lalu simpan.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {reviewLoading ? (
                <div className="space-y-4">
                  <div className="h-6 w-1/3 skeleton-shimmer rounded-xs" />
                  <div className="h-10 w-full skeleton-shimmer rounded-md" />
                  <div className="h-32 w-full skeleton-shimmer rounded-md" />
                </div>
              ) : !selectedAttempt ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                  <div className="max-w-md space-y-3">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      Belum ada mahasiswa yang dipilih
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pilih satu mahasiswa dari panel kiri agar file laporan dan
                      form penilaian muncul di sini.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Informasi Mahasiswa
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="font-semibold">
                          {selectedAttempt.mahasiswa?.user?.full_name ||
                            "Unknown"}
                        </p>
                        <p className="text-muted-foreground">
                          NIM: {selectedAttempt.mahasiswa?.nim || "-"}
                        </p>
                        <div className="pt-2">
                          {getLaporanReviewBadge(
                            selectedAttempt as AttemptWithStudent,
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Informasi Tugas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="font-semibold">
                          {selectedAttempt.kuis?.judul || "-"}
                        </p>
                        <p className="text-muted-foreground">
                          Mata kuliah:{" "}
                          {(selectedAttempt.kuis as any)?.mata_kuliah
                            ?.nama_mk ||
                            (selectedAttempt.kuis as any)?.kelas?.mata_kuliah
                              ?.nama_mk ||
                            "-"}
                        </p>
                        <p className="text-muted-foreground">
                          Kelas:{" "}
                          {(selectedAttempt.kuis as any)?.kelas?.nama_kelas ||
                            "-"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Ringkasan Nilai
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-3xl font-bold">
                          {calculateReviewTotalScore()}
                        </p>
                        <p className="text-muted-foreground">
                          dari{" "}
                          {selectedAttempt.kuis?.soal?.reduce(
                            (sum, soal) => sum + soal.poin,
                            0,
                          ) || 0}{" "}
                          poin
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {selectedAttempt.kuis?.soal?.map((soal, index) => {
                      const jawaban = getReviewJawabanForSoal(soal);
                      const grading = jawaban
                        ? reviewGradingState[jawaban.id]
                        : null;
                      const tipeSoal =
                        (soal as any).tipe_soal || (soal as any).tipe;

                      return (
                        <Card key={soal.id} className="border border-border/60">
                          <CardHeader className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status="info" pulse={false}>
                                Soal {index + 1}
                              </StatusBadge>
                              <StatusBadge status="offline" pulse={false}>
                                {tipeSoal === "file_upload"
                                  ? "Upload File"
                                  : "Jawaban Teks"}
                              </StatusBadge>
                            </div>
                            <CardTitle className="text-base">
                              {soal.pertanyaan}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {tipeSoal === "file_upload" &&
                            getResolvedReviewFileSubmission(jawaban).url ? (
                              <div className="rounded-xl border border-orange-200 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/30 p-4">
                                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-3 uppercase tracking-wide">
                                  📎 File yang dikirim mahasiswa
                                </p>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900 shrink-0">
                                      <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-medium truncate text-sm">
                                        {
                                          getResolvedReviewFileSubmission(
                                            jawaban,
                                          ).name
                                        }
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {getResolvedReviewFileSubmission(
                                          jawaban,
                                        ).type || "PDF / Word / Gambar"}
                                        {getResolvedReviewFileSubmission(
                                          jawaban,
                                        ).size > 0 && (
                                          <span className="ml-1">
                                            •{" "}
                                            {(
                                              getResolvedReviewFileSubmission(
                                                jawaban,
                                              ).size / 1024
                                            ).toFixed(0)}{" "}
                                            KB
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="shrink-0 gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                                    onClick={() =>
                                      void handleOpenReviewFile(jawaban)
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                    Buka File
                                  </Button>
                                </div>
                              </div>
                            ) : tipeSoal === "file_upload" ? (
                              <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 p-4">
                                <div className="flex items-center gap-3">
                                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <div>
                                    <p className="font-medium text-sm text-amber-800 dark:text-amber-200">
                                      File belum dikirim
                                    </p>
                                    <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
                                      Mahasiswa belum mengupload file laporan
                                      untuk soal ini
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : jawaban?.jawaban_mahasiswa ? (
                              <div className="rounded-xl border bg-muted/30 p-4">
                                <Label className="mb-2 block text-sm text-muted-foreground">
                                  Jawaban mahasiswa
                                </Label>
                                <p className="whitespace-pre-wrap text-sm">
                                  {jawaban.jawaban_mahasiswa}
                                </p>
                              </div>
                            ) : (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  Mahasiswa belum mengirim file atau jawaban.
                                </AlertDescription>
                              </Alert>
                            )}

                            {jawaban && (
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <Label htmlFor={`review-poin-${jawaban.id}`}>
                                    Poin (Max: {soal.poin})
                                  </Label>
                                  <Input
                                    id={`review-poin-${jawaban.id}`}
                                    type="number"
                                    min="0"
                                    max={soal.poin}
                                    value={grading?.poin_diperoleh || 0}
                                    onChange={(e) =>
                                      handleReviewGradeChange(
                                        jawaban.id,
                                        "poin_diperoleh",
                                        Number(e.target.value),
                                      )
                                    }
                                    className="mt-2"
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor={`review-feedback-${jawaban.id}`}
                                  >
                                    Feedback
                                  </Label>
                                  <Textarea
                                    id={`review-feedback-${jawaban.id}`}
                                    value={grading?.feedback || ""}
                                    onChange={(e) =>
                                      handleReviewGradeChange(
                                        jawaban.id,
                                        "feedback",
                                        e.target.value,
                                      )
                                    }
                                    className="mt-2"
                                    rows={4}
                                    placeholder="Tambahkan catatan penilaian..."
                                  />
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveLaporanReview}
                      disabled={reviewSaving || reviewLoading}
                      className="gap-2"
                    >
                      {reviewSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Simpan Penilaian
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Tabs - Hide for CBT mode and laporan mode */}
      {!isAutoGradedQuiz(quiz) && !laporanMode && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="h-auto rounded-xl border border-primary/20 bg-white/85 p-1 shadow-sm dark:border-primary/20 dark:bg-card/70">
            <TabsTrigger
              value="overview"
              className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="attempts"
              className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Submissions ({attempts.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Tugas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {laporanMode ? (
                  // LAPORAN MODE: Show submission info
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Tipe Tugas</Label>
                      <p className="text-2xl font-bold">Laporan Praktikum</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Total Mahasiswa
                      </Label>
                      <p className="text-2xl font-bold">
                        {statistics.totalAttempts}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Sudah Submit
                      </Label>
                      <p className="text-2xl font-bold text-success">
                        {statistics.completedAttempts}
                      </p>
                    </div>
                  </div>
                ) : (
                  // CBT MODE: Show score info
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Total Soal</Label>
                      <p className="text-2xl font-bold">
                        {(quiz as any).total_soal || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Poin</Label>
                      <p className="text-2xl font-bold">
                        {getQuizMaxPoin(quiz)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Durasi</Label>
                      <p className="text-2xl font-bold">
                        {(quiz as any).durasi ||
                          (quiz as any).durasi_menit ||
                          0}{" "}
                        menit
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Waktu Rata-rata
                      </Label>
                      <p className="text-2xl font-bold">
                        {statistics.averageTime.toFixed(0)} menit
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Distribution - Only for CBT */}
            {!laporanMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribusi Skor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getScoreDistribution(attempts, quiz).map((range) => (
                      <div key={range.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {range.label}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {range.count} mahasiswa
                          </span>
                        </div>
                        <Progress
                          value={
                            attempts.length > 0
                              ? (range.count / attempts.length) * 100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attempts Tab */}
          <TabsContent value="attempts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Percobaan</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari mahasiswa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAttempts.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "Tidak ada hasil yang sesuai"
                        : "Belum ada mahasiswa yang mengerjakan tugas ini"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mahasiswa</TableHead>
                        <TableHead>Status</TableHead>
                        {!laporanMode && (
                          <>
                            <TableHead className="text-right">Skor</TableHead>
                            <TableHead className="text-right">Waktu</TableHead>
                          </>
                        )}
                        {laporanMode && <TableHead>Waktu Submit</TableHead>}
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttempts.map((attempt) => {
                        const isGraded = attemptHasReviewResult(attempt);
                        const isPassed = isAttemptPassed(attempt, quiz);
                        const quizMaxPoin = getQuizMaxPoin(quiz);
                        const scorePercentage = getAttemptPercentage(
                          attempt,
                          quiz,
                        );

                        return (
                          <TableRow key={attempt.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {attempt.mahasiswa?.user?.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase() || "M"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {attempt.mahasiswa?.user?.full_name ||
                                      "Unknown"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {attempt.mahasiswa?.nim || "-"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              {laporanMode ? (
                                getLaporanReviewBadge(attempt)
                              ) : (
                                // CBT MODE: Show pass/fail status
                                <>
                                  {isGraded ? (
                                    <StatusBadge
                                      status={isPassed ? "success" : "error"}
                                      pulse={false}
                                    >
                                      {isPassed ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Lulus
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Tidak Lulus
                                        </>
                                      )}
                                    </StatusBadge>
                                  ) : attempt.status === "submitted" ? (
                                    <StatusBadge status="warning" pulse={false}>
                                      <Clock className="h-3 w-3 mr-1" />
                                      Menunggu Penilaian
                                    </StatusBadge>
                                  ) : (
                                    <StatusBadge status="info" pulse={false}>
                                      <Clock className="h-3 w-3 mr-1" />
                                      Sedang Dikerjakan
                                    </StatusBadge>
                                  )}
                                </>
                              )}
                            </TableCell>

                            {!laporanMode && (
                              <>
                                <TableCell className="text-right">
                                  <span
                                    className={cn(
                                      "font-semibold",
                                      isPassed ? "text-success" : "text-danger",
                                    )}
                                  >
                                    {/* FIXED: Changed nilai to total_poin */}
                                    {getAttemptEffectivePoints(attempt, quiz)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {" / "}
                                    {quizMaxPoin}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    {scorePercentage.toFixed(1)}%
                                  </div>
                                </TableCell>

                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {/* FIXED: Changed property names */}
                                  {attempt.submitted_at && attempt.started_at
                                    ? calculateDuration(
                                        attempt.started_at,
                                        attempt.submitted_at,
                                      )
                                    : "-"}
                                </TableCell>
                              </>
                            )}

                            {laporanMode && (
                              <TableCell className="text-sm text-muted-foreground">
                                {attempt.submitted_at
                                  ? new Date(
                                      attempt.submitted_at,
                                    ).toLocaleString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "-"}
                              </TableCell>
                            )}

                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAttempt(attempt.id)}
                                title={
                                  laporanMode
                                    ? "Lihat & Nilai Laporan"
                                    : "Tampilkan di Panel CBT"
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Analisis Per Soal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-12">
                  Fitur analisis per soal akan segera tersedia
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate quiz statistics
 */
function calculateStatistics(
  attempts: AttemptWithStudent[],
  quiz: Kuis,
): QuizStatistics {
  const submittedAttempts = attempts.filter(
    (a) => a.status === "submitted" || a.status === "graded",
  );
  const isLaporanQuiz =
    quiz.tipe_kuis === "essay" ||
    (quiz.soal || []).every((soal: any) => {
      const tipe = soal?.tipe_soal || soal?.tipe;
      return tipe === "file_upload";
    });
  const completedAttempts = isLaporanQuiz
    ? attempts.filter((a) => a.status === "graded")
    : submittedAttempts;

  if (completedAttempts.length === 0) {
    return {
      totalAttempts: attempts.length,
      completedAttempts: isLaporanQuiz ? submittedAttempts.length : 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passRate: 0,
      averageTime: 0,
    };
  }

  const scores = completedAttempts.map((a) => getAttemptPercentage(a, quiz));
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  const passedCount = completedAttempts.filter((a) =>
    isAttemptPassed(a, quiz),
  ).length;
  const passRate = (passedCount / completedAttempts.length) * 100;

  // Calculate average time
  // FIXED: Changed property names
  const durations = completedAttempts
    .filter((a) => a.started_at && a.submitted_at)
    .map((a) => {
      const start = new Date(a.started_at).getTime();
      const end = new Date(a.submitted_at!).getTime();
      return (end - start) / 1000 / 60; // in minutes
    });

  const averageTime =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  return {
    totalAttempts: attempts.length,
    completedAttempts: isLaporanQuiz
      ? submittedAttempts.length
      : completedAttempts.length,
    averageScore,
    highestScore,
    lowestScore,
    passRate,
    averageTime,
  };
}

/**
 * Get score distribution
 */
function getScoreDistribution(attempts: AttemptWithStudent[], quiz: Kuis) {
  const completed = attempts.filter((a) => a.status === "graded");

  const ranges = [
    { label: "91-100", min: 91, max: 100, count: 0 },
    { label: "81-90", min: 81, max: 90, count: 0 },
    { label: "71-80", min: 71, max: 80, count: 0 },
    { label: "61-70", min: 61, max: 70, count: 0 },
    { label: "0-60", min: 0, max: 60, count: 0 },
  ];

  completed.forEach((attempt) => {
    const score = getAttemptPercentage(attempt, quiz);
    const range = ranges.find((r) => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  return ranges;
}

function getQuizMaxPoin(quiz: Kuis | null): number {
  if (!quiz) return 100;

  const soal = Array.isArray(quiz.soal) ? quiz.soal : [];
  const maxFromQuestions = soal.reduce(
    (sum, item: any) => sum + (item?.poin || 0),
    0,
  );

  if (maxFromQuestions > 0) {
    return maxFromQuestions;
  }

  return (quiz as any).total_poin || 100;
}

function getQuizPassingPercentage(quiz: Kuis | null): number {
  return (quiz as any)?.passing_score ?? (quiz as any)?.passing_grade ?? 60;
}

function getAttemptPercentage(
  attempt: Pick<AttemptWithStudent, "total_poin"> & { jawaban?: any[] },
  quiz: Kuis | null,
): number {
  const maxPoin = getQuizMaxPoin(quiz);
  if (maxPoin <= 0) return 0;

  const storedPoints = attempt.total_poin || 0;
  if (storedPoints > 0) {
    return (storedPoints / maxPoin) * 100;
  }

  const summary = getAttemptAutoGradedSummary(
    attempt as AttemptWithStudent,
    quiz,
  );
  return ((summary.totalPoin || 0) / maxPoin) * 100;
}

function getAttemptEffectivePoints(
  attempt: Pick<AttemptWithStudent, "total_poin"> & { jawaban?: any[] },
  quiz: Kuis | null,
): number {
  if ((attempt.total_poin || 0) > 0) {
    return attempt.total_poin || 0;
  }

  return getAttemptAutoGradedSummary(attempt as AttemptWithStudent, quiz)
    .totalPoin;
}

function getAttemptAutoGradedSummary(
  attempt: AttemptWithStudent | null,
  quiz: Kuis | null,
) {
  const soalList = ((quiz?.soal || []) as any[]).map((soal) => ({
    ...soal,
    tipe_soal: soal?.tipe_soal || soal?.tipe,
    opsi_jawaban: soal?.opsi_jawaban || soal?.pilihan_jawaban || null,
  }));
  const jawabanList = (attempt?.jawaban || []) as any[];

  const summary = soalList.reduce(
    (acc, soal) => {
      const jawaban = jawabanList.find((item) => item?.soal_id === soal.id);
      if (!jawaban) {
        return acc;
      }

      if (typeof jawaban.is_correct === "boolean") {
        return {
          correctCount: acc.correctCount + (jawaban.is_correct ? 1 : 0),
          totalPoin:
            acc.totalPoin +
            (jawaban.poin_diperoleh ??
              (jawaban.is_correct ? (soal?.poin ?? 0) : 0)),
        };
      }

      const jawabanMahasiswa =
        jawaban?.jawaban ?? jawaban?.jawaban_mahasiswa ?? "";
      if (!jawabanMahasiswa.trim()) {
        return acc;
      }

      const tipeSoal = soal?.tipe_soal;
      const isAutoGradable =
        tipeSoal === "pilihan_ganda" ||
        tipeSoal === "benar_salah" ||
        tipeSoal === "jawaban_singkat";

      if (!isAutoGradable) {
        return acc;
      }

      const isCorrect = checkAnswerCorrect(soal, jawabanMahasiswa);
      return {
        correctCount: acc.correctCount + (isCorrect ? 1 : 0),
        totalPoin: acc.totalPoin + (isCorrect ? (soal?.poin ?? 0) : 0),
      };
    },
    { correctCount: 0, totalPoin: 0 },
  );

  return summary;
}

function isAttemptPassed(
  attempt: Pick<AttemptWithStudent, "total_poin"> & { jawaban?: any[] },
  quiz: Kuis | null,
): boolean {
  return getAttemptPercentage(attempt, quiz) >= getQuizPassingPercentage(quiz);
}

/**
 * Calculate duration between two dates
 */
function calculateDuration(start: string, end: string): string {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;
  const minutes = Math.floor(durationMs / 1000 / 60);

  if (minutes < 60) {
    return `${minutes} menit`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}j ${remainingMinutes}m`;
}

/**
 * Label component helper
 */
function Label({
  className,
  children,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  );
}
