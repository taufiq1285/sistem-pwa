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
import { ArrowLeft, Monitor, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Show error if no dosen ID found
  if (!dosenId && user) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="text-center text-red-500">
          Error: Data dosen tidak ditemukan. Silakan logout dan login kembali.
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
      <div className="container mx-auto py-6 max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dosen/kuis")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        {/* Choice Card */}
        <Card className="overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white text-center">
            <div className="text-5xl mb-4">📋</div>
            <h1 className="text-2xl font-bold mb-2">Buat Tugas Praktikum</h1>
            <p className="text-white/90">
              Pilih jenis tugas yang ingin diberikan
            </p>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Laporan (WAJIB) */}
              <button
                onClick={() => setSelectedType("laporan")}
                className="group relative p-6 rounded-xl border-2 border-green-200 hover:border-green-400 bg-green-50/50 hover:bg-green-100/50 transition-all text-left"
              >
                <Badge className="absolute top-3 right-3 bg-green-600">
                  WAJIB
                </Badge>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-green-800 mb-2">
                      📄 Laporan Praktikum
                    </h3>
                    <p className="text-sm text-green-700/80">
                      Mahasiswa membuat laporan dalam bentuk essay atau upload
                      file.
                    </p>
                    <div className="mt-3 text-xs text-green-600 bg-green-100 rounded-full px-3 py-1 inline-block">
                      Essay • PDF • Word
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: Tes CBT (OPSIONAL) */}
              <button
                onClick={() => setSelectedType("tes")}
                className="group relative p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-100/50 transition-all text-left"
              >
                <Badge
                  variant="outline"
                  className="absolute top-3 right-3 border-blue-400 text-blue-600"
                >
                  OPSIONAL
                </Badge>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Monitor className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-blue-800 mb-2">
                      🖥️ Tes CBT
                    </h3>
                    <p className="text-sm text-blue-700/80">
                      Pre-test atau Post-test dengan soal pilihan ganda seperti
                      UKOM.
                    </p>
                    <div className="mt-3 text-xs text-blue-600 bg-blue-100 rounded-full px-3 py-1 inline-block">
                      Pilihan Ganda • Bank Soal
                    </div>
                  </div>
                </div>
              </button>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong>Info:</strong> Laporan praktikum{" "}
                  <strong>wajib</strong> ada untuk setiap praktikum. Sedangkan
                  tes (pre-test/post-test) bersifat <strong>opsional</strong> -
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
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedType(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali Pilih Jenis
        </Button>

        {/* Hero Section - Different based on type */}
        {selectedType === "laporan" ? (
          <div className="relative overflow-hidden rounded-xl bg-linear-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white shadow-lg">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Buat Tugas Laporan</h1>
                  <p className="text-white/80 text-sm">
                    Laporan Praktikum (Essay/Upload)
                  </p>
                </div>
              </div>
              <p className="text-white/90">
                Mahasiswa akan membuat laporan praktikum dalam bentuk essay atau
                mengupload file (PDF/Word).
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">
                  ✓ Essay
                </div>
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">
                  ✓ Upload PDF/Word
                </div>
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">
                  ✓ Penilaian Manual
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl bg-linear-to-rm-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <Monitor className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Buat Tes CBT</h1>
                  <p className="text-white/80 text-sm">
                    Pre-test / Post-test (Opsional)
                  </p>
                </div>
              </div>
              <p className="text-white/90">
                Buat soal pilihan ganda seperti ujian UKOM. Soal bisa dibuat
                manual atau diambil dari Bank Soal.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">
                  ✓ Pilihan Ganda
                </div>
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">
                  ✓ Bank Soal
                </div>
                <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">
                  ✓ Penilaian Otomatis
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Builder */}
      <QuizBuilder
        dosenId={dosenId}
        cbtMode={selectedType === "tes"}
        laporanMode={selectedType === "laporan"}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
