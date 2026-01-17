/**
 * Routes Configuration - COMPLETE VERSION
 * Define all route paths for the application
 */

export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  NOT_FOUND: "/404",
  UNAUTHORIZED: "/403",

  // Admin routes
  ADMIN: {
    ROOT: "/admin",
    DASHBOARD: "/admin/dashboard",
    USERS: "/admin/users",
    ROLES: "/admin/roles",
    LABORATORIES: "/admin/laboratories",
    EQUIPMENTS: "/admin/equipments",
    ANNOUNCEMENTS: "/admin/announcements",
    NOTIFIKASI: "/admin/notifikasi", // Alias untuk announcements
    ANALYTICS: "/admin/analytics",
    SYNC_MANAGEMENT: "/admin/sync-management",
    MATA_KULIAH: "/admin/mata-kuliah",
    KELAS: "/admin/kelas",
  },

  // Dosen routes
  DOSEN: {
    ROOT: "/dosen",
    DASHBOARD: "/dosen/dashboard",
    JADWAL: "/dosen/jadwal",
    KUIS: {
      LIST: "/dosen/kuis",
      CREATE: "/dosen/kuis/create",
      EDIT: "/dosen/kuis/:id/edit",
      RESULTS: "/dosen/kuis/:id/results",
    },
    PEMINJAMAN: "/dosen/peminjaman",
    KEHADIRAN: "/dosen/kehadiran",
    MATERI: "/dosen/materi",
    PENILAIAN: "/dosen/penilaian",
    NOTIFIKASI: "/dosen/notifikasi",
  },

  // Mahasiswa routes
  MAHASISWA: {
    ROOT: "/mahasiswa",
    DASHBOARD: "/mahasiswa/dashboard",
    JADWAL: "/mahasiswa/jadwal",
    KUIS: {
      LIST: "/mahasiswa/kuis",
      ATTEMPT: "/mahasiswa/kuis/:id/attempt",
      RESULT: "/mahasiswa/kuis/:id/result",
    },
    MATERI: "/mahasiswa/materi",
    NILAI: "/mahasiswa/nilai",
    PRESENSI: "/mahasiswa/presensi",
    NOTIFIKASI: "/mahasiswa/notifikasi",
    PROFILE: "/mahasiswa/profile",
    OFFLINE_SYNC: "/mahasiswa/offline-sync",
  },

  // Laboran routes
  LABORAN: {
    ROOT: "/laboran",
    DASHBOARD: "/laboran/dashboard",
    INVENTARIS: "/laboran/inventaris",
    PEMINJAMAN: "/laboran/peminjaman",
    PERSETUJUAN: "/laboran/persetujuan",
    LABORATORIUM: "/laboran/laboratorium",
    LAPORAN: "/laboran/laporan",
    NOTIFIKASI: "/laboran/notifikasi",
  },
} as const;

/**
 * Helper function to build dynamic routes
 */
export const buildRoute = (
  template: string,
  params: Record<string, string | number>,
): string => {
  let route = template;
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(`:${key}`, String(value));
  });
  return route;
};

/**
 * Get base path for a role
 */
export const getRoleBasePath = (role: string): string => {
  switch (role) {
    case "admin":
      return ROUTES.ADMIN.ROOT;
    case "dosen":
      return ROUTES.DOSEN.ROOT;
    case "mahasiswa":
      return ROUTES.MAHASISWA.ROOT;
    case "laboran":
      return ROUTES.LABORAN.ROOT;
    default:
      return ROUTES.HOME;
  }
};

/**
 * Get dashboard path for a role
 */
export const getRoleDashboard = (role: string): string => {
  switch (role) {
    case "admin":
      return ROUTES.ADMIN.DASHBOARD;
    case "dosen":
      return ROUTES.DOSEN.DASHBOARD;
    case "mahasiswa":
      return ROUTES.MAHASISWA.DASHBOARD;
    case "laboran":
      return ROUTES.LABORAN.DASHBOARD;
    default:
      return ROUTES.HOME;
  }
};
