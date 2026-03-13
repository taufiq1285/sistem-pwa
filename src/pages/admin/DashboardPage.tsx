/**
 * Admin Dashboard Page
 * Main dashboard for admin with statistics, charts, and recent activity
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Users,
  GraduationCap,
  UserCog,
  FlaskConical,
  Wrench,
  AlertCircle,
  TrendingUp,
  Plus,
  Megaphone,
  Settings,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  UserCheck,
  FileText,
  Database,
  Shield,
  Zap,
  Eye,
  ThumbsUp,
  MessageSquare,
  Package,
  Truck,
} from "lucide-react";
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { networkDetector } from "@/lib/offline/network-detector";
import {
  getDashboardStats,
  getUserGrowth,
  getUserDistribution,
  getLabUsage,
  getRecentUsers,
  getRecentAnnouncements,
  type DashboardStats,
  type UserGrowthData,
  type UserDistribution,
  type LabUsageData,
  type RecentUser,
  type RecentAnnouncement,
} from "@/lib/api/admin.api";
import { cacheAPI } from "@/lib/offline/api-cache";

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// ============================================================================
// COMPONENT
// ============================================================================

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [userDistribution, setUserDistribution] = useState<UserDistribution[]>(
    [],
  );
  const [labUsage, setLabUsage] = useState<LabUsageData[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<
    RecentAnnouncement[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all data
  const fetchDashboardData = async (forceRefresh = false) => {
    if (!user?.id) {
      // Clear data if no user
      setStats(null);
      setUserGrowth([]);
      setUserDistribution([]);
      setLabUsage([]);
      setRecentUsers([]);
      setRecentAnnouncements([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        statsData,
        growthData,
        distributionData,
        usageData,
        usersData,
        announcementsData,
      ] = await Promise.allSettled([
        cacheAPI("admin_dashboard_stats", () => getDashboardStats(), {
          ttl: 5 * 60 * 1000, // 5 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI("admin_user_growth", () => getUserGrowth(), {
          ttl: 10 * 60 * 1000, // 10 minutes - growth data changes slowly
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI("admin_user_distribution", () => getUserDistribution(), {
          ttl: 10 * 60 * 1000, // 10 minutes - distribution changes slowly
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI("admin_lab_usage", () => getLabUsage(), {
          ttl: 10 * 60 * 1000, // 10 minutes - usage changes slowly
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI("admin_recent_users", () => getRecentUsers(5), {
          ttl: 5 * 60 * 1000, // 5 minutes
          forceRefresh,
          staleWhileRevalidate: true,
        }),
        cacheAPI(
          "admin_recent_announcements",
          () => getRecentAnnouncements(5),
          {
            ttl: 5 * 60 * 1000, // 5 minutes
            forceRefresh,
            staleWhileRevalidate: true,
          },
        ),
      ]);

      if (statsData.status === "fulfilled") {
        setStats(statsData.value);
      }

      if (growthData.status === "fulfilled") {
        setUserGrowth(growthData.value);
      }

      if (distributionData.status === "fulfilled") {
        setUserDistribution(distributionData.value);
      }

      if (usageData.status === "fulfilled") {
        setLabUsage(usageData.value);
      }

      if (usersData.status === "fulfilled") {
        setRecentUsers(usersData.value);
      }

      if (announcementsData.status === "fulfilled") {
        setRecentAnnouncements(announcementsData.value);
      }
    } catch (err) {
      // Handle offline mode gracefully
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - showing cached dashboard data");
        setError(null); // Don't show error in offline mode
      } else {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, [user?.id]);

  // Refresh data handler
  const handleRefresh = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      setError(null);

      await fetchDashboardData(true);
    } catch (err) {
      // Handle offline mode gracefully
      if (!networkDetector.isOnline()) {
        console.log("ℹ️ Offline mode - could not refresh dashboard");
        setError(null);
      } else {
        console.error("Error refreshing dashboard data:", err);
        setError("Failed to refresh dashboard data");
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  // Loading state
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

  // Error state
  if (error || !stats) {
    return (
      <div className="app-container py-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <GlassCard className="border-destructive/30 bg-destructive/5 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Gagal memuat dashboard
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                <Button
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Coba lagi
                </Button>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-grid min-h-screen bg-background">
      <div className="app-container py-4 sm:py-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
          <GlassCard
            intensity="medium"
            glow
            className="overflow-hidden rounded-4xl border border-border/60 bg-background/80 shadow-xl"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Pusat kontrol admin aktif
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20 shadow-sm">
                    <Shield className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                      Admin Dashboard
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:text-base">
                      <Clock className="h-4 w-4" />
                      <span>
                        {currentTime.toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-muted-foreground/60">•</span>
                      <span className="font-medium text-foreground">
                        {currentTime.toLocaleTimeString("id-ID")}
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                      Ringkasan utama sistem praktikum untuk memantau pengguna,
                      laboratorium, peralatan, dan aktivitas administratif yang
                      paling sering digunakan.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-65">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                  Fokuskan tindakan pada persetujuan, distribusi pengguna, dan
                  pemantauan kesehatan sistem secara real-time.
                </div>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-full border-border/60 bg-background/80 font-medium shadow-sm hover:bg-muted/60 lg:w-auto"
                >
                  {refreshing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <TrendingUp className="mr-2 h-4 w-4" />
                  )}
                  {refreshing ? "Memperbarui..." : "Refresh Data"}
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Statistics Cards */}
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <DashboardCard
              title="Total Users"
              value={stats.totalUsers}
              description="Seluruh akun aktif dalam ekosistem sistem praktikum"
              icon={Users}
              color="blue"
              trend={{ value: stats.activeUsers, isPositive: true }}
            />
            <DashboardCard
              title="Mahasiswa"
              value={stats.totalMahasiswa}
              description="Proporsi mahasiswa dari total pengguna sistem"
              icon={GraduationCap}
              color="green"
              suffix="%"
              trend={{
                value: Math.round(
                  (stats.totalMahasiswa / stats.totalUsers) * 100,
                ),
                isPositive: true,
              }}
            />
            <DashboardCard
              title="Dosen"
              value={stats.totalDosen}
              description="Tenaga pengajar yang telah terdaftar di sistem"
              icon={UserCog}
              color="purple"
              trend={{
                value: Math.round((stats.totalDosen / stats.totalUsers) * 100),
                isPositive: true,
              }}
            />
            <DashboardCard
              title="Laboratorium"
              value={stats.totalLaboratorium}
              description="Ruang praktikum yang sedang dipantau admin"
              icon={FlaskConical}
              color="amber"
            />
            <DashboardCard
              title="Peralatan"
              value={stats.totalPeralatan}
              description="Inventaris dan perangkat yang tercatat"
              icon={Wrench}
              color="amber"
            />
            <DashboardCard
              title="Menunggu Persetujuan"
              value={stats.pendingApprovals}
              description="Item dan alur kerja yang membutuhkan tindakan admin"
              icon={AlertCircle}
              color="red"
            />
          </div>

          {/* Quick Actions */}
          <GlassCard
            intensity="medium"
            className="border-border/60 bg-background/80 shadow-xl"
          >
            <CardHeader className="space-y-2 pb-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20 shadow-sm">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    Aksi Cepat
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-muted-foreground sm:text-base">
                    Pintasan untuk tugas administratif yang paling sering
                    digunakan.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Button
                  variant="outline"
                  className="group h-auto justify-start rounded-2xl border-border/60 bg-background/80 px-5 py-4 text-left shadow-sm transition-all duration-200 hover:bg-muted/60 hover:shadow-md"
                  onClick={() => navigate("/admin/users?action=create")}
                >
                  <div className="flex w-full items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20 transition-transform duration-200 group-hover:scale-105">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-foreground">
                        Tambah User
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Registrasi akun baru
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="group h-auto justify-start rounded-2xl border-border/60 bg-background/80 px-5 py-4 text-left shadow-sm transition-all duration-200 hover:bg-muted/60 hover:shadow-md"
                  onClick={() => navigate("/admin/announcements?action=create")}
                >
                  <div className="flex w-full items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-700 ring-1 ring-emerald-500/20 transition-transform duration-200 group-hover:scale-105 dark:text-emerald-300">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-foreground">
                        Pengumuman
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Publikasikan info sistem
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="group h-auto justify-start rounded-2xl border-border/60 bg-background/80 px-5 py-4 text-left shadow-sm transition-all duration-200 hover:bg-muted/60 hover:shadow-md"
                  onClick={() => navigate("/admin/laboratories")}
                >
                  <div className="flex w-full items-center gap-3">
                    <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-700 ring-1 ring-amber-500/20 transition-transform duration-200 group-hover:scale-105 dark:text-amber-300">
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-foreground">
                        Laboratorium
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Kelola data laboratorium
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="group h-auto justify-start rounded-2xl border-border/60 bg-background/80 px-5 py-4 text-left shadow-sm transition-all duration-200 hover:bg-muted/60 hover:shadow-md"
                  onClick={() => navigate("/admin/equipments")}
                >
                  <div className="flex w-full items-center gap-3">
                    <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-700 ring-1 ring-violet-500/20 transition-transform duration-200 group-hover:scale-105 dark:text-violet-300">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold text-foreground">
                        Peralatan
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Pantau inventaris utama
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </GlassCard>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            {/* User Growth Chart */}
            <GlassCard className="col-span-full rounded-4xl border border-border/50 bg-background/85 shadow-xl lg:col-span-4">
              <CardHeader className="pb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-linear-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-xl shadow-lg shadow-emerald-500/30">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        Pertumbuhan Pengguna
                      </CardTitle>
                      <CardDescription className="text-base font-medium text-slate-600 dark:text-slate-400 mt-1">
                        Pendaftaran pengguna baru sepanjang waktu
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-base font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-lg border-2 border-emerald-200 dark:border-emerald-700">
                    <Activity className="h-5 w-5" />
                    <span>
                      +
                      {userGrowth.length > 0
                        ? userGrowth[userGrowth.length - 1].users
                        : 0}{" "}
                      bulan ini
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={userGrowth}
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorUsers"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                      tickLine={{ stroke: "#cbd5e1" }}
                      stroke="#64748b"
                    />
                    <YAxis
                      tick={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                      tickLine={{ stroke: "#cbd5e1" }}
                      stroke="#64748b"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "2px solid #10b981",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                      labelStyle={{ color: "#0f172a", fontWeight: 700 }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#10b981"
                      strokeWidth={4}
                      name="Pengguna Baru"
                      dot={{ fill: "#10b981", strokeWidth: 3, r: 5 }}
                      activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 3 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </GlassCard>

            {/* User Distribution Chart */}
            <GlassCard className="col-span-full rounded-4xl border border-border/50 bg-background/85 shadow-xl lg:col-span-3">
              <CardHeader className="pb-5">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-linear-to-br from-primary to-accent dark:from-primary/80 dark:to-accent/80 rounded-xl shadow-lg shadow-primary/30">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                      Distribusi Pengguna
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-slate-600 dark:text-slate-400 mt-1">
                      Pengguna berdasarkan peran
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={userDistribution as any[]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, percentage }) =>
                        `${role}: ${percentage}%`
                      }
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="count"
                      fontSize={13}
                      fontWeight={600}
                    >
                      {userDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.role}-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          stroke="#ffffff"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "2px solid #3b82f6",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-5">
                  {userDistribution.map((entry, index) => (
                    <div
                      key={entry.role}
                      className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {entry.role}: {entry.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>

            {/* Lab Usage Chart */}
            <GlassCard className="col-span-full rounded-4xl border border-border/50 bg-background/85 shadow-xl">
              <CardHeader className="pb-5">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-linear-to-br from-warning to-warning/80 rounded-xl shadow-lg shadow-warning/30">
                    <FlaskConical className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                      Penggunaan Laboratorium
                    </CardTitle>
                    <CardDescription className="text-base font-medium text-slate-600 dark:text-slate-400 mt-1">
                      Laboratorium yang paling sering digunakan
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={labUsage}
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="lab"
                      tick={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                      tickLine={{ stroke: "#cbd5e1" }}
                      stroke="#64748b"
                    />
                    <YAxis
                      tick={{ fill: "#475569", fontSize: 13, fontWeight: 500 }}
                      tickLine={{ stroke: "#cbd5e1" }}
                      stroke="#64748b"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "2px solid #f97316",
                        borderRadius: "12px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                      labelStyle={{ color: "#0f172a", fontWeight: 700 }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="rect"
                    />
                    <Bar
                      dataKey="usage"
                      fill="#f97316"
                      name="Jumlah Penggunaan"
                      radius={[12, 12, 0, 0]}
                      stroke="#ea580c"
                      strokeWidth={2}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </GlassCard>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Users */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        Pengguna Baru
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Pendaftaran pengguna terbaru
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin/users")}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Lihat Semua
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.length === 0 ? (
                    <div className="text-center py-6">
                      <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Belum ada pengguna baru
                      </p>
                    </div>
                  ) : (
                    recentUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                        style={{
                          animation: `slideIn 0.3s ease-out ${index * 0.1}s backwards`,
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white text-sm font-medium shadow-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {user.full_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge
                            status={
                              user.role === "admin"
                                ? "error"
                                : user.role === "dosen"
                                  ? "info"
                                  : "success"
                            }
                            pulse={false}
                            className="text-xs"
                          >
                            {user.role}
                          </StatusBadge>
                          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(user.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                        Pengumuman Terbaru
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Pengumuman sistem terkini
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin/announcements")}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Lihat Semua
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAnnouncements.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Belum ada pengumuman
                      </p>
                    </div>
                  ) : (
                    recentAnnouncements.map((announcement, index) => (
                      <div
                        key={announcement.id}
                        className="p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                        style={{
                          animation: `slideIn 0.3s ease-out ${index * 0.1}s backwards`,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 mr-2">
                            <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                              {announcement.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span> oleh {announcement.author}</span>
                              <span>•</span>
                              <span>{formatDate(announcement.created_at)}</span>
                            </div>
                          </div>
                          <StatusBadge status="info" pulse={false} className="text-xs">
                            Baru
                          </StatusBadge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status Footer */}
          <Card className="border-0 shadow-sm bg-linear-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                      <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping opacity-75" />
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      Status Sistem: Online
                    </span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Database className="h-4 w-4" />
                      <span>Database: Aktif</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-4 w-4" />
                      <span>API: Normal</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4" />
                      <span>Keamanan: Terjamin</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Terakhir diperbarui:{" "}
                    {currentTime.toLocaleTimeString("id-ID")}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-xs"
                  >
                    {refreshing ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <TrendingUp className="h-3 w-3" />
                    )}
                    <span className="ml-1">
                      {refreshing ? "Memperbarui..." : "Refresh"}
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add animation styles */}
          <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .group:hover .animate-pulse {
          animation-duration: 1s;
        }
      `}</style>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
