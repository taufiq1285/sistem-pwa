/**
 * MateriPage - Dosen
 *
 * Purpose: Manage learning materials for dosen
 * Features:
 * - Upload materi
 * - List all materi by kelas
 * - Edit/Delete materi
 * - Publish/Unpublish
 * - Filter by kelas, minggu
 * - View statistics
 */

import { useState, useEffect, useCallback } from "react";
import { Plus, Upload, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MateriList } from "@/components/features/materi/MateriCard";
import { MateriViewer } from "@/components/features/materi/MateriViewer";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getMateriByDosen,
  createMateri,
  updateMateri,
  deleteMateri,
  downloadMateri,
  publishMateri,
  type UploadMateriData,
} from "@/lib/api/materi.api";
import { getKelas } from "@/lib/api/kelas.api";
import { getMyKelas } from "@/lib/api/dosen.api";
import type { Materi } from "@/types/materi.types";
import type { Kelas } from "@/types/kelas.types";
import { toast } from "sonner";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";
import { MAX_FILE_SIZE, formatFileSize } from "@/lib/supabase/storage";

// ============================================================================
// COMPONENT
// ============================================================================

export default function DosenMateriPage() {
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [filteredMateri, setFilteredMateri] = useState<Materi[]>([]);

  // Filters
  const [selectedKelas, setSelectedKelas] = useState<string>("all");
  const [selectedMinggu, setSelectedMinggu] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload Dialog
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit Dialog
  const [editingMateri, setEditingMateri] = useState<Materi | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Viewer
  const [viewingMateri, setViewingMateri] = useState<Materi | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user?.dosen?.id) {
      loadData();
    }
  }, [user?.dosen?.id]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  async function loadData(forceRefresh = false) {
    if (!user?.dosen?.id) return;

    try {
      setLoading(true);

      // Use cacheAPI with stale-while-revalidate for offline support
      const [materiData, kelasData] = await Promise.all([
        cacheAPI(
          `dosen_materi_${user?.dosen?.id}`,
          () => getMateriByDosen(user.dosen.id),
          {
            ttl: 10 * 60 * 1000, // 10 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
        cacheAPI(`dosen_kelas_materi_${user?.dosen?.id}`, () => getMyKelas(), {
          ttl: 15 * 60 * 1000, // 15 minutes (kelas jarang berubah)
          forceRefresh,
          staleWhileRevalidate: true,
        }),
      ]);

      setMateriList(materiData);
      setKelasList(kelasData as unknown as Kelas[]);
      console.log(
        "[Dosen MateriPage] Data loaded:",
        materiData.length,
        "materi",
      );
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filterMateri = useCallback(() => {
    let filtered = [...materiList];

    // Filter by kelas
    if (selectedKelas !== "all") {
      filtered = filtered.filter((m) => m.kelas_id === selectedKelas);
    }

    // Filter by minggu
    if (selectedMinggu !== "all") {
      const minggu = parseInt(selectedMinggu);
      filtered = filtered.filter((m) => m.minggu_ke === minggu);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.judul.toLowerCase().includes(query) ||
          m.deskripsi?.toLowerCase().includes(query),
      );
    }

    setFilteredMateri(filtered);
  }, [materiList, selectedKelas, selectedMinggu, searchQuery]);

  useEffect(() => {
    filterMateri();
  }, [filterMateri]);

  // ============================================================================
  // UPLOAD HANDLERS
  // ============================================================================

  async function handleUpload(formData: FormData) {
    if (!user?.dosen?.id) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const file = formData.get("file") as File;
      const kelasId = formData.get("kelas_id") as string;
      const judul = formData.get("judul") as string;
      const deskripsi = formData.get("deskripsi") as string;
      const mingguKe = formData.get("minggu_ke") as string;

      // Validate
      if (!file || !kelasId || !judul) {
        toast.error("Semua field harus diisi");
        return;
      }

      const uploadData: UploadMateriData = {
        kelas_id: kelasId,
        dosen_id: user.dosen.id,
        judul,
        deskripsi,
        file,
        minggu_ke: mingguKe ? parseInt(mingguKe) : undefined,
        is_downloadable: true,
      };

      const newMateri = await createMateri(uploadData, {
        onProgress: (progress) => setUploadProgress(progress),
      });

      // Add to list and publish
      await publishMateri(newMateri.id);
      setMateriList((prev) => [newMateri, ...prev]);

      toast.success("Materi berhasil diupload");
      setShowUploadDialog(false);
      loadData(); // Reload to get updated data
    } catch (error: any) {
      console.error("Error uploading materi:", error);
      toast.error(error.message || "Gagal mengupload materi");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  // ============================================================================
  // EDIT/DELETE HANDLERS
  // ============================================================================

  async function handleEdit(materi: Materi) {
    setEditingMateri(materi);
    setShowEditDialog(true);
  }

  async function handleUpdateMateri(formData: FormData) {
    if (!editingMateri) return;

    try {
      const judul = formData.get("judul") as string;
      const deskripsi = formData.get("deskripsi") as string;
      const mingguKe = formData.get("minggu_ke") as string;

      await updateMateri(editingMateri.id, {
        judul,
        deskripsi,
        minggu_ke: mingguKe ? parseInt(mingguKe) : undefined,
      });

      toast.success("Materi berhasil diupdate");
      setShowEditDialog(false);
      setEditingMateri(null);
      loadData();
    } catch (error: any) {
      console.error("Error updating materi:", error);
      toast.error(error.message || "Gagal mengupdate materi");
    }
  }

  async function handleDelete(materi: Materi) {
    if (!confirm(`Hapus materi "${materi.judul}"?`)) return;

    try {
      await deleteMateri(materi.id);
      setMateriList((prev) => prev.filter((m) => m.id !== materi.id));
      toast.success("Materi berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting materi:", error);
      toast.error(error.message || "Gagal menghapus materi");
    }
  }

  // ============================================================================
  // VIEW/DOWNLOAD HANDLERS
  // ============================================================================

  async function handleView(materi: Materi) {
    setViewingMateri(materi);
    setShowViewer(true);
  }

  async function handleDownload(materi: Materi) {
    try {
      await downloadMateri(materi.id);
      toast.success("Download dimulai");
    } catch (error: any) {
      console.error("Error downloading materi:", error);
      toast.error(error.message || "Gagal mendownload materi");
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Memuat materi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Materi Pembelajaran</h1>
          <p className="text-muted-foreground mt-1">
            Kelola materi pembelajaran untuk kelas Anda
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Materi
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari materi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={selectedKelas} onValueChange={setSelectedKelas}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Kelas" />
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

        <Select value={selectedMinggu} onValueChange={setSelectedMinggu}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Minggu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Minggu</SelectItem>
            {Array.from({ length: 16 }, (_, i) => i + 1).map((minggu) => (
              <SelectItem key={minggu} value={minggu.toString()}>
                Minggu {minggu}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Materi</p>
          <p className="text-2xl font-bold">{materiList.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="text-2xl font-bold">
            {materiList.filter((m) => (m as any).is_active).length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Draft</p>
          <p className="text-2xl font-bold">
            {materiList.filter((m) => !(m as any).is_active).length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Downloads</p>
          <p className="text-2xl font-bold">
            {materiList.reduce(
              (sum, m) => sum + ((m as any).download_count || 0),
              0,
            )}
          </p>
        </div>
      </div>

      {/* Materi List */}
      <MateriList
        materiList={filteredMateri}
        showActions={true}
        showDosenActions={true}
        onView={handleView}
        onDownload={handleDownload}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="Belum ada materi. Upload materi pertama Anda!"
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleUpload}
        kelasList={kelasList}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />

      {/* Edit Dialog */}
      <EditDialog
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingMateri(null);
        }}
        onUpdate={handleUpdateMateri}
        materi={editingMateri}
      />

      {/* Viewer */}
      <MateriViewer
        materi={viewingMateri}
        open={showViewer}
        onClose={() => {
          setShowViewer(false);
          setViewingMateri(null);
        }}
        onDownload={() => viewingMateri && handleDownload(viewingMateri)}
      />
    </div>
  );
}

// ============================================================================
// UPLOAD DIALOG
// ============================================================================

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => void;
  kelasList: Kelas[];
  uploading: boolean;
  uploadProgress: number;
}

function UploadDialog({
  open,
  onClose,
  onUpload,
  kelasList,
  uploading,
  uploadProgress,
}: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [selectedMingguKe, setSelectedMingguKe] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onUpload(formData);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `Ukuran file terlalu besar. Maksimal ${formatFileSize(MAX_FILE_SIZE)}`,
        );
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Materi</DialogTitle>
          <DialogDescription>
            Upload materi pembelajaran untuk kelas Anda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="kelas_id">Kelas *</Label>
            <Select value={selectedKelasId} onValueChange={setSelectedKelasId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {kelasList.map((kelas) => (
                  <SelectItem key={kelas.id} value={kelas.id}>
                    {kelas.nama_kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="kelas_id"
              value={selectedKelasId}
              required
            />
          </div>

          <div>
            <Label htmlFor="judul">Judul Materi *</Label>
            <Input
              id="judul"
              name="judul"
              required
              placeholder="e.g. Pengantar Algoritma"
            />
          </div>

          <div>
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              name="deskripsi"
              placeholder="Deskripsi materi..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="minggu_ke">Minggu Ke</Label>
            <Select
              value={selectedMingguKe}
              onValueChange={setSelectedMingguKe}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih minggu (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((minggu) => (
                  <SelectItem key={minggu} value={minggu.toString()}>
                    Minggu {minggu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMingguKe && (
              <input type="hidden" name="minggu_ke" value={selectedMingguKe} />
            )}
          </div>

          <div>
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              name="file"
              type="file"
              required
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.webm,.zip,.rar"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Max {formatFileSize(MAX_FILE_SIZE)}. Format: PDF, Word, Excel,
              PowerPoint, Images, Videos, Archives
            </p>
          </div>

          {uploading && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={uploading} className="flex-1">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// EDIT DIALOG
// ============================================================================

interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (formData: FormData) => void;
  materi: Materi | null;
}

function EditDialog({ open, onClose, onUpdate, materi }: EditDialogProps) {
  const [selectedMingguKe, setSelectedMingguKe] = useState<string>("");

  // Reset when materi changes
  useEffect(() => {
    if (materi) {
      setSelectedMingguKe(materi.minggu_ke?.toString() || "");
    }
  }, [materi]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onUpdate(formData);
  }

  if (!materi) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Materi</DialogTitle>
          <DialogDescription>Update informasi materi</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit_judul">Judul Materi *</Label>
            <Input
              id="edit_judul"
              name="judul"
              required
              defaultValue={materi.judul}
            />
          </div>

          <div>
            <Label htmlFor="edit_deskripsi">Deskripsi</Label>
            <Textarea
              id="edit_deskripsi"
              name="deskripsi"
              defaultValue={materi.deskripsi || ""}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit_minggu_ke">Minggu Ke</Label>
            <Select
              value={selectedMingguKe}
              onValueChange={setSelectedMingguKe}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih minggu (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((minggu) => (
                  <SelectItem key={minggu} value={minggu.toString()}>
                    Minggu {minggu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMingguKe && (
              <input type="hidden" name="minggu_ke" value={selectedMingguKe} />
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Update
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
