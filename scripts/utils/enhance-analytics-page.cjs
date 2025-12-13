const fs = require('fs');
const path = require('path');

console.log('🔧 Enhancing Analytics Page for Admin...\n');

const filePath = path.join(__dirname, 'src/pages/admin/AnalyticsPage.tsx');

const newContent = `/**
 * Analytics & Reports Page - ENHANCED FOR ADMIN
 * Comprehensive system-wide analytics and statistics
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  TrendingUp,
  Users,
  BookOpen,
  GraduationCap,
  FlaskConical,
  FileText,
  ClipboardCheck,
  Wrench
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface SystemStats {
  // User Statistics
  totalUsers: number;
  activeUsers: number;
  usersByRole: {
    mahasiswa: number;
    dosen: number;
    laboran: number;
    admin: number;
  };

  // Academic Statistics
  totalClasses: number;
  totalMaterials: number;
  totalQuizzes: number;
  totalQuizAttempts: number;

  // Laboratory Statistics
  totalLabs: number;
  activeLabs: number;
  totalCapacity: number;

  // Borrowing Statistics
  totalBorrowings: number;
  pendingBorrowings: number;
  activeBorrowings: number;

  // Equipment Statistics
  totalEquipment: number;
  availableEquipment: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    usersByRole: { mahasiswa: 0, dosen: 0, laboran: 0, admin: 0 },
    totalClasses: 0,
    totalMaterials: 0,
    totalQuizzes: 0,
    totalQuizAttempts: 0,
    totalLabs: 0,
    activeLabs: 0,
    totalCapacity: 0,
    totalBorrowings: 0,
    pendingBorrowings: 0,
    activeBorrowings: 0,
    totalEquipment: 0,
    availableEquipment: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    try {
      setLoading(true);

      // Fetch all statistics in parallel
      const [
        usersData,
        classesData,
        materialsData,
        quizzesData,
        quizAttemptsData,
        labsData,
        borrowingsData,
        equipmentData,
      ] = await Promise.all([
        // User statistics
        supabase.from('users').select('role, is_active'),

        // Classes
        supabase.from('kelas').select('id', { count: 'exact', head: true }),

        // Materials
        supabase.from('materi').select('id', { count: 'exact', head: true }),

        // Quizzes
        supabase.from('kuis').select('id', { count: 'exact', head: true }),

        // Quiz Attempts
        supabase.from('kuis_attempts').select('id', { count: 'exact', head: true }),

        // Laboratories
        supabase.from('laboratorium').select('is_active, kapasitas'),

        // Borrowings
        supabase.from('peminjaman').select('status'),

        // Equipment/Inventaris
        supabase.from('inventaris').select('stok_tersedia'),
      ]);

      // Process user statistics
      const users = usersData.data || [];
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.is_active).length;
      const usersByRole = {
        mahasiswa: users.filter(u => u.role === 'mahasiswa').length,
        dosen: users.filter(u => u.role === 'dosen').length,
        laboran: users.filter(u => u.role === 'laboran').length,
        admin: users.filter(u => u.role === 'admin').length,
      };

      // Process lab statistics
      const labs = labsData.data || [];
      const totalLabs = labs.length;
      const activeLabs = labs.filter(l => l.is_active).length;
      const totalCapacity = labs.reduce((sum, lab) => sum + (lab.kapasitas || 0), 0);

      // Process borrowing statistics
      const borrowings = borrowingsData.data || [];
      const totalBorrowings = borrowings.length;
      const pendingBorrowings = borrowings.filter(b => b.status === 'pending').length;
      const activeBorrowings = borrowings.filter(b =>
        b.status === 'approved' || b.status === 'borrowed'
      ).length;

      // Process equipment statistics
      const equipment = equipmentData.data || [];
      const totalEquipment = equipment.length;
      const availableEquipment = equipment.filter(e => (e.stok_tersedia || 0) > 0).length;

      setStats({
        totalUsers,
        activeUsers,
        usersByRole,
        totalClasses: classesData.count || 0,
        totalMaterials: materialsData.count || 0,
        totalQuizzes: quizzesData.count || 0,
        totalQuizAttempts: quizAttemptsData.count || 0,
        totalLabs,
        activeLabs,
        totalCapacity,
        totalBorrowings,
        pendingBorrowings,
        activeBorrowings,
        totalEquipment,
        availableEquipment,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      stats,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`system-analytics-\${new Date().toISOString().split('T')[0]}.json\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Analytics</h1>
          <p className="text-muted-foreground">Comprehensive system-wide statistics and reports</p>
        </div>
        <Button onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Total classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalQuizAttempts} attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Laboratories</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLabs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeLabs} active, {stats.totalCapacity} capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Mahasiswa</span>
                <span className="font-bold bg-purple-100 px-2 py-1 rounded">
                  {stats.usersByRole.mahasiswa}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Dosen</span>
                <span className="font-bold bg-blue-100 px-2 py-1 rounded">
                  {stats.usersByRole.dosen}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Laboran</span>
                <span className="font-bold bg-green-100 px-2 py-1 rounded">
                  {stats.usersByRole.laboran}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Admin</span>
                <span className="font-bold bg-red-100 px-2 py-1 rounded">
                  {stats.usersByRole.admin}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Overview</CardTitle>
            <CardDescription>Learning resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Materials</span>
                </div>
                <span className="font-bold">{stats.totalMaterials}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Quizzes</span>
                </div>
                <span className="font-bold">{stats.totalQuizzes}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Quiz Attempts</span>
                </div>
                <span className="font-bold">{stats.totalQuizAttempts}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Classes</span>
                </div>
                <span className="font-bold">{stats.totalClasses}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment & Borrowing Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment & Borrowing</CardTitle>
            <CardDescription>Inventory status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span>Total Equipment</span>
                </div>
                <span className="font-bold">{stats.totalEquipment}</span>
              </div>
              <div className="flex justify-between">
                <span>Available</span>
                <span className="font-bold text-green-600">{stats.availableEquipment}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Total Borrowings</span>
                </div>
                <span className="font-bold">{stats.totalBorrowings}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Approval</span>
                <span className="font-bold text-yellow-600">{stats.pendingBorrowings}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Borrowings</span>
                <span className="font-bold text-blue-600">{stats.activeBorrowings}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
          <CardDescription>Quick system status check</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {((stats.activeUsers / stats.totalUsers) * 100 || 0).toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">User Activity Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {((stats.activeLabs / stats.totalLabs) * 100 || 0).toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">Lab Utilization</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalQuizAttempts > 0
                  ? (stats.totalQuizAttempts / stats.usersByRole.mahasiswa || 0).toFixed(1)
                  : '0.0'}
              </div>
              <p className="text-sm text-muted-foreground">Avg Quiz per Student</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {((stats.availableEquipment / stats.totalEquipment) * 100 || 0).toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">Equipment Available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync(filePath, newContent, 'utf8');

console.log('✅ Analytics Page enhanced successfully!\n');
console.log('═══════════════════════════════════════');
console.log('New Analytics Features:');
console.log('═══════════════════════════════════════\n');
console.log('📊 User Statistics:');
console.log('   - Total users & active users');
console.log('   - Distribution by role (Mahasiswa, Dosen, Laboran, Admin)');
console.log('');
console.log('📚 Academic Statistics:');
console.log('   - Total classes');
console.log('   - Total materials');
console.log('   - Total quizzes & attempts');
console.log('');
console.log('🔬 Laboratory Statistics:');
console.log('   - Total labs & active labs');
console.log('   - Total capacity');
console.log('');
console.log('🔧 Equipment & Borrowing:');
console.log('   - Total equipment & availability');
console.log('   - Borrowing statistics (total, pending, active)');
console.log('');
console.log('💚 System Health Metrics:');
console.log('   - User activity rate');
console.log('   - Lab utilization rate');
console.log('   - Average quiz per student');
console.log('   - Equipment availability rate');
console.log('');
console.log('✨ Export functionality to download JSON report');
