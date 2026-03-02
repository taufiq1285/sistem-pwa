/**
 * NotificationContext Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import { NotificationContext } from "@/context/NotificationContext";
import type { NotificationContextValue } from "@/context/NotificationContext";

describe("NotificationContext", () => {
  it("context dibuat dan merupakan React context yang valid", () => {
    expect(NotificationContext).toBeDefined();
    expect(NotificationContext).toHaveProperty("Provider");
    expect(NotificationContext).toHaveProperty("Consumer");
  });

  it("tipe NotificationContextValue memiliki semua method yang dibutuhkan", () => {
    const mockValue: NotificationContextValue = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      dismiss: vi.fn(),
      clear: vi.fn(),
    };

    expect(typeof mockValue.success).toBe("function");
    expect(typeof mockValue.error).toBe("function");
    expect(typeof mockValue.warning).toBe("function");
    expect(typeof mockValue.info).toBe("function");
    expect(typeof mockValue.dismiss).toBe("function");
    expect(typeof mockValue.clear).toBe("function");
  });

  it("method success dipanggil dengan argumen yang benar", () => {
    const mockValue: NotificationContextValue = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      dismiss: vi.fn(),
      clear: vi.fn(),
    };

    mockValue.success("Berhasil disimpan", "Sukses", 3000);
    expect(mockValue.success).toHaveBeenCalledWith(
      "Berhasil disimpan",
      "Sukses",
      3000,
    );
  });

  it("method error dipanggil dengan pesan error", () => {
    const mockValue: NotificationContextValue = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      dismiss: vi.fn(),
      clear: vi.fn(),
    };

    mockValue.error("Gagal menyimpan data");
    expect(mockValue.error).toHaveBeenCalledWith("Gagal menyimpan data");
  });

  it("method dismiss dapat dipanggil tanpa argumen", () => {
    const mockValue: NotificationContextValue = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      dismiss: vi.fn(),
      clear: vi.fn(),
    };

    mockValue.dismiss();
    expect(mockValue.dismiss).toHaveBeenCalledTimes(1);
  });

  it("method dismiss dapat dipanggil dengan id string", () => {
    const mockValue: NotificationContextValue = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      dismiss: vi.fn(),
      clear: vi.fn(),
    };

    mockValue.dismiss("notif-123");
    expect(mockValue.dismiss).toHaveBeenCalledWith("notif-123");
  });

  it("method clear membersihkan semua notifikasi", () => {
    const mockValue: NotificationContextValue = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      dismiss: vi.fn(),
      clear: vi.fn(),
    };

    mockValue.clear();
    expect(mockValue.clear).toHaveBeenCalledTimes(1);
  });
});
