import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  findOrphanedUsers,
  deleteUser,
  deleteUserByEmail,
  bulkCleanupOrphanedUsers,
  createAdminClient,
} from "@/lib/admin/cleanup-users";
import { createClient } from "@supabase/supabase-js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

type AuthUser = { id: string; email?: string; created_at: string };

function createSupabaseAdminMock(options?: {
  authUsers?: AuthUser[];
  listUsersError?: unknown;
  usersById?: Record<string, { role?: string } | null>;
  roleProfiles?: {
    mahasiswa?: Record<string, boolean>;
    dosen?: Record<string, boolean>;
    laboran?: Record<string, boolean>;
  };
  usersDeleteError?: unknown;
  authDeleteError?: unknown;
}) {
  const state = {
    authUsers: options?.authUsers ?? [],
    listUsersError: options?.listUsersError ?? null,
    usersById: options?.usersById ?? {},
    roleProfiles: options?.roleProfiles ?? {},
    usersDeleteError: options?.usersDeleteError ?? null,
    authDeleteError: options?.authDeleteError ?? null,
  };

  const from = vi.fn((table: string) => {
    const select = vi.fn(() => {
      const eq = vi.fn((_column: string, value: string) => {
        const single = vi.fn(async () => {
          if (table === "users") {
            const row = state.usersById[value];
            if (!row) return { data: null, error: new Error("Not found") };
            return { data: row, error: null };
          }

          if (table === "mahasiswa") {
            const ok = !!state.roleProfiles.mahasiswa?.[value];
            return {
              data: ok ? { id: "m-1" } : null,
              error: ok ? null : new Error("Not found"),
            };
          }

          if (table === "dosen") {
            const ok = !!state.roleProfiles.dosen?.[value];
            return {
              data: ok ? { id: "d-1" } : null,
              error: ok ? null : new Error("Not found"),
            };
          }

          if (table === "laboran") {
            const ok = !!state.roleProfiles.laboran?.[value];
            return {
              data: ok ? { id: "l-1" } : null,
              error: ok ? null : new Error("Not found"),
            };
          }

          return { data: null, error: null };
        });

        return { single };
      });

      return { eq };
    });

    const del = vi.fn(() => {
      const eq = vi.fn(async () => {
        if (table === "users") return { error: state.usersDeleteError };
        return { error: null };
      });
      return { eq };
    });

    return {
      select,
      delete: del,
    };
  });

  return {
    from,
    auth: {
      admin: {
        listUsers: vi.fn(async () => {
          if (state.listUsersError)
            return { data: null, error: state.listUsersError };
          return { data: { users: state.authUsers }, error: null };
        }),
        deleteUser: vi.fn(async () => ({ error: state.authDeleteError })),
      },
    },
  };
}

describe("cleanup-users", () => {
  const originalProcess = (globalThis as any).process;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    (globalThis as any).process = originalProcess;
  });

  it("findOrphanedUsers: mengembalikan user dengan status missing_users_entry", async () => {
    const supabaseAdmin: any = createSupabaseAdminMock({
      authUsers: [
        { id: "u-1", email: "u1@mail.com", created_at: "2026-01-01" },
      ],
      usersById: { "u-1": null },
    });

    const result = await findOrphanedUsers(supabaseAdmin);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "u-1",
      status: "missing_users_entry",
      email: "u1@mail.com",
    });
  });

  it("findOrphanedUsers: mendeteksi missing_role_profile untuk mahasiswa", async () => {
    const supabaseAdmin: any = createSupabaseAdminMock({
      authUsers: [
        { id: "u-2", email: "u2@mail.com", created_at: "2026-01-02" },
      ],
      usersById: { "u-2": { role: "mahasiswa" } },
      roleProfiles: { mahasiswa: { "u-2": false } },
    });

    const result = await findOrphanedUsers(supabaseAdmin);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "u-2",
      status: "missing_role_profile",
      role: "mahasiswa",
    });
  });

  it("findOrphanedUsers: tidak memasukkan user complete/admin", async () => {
    const supabaseAdmin: any = createSupabaseAdminMock({
      authUsers: [
        { id: "u-3", email: "u3@mail.com", created_at: "2026-01-03" },
        { id: "u-4", email: "u4@mail.com", created_at: "2026-01-03" },
      ],
      usersById: {
        "u-3": { role: "admin" },
        "u-4": { role: "dosen" },
      },
      roleProfiles: { dosen: { "u-4": true } },
    });

    const result = await findOrphanedUsers(supabaseAdmin);

    expect(result).toEqual([]);
  });

  it("deleteUser: sukses menghapus profile + users + auth", async () => {
    const supabaseAdmin: any = createSupabaseAdminMock({
      usersById: { "u-5": { role: "mahasiswa" } },
      roleProfiles: { mahasiswa: { "u-5": true } },
    });

    const result = await deleteUser(supabaseAdmin, "u-5");

    expect(result.success).toBe(true);
    expect(result.deleted).toEqual({ auth: true, users: true, profile: true });
    expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith("u-5");
  });

  it("deleteUser: gagal ketika delete auth error", async () => {
    const supabaseAdmin: any = createSupabaseAdminMock({
      usersById: { "u-6": { role: "dosen" } },
      roleProfiles: { dosen: { "u-6": true } },
      authDeleteError: new Error("Auth delete failed"),
    });

    const result = await deleteUser(supabaseAdmin, "u-6");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Auth delete failed");
  });

  it("deleteUserByEmail: return error jika email tidak ditemukan", async () => {
    const supabaseAdmin: any = createSupabaseAdminMock({
      authUsers: [
        { id: "u-7", email: "ada@mail.com", created_at: "2026-01-07" },
      ],
    });

    const result = await deleteUserByEmail(supabaseAdmin, "tidak-ada@mail.com");

    expect(result.success).toBe(false);
    expect(result.error).toContain("User not found with email");
  });

  it("bulkCleanupOrphanedUsers: menghitung total/success/failed", async () => {
    const supabaseAdmin: any = createSupabaseAdminMock({
      authUsers: [
        { id: "u-8", email: "u8@mail.com", created_at: "2026-01-08" },
        { id: "u-9", email: "u9@mail.com", created_at: "2026-01-09" },
      ],
      usersById: {
        "u-8": null,
        "u-9": { role: "mahasiswa" },
      },
      roleProfiles: { mahasiswa: { "u-9": false } },
      authDeleteError: new Error("delete auth gagal"),
    });

    const result = await bulkCleanupOrphanedUsers(supabaseAdmin);

    expect(result.total).toBe(2);
    expect(result.success + result.failed).toBe(2);
    expect(result.results).toHaveLength(2);
  });

  it("createAdminClient: throw jika env tidak lengkap", () => {
    (globalThis as any).process = { env: {} };

    expect(() => createAdminClient()).toThrow(
      "Missing Supabase credentials for admin client",
    );
  });

  it("createAdminClient: memanggil createClient dengan config admin", () => {
    const mockedCreateClient = vi.mocked(createClient as any);
    mockedCreateClient.mockReturnValue({ ok: true });

    (globalThis as any).process = {
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      },
    };

    const client = createAdminClient();

    expect(mockedCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
    expect(client).toEqual({ ok: true });
  });
});
