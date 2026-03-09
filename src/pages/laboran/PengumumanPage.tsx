/**
 * Pengumuman Page - Laboran
 * View announcements and notifications relevant to laboratory staff
 */

import { useEffect, useState } from "react";
import { cacheAPI } from "@/lib/offline/api-cache";
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
import { DashboardCard } from "@/components/ui/dashboard-card";
import { GlassCard } from "@/components/ui/glass-card";
import {
  AlertCircle,
  Bell,
  Calendar,
  FileText,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";

export default function LaboranPengumumanPage() {
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const data = await cacheAPI(
        "laboran_announcements",
        () => getAllAnnouncements(),
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      const now = new Date().toISOString();
      const filtered = data.filter((announcement) => {
        const targetRoles = announcement.target_role || [];
        const isForLaboran =
          targetRoles.includes("laboran") || targetRoles.length === 0;

        const isActive =
          (!announcement.tanggal_mulai || announcement.tanggal_mulai <= now) &&
          (!announcement.tanggal_selesai ||
            announcement.tanggal_selesai >= now);

        return isForLaboran && isActive;
      });

      filtered.sort((a, b) => {
        if (a.prioritas === "high" && b.prioritas !== "high") return -1;
        if (a.prioritas !== "high" && b.prioritas === "high") return 1;

        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setAnnouncements(filtered);
    } catch (err: any) {
      console.error("Error loading announcements:", err);
      setError(err.message || "Gagal memuat notifikasi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <StatusBadge status="error" pulse={false}>Penting</StatusBadge>;
      case "medium":
        return <StatusBadge status="warning" pulse={false}>Menengah</StatusBadge>;
      case "low":
        return <StatusBadge status="info" pulse={false}>Biasa</StatusBadge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "info":
        return <StatusBadge status="info" pulse={false}>Informasi</StatusBadge>;
      case "warning":
        return <StatusBadge status="warning" pulse={false}>Peringatan</StatusBadge>;
      case "event":
        return <StatusBadge status="online" pulse={false}>Event</StatusBadge>;
      default:
        return null;
    }
  };

  const headerSection = (
    <GlassCard
      intensity="medium"
      className="border-white/40 bg-white/80 shadow-xl dark:border-white/10 dark:bg-slate-900/80"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
              <Bell className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Notifikasi
              </h1>
              <p className="text-muted-foreground">
                Informasi dan pemberitahuan penting untuk laboran.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => loadAnnouncements(true)}
          disabled={refreshing}
          className="w-full sm:w-auto"
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Memuat..." : "Refresh"}
        </Button>
      </div>
    </GlassCard>
  );

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {headerSection}

          <div className="grid gap-4 md:grid-cols-3">
            <DashboardCard
              title="Notifikasi Aktif"
              value={0}
              icon={Bell}
              color="blue"
            />
            <DashboardCard
              title="Prioritas Tinggi"
              value={0}
              icon={Sparkles}
              color="red"
            />
            <DashboardCard
              title="Terjadwal"
              value={0}
              icon={Calendar}
              color="amber"
            />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="rounded-2xl border border-blue-100/70 bg-white/90 shadow-sm"
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {headerSection}

          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const highPriorityCount = announcements.filter(
    (announcement) => announcement.prioritas === "high",
  ).length;
  const scheduledCount = announcements.filter((announcement) =>
    Boolean(announcement.tanggal_selesai),
  ).length;

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {headerSection}

        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Notifikasi Aktif"
            value={announcements.length}
            icon={Bell}
            color="blue"
          />
          <DashboardCard
            title="Prioritas Tinggi"
            value={highPriorityCount}
            icon={Sparkles}
            color="red"
          />
          <DashboardCard
            title="Terjadwal"
            value={scheduledCount}
            icon={Calendar}
            color="amber"
          />
        </div>

        {announcements.length === 0 ? (
          <GlassCard
            intensity="low"
            className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-slate-900/85"
          >
            <CardContent className="py-14 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Tidak ada notifikasi saat ini
              </p>
            </CardContent>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <GlassCard
                key={announcement.id}
                intensity="low"
                className={`rounded-2xl border shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
                  announcement.prioritas === "high"
                    ? "border-red-200/80 bg-red-50/70 dark:border-red-500/20 dark:bg-red-950/20"
                    : "border-white/40 bg-white/90 dark:border-white/10 dark:bg-slate-900/85"
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            <Sparkles className="h-3 w-3" />
                            Perhatian
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg text-slate-900 sm:text-xl dark:text-slate-100">
                        {announcement.judul}
                      </CardTitle>
                      <CardDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
                        {announcement.created_at && (
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Calendar className="h-4 w-4" />
                            {format(
                              new Date(announcement.created_at),
                              "dd MMM yyyy, HH:mm",
                            )}
                          </span>
                        )}
                        {announcement.penulis && (
                          <span className="text-slate-500 dark:text-slate-400">
                            oleh {announcement.penulis.full_name}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200 sm:text-base">
                    {announcement.konten}
                  </p>

                  {announcement.attachment_url && (
                    <div className="mt-4 border-t border-blue-100 pt-4 dark:border-slate-700">
                      <a
                        href={announcement.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FileText className="h-4 w-4" />
                        Lihat Lampiran
                      </a>
                    </div>
                  )}

                  {announcement.tanggal_selesai && (
                    <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                      Berlaku hingga{" "}
                      {format(
                        new Date(announcement.tanggal_selesai),
                        "dd MMM yyyy",
                      )}
                    </div>
                  )}
                </CardContent>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
