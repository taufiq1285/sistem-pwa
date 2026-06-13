/**
 * Action-oriented dosen dashboard focused on classes, quiz progress, and reviews.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconBook,
  IconCalendar,
  IconChecks,
  IconClock,
  IconClipboardCheck,
  IconFileUpload,
  IconNotebook,
  IconPlus,
  IconRefresh,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DashboardSkeleton,
  EmptyState,
  ErrorFallback,
} from "@/components/common";
import {
  getActiveKuis,
  getDashboardKelas,
  getDosenStats,
  getPendingGrading,
  getUpcomingPracticum,
  type DosenStats,
  type KelasWithStats,
  type KuisWithStats,
  type PendingGrading,
  type UpcomingPracticum,
} from "@/lib/api/dosen.api";
import { getLogbookStats } from "@/lib/api/logbook.api";
import { useAuth } from "@/lib/hooks/useAuth";
import type { LogbookStats } from "@/types/logbook.types";
import { cn } from "@/lib/utils";

const AUTO_REFRESH_MS = 5 * 60 * 1000;
const PULL_THRESHOLD = 70;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function firstName(name?: string | null): string {
  return name?.split(" ").filter(Boolean)[0] || "Dosen";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function scheduleStatus(item: UpcomingPracticum): {
  label: "Selesai" | "Berlangsung" | "Akan Datang";
  className: string;
  pulse?: boolean;
} {
  const today = new Date().toISOString().slice(0, 10);
  if (item.tanggal_praktikum < today) {
    return { label: "Selesai", className: "bg-emerald-50 text-emerald-700" };
  }

  if (item.tanggal_praktikum === today) {
    return {
      label: "Berlangsung",
      className: "bg-blue-50 text-blue-700",
      pulse: true,
    };
  }

  return { label: "Akan Datang", className: "bg-slate-100 text-slate-700" };
}

function usePullToRefresh(onRefresh: () => void) {
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY === 0)
        startYRef.current = event.touches[0]?.clientY ?? null;
    };
    const handleTouchEnd = (event: TouchEvent) => {
      const start = startYRef.current;
      startYRef.current = null;
      if (start === null) return;
      const end = event.changedTouches[0]?.clientY ?? start;
      if (end - start >= PULL_THRESHOLD && window.scrollY === 0) onRefresh();
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh]);
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DosenStats | null>(null);
  const [kelas, setKelas] = useState<KelasWithStats[]>([]);
  const [jadwal, setJadwal] = useState<UpcomingPracticum[]>([]);
  const [kuis, setKuis] = useState<KuisWithStats[]>([]);
  const [pending, setPending] = useState<PendingGrading[]>([]);
  const [logbookStats, setLogbookStats] = useState<LogbookStats | null>(null);

  const loadDashboard = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      const [
        nextStats,
        nextKelas,
        nextJadwal,
        nextKuis,
        nextPending,
        nextLogbook,
      ] = await Promise.all([
        getDosenStats(true),
        getDashboardKelas(),
        getUpcomingPracticum(6),
        getActiveKuis(5),
        getPendingGrading(5),
        getLogbookStats(),
      ]);

      setStats(nextStats);
      setKelas(nextKelas);
      setJadwal(nextJadwal);
      setKuis(nextKuis);
      setPending(nextPending);
      setLogbookStats(nextLogbook);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat dashboard dosen.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshDashboard = useCallback(() => {
    void queryClient.invalidateQueries();
    void loadDashboard(true);
  }, [loadDashboard, queryClient]);

  usePullToRefresh(refreshDashboard);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const interval = window.setInterval(refreshDashboard, AUTO_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [refreshDashboard]);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  if (loading) return <DashboardSkeleton role="dosen" />;
  if (error)
    return <ErrorFallback message={error} onRetry={refreshDashboard} />;
  if (!stats) return <EmptyState variant="no-data" context="dashboard dosen" />;

  const pendingLogbookCount =
    (logbookStats?.submitted || 0) + (logbookStats?.draft || 0);

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {firstName(user?.full_name)}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fokus hari ini: kelas, kuis aktif, presensi, dan review logbook.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <IconRefresh
              className={cn("size-4", refreshing && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </div>
      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Absen Kelas",
            icon: IconClipboardCheck,
            path: "/dosen/kehadiran",
          },
          { label: "Buat Kuis", icon: IconPlus, path: "/dosen/kuis/create" },
          {
            label: "Upload Materi",
            icon: IconFileUpload,
            path: "/dosen/materi",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              className="h-12 justify-start bg-role-accent text-white hover:bg-role-accent-hover"
              onClick={() => navigate(action.path)}
            >
              <Icon className="size-5" aria-hidden="true" />
              {action.label}
            </Button>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 bg-bg-primary">
          <CardHeader>
            <CardTitle className="text-heading">Jadwal Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jadwal.length === 0 ? (
              <EmptyState variant="no-data" context="jadwal" />
            ) : (
              jadwal.map((item) => {
                const status = scheduleStatus(item);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-small font-semibold text-text-primary">
                          {item.mata_kuliah_nama || item.kelas}
                        </p>
                        <p className="text-small text-text-muted">
                          {formatDate(item.tanggal_praktikum)} ·{" "}
                          {formatTime(item.jam_mulai)}-
                          {formatTime(item.jam_selesai)}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          status.className,
                          status.pulse && "animate-pulse",
                        )}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-caption text-text-muted">
                      {item.kelas_nama || item.kelas} · {item.lab_nama}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-bg-primary">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-heading">Kuis Aktif</CardTitle>
            <Badge variant="outline">{stats.activeKuis} aktif</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {kuis.length === 0 ? (
              <EmptyState variant="no-data" context="kuis" />
            ) : (
              kuis.map((item) => {
                const progress =
                  item.total_attempts > 0
                    ? Math.round(
                        (item.submitted_count / item.total_attempts) * 100,
                      )
                    : 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-small font-semibold text-text-primary">
                          {item.judul}
                        </p>
                        <p className="text-caption text-text-muted">
                          Deadline {formatDate(item.tanggal_selesai)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate("/dosen/kuis")}
                      >
                        Lihat Detail
                      </Button>
                    </div>
                    <Progress value={progress} className="mt-3" />
                    <p className="mt-2 text-caption text-text-muted">
                      {progress}% selesai · {item.kelas_nama}
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 bg-bg-primary">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-heading">
              Logbook Menunggu Review
            </CardTitle>
            <Badge className="bg-red-50 text-red-700">
              {pendingLogbookCount}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <EmptyState variant="no-data" context="logbook" />
            ) : (
              pending.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-role-accent-light text-role-accent">
                    <IconNotebook className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-semibold text-text-primary">
                      {item.mahasiswa_nama}
                    </p>
                    <p className="text-caption text-text-muted">
                      {item.mata_kuliah_nama} · {formatDate(item.submitted_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-bg-primary">
          <CardHeader>
            <CardTitle className="text-heading">Kehadiran Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {kelas.length === 0 ? (
              <EmptyState variant="no-data" context="kelas" />
            ) : (
              kelas.slice(0, 6).map((item) => {
                const percent = item.totalMahasiswa > 0 ? 100 : 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-small font-semibold text-text-primary">
                        {item.nama_kelas}
                      </p>
                      <span className="text-caption text-text-muted">
                        {item.totalMahasiswa}/{item.totalMahasiswa}
                      </span>
                    </div>
                    <Progress value={percent} className="mt-3" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Kelas", value: stats.totalKelas, icon: IconBook },
          { label: "Mahasiswa", value: stats.totalMahasiswa, icon: IconUsers },
          { label: "Kuis Aktif", value: stats.activeKuis, icon: IconChecks },
          {
            label: "Pending Nilai",
            value: stats.pendingGrading,
            icon: IconClock,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border/70 bg-bg-primary">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-small text-text-muted">{item.label}</p>
                  <p className="mt-1 text-3xl font-semibold text-text-primary">
                    {item.value}
                  </p>
                </div>
                <Icon className="size-8 text-role-accent" aria-hidden="true" />
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

export default DashboardPage;
