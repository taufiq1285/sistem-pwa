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
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QuizAttempt } from "@/components/features/kuis/attempt/QuizAttempt";
import { useAuth } from "@/lib/hooks/useAuth";
import { getKuisForAttempt } from "@/lib/api/kuis-secure.api";
import type { Kuis } from "@/types/kuis.types";
import { toast } from "sonner";

// Debug logging (disabled in tests and production)
const DEBUG_KUIS_ATTEMPT_PAGE_LOGS =
  import.meta.env.DEV && import.meta.env.MODE !== "test";
const debugLog = (...args: unknown[]) => {
  if (DEBUG_KUIS_ATTEMPT_PAGE_LOGS) console.log(...args);
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
      const quizData = await getKuisForAttempt(kuisId);
      setQuiz(quizData);

      // ✅ SIMPLIFIED: Only check status, no date validation
      // Tugas aktif = sudah dipublish oleh dosen (status = "published")
      const status = quizData.status || "draft";

      debugLog("🔵 Task status:", status);
      debugLog("🔵 Task data:", quizData);

      // Only allow if status is "published"
      if (status !== "published") {
        setError("Tugas praktikum ini belum dipublish oleh dosen");
        setCanAttempt(false);
        return;
      }

      // All checks passed - tugas sudah dipublish, mahasiswa bisa akses
      debugLog("✅ Tugas sudah dipublish, mahasiswa bisa mengakses");
      setCanAttempt(true);
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
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-100">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Memuat tugas praktikum...</p>
          </div>
        </div>
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
    <div className="container mx-auto py-6 max-w-7xl">
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
