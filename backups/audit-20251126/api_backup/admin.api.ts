/**
 * Admin API
 * API functions for admin dashboard and management
 */

import { supabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
  totalUsers: number;
  totalMahasiswa: number;
  totalDosen: number;
  totalLaboran: number;
  totalLaboratorium: number;
  totalPeralatan: number;
  pendingApprovals: number;
  activeUsers: number;
}

export interface UserGrowthData {
  month: string;
  users: number;
}

export interface UserDistribution {
  role: string;
  count: number;
  percentage: number;
}

export interface LabUsageData {
  lab: string;
  usage: number;
}

export interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface RecentAnnouncement {
  id: string;
  title: string;
  created_at: string;
  author: string;
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total users by role
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('role, is_active');

    if (usersError) throw usersError;

    const totalUsers = users?.length || 0;
    const totalMahasiswa = users?.filter((u) => u.role === 'mahasiswa').length || 0;
    const totalDosen = users?.filter((u) => u.role === 'dosen').length || 0;
    const totalLaboran = users?.filter((u) => u.role === 'laboran').length || 0;
    const activeUsers = users?.filter((u) => u.is_active).length || 0;

    // Get total laboratorium (FIXED)
    const { data: labs, error: labsError } = await supabase
      .from('laboratorium')
      .select('id, is_active');
    
    if (labsError) console.error('Error fetching labs:', labsError);
    const totalLaboratorium = labs?.filter(lab => lab.is_active).length || 0;

    // Get total inventaris/peralatan (FIXED)
    // PERBAIKAN 1: Menghapus 'as any'
    const { data: equipment, error: equipmentError } = await supabase
      .from('inventaris')
      .select('id, is_available_for_borrowing');
    
    if (equipmentError) console.error('Error fetching equipment:', equipmentError);
    const totalPeralatan = equipment?.length || 0;

    // Get pending approvals (peminjaman dengan status pending)
    // PERBAIKAN 2: Menghapus 'as any'
    const { data: pendingData, error: pendingError } = await supabase
      .from('peminjaman')
      .select('id')
      .eq('status', 'pending');
    
    if (pendingError) console.error('Error fetching pending:', pendingError);
    const pendingApprovals = pendingData?.length || 0;

    return {
      totalUsers,
      totalMahasiswa,
      totalDosen,
      totalLaboran,
      totalLaboratorium,
      totalPeralatan,
      pendingApprovals,
      activeUsers,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// ============================================================================
// USER GROWTH (Last 6 months)
// ============================================================================

export async function getUserGrowth(): Promise<UserGrowthData[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by month
    const monthlyData: Record<string, number> = {};
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthKey] = 0;
    }

    // Count users per month
    data?.forEach((user) => {
      if (!user.created_at) return;
      const date = new Date(user.created_at);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyData[monthKey] !== undefined) {
        monthlyData[monthKey]++;
      }
    });

    return Object.entries(monthlyData).map(([month, users]) => ({
      month,
      users,
    }));
  } catch (error) {
    console.error('Error fetching user growth:', error);
    throw error;
  }
}

// ============================================================================
// USER DISTRIBUTION BY ROLE
// ============================================================================

export async function getUserDistribution(): Promise<UserDistribution[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role');

    if (error) throw error;

    const total = data?.length || 0;
    const roleCount: Record<string, number> = {};

    data?.forEach((user) => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });

    return Object.entries(roleCount).map(([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  } catch (error) {
    console.error('Error fetching user distribution:', error);
    throw error;
  }
}

// ============================================================================
// LAB USAGE (Mock data for now - will be real when booking system ready)
// ============================================================================

export async function getLabUsage(): Promise<LabUsageData[]> {
  try {
    // PERBAIKAN 3: Menghapus 'as any'
    const { data: labs, error } = await supabase
      .from('laboratorium')
      .select('nama_lab, kode_lab')
      .limit(5);

    if (error) throw error;

    // Mock usage data (replace with real booking data later)
    // PERBAIKAN 4: Memberi tipe pada 'lab' dan menghapus 'as any'
    return labs?.map((lab: { nama_lab: string }) => ({
      lab: lab.nama_lab,
      usage: Math.floor(Math.random() * 50) + 10, // Random between 10-60
    })) || [];
  } catch (error) {
    console.error('Error fetching lab usage:', error);
    throw error;
  }
}

// ============================================================================
// RECENT USERS (Last 5)
// ============================================================================

export async function getRecentUsers(limit: number = 5): Promise<RecentUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(user => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      created_at: user.created_at || '',
    })) || [];
  } catch (error) {
    console.error('Error fetching recent users:', error);
    throw error;
  }
}

// ============================================================================
// RECENT ANNOUNCEMENTS (Last 5)
// ============================================================================

// Tipe untuk data pengumuman yang diambil
type PengumumanData = {
  id: string;
  judul: string;
  created_at: string;
  users: {
    full_name: string;
  } | null; // users bisa null jika join gagal
};

export async function getRecentAnnouncements(limit: number = 5): Promise<RecentAnnouncement[]> {
  try {
    // PERBAIKAN 5: Menghapus 'as any'
    const { data, error } = await supabase
      .from('pengumuman')
      .select(`
        id,
        judul,
        created_at,
        penulis_id, 
        users!pengumuman_penulis_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // PERBAIKAN 6: Menggunakan tipe 'PengumumanData' (didefinisikan di atas)
    return (data as PengumumanData[] | null)?.map((item) => ({
      id: item.id,
      title: item.judul,
      created_at: item.created_at,
      author: item.users?.full_name || 'Unknown',
    })) || [];
  } catch (error) {
    console.error('Error fetching recent announcements:', error);
    throw error;
  }
}