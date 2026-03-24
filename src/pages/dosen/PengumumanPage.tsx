/**
 * Pengumuman Page - Dosen
 * View announcements and notifications relevant to lecturers
 */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
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
import { AlertCircle, Bell, Calendar, FileText, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/common/PageHeader";

export default function DosenPengumumanPage() {
  useAuth();
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async (forceRefresh = false) => {
    const cacheKey = "dosen_announcements";

    try {
      setLoading(true);
      setError(null);

      const cachedEntry = await getCachedData<Pengumuman[]>(cacheKey);
      const hasCachedData = Array.isArray(cachedEntry?.data);

      const filterAnnouncements = (data: Pengumuman[]) => {
        const now = new Date().toISOString();
        const filtered = data.filter((announcement) => {
          const targetRoles = announcement.target_role || [];
          const isForDosen =
            targetRoles.includes("dosen") || targetRoles.length === 0;

          const isActive =
            (!announcement.tanggal_mulai || announcement.tanggal_mulai <= now) &&
            (!announcement.tanggal_selesai ||
              announcement.tanggal_selesai >= now);

          return isForDosen && isActive;
        });

        filtered.sort((a, b) => {
          if (a.prioritas === "high" && b.prioritas !== "high") return -1;
          if (a.prioritas !== "high" && b.prioritas === "high") return 1;

          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });

        return filtered;
      };

      if (hasCachedData) {
        setAnnouncements(filterAnnouncements(cachedEntry.data));
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(cachedEntry.timestamp || null);
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan notifikasi tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada notifikasi tersimpan.",
        );
      }

      const data = await cacheAPI(cacheKey, () => getAllAnnouncements(), {
        ttl: 10 * 60 * 1000,
        forceRefresh,
        staleWhileRevalidate: true,
      });

      setAnnouncements(filterAnnouncements(data));
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    } catch (err: any) {
      console.error("Error loading announcements:", err);
      if (announcements.length > 0 || !navigator.onLine) {
        setIsOfflineData(true);
      }
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
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

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return null;

    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(lastUpdatedAt);
  }, [lastUpdatedAt]);

  if (loading) {
    return (
      <div className="role-page-shell">
        <div className="role-page-content app-container space-y-6 py-4 sm:space-y-8 sm:py-6 lg:py-8">
          <PageHeader
            title="Notifikasi"
            description="Informasi dan pemberitahuan penting untuk kegiatan pengajaran dan koordinasi laboratorium."
            className="section-shell"
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="overflow-hidden rounded-3xl border border-border/60 bg-white/90 shadow-lg shadow-slate-200/60"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-5 w-28 rounded-full" />
                    </div>
                    <Skeleton className="h-7 w-3/4 rounded-full" />
                    <Skeleton className="h-4 w-1/2 rounded-full" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-11/12 rounded-full" />
                    <Skeleton className="h-4 w-2/3 rounded-full" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-primary/5 via-white to-warning/5 shadow-lg shadow-primary/10">
              <CardContent className="space-y-4 p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    Menyiapkan panel notifikasi
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Sistem sedang memuat informasi terbaru, termasuk pengumuman
                    prioritas tinggi dan lampiran pendukung.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="role-page-shell">
        <div className="role-page-content app-container space-y-6 py-4 sm:space-y-8 sm:py-6 lg:py-8">
          <PageHeader
            title="Notifikasi"
            description="Informasi dan pemberitahuan penting untuk kegiatan pengajaran dan koordinasi laboratorium."
            className="section-shell"
          />

          <Alert
            className="rounded-3xl border-danger/30 bg-danger/10 text-danger shadow-sm"
            variant="destructive"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="role-page-shell">
      <div className="role-page-content app-container space-y-6 py-4 sm:space-y-8 sm:py-6 lg:py-8">
        <PageHeader
          title="Notifikasi"
          description="Informasi dan pemberitahuan penting untuk kegiatan pengajaran, administrasi kelas, dan koordinasi laboratorium."
          className="section-shell"
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/85 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur">
              <Bell className="h-4 w-4 text-primary" />
              <span>{announcements.length} Notifikasi Aktif</span>
            </div>
          }
        />

        {(isOfflineData || !navigator.onLine) && (
          <Alert className="rounded-3xl border-warning/40 bg-warning/10 text-foreground shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notifikasi dosen sedang memakai snapshot lokal dari perangkat.
              {lastUpdatedLabel
                ? ` Pembaruan terakhir: ${lastUpdatedLabel}.`
                : ""}
            </AlertDescription>
          </Alert>
        )}

        {announcements.length === 0 ? (
          <Card className="overflow-hidden rounded-3xl border border-dashed border-primary/30 bg-white/85 shadow-lg shadow-slate-200/60">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <Bell className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Tidak ada notifikasi aktif
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Pengumuman baru untuk dosen akan tampil di sini agar Anda dapat
                memantau agenda, perubahan jadwal, dan informasi akademik dengan
                cepat.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)] xl:gap-6">
            <div className="space-y-4 xl:space-y-5">
              {announcements.map((announcement) => (
                <Card
                  key={announcement.id}
                  className={`interactive-card overflow-hidden rounded-3xl border bg-white/90 shadow-lg shadow-slate-200/60 ${
                    announcement.prioritas === "high"
                      ? "border-danger/30 bg-linear-to-br from-danger/5 via-white to-warning/5"
                      : "border-border/60"
                  }`}
                >
                  <CardHeader className="space-y-4 pb-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {announcement.prioritas &&
                            getPriorityBadge(announcement.prioritas)}
                          {announcement.tipe && getTypeBadge(announcement.tipe)}
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-lg leading-tight text-foreground sm:text-xl">
                            {announcement.judul}
                          </CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground sm:gap-4">
                            {announcement.created_at && (
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-primary" />
                                {format(
                                  new Date(announcement.created_at),
                                  "dd MMM yyyy, HH:mm",
                                )}
                              </span>
                            )}
                            {announcement.penulis && (
                              <span className="font-medium text-muted-foreground">
                                oleh {announcement.penulis.full_name}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="rounded-2xl border border-border/60 bg-muted/50 p-4 sm:p-5">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground sm:text-[15px]">
                        {announcement.konten}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      {announcement.attachment_url ? (
                        <a
                          href={announcement.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
                        >
                          <FileText className="h-4 w-4" />
                          Lihat Lampiran
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground/60">
                          Tidak ada lampiran
                        </span>
                      )}

                      {announcement.tanggal_selesai && (
                        <div className="text-sm font-medium text-muted-foreground">
                          Berlaku hingga{" "}
                          {format(
                            new Date(announcement.tanggal_selesai),
                            "dd MMM yyyy",
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4 xl:space-y-5">
              <Card className="overflow-hidden rounded-3xl border border-primary/10 bg-linear-to-br from-primary/5 via-white to-warning/5 shadow-lg shadow-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Ringkasan Notifikasi
                  </CardTitle>
                  <CardDescription>
                    Panel cepat untuk membaca kondisi informasi yang sedang
                    aktif.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                    <p className="text-sm text-muted-foreground">Total aktif</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {announcements.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                    <p className="text-sm text-muted-foreground">
                      Prioritas tinggi
                    </p>
                    <p className="mt-2 text-2xl font-bold text-danger">
                      {
                        announcements.filter(
                          (item) => item.prioritas === "high",
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                    <p className="text-sm text-muted-foreground">
                      Dengan lampiran
                    </p>
                    <p className="mt-2 text-2xl font-bold text-primary">
                      {
                        announcements.filter((item) => item.attachment_url)
                          .length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
