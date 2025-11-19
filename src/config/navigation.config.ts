/**
 * Navigation Configuration
 * Defines navigation items for each role with icons and descriptions
 * 
 * UPDATED: Added "Mata Kuliah" menu for Admin
 * REASON: Admin needs to manage courses before Dosen can create classes
 */

import {
  Home,
  Calendar,
  ClipboardList,
  Award,
  Users,
  FileText,
  Settings,
  Package,
  BarChart3,
  ClipboardCheck,
  Building2,
  UserCog,
  Boxes,
  BookOpen,
  type LucideIcon
} from 'lucide-react';
import type { UserRole } from '@/types/auth.types';

// ============================================================================
// TYPES
// ============================================================================

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: number | string;
}

// ============================================================================
// NAVIGATION ITEMS BY ROLE
// ============================================================================

/**
 * Mahasiswa Navigation
 */
const mahasiswaNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/mahasiswa/dashboard',
    icon: Home,
    description: 'Ringkasan aktivitas akademik'
  },
  {
    label: 'Jadwal Praktikum',
    href: '/mahasiswa/jadwal',
    icon: Calendar,
    description: 'Jadwal praktikum kebidanan'
  },
  {
    label: 'Kuis',
    href: '/mahasiswa/kuis',
    icon: ClipboardList,
    description: 'Kuis dan ujian'
  },
  {
    label: 'Nilai',
    href: '/mahasiswa/nilai',
    icon: Award,
    description: 'Hasil penilaian'
  },
  {
    label: 'Presensi',
    href: '/mahasiswa/presensi',
    icon: ClipboardCheck,
    description: 'Kehadiran praktikum'
  },
  {
    label: 'Materi',
    href: '/mahasiswa/materi',
    icon: FileText,
    description: 'Materi pembelajaran'
  }
];

/**
 * Dosen Navigation
 */
const dosenNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dosen/dashboard',
    icon: Home,
    description: 'Ringkasan aktivitas mengajar'
  },
  {
    label: 'Jadwal Praktikum',
    href: '/dosen/jadwal',
    icon: Calendar,
    description: 'Kelola jadwal praktikum'
  },
  {
    label: 'Kuis',
    href: '/dosen/kuis',
    icon: ClipboardList,
    description: 'Kelola kuis'
  },
  {
    label: 'Peminjaman',
    href: '/dosen/peminjaman',
    icon: Package,
    description: 'Peminjaman alat'
  },
  {
    label: 'Mahasiswa',
    href: '/dosen/mahasiswa',
    icon: Users,
    description: 'Daftar mahasiswa'
  },
  {
    label: 'Materi',
    href: '/dosen/materi',
    icon: FileText,
    description: 'Upload materi'
  },
  {
    label: 'Penilaian',
    href: '/dosen/penilaian',
    icon: Award,
    description: 'Input nilai mahasiswa'
  }
];

/**
 * Admin Navigation
 */
const adminNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: Home,
    description: 'Ringkasan sistem'
  },
  {
    label: 'User Management',
    href: '/admin/users',
    icon: UserCog,
    description: 'Kelola pengguna'
  },
  {
    label: 'Mata Kuliah',
    href: '/admin/mata-kuliah',
    icon: BookOpen,
    description: 'Kelola mata kuliah'
  },
  {
    label: 'Kelas',
    href: '/admin/kelas',
    icon: Users,
    description: 'Kelola kelas'
  },
  {
    label: 'Laboratorium',
    href: '/admin/laboratorium',
    icon: Building2,
    description: 'Kelola laboratorium'
  },
  {
    label: 'Jadwal Praktikum',
    href: '/admin/jadwal',
    icon: Calendar,
    description: 'Kelola jadwal praktikum'
  },
  {
    label: 'Laporan',
    href: '/admin/laporan',
    icon: BarChart3,
    description: 'Laporan sistem'
  },
  {
    label: 'Pengaturan',
    href: '/admin/pengaturan',
    icon: Settings,
    description: 'Pengaturan sistem'
  }
];

/**
 * Laboran Navigation
 */
const laboranNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/laboran/dashboard',
    icon: Home,
    description: 'Ringkasan aktivitas laboratorium'
  },
  {
    label: 'Inventaris',
    href: '/laboran/inventaris',
    icon: Package,
    description: 'Kelola inventaris'
  },
  {
    label: 'Peminjaman',
    href: '/laboran/peminjaman',
    icon: Boxes,
    description: 'Kelola peminjaman'
  },
  {
    label: 'Jadwal Praktikum',
    href: '/laboran/jadwal',
    icon: Calendar,
    description: 'Jadwal laboratorium'
  },
  {
    label: 'Laboratorium',
    href: '/laboran/laboratorium',
    icon: Building2,
    description: 'Kelola laboratorium'
  },
  {
    label: 'Laporan',
    href: '/laboran/laporan',
    icon: BarChart3,
    description: 'Laporan inventaris'
  }
];

// ============================================================================
// NAVIGATION MAP
// ============================================================================

const navigationMap: Record<UserRole, NavigationItem[]> = {
  mahasiswa: mahasiswaNavigation,
  dosen: dosenNavigation,
  admin: adminNavigation,
  laboran: laboranNavigation
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get navigation items for a specific role
 */
export function getNavigationItems(role: UserRole): NavigationItem[] {
  return navigationMap[role] || [];
}

/**
 * Check if a route is currently active
 * Handles exact matches and nested route matching
 */
export function isRouteActive(currentPath: string, itemPath: string): boolean {
  // Exact match
  if (currentPath === itemPath) {
    return true;
  }

  // Check if current path starts with item path (for nested routes)
  // But avoid false positives (e.g., /mahasiswa/mata-kuliah matching /mahasiswa/materi)
  if (itemPath !== '/' && currentPath.startsWith(itemPath + '/')) {
    return true;
  }

  return false;
}

/**
 * Get current navigation item based on path
 */
export function getCurrentNavigationItem(
  role: UserRole,
  currentPath: string
): NavigationItem | undefined {
  const items = getNavigationItems(role);
  return items.find(item => isRouteActive(currentPath, item.href));
}

/**
 * Get breadcrumbs for current path
 */
export function getBreadcrumbs(
  role: UserRole,
  currentPath: string
): { label: string; href: string }[] {
  const segments = currentPath.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];
  
  let currentHref = '';
  for (const segment of segments) {
    currentHref += `/${segment}`;
    const item = getCurrentNavigationItem(role, currentHref);
    if (item) {
      breadcrumbs.push({
        label: item.label,
        href: item.href
      });
    }
  }
  
  return breadcrumbs;
}