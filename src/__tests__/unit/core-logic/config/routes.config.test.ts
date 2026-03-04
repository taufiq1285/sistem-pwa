/**
 * routes.config Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  ROUTES,
  buildRoute,
  getRoleBasePath,
  getRoleDashboard,
} from "@/config/routes.config";

describe("ROUTES", () => {
  describe("public routes", () => {
    it("HOME adalah '/'", () => {
      expect(ROUTES.HOME).toBe("/");
    });

    it("LOGIN adalah '/login'", () => {
      expect(ROUTES.LOGIN).toBe("/login");
    });

    it("REGISTER adalah '/register'", () => {
      expect(ROUTES.REGISTER).toBe("/register");
    });

    it("UNAUTHORIZED adalah '/403'", () => {
      expect(ROUTES.UNAUTHORIZED).toBe("/403");
    });

    it("NOT_FOUND adalah '/404'", () => {
      expect(ROUTES.NOT_FOUND).toBe("/404");
    });
  });

  describe("admin routes", () => {
    it("ADMIN.ROOT adalah '/admin'", () => {
      expect(ROUTES.ADMIN.ROOT).toBe("/admin");
    });

    it("ADMIN.DASHBOARD adalah '/admin/dashboard'", () => {
      expect(ROUTES.ADMIN.DASHBOARD).toBe("/admin/dashboard");
    });

    it("ADMIN.USERS ada", () => {
      expect(ROUTES.ADMIN.USERS).toBeTruthy();
    });
  });

  describe("dosen routes", () => {
    it("DOSEN.ROOT adalah '/dosen'", () => {
      expect(ROUTES.DOSEN.ROOT).toBe("/dosen");
    });

    it("DOSEN.DASHBOARD ada", () => {
      expect(ROUTES.DOSEN.DASHBOARD).toBeTruthy();
    });

    it("DOSEN.KUIS memiliki LIST, CREATE, EDIT, RESULTS", () => {
      expect(ROUTES.DOSEN.KUIS).toHaveProperty("LIST");
      expect(ROUTES.DOSEN.KUIS).toHaveProperty("CREATE");
      expect(ROUTES.DOSEN.KUIS).toHaveProperty("EDIT");
      expect(ROUTES.DOSEN.KUIS).toHaveProperty("RESULTS");
    });
  });

  describe("mahasiswa routes", () => {
    it("MAHASISWA.ROOT adalah '/mahasiswa'", () => {
      expect(ROUTES.MAHASISWA.ROOT).toBe("/mahasiswa");
    });

    it("MAHASISWA.KUIS memiliki LIST, ATTEMPT, RESULT", () => {
      expect(ROUTES.MAHASISWA.KUIS).toHaveProperty("LIST");
      expect(ROUTES.MAHASISWA.KUIS).toHaveProperty("ATTEMPT");
      expect(ROUTES.MAHASISWA.KUIS).toHaveProperty("RESULT");
    });
  });

  describe("laboran routes", () => {
    it("LABORAN.ROOT adalah '/laboran'", () => {
      expect(ROUTES.LABORAN.ROOT).toBe("/laboran");
    });

    it("LABORAN.DASHBOARD ada", () => {
      expect(ROUTES.LABORAN.DASHBOARD).toBeTruthy();
    });
  });
});

describe("buildRoute", () => {
  it("mengganti parameter :id dengan nilai yang diberikan", () => {
    const result = buildRoute("/dosen/kuis/:id/edit", { id: "123" });
    expect(result).toBe("/dosen/kuis/123/edit");
  });

  it("mengganti multiple parameter", () => {
    const result = buildRoute("/kuis/:kuisId/result/:attemptId", {
      kuisId: "kuis-1",
      attemptId: "attempt-1",
    });
    expect(result).toBe("/kuis/kuis-1/result/attempt-1");
  });

  it("mengembalikan path original jika tidak ada parameter yang cocok", () => {
    const result = buildRoute("/mahasiswa/dashboard", {});
    expect(result).toBe("/mahasiswa/dashboard");
  });

  it("menangani nilai number sebagai parameter", () => {
    const result = buildRoute("/items/:id", { id: 42 });
    expect(result).toBe("/items/42");
  });
});

describe("getRoleBasePath", () => {
  it("admin → '/admin'", () => {
    expect(getRoleBasePath("admin")).toBe("/admin");
  });

  it("dosen → '/dosen'", () => {
    expect(getRoleBasePath("dosen")).toBe("/dosen");
  });

  it("mahasiswa → '/mahasiswa'", () => {
    expect(getRoleBasePath("mahasiswa")).toBe("/mahasiswa");
  });

  it("laboran → '/laboran'", () => {
    expect(getRoleBasePath("laboran")).toBe("/laboran");
  });

  it("role tidak dikenal → '/'", () => {
    expect(getRoleBasePath("unknown")).toBe("/");
  });
});

describe("getRoleDashboard", () => {
  it("admin → '/admin/dashboard'", () => {
    expect(getRoleDashboard("admin")).toBe("/admin/dashboard");
  });

  it("dosen → '/dosen/dashboard'", () => {
    expect(getRoleDashboard("dosen")).toBe("/dosen/dashboard");
  });

  it("mahasiswa → '/mahasiswa/dashboard'", () => {
    expect(getRoleDashboard("mahasiswa")).toBe("/mahasiswa/dashboard");
  });

  it("laboran → '/laboran/dashboard'", () => {
    expect(getRoleDashboard("laboran")).toBe("/laboran/dashboard");
  });

  it("role tidak dikenal → '/'", () => {
    expect(getRoleDashboard("unknown")).toBe("/");
  });
});
