/**
 * LogbookReviewPage - Dosen
 *
 * Purpose: Nilai logbook mahasiswa
 * Features:
 * - View submitted logbooks from students
 * - Input nilai logbook
 * - Provide feedback on logbook entries
 * - Filter by kelas, status, mahasiswa
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Loader2,
  FileText,
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
  gradeLogbook,
} from "@/lib/api/logbook.api";
import { notifyMahasiswaLogbookApproved } from "@/lib/api/notification.api";
import { invalidateCache } from "@/lib/offline/api-cache";
import { queueManager } from "@/lib/offline/queue-manager";
import { getKelas } from "@/lib/api/kelas.api";
import type {
  LogbookEntry,
  LogbookStats,
  GradeLogbookData,
} from "@/types/logbook.types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { PageHeader, CardListSkeleton, EmptyState } from "@/components/common";

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
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookEntry | null>(
    null,
  );

  // Form states
  const [nilai, setNilai] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedMataKuliah, setSelectedMataKuliah] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
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
  }, [user?.dosen?.id, selectedKelas, selectedMataKuliah]);

  // Sync nilai state when selectedLogbook changes
  useEffect(() => {
    if (selectedLogbook) {
      setNilai(selectedLogbook.nilai ?? 0);
      setFeedback(selectedLogbook.dosen_feedback || "");
    }
  }, [selectedLogbook]);

  async function notifyMahasiswaLogbookStatus(logbookId: string) {
    const supabaseAny = supabase as any;
    const { data: logbookNotifData, error } = await supabaseAny
      .from("logbook_entries")
      .select(
        `
        id,
        mahasiswa:mahasiswa_id (
          user_id
        ),
        jadwal:jadwal_id (
          tanggal_praktikum,
          mata_kuliah:mata_kuliah_id (
            nama_mk
          ),
          kelas:kelas_id (
            nama_kelas,
            mata_kuliah:mata_kuliah_id (
              nama_mk
            )
          )
        )
      `,
      )
      .eq("id", logbookId)
      .single();

    if (error) throw error;

    const mahasiswaUserId = (logbookNotifData as any)?.mahasiswa?.user_id;
    if (!mahasiswaUserId) return;

    const kelasNama =
      (logbookNotifData as any)?.jadwal?.kelas?.nama_kelas || "Kelas";
    const mataKuliahNama =
      (logbookNotifData as any)?.jadwal?.mata_kuliah?.nama_mk ||
      (logbookNotifData as any)?.jadwal?.kelas?.mata_kuliah?.nama_mk ||
      "Mata Kuliah";
    const tanggalPraktikum =
      (logbookNotifData as any)?.jadwal?.tanggal_praktikum ||
      new Date().toISOString();

    await notifyMahasiswaLogbookApproved(
      mahasiswaUserId,
      kelasNama,
      mataKuliahNama,
      tanggalPraktikum,
    );
  }

  async function refreshAfterLogbookMutation(logbook?: LogbookEntry | null) {
    if (logbook?.mahasiswa_id) {
      await invalidateCache(
        `mahasiswa_logbook_entries_${logbook.mahasiswa_id}`,
      );
    }

    window.dispatchEvent(
      new CustomEvent("logbook:changed", {
        detail: {
          id: logbook?.id,
          mahasiswa_id: logbook?.mahasiswa_id,
        },
      }),
    );

    await Promise.all([loadData(), loadStats()]);
  }

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
        mata_kuliah_id:
          selectedMataKuliah !== "all" ? selectedMataKuliah : undefined,
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
  // NILAI LOGBOOK
  // ============================================================================

  function openGradeDialog(logbook: LogbookEntry | null) {
    if (!logbook) return;
    setSelectedLogbook(logbook);
    setShowGradeDialog(true);
  }

  async function handleGrade() {
    if (!selectedLogbook) return;

    if (nilai < 0 || nilai > 100) {
      toast.error("Nilai harus antara 0 dan 100");
      return;
    }

    if (!feedback.trim()) {
      toast.error("Feedback pemeriksaan logbook harus diisi");
      return;
    }

    if (!navigator.onLine) {
      try {
        setSubmitting(true);
        await queueManager.enqueue("logbook_entry", "update", {
          id: selectedLogbook.id,
          dosen_id: user?.dosen?.id,
          nilai: nilai,
          dosen_feedback: feedback.trim() || null,
          status: "graded",
        });
        setLogbookList((prev) =>
          prev.map((l) =>
            l.id === selectedLogbook.id
              ? {
                  ...l,
                  nilai,
                  dosen_feedback: feedback.trim() || null,
                  status: "graded",
                }
              : l,
          ),
        );
        setShowGradeDialog(false);
        toast.success("Nilai disimpan lokal. Akan dikirim saat online.");
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan nilai secara lokal");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);

      const data: GradeLogbookData = {
        id: selectedLogbook.id,
        nilai: nilai,
        feedback: feedback.trim() || undefined,
      };

      await gradeLogbook(data);
      await notifyMahasiswaLogbookStatus(selectedLogbook.id).catch(
        (notifError) => {
          console.error(
            "Failed to notify mahasiswa after logbook scoring:",
            notifError,
          );
        },
      );

      toast.success("Logbook berhasil dinilai");
      setShowGradeDialog(false);
      setFeedback("");
      setSelectedStatus("all");
      await refreshAfterLogbookMutation(selectedLogbook);
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
    const config: Record<
      string,
      {
        label: string;
        icon: typeof Clock;
        className: string;
        dotClassName: string;
      }
    > = {
      draft: {
        label: "Draft",
        icon: FileText,
        className: "border-slate-200 bg-slate-50 text-slate-700",
        dotClassName: "bg-slate-400",
      },
      submitted: {
        label: "Perlu Dinilai",
        icon: Clock,
        className: "border-sky-200 bg-sky-50 text-sky-800",
        dotClassName: "bg-sky-500",
      },
      reviewed: {
        label: "Perlu Dinilai",
        icon: Clock,
        className: "border-amber-200 bg-amber-50 text-amber-800",
        dotClassName: "bg-amber-500",
      },
      graded: {
        label: "Dinilai",
        icon: CheckCircle2,
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        dotClassName: "bg-emerald-500",
      },
    };
    const badge = config[status] || {
      label: status,
      icon: AlertCircle,
      className: "border-slate-200 bg-slate-50 text-slate-700",
      dotClassName: "bg-slate-400",
    };
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm ${badge.className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClassName}`} />
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  }

  function getFilteredLogbooks(): LogbookEntry[] {
    let filtered = logbookList.filter(
      (l): l is LogbookEntry => l != null && "id" in l && "status" in l,
    );

    // Filter by kelas
    if (selectedKelas !== "all") {
      filtered = filtered.filter((l) => l.jadwal?.kelas_id === selectedKelas);
    }

    // Filter by mata kuliah so the same class can be reviewed per subject.
    if (selectedMataKuliah !== "all") {
      filtered = filtered.filter(
        (l) => l.jadwal?.mata_kuliah_id === selectedMataKuliah,
      );
    }

    // Filter by status
    if (selectedStatus === "needs_score") {
      filtered = filtered.filter(
        (l) => l.status === "submitted" || l.status === "reviewed",
      );
    } else if (selectedStatus !== "all") {
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

  const mataKuliahOptions = Array.from(
    new Map(
      logbookList
        .filter((logbook) => logbook.jadwal?.mata_kuliah_id)
        .filter(
          (logbook) =>
            selectedKelas === "all" ||
            logbook.jadwal?.kelas_id === selectedKelas,
        )
        .map((logbook) => [
          logbook.jadwal?.mata_kuliah_id,
          {
            id: logbook.jadwal?.mata_kuliah_id || "",
            nama_mk: logbook.jadwal?.mata_kuliah?.nama_mk || "Mata Kuliah",
            kode_mk: logbook.jadwal?.mata_kuliah?.kode_mk || "",
          },
        ]),
    ).values(),
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Penilaian Logbook Mahasiswa
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tinjau catatan praktikum mahasiswa, beri nilai angka, dan tulis
              feedback untuk mahasiswa.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[76px] skeleton-shimmer rounded-3xl" />
          ))}
        </div>
        <CardListSkeleton count={4} />
      </div>
    );
  }

  const filteredLogbooks = getFilteredLogbooks();

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Penilaian Logbook Mahasiswa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tinjau catatan praktikum mahasiswa, beri nilai angka, dan tulis
            feedback untuk mahasiswa.
          </p>
        </div>
      </div>

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
                {stats.submitted + stats.reviewed}
              </p>
              <p className="text-xs text-muted-foreground">Perlu Dinilai</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-3xl border border-success/20 bg-linear-to-br from-success/5 to-success/10 shadow-lg shadow-success/10">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-success">{stats.graded}</p>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>

            <Select
              value={selectedKelas}
              onValueChange={(value) => {
                setSelectedKelas(value);
                setSelectedMataKuliah("all");
              }}
            >
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

            <Select
              value={selectedMataKuliah}
              onValueChange={setSelectedMataKuliah}
            >
              <SelectTrigger className="w-full sm:w-60">
                <SelectValue placeholder="Pilih Mata Kuliah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                {mataKuliahOptions.map((mk) => (
                  <SelectItem key={mk.id} value={mk.id}>
                    {mk.nama_mk}
                    {mk.kode_mk ? ` - ${mk.kode_mk}` : ""}
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
                <SelectItem value="needs_score">Perlu Dinilai</SelectItem>
                <SelectItem value="submitted">Baru Dikirim</SelectItem>
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
          <EmptyState
            variant={
              searchQuery ||
              selectedKelas !== "all" ||
              selectedMataKuliah !== "all" ||
              selectedStatus !== "all"
                ? "no-results"
                : "no-data"
            }
            context="logbook"
            onAction={() => {
              setSearchQuery("");
              setSelectedKelas("all");
              setSelectedMataKuliah("all");
              setSelectedStatus("all");
            }}
            actionLabel="Reset Filter"
          />
        ) : (
          filteredLogbooks.map((logbook) => (
            <Card
              key={logbook.id}
              className={
                logbook.status === "graded"
                  ? "interactive-card overflow-hidden rounded-3xl border border-success/30 bg-success/5 shadow-lg shadow-success/10"
                  : "interactive-card overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 shadow-lg shadow-slate-200/60"
              }
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

                    <p className="text-xs font-medium text-primary mb-1">
                      {logbook.jadwal?.mata_kuliah?.nama_mk || "Mata Kuliah"}
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
                        <span>Lab: {logbook.jadwal.laboratorium.nama_lab}</span>
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

                    {logbook.status === "graded" && (
                      <p className="mt-2 inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        Logbook telah dinilai dan tetap tersimpan di riwayat
                        dosen
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

                    {(logbook.status === "submitted" ||
                      logbook.status === "reviewed" ||
                      logbook.status === "graded") && (
                      <Button
                        size="sm"
                        onClick={() => openGradeDialog(logbook)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {logbook.status === "graded"
                          ? "Ubah Nilai & Feedback"
                          : "Nilai & Feedback"}
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

                {logbook.dosen_feedback && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="mb-1 text-xs font-medium text-primary">
                      Feedback:
                    </p>
                    <p className="text-sm text-primary/80">
                      {logbook.dosen_feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Nilai Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nilai Logbook</DialogTitle>
            <DialogDescription>
              Periksa isi logbook mahasiswa, lalu simpan nilai dan feedback
              pemeriksaan.
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

              <div>
                <Label htmlFor="feedback-nilai">
                  Feedback Pemeriksaan <span className="text-danger">*</span>
                </Label>
                <Textarea
                  id="feedback-nilai"
                  placeholder="Contoh: Prosedur sudah runtut, namun refleksi perlu diperjelas pada bagian kendala praktikum."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="rounded-lg border border-muted bg-muted/30 p-3 text-xs text-muted-foreground">
                Simpan nilai dalam angka 0-100. Mahasiswa hanya akan melihat
                nilai angka dan feedback pemeriksaan, tanpa grade huruf atau
                predikat.
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
                  Simpan Nilai & Feedback
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
              <p className="text-sm font-medium text-muted-foreground">Topik</p>
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

            {selectedLogbook?.dosen_feedback && (
              <>
                <hr />
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="mb-1 text-sm font-medium text-primary">
                    Feedback Dosen:
                  </p>
                  <p className="text-sm text-primary/80">
                    {selectedLogbook.dosen_feedback}
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
  );
}
