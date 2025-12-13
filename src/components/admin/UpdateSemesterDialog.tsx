/**
 * Update Semester Dialog Component
 *
 * Fitur:
 * - Update mahasiswa semester dengan validation
 * - Display smart recommendations untuk kelas baru
 * - Auto-enroll ke recommended kelas
 * - Show audit trail
 */

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

import {
  updateMahasiswaSemester,
  getSemesterRecommendations,
  enrollToRecommendedClass,
  getMahasiswaSemester,
} from "@/lib/api/mahasiswa-semester.api";

// ============================================================================
// TYPES
// ============================================================================

interface UpdateSemesterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mahasiswa: {
    id: string;
    nim: string;
    full_name: string;
    angkatan: number;
    semester: number;
    program_studi: string;
  };
  onSuccess?: () => void;
}

interface SelectedClass {
  [kelasId: string]: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UpdateSemesterDialog({
  open,
  onOpenChange,
  mahasiswa,
  onSuccess,
}: UpdateSemesterDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "recommendations" | "success">(
    "form",
  );

  // Form state
  const [semesterBaru, setSemesterBaru] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<SelectedClass>({});
  const [enrolling, setEnrolling] = useState(false);

  // Result state
  const [updateResult, setUpdateResult] = useState<any>(null);

  // Reset form saat dialog dibuka
  useEffect(() => {
    if (open) {
      setSemesterBaru("");
      setNotes("");
      setStep("form");
      setRecommendations([]);
      setSelectedClasses({});
      setUpdateResult(null);
    }
  }, [open]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleUpdateSemester = async () => {
    if (!semesterBaru) {
      toast.error("Pilih semester baru");
      return;
    }

    const newSemester = parseInt(semesterBaru);

    if (newSemester === mahasiswa.semester) {
      toast.error("Semester harus berbeda dengan semester sebelumnya");
      return;
    }

    if (newSemester < 1 || newSemester > 8) {
      toast.error("Semester harus antara 1-8");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Update semester
      const result = await updateMahasiswaSemester({
        mahasiswa_id: mahasiswa.id,
        semester_baru: newSemester,
        notes: notes || undefined,
      });

      if (!result.success) {
        toast.error(result.message);
        setIsLoading(false);
        return;
      }

      // 2. Show recommendations
      setUpdateResult(result);
      setRecommendations(result.recommendations);
      setStep("recommendations");
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || "Gagal update semester");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleClass = (kelasId: string) => {
    setSelectedClasses((prev) => ({
      ...prev,
      [kelasId]: !prev[kelasId],
    }));
  };

  const handleEnrollSelected = async () => {
    const selectedCount = Object.values(selectedClasses).filter(Boolean).length;

    if (selectedCount === 0) {
      toast.warning("Pilih minimal satu kelas");
      return;
    }

    setEnrolling(true);
    try {
      const enrollPromises = Object.entries(selectedClasses)
        .filter(([_, selected]) => selected)
        .map(([kelasId]) => enrollToRecommendedClass(mahasiswa.id, kelasId));

      await Promise.all(enrollPromises);

      toast.success(`${selectedCount} kelas berhasil di-enroll`);
      setStep("success");
    } catch (error: any) {
      toast.error(error.message || "Gagal enroll ke kelas");
    } finally {
      setEnrolling(false);
    }
  };

  const handleSkipEnroll = () => {
    setStep("success");
  };

  const handleClose = () => {
    onOpenChange(false);
    if (step === "success") {
      onSuccess?.();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* STEP 1: UPDATE FORM */}
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Update Semester Mahasiswa</DialogTitle>
              <DialogDescription>
                Update semester untuk {mahasiswa.full_name} (Angkatan{" "}
                {mahasiswa.angkatan})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Info Mahasiswa */}
              <Card className="bg-muted">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">NIM:</span>{" "}
                      {mahasiswa.nim}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Angkatan:</span>{" "}
                      {mahasiswa.angkatan}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Program:</span>{" "}
                      {mahasiswa.program_studi}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Semester Sekarang:
                      </span>
                      <Badge className="ml-2">{mahasiswa.semester}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Semester Selection */}
              <div className="space-y-2">
                <Label htmlFor="semester-baru">Semester Baru *</Label>
                <Select value={semesterBaru} onValueChange={setSemesterBaru}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester baru" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem
                        key={sem}
                        value={sem.toString()}
                        disabled={sem === mahasiswa.semester}
                      >
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Contoh: Naik semester regular, tidak ada tunggakan"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Info Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Setelah update, sistem akan menyarankan kelas yang sesuai
                  untuk semester baru. Anda bisa memilih untuk di-enroll ke
                  kelas tersebut.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button onClick={handleUpdateSemester} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Semester
              </Button>
            </DialogFooter>
          </>
        )}

        {/* STEP 2: RECOMMENDATIONS */}
        {step === "recommendations" && updateResult && (
          <>
            <DialogHeader>
              <DialogTitle>
                Rekomendasi Kelas - Semester {updateResult.semester_baru}
              </DialogTitle>
              <DialogDescription>
                Pilih kelas yang ingin di-enroll untuk semester baru
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Success Alert */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Semester berhasil diupdate dari {updateResult.semester_lama}{" "}
                  ke {updateResult.semester_baru}!
                </AlertDescription>
              </Alert>

              {/* Recommendations List */}
              {recommendations.length > 0 ? (
                <div className="space-y-3">
                  <Label>
                    Rekomendasi Kelas ({recommendations.length} tersedia)
                  </Label>
                  {recommendations.map((kelas) => (
                    <Card
                      key={kelas.kelas_id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedClasses[kelas.kelas_id] || false}
                            onCheckedChange={() =>
                              handleToggleClass(kelas.kelas_id)
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {kelas.nama_kelas}
                              </span>
                              <Badge variant="secondary">
                                Semester {kelas.semester_ajaran}
                              </Badge>
                              {kelas.semester_ajaran ===
                                updateResult.semester_baru && (
                                <Badge className="bg-green-600">Sesuai</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {kelas.dosen_name
                                ? `Dosen: ${kelas.dosen_name}`
                                : "Belum ada dosen"}
                            </div>
                            <div className="text-sm text-blue-600 mt-1">
                              {kelas.reason}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Tahun Ajaran: {kelas.tahun_ajaran}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Tidak ada rekomendasi kelas untuk semester{" "}
                    {updateResult.semester_baru}. Admin harus membuat kelas
                    terlebih dahulu.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleSkipEnroll}>
                Skip (Enroll Nanti)
              </Button>
              {recommendations.length > 0 && (
                <Button onClick={handleEnrollSelected} disabled={enrolling}>
                  {enrolling && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enroll ke Kelas Terpilih
                </Button>
              )}
            </DialogFooter>
          </>
        )}

        {/* STEP 3: SUCCESS */}
        {step === "success" && updateResult && (
          <>
            <DialogHeader>
              <DialogTitle>Selesai!</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Semester mahasiswa berhasil diupdate!
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Ringkasan Perubahan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama:</span>
                    <span className="font-medium">{mahasiswa.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Semester Lama:
                    </span>
                    <span className="font-medium">
                      {updateResult.semester_lama}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Semester Baru:
                    </span>
                    <Badge>{updateResult.semester_baru}</Badge>
                  </div>
                  {notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Catatan:</span>
                      <span className="text-right">{notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {Object.values(selectedClasses).some(Boolean) && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Mahasiswa sudah di-enroll ke{" "}
                    {Object.values(selectedClasses).filter(Boolean).length}{" "}
                    kelas baru.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Selesai
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
