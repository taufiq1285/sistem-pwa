/**
 * LogbookReviewPage - Dosen
 *
 * Purpose: Review dan nilai logbook mahasiswa
 * Features:
 * - View submitted logbooks from students
 * - Provide feedback on logbook entries
 * - Grade logbooks
 * - Filter by kelas, status, mahasiswa
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Loader2,
  FileText,
  Send,
  Star,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getLogbook,
  getLogbookStats,
  reviewLogbook,
  gradeLogbook,
} from "@/lib/api/logbook.api";
import { getKelas } from "@/lib/api/kelas.api";
import type {
  LogbookEntry,
  LogbookStats,
  DosenReviewData,
  GradeLogbookData,
} from "@/types/logbook.types";
import { toast } from "sonner";
import {
  LOGBOOK_STATUS_LABELS,
  LOGBOOK_STATUS_COLORS,
} from "@/types/logbook.types";
import { supabase } from "@/lib/supabase/client";
import { PageHeader } from "@/components/common/PageHeader";

// ============================================================================
// COMPONENT
// ============================================================================

export default function DosenLogbookReviewPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [logbookList, setLogbookList] = useState<LogbookEntry[]>([]);
  const [stats, setStats] = useState<LogbookStats | null>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);

  // Dialog states
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookEntry | null>(
    null,
  );

  // Form states
  const [feedback, setFeedback] = useState("");
  const [nilai, setNilai] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("submitted");
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.dosen?.id) {
      loadData();
      loadKelas();
    }
  }, [user?.dosen?.id]);

  useEffect(() => {
    if (user?.dosen?.id) {
      loadStats();
    }
  }, [user?.dosen?.id, selectedKelas]);

  // Sync nilai state when selectedLogbook changes
  useEffect(() => {
    if (selectedLogbook) {
      setNilai(selectedLogbook.nilai ?? 0);
    }
  }, [selectedLogbook]);

  // Sync feedback state when review dialog opens
  useEffect(() => {
    if (showReviewDialog && selectedLogbook) {
      setFeedback(selectedLogbook.dosen_feedback || "");
    }
  }, [showReviewDialog, selectedLogbook]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async function loadData() {
    if (!user?.dosen?.id) return;

    try {
      setLoading(true);

      // Load all logbooks (will be filtered client-side)
      const data = await getLogbook({});

      setLogbookList(data);
    } catch (error: any) {
      console.error("Error loading logbook:", error);
      toast.error(error.message || "Gagal memuat data logbook");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    if (!user?.dosen?.id) return;

    try {
      const statsData = await getLogbookStats({
        kelas_id: selectedKelas !== "all" ? selectedKelas : undefined,
      });

      setStats(statsData);
    } catch (error: any) {
      console.error("Error loading stats:", error);
    }
  }

  async function loadKelas() {
    try {
      const data = await getKelas();
      setKelasList(data);
    } catch (error: any) {
      console.error("Error loading kelas:", error);
    }
  }

  // ============================================================================
  // REVIEW LOGBOOK
  // ============================================================================

  function openReviewDialog(logbook: LogbookEntry | null) {
    if (!logbook) return;
    setSelectedLogbook(logbook);
    setShowReviewDialog(true);
  }

  async function handleReview() {
    if (!selectedLogbook) return;

    if (!feedback.trim()) {
      toast.error("Feedback harus diisi");
      return;
    }

    try {
      setSubmitting(true);

      const data: DosenReviewData = {
        id: selectedLogbook.id,
        feedback: feedback.trim(),
      };

      await reviewLogbook(data);

      toast.success("Logbook berhasil direview");
      setShowReviewDialog(false);
      setFeedback("");
      loadData();
      loadStats();
    } catch (error: any) {
      console.error("Error reviewing logbook:", error);
      toast.error(error.message || "Gagal mereview logbook");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================================
  // GRADE LOGBOOK
  // ============================================================================

  function openGradeDialog(logbook: LogbookEntry | null) {
    if (!logbook) return;
    setSelectedLogbook(logbook);
    setShowGradeDialog(true);
  }

  async function handleGrade() {
    if (!selectedLogbook) return;

    try {
      setSubmitting(true);

      const data: GradeLogbookData = {
        id: selectedLogbook.id,
        nilai: nilai,
      };

      await gradeLogbook(data);

      toast.success("Logbook berhasil dinilai");
      setShowGradeDialog(false);
      loadData();
      loadStats();
    } catch (error: any) {
      console.error("Error grading logbook:", error);
      toast.error(error.message || "Gagal menilai logbook");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================================
  // VIEW LOGBOOK
  // ============================================================================

  function openViewDialog(logbook: LogbookEntry | null) {
    if (!logbook) return;
    setSelectedLogbook(logbook);
    setShowViewDialog(true);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  function getStatusBadge(status: string) {
    const label = LOGBOOK_STATUS_LABELS[status] || status;
    const statusMap: Record<
      string,
      "success" | "warning" | "error" | "info" | "offline"
    > = {
      submitted: "info",
      reviewed: "warning",
      graded: "success",
      rejected: "error",
      draft: "offline",
    };
    const badgeStatus = statusMap[status] || "info";
    return (
      <StatusBadge status={badgeStatus} pulse={false}>
        {label}
      </StatusBadge>
    );
  }

  function getFilteredLogbooks(): LogbookEntry[] {
    let filtered = logbookList.filter(
      (l): l is LogbookEntry => l != null && "id" in l && "status" in l,
    );

    // Filter by kelas
    if (selectedKelas !== "all") {
      filtered = filtered.filter((l) => {
        // Need to get mahasiswa kelas from the data
        // This is a simplified approach
        return true; // TODO: Implement proper filtering
      });
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((l) => l.status === selectedStatus);
    }

    // Search by student name
    if (searchQuery) {
      filtered = filtered.filter((l) => {
        const name = l.mahasiswa?.user?.full_name;
        return name && name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    return filtered;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="role-page-shell">
        <div className="role-page-content app-container py-6">
          <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-slate-200/70 bg-white/85 px-6 shadow-lg shadow-slate-200/60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-sm font-medium text-muted-foreground sm:text-base">
              Memuat data review logbook...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const filteredLogbooks = getFilteredLogbooks();

  return (
    <div className="role-page-shell">
      <div className="role-page-content app-container space-y-6 py-4 sm:space-y-8 sm:py-6 lg:py-8">
        <PageHeader
          title="Review Logbook Mahasiswa"
          description="Tinjau catatan praktikum mahasiswa, berikan umpan balik, dan input nilai dengan tampilan yang lebih fokus dan responsif."
          className="section-shell"
        />

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card className="overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-primary/5 to-accent/10 shadow-lg shadow-primary/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-primary">
                  {stats.total_logbooks}
                </p>
                <p className="text-xs text-muted-foreground">Total Logbook</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border border-warning/20 bg-linear-to-br from-warning/5 to-warning/10 shadow-lg shadow-warning/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-warning">
                  {stats.submitted}
                </p>
                <p className="text-xs text-muted-foreground">Menunggu Review</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border border-info/20 bg-linear-to-br from-info/5 to-info/10 shadow-lg shadow-info/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-info">{stats.reviewed}</p>
                <p className="text-xs text-muted-foreground">Sudah Direview</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border border-success/20 bg-linear-to-br from-success/5 to-success/10 shadow-lg shadow-success/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-success">
                  {stats.graded}
                </p>
                <p className="text-xs text-muted-foreground">Sudah Dinilai</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border border-accent/20 bg-linear-to-br from-accent/5 to-accent/10 shadow-lg shadow-accent/10">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-accent">
                  {stats.average_grade?.toFixed(1) || "-"}
                </p>
                <p className="text-xs text-muted-foreground">Rata-rata Nilai</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="interactive-card overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>

              <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                <SelectTrigger className="w-full sm:w-55">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasList.map((kelas) => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama_kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="submitted">Menunggu Review</SelectItem>
                  <SelectItem value="reviewed">Sudah Direview</SelectItem>
                  <SelectItem value="graded">Sudah Dinilai</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Cari nama mahasiswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logbook List */}
        <div className="space-y-4">
          {filteredLogbooks.length === 0 ? (
            <Card className="overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-white/85 shadow-lg shadow-slate-200/60">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center sm:py-14">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                  <FileText className="h-8 w-8" />
                </div>
                <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                  {searchQuery ||
                  selectedKelas !== "all" ||
                  selectedStatus !== "submitted"
                    ? "Tidak ada logbook yang sesuai dengan filter"
                    : "Belum ada logbook yang perlu direview"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLogbooks.map((logbook) => (
              <Card
                key={logbook.id}
                className="interactive-card overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                          {logbook.mahasiswa?.user?.full_name || "Mahasiswa"}
                        </h3>
                        {getStatusBadge(logbook.status)}
                      </div>

                      <p className="text-sm text-muted-foreground mb-1">
                        {logbook.jadwal?.topik || "Praktikum"}
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {logbook.jadwal?.tanggal_praktikum && (
                          <span>
                            {format(
                              new Date(logbook.jadwal.tanggal_praktikum),
                              "dd MMM yyyy",
                            )}
                          </span>
                        )}
                        {logbook.jadwal?.laboratorium && (
                          <span>
                            Lab: {logbook.jadwal.laboratorium.nama_lab}
                          </span>
                        )}
                      </div>

                      {logbook.submitted_at && (
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Diserahkan:{" "}
                          {format(
                            new Date(logbook.submitted_at),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewDialog(logbook)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {logbook.status === "submitted" && (
                        <Button
                          size="sm"
                          onClick={() => openReviewDialog(logbook)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      )}

                      {(logbook.status === "reviewed" ||
                        logbook.status === "graded") && (
                        <Button
                          size="sm"
                          onClick={() => openGradeDialog(logbook)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Nilai
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  {logbook.prosedur_dilakukan && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Prosedur:</span>{" "}
                      <span className="text-muted-foreground line-clamp-2">
                        {logbook.prosedur_dilakukan}
                      </span>
                    </div>
                  )}

                  {logbook.skill_dipelajari &&
                    logbook.skill_dipelajari.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {logbook.skill_dipelajari.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                  {logbook.dosen_feedback && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-xs font-medium text-primary mb-1">
                        Feedback Anda:
                      </p>
                      <p className="text-sm text-primary/80">
                        {logbook.dosen_feedback}
                      </p>
                    </div>
                  )}

                  {logbook.nilai !== null && logbook.nilai !== undefined && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Nilai:
                      </span>
                      <span className="text-2xl font-bold text-success">
                        {logbook.nilai}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Logbook</DialogTitle>
              <DialogDescription>
                Berikan feedback pada logbook mahasiswa
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Student Info */}
              <div className="p-3 bg-muted/40 rounded-lg">
                <p className="text-sm font-medium">
                  Mahasiswa: {selectedLogbook?.mahasiswa?.user?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedLogbook?.jadwal?.topik} -{" "}
                  {selectedLogbook?.jadwal?.tanggal_praktikum &&
                    format(
                      new Date(selectedLogbook.jadwal.tanggal_praktikum),
                      "dd MMM yyyy",
                    )}
                </p>
              </div>

              {/* Logbook Content */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Prosedur:
                  </p>
                  <p className="text-sm bg-white p-2 rounded border">
                    {selectedLogbook?.prosedur_dilakukan || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Hasil Observasi:
                  </p>
                  <p className="text-sm bg-white p-2 rounded border">
                    {selectedLogbook?.hasil_observasi || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Skill:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLogbook?.skill_dipelajari?.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedLogbook?.kendala_dihadapi && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Kendala:
                    </p>
                    <p className="text-sm bg-white p-2 rounded border">
                      {selectedLogbook.kendala_dihadapi}
                    </p>
                  </div>
                )}

                {selectedLogbook?.refleksi && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Refleksi:
                    </p>
                    <p className="text-sm bg-white p-2 rounded border">
                      {selectedLogbook.refleksi}
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback Form */}
              <div>
                <Label htmlFor="feedback">
                  Feedback Dosen <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Berikan feedback untuk logbook mahasiswa ini..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button onClick={handleReview} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Kirim Feedback"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grade Dialog */}
        <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Beri Nilai Logbook</DialogTitle>
              <DialogDescription>
                Berikan nilai 0-100 untuk logbook ini
              </DialogDescription>
            </DialogHeader>

            {selectedLogbook && (
              <div className="space-y-4 py-4">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-sm font-medium">
                    Mahasiswa:{" "}
                    {selectedLogbook?.mahasiswa?.user?.full_name || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLogbook?.jadwal?.topik || "Praktikum"}
                  </p>
                  {selectedLogbook?.dosen_feedback && (
                    <p className="text-xs text-primary mt-1">
                      Sudah diberi feedback
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="nilai">Nilai (0-100)</Label>
                  <Input
                    id="nilai"
                    type="number"
                    min={0}
                    max={100}
                    value={nilai}
                    onChange={(e) => setNilai(Number(e.target.value))}
                    className="text-2xl font-bold"
                  />
                </div>

                {/* Grade Guide */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Panduan penilaian:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>90-100: Sangat Baik</li>
                    <li>80-89: Baik</li>
                    <li>70-79: Cukup</li>
                    <li>60-69: Kurang</li>
                    <li>&lt;60: Kurang Sekali</li>
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowGradeDialog(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button onClick={handleGrade} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Simpan Nilai
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Logbook</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mahasiswa</p>
                  <p className="font-medium">
                    {selectedLogbook?.mahasiswa?.user?.full_name}
                  </p>
                </div>
                {selectedLogbook && getStatusBadge(selectedLogbook.status)}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Topik
                </p>
                <p className="text-sm">{selectedLogbook?.jadwal?.topik}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                <div>
                  <p className="font-medium">Tanggal</p>
                  <p>
                    {selectedLogbook?.jadwal?.tanggal_praktikum &&
                      format(
                        new Date(selectedLogbook.jadwal.tanggal_praktikum),
                        "dd MMM yyyy",
                      )}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Lab</p>
                  <p>{selectedLogbook?.jadwal?.laboratorium?.nama_lab}</p>
                </div>
              </div>

              <hr />

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Prosedur
                  </p>
                  <p className="text-sm bg-white p-2 rounded border">
                    {selectedLogbook?.prosedur_dilakukan || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Hasil Observasi
                  </p>
                  <p className="text-sm bg-white p-2 rounded border">
                    {selectedLogbook?.hasil_observasi || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Skill
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLogbook?.skill_dipelajari?.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedLogbook?.kendala_dihadapi && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Kendala
                    </p>
                    <p className="text-sm bg-white p-2 rounded border">
                      {selectedLogbook.kendala_dihadapi}
                    </p>
                  </div>
                )}

                {selectedLogbook?.refleksi && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Refleksi
                    </p>
                    <p className="text-sm bg-white p-2 rounded border">
                      {selectedLogbook.refleksi}
                    </p>
                  </div>
                )}
              </div>

              {selectedLogbook?.dosen_feedback && (
                <>
                  <hr />
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-1">
                      Feedback Dosen:
                    </p>
                    <p className="text-sm text-primary/80">
                      {selectedLogbook.dosen_feedback}
                    </p>
                  </div>
                </>
              )}

              {selectedLogbook?.nilai !== null &&
                selectedLogbook?.nilai !== undefined && (
                  <>
                    <hr />
                    <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                      <p className="text-sm font-medium text-success">
                        Nilai: {selectedLogbook.nilai}
                      </p>
                    </div>
                  </>
                )}
            </div>

            <DialogFooter>
              <Button onClick={() => setShowViewDialog(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
