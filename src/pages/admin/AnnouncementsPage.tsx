import { useState, useEffect, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Bell,
  RefreshCw,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  Zap,
  Wrench,
  Clock,
  User,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  cacheAPI,
  getCachedData,
  invalidateCache,
} from "@/lib/offline/api-cache";

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
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<CreatePengumumanData>({
    judul: "",
    konten: "",
    tipe: "info",
    prioritas: "normal",
    target_role: [],
    tanggal_mulai: "",
    tanggal_selesai: "",
    penulis_id: user?.id || "",
  });

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
    const announcementsCacheKey = "admin_announcements";
    const statsCacheKey = "admin_announcement_stats";

    try {
      setLoading(true);

      const [cachedAnnouncementsEntry, cachedStatsEntry] = await Promise.all([
        getCachedData<Pengumuman[]>(announcementsCacheKey),
        getCachedData<AnnouncementStats>(statsCacheKey),
      ]);

      const hasCachedAnnouncements = Array.isArray(
        cachedAnnouncementsEntry?.data,
      );
      const hasCachedStats = !!cachedStatsEntry?.data;

      if (hasCachedAnnouncements && !forceRefresh) {
        setAnnouncements(cachedAnnouncementsEntry.data);
      }
      if (hasCachedStats && !forceRefresh) {
        setStats(cachedStatsEntry.data);
      }
      if ((hasCachedAnnouncements || hasCachedStats) && !forceRefresh) {
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(
          cachedAnnouncementsEntry?.timestamp ||
            cachedStatsEntry?.timestamp ||
            null,
        );
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedAnnouncements || hasCachedStats
            ? "Perangkat sedang offline. Menampilkan snapshot pengumuman yang tersimpan."
            : "Perangkat sedang offline dan belum ada snapshot yang tersimpan.",
        );
      }

      const [announcementsData, statsData] = await Promise.all([
        cacheAPI(announcementsCacheKey, () => getAllAnnouncements(), {
          ttl: 5 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI(statsCacheKey, () => getAnnouncementStats(), {
          ttl: 5 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        }),
      ]);

      setAnnouncements(announcementsData);
      setStats(statsData);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (error: any) {
      if (announcements.length > 0 || stats.total > 0 || !navigator.onLine) {
        setIsOfflineData(true);
      }
      toast.error(error?.message || "Gagal memuat pengumuman");
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
      target_role: [],
      tanggal_mulai: "",
      tanggal_selesai: "",
      penulis_id: user?.id || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      if (!addFormData.judul?.trim()) {
        toast.error("Judul pengumuman wajib diisi");
        return;
      }
      if (!addFormData.konten?.trim()) {
        toast.error("Konten pengumuman wajib diisi");
        return;
      }
      if (!user?.id) {
        toast.error("Sesi pengguna tidak ditemukan");
        return;
      }

      const announcementData: CreatePengumumanData = {
        judul: addFormData.judul.trim(),
        konten: addFormData.konten.trim(),
        tipe: addFormData.tipe || "info",
        prioritas: addFormData.prioritas || "normal",
        target_role:
          addFormData.target_role && addFormData.target_role.length > 0
            ? addFormData.target_role
            : undefined,
        tanggal_mulai: addFormData.tanggal_mulai || undefined,
        tanggal_selesai: addFormData.tanggal_selesai || undefined,
        penulis_id: user.id,
      };

      await createAnnouncement(announcementData);
      toast.success("Pengumuman berhasil dibuat!");

      const targetRoles: ("mahasiswa" | "dosen" | "admin" | "laboran")[] =
        (announcementData.target_role || [
          "admin",
          "dosen",
          "mahasiswa",
          "laboran",
        ]) as ("mahasiswa" | "dosen" | "admin" | "laboran")[];

      try {
        await notifyUsersAnnouncement(
          targetRoles,
          announcementData.judul,
          announcementData.tipe,
          announcementData.prioritas,
        );
        toast.success(`Notifikasi dikirim ke ${targetRoles.length} role!`);
      } catch (notifErr: any) {
        console.error("Gagal kirim notifikasi:", notifErr);
        toast.error(
          `Pengumuman dibuat, tapi notifikasi gagal: ${notifErr.message || "Unknown error"}`,
          { duration: 5000 },
        );
      }

      setIsAddDialogOpen(false);
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

  const getTypeConfig = (
    tipe?: string | null,
  ): {
    icon: React.ElementType;
    color: string;
    bg: string;
    label: string;
  } => {
    const configs: Record<
      string,
      { icon: React.ElementType; color: string; bg: string; label: string }
    > = {
      info: {
        icon: Info,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        label: "Info",
      },
      warning: {
        icon: AlertTriangle,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        label: "Peringatan",
      },
      urgent: {
        icon: Zap,
        color: "text-red-500",
        bg: "bg-red-500/10",
        label: "Urgent",
      },
      maintenance: {
        icon: Wrench,
        color: "text-slate-500",
        bg: "bg-slate-500/10",
        label: "Maintenance",
      },
      event: {
        icon: Bell,
        color: "text-violet-500",
        bg: "bg-violet-500/10",
        label: "Event",
      },
    };
    return configs[tipe || "info"] || configs.info;
  };

  const getPriorityBadge = (priority?: string | null) => {
    const statusMap: Record<string, "error" | "warning" | "info"> = {
      high: "error",
      normal: "warning",
    };
    const labels: Record<string, string> = {
      high: "Penting",
      normal: "Normal",
      low: "Rendah",
    };
    const status = statusMap[priority || "normal"] || "info";
    const label = labels[priority || "normal"] || priority || "normal";
    return (
      <StatusBadge status={status} pulse={false}>
        {label}
      </StatusBadge>
    );
  };

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return null;
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(lastUpdatedAt);
  }, [lastUpdatedAt]);

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manajemen Pengumuman
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buat dan kelola pengumuman sistem untuk semua pengguna
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => loadAnnouncements(true)}
            className="font-semibold"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleAdd}
            className="font-semibold bg-linear-to-r from-primary to-accent text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Pengumuman
          </Button>
        </div>
      </div>

      {(isOfflineData || !navigator.onLine) && (
        <Alert className="border-warning/40 bg-warning/10 shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pengumuman sedang memakai snapshot lokal dari perangkat.
            {lastUpdatedLabel
              ? ` Pembaruan terakhir: ${lastUpdatedLabel}.`
              : ""}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardCard
          title="Total"
          value={stats.total}
          description="Semua pengumuman"
          icon={Megaphone}
          color="primary"
        />
        <DashboardCard
          title="Aktif"
          value={stats.active}
          description="Sedang ditampilkan"
          icon={Bell}
          color="success"
        />
        <DashboardCard
          title="Prioritas Tinggi"
          value={stats.highPriority}
          description="Perlu perhatian"
          icon={AlertCircle}
          color="danger"
        />
        <DashboardCard
          title="Terjadwal"
          value={stats.scheduled}
          description="Belum dimulai"
          icon={Clock}
          color="accent"
        />
      </div>

      {/* Announcements List */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Daftar Pengumuman
          </CardTitle>
          <CardDescription>
            Semua pengumuman yang ada dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/40"
                >
                  <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/15 via-accent/10 to-primary/5 ring-1 ring-primary/10 shadow-sm">
                <Megaphone className="h-9 w-9 text-primary/70" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-foreground">
                Belum ada pengumuman
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
                Buat pengumuman pertama untuk menginformasikan semua pengguna
                sistem.
              </p>
              <Button onClick={handleAdd} className="font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Buat Pengumuman
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => {
                const typeConfig = getTypeConfig(announcement.tipe);
                const TypeIcon = typeConfig.icon;
                return (
                  <div
                    key={announcement.id}
                    className="interactive-card flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between p-4 rounded-xl border border-border/50 bg-card/60 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${typeConfig.bg}`}
                      >
                        <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground leading-tight">
                          {announcement.judul}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {announcement.konten}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            {announcement.created_at
                              ? formatDate(announcement.created_at)
                              : "Tidak diketahui"}
                          </span>
                          <span>•</span>
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {announcement.penulis?.full_name || "Admin"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:self-start">
                      {getPriorityBadge(announcement.prioritas)}
                      <StatusBadge
                        status={
                          announcement.tipe === "urgent"
                            ? "error"
                            : announcement.tipe === "warning"
                              ? "warning"
                              : "info"
                        }
                        pulse={false}
                      >
                        {typeConfig.label}
                      </StatusBadge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Buat Pengumuman Baru
            </DialogTitle>
            <DialogDescription>
              Buat pengumuman sistem untuk semua pengguna atau role tertentu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new_judul">
                Judul <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new_judul"
                value={addFormData.judul}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, judul: e.target.value })
                }
                placeholder="Contoh: Maintenance sistem terjadwal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_konten">
                Isi Pengumuman <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="new_konten"
                value={addFormData.konten}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, konten: e.target.value })
                }
                placeholder="Jelaskan detail pengumuman..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new_tipe">Tipe</Label>
                <Select
                  value={addFormData.tipe}
                  onValueChange={(value: any) =>
                    setAddFormData({ ...addFormData, tipe: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Info</SelectItem>
                    <SelectItem value="warning">⚠️ Peringatan</SelectItem>
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
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Rendah</SelectItem>
                    <SelectItem value="normal">🟡 Normal</SelectItem>
                    <SelectItem value="high">🔴 Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Kirim ke Role{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (kosongkan untuk semua)
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
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
                      px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer
                      ${
                        addFormData.target_role?.includes(role.value)
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/60 hover:border-border bg-transparent text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {role.emoji} {role.label}
                  </button>
                ))}
              </div>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground select-none">
                ⏱️ Opsi Tanggal (opsional)
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1.5">
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
                  />
                </div>
                <div className="space-y-1.5">
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
                  />
                </div>
              </div>
            </details>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              type="button"
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              className="font-semibold bg-linear-to-r from-primary to-accent text-primary-foreground"
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
          title="Hapus Pengumuman"
          itemName={deletingAnnouncement.judul}
          itemType="Pengumuman"
          description={`Tipe: ${deletingAnnouncement.tipe} | Prioritas: ${deletingAnnouncement.prioritas}`}
          consequences={[
            "Pengumuman akan dihapus permanen dari sistem",
            "Pengguna tidak akan melihat pengumuman ini lagi",
            "Tindakan ini tidak dapat dibatalkan",
          ]}
        />
      )}
    </div>
  );
}
