/**
 * KuisCreatePage (Tugas Praktikum)
 *
 * Purpose: Create task for praktikum (Dosen)
 * Route: /dosen/kuis/create
 *
 * Tugas Praktikum:
 * 1. LAPORAN - WAJIB ada untuk setiap praktikum (isian laporan/upload berkas)
 * 2. TES (Pre/Post-test) - OPSIONAL, tidak semua praktikum ada tes (CBT pilihan ganda)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Monitor, FileText, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { QuizBuilder } from "@/components/features/kuis/builder/QuizBuilder";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/common";
import logger from "@/lib/utils/logger";

type TaskType = "tes" | "laporan" | null;

export default function KuisCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dosenId, setDosenId] = useState<string>("");
  const [isLoadingDosenId, setIsLoadingDosenId] = useState(false);
  const [selectedType, setSelectedType] = useState<TaskType>(null);

  // Fetch dosen_id if not available in user object
  useEffect(() => {
    async function fetchDosenId() {
      if (user?.dosen?.id) {
        setDosenId(user.dosen.id);
        return;
      }

      // Fallback: Fetch from database
      if (user?.id && user?.role === "dosen") {
        setIsLoadingDosenId(true);
        try {
          const { data, error } = await supabase
            .from("dosen")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          if (data) {
            logger.debug("✅ Fetched dosen_id from database:", data.id);
            setDosenId(data.id);
          } else {
            console.error("❌ No dosen record found for user_id:", user.id);
          }
        } catch (error) {
          console.error("❌ Error fetching dosen_id:", error);
        } finally {
          setIsLoadingDosenId(false);
        }
      }
    }

    fetchDosenId();
  }, [user]);

  // Redirect if not dosen
  if (user && user.role !== "dosen") {
    console.error("❌ Not a dosen:", { role: user.role });
    navigate("/");
    return null;
  }

  // Show loading while fetching dosen ID
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

  // Show error if no dosen ID found
  if (!dosenId && user) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <Card className="rounded-2xl border-danger/30 bg-danger/5 shadow-2xl dark:border-danger/20">
          <CardContent className="p-8 text-center">
            <p className="text-base font-semibold text-danger">
              Data dosen tidak ditemukan. Silakan logout lalu login kembali.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = (quiz?: any) => {
    logger.debug("🎯 [KuisCreatePage] Quiz saved:", quiz?.id);

    // ✅ Wait a moment for cache invalidation to complete, then navigate
    // This ensures the list page loads fresh data instead of stale cache
    setTimeout(() => {
      logger.debug("🔄 [KuisCreatePage] Navigating back to list...");
      navigate("/dosen/kuis");
    }, 500); // 500ms delay to ensure cache is cleared

    toast.success("Tugas praktikum berhasil disimpan!", {
      duration: 3000,
    });
  };

  const handleCancel = () => {
    navigate("/dosen/kuis");
  };

  // Show choice dialog if no type selected
  if (!selectedType) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary dark:border-primary/30 dark:bg-primary/10">
              <FileText className="h-3.5 w-3.5" />
              Setup Tugas Praktikum
            </div>
            <h1 className="text-2xl font-bold text-foreground mt-2">
              Buat Tugas Praktikum
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pilih jenis tugas yang ingin diberikan agar alur penilaian lebih
              terstruktur dan konsisten.
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

        <Card className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <CardContent className="p-5 sm:p-7">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Option 1: Laporan (WAJIB) */}
              <button
                onClick={() => setSelectedType("laporan")}
                className="group relative rounded-2xl border-2 border-success/30 bg-success/5 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-success/60 hover:bg-success/10 hover:shadow-xl"
              >
                <StatusBadge
                  status="success"
                  pulse={false}
                  className="absolute right-3 top-3"
                >
                  WAJIB
                </StatusBadge>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 transition-colors group-hover:bg-success/20">
                    <FileText className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-success">
                      📄 Laporan Praktikum
                    </h3>
                    <p className="text-sm text-success/70">
                      Mahasiswa mengumpulkan laporan dalam bentuk isian laporan
                      atau upload berkas.
                    </p>
                    <div className="mt-3 inline-block rounded-full bg-success/10 px-3 py-1 text-xs text-success">
                      Essay • PDF • Word
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: Tes CBT (OPSIONAL) */}
              <button
                onClick={() => setSelectedType("tes")}
                className="group relative rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:shadow-xl"
              >
                <StatusBadge
                  status="info"
                  pulse={false}
                  className="absolute right-3 top-3"
                >
                  OPSIONAL
                </StatusBadge>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Monitor className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-bold text-primary">
                      🖥️ Tes CBT
                    </h3>
                    <p className="text-sm text-primary/70">
                      Pre-test atau Post-test dengan soal pilihan ganda seperti
                      UKOM.
                    </p>
                    <div className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                      Pilihan Ganda • Bank Soal
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div className="text-sm text-warning/90">
                  <strong>Info:</strong> Laporan praktikum{" "}
                  <strong>wajib</strong> ada untuk setiap praktikum. Sedangkan
                  tes (pre-test/post-test) bersifat <strong>opsional</strong> —
                  tidak semua praktikum memerlukan tes.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show QuizBuilder based on selected type
  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {selectedType === "laporan" ? "Buat Tugas Laporan" : "Buat Tes CBT"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedType === "laporan"
              ? "Mahasiswa akan mengumpulkan laporan praktikum dalam bentuk isian laporan atau upload berkas (PDF/Word)."
              : "Buat soal pilihan ganda seperti ujian UKOM. Soal bisa dibuat manual atau diambil dari Bank Soal."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali Pilih Jenis
          </Button>
        </div>
      </div>

      {/* Form Builder */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm md:p-6">
        <QuizBuilder
          dosenId={dosenId}
          cbtMode={selectedType === "tes"}
          laporanMode={selectedType === "laporan"}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
