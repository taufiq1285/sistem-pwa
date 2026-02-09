/**
 * LogbookPage - Mahasiswa
 *
 * Purpose: Digital logbook untuk mencatat pengalaman praktikum
 * Features:
 * - Create logbook per jadwal praktikum
 * - Edit draft logbook
 * - Submit logbook for review
 * - View feedback and grades from dosen
 * - Track logbook status (draft → submitted → reviewed → graded)
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import {
  Loader2,
  BookOpen,
  Plus,
  Edit,
  Send,
  Eye,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
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
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getLogbook,
  createLogbook,
  updateLogbook,
  submitLogbook,
  deleteLogbook,
} from "@/lib/api/logbook.api";
import { getJadwal } from "@/lib/api/jadwal.api";
import { getKelas } from "@/lib/api/kelas.api";
import type {
  LogbookEntry,
  CreateLogbookData,
  SubmitLogbookData,
} from "@/types/logbook.types";
import type { Jadwal } from "@/types/jadwal.types";
import { toast } from "sonner";
import {
  LOGBOOK_STATUS_LABELS,
  LOGBOOK_STATUS_COLORS,
  SKILL_KEBIDANAN,
} from "@/types/logbook.types";

// ============================================================================
// COMPONENT
// ============================================================================

export default function MahasiswaLogbookPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [logbookList, setLogbookList] = useState<LogbookEntry[]>([]);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedLogbook, setSelectedLogbook] = useState<LogbookEntry | null>(null);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<CreateLogbookData>>({
    prosedur_dilakukan: "",
    hasil_observasi: "",
    skill_dipelajari: [],
    kendala_dihadapi: "",
    refleksi: "",
    catatan_tambahan: "",
  });

  // Submit validation
  const [submitting, setSubmitting] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.mahasiswa?.id) {
      loadData();
    }
  }, [user?.mahasiswa?.id]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async function loadData() {
    if (!user?.mahasiswa?.id) return;

    try {
      setLoading(true);

      // Load jadwal for this mahasiswa's kelas
      const { data: enrollments } = await supabase
        .from("kelas_mahasiswa")
        .select("kelas_id")
        .eq("mahasiswa_id", user.mahasiswa.id);

      console.log("🔍 [DEBUG] Enrollments:", enrollments);

      if (enrollments && enrollments.length > 0) {
        const kelasIds = enrollments.map((e) => e.kelas_id);
        console.log("🔍 [DEBUG] Kelas IDs:", kelasIds);

        // Get upcoming jadwal for enrolled kelas
        const jadwalData = await getJadwal({
          is_active: true,
        });

        console.log("🔍 [DEBUG] All active jadwal:", jadwalData.length, "items");
        console.log("🔍 [DEBUG] Sample jadwal data:", jadwalData.slice(0, 3).map(j => ({
          id: j.id,
          topik: j.topik,
          kelas_id: j.kelas_id,
          status: j.status,
          is_active: j.is_active,
        })));

        // Filter jadwal by enrolled kelas
        const myJadwal = jadwalData.filter((jadwal) => {
          const match = kelasIds.includes(jadwal.kelas_id || "");
          if (!match && jadwal.kelas_id) {
            console.log("⚠️ [DEBUG] Skipping jadwal - kelas mismatch:", {
              jadwal_id: jadwal.id,
              jadwal_kelas_id: jadwal.kelas_id,
              enrolled_ids: kelasIds,
            });
          }
          return match;
        });

        console.log("🔍 [DEBUG] My jadwal after filter:", myJadwal.length, "items");
        setJadwalList(myJadwal);
      } else {
        console.warn("⚠️ [DEBUG] No enrollments found for mahasiswa:", user.mahasiswa.id);
      }

      // Load logbook entries
      const logbookData = await getLogbook({
        mahasiswa_id: user.mahasiswa.id,
      });

      console.log("🔍 [DEBUG] Logbook entries:", logbookData.length, "items");

      // Filter out any null entries
      setLogbookList(logbookData.filter((l): l is LogbookEntry => l != null && 'id' in l));
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(error.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // CREATE LOGBOOK
  // ============================================================================

  function openCreateDialog(jadwal: Jadwal) {
    setSelectedJadwal(jadwal);
    setFormData({
      prosedur_dilakukan: "",
      hasil_observasi: "",
      skill_dipelajari: [],
      kendala_dihadapi: "",
      refleksi: "",
      catatan_tambahan: "",
    });
    setShowCreateDialog(true);
  }

  async function handleCreateLogbook() {
    if (!selectedJadwal) return;

    // Validate required fields
    if (!formData.prosedur_dilakukan || !formData.hasil_observasi) {
      toast.error("Prosedur dan Hasil Observasi harus diisi");
      return;
    }

    try {
      setSubmitting(true);

      const data: CreateLogbookData = {
        jadwal_id: selectedJadwal.id,
        ...formData,
      };

      await createLogbook(data);

      toast.success("Logbook berhasil dibuat");
      setShowCreateDialog(false);
      loadData();
    } catch (error: any) {
      console.error("Error creating logbook:", error);
      toast.error(error.message || "Gagal membuat logbook");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================================
  // EDIT LOGBOOK
  // ============================================================================

  function openEditDialog(logbook: LogbookEntry) {
    setSelectedLogbook(logbook);
    setFormData({
      prosedur_dilakukan: logbook.prosedur_dilakukan || "",
      hasil_observasi: logbook.hasil_observasi || "",
      skill_dipelajari: logbook.skill_dipelajari || [],
      kendala_dihadapi: logbook.kendala_dihadapi || "",
      refleksi: logbook.refleksi || "",
      catatan_tambahan: logbook.catatan_tambahan || "",
    });
    setShowEditDialog(true);
  }

  async function handleUpdateLogbook() {
    if (!selectedLogbook) return;

    try {
      setSubmitting(true);

      await updateLogbook({
        id: selectedLogbook.id,
        ...formData,
      });

      toast.success("Logbook berhasil diperbarui");
      setShowEditDialog(false);
      loadData();
    } catch (error: any) {
      console.error("Error updating logbook:", error);
      toast.error(error.message || "Gagal memperbarui logbook");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================================
  // SUBMIT LOGBOOK
  // ============================================================================

  function openSubmitDialog(logbook: LogbookEntry) {
    setSelectedLogbook(logbook);
    setShowSubmitDialog(true);
  }

  async function handleSubmitLogbook() {
    if (!selectedLogbook) return;

    // Validate required fields before submit
    if (
      !selectedLogbook.prosedur_dilakukan ||
      !selectedLogbook.hasil_observasi ||
      !selectedLogbook.skill_dipelajari ||
      selectedLogbook.skill_dipelajari.length === 0
    ) {
      toast.error(
        "Mohon lengkapi semua field wajib (Prosedur, Hasil Observasi, Skill)",
      );
      return;
    }

    try {
      setSubmitting(true);

      const data: SubmitLogbookData = {
        id: selectedLogbook.id,
        prosedur_dilakukan: selectedLogbook.prosedur_dilakukan,
        hasil_observasi: selectedLogbook.hasil_observasi,
        skill_dipelajari: selectedLogbook.skill_dipelajari,
      };

      await submitLogbook(data);

      toast.success("Logbook berhasil diserahkan untuk direview");
      setShowSubmitDialog(false);
      loadData();
    } catch (error: any) {
      console.error("Error submitting logbook:", error);
      toast.error(error.message || "Gagal menyerahkan logbook");
    } finally {
      setSubmitting(false);
    }
  }

  // ============================================================================
  // DELETE LOGBOOK
  // ============================================================================

  async function handleDeleteLogbook(id: string) {
    if (!confirm("Yakin ingin menghapus logbook ini?")) return;

    try {
      await deleteLogbook(id);
      toast.success("Logbook berhasil dihapus");
      loadData();
    } catch (error: any) {
      console.error("Error deleting logbook:", error);
      toast.error(error.message || "Gagal menghapus logbook");
    }
  }

  // ============================================================================
  // VIEW LOGBOOK
  // ============================================================================

  function openViewDialog(logbook: LogbookEntry) {
    setSelectedLogbook(logbook);
    setShowViewDialog(true);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  function getStatusBadge(status: string) {
    const color = LOGBOOK_STATUS_COLORS[status] || "gray";
    const label = LOGBOOK_STATUS_LABELS[status] || status;

    return (
      <Badge variant="outline" className={`border-${color}-500 text-${color}-700`}>
        {label}
      </Badge>
    );
  }

  function hasLogbook(jadwalId: string): boolean {
    return logbookList.some((l) => l.jadwal_id === jadwalId);
  }

  function getLogbookByJadwalId(jadwalId: string): LogbookEntry | undefined {
    return logbookList.find((l) => l.jadwal_id === jadwalId);
  }

  function toggleSkill(skill: string) {
    const currentSkills = formData.skill_dipelajari || [];
    if (currentSkills.includes(skill)) {
      setFormData({
        ...formData,
        skill_dipelajari: currentSkills.filter((s) => s !== skill),
      });
    } else {
      setFormData({
        ...formData,
        skill_dipelajari: [...currentSkills, skill],
      });
    }
  }

  function getJadwalWithoutLogbook(): Jadwal[] {
    const result = jadwalList.filter((j) => !hasLogbook(j.id));
    console.log("🔍 [DEBUG] getJadwalWithoutLogbook:", {
      total_jadwal: jadwalList.length,
      without_logbook: result.length,
      with_logbook: jadwalList.length - result.length,
      jadwal_ids: jadwalList.map(j => j.id),
      logbook_jadwal_ids: logbookList.map(l => l.jadwal_id),
    });
    return result;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Memuat data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Logbook Praktikum</h1>
        </div>
        <p className="text-gray-600">
          Catat pengalaman, hasil observasi, dan refleksi pembelajaran Anda
          selama praktikum kebidanan
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-logbook" className="mb-6">
        <TabsList>
          <TabsTrigger value="my-logbook">
            <FileText className="h-4 w-4 mr-2" />
            Logbook Saya ({logbookList.length})
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="h-4 w-4 mr-2" />
            Buat Logbook Baru
          </TabsTrigger>
        </TabsList>

        {/* My Logbooks Tab */}
        <TabsContent value="my-logbook" className="space-y-4">
          {logbookList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-2">
                  Belum ada logbook. Buat logbook pertama Anda!
                </p>
                {jadwalList.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    Tidak ada jadwal praktikum aktif untuk Anda.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Ada {jadwalList.length} jadwal praktikum tersedia.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {logbookList.filter((l): l is LogbookEntry => l != null).map((logbook) => (
                <Card key={logbook.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {logbook.jadwal?.topik || "Praktikum"}
                          </h3>
                          {getStatusBadge(logbook.status)}
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          {logbook.tanggal_praktikum &&
                            format(new Date(logbook.tanggal_praktikum), "dd MMMM yyyy")}
                        </p>
                        <p className="text-sm text-gray-500">
                          Lab: {logbook.jadwal?.laboratorium?.nama_lab || "-"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openViewDialog(logbook)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {logbook.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(logbook)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteLogbook(logbook.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openSubmitDialog(logbook)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {(logbook.status === "reviewed" || logbook.status === "graded") && (
                          <div className="text-right">
                            {logbook.nilai != null && (
                              <div className="text-2xl font-bold text-green-600">
                                {logbook.nilai}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview */}
                    {logbook.prosedur_dilakukan && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Prosedur:</span>{" "}
                        <span className="text-gray-600 line-clamp-1">
                          {logbook.prosedur_dilakukan}
                        </span>
                      </div>
                    )}

                    {logbook.skill_dipelajari && logbook.skill_dipelajari.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {logbook.skill_dipelajari.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {logbook.dosen_feedback && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          Feedback Dosen:
                        </p>
                        <p className="text-sm text-blue-600">
                          {logbook.dosen_feedback}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create Logbook Tab */}
        <TabsContent value="create">
          {getJadwalWithoutLogbook().length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-gray-500">
                  Semua jadwal praktikum sudah memiliki logbook!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getJadwalWithoutLogbook().map((jadwal) => (
                <Card
                  key={jadwal.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openCreateDialog(jadwal)}
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      {typeof jadwal.kelas === "object" && jadwal.kelas?.nama_kelas
                        ? jadwal.kelas.nama_kelas
                        : jadwal.kelas_relation?.nama_kelas || "Kelas"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium mb-1">
                      {jadwal.topik || "Praktikum"}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {jadwal.tanggal_praktikum &&
                        format(new Date(jadwal.tanggal_praktikum), "dd MMM yyyy")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Lab: {jadwal.laboratorium?.nama_lab}
                    </p>
                    <Button size="sm" className="w-full mt-3">
                      <Plus className="h-4 w-4 mr-2" />
                      Buat Logbook
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Logbook Baru</DialogTitle>
            <DialogDescription>
              {selectedJadwal?.topik} -{" "}
              {selectedJadwal?.tanggal_praktikum &&
                format(new Date(selectedJadwal.tanggal_praktikum), "dd MMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Prosedur */}
            <div>
              <Label htmlFor="prosedur">
                Prosedur yang Dilakukan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="prosedur"
                placeholder="Jelaskan prosedur/praktikum yang Anda lakukan..."
                value={formData.prosedur_dilakukan}
                onChange={(e) =>
                  setFormData({ ...formData, prosedur_dilakukan: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Hasil Observasi */}
            <div>
              <Label htmlFor="observasi">
                Hasil Observasi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="observasi"
                placeholder="Catat hasil observasi/pemeriksaan yang Anda dapatkan..."
                value={formData.hasil_observasi}
                onChange={(e) =>
                  setFormData({ ...formData, hasil_observasi: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Skill Dipelajari */}
            <div>
              <Label>
                Skill yang Dipelajari <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SKILL_KEBIDANAN.map((skill) => {
                  const isSelected = formData.skill_dipelajari?.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs p-2 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dipilih: {formData.skill_dipelajari?.length || 0} skill
              </p>
            </div>

            {/* Kendala */}
            <div>
              <Label htmlFor="kendala">Kendala yang Dihadapi</Label>
              <Textarea
                id="kendala"
                placeholder="Apakah ada kesulitan atau kendala saat praktikum?"
                value={formData.kendala_dihadapi}
                onChange={(e) =>
                  setFormData({ ...formData, kendala_dihadapi: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Refleksi */}
            <div>
              <Label htmlFor="refleksi">Refleksi Pembelajaran</Label>
              <Textarea
                id="refleksi"
                placeholder="Apa yang Anda pelajari dari praktikum ini?"
                value={formData.refleksi}
                onChange={(e) =>
                  setFormData({ ...formData, refleksi: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Catatan Tambahan */}
            <div>
              <Label htmlFor="catatan">Catatan Tambahan</Label>
              <Textarea
                id="catatan"
                placeholder="Catatan tambahan (opsional)"
                value={formData.catatan_tambahan}
                onChange={(e) =>
                  setFormData({ ...formData, catatan_tambahan: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleCreateLogbook} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Draft"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Logbook</DialogTitle>
            <DialogDescription>
              Status: <span className="text-yellow-600">Draft</span> - Anda
              masih bisa mengubah logbook ini
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Same fields as create */}
            <div>
              <Label htmlFor="edit-prosedur">
                Prosedur yang Dilakukan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-prosedur"
                value={formData.prosedur_dilakukan}
                onChange={(e) =>
                  setFormData({ ...formData, prosedur_dilakukan: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-observasi">
                Hasil Observasi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-observasi"
                value={formData.hasil_observasi}
                onChange={(e) =>
                  setFormData({ ...formData, hasil_observasi: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label>
                Skill yang Dipelajari <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SKILL_KEBIDANAN.map((skill) => {
                  const isSelected = formData.skill_dipelajari?.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs p-2 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-kendala">Kendala yang Dihadapi</Label>
              <Textarea
                id="edit-kendala"
                value={formData.kendala_dihadapi}
                onChange={(e) =>
                  setFormData({ ...formData, kendala_dihadapi: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-refleksi">Refleksi Pembelajaran</Label>
              <Textarea
                id="edit-refleksi"
                value={formData.refleksi}
                onChange={(e) =>
                  setFormData({ ...formData, refleksi: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-catatan">Catatan Tambahan</Label>
              <Textarea
                id="edit-catatan"
                value={formData.catatan_tambahan}
                onChange={(e) =>
                  setFormData({ ...formData, catatan_tambahan: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateLogbook} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Logbook untuk Review</DialogTitle>
            <DialogDescription>
              Pastikan semua data sudah lengkap sebelum diserahkan ke dosen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-sm">
              {selectedLogbook?.prosedur_dilakukan ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Prosedur Dilakukan</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {selectedLogbook?.hasil_observasi ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Hasil Observasi</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {selectedLogbook?.skill_dipelajari &&
              selectedLogbook.skill_dipelajari.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Skill yang Dipelajari ({selectedLogbook?.skill_dipelajari?.length || 0})</span>
            </div>

            {selectedLogbook?.skill_dipelajari && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedLogbook.skill_dipelajari.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmitLogbook} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyerahkan...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit ke Dosen
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
            <DialogDescription>
              {selectedLogbook?.jadwal?.topik} -{" "}
              {selectedLogbook?.tanggal_praktikum &&
                format(new Date(selectedLogbook.tanggal_praktikum), "dd MMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              {selectedLogbook && getStatusBadge(selectedLogbook.status)}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Prosedur</p>
              <p className="text-sm mt-1">
                {selectedLogbook?.prosedur_dilakukan || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Hasil Observasi</p>
              <p className="text-sm mt-1">
                {selectedLogbook?.hasil_observasi || "-"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Skill yang Dipelajari</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedLogbook?.skill_dipelajari && selectedLogbook.skill_dipelajari.length > 0 ? (
                  selectedLogbook.skill_dipelajari.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">-</p>
                )}
              </div>
            </div>

            {selectedLogbook?.kendala_dihadapi && (
              <div>
                <p className="text-sm font-medium text-gray-500">Kendala</p>
                <p className="text-sm mt-1">{selectedLogbook.kendala_dihadapi}</p>
              </div>
            )}

            {selectedLogbook?.refleksi && (
              <div>
                <p className="text-sm font-medium text-gray-500">Refleksi</p>
                <p className="text-sm mt-1">{selectedLogbook.refleksi}</p>
              </div>
            )}

            {selectedLogbook?.dosen_feedback && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">
                  Feedback Dosen:
                </p>
                <p className="text-sm text-blue-600">
                  {selectedLogbook.dosen_feedback}
                </p>
                <p className="text-xs text-blue-500 mt-2">
                  {selectedLogbook.reviewed_at &&
                    format(new Date(selectedLogbook.reviewed_at), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
            )}

            {selectedLogbook?.nilai != null && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-700 mb-1">
                  Nilai: {selectedLogbook.nilai}
                </p>
              </div>
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
