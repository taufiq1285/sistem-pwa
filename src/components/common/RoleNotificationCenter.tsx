import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpen, Calendar, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAllAnnouncements } from "@/lib/api/announcements.api";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "@/lib/api/notification.api";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";
import { formatRelativeTime } from "@/lib/utils/format";
import { getNotificationNavigationTarget } from "@/lib/utils/notification-navigation";
import type { Pengumuman } from "@/types/common.types";
import type { Notification, NotificationType } from "@/types/notification.types";

type NotificationRole = "mahasiswa" | "dosen" | "laboran" | "admin";

interface RoleNotificationCenterProps {
  role: NotificationRole;
  description: string;
}

function getAnnouncementPriorityBadge(priority: string) {
  switch (priority) {
    case "high":
      return (
        <StatusBadge status="error" pulse={false}>
          Penting
        </StatusBadge>
      );
    case "medium":
      return (
        <StatusBadge status="warning" pulse={false}>
          Menengah
        </StatusBadge>
      );
    case "low":
      return (
        <StatusBadge status="info" pulse={false}>
          Biasa
        </StatusBadge>
      );
    default:
      return null;
  }
}

function getAnnouncementTypeBadge(type: string) {
  switch (type) {
    case "info":
      return (
        <StatusBadge status="info" pulse={false}>
          Informasi
        </StatusBadge>
      );
    case "warning":
      return (
        <StatusBadge status="warning" pulse={false}>
          Peringatan
        </StatusBadge>
      );
    case "event":
      return (
        <StatusBadge status="online" pulse={false}>
          Event
        </StatusBadge>
      );
    default:
      return null;
  }
}

function getNotificationBadge(type: NotificationType) {
  if (type.startsWith("jadwal_")) {
    return (
      <StatusBadge status="online" pulse={false}>
        Praktikum
      </StatusBadge>
    );
  }

  if (type.startsWith("assignment_") || type === "dosen_changed") {
    return (
      <StatusBadge status="info" pulse={false}>
        Referensi
      </StatusBadge>
    );
  }

  if (type.startsWith("peminjaman_")) {
    return (
      <StatusBadge status="warning" pulse={false}>
        Peminjaman
      </StatusBadge>
    );
  }

  if (type.startsWith("logbook_")) {
    return (
      <StatusBadge status="info" pulse={false}>
        Logbook
      </StatusBadge>
    );
  }

  if (
    type === "tugas_baru" ||
    type === "tugas_submitted" ||
    type === "tugas_graded"
  ) {
    return (
      <StatusBadge status="info" pulse={false}>
        Tugas
      </StatusBadge>
    );
  }

  if (type === "kuis_published" || type === "kuis_baru") {
    return (
      <StatusBadge status="warning" pulse={false}>
        Kuis
      </StatusBadge>
    );
  }

  if (type === "materi_baru") {
    return (
      <StatusBadge status="info" pulse={false}>
        Materi
      </StatusBadge>
    );
  }

  return (
    <StatusBadge status="info" pulse={false}>
      Sistem
    </StatusBadge>
  );
}

function filterAnnouncementsByRole(
  announcements: Pengumuman[],
  role: NotificationRole,
) {
  const now = new Date().toISOString();

  return announcements
    .filter((announcement) => {
      const targetRoles = announcement.target_role || [];
      const isForRole = targetRoles.includes(role) || targetRoles.length === 0;
      const isActive =
        (!announcement.tanggal_mulai || announcement.tanggal_mulai <= now) &&
        (!announcement.tanggal_selesai || announcement.tanggal_selesai >= now);

      return isForRole && isActive;
    })
    .sort((a, b) => {
      if (a.prioritas === "high" && b.prioritas !== "high") return -1;
      if (a.prioritas !== "high" && b.prioritas === "high") return 1;

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
}

function getNotificationPriority(type: NotificationType) {
  switch (type) {
    case "jadwal_pending_approval":
      return 100;
    case "peminjaman_baru":
      return 95;
    case "perbaikan_nilai_request":
      return 90;
    case "tugas_submitted":
    case "logbook_submitted":
      return 85;
    case "jadwal_baru":
    case "jadwal_diupdate":
    case "jadwal_updated":
    case "jadwal_dibatalkan":
      return 80;
    case "tugas_baru":
    case "tugas_graded":
    case "kuis_published":
    case "materi_baru":
    case "logbook_revision":
    case "logbook_rejected":
    case "logbook_approved":
    case "peminjaman_disetujui":
    case "peminjaman_ditolak":
      return 70;
    case "assignment_added":
    case "assignment_reassigned":
    case "assignment_deleted":
    case "dosen_changed":
    case "perbaikan_nilai_response":
      return 60;
    default:
      return 50;
  }
}

function sortNotifications(notifications: Notification[]) {
  return [...notifications]
    .filter((notification) => notification.type !== "pengumuman")
    .sort((a, b) => {
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1;
      }

      const priorityA = getNotificationPriority(a.type);
      const priorityB = getNotificationPriority(b.type);
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
}

export function RoleNotificationCenter({
  role,
  description,
}: RoleNotificationCenterProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  const loadData = async (forceRefresh = false) => {
    const cacheKey = `${role}_announcements`;

    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const cachedEntry = await getCachedData<Pengumuman[]>(cacheKey);
      const hasCachedAnnouncements = Array.isArray(cachedEntry?.data);

      if (hasCachedAnnouncements) {
        setAnnouncements(filterAnnouncementsByRole(cachedEntry.data, role));
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(cachedEntry.timestamp || null);
        setLoading(false);
      }

      if (!navigator.onLine) {
        if (!hasCachedAnnouncements && notifications.length === 0) {
          setError(
            "Perangkat sedang offline dan belum ada notifikasi yang tersimpan.",
          );
        } else {
          setIsOfflineData(true);
        }
        return;
      }

      const [announcementsResult, notificationsResult] =
        await Promise.allSettled([
          cacheAPI(cacheKey, () => getAllAnnouncements(), {
            ttl: 10 * 60 * 1000,
            forceRefresh,
            staleWhileRevalidate: true,
          }),
          user?.id
            ? getNotifications({
                user_id: user.id,
                limit: 50,
                forceRefresh: true,
              })
            : Promise.resolve([]),
        ]);

      let loadedAnyData = false;

      if (announcementsResult.status === "fulfilled") {
        setAnnouncements(
          filterAnnouncementsByRole(announcementsResult.value, role),
        );
        loadedAnyData = true;
      }

      if (notificationsResult.status === "fulfilled") {
        setNotifications(sortNotifications(notificationsResult.value));
        loadedAnyData = true;
      }

      if (!loadedAnyData) {
        setError("Gagal memuat notifikasi.");
      } else {
        setIsOfflineData(false);
        setLastUpdatedAt(Date.now());
      }
    } catch (err: any) {
      console.error("Error loading notification center:", err);
      setError(err.message || "Gagal memuat notifikasi");
      if (announcements.length > 0 || notifications.length > 0) {
        setIsOfflineData(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadNotifications === 0) return;

    try {
      await markAllAsRead(user.id);
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    const target = getNotificationNavigationTarget(notification, role);
    if (!target) return;

    navigate(target);
  };

  const handleNotificationClickLegacy = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    const target = getNotificationNavigationTarget(notification, role);
    if (target) {
      navigate(target);
      return;
    }

    if (
      (notification.type === "tugas_baru" ||
        notification.type === "kuis_published") &&
      notification.data?.kuis_id
    ) {
      navigate(`/mahasiswa/kuis/${notification.data.kuis_id}`);
    } else if (
      notification.type === "tugas_submitted" &&
      notification.data?.attempt_id &&
      notification.data?.kuis_id
    ) {
      navigate(
        `/dosen/kuis/${notification.data.kuis_id}/attempt/${notification.data.attempt_id}`,
      );
    } else if (
      notification.type === "tugas_graded" &&
      notification.data?.attempt_id &&
      notification.data?.kuis_id
    ) {
      navigate(
        `/mahasiswa/kuis/${notification.data.kuis_id}/result/${notification.data.attempt_id}`,
      );
    } else if (notification.type === "perbaikan_nilai_request") {
      navigate(`/dosen/penilaian`);
    } else if (notification.type === "perbaikan_nilai_response") {
      navigate(`/mahasiswa/nilai`);
    } else if (notification.type === "materi_baru") {
      navigate(`/mahasiswa/materi`);
    } else if (notification.type === "logbook_submitted") {
      navigate(`/dosen/logbook-review`);
    } else if (
      notification.type === "logbook_approved" ||
      notification.type === "logbook_rejected" ||
      notification.type === "logbook_revision"
    ) {
      navigate(`/mahasiswa/logbook`);
    } else if (notification.type === "peminjaman_baru") {
      navigate(`/laboran/persetujuan`);
    } else if (
      notification.type === "peminjaman_disetujui" ||
      notification.type === "peminjaman_ditolak"
    ) {
      navigate(`/dosen/peminjaman`);
    } else if (notification.type === "jadwal_pending_approval") {
      navigate(`/laboran/jadwal`);
    } else if (notification.type.startsWith("jadwal_")) {
      navigate(`/${role}/jadwal`);
    }
  };

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return null;

    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(lastUpdatedAt);
  }, [lastUpdatedAt]);

  if (loading) {
    return (
      <div className="app-container space-y-6 py-4 sm:py-6 lg:py-8">
        <PageHeader title="Notifikasi" description={description} />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <Card
              key={index}
              className="rounded-2xl border border-border/60 bg-white/90 shadow-sm"
            >
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-6 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-5/6 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container space-y-6 py-4 sm:py-6 lg:py-8">
      <PageHeader
        title="Notifikasi"
        description={description}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Memuat..." : "Refresh"}
            </Button>
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={unreadNotifications === 0}
              className="w-full sm:w-auto"
            >
              Tandai Semua Dibaca
            </Button>
          </div>
        }
      />

      {error ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isOfflineData || !navigator.onLine ? (
        <Alert className="rounded-2xl border-warning/40 bg-warning/10 text-foreground shadow-sm">
          <AlertDescription>
            Menampilkan data lokal yang tersedia.
            {lastUpdatedLabel ? ` Pembaruan terakhir: ${lastUpdatedLabel}.` : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-border/60 bg-white/90 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Notifikasi Event</p>
              <p className="mt-1 text-2xl font-semibold">{notifications.length}</p>
            </div>
            <Bell className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/60 bg-white/90 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Belum Dibaca</p>
              <p className="mt-1 text-2xl font-semibold">{unreadNotifications}</p>
            </div>
            <Calendar className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/60 bg-white/90 shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Pengumuman Admin</p>
              <p className="mt-1 text-2xl font-semibold">{announcements.length}</p>
            </div>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Notifikasi Aktivitas</h2>
            <span className="text-sm text-muted-foreground">
              Praktikum, tugas, kuis, materi, dan logbook
            </span>
          </div>

          {notifications.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border/60 bg-white/80 shadow-sm">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Belum ada notifikasi aktivitas.
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`rounded-2xl border shadow-sm ${
                  notification.is_read
                    ? "border-border/60 bg-white/90"
                    : "border-primary/25 bg-primary/5"
                } cursor-pointer transition-colors hover:bg-accent/40`}
                onClick={() => {
                  handleNotificationClick(notification).catch((error) => {
                    console.error("Failed to open notification:", error);
                  });
                }}
              >
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {getNotificationBadge(notification.type)}
                    {!notification.is_read ? (
                      <StatusBadge status="online" pulse={false}>
                        Baru
                      </StatusBadge>
                    ) : null}
                  </div>
                  <CardTitle className="text-base">{notification.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-6 text-foreground/90">
                    {notification.message}
                  </p>
                  {!notification.is_read ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                    >
                      Tandai Dibaca
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pengumuman Admin</h2>
            <span className="text-sm text-muted-foreground">
              Informasi resmi dan terjadwal
            </span>
          </div>

          {announcements.length === 0 ? (
            <Card className="rounded-2xl border border-dashed border-border/60 bg-white/80 shadow-sm">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Belum ada pengumuman aktif.
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card
                key={announcement.id}
                className="rounded-2xl border border-border/60 bg-white/90 shadow-sm"
              >
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {getAnnouncementPriorityBadge(announcement.prioritas)}
                    {getAnnouncementTypeBadge(announcement.tipe)}
                  </div>
                  <CardTitle className="text-base">{announcement.judul}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {announcement.created_at
                      ? formatRelativeTime(announcement.created_at)
                      : "-"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-6 text-foreground/90">
                    {announcement.konten}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default RoleNotificationCenter;
