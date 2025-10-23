/**
 * Admin Dashboard Page
 * Main dashboard for admin with statistics, charts, and recent activity
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
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
} from 'recharts';
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
} from '@/lib/api/admin.api';
import { logout } from '@/lib/supabase/auth';

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// ============================================================================
// COMPONENT
// ============================================================================

export function DashboardPage() {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [userDistribution, setUserDistribution] = useState<UserDistribution[]>([]);
  const [labUsage, setLabUsage] = useState<LabUsageData[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<RecentAnnouncement[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  useEffect(() => {
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
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
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
    <div className="space-y-6 p-6">
      {/* Header with Logout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your system.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mahasiswa</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMahasiswa}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.totalMahasiswa / stats.totalUsers) * 100)}% of users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dosen</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDosen}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.totalDosen / stats.totalUsers) * 100)}% of users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laboratorium</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLaboratorium}</div>
            <p className="text-xs text-muted-foreground">Available labs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peralatan</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPeralatan}</div>
            <p className="text-xs text-muted-foreground">Equipment items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/admin/users?action=create')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/admin/announcements?action=create')}
            >
              <Megaphone className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/admin/laboratories')}
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Manage Labs
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/admin/equipments')}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Manage Equipment
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/admin/system/analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/admin/roles')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Roles & Permissions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* User Growth Chart */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Distribution Chart */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution as any[]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, percentage }) => `${role}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${entry.role}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lab Usage Chart */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Laboratory Usage</CardTitle>
            <CardDescription>Most frequently used laboratories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={labUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="lab" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#10b981" name="Usage Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent users</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>Latest system announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnnouncements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent announcements</p>
              ) : (
                recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium line-clamp-1">
                        {announcement.title}
                      </p>
                      <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                        New
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span>By {announcement.author}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(announcement.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">System Status: Online</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
