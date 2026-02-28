/**
 * Pengumuman Page - Dosen
 * View announcements and notifications relevant to lecturers
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
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
import { AlertCircle, Bell, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

export default function DosenPengumumanPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const data = await cacheAPI(
        "dosen_announcements",
        () => getAllAnnouncements(),
        {
          ttl: 10 * 60 * 1000, // 10 minutes - announcements change moderately
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      // Filter announcements for dosen role
      const now = new Date().toISOString();
      const filtered = data.filter((announcement) => {
        // Check if announcement is for dosen or all roles
        const targetRoles = announcement.target_role || [];
        const isForDosen =
          targetRoles.includes("dosen") || targetRoles.length === 0;

        // Check if announcement is currently active
        const isActive =
          (!announcement.tanggal_mulai || announcement.tanggal_mulai <= now) &&
          (!announcement.tanggal_selesai ||
            announcement.tanggal_selesai >= now);

        return isForDosen && isActive;
      });

      // Sort by priority and date
      filtered.sort((a, b) => {
        // High priority first
        if (a.prioritas === "high" && b.prioritas !== "high") return -1;
        if (a.prioritas !== "high" && b.prioritas === "high") return 1;

        // Then by created date (newest first)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setAnnouncements(filtered);
    } catch (err: any) {
      console.error("Error loading announcements:", err);
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Penting</Badge>;
      case "medium":
        return <Badge variant="default">Menengah</Badge>;
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
        return <Badge className="bg-yellow-500">Peringatan</Badge>;
      case "event":
        return <Badge className="bg-blue-500">Event</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="role-page-shell role-page-content space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Notifikasi</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Informasi dan pemberitahuan penting
          </p>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
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
      <div className="role-page-shell role-page-content space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Notifikasi</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Informasi dan pemberitahuan penting
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="role-page-shell role-page-content space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Notifikasi</h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">
            Informasi dan pemberitahuan penting
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Bell className="h-5 w-5" />
          <span className="text-sm font-medium">
            {announcements.length} Notifikasi Aktif
          </span>
        </div>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada notifikasi saat ini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className={`interactive-card border-0 shadow-lg ${
                announcement.prioritas === "high"
                  ? "border border-red-200 bg-red-50/50"
                  : ""
              }`}
            >
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {announcement.prioritas &&
                        getPriorityBadge(announcement.prioritas)}
                      {announcement.tipe && getTypeBadge(announcement.tipe)}
                    </div>
                    <CardTitle className="text-lg sm:text-xl">
                      {announcement.judul}
                    </CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                      {announcement.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(
                            new Date(announcement.created_at),
                            "dd MMM yyyy, HH:mm",
                          )}
                        </span>
                      )}
                      {announcement.penulis && (
                        <span className="text-sm">
                          oleh {announcement.penulis.full_name}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {announcement.konten}
                  </p>
                </div>

                {announcement.attachment_url && (
                  <div className="mt-4 pt-4 border-t">
                    <a
                      href={announcement.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4" />
                      Lihat Lampiran
                    </a>
                  </div>
                )}

                {announcement.tanggal_selesai && (
                  <div className="mt-4 text-sm text-gray-500">
                    Berlaku hingga:{" "}
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
