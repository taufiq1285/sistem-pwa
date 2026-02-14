/**
 * RBAC Middleware Integration Tests
 *
 * Tests middleware in realistic API scenarios:
 * - Creating resources with permission check
 * - Updating resources with ownership validation
 * - Deleting resources with permission + ownership
 * - Admin bypass scenarios
 * - Multi-role access patterns
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requirePermission,
  requireOwnership,
  requirePermissionAndOwnership,
} from "@/lib/middleware/permission.middleware";
import {
  PermissionError,
  OwnershipError,
} from "@/lib/errors/permission.errors";
import { supabase } from "@/lib/supabase/client";

// ============================================================================
// MOCKS
// ============================================================================

const createMockQuery = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    csv: vi.fn(),
    abortSignal: vi.fn().mockReturnThis(),
    // Add rpc method for functions
    rpc: vi.fn(),
  };
  return mockQuery;
};

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createMockQuery()),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "" } })),
        createSignedUrl: vi.fn(() => ({ data: { signedUrl: "" } })),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@/lib/utils/permissions", () => ({
  hasPermission: vi.fn(),
}));

import { hasPermission as mockedHasPermission } from "@/lib/utils/permissions";

// ============================================================================
// MOCK API FUNCTIONS (Simulating real API)
// ============================================================================

// Simulated database
const mockDatabase: any = {
  kuis: {},
  nilai: {},
  materi: {},
  peminjaman: {},
};

// Base CRUD operations (without middleware)
async function insertKuis(data: any) {
  const id = `kuis-${Date.now()}`;
  mockDatabase.kuis[id] = { ...data, id };
  return mockDatabase.kuis[id];
}

async function updateKuis(id: string, data: any) {
  if (!mockDatabase.kuis[id]) {
    throw new Error("Kuis not found");
  }
  mockDatabase.kuis[id] = { ...mockDatabase.kuis[id], ...data };
  return mockDatabase.kuis[id];
}

async function deleteKuis(id: string) {
  if (!mockDatabase.kuis[id]) {
    throw new Error("Kuis not found");
  }
  delete mockDatabase.kuis[id];
}

async function insertNilai(data: any) {
  const id = `nilai-${Date.now()}`;
  mockDatabase.nilai[id] = { ...data, id };
  return mockDatabase.nilai[id];
}

async function updateNilai(id: string, data: any) {
  if (!mockDatabase.nilai[id]) {
    throw new Error("Nilai not found");
  }
  mockDatabase.nilai[id] = { ...mockDatabase.nilai[id], ...data };
  return mockDatabase.nilai[id];
}

async function createPeminjaman(data: any) {
  const id = `peminjaman-${Date.now()}`;
  mockDatabase.peminjaman[id] = { ...data, id, status: "pending" };
  return mockDatabase.peminjaman[id];
}

async function approvePeminjaman(id: string) {
  if (!mockDatabase.peminjaman[id]) {
    throw new Error("Peminjaman not found");
  }
  mockDatabase.peminjaman[id].status = "approved";
  return mockDatabase.peminjaman[id];
}

// ============================================================================
// PROTECTED API FUNCTIONS (With middleware)
// ============================================================================

// Dosen: Create kuis (requires create:kuis permission)
const createKuis = requirePermission("manage:kuis", insertKuis);

// Dosen: Update own kuis (requires permission + ownership)
const updateKuisByOwner = requirePermissionAndOwnership(
  "manage:kuis",
  { table: "kuis", ownerField: "dosen_id" },
  0,
  updateKuis,
);

// Dosen: Delete own kuis
const deleteKuisByOwner = requirePermissionAndOwnership(
  "manage:kuis",
  { table: "kuis", ownerField: "dosen_id" },
  0,
  deleteKuis,
);

// Dosen: Create/update nilai for their students
const createNilai = requirePermission("manage:nilai", insertNilai);
const updateNilaiByDosen = requirePermission("manage:nilai", updateNilai);

// Mahasiswa: Create peminjaman
const createPeminjamanByMahasiswa = requirePermission(
  "create:peminjaman",
  createPeminjaman,
);

// Laboran: Approve peminjaman
const approvePeminjamanByLaboran = requirePermission(
  "approve:peminjaman",
  approvePeminjaman,
);

// ============================================================================
// TEST HELPERS
// ============================================================================

function setupMockUser(userId: string, role: string, roleSpecificId?: string) {
  (supabase.auth.getUser as any).mockResolvedValue({
    data: {
      user: {
        id: userId,
        email: `${role}@test.com`,
      },
    },
    error: null,
  });

  (supabase.from as any).mockImplementation((table: string) => {
    if (table === "users") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role },
          error: null,
        }),
      };
    }
    if (table === "dosen" && role === "dosen") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: roleSpecificId || "dosen-123" },
          error: null,
        }),
      };
    }
    if (table === "mahasiswa" && role === "mahasiswa") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: roleSpecificId || "mhs-123" },
          error: null,
        }),
      };
    }
    if (table === "laboran" && role === "laboran") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: roleSpecificId || "laboran-123" },
          error: null,
        }),
      };
    }
    // Resource ownership checks
    if (table === "kuis") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          const kuisId = "kuis-123"; // Default test kuis
          const kuis = mockDatabase.kuis[kuisId];
          return Promise.resolve({
            data: kuis,
            error: kuis ? null : new Error("Not found"),
          });
        }),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });
}

function setupPermissions(role: string, permissions: string[]) {
  (mockedHasPermission as any).mockImplementation(
    (userRole: string, permission: string) => {
      return userRole === role && permissions.includes(permission);
    },
  );
}

// ============================================================================
// INTEGRATION TEST SUITES
// ============================================================================

describe("RBAC Middleware Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock database
    mockDatabase.kuis = {};
    mockDatabase.nilai = {};
    mockDatabase.peminjaman = {};
  });

  // ==========================================================================
  // Scenario 1: Dosen Creating and Managing Kuis
  // ==========================================================================

  describe("Scenario: Dosen manages kuis", () => {
    const dosenId = "dosen-123";
    const userId = "user-dosen-123";

    beforeEach(() => {
      setupMockUser(userId, "dosen", dosenId);
      setupPermissions("dosen", [
        "manage:kuis",
        "manage:nilai",
        "view:mahasiswa",
      ]);
    });

    it("should allow dosen to create kuis", async () => {
      const kuisData = {
        judul: "Kuis Algoritma",
        deskripsi: "Kuis tentang sorting algorithms",
        dosen_id: dosenId,
      };

      const result = await createKuis(kuisData);

      expect(result).toBeDefined();
      expect(result.judul).toBe("Kuis Algoritma");
      expect(result.dosen_id).toBe(dosenId);
    });

    it("should allow dosen to update their own kuis", async () => {
      // First create a kuis
      const kuis = await insertKuis({
        judul: "Original Kuis",
        dosen_id: dosenId,
      });

      // Store in mock database for ownership check
      mockDatabase.kuis["kuis-123"] = kuis;

      const updated = await updateKuisByOwner("kuis-123", {
        judul: "Updated Kuis",
      });

      expect(updated.judul).toBe("Updated Kuis");
    });

    it("should allow dosen to delete their own kuis", async () => {
      // Create a kuis
      const kuis = await insertKuis({
        judul: "To Delete",
        dosen_id: dosenId,
      });

      mockDatabase.kuis["kuis-123"] = kuis;

      await deleteKuisByOwner("kuis-123");

      expect(mockDatabase.kuis["kuis-123"]).toBeUndefined();
    });

    it("should prevent dosen from updating kuis owned by another dosen", async () => {
      // Create kuis owned by different dosen
      const otherDosenKuis = await insertKuis({
        judul: "Other Dosen Kuis",
        dosen_id: "dosen-456", // Different dosen
      });

      mockDatabase.kuis["kuis-123"] = otherDosenKuis;

      await expect(
        updateKuisByOwner("kuis-123", { judul: "Hacked" }),
      ).rejects.toThrow(OwnershipError);
    });

    it("should allow dosen to create nilai for students", async () => {
      const nilaiData = {
        mahasiswa_id: "mhs-123",
        kuis_id: "kuis-123",
        nilai: 85,
        feedback: "Good work",
      };

      const result = await createNilai(nilaiData);

      expect(result).toBeDefined();
      expect(result.nilai).toBe(85);
    });
  });

  // ==========================================================================
  // Scenario 2: Mahasiswa Creating Peminjaman
  // ==========================================================================

  describe("Scenario: Mahasiswa creates peminjaman", () => {
    const mahasiswaId = "mhs-123";
    const userId = "user-mhs-123";

    beforeEach(() => {
      setupMockUser(userId, "mahasiswa", mahasiswaId);
      setupPermissions("mahasiswa", [
        "create:peminjaman",
        "view:peminjaman",
        "view:kuis",
        "create:attempt_kuis",
      ]);
    });

    it("should allow mahasiswa to create peminjaman", async () => {
      const peminjamanData = {
        mahasiswa_id: mahasiswaId,
        item: "Oscilloscope",
        tanggal_pinjam: "2025-02-01",
        tanggal_kembali: "2025-02-05",
      };

      const result = await createPeminjamanByMahasiswa(peminjamanData);

      expect(result).toBeDefined();
      expect(result.status).toBe("pending");
      expect(result.mahasiswa_id).toBe(mahasiswaId);
    });

    it("should prevent mahasiswa from creating kuis", async () => {
      const kuisData = {
        judul: "Hacked Kuis",
        dosen_id: "fake-dosen-id",
      };

      await expect(createKuis(kuisData)).rejects.toThrow(PermissionError);
    });

    it("should prevent mahasiswa from approving peminjaman", async () => {
      const peminjaman = await createPeminjaman({
        mahasiswa_id: mahasiswaId,
        item: "Test item",
      });

      mockDatabase.peminjaman[peminjaman.id] = peminjaman;

      await expect(approvePeminjamanByLaboran(peminjaman.id)).rejects.toThrow(
        PermissionError,
      );
    });
  });

  // ==========================================================================
  // Scenario 3: Laboran Approving Peminjaman
  // ==========================================================================

  describe("Scenario: Laboran approves peminjaman", () => {
    const laboranId = "laboran-123";
    const userId = "user-laboran-123";

    beforeEach(() => {
      setupMockUser(userId, "laboran", laboranId);
      setupPermissions("laboran", [
        "approve:peminjaman",
        "view:peminjaman",
        "manage:inventaris",
        "manage:laboratorium",
      ]);
    });

    it("should allow laboran to approve peminjaman", async () => {
      const peminjaman = await createPeminjaman({
        mahasiswa_id: "mhs-123",
        item: "Multimeter",
      });

      mockDatabase.peminjaman[peminjaman.id] = peminjaman;

      const approved = await approvePeminjamanByLaboran(peminjaman.id);

      expect(approved.status).toBe("approved");
    });

    it("should prevent laboran from creating kuis", async () => {
      await expect(createKuis({ judul: "Unauthorized Kuis" })).rejects.toThrow(
        PermissionError,
      );
    });

    it("should prevent laboran from managing nilai", async () => {
      await expect(
        createNilai({ mahasiswa_id: "mhs-123", nilai: 100 }),
      ).rejects.toThrow(PermissionError);
    });
  });

  // ==========================================================================
  // Scenario 4: Admin Has Universal Access
  // ==========================================================================

  describe("Scenario: Admin has universal access", () => {
    const adminId = "admin-123";
    const userId = "user-admin-123";

    beforeEach(() => {
      setupMockUser(userId, "admin");
      // Admin has ALL permissions
      setupPermissions("admin", [
        "manage:kuis",
        "manage:nilai",
        "approve:peminjaman",
        "manage:user",
        "manage:inventaris",
      ]);
    });

    it("should allow admin to create kuis (even without dosen_id)", async () => {
      const kuis = await createKuis({
        judul: "Admin Created Kuis",
        dosen_id: "any-dosen-id",
      });

      expect(kuis).toBeDefined();
    });

    it("should allow admin to update any kuis (ownership bypass)", async () => {
      // Create kuis owned by dosen
      const kuis = await insertKuis({
        judul: "Dosen Kuis",
        dosen_id: "dosen-456",
      });

      mockDatabase.kuis["kuis-123"] = kuis;

      // Admin should be able to update despite not being owner
      const updated = await updateKuisByOwner("kuis-123", {
        judul: "Admin Updated",
      });

      expect(updated.judul).toBe("Admin Updated");
    });

    it("should allow admin to approve peminjaman", async () => {
      const peminjaman = await createPeminjaman({
        mahasiswa_id: "mhs-123",
        item: "Equipment",
      });

      mockDatabase.peminjaman[peminjaman.id] = peminjaman;

      const approved = await approvePeminjamanByLaboran(peminjaman.id);

      expect(approved.status).toBe("approved");
    });

    it("should allow admin to create nilai", async () => {
      const nilai = await createNilai({
        mahasiswa_id: "mhs-123",
        nilai: 95,
      });

      expect(nilai).toBeDefined();
    });
  });

  // ==========================================================================
  // Scenario 5: Cross-Role Permission Violations
  // ==========================================================================

  describe("Scenario: Cross-role permission violations", () => {
    it("should prevent mahasiswa from accessing dosen functions", async () => {
      setupMockUser("user-mhs-123", "mahasiswa", "mhs-123");
      setupPermissions("mahasiswa", ["view:kuis", "create:attempt_kuis"]);

      await expect(createKuis({ judul: "Unauthorized" })).rejects.toThrow(
        PermissionError,
      );
    });

    it("should prevent laboran from accessing dosen functions", async () => {
      setupMockUser("user-laboran-123", "laboran", "laboran-123");
      setupPermissions("laboran", ["manage:inventaris", "approve:peminjaman"]);

      await expect(
        createNilai({ mahasiswa_id: "mhs-123", nilai: 100 }),
      ).rejects.toThrow(PermissionError);
    });

    it("should prevent dosen from accessing laboran functions", async () => {
      setupMockUser("user-dosen-123", "dosen", "dosen-123");
      setupPermissions("dosen", ["manage:kuis", "manage:nilai"]);

      const peminjaman = await createPeminjaman({
        mahasiswa_id: "mhs-123",
        item: "Test",
      });

      mockDatabase.peminjaman[peminjaman.id] = peminjaman;

      await expect(approvePeminjamanByLaboran(peminjaman.id)).rejects.toThrow(
        PermissionError,
      );
    });
  });

  // ==========================================================================
  // Scenario 6: Error Messages and Logging
  // ==========================================================================

  describe("Scenario: Error handling and messages", () => {
    it("should provide clear error message for permission denial", async () => {
      setupMockUser("user-mhs-123", "mahasiswa", "mhs-123");
      setupPermissions("mahasiswa", ["view:kuis"]);

      try {
        await createKuis({ judul: "Test" });
        throw new Error("Should have thrown PermissionError");
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError);
        expect((error as PermissionError).permission).toBe("manage:kuis");
        expect((error as PermissionError).userRole).toBe("mahasiswa");
        expect((error as PermissionError).message).toContain(
          "Missing permission",
        );
      }
    });

    it("should provide clear error message for ownership denial", async () => {
      setupMockUser("user-dosen-123", "dosen", "dosen-123");
      setupPermissions("dosen", ["manage:kuis"]);

      // Create kuis owned by different dosen
      const kuis = await insertKuis({
        judul: "Other Kuis",
        dosen_id: "dosen-456",
      });

      mockDatabase.kuis["kuis-123"] = kuis;

      try {
        await updateKuisByOwner("kuis-123", { judul: "Hacked" });
        throw new Error("Should have thrown OwnershipError");
      } catch (error) {
        expect(error).toBeInstanceOf(OwnershipError);
        expect((error as OwnershipError).resourceType).toBe("kuis");
        expect((error as OwnershipError).message).toContain(
          "your own resources",
        );
      }
    });
  });
});
