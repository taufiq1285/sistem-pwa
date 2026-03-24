/**
 * PresensiPage - Mahasiswa
 * View attendance records and statistics
 */

import { useState, useEffect, useMemo } from "react";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MapPin,
  WifiOff,
} from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/hooks/useAuth";
import { networkDetector } from "@/lib/offline/network-detector";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";
import {
  getMahasiswaKehadiran,
  type MahasiswaKehadiranRecord,
  type KehadiranStatus,
} from "@/lib/api/kehadiran.api";
import { toast } from "sonner";

export default function PresensiPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MahasiswaKehadiranRecord[]>([]);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const presensiCacheKey = user?.mahasiswa?.id
    ? `mahasiswa_presensi_${user.mahasiswa.id}`
    : null;

  useEffect(() => {
    if (user?.id) {
      loadPresensi();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!presensiCacheKey) {
      return;
    }

    const handleCacheUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        key?: string;
        data?: MahasiswaKehadiranRecord[];
      }>;

      if (customEvent.detail?.key !== presensiCacheKey) {
        return;
      }

      const nextRecords = customEvent.detail?.data;
      if (!Array.isArray(nextRecords)) {
        return;
      }

      setRecords(nextRecords);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
    };

    window.addEventListener("cache:updated", handleCacheUpdated);

    return () => {
      window.removeEventListener("cache:updated", handleCacheUpdated);
    };
  }, [presensiCacheKey]);

  const loadPresensi = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // ✅ Check if mahasiswa data exists
      if (!user?.mahasiswa?.id || !presensiCacheKey) {
        toast.error("Profil mahasiswa tidak ditemukan");
        return;
      }

      const cachedEntry =
        await getCachedData<MahasiswaKehadiranRecord[]>(presensiCacheKey);
      const hasCachedData = Array.isArray(cachedEntry?.data);

      if (hasCachedData) {
        setRecords(cachedEntry!.data);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(cachedEntry!.timestamp);
        setLoading(false);
      }

      if (forceRefresh && !navigator.onLine) {
        throw new Error(
          hasCachedData
            ? "Perangkat sedang offline. Menampilkan presensi tersimpan terakhir."
            : "Perangkat sedang offline dan belum ada data presensi tersimpan.",
        );
      }

      // Use cacheAPI with stale-while-revalidate for offline support
      const data = await cacheAPI(
        presensiCacheKey,
        () => getMahasiswaKehadiran(user.mahasiswa.id),
        {
          ttl: 10 * 60 * 1000,
          forceRefresh,
          staleWhileRevalidate: true,
        },
      );

      setRecords(data);
      setIsOfflineData(false);
      setLastUpdatedAt(Date.now());
      console.log("[Presensi] Data loaded:", data.length, "records");
    } catch (error: any) {
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - could not load presensi");
        setIsOfflineData(true);
        toast.info(
          error?.message ||
            "Mode offline - menampilkan data presensi tersimpan",
        );
      } else {
        console.error("Error loading presensi:", error);
        if (records.length > 0) {
          setIsOfflineData(true);
        }
        toast.error(error?.message || "Gagal memuat data presensi");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = records.length;
    const hadir = records.filter((r) => r.status === "hadir").length;
    const izin = records.filter((r) => r.status === "izin").length;
    const sakit = records.filter((r) => r.status === "sakit").length;
    const alpha = records.filter((r) => r.status === "alpha").length;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, izin, sakit, alpha, persentase };
  };

  const getStatusBadge = (status: KehadiranStatus) => {
    const statusMap: Record<
      KehadiranStatus,
      "success" | "info" | "warning" | "error"
    > = {
      hadir: "success",
      izin: "info",
      sakit: "warning",
      alpha: "error",
    };
    const labels: Record<KehadiranStatus, string> = {
      hadir: "Hadir",
      izin: "Izin",
      sakit: "Sakit",
      alpha: "Alpha",
    };
    const icons: Record<KehadiranStatus, any> = {
      hadir: CheckCircle2,
      izin: Clock,
      sakit: AlertCircle,
      alpha: XCircle,
    };
    const Icon = icons[status];
    return (
      <StatusBadge status={statusMap[status]} pulse={false}>
        <Icon className="h-3 w-3 mr-1" />
        {labels[status]}
      </StatusBadge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const stats = calculateStats();
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return null;
    }

    return new Date(lastUpdatedAt).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [lastUpdatedAt]);

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <DashboardSkeleton />
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <GlassCard
          intensity="medium"
          className="border-white/40 bg-white/80 shadow-xl dark:border-white/10 dark:bg-card"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                  <ClipboardCheck className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Presensi Praktikum
                  </h1>
                  <p className="text-muted-foreground">
                    Rekap kehadiran praktikum Anda secara ringkas dan
                    terstruktur.
                  </p>
                  {(isOfflineData || lastUpdatedLabel) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {isOfflineData && (
                        <span className="inline-flex items-center gap-1 font-medium text-warning">
                          <WifiOff className="h-4 w-4" />
                          Menampilkan presensi tersimpan lokal
                        </span>
                      )}
                      {lastUpdatedLabel && (
                        <span>Update terakhir: {lastUpdatedLabel}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {isOfflineData && (
          <Alert className="border-warning/30 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/10 dark:text-warning">
            <AlertDescription>
              Halaman presensi tetap bisa dibuka dari cache lokal saat offline.
              Data yang tampil adalah snapshot terakhir yang berhasil disimpan
              dan mungkin belum memuat absensi terbaru.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <DashboardCard
            title="Total Pertemuan"
            value={stats.total}
            icon={Calendar}
            color="blue"
          />
          <DashboardCard
            title="Hadir"
            value={stats.hadir}
            icon={CheckCircle2}
            color="green"
          />
          <DashboardCard
            title="Izin"
            value={stats.izin}
            icon={Clock}
            color="blue"
          />
          <DashboardCard
            title="Sakit"
            value={stats.sakit}
            icon={AlertCircle}
            color="amber"
          />
          <DashboardCard
            title="Alpha"
            value={stats.alpha}
            icon={XCircle}
            color="red"
          />
        </div>

        {/* Persentase Kehadiran */}
        <GlassCard
          intensity="low"
          className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
        >
          <CardHeader>
            <CardTitle>Persentase Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="text-5xl font-bold text-primary">
                {stats.persentase}%
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full rounded-full bg-muted">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      stats.persentase >= 75
                        ? "bg-success"
                        : stats.persentase >= 50
                          ? "bg-warning"
                          : "bg-danger"
                    }`}
                    style={{ width: `${stats.persentase}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stats.persentase >= 75
                    ? "Kehadiran Anda sangat baik!"
                    : stats.persentase >= 50
                      ? "Tingkatkan kehadiran Anda"
                      : "Perhatian! Kehadiran di bawah standar"}
                </p>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        {/* Riwayat Presensi */}
        <GlassCard
          intensity="low"
          className="border-white/40 bg-white/85 shadow-lg dark:border-white/10 dark:bg-card"
        >
          <CardHeader>
            <CardTitle>Riwayat Presensi</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <Alert className="border-border/60 bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground">
                  Belum ada data presensi. Data akan muncul setelah dosen
                  melakukan absensi.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Topik</TableHead>
                      <TableHead>Lab</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium text-foreground">
                          {formatDate(record.jadwal?.tanggal_praktikum || "")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {record.jadwal?.kelas?.mata_kuliah?.nama_mk ||
                                "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {record.jadwal?.kelas?.nama_kelas || "-"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.jadwal?.topik || "Praktikum"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {record.jadwal?.laboratorium?.nama_lab || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTime(record.jadwal?.jam_mulai || "")} -{" "}
                          {formatTime(record.jadwal?.jam_selesai || "")}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(record.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
