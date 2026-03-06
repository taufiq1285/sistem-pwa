/**
 * Pengumuman Page - Mahasiswa
 * View announcements and notifications relevant to students
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
import { Badge } from "@/components/ui/badge";
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
        "mahasiswa_announcements",
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
        const isForMahasiswa =
          targetRoles.includes("mahasiswa") || targetRoles.length === 0;

        const isActive =
          (!announcement.tanggal_mulai || announcement.tanggal_mulai <= now) &&
          (!announcement.tanggal_selesai ||
            announcement.tanggal_selesai >= now);

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
        return <Badge variant="destructive">Penting</Badge>;
      case "medium":
        return (
          <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
            Menengah
          </Badge>
        );
      case "low":
        return <Badge variant="secondary">Biasa</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "info":
        return <Badge variant="outline">Informasi</Badge>;
      case "warning":
        return (
          <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
            Peringatan
          </Badge>
        );
      case "event":
        return (
          <Badge className="bg-blue-600 text-white hover:bg-blue-700">Event</Badge>
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Notifikasi
            </h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Informasi dan pemberitahuan penting
            </p>
          </div>
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
    );
  }

  if (error) {
    return (
      <div className="app-container space-y-6">
        <div className="section-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Notifikasi
            </h1>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Informasi dan pemberitahuan penting
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => loadAnnouncements(true)}
            className="w-full border-blue-200 bg-white text-blue-700 hover:bg-blue-50 sm:w-auto"
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Notifikasi
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Informasi dan pemberitahuan penting
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
            <Bell className="h-4 w-4 text-blue-600" />
            {announcements.length} Notifikasi Aktif
          </div>
          <Button
            variant="outline"
            onClick={() => loadAnnouncements(true)}
            disabled={refreshing}
            className="w-full border-blue-200 bg-white text-blue-700 hover:bg-blue-50 sm:w-auto"
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Memuat..." : "Refresh"}
          </Button>
        </div>
      </div>

      {announcements.length === 0 ? (
        <Card className="rounded-2xl border border-blue-100/70 bg-white/90 shadow-sm">
          <CardContent className="py-14 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-blue-300" />
            <p className="text-slate-600">Tidak ada notifikasi saat ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`rounded-2xl border bg-white/95 shadow-sm transition-all duration-200 hover:shadow-md ${
                announcement.prioritas === "high"
                  ? "border-red-200 bg-red-50/50"
                  : "border-blue-100/70"
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
                    <CardTitle className="text-lg text-slate-900 sm:text-xl">
                      {announcement.judul}
                    </CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
                      {announcement.created_at && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Calendar className="h-4 w-4" />
                          {format(
                            new Date(announcement.created_at),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </span>
                      )}
                      {announcement.penulis && (
                        <span className="text-slate-500">
                          oleh {announcement.penulis.full_name}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 sm:text-base">
                  {announcement.konten}
                </p>

                {announcement.attachment_url && (
                  <div className="mt-4 border-t border-blue-100 pt-4">
                    <a
                      href={announcement.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 transition-colors hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4" />
                      Lihat Lampiran
                    </a>
                  </div>
                )}

                {announcement.tanggal_selesai && (
                  <div className="mt-4 text-xs text-slate-500 sm:text-sm">
                    Berlaku hingga{" "}
                    {format(new Date(announcement.tanggal_selesai), "dd MMM yyyy")}
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
