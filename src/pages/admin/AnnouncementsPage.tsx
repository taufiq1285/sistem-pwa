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
import { Badge } from "@/components/ui/badge";
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
import type { Pengumuman, CreatePengumumanData } from "@/types/common.types";
import { formatDate } from "@/lib/utils/format";
import { useAuth } from "@/lib/hooks/useAuth";

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
    target_role: [],
    tanggal_mulai: "",
    tanggal_selesai: "",
    penulis_id: user?.id || "",
  });

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] =
    useState<Pengumuman | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    if (user?.id) {
      setAddFormData((prev) => ({ ...prev, penulis_id: user.id }));
    }
  }, [user]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const [announcementsData, statsData] = await Promise.all([
        getAllAnnouncements(),
        getAnnouncementStats(),
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
      await loadAnnouncements();
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
      if (!addFormData.judul || !addFormData.konten) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!user?.id) {
        toast.error("User not authenticated");
        return;
      }

      await createAnnouncement({
        ...addFormData,
        penulis_id: user.id,
      });
      toast.success("Announcement created successfully");
      setIsAddDialogOpen(false);
      await loadAnnouncements();
    } catch (error: any) {
      toast.error(
        "Failed to create announcement: " + (error.message || "Unknown error"),
      );
      console.error(error);
    }
  };

  const getPriorityVariant = (priority?: string | null) => {
    if (priority === "high") return "destructive";
    if (priority === "normal") return "secondary";
    return "outline";
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Manage system-wide announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnnouncements}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Badge variant="destructive">High</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highPriority}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
          <CardDescription>System-wide notifications</CardDescription>
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
                    <Badge variant={getPriorityVariant(announcement.prioritas)}>
                      {announcement.prioritas || "normal"}
                    </Badge>
                    <Badge variant="default">
                      {announcement.tipe || "info"}
                    </Badge>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              Create a new system announcement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_judul">Title *</Label>
              <Input
                id="new_judul"
                value={addFormData.judul}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, judul: e.target.value })
                }
                placeholder="Important announcement"
              />
            </div>

            <div>
              <Label htmlFor="new_konten">Content *</Label>
              <Textarea
                id="new_konten"
                value={addFormData.konten}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, konten: e.target.value })
                }
                placeholder="Announcement details..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_tipe">Type</Label>
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
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="new_prioritas">Priority</Label>
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
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new_tanggal_mulai">Start Date</Label>
                <Input
                  id="new_tanggal_mulai"
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

              <div>
                <Label htmlFor="new_tanggal_selesai">End Date</Label>
                <Input
                  id="new_tanggal_selesai"
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

            <div>
              <Label>Target Roles (leave empty for all)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["admin", "dosen", "mahasiswa", "laboran"].map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`role_${role}`}
                      checked={addFormData.target_role?.includes(role)}
                      onChange={(e) => {
                        const currentRoles = addFormData.target_role || [];
                        if (e.target.checked) {
                          setAddFormData({
                            ...addFormData,
                            target_role: [...currentRoles, role],
                          });
                        } else {
                          setAddFormData({
                            ...addFormData,
                            target_role: currentRoles.filter((r) => r !== role),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`role_${role}`} className="capitalize">
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Announcement</Button>
            </div>
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
