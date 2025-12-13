/**
 * KuisBuilderPage
 *
 * Purpose: Full page wrapper for quiz builder
 * Route: /dosen/kuis/create or /dosen/kuis/:kuisId/edit
 * Role: Dosen only
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizBuilder } from "@/components/features/kuis/builder/QuizBuilder";
import { useAuth } from "@/lib/hooks/useAuth";
import { getKuisById } from "@/lib/api/kuis.api";
import type { Kuis } from "@/types/kuis.types";
import { toast } from "sonner";

export default function KuisBuilderPage() {
  const navigate = useNavigate();
  const { kuisId } = useParams(); // Changed from 'id' to 'kuisId' to match route param
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Kuis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!kuisId;

  // Get dosen_id from user.dosen.id (primary key of dosen table)
  const dosenId = user?.dosen?.id || "";

  // Load quiz data when editing
  useEffect(() => {
    if (isEditing && kuisId) {
      loadQuizData(kuisId);
    }
  }, [kuisId, isEditing]);

  async function loadQuizData(id: string) {
    try {
      setIsLoading(true);
      const quizData = await getKuisById(id);

      // Verify the quiz belongs to this dosen
      if (quizData.dosen_id !== dosenId) {
        toast.error("Anda tidak memiliki akses untuk mengedit kuis ini");
        navigate("/dosen/kuis");
        return;
      }

      setQuiz(quizData);
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      toast.error(error.message || "Gagal memuat data kuis");
      navigate("/dosen/kuis");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = () => {
    navigate("/dosen/kuis");
  };

  const handleCancel = () => {
    navigate("/dosen/kuis");
  };

  // Redirect if not dosen or dosen profile not loaded
  if (user && (user.role !== "dosen" || !user.dosen?.id)) {
    navigate("/");
    return null;
  }

  // Show loading state when fetching quiz data
  if (isEditing && isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Memuat data kuis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dosen/kuis")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Kuis
        </Button>

        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Kuis" : "Buat Kuis Baru"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing
            ? "Edit informasi dan soal kuis"
            : "Buat kuis baru untuk mahasiswa Anda"}
        </p>
      </div>

      {/* Quiz Builder */}
      <QuizBuilder
        quiz={quiz || undefined}
        dosenId={dosenId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
