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
    console.log("🎯 [KuisBuilderPage] Quiz saved:", quiz?.id);

    // ✅ Wait a moment for cache invalidation to complete, then navigate
    // This ensures the list page loads fresh data instead of stale cache
    setTimeout(() => {
      console.log("🔄 [KuisBuilderPage] Navigating back to list...");
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
    navigate("/");
    return null;
  }

  // Show loading state when fetching task data
  if (isEditing && isLoading) {
    return (
      <div className="role-page-shell p-4 sm:p-6 lg:p-8">
        <div className="role-page-content space-y-6">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-10 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900/85">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600" />
            <p className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-200">
              Memuat data tugas praktikum...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-page-shell p-4 sm:p-6 lg:p-8">
      <div className="role-page-content space-y-6 lg:space-y-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/25 bg-linear-to-r from-indigo-600 via-blue-600 to-purple-600 p-6 text-white shadow-2xl sm:p-8">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/dosen/kuis")}
              className="border border-white/40 bg-white/15 text-white hover:bg-white/25"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar Tugas
            </Button>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <FileText className="h-3.5 w-3.5" />
                  Editor Tugas Praktikum
                </div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  {isEditing
                    ? "Edit Tugas Praktikum"
                    : "Buat Tugas Praktikum Baru"}
                </h1>
                <p className="max-w-3xl text-sm text-blue-100 sm:text-base">
                  {isEditing
                    ? "Perbarui informasi tugas, pengaturan, dan struktur soal dengan tampilan yang lebih rapi dan konsisten."
                    : "Susun tugas praktikum baru (pre-test, post-test, atau laporan) dengan alur yang responsif dan mudah dipakai."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quiz Builder */}
        <div className="rounded-3xl border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 sm:p-4 md:p-6">
          <QuizBuilder
            quiz={quiz || undefined}
            dosenId={dosenId}
            onSave={handleSave}
            onCancel={handleCancel}
            laporanMode={
              quiz?.judul?.toLowerCase().includes("laporan") || false
            }
          />
        </div>
      </div>
    </div>
  );
}
