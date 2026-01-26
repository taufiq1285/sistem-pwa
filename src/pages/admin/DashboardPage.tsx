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
import { Badge } from "@/components/ui/badge";
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
  LogOut,
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
import { logout } from "@/lib/supabase/auth";
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

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
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
      <div className="flex h-full items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-foreground">
            Memuat Dashboard Admin
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Mengambil data terkini sistem...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="mt-4 text-lg font-semibold">Error</h3>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Header with Logout */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-lg sticky top-0 z-50">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Admin Dashboard
                  </h1>
                  <div className="flex items-center space-x-2 text-base font-medium text-slate-700 dark:text-slate-300 mt-1">
                    <Clock className="h-5 w-5" />
                    <span>
                      {currentTime.toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold">
                      {currentTime.toLocaleTimeString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-base font-medium text-slate-700 dark:text-slate-300">
                Selamat datang kembali! Berikut gambaran umum sistem praktikum.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="relative bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                {refreshing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <TrendingUp className="h-4 w-4 mr-2" />
                )}
                {refreshing ? "Memperbarui..." : "Refresh Data"}
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold shadow-lg shadow-red-500/30 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Statistics Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Total Users Card */}
          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:from-blue-400/30 group-hover:to-indigo-400/30 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-base font-bold text-blue-900 dark:text-blue-100">
                Total Users
              </CardTitle>
              <div className="p-2.5 bg-linear-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-extrabold text-blue-900 dark:text-white mb-2 tracking-tight">
                {stats.totalUsers}
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {stats.activeUsers} aktif
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mahasiswa Card */}
          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:from-emerald-400/30 group-hover:to-teal-400/30 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                Mahasiswa
              </CardTitle>
              <div className="p-2.5 bg-linear-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-extrabold text-emerald-900 dark:text-white mb-2 tracking-tight">
                {stats.totalMahasiswa}
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {Math.round((stats.totalMahasiswa / stats.totalUsers) * 100)}%
                dari total users
              </p>
            </CardContent>
          </Card>

          {/* Dosen Card */}
          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/40 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-purple-400/20 to-violet-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:from-purple-400/30 group-hover:to-violet-400/30 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-base font-bold text-purple-900 dark:text-purple-100">
                Dosen
              </CardTitle>
              <div className="p-2.5 bg-linear-to-br from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <UserCog className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-extrabold text-purple-900 dark:text-white mb-2 tracking-tight">
                {stats.totalDosen}
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {Math.round((stats.totalDosen / stats.totalUsers) * 100)}% dari
                total users
              </p>
            </CardContent>
          </Card>

          {/* Laboratorium Card */}
          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-orange-400/20 to-amber-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:from-orange-400/30 group-hover:to-amber-400/30 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-base font-bold text-orange-900 dark:text-orange-100">
                Laboratorium
              </CardTitle>
              <div className="p-2.5 bg-linear-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700 rounded-xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                <FlaskConical className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-extrabold text-orange-900 dark:text-white mb-2 tracking-tight">
                {stats.totalLaboratorium}
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Lab tersedia
              </p>
            </CardContent>
          </Card>

          {/* Peralatan Card */}
          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-linear-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-amber-400/20 to-yellow-400/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:from-amber-400/30 group-hover:to-yellow-400/30 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-base font-bold text-amber-900 dark:text-amber-100">
                Peralatan
              </CardTitle>
              <div className="p-2.5 bg-linear-to-br from-amber-500 to-yellow-600 dark:from-amber-600 dark:to-yellow-700 rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                <Wrench className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-extrabold text-amber-900 dark:text-white mb-2 tracking-tight">
                {stats.totalPeralatan}
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Total peralatan
              </p>
            </CardContent>
          </Card>

          {/* Pending Approvals Card - Highlighted */}
          <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-2 border-rose-300 dark:border-rose-700 shadow-xl shadow-rose-500/20 bg-linear-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-rose-400/30 to-pink-400/30 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
            <div className="absolute inset-0 bg-linear-to-br from-rose-500/5 to-pink-500/5 dark:from-rose-500/10 dark:to-pink-500/10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative">
              <CardTitle className="text-base font-bold text-rose-900 dark:text-rose-100">
                Menunggu Persetujuan
              </CardTitle>
              <div className="p-2.5 bg-linear-to-br from-rose-500 to-pink-600 dark:from-rose-600 dark:to-pink-700 rounded-xl shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform duration-300 animate-pulse">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-4xl font-extrabold text-rose-600 dark:text-rose-300 mb-2 tracking-tight">
                {stats.pendingApprovals}
              </div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                Perlu persetujuan admin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <CardHeader className="pb-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-linear-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 rounded-xl shadow-lg shadow-violet-500/30">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                  Aksi Cepat
                </CardTitle>
                <CardDescription className="text-base font-medium text-slate-600 dark:text-slate-400 mt-1">
                  Tugas administratif yang sering digunakan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {/* Tambah User */}
              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-5 hover:bg-linear-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 hover:text-blue-700 dark:hover:from-blue-950/50 dark:hover:to-indigo-950/50 dark:hover:border-blue-600 dark:hover:text-blue-300 transition-all duration-300 group hover:shadow-lg hover:scale-105 border-2"
                onClick={() => navigate("/admin/users?action=create")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2.5 bg-linear-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Tambah User</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      User baru
                    </div>
                  </div>
                </div>
              </Button>

              {/* Pengumuman */}
              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-5 hover:bg-linear-to-br hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-400 hover:text-emerald-700 dark:hover:from-emerald-950/50 dark:hover:to-teal-950/50 dark:hover:border-emerald-600 dark:hover:text-emerald-300 transition-all duration-300 group hover:shadow-lg hover:scale-105 border-2"
                onClick={() => navigate("/admin/announcements?action=create")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2.5 bg-linear-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Megaphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Pengumuman</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      Info sistem
                    </div>
                  </div>
                </div>
              </Button>

              {/* Laboratorium */}
              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-5 hover:bg-linear-to-br hover:from-orange-50 hover:to-amber-50 hover:border-orange-400 hover:text-orange-700 dark:hover:from-orange-950/50 dark:hover:to-amber-950/50 dark:hover:border-orange-600 dark:hover:text-orange-300 transition-all duration-300 group hover:shadow-lg hover:scale-105 border-2"
                onClick={() => navigate("/admin/laboratories")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2.5 bg-linear-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                    <FlaskConical className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Laboratorium</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      Kelola lab
                    </div>
                  </div>
                </div>
              </Button>

              {/* Peralatan */}
              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-5 hover:bg-linear-to-br hover:from-amber-50 hover:to-yellow-50 hover:border-amber-400 hover:text-amber-700 dark:hover:from-amber-950/50 dark:hover:to-yellow-950/50 dark:hover:border-amber-600 dark:hover:text-amber-300 transition-all duration-300 group hover:shadow-lg hover:scale-105 border-2"
                onClick={() => navigate("/admin/equipments")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2.5 bg-linear-to-br from-amber-500 to-yellow-600 dark:from-amber-600 dark:to-yellow-700 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Wrench className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Peralatan</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      Inventaris
                    </div>
                  </div>
                </div>
              </Button>

              {/* Analytics */}
              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-5 hover:bg-linear-to-br hover:from-purple-50 hover:to-violet-50 hover:border-purple-400 hover:text-purple-700 dark:hover:from-purple-950/50 dark:hover:to-violet-950/50 dark:hover:border-purple-600 dark:hover:text-purple-300 transition-all duration-300 group hover:shadow-lg hover:scale-105 border-2"
                onClick={() => navigate("/admin/system/analytics")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2.5 bg-linear-to-br from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Analytics</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      Statistik
                    </div>
                  </div>
                </div>
              </Button>

              {/* Roles */}
              <Button
                variant="outline"
                className="justify-start h-auto py-4 px-5 hover:bg-linear-to-br hover:from-violet-50 hover:to-fuchsia-50 hover:border-violet-400 hover:text-violet-700 dark:hover:from-violet-950/50 dark:hover:to-fuchsia-950/50 dark:hover:border-violet-600 dark:hover:text-violet-300 transition-all duration-300 group hover:shadow-lg hover:scale-105 border-2"
                onClick={() => navigate("/admin/roles")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2.5 bg-linear-to-br from-violet-500 to-fuchsia-600 dark:from-violet-600 dark:to-fuchsia-700 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base">Roles</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                      Hak akses
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* User Growth Chart */}
          <Card className="col-span-full lg:col-span-4 border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
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
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
          </Card>

          {/* User Distribution Chart */}
          <Card className="col-span-full lg:col-span-3 border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardHeader className="pb-5">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30">
                  <Users className="h-6 w-6 text-white" />
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
                    label={({ role, percentage }) => `${role}: ${percentage}%`}
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
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {entry.role}: {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lab Usage Chart */}
          <Card className="col-span-full border-0 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
            <CardHeader className="pb-5">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-linear-to-br from-orange-500 to-amber-600 dark:from-orange-600 dark:to-amber-700 rounded-xl shadow-lg shadow-orange-500/30">
                  <FlaskConical className="h-6 w-6 text-white" />
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
          </Card>
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
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                              : user.role === "dosen"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          }`}
                        >
                          {user.role}
                        </Badge>
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
                    <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-300" />
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
                          <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {announcement.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span> oleh {announcement.author}</span>
                            <span>•</span>
                            <span>{formatDate(announcement.created_at)}</span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                        >
                          Baru
                        </Badge>
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
                  Terakhir diperbarui: {currentTime.toLocaleTimeString("id-ID")}
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
  );
}

export default DashboardPage;
