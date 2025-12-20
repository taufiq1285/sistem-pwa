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
  const [selectedTipeSoal, setSelectedTipeSoal] = useState<string>(TIPE_SOAL.PILIHAN_GANDA); // Only pilihan ganda

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
    return (
      <QuestionEditor
        kuisId="bank" // Dummy kuis ID for bank
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Soal</h1>
          <p className="text-muted-foreground">
            Kelola soal yang dapat digunakan kembali untuk kuis
          </p>
        </div>

        <Button onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Soal Baru
        </Button>
      </div>

      {/* Statistics Cards - Only Pilihan Ganda */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Soal Pilihan Ganda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div className="text-2xl font-bold">{stats.pilihan_ganda_count}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Penggunaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div className="text-2xl font-bold">{stats.total_usage}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rata-rata Poin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <div className="text-2xl font-bold">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pencarian Soal Pilihan Ganda</CardTitle>
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
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Memuat soal...</p>
            </CardContent>
          </Card>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
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
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{q.poin} poin</Badge>
                      <Badge variant="secondary">
                        {TIPE_SOAL_LABELS[q.tipe_soal as keyof typeof TIPE_SOAL_LABELS]}
                      </Badge>
                      {q.usage_count && q.usage_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {q.usage_count}x digunakan
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{q.pertanyaan}</p>
                    {q.tags && q.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {q.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(q)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(q.id)}
                      className="text-destructive hover:text-destructive"
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
  );
}
