import { useState, useEffect } from "react";
import { Megaphone, Plus, Bell, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getAllAnnouncements,
  getAnnouncementStats,
  deleteAnnouncement,
  createAnnouncement,
  type AnnouncementStats,
} from "@/lib/api/announcements.api";
import { notifyUsersAnnouncement } from "@/lib/api/notification.api";
import type { Pengumuman, CreatePengumumanData } from "@/types/common.types";
import { formatDate } from "@/lib/utils/format";
import { useAuth } from "@/lib/hooks/useAuth";
import { cacheAPI, invalidateCache } from "@/lib/offline/api-cache";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [stats, setStats] = useState<AnnouncementStats>({
    total: 0,
    active: 0,
    highPriority: 0,
    scheduled: 0,
  });
  const [loading, setLoading] = useState(true);

  // Add dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<CreatePengumumanData>({
    judul: "",
    konten: "",
    tipe: "info",
    prioritas: "normal",
    target_role: [], // Default: all roles if empty
    tanggal_mulai: "", // Default: now
    tanggal_selesai: "", // Default: no expiry
    penulis_id: user?.id || "",
  });

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] =
    useState<Pengumuman | null>(null);

  useEffect(() => {
    loadAnnouncements(false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      setAddFormData((prev) => ({ ...prev, penulis_id: user.id }));
    }
  }, [user]);

  const loadAnnouncements = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const [announcementsData, statsData] = await Promise.all([
        cacheAPI("admin_announcements", () => getAllAnnouncements(), {
          ttl: 5 * 60 * 1000, // 5 minutes - announcements change frequently
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI("admin_announcement_stats", () => getAnnouncementStats(), {
          ttl: 5 * 60 * 1000, // 5 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        }),
      ]);
      setAnnouncements(announcementsData);
      setStats(statsData);
    } catch (error) {
      toast.error("Failed to load announcements");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (announcement: Pengumuman) => {
    setDeletingAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAnnouncement) return;

    try {
      await deleteAnnouncement(deletingAnnouncement.id);
      toast.success("Pengumuman berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setDeletingAnnouncement(null);
      // Invalidate cache and reload
      await invalidateCache("admin_announcements");
      await invalidateCache("admin_announcement_stats");
      await loadAnnouncements(true);
    } catch (error) {
      toast.error("Gagal menghapus pengumuman");
      console.error(error);
    }
  };

  const handleAdd = () => {
    setAddFormData({
      judul: "",
      konten: "",
      tipe: "info",
      prioritas: "normal",
      target_role: [], // Kosong = semua role
      tanggal_mulai: "",
      tanggal_selesai: "",
      penulis_id: user?.id || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      // Validasi sederhana
      if (!addFormData.judul?.trim()) {
        toast.error("Judul pengumuman wajib diisi");
        return;
      }

      if (!addFormData.konten?.trim()) {
        toast.error("Konten pengumuman wajib diisi");
        return;
      }

      if (!user?.id) {
        toast.error("User not authenticated");
        return;
      }

      // Set default values if not provided
      const announcementData: CreatePengumumanData = {
        judul: addFormData.judul.trim(),
        konten: addFormData.konten.trim(),
        tipe: addFormData.tipe || "info",
        prioritas: addFormData.prioritas || "normal",
        target_role:
          addFormData.target_role && addFormData.target_role.length > 0
            ? addFormData.target_role
            : undefined, // Empty means all roles
        tanggal_mulai: addFormData.tanggal_mulai || undefined,
        tanggal_selesai: addFormData.tanggal_selesai || undefined,
        penulis_id: user.id,
      };

      console.log("📝 [ADMIN] Creating announcement:", announcementData);

      await createAnnouncement(announcementData);
      toast.success("✅ Pengumuman berhasil dibuat!");

      // Notify target roles (best-effort, non-blocking)
      const targetRoles: ("mahasiswa" | "dosen" | "admin" | "laboran")[] =
        (announcementData.target_role || [
          "admin",
          "dosen",
          "mahasiswa",
          "laboran",
        ]) as ("mahasiswa" | "dosen" | "admin" | "laboran")[];

      console.log("🔔 [ADMIN] Sending notifications to:", targetRoles);

      try {
        await notifyUsersAnnouncement(
          targetRoles,
          announcementData.judul,
          announcementData.tipe,
          announcementData.prioritas,
        );
        toast.success(
          `🔔 Notifikasi dikirim ke ${targetRoles.length} role(s)!`,
        );
      } catch (notifErr: any) {
        console.error("❌ [ADMIN] Failed to send notifications:", notifErr);
        toast.error(
          `⚠️ Pengumuman dibuat, tapi notifikasi gagal: ${notifErr.message || "Unknown error"}`,
          { duration: 5000 },
        );
        // Jangan throw error - announcement sudah sukses dibuat
      }

      setIsAddDialogOpen(false);

      // Invalidate cache and reload
      await invalidateCache("admin_announcements");
      await invalidateCache("admin_announcement_stats");
      await loadAnnouncements(true);
    } catch (error: any) {
      toast.error(
        "Gagal membuat pengumuman: " + (error.message || "Unknown error"),
      );
      console.error(error);
    }
  };

  const getPriorityBadge = (priority?: string | null) => {
    const statusMap: Record<string, "error" | "warning" | "info"> = {
      high: "error", normal: "warning",
    };
    const labels: Record<string, string> = {
      high: "Penting", normal: "Normal",
    };
    const status = statusMap[priority || "normal"] || "info";
    const label = labels[priority || "normal"] || priority || "normal";
    return <StatusBadge status={status} pulse={false}>{label}</StatusBadge>;
  };

  const getTypeBadge = (tipe?: string | null) => {
    const statusMap: Record<string, "info" | "warning" | "online"> = {
      info: "info", warning: "warning", event: "online",
    };
    const status = statusMap[tipe || "info"] || "info";
    return <StatusBadge status={status} pulse={false}>{tipe || "info"}</StatusBadge>;
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold">Announcements</h1>
          <p className="text-lg font-semibold text-muted-foreground mt-2">
            Manage system-wide announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => loadAnnouncements(true)}
            className="font-semibold border-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleAdd}
            className="font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total"
          value={stats.total}
          description="Total pengumuman yang ada"
          icon={Megaphone}
          color="primary"
        />
        <DashboardCard
          title="Active"
          value={stats.active}
          description="Pengumuman yang sedang aktif"
          icon={Bell}
          color="success"
        />
        <DashboardCard
          title="High Priority"
          value={stats.highPriority}
          description="Pengumuman prioritas tinggi"
          icon={Bell}
          color="danger"
        />
        <DashboardCard
          title="Scheduled"
          value={stats.scheduled}
          description="Pengumuman terjadwal"
          icon={Bell}
          color="accent"
        />
      </div>

      {/* Announcements List */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-bold">All Announcements</CardTitle>
          <CardDescription className="text-base font-semibold mt-1">
            System-wide notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p>No announcements found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Megaphone className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{announcement.judul}</h3>
                      <p className="text-sm text-muted-foreground">
                        {announcement.created_at
                          ? formatDate(announcement.created_at)
                          : "Unknown date"}{" "}
                        • {announcement.penulis?.full_name || "Unknown author"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {getPriorityBadge(announcement.prioritas)}
                    {getTypeBadge(announcement.tipe)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(announcement)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Buat Pengumuman Baru
            </DialogTitle>
            <DialogDescription className="text-sm">
              Buat pengumuman sistem untuk semua user atau role tertentu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Judul */}
            <div className="space-y-2">
              <Label htmlFor="new_judul">
                Judul <span className="text-red-500">*</span>
              </Label>
              <Input
                id="new_judul"
                value={addFormData.judul}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, judul: e.target.value })
                }
                placeholder="Contoh: Maintenance sistem terjadwal"
                className="font-medium"
              />
            </div>

            {/* Konten */}
            <div className="space-y-2">
              <Label htmlFor="new_konten">
                Isi Pengumuman <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="new_konten"
                value={addFormData.konten}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, konten: e.target.value })
                }
                placeholder="Jelaskan detail pengumuman..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Type & Priority - satu baris */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new_tipe">Tipe</Label>
                <Select
                  value={addFormData.tipe}
                  onValueChange={(value: any) =>
                    setAddFormData({ ...addFormData, tipe: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Info</SelectItem>
                    <SelectItem value="warning">⚠️ Warning</SelectItem>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                    <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_prioritas">Prioritas</Label>
                <Select
                  value={addFormData.prioritas}
                  onValueChange={(value: any) =>
                    setAddFormData({ ...addFormData, prioritas: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Low</SelectItem>
                    <SelectItem value="normal">🟡 Normal</SelectItem>
                    <SelectItem value="high">🔴 High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Roles - lebih simple */}
            <div className="space-y-2">
              <Label>
                Kirim ke Role{" "}
                <span className="text-muted-foreground">
                  (kosongkan untuk semua)
                </span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: "admin", label: "Admin", emoji: "👨‍💼" },
                  { value: "dosen", label: "Dosen", emoji: "👨‍🏫" },
                  { value: "mahasiswa", label: "Mahasiswa", emoji: "👨‍🎓" },
                  { value: "laboran", label: "Laboran", emoji: "🔧" },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => {
                      const currentRoles = addFormData.target_role || [];
                      if (currentRoles.includes(role.value)) {
                        setAddFormData({
                          ...addFormData,
                          target_role: currentRoles.filter(
                            (r) => r !== role.value,
                          ),
                        });
                      } else {
                        setAddFormData({
                          ...addFormData,
                          target_role: [...currentRoles, role.value],
                        });
                      }
                    }}
                    className={`
                      px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all
                      ${
                        addFormData.target_role?.includes(role.value)
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                      }
                    `}
                  >
                    {role.emoji} {role.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanggal opsional */}
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                ⏱️ Opsi Tanggal (opsional)
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal Mulai</Label>
                  <Input
                    type="datetime-local"
                    value={addFormData.tanggal_mulai}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        tanggal_mulai: e.target.value,
                      })
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal Selesai</Label>
                  <Input
                    type="datetime-local"
                    value={addFormData.tanggal_selesai}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        tanggal_selesai: e.target.value,
                      })
                    }
                    className="h-9"
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              type="button"
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700"
              type="button"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Buat Pengumuman
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingAnnouncement && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Hapus Pengumuman - Konfirmasi"
          itemName={deletingAnnouncement.judul}
          itemType="Pengumuman"
          description={`Tipe: ${deletingAnnouncement.tipe} | Prioritas: ${deletingAnnouncement.prioritas}`}
          consequences={[
            "Pengumuman akan dihapus permanen dari sistem",
            "User tidak akan melihat pengumuman ini lagi",
            "Tindakan ini tidak dapat dibatalkan",
          ]}
        />
      )}
    </div>
  );
}
