/**
 * Navigation Configuration
 * Centralized navigation items for all roles
 */

import type { UserRole } from '@/types/auth.types';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Settings,
  FlaskConical,
  Wrench,
  Megaphone,
  BarChart3,
  BookOpen,
  Calendar,
  FileQuestion,
  ClipboardList,
  GraduationCap,
  User,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Navigation item structure
 */
export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string | number;
  description?: string;
}

/**
 * Navigation section (for grouping)
 */
export interface NavSection {
  title?: string;
  items: NavItem[];
}

// ============================================================================
// NAVIGATION ITEMS PER ROLE
// ============================================================================

/**
 * Admin navigation items
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/admin',
    description: 'Overview sistem',
  },
  {
    icon: Users,
    label: 'Manajemen User',
    href: '/admin/users',
    description: 'Kelola pengguna sistem',
  },
  {
    icon: Settings,
    label: 'Roles & Permissions',
    href: '/admin/roles',
    description: 'Kelola role dan permissions',
  },
  {
    icon: FlaskConical,
    label: 'Laboratorium',
    href: '/admin/laboratories',
    description: 'Kelola data laboratorium',
  },
  {
    icon: Wrench,
    label: 'Peralatan',
    href: '/admin/equipments',
    description: 'Kelola inventaris peralatan',
  },
  {
    icon: Megaphone,
    label: 'Pengumuman',
    href: '/admin/announcements',
    description: 'Kelola pengumuman',
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    href: '/admin/analytics',
    description: 'Statistik dan laporan',
  },
];

/**
 * Dosen navigation items
 */
export const DOSEN_NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dosen',
    description: 'Overview aktivitas',
  },
  {
    icon: BookOpen,
    label: 'Mata Kuliah',
    href: '/dosen/mata-kuliah',
    description: 'Kelola mata kuliah',
  },
  {
    icon: Calendar,
    label: 'Jadwal',
    href: '/dosen/jadwal',
    description: 'Jadwal praktikum',
  },
  {
    icon: FileQuestion,
    label: 'Kuis',
    href: '/dosen/kuis',
    badge: 'New',
    description: 'Kelola kuis dan soal',
  },
  {
    icon: ClipboardList,
    label: 'Peminjaman',
    href: '/dosen/peminjaman',
    description: 'Kelola peminjaman alat',
  },
  {
    icon: GraduationCap,
    label: 'Mahasiswa',
    href: '/dosen/mahasiswa',
    description: 'Data mahasiswa',
  },
  {
    icon: BookOpen,
    label: 'Materi',
    href: '/dosen/materi',
    description: 'Kelola materi praktikum',
  },
  {
    icon: BarChart3,
    label: 'Penilaian',
    href: '/dosen/penilaian',
    description: 'Kelola nilai mahasiswa',
  },
];

/**
 * Mahasiswa navigation items
 */
export const MAHASISWA_NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/mahasiswa',
    description: 'Overview aktivitas',
  },
  {
    icon: Calendar,
    label: 'Jadwal Praktikum',
    href: '/mahasiswa/jadwal',
    description: 'Jadwal praktikum',
  },
  {
    icon: FileQuestion,
    label: 'Kuis',
    href: '/mahasiswa/kuis',
    badge: 3,
    description: 'Kuis yang tersedia',
  },
  {
    icon: BookOpen,
    label: 'Materi',
    href: '/mahasiswa/materi',
    description: 'Materi praktikum',
  },
  {
    icon: BarChart3,
    label: 'Nilai',
    href: '/mahasiswa/nilai',
    description: 'Lihat nilai',
  },
  {
    icon: Megaphone,
    label: 'Pengumuman',
    href: '/mahasiswa/pengumuman',
    description: 'Pengumuman terbaru',
  },
  {
    icon: User,
    label: 'Profil',
    href: '/mahasiswa/profil',
    description: 'Kelola profil',
  },
];

/**
 * Laboran navigation items
 */
export const LABORAN_NAV_ITEMS: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/laboran',
    description: 'Overview aktivitas',
  },
  {
    icon: Wrench,
    label: 'Inventaris',
    href: '/laboran/inventaris',
    description: 'Kelola inventaris',
  },
  {
    icon: ClipboardList,
    label: 'Persetujuan',
    href: '/laboran/persetujuan',
    badge: 5,
    description: 'Persetujuan peminjaman',
  },
  {
    icon: FlaskConical,
    label: 'Laboratorium',
    href: '/laboran/laboratorium',
    description: 'Kelola laboratorium',
  },
  {
    icon: BarChart3,
    label: 'Laporan',
    href: '/laboran/laporan',
    description: 'Laporan inventaris',
  },
];

/**
 * Get navigation items by role
 */
export const NAVIGATION_ITEMS: Record<UserRole, NavItem[]> = {
  admin: ADMIN_NAV_ITEMS,
  dosen: DOSEN_NAV_ITEMS,
  mahasiswa: MAHASISWA_NAV_ITEMS,
  laboran: LABORAN_NAV_ITEMS,
};

/**
 * Get navigation items for a specific role
 * @param role - User role
 * @returns Array of navigation items
 */
export function getNavigationItems(role: UserRole): NavItem[] {
  return NAVIGATION_ITEMS[role] || [];
}

/**
 * Get navigation item by href
 * @param role - User role
 * @param href - Route href
 * @returns Navigation item or undefined
 */
export function getNavigationItem(role: UserRole, href: string): NavItem | undefined {
  const items = getNavigationItems(role);
  return items.find((item) => item.href === href);
}

/**
 * Check if route is active
 * @param currentPath - Current route path
 * @param itemHref - Navigation item href
 * @returns Whether route is active
 */
export function isRouteActive(currentPath: string, itemHref: string): boolean {
  // Exact match for dashboard routes
  if (
    itemHref === '/admin' ||
    itemHref === '/dosen' ||
    itemHref === '/mahasiswa' ||
    itemHref === '/laboran'
  ) {
    return currentPath === itemHref;
  }
  
  // Prefix match for other routes
  return currentPath.startsWith(itemHref);
}