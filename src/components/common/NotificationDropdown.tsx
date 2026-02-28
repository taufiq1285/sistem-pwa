/**
 * NotificationDropdown Component
 *
 * Dropdown notification panel that shows recent notifications
 * - Tugas baru dari dosen
 * - Mahasiswa submit tugas (untuk dosen)
 * - Tugas dinilai (untuk mahasiswa)
 * - Mark as read functionality
 */

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteReadNotifications,
} from "@/lib/api/notification.api";
import type { Notification } from "@/types/notification.types";
import { formatRelativeTime } from "@/lib/utils/format";
import { toast } from "sonner";

const MAX_DISPLAY = 10; // Maximum notifications to display

/**
 * Get icon based on notification type
 */
function getNotificationIcon(type: string) {
  switch (type) {
    case "tugas_baru":
      return "📝";
    case "tugas_submitted":
      return "✅";
    case "tugas_graded":
      return "⭐";
    case "kuis_baru":
      return "📋";
    case "dosen_changed":
      return "👨‍🏫";
    case "perbaikan_nilai_request":
      return "🔄";
    case "perbaikan_nilai_response":
      return "✍️";
    case "pengumuman":
      return "📢";
    case "sistem":
      return "⚙️";
    case "test_notification":
      return "🧪";
    // HIGH PRIORITY notification types
    case "jadwal_baru":
    case "jadwal_diupdate":
    case "jadwal_dibatalkan":
      return "📅";
    case "peminjaman_baru":
      return "📦";
    case "peminjaman_disetujui":
      return "✅";
    case "peminjaman_ditolak":
      return "❌";
    case "kuis_published":
      return "📋";
    case "logbook_submitted":
      return "📝";
    case "logbook_approved":
      return "✅";
    case "logbook_rejected":
      return "❌";
    case "logbook_revision":
      return "🔄";
    default:
      return "🔔";
  }
}

/**
 * Single notification item
 */
function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClick: (notification: Notification) => void;
}) {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    onClick(notification);
  };

  return (
    <div
      className={`flex gap-3 rounded-md px-2 py-3 transition-colors hover:bg-accent cursor-pointer ${
        !notification.is_read ? "bg-blue-50/80 dark:bg-blue-950/20" : ""
      }`}
      onClick={handleClick}
    >
      <div className="text-2xl shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-tight ${
              !notification.is_read ? "font-semibold" : "font-medium"
            }`}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {notification.message}
        </p>
        {notification.created_at && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatRelativeTime(notification.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state when no notifications
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
    </div>
  );
}

/**
 * NotificationDropdown Component
 */
export function NotificationDropdown() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        getNotifications({ user_id: user.id, limit: MAX_DISPLAY }),
        getUnreadCount(user.id),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  // Reload when dropdown opens
  useEffect(() => {
    if (open && user?.id) {
      loadNotifications();
    }
  }, [open, user?.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("Semua notifikasi ditandai sudah dibaca");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Gagal menandai semua notifikasi");
    }
  };

  const handleDeleteRead = async () => {
    if (!user?.id) return;

    try {
      await deleteReadNotifications(user.id);
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      toast.success("Notifikasi yang sudah dibaca dihapus");
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      toast.error("Gagal menghapus notifikasi");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification type
    if (notification.type === "tugas_baru" && notification.data?.kuis_id) {
      navigate(`/mahasiswa/kuis/${notification.data.kuis_id}`);
      setOpen(false);
    } else if (
      notification.type === "tugas_submitted" &&
      notification.data?.attempt_id
    ) {
      navigate(`/dosen/kuis/attempts/${notification.data.attempt_id}`);
      setOpen(false);
    } else if (
      notification.type === "tugas_graded" &&
      notification.data?.attempt_id &&
      notification.data?.kuis_id
    ) {
      // ✅ FIX: Include kuisId in the URL (route requires both params)
      navigate(
        `/mahasiswa/kuis/${notification.data.kuis_id}/result/${notification.data.attempt_id}`,
      );
      setOpen(false);
    } else if (notification.type === "perbaikan_nilai_request") {
      // Dosen receives request → navigate to penilaian page
      navigate(`/dosen/penilaian`);
      setOpen(false);
    } else if (notification.type === "perbaikan_nilai_response") {
      // Mahasiswa receives response → navigate to nilai page
      navigate(`/mahasiswa/nilai`);
      setOpen(false);
    } else if (notification.type === "pengumuman") {
      // Navigate to notifikasi page based on role
      if (user?.role) {
        navigate(`/${user.role}/notifikasi`);
        setOpen(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 hover:scale-105 active:scale-95"
          title="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(92vw,24rem)] rounded-xl border border-border/70 bg-white/95 p-0 shadow-xl backdrop-blur-md"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-3 sm:px-4">
          <h3 className="text-sm font-semibold">Notifikasi</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleMarkAllAsRead}
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Tandai Semua
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} baru
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 px-4 text-center">
            <p className="text-sm text-muted-foreground">Memuat...</p>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ScrollArea className="h-96 sm:h-104">
              <div className="px-2 py-1">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
                      onClick={handleNotificationClick}
                    />
                    {index < notifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <Separator />
            <div className="p-2 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleDeleteRead}
                disabled={notifications.every((n) => !n.is_read)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Hapus yang Sudah Dibaca
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationDropdown;
