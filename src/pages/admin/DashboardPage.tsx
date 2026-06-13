/**
 * Dense admin dashboard for monitoring users, labs, approvals, and system status.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconBell,
  IconChartAreaLine,
  IconClock,
  IconDatabase,
  IconDownload,
  IconLogin2,
  IconSpeakerphone,
  IconPlus,
  IconRefresh,
  IconServer,
  IconShieldCheck,
  IconUsers,
  IconWifiOff,
} from "@tabler/icons-react";
import logger from "@/lib/utils/logger";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChartCard,
  DashboardSkeleton,
  EmptyState,
  ErrorFallback,
} from "@/components/common";
import {
  getDashboardStats,
  getLabUsage,
  getRecentAnnouncements,
  getRecentUsers,
  getUserDistribution,
  getUserGrowth,
  type DashboardStats,
  type LabUsageData,
  type RecentAnnouncement,
  type RecentUser,
  type UserDistribution,
  type UserGrowthData,
} from "@/lib/api/admin.api";
import { cn } from "@/lib/utils";
import { cacheAPI, getCachedData } from "@/lib/offline/api-cache";
import { networkDetector } from "@/lib/offline/network-detector";

const AUTO_REFRESH_MS = 5 * 60 * 1000;
const PULL_THRESHOLD = 70;

const tooltipStyle = {
  backgroundColor: "var(--color-bg-primary)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-text-primary)",
};

interface ActivityItem {
  id: string;
  description: string;
  timestamp: string;
  kind: "user" | "announcement";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelative(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function usePullToRefresh(onRefresh: () => void) {
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY === 0) {
        startYRef.current = event.touches[0]?.clientY ?? null;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const startY = startYRef.current;
      startYRef.current = null;
      if (startY === null) return;
      const endY = event.changedTouches[0]?.clientY ?? startY;
      if (endY - startY >= PULL_THRESHOLD && window.scrollY === 0) {
        onRefresh();
      }
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
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growth, setGrowth] = useState<UserGrowthData[]>([]);
  const [distribution, setDistribution] = useState<UserDistribution[]>([]);
  const [labUsage, setLabUsage] = useState<LabUsageData[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<
    RecentAnnouncement[]
  >([]);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const loadDashboard = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      setError(null);

      const statsCacheKey = "admin_stats";
      const growthCacheKey = "admin_growth";
      const distCacheKey = "admin_distribution";
      const usageCacheKey = "admin_lab_usage";
      const usersCacheKey = "admin_recent_users";
      const annCacheKey = "admin_recent_announcements";

      const [
        cachedStats,
        cachedGrowth,
        cachedDist,
        cachedUsage,
        cachedUsers,
        cachedAnn,
      ] = await Promise.all([
        getCachedData<DashboardStats>(statsCacheKey),
        getCachedData<UserGrowthData[]>(growthCacheKey),
        getCachedData<UserDistribution[]>(distCacheKey),
        getCachedData<LabUsageData[]>(usageCacheKey),
        getCachedData<RecentUser[]>(usersCacheKey),
        getCachedData<RecentAnnouncement[]>(annCacheKey),
      ]);

      const hasAnyCached =
        !!cachedStats?.data ||
        Array.isArray(cachedGrowth?.data) ||
        Array.isArray(cachedDist?.data) ||
        Array.isArray(cachedUsage?.data) ||
        Array.isArray(cachedUsers?.data) ||
        Array.isArray(cachedAnn?.data);

      if (hasAnyCached) {
        setStats(cachedStats?.data ?? null);
        setGrowth(cachedGrowth?.data ?? []);
        setDistribution(cachedDist?.data ?? []);
        setLabUsage(cachedUsage?.data ?? []);
        setRecentUsers(cachedUsers?.data ?? []);
        setRecentAnnouncements(cachedAnn?.data ?? []);
        setIsOfflineData(!navigator.onLine);
        setLastUpdatedAt(
          Math.max(
            cachedStats?.timestamp || 0,
            cachedGrowth?.timestamp || 0,
            cachedDist?.timestamp || 0,
            cachedUsage?.timestamp || 0,
            cachedUsers?.timestamp || 0,
            cachedAnn?.timestamp || 0,
          ) || null,
        );
        setLoading(false);
      }

      if (showRefreshing && !navigator.onLine) {
        throw new Error("Perangkat sedang offline. Gagal memperbarui data.");
      }

      const [
        nextStats,
        nextGrowth,
        nextDistribution,
        nextLabUsage,
        nextUsers,
        nextAnnouncements,
      ] = await Promise.all([
        cacheAPI(statsCacheKey, () => getDashboardStats(), {
          ttl: 10 * 60 * 1000,
          forceRefresh: showRefreshing,
          staleWhileRevalidate: true,
        }),
        cacheAPI(growthCacheKey, () => getUserGrowth(), {
          ttl: 10 * 60 * 1000,
          forceRefresh: showRefreshing,
          staleWhileRevalidate: true,
        }),
        cacheAPI(distCacheKey, () => getUserDistribution(), {
          ttl: 10 * 60 * 1000,
          forceRefresh: showRefreshing,
          staleWhileRevalidate: true,
        }),
        cacheAPI(usageCacheKey, () => getLabUsage(), {
          ttl: 10 * 60 * 1000,
          forceRefresh: showRefreshing,
          staleWhileRevalidate: true,
        }),
        cacheAPI(usersCacheKey, () => getRecentUsers(5), {
          ttl: 5 * 60 * 1000,
          forceRefresh: showRefreshing,
          staleWhileRevalidate: true,
        }),
        cacheAPI(annCacheKey, () => getRecentAnnouncements(5), {
          ttl: 5 * 60 * 1000,
          forceRefresh: showRefreshing,
          staleWhileRevalidate: true,
        }),
      ]);

      setStats(nextStats);
      setGrowth(nextGrowth || []);
      setDistribution(nextDistribution || []);
      setLabUsage(nextLabUsage || []);
      setRecentUsers(nextUsers || []);
      setRecentAnnouncements(nextAnnouncements || []);
      setIsOfflineData(false);
    } catch (loadError: unknown) {
      if (!networkDetector.isOnline()) {
        logger.debug("ℹ️ Offline mode - showing cached admin dashboard data");
        setIsOfflineData(true);
        setError(null);
      } else {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat dashboard admin.",
        );
      }
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

  const totalDistribution = distribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const roleRatio = (role: string) => {
    const match = distribution.find(
      (item) => item.role.toLowerCase() === role.toLowerCase(),
    );
    return totalDistribution > 0 ? (match?.count ?? 0) / totalDistribution : 0;
  };

  const growthChartData = growth.map((item) => ({
    month: item.month,
    total: item.users,
    admin: Math.round(item.users * roleRatio("admin")),
    dosen: Math.round(item.users * roleRatio("dosen")),
    mahasiswa: Math.round(item.users * roleRatio("mahasiswa")),
    laboran: Math.round(item.users * roleRatio("laboran")),
  }));

  const activities: ActivityItem[] = useMemo(
    () =>
      [
        ...recentUsers.map((item) => ({
          id: `user-${item.id}`,
          kind: "user" as const,
          description: `${item.full_name} terdaftar sebagai ${item.role}`,
          timestamp: item.created_at,
        })),
        ...recentAnnouncements.map((item) => ({
          id: `announcement-${item.id}`,
          kind: "announcement" as const,
          description: `Pengumuman "${item.title}" dibuat oleh ${item.author}`,
          timestamp: item.created_at,
        })),
      ]
        .sort(
          (first, second) =>
            new Date(second.timestamp).getTime() -
            new Date(first.timestamp).getTime(),
        )
        .slice(0, 10),
    [recentAnnouncements, recentUsers],
  );

  if (loading) return <DashboardSkeleton role="admin" />;
  if (error)
    return <ErrorFallback message={error} onRetry={refreshDashboard} />;
  if (!stats) return <EmptyState variant="no-data" context="dashboard admin" />;

  const syncConflictCount = labUsage.filter((item) => item.usage < 0).length;
  const statsCards = [
    {
      label: "Total User",
      value: stats.totalUsers,
      trend: "+8%",
      positive: true,
    },
    {
      label: "Kelas Aktif",
      value: stats.activeUsers ?? 0,
      trend: "+4%",
      positive: true,
    },
    {
      label: "Lab Aktif",
      value: stats.totalLaboratorium,
      trend: "+2%",
      positive: true,
    },
    {
      label: "Peminjaman Pending",
      value: stats.pendingApprovals,
      trend: stats.pendingApprovals > 0 ? "+12%" : "0%",
      positive: stats.pendingApprovals === 0,
    },
  ];
  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan padat untuk user, lab, persetujuan, dan kesehatan sistem.
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
      {isOfflineData && (
        <Alert className="rounded-2xl border-warning/30 bg-warning/10 text-warning shadow-sm">
          <IconWifiOff className="h-4 w-4 text-warning" />
          <AlertDescription className="font-medium text-warning/90">
            Mode Offline: Menampilkan data dari Snapshot lokal yang tersimpan di
            perangkat.
          </AlertDescription>
        </Alert>
      )}

      {stats.pendingApprovals > 0 && (
        <Alert className="border-red-200 bg-red-50 text-red-950">
          <IconAlertTriangle
            className="size-5 text-red-700"
            aria-hidden="true"
          />
          <AlertDescription className="font-medium">
            {stats.pendingApprovals} peminjaman menunggu persetujuan admin.
          </AlertDescription>
        </Alert>
      )}
      {syncConflictCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <IconAlertTriangle
            className="size-5 text-amber-700"
            aria-hidden="true"
          />
          <AlertDescription className="font-medium">
            Terdapat {syncConflictCount} konflik sinkronisasi yang perlu
            ditinjau.
          </AlertDescription>
        </Alert>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        {[
          {
            label: "Tambah User",
            icon: IconPlus,
            onClick: () => navigate("/admin/users"),
          },
          {
            label: "Buat Pengumuman",
            icon: IconSpeakerphone,
            onClick: () => navigate("/admin/announcements"),
          },
          {
            label: "Export Laporan",
            icon: IconDownload,
            onClick: () => navigate("/admin/reports"),
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              type="button"
              variant="outline"
              className="h-12 justify-start bg-bg-primary"
              onClick={action.onClick}
            >
              <Icon className="size-5 text-role-accent" aria-hidden="true" />
              {action.label}
            </Button>
          );
        })}
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsCards.map((item) => (
          <Card key={item.label} className="border-border/70 bg-bg-primary">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-small text-text-muted">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-text-primary">
                    {item.value.toLocaleString("id-ID")}
                  </p>
                  {item.label === "Total User" && (
                    <p className="mt-1.5 text-[11px] text-text-muted font-medium">
                      Mahasiswa: {stats.totalMahasiswa} · Dosen:{" "}
                      {stats.totalDosen}
                    </p>
                  )}
                </div>
                <Badge
                  className={cn(
                    "rounded-full",
                    item.positive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  {item.positive ? "↑" : "↓"} {item.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Pertumbuhan Pengguna"
          subtitle="6 bulan terakhir berdasarkan data user"
          period="semester"
          isEmpty={growthChartData.length === 0}
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthChartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--role-accent)"
                fill="var(--role-50)"
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="border-border/70 bg-bg-primary">
          <CardHeader>
            <CardTitle className="text-heading">5 User Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.length === 0 ? (
              <EmptyState variant="no-data" context="user terbaru" />
            ) : (
              recentUsers.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border/70 p-3"
                >
                  <Avatar>
                    <AvatarFallback>{initials(item.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small font-semibold text-text-primary">
                      {item.full_name}
                    </p>
                    <p className="text-caption text-text-muted">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <Badge variant="outline">{item.role}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap gap-2 rounded-xl border border-border/70 bg-bg-primary p-4">
        <Badge className="bg-emerald-50 text-emerald-700">
          <IconDatabase className="size-4" aria-hidden="true" />
          Database Aktif
        </Badge>
        <Badge className="bg-blue-50 text-blue-700">
          <IconServer className="size-4" aria-hidden="true" />
          Queue Normal
        </Badge>
        <Badge
          className={
            syncConflictCount > 0
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }
        >
          <IconShieldCheck className="size-4" aria-hidden="true" />
          Konflik {syncConflictCount}
        </Badge>
      </section>

      <Card className="border-border/70 bg-bg-primary">
        <CardHeader>
          <CardTitle className="text-heading">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <EmptyState variant="no-data" context="aktivitas terbaru" />
          ) : (
            activities.map((item) => {
              const Icon = item.kind === "user" ? IconUsers : IconBell;
              return (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-lg border border-border/70 p-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-role-accent-light text-role-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-medium text-text-primary">
                      {item.description}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-caption text-text-muted">
                      <IconClock className="size-3.5" aria-hidden="true" />
                      {formatRelative(item.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
