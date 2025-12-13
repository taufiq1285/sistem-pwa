/**
 * Add From Bank Dialog
 *
 * Purpose: Dialog to select questions from bank and add to quiz
 * Features:
 * - Browse bank questions
 * - Search and filter
 * - Multi-select questions
 * - Preview before adding
 */

import { useState, useEffect } from "react";
import { getBankSoal, addQuestionsFromBank } from "@/lib/api/bank-soal.api";
import type { BankSoal, BankSoalFilters } from "@/types/bank-soal.types";
import { TIPE_SOAL, TIPE_SOAL_LABELS } from "@/types/kuis.types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, CheckSquare, Square, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface AddFromBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kuisId: string;
  dosenId: string;
  nextUrutan: number; // Next question order number
  onSuccess: () => void;
}

export function AddFromBankDialog({
  open,
  onOpenChange,
  kuisId,
  dosenId,
  nextUrutan,
  onSuccess,
}: AddFromBankDialogProps) {
  const [questions, setQuestions] = useState<BankSoal[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTipeSoal, setSelectedTipeSoal] = useState<string>("all");

  useEffect(() => {
    if (open) {
      loadQuestions();
      setSelectedIds([]); // Reset selection
    }
  }, [open, dosenId, searchQuery, selectedTipeSoal]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);

      const filters: BankSoalFilters = {
        dosen_id: dosenId,
        sortBy: "usage_count",
        sortOrder: "desc",
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }

      if (selectedTipeSoal && selectedTipeSoal !== "all") {
        filters.tipe_soal = selectedTipeSoal as any;
      }

      const data = await getBankSoal(filters);
      setQuestions(data);
    } catch (error) {
      console.error("Error loading bank questions:", error);
      toast.error("Gagal memuat bank soal");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal 1 soal");
      return;
    }

    try {
      setIsAdding(true);

      await addQuestionsFromBank(kuisId, selectedIds, nextUrutan);

      toast.success(`${selectedIds.length} soal berhasil ditambahkan`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding questions:", error);
      toast.error("Gagal menambahkan soal");
    } finally {
      setIsAdding(false);
    }
  };

  const totalPoints = questions
    .filter((q) => selectedIds.includes(q.id))
    .reduce((sum, q) => sum + q.poin, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Ambil Soal dari Bank</DialogTitle>
          <DialogDescription>
            Pilih soal yang ingin ditambahkan ke kuis ini
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari soal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedTipeSoal} onValueChange={setSelectedTipeSoal}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Semua tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value={TIPE_SOAL.PILIHAN_GANDA}>
                  {TIPE_SOAL_LABELS.pilihan_ganda}
                </SelectItem>
                <SelectItem value={TIPE_SOAL.ESSAY}>
                  {TIPE_SOAL_LABELS.essay}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select All */}
          {questions.length > 0 && (
            <div className="flex items-center gap-2 py-2 border-b">
              <Checkbox
                checked={selectedIds.length === questions.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedIds.length === questions.length
                  ? "Batalkan Pilih Semua"
                  : "Pilih Semua"}
              </span>
              <span className="text-sm text-muted-foreground ml-auto">
                {selectedIds.length} dari {questions.length} soal dipilih
              </span>
            </div>
          )}
        </div>

        {/* Questions List */}
        <ScrollArea className="h-[250px] pr-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Memuat soal...
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Tidak ada soal di bank soal
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => {
                const isSelected = selectedIds.includes(q.id);

                return (
                  <div
                    key={q.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleSelection(q.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(q.id)}
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{q.poin} poin</Badge>
                          <Badge variant="secondary">
                            {
                              TIPE_SOAL_LABELS[
                                q.tipe_soal as keyof typeof TIPE_SOAL_LABELS
                              ]
                            }
                          </Badge>
                          {q.usage_count && q.usage_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {q.usage_count}x digunakan
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm font-medium leading-relaxed">
                          {q.pertanyaan}
                        </p>

                        {q.tags && q.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {q.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Summary */}
        {selectedIds.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Ringkasan Pilihan:</span>
              <div className="flex gap-4">
                <span>
                  <strong>{selectedIds.length}</strong> soal
                </span>
                <span>
                  <strong>{totalPoints}</strong> poin total
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleAdd}
            disabled={selectedIds.length === 0 || isAdding}
          >
            {isAdding ? "Menambahkan..." : `Tambahkan ${selectedIds.length} Soal`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
