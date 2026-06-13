/**
 * KuisAttemptPage (Tugas Praktikum)
 *
 * Purpose: Full page wrapper for task attempt
 * Route: /mahasiswa/kuis/:kuisId/attempt or /mahasiswa/kuis/:kuisId/attempt/:attemptId
 * Role: Mahasiswa only
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QuizAttempt } from "@/components/features/kuis/attempt/QuizAttempt";
import { useAuth } from "@/lib/hooks/useAuth";
import { getKuisForAttempt } from "@/lib/api/kuis-secure.api";
import { getKuisByIdOffline } from "@/lib/api/kuis.api";
import type { Kuis } from "@/types/kuis.types";
import { toast } from "sonner";
import { CardListSkeleton } from "@/components/common";
import logger from "@/lib/utils/logger";

// Debug logging (disabled in tests and production)
const DEBUG_KUIS_ATTEMPT_PAGE_LOGS =
  import.meta.env.DEV && import.meta.env.MODE !== "test";
const debugLog = (...args: unknown[]) => {
  if (DEBUG_KUIS_ATTEMPT_PAGE_LOGS) logger.debug(...args);
};

export default function KuisAttemptPage() {
  const navigate = useNavigate();
  const { kuisId, attemptId } = useParams<{
    kuisId: string;
    attemptId?: string;
  }>();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Kuis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canAttempt, setCanAttempt] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);

  /**
   * Validate quiz access and timing
   */
  useEffect(() => {
    if (!kuisId || !user?.mahasiswa?.id) return;

    validateQuizAccess();
  }, [kuisId, user]);

  /**
   * Validate if mahasiswa can attempt this quiz
   */
  const validateQuizAccess = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!kuisId) {
        throw new Error("Quiz ID tidak ditemukan");
      }

      // Load quiz
      const quizData = navigator.onLine
        ? await getKuisForAttempt(kuisId)
        : await getKuisByIdOffline(kuisId);
      setQuiz(quizData);

      // Tugas aktif harus published dan berada dalam jendela waktu yang valid,
      // agar akses direct URL tetap konsisten dengan status pada daftar tugas.
      const status = quizData.status || "draft";

      debugLog("🔵 Task status:", status);
      debugLog("🔵 Task data:", quizData);

      // Only allow if status is "published"
      if (status !== "published") {
        setError("Tugas praktikum ini belum dipublish oleh dosen");
        setCanAttempt(false);
        return;
      }

      const now = new Date();
      const startDate = quizData.tanggal_mulai
        ? new Date(quizData.tanggal_mulai)
        : null;
      const endDate = quizData.tanggal_selesai
        ? new Date(quizData.tanggal_selesai)
        : null;

      if (startDate && now < startDate) {
        setError("Tugas praktikum ini belum dimulai");
        setCanAttempt(false);
        return;
      }

      if (endDate && now > endDate) {
        setError("Tugas praktikum ini sudah melewati batas waktu");
        setCanAttempt(false);
        return;
      }

      // All checks passed - tugas sudah dipublish, mahasiswa bisa akses
      debugLog("✅ Tugas aktif, mahasiswa bisa mengakses");
      setCanAttempt(true);
      setIsOfflineData(!navigator.onLine);
    } catch (err: any) {
      // Provide helpful error message
      const errorMessage = err.message || "Gagal memuat tugas praktikum";
      const isNotFoundError = err.code === "PGRST116" || err.status === 404;

      setError(
        isNotFoundError
          ? "Tugas praktikum tidak ditemukan. Mungkin tugas telah dihapus atau Anda tidak memiliki akses."
          : errorMessage,
      );
      setCanAttempt(false);

      if (isNotFoundError) {
        toast.error("Tugas Tidak Ditemukan", {
          description: "Silakan kembali ke daftar tugas dan coba lagi.",
        });
      } else {
        toast.error("Gagal memuat tugas praktikum", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    if (confirm("Yakin ingin keluar? Progress Anda akan disimpan.")) {
      navigate("/mahasiswa/kuis");
    }
  };

  // ============================================================================
  // RENDER - LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl space-y-6">
        <div className="h-[96px] w-full skeleton-shimmer rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-[100px] md:col-span-3 skeleton-shimmer rounded-xl" />
          <div className="h-[100px] md:col-span-1 skeleton-shimmer rounded-xl" />
        </div>
        <CardListSkeleton count={4} />
      </div>
    );
  }

  // ============================================================================
  // RENDER - ERROR
  // ============================================================================

  if (error || !canAttempt || !quiz) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/mahasiswa/kuis")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Tugas
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tidak Dapat Mengakses Tugas</AlertTitle>
          <AlertDescription>
            {error || "Terjadi kesalahan saat memuat tugas praktikum"}
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button onClick={() => navigate("/mahasiswa/kuis")}>
            Kembali ke Daftar Tugas
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - QUIZ ATTEMPT
  // ============================================================================

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-4">
      {isOfflineData && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Detail tugas praktikum sedang dibuka dari cache lokal perangkat.
            Jawaban tetap dapat dilanjutkan dan akan disinkronkan saat koneksi
            tersedia.
          </AlertDescription>
        </Alert>
      )}
      {/* Header with back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Quiz Attempt Component */}
      {user?.mahasiswa?.id && (
        <QuizAttempt
          kuisId={kuisId!}
          mahasiswaId={user.mahasiswa.id}
          attemptId={attemptId}
        />
      )}

      {/* No mahasiswa ID error */}
      {!user?.mahasiswa?.id && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anda harus login sebagai mahasiswa untuk mengerjakan tugas praktikum
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
