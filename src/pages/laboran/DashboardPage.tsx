/**
 * Approval-first laboran dashboard for urgent borrowing, lab status, inventory, and daily schedule.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconFlask,
  IconPackage,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DashboardSkeleton,
  EmptyState,
  ErrorFallback,
} from "@/components/common";
import {
  getInventoryAlerts,
  getLabScheduleToday,
  getLaboranStats,
  getPendingApprovals,
  processApproval,
  type InventoryAlert,
  type LabScheduleToday,
  type LaboranStats,
  type PendingApproval,
} from "@/lib/api/laboran.api";
import { cn } from "@/lib/utils";

const AUTO_REFRESH_MS = 5 * 60 * 1000;
const PULL_THRESHOLD = 70;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

function labStatus(schedule: LabScheduleToday | undefined) {
  if (!schedule) {
    return { label: "Kosong", className: "bg-emerald-50 text-emerald-700" };
  }
  return { label: "Dipakai", className: "bg-blue-50 text-blue-700" };
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LaboranStats | null>(null);
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [inventory, setInventory] = useState<InventoryAlert[]>([]);
  const [schedule, setSchedule] = useState<LabScheduleToday[]>([]);

  const loadDashboard = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);
      const [nextStats, nextPending, nextInventory, nextSchedule] =
        await Promise.all([
          getLaboranStats(),
          getPendingApprovals(10),
          getInventoryAlerts(10),
          getLabScheduleToday(10),
        ]);

      setStats(nextStats);
      setPending(nextPending);
      setInventory(nextInventory);
      setSchedule(nextSchedule);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat dashboard laboran.",
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

  const handleApproval = async (
    peminjamanId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      setActionLoadingId(peminjamanId);
      await processApproval({
        peminjaman_id: peminjamanId,
        status,
        rejection_reason:
          status === "rejected" ? "Ditolak dari dashboard laboran." : undefined,
      });
      toast.success(
        status === "approved" ? "Peminjaman disetujui" : "Peminjaman ditolak",
      );
      await loadDashboard(true);
    } catch (approvalError: unknown) {
      toast.error(
        approvalError instanceof Error
          ? approvalError.message
          : "Gagal memproses peminjaman",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const labCards = useMemo(() => {
    const names = Array.from(
      new Set(schedule.map((item) => item.laboratorium_nama).filter(Boolean)),
    );
    const filled =
      names.length > 0 ? names : ["Lab 1", "Lab 2", "Lab 3", "Lab 4", "Lab 5"];
    return filled.slice(0, 5).map((name) => ({
      name,
      current: schedule.find((item) => item.laboratorium_nama === name),
    }));
  }, [schedule]);

  if (loading) {
    return (
      <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
        <div className="section-shell rounded-2xl p-5">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
        <DashboardSkeleton role="laboran" />
      </div>
    );
  }
  if (error)
    return <ErrorFallback message={error} onRetry={refreshDashboard} />;
  if (!stats)
    return <EmptyState variant="no-data" context="dashboard laboran" />;

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Laboran
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Persetujuan dulu, lalu pantau lab dan inventaris kritis.
          </p>
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

      {pending.length > 0 && (
        <Alert className="border-red-200 bg-red-50 p-5 text-red-950">
          <IconAlertTriangle
            className="size-6 text-red-700"
            aria-hidden="true"
          />
          <AlertDescription>
            <p className="text-heading text-red-950">
              {pending.length} peminjaman menunggu persetujuan.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {pending.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-red-200 bg-white p-4"
                >
                  <p className="text-small font-semibold text-text-primary">
                    {item.inventaris_nama}
                  </p>
                  <p className="mt-1 text-caption text-text-muted">
                    {item.peminjam_nama} · {item.jumlah_pinjam} item ·{" "}
                    {formatDate(item.tanggal_pinjam)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={actionLoadingId === item.id}
                      onClick={() => void handleApproval(item.id, "approved")}
                    >
                      <IconCheck className="size-4" aria-hidden="true" />
                      Setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === item.id}
                      onClick={() => void handleApproval(item.id, "rejected")}
                    >
                      <IconX className="size-4" aria-hidden="true" />
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Lab", value: stats.totalLab, icon: IconFlask },
          {
            label: "Inventaris",
            value: stats.totalInventaris,
            icon: IconPackage,
          },
          { label: "Pending", value: stats.pendingApprovals, icon: IconClock },
          {
            label: "Stok Kritis",
            value: stats.lowStockAlerts,
            icon: IconAlertTriangle,
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

      <Card className="border-border/70 bg-bg-primary">
        <CardHeader>
          <CardTitle className="text-heading">Status Lab Real-time</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {labCards.map((lab) => {
            const status = labStatus(lab.current);
            return (
              <div
                key={lab.name}
                className="rounded-xl border border-border/70 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-small font-semibold text-text-primary">
                    {lab.name}
                  </p>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>
                <p className="mt-3 text-caption text-text-muted">
                  {lab.current
                    ? `${lab.current.kelas_nama} · ${lab.current.mata_kuliah_nama}`
                    : "Tidak ada kelas berjalan"}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 bg-bg-primary">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-heading">Inventaris Kritis</CardTitle>
            <Badge className="bg-red-50 text-red-700">{inventory.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventory.length === 0 ? (
              <EmptyState variant="no-data" context="inventaris" />
            ) : (
              inventory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-small font-semibold text-text-primary">
                        {item.nama_barang}
                      </p>
                      <p className="text-caption text-text-muted">
                        {item.kode_barang} · {item.laboratorium_nama}
                      </p>
                    </div>
                    <Badge className="bg-red-50 text-red-700">
                      {item.jumlah_tersedia}/{item.jumlah}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-bg-primary">
          <CardHeader>
            <CardTitle className="text-heading">Jadwal Lab Hari Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedule.length === 0 ? (
              <EmptyState variant="no-data" context="jadwal" />
            ) : (
              schedule.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-border/70 p-4"
                >
                  <div className="text-center">
                    <p className="text-small font-semibold text-role-accent">
                      {formatTime(item.jam_mulai)}
                    </p>
                    <div className="mx-auto mt-1 h-full w-px bg-border" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-semibold text-text-primary">
                      {item.kelas_nama}
                    </p>
                    <p className="text-caption text-text-muted">
                      {item.mata_kuliah_nama} · {item.dosen_nama}
                    </p>
                    <p className="text-caption text-text-muted">
                      {item.laboratorium_nama} · {formatTime(item.jam_mulai)}-
                      {formatTime(item.jam_selesai)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => navigate("/laboran/persetujuan")}
        >
          Buka halaman persetujuan
        </Button>
      </div>
    </div>
  );
}

export default DashboardPage;
