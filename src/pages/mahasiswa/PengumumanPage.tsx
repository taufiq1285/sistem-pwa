/**
 * Pengumuman Page - Mahasiswa
 * View announcements and notifications relevant to students
 */

import { useEffect, useState } from "react";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";
import { getAllAnnouncements } from "@/lib/api/announcements.api";
import type { Pengumuman } from "@/types/common.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Bell,
  Calendar,
  FileText,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";

export default function PengumumanPage() {
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    loadAnnouncements();

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: Pengumuman[];
      }>;

      if (customEvent.detail?.key !== "mahasiswa_announcements") {
        return;
      }

      const nextData = customEvent.detail?.data;
      if (!Array.isArray(nextData)) {
        return;
      }

      applyFilteredAnnouncements(nextData);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
      setError(null);
    };

    window.addEventListener("cache:updated", handleCacheUpdated);

    return () => {
      window.removeEventListener("cache:updated", handleCacheUpdated);
    };
  }, []);

  const applyFilteredAnnouncements = (data: Pengumuman[]) => {
    const now = new Date().toISOString();
    const filtered = data.filter((announcement) => {
      const targetRoles = announcement.target_role || [];
      const isForMahasiswa =
        targetRoles.includes("mahasiswa") || targetRoles.length === 0;

      const isActive =
        (!announcement.tanggal_mulai || announcement.tanggal_mulai <= now) &&
        (!announcement.tanggal_selesai || announcement.tanggal_selesai >= now);

      return isForMahasiswa && isActive;
    });

    filtered.sort((a, b) => {
      if (a.prioritas === "high" && b.prioritas !== "high") return -1;
      if (a.prioritas !== "high" && b.prioritas === "high") return 1;

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    setAnnouncements(filtered);
  };

  const loadAnnouncements = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const cacheKey = "mahasiswa_announcements";
      const cachedEntry = await getCachedData<Pengumuman[]>(cacheKey);
      const hasCachedData = Array.isArray(cachedEntry?.data);

      if (hasCachedData) {
        applyFilteredAnnouncements(cachedEntry!.data);
        setLastUpdatedAt(cachedEntry!.timestamp);
        setIsOfflineData(!navigator.onLine);
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan notifikasi tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada notifikasi tersimpan.",
        );
      }

      const data = await cacheAPI(
        cacheKey,
        () => getAllAnnouncements(),
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      applyFilteredAnnouncements(data);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (err: any) {
      console.error("Error loading announcements:", err);

      if (announcements.length > 0 || !navigator.onLine) {
        setIsOfflineData(true);
      }

      setError(err.message || "Gagal memuat notifikasi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
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
  };

  const getTypeBadge = (type: string) => {
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
  };

  if (loading) {
    return (
      <div className="app-container space-y-6">
        <div className="section-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Notifikasi
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Informasi dan pemberitahuan penting
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="rounded-2xl border border-border/60 bg-white/90 shadow-sm"
            >
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container space-y-6">
        <div className="section-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Notifikasi
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Informasi dan pemberitahuan penting
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => loadAnnouncements(true)}
            className="w-full border-primary/30 bg-white text-primary hover:bg-primary/5 sm:w-auto"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Coba Muat Ulang
          </Button>
        </div>

        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="app-container space-y-6">
      <div className="section-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Notifikasi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Informasi dan pemberitahuan penting
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Bell className="h-4 w-4 text-primary" />
            {announcements.length} Notifikasi Aktif
          </div>
          {isOfflineData && (
            <div className="text-right text-xs text-muted-foreground">
              Mode offline • data tersimpan lokal
              {lastUpdatedAt
                ? ` • update ${format(new Date(lastUpdatedAt), "dd MMM yyyy, HH:mm")}`
                : ""}
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => loadAnnouncements(true)}
            disabled={refreshing}
            className="w-full border-primary/30 bg-white text-primary hover:bg-primary/5 sm:w-auto"
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Memuat..." : "Refresh"}
          </Button>
        </div>
      </div>

      {isOfflineData && (
        <Alert className="rounded-2xl border-warning/30 bg-warning/10 text-warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aplikasi sedang memakai data notifikasi yang tersimpan di perangkat.
            Tampilan tetap bisa dibuka saat offline, tetapi isi terbaru baru akan
            disegarkan saat koneksi kembali tersedia.
          </AlertDescription>
        </Alert>
      )}

      {announcements.length === 0 ? (
        <Card className="rounded-2xl border border-border/60 bg-white/90 shadow-sm">
          <CardContent className="py-14 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/60" />
            <p className="text-muted-foreground">Tidak ada notifikasi saat ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`rounded-2xl border bg-white/95 shadow-sm transition-all duration-200 hover:shadow-md ${
                announcement.prioritas === "high"
                  ? "border-danger/30 bg-danger/5"
                  : "border-border/60"
              }`}
            >
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {announcement.prioritas &&
                        getPriorityBadge(announcement.prioritas)}
                      {announcement.tipe && getTypeBadge(announcement.tipe)}
                      {announcement.prioritas === "high" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">
                          <Sparkles className="h-3 w-3" />
                          Perhatian
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg text-foreground sm:text-xl">
                      {announcement.judul}
                    </CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
                      {announcement.created_at && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(
                            new Date(announcement.created_at),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </span>
                      )}
                      {announcement.penulis && (
                        <span className="text-muted-foreground">
                          oleh {announcement.penulis.full_name}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {announcement.konten}
                </p>

                {announcement.attachment_url && (
                  <div className="mt-4 border-t border-border/40 pt-4">
                    <a
                      href={announcement.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      <FileText className="h-4 w-4" />
                      Lihat Lampiran
                    </a>
                  </div>
                )}

                {announcement.tanggal_selesai && (
                  <div className="mt-4 text-xs text-muted-foreground sm:text-sm">
                    Berlaku hingga{" "}
                    {format(
                      new Date(announcement.tanggal_selesai),
                      "dd MMM yyyy",
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
