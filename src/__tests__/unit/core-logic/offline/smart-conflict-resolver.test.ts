import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SmartConflictResolver,
  type SmartConflictResolution,
} from "@/lib/offline/smart-conflict-resolver";
import type { ConflictData } from "@/lib/offline/conflict-resolver";

describe("SmartConflictResolver", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("mode disabled fallback ke simple resolver", () => {
    const resolver = new SmartConflictResolver({ enabled: false });

    const conflict: ConflictData<{ value: string }> = {
      local: { value: "local" },
      remote: { value: "remote" },
      localTimestamp: "2026-02-26T12:00:00.000Z",
      remoteTimestamp: "2026-02-26T11:00:00.000Z",
      dataType: "unknown_entity",
      id: "1",
    };

    const result = resolver.resolve(conflict);

    expect(result.winner).toBe("local");
    expect(result.strategy).toBe("last-write-wins");
  });

  it("rule kuis: tidak boleh unpublish jika server sudah publish", () => {
    const resolver = new SmartConflictResolver();

    const conflict: ConflictData<any> = {
      local: { is_published: false, title: "Local" },
      remote: { is_published: true, title: "Remote" },
      localTimestamp: 10,
      remoteTimestamp: 20,
      dataType: "kuis",
      id: "kuis-1",
    };

    const result = resolver.resolve(conflict);

    expect(result.winner).toBe("remote");
    expect(result.strategy).toBe("remote-wins");
    expect(result.reason).toContain("Cannot unpublish quiz");
  });

  it("rule kuis_jawaban validator: graded vs draft butuh manual", () => {
    const resolver = new SmartConflictResolver();

    const conflict: ConflictData<any> = {
      local: { status: "draft", jawaban: "A" },
      remote: { status: "graded", jawaban: "B" },
      localTimestamp: 10,
      remoteTimestamp: 20,
      dataType: "kuis_jawaban",
      id: "ans-1",
    };

    const result = resolver.resolve(conflict) as SmartConflictResolution;

    expect(result.winner).toBe("remote");
    expect(result.requiresManual).toBe(true);
    expect(result.validationErrors?.[0]).toContain(
      "Cannot overwrite graded quiz",
    );
  });

  it("field-level merge: protected/server-auth/lww diterapkan", () => {
    const resolver = new SmartConflictResolver();

    const conflict: ConflictData<any> = {
      local: {
        waktu_mulai: "08:00",
        nilai: 50,
        extra: "LOCAL_NEWER",
      },
      remote: {
        waktu_mulai: "09:00",
        nilai: 95,
        extra: "REMOTE_OLDER",
      },
      localTimestamp: 200,
      remoteTimestamp: 100,
      dataType: "kuis_jawaban",
      id: "ans-2",
    };

    const result = resolver.resolve(conflict) as SmartConflictResolution<any>;

    expect(result.winner).toBe("merged");
    expect(result.data.waktu_mulai).toBe("08:00"); // protected -> local
    expect(result.data.nilai).toBe(95); // server authoritative -> remote
    expect(result.data.extra).toBe("LOCAL_NEWER"); // lww -> local newer
    expect(result.fieldConflicts?.length).toBeGreaterThan(0);
  });

  it("version check: local tertinggal dari remote", () => {
    const resolver = new SmartConflictResolver();

    const conflict: ConflictData<any> = {
      local: { _version: 1, value: "local" },
      remote: { _version: 2, value: "remote" },
      localTimestamp: 100,
      remoteTimestamp: 200,
      dataType: "nilai",
      id: "n-1",
    };

    const result = resolver.resolve(conflict) as SmartConflictResolution;

    expect(result.winner).toBe("remote");
    expect(result.requiresManual).toBe(true);
    expect(result.reason).toContain("local is outdated");
  });

  it("version check: local lebih maju dari remote", () => {
    const resolver = new SmartConflictResolver();

    const conflict: ConflictData<any> = {
      local: { _version: 5, value: "local" },
      remote: { _version: 3, value: "remote" },
      localTimestamp: 100,
      remoteTimestamp: 200,
      dataType: "nilai",
      id: "n-2",
    };

    const result = resolver.resolve(conflict) as SmartConflictResolution;

    expect(result.winner).toBe("local");
    expect(result.requiresManual).toBe(true);
    expect(result.reason).toContain("local ahead of remote");
  });

  it("field conflict logs tersimpan, bisa difilter, dibersihkan, dan stats valid", () => {
    const resolver = new SmartConflictResolver();

    const conflict: ConflictData<any> = {
      local: { waktu_mulai: "08:00", nilai: 70 },
      remote: { waktu_mulai: "09:00", nilai: 80 },
      localTimestamp: 100,
      remoteTimestamp: 200,
      dataType: "kuis_jawaban",
      id: "ans-3",
    };

    resolver.resolve(conflict);

    const allLogs = resolver.getFieldConflictLogs();
    const byEntity = resolver.getFieldConflictLogs("kuis_jawaban");
    const stats = resolver.getStats();

    expect(allLogs.length).toBeGreaterThan(0);
    expect(byEntity.length).toBe(allLogs.length);
    expect(stats.totalRules).toBeGreaterThan(0);
    expect(stats.totalFieldConflicts).toBeGreaterThan(0);
    expect(stats.conflictsByEntity.kuis_jawaban).toBeGreaterThan(0);

    resolver.clearFieldConflictLogs();
    expect(resolver.getFieldConflictLogs()).toHaveLength(0);
  });
});
