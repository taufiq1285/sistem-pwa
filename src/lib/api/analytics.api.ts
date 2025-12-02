/**
 * Analytics API for Admin Dashboard
 * Fetches system-wide statistics and metrics
 */

import { supabase } from '@/lib/supabase/client';
import { cacheAPI } from '@/lib/offline/api-cache';
import {
  requirePermission,
  requirePermissionAndOwnership,
} from '@/lib/middleware';

export interface SystemMetrics {
  totalUsers: number;
  totalEquipment: number;
  totalBorrowings: number;
  activeClasses: number;
  activeBorrowings: number;
  systemHealth: 'Good' | 'Warning' | 'Critical';
}

/**
 * Get comprehensive system metrics for analytics dashboard
 */
async function getSystemMetricsImpl(): Promise<SystemMetrics> {
  try {
    const [usersResult, equipmentResult, borrowingsResult, classesResult, activeBorrowingsResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('inventaris').select('id', { count: 'exact', head: true }),
      supabase.from('peminjaman').select('id', { count: 'exact', head: true }),
      supabase.from('kelas').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('peminjaman').select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved']),
    ]);

    const totalUsers = usersResult.count || 0;
    const totalEquipment = equipmentResult.count || 0;
    const totalBorrowings = borrowingsResult.count || 0;
    const activeClasses = classesResult.count || 0;
    const activeBorrowings = activeBorrowingsResult.count || 0;

    // Determine system health based on metrics
    let systemHealth: 'Good' | 'Warning' | 'Critical' = 'Good';
    if (activeBorrowings > 50) systemHealth = 'Warning';
    if (activeBorrowings > 100) systemHealth = 'Critical';

    return {
      totalUsers,
      totalEquipment,
      totalBorrowings,
      activeClasses,
      activeBorrowings,
      systemHealth,
    };
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return {
      totalUsers: 0,
      totalEquipment: 0,
      totalBorrowings: 0,
      activeClasses: 0,
      activeBorrowings: 0,
      systemHealth: 'Good',
    };
  }
}

// 🔒 PROTECTED: Requires view:analytics permission
export const getSystemMetrics = requirePermission('view:analytics', getSystemMetricsImpl);


