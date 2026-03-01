/**
 * Versioned Update API Unit Tests - CORE LOGIC
 * Target: src/lib/api/versioned-update.api.ts
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const rpcMock = vi.fn();
  const singleMock = vi.fn();
  const eqMock = vi.fn(() => ({ single: singleMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const updateSelectSingleMock = vi.fn(() => ({ single: singleMock }));
  const updateEqMock = vi.fn(() => ({ select: updateSelectSingleMock }));
  const updateMock = vi.fn(() => ({ eq: updateEqMock }));
  const fromMock = vi.fn(() => ({
    select: selectMock,
    update: updateMock,
  }));
  const resolveMock = vi.fn();

  return {
    rpcMock,
    singleMock,
    eqMock,
    selectMock,
    updateSelectSingleMock,
    updateEqMock,
    updateMock,
    fromMock,
    resolveMock,
  };
});

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    rpc: mocks.rpcMock,
    from: mocks.fromMock,
  },
}));

vi.mock("@/lib/offline/smart-conflict-resolver", () => ({
  smartConflictResolver: {
    resolve: mocks.resolveMock,
  },
}));

import {
  checkVersionConflict,
  getVersion,
  safeUpdateWithVersion,
  updateWithAutoResolve,
  updateWithConflictLog,
  withVersion,
} from "@/lib/api/versioned-update.api";
import { smartConflictResolver } from "@/lib/offline/smart-conflict-resolver";

describe("versioned-update.api - CORE LOGIC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("safeUpdateWithVersion", () => {
    it("mengembalikan sukses dan versi baru saat RPC berhasil", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: { success: true, new_version: 4, error: null },
        error: null,
      });

      const result = await safeUpdateWithVersion("kuis", "id-1", 3, {
        judul: "Kuis Baru",
      });

      expect(mocks.rpcMock).toHaveBeenCalledWith("safe_update_with_version", {
        p_table_name: "kuis",
        p_id: "id-1",
        p_expected_version: 3,
        p_data: { judul: "Kuis Baru" },
      });
      expect(result).toEqual({
        success: true,
        newVersion: 4,
        data: { judul: "Kuis Baru" },
      });
    });

    it("mengembalikan error saat RPC gagal", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: null,
        error: { message: "rpc gagal" },
      });

      const result = await safeUpdateWithVersion("kuis", "id-1", 1, {});

      expect(result).toEqual({
        success: false,
        error: "rpc gagal",
      });
    });

    it("mengembalikan conflict detail saat version conflict dan remote tersedia", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: { success: false, new_version: 8, error: "version mismatch" },
        error: null,
      });
      mocks.singleMock.mockResolvedValue({
        data: { id: "id-1", judul: "Remote", _version: 8 },
        error: null,
      });

      const result = await safeUpdateWithVersion("kuis", "id-1", 5, {
        judul: "Local",
      });

      expect(mocks.fromMock).toHaveBeenCalledWith("kuis");
      expect(result).toEqual({
        success: false,
        error: "version mismatch",
        conflict: {
          local: { judul: "Local" },
          remote: { id: "id-1", judul: "Remote", _version: 8 },
          localVersion: 5,
          remoteVersion: 8,
        },
      });
    });

    it("mengembalikan error conflict sederhana jika fetch remote gagal", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: { success: false, new_version: 2, error: "conflict" },
        error: null,
      });
      mocks.singleMock.mockResolvedValue({
        data: null,
        error: { message: "fetch gagal" },
      });

      const result = await safeUpdateWithVersion("kuis", "id-2", 1, {
        judul: "Test",
      });

      expect(result).toEqual({
        success: false,
        error: "conflict",
      });
    });

    it("menangani exception tak terduga", async () => {
      mocks.rpcMock.mockRejectedValue(new Error("boom"));

      const result = await safeUpdateWithVersion("kuis", "id-3", 1, {
        judul: "X",
      });

      expect(result).toEqual({
        success: false,
        error: "boom",
      });
    });
  });

  describe("updateWithAutoResolve", () => {
    it("mengembalikan hasil safe update bila tidak conflict", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: { success: true, new_version: 9, error: null },
        error: null,
      });

      const result = await updateWithAutoResolve("kuis", "id-4", 8, {
        judul: "Resolved",
      });

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe(9);
      expect(smartConflictResolver.resolve).not.toHaveBeenCalled();
    });

    it("auto-resolve conflict lalu update ke database", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: { success: false, new_version: 6, error: "version mismatch" },
        error: null,
      });
      mocks.singleMock
        .mockResolvedValueOnce({
          data: { id: "id-5", judul: "Remote", updated_at: "2025-01-01T00:00:00Z" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "id-5", judul: "Merged", _version: 7 },
          error: null,
        });
      mocks.resolveMock.mockReturnValue({
        data: { judul: "Merged" },
      });

      const result = await updateWithAutoResolve(
        "kuis",
        "id-5",
        5,
        { judul: "Local" },
        "2025-01-01T01:00:00Z",
      );

      expect(smartConflictResolver.resolve).toHaveBeenCalledWith(
        expect.objectContaining({
          dataType: "kuis",
          id: "id-5",
          local: { judul: "Local" },
          remote: expect.objectContaining({ id: "id-5", judul: "Remote" }),
        }),
      );
      expect(mocks.updateMock).toHaveBeenCalledWith({ judul: "Merged" });
      expect(result).toEqual({
        success: true,
        data: { id: "id-5", judul: "Merged", _version: 7 },
        newVersion: 7,
      });
    });

    it("mengembalikan error jika update hasil resolve gagal", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: { success: false, new_version: 3, error: "conflict" },
        error: null,
      });
      mocks.singleMock
        .mockResolvedValueOnce({
          data: { id: "id-6", judul: "Remote", updated_at: "2025-01-01T00:00:00Z" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "update gagal" },
        });
      mocks.resolveMock.mockReturnValue({
        data: { judul: "Merged" },
      });

      const result = await updateWithAutoResolve("kuis", "id-6", 2, {
        judul: "Local",
      });

      expect(result).toEqual({
        success: false,
        error: "update gagal",
      });
    });
  });

  describe("updateWithConflictLog", () => {
    it("melakukan log conflict ke RPC saat konflik terjadi", async () => {
      mocks.rpcMock
        .mockResolvedValueOnce({
          data: { success: false, new_version: 4, error: "conflict" },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null });
      mocks.singleMock.mockResolvedValue({
        data: { id: "id-7", judul: "Remote" },
        error: null,
      });

      const result = await updateWithConflictLog("kuis", "id-7", 2, {
        judul: "Local",
      });

      expect(mocks.rpcMock).toHaveBeenNthCalledWith(2, "log_conflict", {
        p_entity: "kuis",
        p_record_id: "id-7",
        p_local_version: 2,
        p_remote_version: 4,
        p_local_data: { judul: "Local" },
        p_remote_data: { id: "id-7", judul: "Remote" },
      });
      expect(result.success).toBe(false);
      expect(result.conflict).toBeDefined();
    });

    it("tidak log conflict bila safe update langsung sukses", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: { success: true, new_version: 2, error: null },
        error: null,
      });

      const result = await updateWithConflictLog("kuis", "id-8", 1, {
        judul: "OK",
      });

      expect(result.success).toBe(true);
      expect(mocks.rpcMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("checkVersionConflict", () => {
    it("mengembalikan info conflict dari RPC", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: { has_conflict: true, current_version: 10, message: "beda versi" },
        error: null,
      });

      const result = await checkVersionConflict("kuis", "id-9", 8);

      expect(result).toEqual({
        hasConflict: true,
        currentVersion: 10,
        message: "beda versi",
      });
    });

    it("mengembalikan error state saat RPC check gagal", async () => {
      mocks.rpcMock.mockResolvedValue({
        data: null,
        error: { message: "rpc check gagal" },
      });

      const result = await checkVersionConflict("kuis", "id-10", 1);

      expect(result).toEqual({
        hasConflict: true,
        message: "rpc check gagal",
      });
    });
  });

  describe("helpers", () => {
    it("getVersion membaca _version, version, lalu default 1", () => {
      expect(getVersion({ _version: 5, version: 2 })).toBe(5);
      expect(getVersion({ version: 3 })).toBe(3);
      expect(getVersion({})).toBe(1);
      expect(getVersion(null)).toBe(1);
    });

    it("withVersion menambahkan _version", () => {
      expect(withVersion({ id: "1", judul: "Quiz" }, 7)).toEqual({
        id: "1",
        judul: "Quiz",
        _version: 7,
      });
    });
  });
});
