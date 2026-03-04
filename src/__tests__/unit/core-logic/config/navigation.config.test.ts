/**
 * navigation.config Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  getNavigationItems,
  isRouteActive,
  getCurrentNavigationItem,
  getBreadcrumbs,
} from "@/config/navigation.config";
import type { UserRole } from "@/types/auth.types";

const roles: UserRole[] = ["mahasiswa", "dosen", "admin", "laboran"];

describe("getNavigationItems", () => {
  roles.forEach((role) => {
    it(`mengembalikan array navigation untuk role '${role}'`, () => {
      const items = getNavigationItems(role);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  it("setiap item memiliki label, href, dan icon", () => {
    roles.forEach((role) => {
      const items = getNavigationItems(role);
      items.forEach((item) => {
        expect(item).toHaveProperty("label");
        expect(item).toHaveProperty("href");
        expect(item).toHaveProperty("icon");
        expect(typeof item.label).toBe("string");
        expect(typeof item.href).toBe("string");
        expect(item.href.startsWith("/")).toBe(true);
      });
    });
  });

  it("mahasiswa memiliki menu Dashboard", () => {
    const items = getNavigationItems("mahasiswa");
    expect(items.some((i) => i.label === "Dashboard")).toBe(true);
  });

  it("dosen memiliki menu Bank Soal", () => {
    const items = getNavigationItems("dosen");
    expect(items.some((i) => i.label === "Bank Soal")).toBe(true);
  });

  it("admin memiliki menu User Management", () => {
    const items = getNavigationItems("admin");
    expect(items.some((i) => i.label === "User Management")).toBe(true);
  });

  it("laboran memiliki menu Inventaris", () => {
    const items = getNavigationItems("laboran");
    expect(items.some((i) => i.label === "Inventaris")).toBe(true);
  });
});

describe("isRouteActive", () => {
  it("mengembalikan true untuk exact match", () => {
    expect(isRouteActive("/mahasiswa/dashboard", "/mahasiswa/dashboard")).toBe(
      true,
    );
  });

  it("mengembalikan true untuk nested route", () => {
    expect(isRouteActive("/mahasiswa/kuis/123", "/mahasiswa/kuis")).toBe(true);
  });

  it("mengembalikan false untuk path berbeda", () => {
    expect(isRouteActive("/mahasiswa/dashboard", "/mahasiswa/kuis")).toBe(
      false,
    );
  });

  it("tidak false-positive pada prefix yang mirip", () => {
    expect(isRouteActive("/mahasiswa/materi", "/mahasiswa/mat")).toBe(false);
  });

  it("mengembalikan false saat '/' dibanding path lain (bukan nested)", () => {
    expect(isRouteActive("/mahasiswa/dashboard", "/")).toBe(false);
  });
});

describe("getCurrentNavigationItem", () => {
  it("mengembalikan item yang sesuai dengan path", () => {
    const item = getCurrentNavigationItem("mahasiswa", "/mahasiswa/dashboard");
    expect(item).toBeDefined();
    expect(item?.label).toBe("Dashboard");
  });

  it("mengembalikan undefined untuk path yang tidak ada di navigasi", () => {
    const item = getCurrentNavigationItem("mahasiswa", "/unknown/path");
    expect(item).toBeUndefined();
  });

  it("menangani nested path dengan benar", () => {
    const item = getCurrentNavigationItem("mahasiswa", "/mahasiswa/kuis/123");
    expect(item).toBeDefined();
  });
});

describe("getBreadcrumbs", () => {
  it("mengembalikan array breadcrumb", () => {
    const breadcrumbs = getBreadcrumbs("mahasiswa", "/mahasiswa/dashboard");
    expect(Array.isArray(breadcrumbs)).toBe(true);
  });

  it("setiap breadcrumb memiliki label dan href", () => {
    const breadcrumbs = getBreadcrumbs("dosen", "/dosen/dashboard");
    breadcrumbs.forEach((bc) => {
      expect(bc).toHaveProperty("label");
      expect(bc).toHaveProperty("href");
    });
  });

  it("mengembalikan array kosong untuk path yang tidak dikenali", () => {
    const breadcrumbs = getBreadcrumbs("mahasiswa", "/unknown/path");
    expect(breadcrumbs).toEqual([]);
  });
});
