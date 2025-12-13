/**
 * KuisAttemptPage
 *
 * Purpose: Full page wrapper for quiz attempt
 * Route: /mahasiswa/kuis/:kuisId/attempt or /mahasiswa/kuis/:kuisId/attempt/:attemptId
 * Role: Mahasiswa only
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QuizAttempt } from "@/components/features/kuis/attempt/QuizAttempt";
import { useAuth } from "@/lib/hooks/useAuth";
import { getKuisById } from "@/lib/api/kuis.api";
import type { Kuis } from "@/types/kuis.types";
import { toast } from "sonner";

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
      const quizData = await getKuisById(kuisId);
      setQuiz(quizData);

      // ✅ SIMPLIFIED: Only check status, no date validation
      // Kuis aktif = sudah dipublish oleh dosen (status = "published")
      const status = quizData.status || 'draft';

      console.log("🔵 Quiz status:", status);
      console.log("🔵 Quiz data:", quizData);

      // Only allow if status is "published" or "active"
      if (status !== 'published' && status !== 'active') {
        setError("Kuis ini belum dipublish oleh dosen");
        setCanAttempt(false);
        return;
      }

      // All checks passed - kuis sudah dipublish, mahasiswa bisa akses
      console.log("✅ Kuis sudah dipublish, mahasiswa bisa mengakses");
      setCanAttempt(true);
    } catch (err: any) {
      setError(err.message || "Gagal memuat kuis");
      setCanAttempt(false);
      toast.error("Gagal memuat kuis", {
        description: err.message,
      });
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Memuat kuis...</p>
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
          Kembali ke Daftar Kuis
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Tidak Dapat Mengakses Kuis</AlertTitle>
          <AlertDescription>
            {error || "Terjadi kesalahan saat memuat kuis"}
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button onClick={() => navigate("/mahasiswa/kuis")}>
            Kembali ke Daftar Kuis
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
            Anda harus login sebagai mahasiswa untuk mengerjakan kuis
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
