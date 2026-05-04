/**
 * Navigation Configuration
 * Defines navigation items for each role with icons and descriptions
 *
 * UPDATED: Added "Mata Kuliah" menu for Admin
 * UPDATED: Added "Persetujuan Peminjaman" menu for Admin
 * REASON: Admin can act as backup for Laboran to approve peminjaman requests
 */

import {
  Home,
  PackageCheck,
  Calendar,
  ClipboardList,
  Award,
  Users,
  FileText,
  // Settings, // ❌ DISABLED: Unused (was for Sync Management)
  Package,
  BarChart3,
  ClipboardCheck,
  Building2,
  UserCog,
  User,
  BookOpen,
  UserCheck,
  Bell,
  Megaphone,
  NotebookPen,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/auth.types";
import { ROUTES } from "@/config/routes.config";

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
    label: "Dashboard",
    href: ROUTES.MAHASISWA.DASHBOARD,
    icon: Home,
    description: "Ringkasan aktivitas akademik",
  },
  {
    label: "Jadwal Praktikum",
    href: ROUTES.MAHASISWA.JADWAL,
    icon: Calendar,
    description: "Jadwal praktikum kebidanan",
  },
  {
    label: "Logbook Digital",
    href: "/mahasiswa/logbook",
    icon: NotebookPen,
    description: "Catatan pengalaman praktikum",
  },
  {
    label: "Tugas Praktikum",
    href: ROUTES.MAHASISWA.KUIS.LIST,
    icon: ClipboardList,
    description: "Pre-test, post-test, dan laporan praktikum",
  },
  {
    label: "Nilai",
    href: ROUTES.MAHASISWA.NILAI,
    icon: Award,
    description: "Hasil penilaian",
  },
  {
    label: "Presensi",
    href: ROUTES.MAHASISWA.PRESENSI,
    icon: ClipboardCheck,
    description: "Kehadiran praktikum",
  },
  {
    label: "Materi",
    href: ROUTES.MAHASISWA.MATERI,
    icon: FileText,
    description: "Materi pembelajaran",
  },
  {
    label: "Notifikasi",
    href: ROUTES.MAHASISWA.NOTIFIKASI,
    icon: Bell,
    description: "Lihat notifikasi",
  },
  {
    label: "Sinkronisasi Offline",
    href: ROUTES.MAHASISWA.OFFLINE_SYNC,
    icon: RefreshCw,
    description: "Sinkronisasi data offline ke server",
  },
];

/**
 * Dosen Navigation
 */
const dosenNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.DOSEN.DASHBOARD,
    icon: Home,
    description: "Ringkasan aktivitas mengajar",
  },
  {
    label: "Jadwal Praktikum",
    href: ROUTES.DOSEN.JADWAL,
    icon: Calendar,
    description: "Kelola jadwal praktikum",
  },
  {
    label: "Tugas Praktikum",
    href: ROUTES.DOSEN.KUIS.LIST,
    icon: ClipboardList,
    description: "Pre-test, post-test, dan laporan praktikum",
  },
  {
    label: "Bank Soal",
    href: ROUTES.DOSEN.BANK_SOAL,
    icon: BookOpen,
    description: "Bank soal yang dapat digunakan kembali",
  },
  {
    label: "Review Logbook",
    href: ROUTES.DOSEN.LOGBOOK_REVIEW,
    icon: NotebookPen,
    description: "Review dan nilai logbook mahasiswa",
  },
  {
    label: "Peminjaman",
    href: ROUTES.DOSEN.PEMINJAMAN,
    icon: Package,
    description: "Peminjaman alat",
  },
  {
    label: "Kehadiran",
    href: ROUTES.DOSEN.KEHADIRAN,
    icon: UserCheck,
    description: "Input kehadiran mahasiswa",
  },
  {
    label: "Materi",
    href: ROUTES.DOSEN.MATERI,
    icon: FileText,
    description: "Upload materi",
  },
  {
    label: "Penilaian",
    href: ROUTES.DOSEN.PENILAIAN,
    icon: Award,
    description: "Input nilai mahasiswa",
  },
  {
    label: "Notifikasi",
    href: ROUTES.DOSEN.NOTIFIKASI,
    icon: Bell,
    description: "Lihat notifikasi",
  },
  {
    label: "Sinkronisasi Offline",
    href: ROUTES.DOSEN.OFFLINE_SYNC,
    icon: RefreshCw,
    description: "Sinkronisasi data offline ke server",
  },
];

/**
 * Admin Navigation
 */
const adminNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
    description: "Ringkasan sistem",
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: UserCog,
    description: "Kelola pengguna",
  },
  {
    label: "Mata Kuliah",
    href: "/admin/mata-kuliah",
    icon: BookOpen,
    description: "Kelola mata kuliah",
  },
  {
    label: "Kelas",
    href: "/admin/kelas",
    icon: Users,
    description: "Kelola kelas",
  },
  {
    label: "Laboratories",
    href: "/admin/laboratories",
    icon: Building2,
    description: "Kelola laboratorium",
  },
  {
    label: "Equipments",
    href: "/admin/equipments",
    icon: Package,
    description: "Kelola peralatan",
  },
  {
    label: "Persetujuan Peminjaman",
    href: "/admin/peminjaman",
    icon: ClipboardCheck,
    description: "Persetujuan peminjaman alat",
  },
  {
    label: "Kelola Peminjaman",
    href: "/admin/peminjaman-aktif",
    icon: PackageCheck,
    description: "Kelola peminjaman aktif & pengembalian",
  },
  {
    label: "Manajemen Assignment",
    href: "/admin/manajemen-assignment",
    icon: Users,
    description: "Kelola assignment & jadwal terpadu",
  },
  {
    label: "Pengumuman",
    href: "/admin/announcements",
    icon: Megaphone,
    description: "Kelola broadcast pengumuman",
  },
  {
    label: "Notifikasi",
    href: "/admin/notifikasi",
    icon: Bell,
    description: "Lihat notifikasi",
  },
  {
    label: "Sinkronisasi Offline",
    href: "/admin/offline-sync",
    icon: RefreshCw,
    description: "Sinkronisasi data offline ke server",
  },
  // ❌ DISABLED: Analytics - tidak dalam scope proposal penelitian
  // {
  //   label: "Analytics",
  //   href: "/admin/analytics",
  //   icon: BarChart3,
  //   description: "Analitik sistem",
  // },
  // ❌ DISABLED: Sync Management - tidak dalam scope proposal penelitian
  // {
  //   label: "Sync Management",
  //   href: "/admin/sync-management",
  //   icon: Settings,
  //   description: "Kelola sinkronisasi",
  // },
];

/**
 * Laboran Navigation
 */
const laboranNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: ROUTES.LABORAN.DASHBOARD,
    icon: Home,
    description: "Ringkasan aktivitas laboratorium",
  },
  {
    label: "Inventaris",
    href: ROUTES.LABORAN.INVENTARIS,
    icon: Package,
    description: "Kelola inventaris",
  },
  {
    label: "Peminjaman Alat",
    href: ROUTES.LABORAN.PEMINJAMAN,
    icon: PackageCheck,
    description: "Persetujuan, peminjaman aktif, dan pengembalian",
  },
  {
    label: "Laboratorium",
    href: ROUTES.LABORAN.LABORATORIUM,
    icon: Building2,
    description: "Kelola laboratorium",
  },
  {
    label: "Kelola Jadwal",
    href: ROUTES.LABORAN.JADWAL,
    icon: Calendar,
    description: "Persetujuan booking & kelola jadwal praktikum",
  },
  {
    label: "Laporan",
    href: ROUTES.LABORAN.LAPORAN,
    icon: BarChart3,
    description: "Rekap, ekspor, dan print pertanggungjawaban laboratorium",
  },
  {
    label: "Notifikasi",
    href: ROUTES.LABORAN.NOTIFIKASI,
    icon: Bell,
    description: "Lihat notifikasi",
  },
  {
    label: "Profil",
    href: ROUTES.LABORAN.PROFILE,
    icon: User,
    description: "Kelola profil laboran",
  },
  {
    label: "Sinkronisasi Offline",
    href: ROUTES.LABORAN.OFFLINE_SYNC,
    icon: RefreshCw,
    description: "Sinkronisasi data offline ke server",
  },
];

// ============================================================================
// NAVIGATION MAP
// ============================================================================

const navigationMap: Record<UserRole, NavigationItem[]> = {
  mahasiswa: mahasiswaNavigation,
  dosen: dosenNavigation,
  admin: adminNavigation,
  laboran: laboranNavigation,
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
  if (itemPath !== "/" && currentPath.startsWith(itemPath + "/")) {
    return true;
  }

  return false;
}

/**
 * Get current navigation item based on path
 */
export function getCurrentNavigationItem(
  role: UserRole,
  currentPath: string,
): NavigationItem | undefined {
  const items = getNavigationItems(role);
  return items.find((item) => isRouteActive(currentPath, item.href));
}

/**
 * Get breadcrumbs for current path
 */
export function getBreadcrumbs(
  role: UserRole,
  currentPath: string,
): { label: string; href: string }[] {
  const segments = currentPath.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  let currentHref = "";
  for (const segment of segments) {
    currentHref += `/${segment}`;
    const item = getCurrentNavigationItem(role, currentHref);
    if (item) {
      breadcrumbs.push({
        label: item.label,
        href: item.href,
      });
    }
  }

  return breadcrumbs;
}
