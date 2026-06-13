/**
 * KuisBuilderPage (Tugas Praktikum)
 *
 * Purpose: Full page wrapper for task builder
 * Route: /dosen/kuis/create or /dosen/kuis/:kuisId/edit
 * Role: Dosen only
 * Note: Table name remains "kuis" but UI displays "Tugas Praktikum"
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizBuilder } from "@/components/features/kuis/builder/QuizBuilder";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { getKuisById } from "@/lib/api/kuis.api";
import type { Kuis } from "@/types/kuis.types";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/common";
import logger from "@/lib/utils/logger";

export default function KuisBuilderPage() {
  const navigate = useNavigate();
  const { kuisId } = useParams(); // Changed from 'id' to 'kuisId' to match route param
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Kuis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dosenId, setDosenId] = useState<string>("");
  const [isLoadingDosenId, setIsLoadingDosenId] = useState(false);

  const isEditing = !!kuisId;

  useEffect(() => {
    async function fetchDosenId() {
      if (user?.dosen?.id) {
        setDosenId(user.dosen.id);
        return;
      }

      if (user?.id && user?.role === "dosen") {
        setIsLoadingDosenId(true);
        try {
          const { data, error } = await supabase
            .from("dosen")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          if (data?.id) {
            setDosenId(data.id);
          }
        } catch (error) {
          console.error("Error fetching dosen_id:", error);
        } finally {
          setIsLoadingDosenId(false);
        }
      }
    }

    void fetchDosenId();
  }, [user]);

  // Load quiz data when editing
  useEffect(() => {
    if (isEditing && kuisId && dosenId) {
      loadQuizData(kuisId);
    }
  }, [kuisId, isEditing, dosenId]);

  async function loadQuizData(id: string) {
    try {
      setIsLoading(true);
      const quizData = await getKuisById(id);

      // Verify the task belongs to this dosen
      if (quizData.dosen_id !== dosenId) {
        toast.error("Anda tidak memiliki akses untuk mengedit tugas ini");
        navigate("/dosen/kuis");
        return;
      }

      setQuiz(quizData);
    } catch (error: any) {
      console.error("Error loading task:", error);
      toast.error(error.message || "Gagal memuat data tugas");
      navigate("/dosen/kuis");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = (quiz?: any) => {
    logger.debug("🎯 [KuisBuilderPage] Quiz saved:", quiz?.id);

    // ✅ Wait a moment for cache invalidation to complete, then navigate
    // This ensures the list page loads fresh data instead of stale cache
    setTimeout(() => {
      logger.debug("🔄 [KuisBuilderPage] Navigating back to list...");
      navigate("/dosen/kuis");
    }, 500); // 500ms delay to ensure cache is cleared

    toast.success(
      isEditing
        ? "Tugas praktikum berhasil diperbarui!"
        : "Tugas praktikum berhasil disimpan!",
      {
        duration: 3000,
      },
    );
  };

  const handleCancel = () => {
    navigate("/dosen/kuis");
  };

  // Redirect if not dosen or dosen profile not loaded
  if (user && (user.role !== "dosen" || !user.dosen?.id)) {
    if (user.role !== "dosen") {
      navigate("/");
      return null;
    }
  }

  if (isLoadingDosenId) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell rounded-2xl p-5">
          <div className="h-20 w-full skeleton-shimmer rounded-xl" />
        </div>
        <FormSkeleton />
      </div>
    );
  }

  if (!dosenId && user?.role === "dosen") {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center shadow-md dark:border-destructive/20">
          <p className="text-base font-semibold text-destructive">
            Data dosen tidak ditemukan. Silakan logout lalu login kembali.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state when fetching task data
  if (isEditing && isLoading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell rounded-2xl p-5">
          <div className="h-20 w-full skeleton-shimmer rounded-xl" />
        </div>
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Tugas Praktikum" : "Buat Tugas Praktikum Baru"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing
              ? "Perbarui informasi tugas, pengaturan, dan struktur soal dengan tampilan yang lebih rapi dan konsisten."
              : "Susun tugas praktikum baru (pre-test, post-test, atau laporan) dengan alur yang responsif dan mudah dipakai."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dosen/kuis")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>
      </div>

      {/* Quiz Builder */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:p-6">
        <QuizBuilder
          quiz={quiz || undefined}
          dosenId={dosenId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
