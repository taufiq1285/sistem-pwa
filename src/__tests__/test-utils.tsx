/**
 * Test Utilities
 */

import { vi } from "vitest";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialState?: Record<string, unknown>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

// Helper to generate valid UUID v4
export const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Predefined UUIDs for consistent testing
export const TEST_UUIDS = {
  USER_1: "550e8400-e29b-41d4-a716-446655440001",
  USER_2: "550e8400-e29b-41d4-a716-446655440002",
  DOSEN_1: "550e8400-e29b-41d4-a716-446655440011",
  DOSEN_2: "550e8400-e29b-41d4-a716-446655440012",
  MAHASISWA_1: "550e8400-e29b-41d4-a716-446655440021",
  MAHASISWA_2: "550e8400-e29b-41d4-a716-446655440022",
  KELAS_1: "550e8400-e29b-41d4-a716-446655440031",
  KELAS_2: "550e8400-e29b-41d4-a716-446655440032",
  MATA_KULIAH_1: "550e8400-e29b-41d4-a716-446655440041",
  MATA_KULIAH_2: "550e8400-e29b-41d4-a716-446655440042",
  KUIS_1: "550e8400-e29b-41d4-a716-446655440051",
  KUIS_2: "550e8400-e29b-41d4-a716-446655440052",
  LAB_1: "550e8400-e29b-41d4-a716-446655440061",
  LAB_2: "550e8400-e29b-41d4-a716-446655440062",
  INVENTARIS_1: "550e8400-e29b-41d4-a716-446655440071",
  INVENTARIS_2: "550e8400-e29b-41d4-a716-446655440072",
};

export const createMockUser = (overrides = {}) => ({
  id: TEST_UUIDS.USER_1,
  email: "test@example.com",
  full_name: "Test User",
  nama: "Test User",
  role: "mahasiswa",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockKuis = (overrides = {}) => ({
  id: TEST_UUIDS.KUIS_1,
  kelas_id: TEST_UUIDS.KELAS_1,
  dosen_id: TEST_UUIDS.DOSEN_1,
  judul: "Test Quiz",
  deskripsi: "Test Description",
  durasi_menit: 60,
  tanggal_mulai: new Date().toISOString(),
  tanggal_selesai: new Date(Date.now() + 86400000).toISOString(),
  max_attempts: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockKelas = (overrides = {}) => ({
  id: TEST_UUIDS.KELAS_1,
  nama_kelas: "Test Kelas",
  mata_kuliah_id: TEST_UUIDS.MATA_KULIAH_1,
  dosen_id: TEST_UUIDS.DOSEN_1,
  semester: "Ganjil",
  tahun_ajaran: "2024/2025",
  kuota: 30,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockDosen = (overrides = {}) => ({
  id: TEST_UUIDS.DOSEN_1,
  user_id: TEST_UUIDS.USER_1,
  nip: "1234567890",
  nama: "Dr. Test Dosen",
  email: "dosen@example.com",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockMahasiswa = (overrides = {}) => ({
  id: TEST_UUIDS.MAHASISWA_1,
  user_id: TEST_UUIDS.USER_1,
  nim: "2021001",
  nama: "Test Mahasiswa",
  email: "mahasiswa@example.com",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const waitForNextTick = () =>
  new Promise((resolve) => process.nextTick(resolve));

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

/**
 * Helper function to setup Supabase auth and middleware mocks
 * This should be called in beforeEach() of tests that use requirePermission middleware
 */
export function setupSupabaseAuthMock(
  overrides: { userId?: string; role?: string } = {},
) {
  const { userId = TEST_UUIDS.USER_1, role = "admin" } = overrides;

  return {
    // Mock auth getUser
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId, role } },
        error: null,
      }),
    },
    // Mock user role query (from middleware)
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role },
              error: null,
            }),
          }),
        };
      }
      // Default mock for other tables
      return {
        select: vi.fn().mockReturnThis(),
      };
    }),
  };
}
