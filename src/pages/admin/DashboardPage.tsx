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
  useEffect(() => {
    if (user?.id) {
      async function fetchData() {
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
          ] = await Promise.all([
            getDashboardStats(),
            getUserGrowth(),
            getUserDistribution(),
            getLabUsage(),
            getRecentUsers(5),
            getRecentAnnouncements(5),
          ]);

          setStats(statsData);
          setUserGrowth(growthData);
          setUserDistribution(distributionData);
          setLabUsage(usageData);
          setRecentUsers(usersData);
          setRecentAnnouncements(announcementsData);
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
          setError("Failed to load dashboard data");
        } finally {
          setLoading(false);
        }
      }

      fetchData();
    } else {
      // Clear data if no user
      setStats(null);
      setUserGrowth([]);
      setUserDistribution([]);
      setLabUsage([]);
      setRecentUsers([]);
      setRecentAnnouncements([]);
    }
  }, [user?.id]);

  // Refresh data handler
  const handleRefresh = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      setError(null);

      const [
        statsData,
        growthData,
        distributionData,
        usageData,
        usersData,
        announcementsData,
      ] = await Promise.all([
        getDashboardStats(),
        getUserGrowth(),
        getUserDistribution(),
        getLabUsage(),
        getRecentUsers(5),
        getRecentAnnouncements(5),
      ]);

      setStats(statsData);
      setUserGrowth(growthData);
      setUserDistribution(distributionData);
      setLabUsage(usageData);
      setRecentUsers(usersData);
      setRecentAnnouncements(announcementsData);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
      setError("Failed to refresh dashboard data");
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
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header with Logout */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Admin Dashboard
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span>
                      {currentTime.toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span>{currentTime.toLocaleTimeString("id-ID")}</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Selamat datang kembali! Berikut gambaran umum sistem praktikum.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="relative"
              >
                {refreshing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <TrendingUp className="h-4 w-4 mr-2" />
                )}
                {refreshing ? "Memperbarui..." : "Refresh Data"}
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className="group hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Total Users
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalUsers}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Activity className="h-3 w-3 text-green-500" />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {stats.activeUsers} aktif
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Mahasiswa
              </CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalMahasiswa}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {Math.round((stats.totalMahasiswa / stats.totalUsers) * 100)}%
                dari total users
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Dosen
              </CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                <UserCog className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalDosen}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {Math.round((stats.totalDosen / stats.totalUsers) * 100)}% dari
                total users
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Laboratorium
              </CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                <FlaskConical className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalLaboratorium}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Lab tersedia
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Peralatan
              </CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-colors">
                <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalPeralatan}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Total peralatan
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200 dark:border-rose-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                Menunggu Persetujuan
              </CardTitle>
              <div className="p-2 bg-rose-100 dark:bg-rose-900 rounded-full group-hover:bg-rose-200 dark:group-hover:bg-rose-800 transition-colors">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-600 dark:text-rose-300">
                {stats.pendingApprovals}
              </div>
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Perlu persetujuan admin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-800">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-violet-100 dark:bg-violet-900 rounded-lg">
                <Zap className="h-5 w-5 text-violet-600 dark:text-violet-300" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                  Aksi Cepat
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Tugas administratif yang sering digunakan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-950/30 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-all duration-200 group"
                onClick={() => navigate("/admin/users?action=create")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                    <Plus className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Tambah User</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      User baru
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 group"
                onClick={() => navigate("/admin/announcements?action=create")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-md group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 transition-colors">
                    <Megaphone className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Pengumuman</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Info sistem
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:hover:bg-orange-950/30 dark:hover:border-orange-700 dark:hover:text-orange-400 transition-all duration-200 group"
                onClick={() => navigate("/admin/laboratories")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-md group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                    <FlaskConical className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Laboratorium</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Kelola lab
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:border-amber-700 dark:hover:text-amber-400 transition-all duration-200 group"
                onClick={() => navigate("/admin/equipments")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-md group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition-colors">
                    <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Peralatan</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Inventaris
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 dark:hover:bg-purple-950/30 dark:hover:border-purple-700 dark:hover:text-purple-400 transition-all duration-200 group"
                onClick={() => navigate("/admin/system/analytics")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-md group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Analytics</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Statistik
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-3 px-4 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 dark:hover:bg-violet-950/30 dark:hover:border-violet-700 dark:hover:text-violet-400 transition-all duration-200 group"
                onClick={() => navigate("/admin/roles")}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900 rounded-md group-hover:bg-violet-200 dark:group-hover:bg-violet-800 transition-colors">
                    <Settings className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Roles</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Hak akses
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* User Growth Chart */}
          <Card className="col-span-full lg:col-span-4 border-0 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                      Pertumbuhan Pengguna
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Pendaftaran pengguna baru sepanjang waktu
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <Activity className="h-4 w-4" />
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
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={userGrowth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    className="opacity-50"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Pengguna Baru"
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* User Distribution Chart */}
          <Card className="col-span-full lg:col-span-3 border-0 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    Distribusi Pengguna
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Pengguna berdasarkan peran
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={userDistribution as any[]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ role, percentage }) => `${role}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {userDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.role}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {userDistribution.map((entry, index) => (
                  <div key={entry.role} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {entry.role}: {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lab Usage Chart */}
          <Card className="col-span-full border-0 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FlaskConical className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                    Penggunaan Laboratorium
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Laboratorium yang paling sering digunakan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={labUsage}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    className="opacity-50"
                  />
                  <XAxis
                    dataKey="lab"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="rect"
                  />
                  <Bar
                    dataKey="usage"
                    fill="#f97316"
                    name="Jumlah Penggunaan"
                    radius={[8, 8, 0, 0]}
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
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-sm font-medium shadow-sm">
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
        <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/20">
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
