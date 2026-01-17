/**
 * Standardized Error Messages - Bahasa Indonesia
 */

export const ERROR_MESSAGES = {
  AUTH: {
    NOT_AUTHENTICATED: "Anda belum login. Silakan login terlebih dahulu.",
    INVALID_CREDENTIALS: "Email atau password salah. Silakan coba lagi.",
    EMAIL_ALREADY_EXISTS:
      "Email sudah terdaftar. Silakan gunakan email lain atau login.",
    WEAK_PASSWORD: "Password terlalu lemah. Minimal 6 karakter.",
    SESSION_EXPIRED: "Sesi Anda telah berakhir. Silakan login kembali.",
    UNAUTHORIZED: "Anda tidak memiliki akses ke halaman ini.",
  },

  PERMISSION: {
    FORBIDDEN: "Anda tidak memiliki izin untuk melakukan aksi ini.",
    MISSING_PERMISSION: (permission: string) =>
      `Izin diperlukan: ${permission}`,
    NOT_OWNER: "Anda hanya bisa mengakses data Anda sendiri.",
  },

  QUIZ: {
    NOT_FOUND: "Tugas praktikum tidak ditemukan.",
    NOT_ACTIVE: "Tugas praktikum tidak aktif atau sudah berakhir.",
    NOT_PUBLISHED: "Tugas praktikum belum dipublish oleh dosen.",
    ALREADY_SUBMITTED: "Anda sudah submit tugas praktikum ini.",
    TIME_EXPIRED: "Waktu tugas praktikum telah habis.",
    MAX_ATTEMPTS_REACHED: "Anda sudah mencapai batas maksimal percobaan.",
  },

  VALIDATION: {
    REQUIRED_FIELD: (field: string) => `${field} wajib diisi.`,
    INVALID_EMAIL: "Format email tidak valid.",
    INVALID_DATE: "Format tanggal tidak valid.",
    MIN_LENGTH: (field: string, min: number) =>
      `${field} minimal ${min} karakter.`,
    MAX_LENGTH: (field: string, max: number) =>
      `${field} maksimal ${max} karakter.`,
  },

  NETWORK: {
    OFFLINE: "Anda sedang offline. Beberapa fitur mungkin tidak tersedia.",
    TIMEOUT: "Koneksi timeout. Silakan coba lagi.",
    SERVER_ERROR: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
    NOT_FOUND: "Data tidak ditemukan.",
  },

  DATABASE: {
    QUERY_FAILED: "Gagal mengambil data dari database.",
    INSERT_FAILED: "Gagal menyimpan data.",
    UPDATE_FAILED: "Gagal mengupdate data.",
    DELETE_FAILED: "Gagal menghapus data.",
    DUPLICATE_ENTRY: "Data sudah ada. Gunakan data yang berbeda.",
  },

  GENERIC: {
    UNKNOWN_ERROR: "Terjadi kesalahan. Silakan coba lagi.",
    TRY_AGAIN: "Gagal memproses. Silakan coba lagi.",
    CONTACT_ADMIN: "Jika masalah berlanjut, hubungi administrator.",
  },
} as const;

export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
}

export function createError(
  message: string,
  context?: Record<string, any>,
): Error {
  const error = new Error(message);
  if (context) (error as any).context = context;
  return error;
}

export function getSupabaseErrorMessage(error: any): string {
  if (!error) return ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;

  const code = error.code || error.error_code;
  const message = error.message || error.error;

  if (code === "PGRST116") return ERROR_MESSAGES.NETWORK.NOT_FOUND;
  if (code === "23505") return ERROR_MESSAGES.DATABASE.DUPLICATE_ENTRY;
  if (message?.includes("Invalid login"))
    return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
  if (message?.includes("already registered"))
    return ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS;

  return message || ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR;
}
