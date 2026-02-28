/**
 * Bank Soal Page
 *
 * Purpose: Manage reusable question bank for dosen
 * Features:
 * - View all saved questions
 * - Search and filter questions
 * - Create, edit, delete questions
 * - View usage statistics
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import {
  getBankSoal,
  getBankSoalStats,
  deleteBankSoal,
  createBankSoal,
  updateBankSoal,
} from "@/lib/api/bank-soal.api";
import type {
  BankSoal,
  BankSoalFilters,
  BankSoalStats,
  CreateBankSoalData,
} from "@/types/bank-soal.types";
import { TIPE_SOAL, TIPE_SOAL_LABELS } from "@/types/kuis.types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  BookOpen,
  TrendingUp,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { QuestionEditor } from "@/components/features/kuis/builder/QuestionEditor";

export default function BankSoalPage() {
  const { user } = useAuth();
  const [dosenId, setDosenId] = useState<string>("");

  const [questions, setQuestions] = useState<BankSoal[]>([]);
  const [stats, setStats] = useState<BankSoalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTipeSoal, setSelectedTipeSoal] = useState<string>(
    TIPE_SOAL.PILIHAN_GANDA,
  ); // Only pilihan ganda

  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankSoal | null>(null);

  // Fetch dosen ID
  useEffect(() => {
    const fetchDosenId = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("dosen")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (data) setDosenId(data.id);
      } catch (error) {
        console.error("Error fetching dosen ID:", error);
      }
    };

    fetchDosenId();
  }, [user]);

  // Load questions
  useEffect(() => {
    if (!dosenId) return;
    loadQuestions();
    loadStats();
  }, [dosenId, searchQuery, selectedTipeSoal]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);

      const filters: BankSoalFilters = {
        dosen_id: dosenId,
        sortBy: "created_at",
        sortOrder: "desc",
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }

      // Always filter only pilihan ganda
      filters.tipe_soal = TIPE_SOAL.PILIHAN_GANDA as any;

      const data = await getBankSoal(filters);
      setQuestions(data);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Gagal memuat bank soal");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getBankSoalStats(dosenId);
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus soal ini dari bank?")) return;

    try {
      await deleteBankSoal(id);
      toast.success("Soal berhasil dihapus");
      loadQuestions();
      loadStats();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Gagal menghapus soal");
    }
  };

  const handleEdit = (question: BankSoal) => {
    setEditingQuestion(question);
    setShowEditor(true);
  };

  const handleSaveQuestion = async (questionData: any) => {
    try {
      // Transform data from QuestionEditor format to BankSoal format
      // Remove kuis_id and urutan fields which don't exist in bank_soal
      const bankSoalData = {
        pertanyaan: questionData.pertanyaan,
        tipe_soal: questionData.tipe_soal,
        poin: questionData.poin,
        opsi_jawaban: questionData.opsi_jawaban || undefined,
        jawaban_benar: questionData.jawaban_benar || undefined,
        penjelasan: questionData.penjelasan || undefined,
        tags: questionData.tags || [],
      };

      if (editingQuestion) {
        // Update existing
        await updateBankSoal(editingQuestion.id, bankSoalData);
        toast.success("Soal berhasil diperbarui");
      } else {
        // Create new
        await createBankSoal({
          ...bankSoalData,
          dosen_id: dosenId,
        } as CreateBankSoalData);
        toast.success("Soal berhasil ditambahkan ke bank");
      }

      setShowEditor(false);
      setEditingQuestion(null);
      loadQuestions();
      loadStats();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Gagal menyimpan soal");
    }
  };

  if (showEditor) {
    if (!dosenId) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Bank Soal</h1>
          <p className="text-muted-foreground">Memuat data dosen…</p>
        </div>
      );
    }

    return (
      <QuestionEditor
        kuisId="bank" // Dummy kuis ID for bank
        dosenId={dosenId}
        question={editingQuestion as any}
        urutan={1}
        defaultPoin={1}
        cbtMode={true} // Force only pilihan ganda
        onSave={handleSaveQuestion}
        onCancel={() => {
          setShowEditor(false);
          setEditingQuestion(null);
        }}
      />
    );
  }

  return (
    <div className="role-page-shell">
      <div className="role-page-content space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-purple-600">
              Bank Soal
            </h1>
            <p className="text-sm sm:text-lg font-semibold text-muted-foreground">
              Kelola soal yang dapat digunakan kembali untuk kuis
            </p>
          </div>

          <Button
            onClick={() => setShowEditor(true)}
            className="w-full sm:w-auto bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Soal Baru
          </Button>
        </div>

        {/* Statistics Cards - Only Pilihan Ganda */}
        {stats && (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <Card className="interactive-card border-0 shadow-lg bg-linear-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-blue-900">
                  Total Soal Pilihan Ganda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div className="text-3xl sm:text-4xl font-bold text-blue-900">
                    {stats.pilihan_ganda_count}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="interactive-card border-0 shadow-lg bg-linear-to-br from-orange-50 to-amber-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-orange-900">
                  Total Penggunaan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <div className="text-3xl sm:text-4xl font-bold text-orange-900">
                    {stats.total_usage}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="interactive-card border-0 shadow-lg bg-linear-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-green-900">
                  Rata-rata Poin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <div className="text-3xl sm:text-4xl font-bold text-green-900">
                    {stats.pilihan_ganda_count > 0
                      ? Math.round(stats.total_usage / stats.pilihan_ganda_count)
                      : 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search - Only Pilihan Ganda */}
        <Card className="interactive-card border-0 shadow-xl p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Pencarian Soal Pilihan Ganda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari soal pilihan ganda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="interactive-card border-0 shadow-xl p-8 sm:p-12">
              <CardContent className="text-center">
                <p className="text-base font-semibold">Memuat soal...</p>
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card className="interactive-card border-0 shadow-xl p-8 sm:p-12">
              <CardContent className="text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-base font-semibold mb-4">
                  Belum ada soal di bank
                </p>
                <Button onClick={() => setShowEditor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Soal Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            questions.map((q) => (
              <Card key={q.id} className="interactive-card border-0 shadow-xl p-4 sm:p-6">
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-semibold">
                          {q.poin} poin
                        </Badge>
                        <Badge variant="secondary" className="font-semibold">
                          {
                            TIPE_SOAL_LABELS[
                              q.tipe_soal as keyof typeof TIPE_SOAL_LABELS
                            ]
                          }
                        </Badge>
                        {q.usage_count && q.usage_count > 0 && (
                          <Badge
                            variant="outline"
                            className="text-sm font-semibold"
                          >
                            {q.usage_count}x digunakan
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm sm:text-base font-medium">{q.pertanyaan}</p>
                      {q.tags && q.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-sm font-semibold"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(q)}
                        className="font-semibold"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q.id)}
                        className="text-destructive hover:text-destructive font-semibold"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
