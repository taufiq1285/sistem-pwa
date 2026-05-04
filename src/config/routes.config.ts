/**
 * Routes Configuration
 * Define all route paths for the application
 *
 * CRITICAL: This is the single source of truth for all routes
 */

export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
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
    NOTIFIKASI: "/admin/notifikasi",
    ANALYTICS: "/admin/analytics",
    SYNC_MANAGEMENT: "/admin/sync-management",
    PROFILE: "/admin/profil",
    OFFLINE_SYNC: "/admin/offline-sync",
  },

  // Dosen routes
  DOSEN: {
    ROOT: "/dosen",
    DASHBOARD: "/dosen/dashboard",
    MATA_KULIAH: "/dosen/mata-kuliah",
    JADWAL: "/dosen/jadwal",
    BANK_SOAL: "/dosen/bank-soal",
    KUIS: {
      LIST: "/dosen/kuis",
      CREATE: "/dosen/kuis/create",
      EDIT: "/dosen/kuis/:id/edit",
      RESULTS: "/dosen/kuis/:id/results",
    },
    PEMINJAMAN: "/dosen/peminjaman",
    KEHADIRAN: "/dosen/kehadiran",
    MAHASISWA: "/dosen/mahasiswa",
    MATERI: "/dosen/materi",
    PENILAIAN: "/dosen/penilaian",
    LOGBOOK_REVIEW: "/dosen/logbook-review",
    NOTIFIKASI: "/dosen/notifikasi",
    PENGUMUMAN: "/dosen/pengumuman",
    PROFILE: "/dosen/profil",
    OFFLINE_SYNC: "/dosen/offline-sync",
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
    PENGUMUMAN: "/mahasiswa/pengumuman",
    PROFILE: "/mahasiswa/profil",
    OFFLINE_SYNC: "/mahasiswa/offline-sync",
    LOGBOOK: "/mahasiswa/logbook",
  },

  // Laboran routes
  LABORAN: {
    ROOT: "/laboran",
    DASHBOARD: "/laboran/dashboard",
    INVENTARIS: "/laboran/inventaris",
    PEMINJAMAN: "/laboran/peminjaman",
    PERSETUJUAN: "/laboran/persetujuan",
    LABORATORIUM: "/laboran/laboratorium",
    JADWAL: "/laboran/jadwal",
    LAPORAN: "/laboran/laporan",
    NOTIFIKASI: "/laboran/notifikasi",
    PROFILE: "/laboran/profil",
    OFFLINE_SYNC: "/laboran/offline-sync",
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

export const getRoleProfilePath = (role: string): string => {
  switch (role) {
    case "admin":
      return ROUTES.ADMIN.PROFILE;
    case "dosen":
      return ROUTES.DOSEN.PROFILE;
    case "mahasiswa":
      return ROUTES.MAHASISWA.PROFILE;
    case "laboran":
      return ROUTES.LABORAN.PROFILE;
    default:
      return ROUTES.HOME;
  }
};

export const getRoleNotificationPath = (role: string): string => {
  switch (role) {
    case "admin":
      return ROUTES.ADMIN.NOTIFIKASI;
    case "dosen":
      return ROUTES.DOSEN.NOTIFIKASI;
    case "mahasiswa":
      return ROUTES.MAHASISWA.NOTIFIKASI;
    case "laboran":
      return ROUTES.LABORAN.NOTIFIKASI;
    default:
      return ROUTES.HOME;
  }
};

export const getRoleOfflineSyncPath = (role: string): string => {
  switch (role) {
    case "admin":
      return ROUTES.ADMIN.OFFLINE_SYNC;
    case "dosen":
      return ROUTES.DOSEN.OFFLINE_SYNC;
    case "mahasiswa":
      return ROUTES.MAHASISWA.OFFLINE_SYNC;
    case "laboran":
      return ROUTES.LABORAN.OFFLINE_SYNC;
    default:
      return ROUTES.HOME;
  }
};
