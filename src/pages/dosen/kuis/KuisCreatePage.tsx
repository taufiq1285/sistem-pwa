/**
 * KuisCreatePage (Tugas Praktikum)
 *
 * Purpose: Create task for praktikum (Dosen)
 * Route: /dosen/kuis/create
 *
 * Tugas Praktikum:
 * 1. LAPORAN - WAJIB ada untuk setiap praktikum (essay/upload file)
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
            console.log("✅ Fetched dosen_id from database:", data.id);
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
      <div className="role-page-shell p-4 sm:p-6 lg:p-8">
        <div className="role-page-content">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-10 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900/85">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
            <p className="mt-4 text-base font-semibold text-slate-700 dark:text-slate-200">
              Memuat profil dosen...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no dosen ID found
  if (!dosenId && user) {
    return (
      <div className="role-page-shell p-4 sm:p-6 lg:p-8">
        <div className="role-page-content">
          <Card className="rounded-3xl border-red-200 bg-red-50/80 shadow-2xl dark:border-red-900/40 dark:bg-red-950/20">
            <CardContent className="p-8 text-center">
              <p className="text-base font-semibold text-red-700 dark:text-red-300">
                Data dosen tidak ditemukan. Silakan logout lalu login kembali.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSave = (quiz?: any) => {
    console.log("🎯 [KuisCreatePage] Quiz saved:", quiz?.id);

    // ✅ Wait a moment for cache invalidation to complete, then navigate
    // This ensures the list page loads fresh data instead of stale cache
    setTimeout(() => {
      console.log("🔄 [KuisCreatePage] Navigating back to list...");
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
      <div className="role-page-shell p-4 sm:p-6 lg:p-8">
        <div className="role-page-content max-w-5xl space-y-6">
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
                Kembali
              </Button>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <FileText className="h-3.5 w-3.5" />
                  Setup Tugas Praktikum
                </div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Buat Tugas Praktikum
                </h1>
                <p className="text-sm text-blue-100 sm:text-base">
                  Pilih jenis tugas yang ingin diberikan agar alur penilaian
                  lebih terstruktur dan konsisten.
                </p>
              </div>
            </div>
          </section>

          <Card className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl dark:border-slate-700 dark:bg-slate-900/90">
            <CardContent className="p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Option 1: Laporan (WAJIB) */}
                <button
                  onClick={() => setSelectedType("laporan")}
                  className="group relative rounded-2xl border-2 border-green-200 bg-green-50/70 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-green-400 hover:bg-green-100/70 hover:shadow-xl"
                >
                  <StatusBadge status="success" pulse={false} className="absolute right-3 top-3">
                    WAJIB
                  </StatusBadge>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 transition-colors group-hover:bg-green-200">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-bold text-green-800">
                        📄 Laporan Praktikum
                      </h3>
                      <p className="text-sm text-green-700/80">
                        Mahasiswa membuat laporan dalam bentuk essay atau upload
                        file.
                      </p>
                      <div className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                        Essay • PDF • Word
                      </div>
                    </div>
                  </div>
                </button>

                {/* Option 2: Tes CBT (OPSIONAL) */}
                <button
                  onClick={() => setSelectedType("tes")}
                  className="group relative rounded-2xl border-2 border-blue-200 bg-blue-50/70 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-100/70 hover:shadow-xl"
                >
                  <StatusBadge
                    status="info"
                    pulse={false}
                    className="absolute right-3 top-3"
                  >
                    OPSIONAL
                  </StatusBadge>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 transition-colors group-hover:bg-blue-200">
                      <Monitor className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-bold text-blue-800">
                        🖥️ Tes CBT
                      </h3>
                      <p className="text-sm text-blue-700/80">
                        Pre-test atau Post-test dengan soal pilihan ganda
                        seperti UKOM.
                      </p>
                      <div className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                        Pilihan Ganda • Bank Soal
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div className="text-sm text-amber-800">
                    <strong>Info:</strong> Laporan praktikum{" "}
                    <strong>wajib</strong> ada untuk setiap praktikum. Sedangkan
                    tes (pre-test/post-test) bersifat <strong>opsional</strong>{" "}
                    — tidak semua praktikum memerlukan tes.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show QuizBuilder based on selected type
  return (
    <div className="role-page-shell p-4 sm:p-6 lg:p-8">
      <div className="role-page-content max-w-6xl space-y-6">
        {/* Header */}
        <section
          className={
            selectedType === "laporan"
              ? "relative overflow-hidden rounded-3xl border border-white/25 bg-linear-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white shadow-2xl sm:p-8"
              : "relative overflow-hidden rounded-3xl border border-white/25 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-2xl sm:p-8"
          }
        >
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/20 blur-3xl" />

          <div className="relative z-10 space-y-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedType(null)}
              className="border border-white/40 bg-white/15 text-white hover:bg-white/25"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali Pilih Jenis
            </Button>

            {selectedType === "laporan" ? (
              <>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Buat Tugas Laporan
                </h1>
                <p className="text-sm text-emerald-100 sm:text-base">
                  Mahasiswa akan membuat laporan praktikum dalam bentuk essay
                  atau upload file (PDF/Word).
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                    ✓ Essay
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                    ✓ Upload PDF/Word
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                    ✓ Penilaian Manual
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Buat Tes CBT
                </h1>
                <p className="text-sm text-blue-100 sm:text-base">
                  Buat soal pilihan ganda seperti ujian UKOM. Soal bisa dibuat
                  manual atau diambil dari Bank Soal.
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                    ✓ Pilihan Ganda
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                    ✓ Bank Soal
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm backdrop-blur-sm">
                    ✓ Penilaian Otomatis
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Form Builder */}
        <div className="rounded-3xl border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 sm:p-4 md:p-6">
          <QuizBuilder
            dosenId={dosenId}
            cbtMode={selectedType === "tes"}
            laporanMode={selectedType === "laporan"}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
