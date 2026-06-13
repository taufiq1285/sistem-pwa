/**
 * Clean mahasiswa dashboard focused on motivation, deadlines, progress, and weekly schedule.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconBook,
  IconCalendar,
  IconClock,
  IconDownload,
  IconNotebook,
  IconRefresh,
  IconSchool,
  IconStar,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DashboardSkeleton,
  EmptyState,
  ErrorFallback,
} from "@/components/common";
import {
  getDashboardKelas,
  getMahasiswaStats,
  getMyJadwal,
  type JadwalMahasiswa,
  type MahasiswaStats,
  type MyKelas,
} from "@/lib/api/mahasiswa.api";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

const AUTO_REFRESH_MS = 5 * 60 * 1000;
const PULL_THRESHOLD = 70;

interface AvailableQuiz {
  id: string;
  judul: string;
  tanggal_selesai: string;
  mata_kuliah_nama: string;
}

interface RecentGrade {
  id: string;
  nilai_akhir: number | null;
  created_at: string;
  mata_kuliah_nama: string;
}

function initials(name?: string | null): string {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "M"
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function countdown(value: string): string {
  const diffMs = new Date(value).getTime() - Date.now();
  if (diffMs <= 0) return "deadline lewat";
  const hours = Math.ceil(diffMs / 3_600_000);
  if (hours < 24) return `${hours} jam lagi`;
  return `${Math.ceil(hours / 24)} hari lagi`;
}

function deadlineLevel(value: string): "urgent" | "warning" | "normal" {
  const diffMs = new Date(value).getTime() - Date.now();
  if (diffMs <= 24 * 3_600_000) return "urgent";
  if (diffMs <= 3 * 24 * 3_600_000) return "warning";
  return "normal";
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

async function getAvailableQuizzes(): Promise<AvailableQuiz[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("kuis")
      .select("id, judul, tanggal_selesai, mata_kuliah:mata_kuliah_id(nama_mk)")
      .eq("status", "published")
      .gte("tanggal_selesai", now)
      .order("tanggal_selesai", { ascending: true })
      .limit(5);

    if (error) throw error;

    return (
      (data || []) as Array<{
        id: string;
        judul: string;
        tanggal_selesai: string;
        mata_kuliah?: { nama_mk?: string | null } | null;
      }>
    ).map((item) => ({
      id: item.id,
      judul: item.judul,
      tanggal_selesai: item.tanggal_selesai,
      mata_kuliah_nama: item.mata_kuliah?.nama_mk || "Mata kuliah",
    }));
  } catch (error) {
    console.error("Gagal memuat kuis tersedia:", error);
    return [];
  }
}

async function getRecentGrades(): Promise<RecentGrade[]> {
  try {
    const { data, error } = await supabase
      .from("nilai")
      .select(
        "id, nilai_akhir, created_at, mata_kuliah:mata_kuliah_id(nama_mk)",
      )
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    return (
      (data || []) as Array<{
        id: string;
        nilai_akhir: number | null;
        created_at: string;
        mata_kuliah?: { nama_mk?: string | null } | null;
      }>
    ).map((item) => ({
      id: item.id,
      nilai_akhir: item.nilai_akhir,
      created_at: item.created_at,
      mata_kuliah_nama: item.mata_kuliah?.nama_mk || "Mata kuliah",
    }));
  } catch (error) {
    console.error("Gagal memuat nilai terbaru:", error);
    return [];
  }
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MahasiswaStats | null>(null);
  const [kelas, setKelas] = useState<MyKelas[]>([]);
  const [jadwal, setJadwal] = useState<JadwalMahasiswa[]>([]);
  const [quizzes, setQuizzes] = useState<AvailableQuiz[]>([]);
  const [grades, setGrades] = useState<RecentGrade[]>([]);

  const loadDashboard = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      const [nextStats, nextKelas, nextJadwal, nextQuizzes, nextGrades] =
        await Promise.all([
          getMahasiswaStats(),
          getDashboardKelas(),
          getMyJadwal(5),
          getAvailableQuizzes(),
          getRecentGrades(),
        ]);

      setStats(nextStats);
      setKelas(nextKelas);
      setJadwal(nextJadwal);
      setQuizzes(nextQuizzes);
      setGrades(nextGrades);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat dashboard mahasiswa.",
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

  const nearestDeadline = quizzes.find(
    (item) => deadlineLevel(item.tanggal_selesai) !== "normal",
  );

  if (loading) return <DashboardSkeleton role="mahasiswa" />;
  if (error)
    return <ErrorFallback message={error} onRetry={refreshDashboard} />;
  if (!stats)
    return <EmptyState variant="no-data" context="dashboard mahasiswa" />;

  const primaryKelas = kelas[0];

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-role-accent text-lg font-semibold text-white">
              {initials(user?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user?.full_name || "Mahasiswa"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              NIM {user?.mahasiswa?.nim || "-"} · Semester{" "}
              {user?.mahasiswa?.semester || "-"} ·{" "}
              {primaryKelas?.nama_kelas || "Belum ada kelas aktif"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={refreshDashboard}
            disabled={refreshing}
          >
            <IconRefresh
              className={cn("size-4 mr-2", refreshing && "animate-spin")}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </div>

      {nearestDeadline && (
        <Alert
          className={cn(
            deadlineLevel(nearestDeadline.tanggal_selesai) === "urgent"
              ? "border-red-200 bg-red-50 text-red-950"
              : "border-amber-200 bg-amber-50 text-amber-950",
          )}
        >
          <IconAlertTriangle className="size-5" aria-hidden="true" />
          <AlertDescription className="font-medium">
            {nearestDeadline.judul} deadline{" "}
            {countdown(nearestDeadline.tanggal_selesai)}.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Nilai Rata-rata",
            value: stats.rataRataNilai ?? 0,
            suffix: "",
            icon: IconStar,
          },
          {
            label: "Kehadiran %",
            value: stats.jadwalHariIni > 0 ? 100 : 0,
            suffix: "%",
            icon: IconTrendingUp,
          },
          {
            label: "Logbook Terisi",
            value: grades.length,
            suffix: "",
            icon: IconNotebook,
          },
          {
            label: "Materi Offline",
            value: kelas.length,
            suffix: "",
            icon: IconDownload,
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
                    {item.suffix}
                  </p>
                </div>
                <Icon className="size-8 text-role-accent" aria-hidden="true" />
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 bg-bg-primary">
          <CardHeader>
            <CardTitle className="text-heading">Kuis Tersedia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quizzes.length === 0 ? (
              <EmptyState variant="no-data" context="kuis" />
            ) : (
              quizzes.map((item) => (
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
                        {item.mata_kuliah_nama}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {countdown(item.tanggal_selesai)}
                    </Badge>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => navigate("/mahasiswa/kuis")}
                  >
                    Kerjakan
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-bg-primary">
          <CardHeader>
            <CardTitle className="text-heading">Jadwal Minggu Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jadwal.length === 0 ? (
              <EmptyState variant="no-data" context="jadwal" />
            ) : (
              jadwal.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-border/70 p-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-role-accent-light text-role-accent">
                    <IconCalendar className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-semibold text-text-primary">
                      {item.mata_kuliah_nama}
                    </p>
                    <p className="text-caption text-text-muted">
                      {formatDate(item.tanggal_praktikum)} ·{" "}
                      {formatTime(item.jam_mulai)}-
                      {formatTime(item.jam_selesai)}
                    </p>
                    <p className="text-caption text-text-muted">
                      {item.lab_nama} · {item.kelas_nama}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 bg-bg-primary">
          <CardHeader>
            <CardTitle className="text-heading">Nilai Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {grades.length === 0 ? (
              <EmptyState variant="no-data" context="nilai" />
            ) : (
              grades.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 p-3"
                >
                  <div>
                    <p className="text-small font-semibold text-text-primary">
                      {item.mata_kuliah_nama}
                    </p>
                    <p className="text-caption text-text-muted">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <Badge className="bg-role-accent text-white">
                    {item.nilai_akhir ?? "-"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-bg-primary">
          <CardHeader>
            <CardTitle className="text-heading">Streak Kehadiran</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-role-accent-light text-role-accent">
              <IconClock className="size-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-semibold text-text-primary">
                {stats.jadwalHariIni > 0 ? 1 : 0} hari
              </p>
              <p className="text-small text-text-muted">
                Streak akan bertambah saat presensi praktikum tercatat.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default DashboardPage;
