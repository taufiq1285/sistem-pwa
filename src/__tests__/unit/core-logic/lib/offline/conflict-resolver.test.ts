import { describe, it, expect, beforeEach } from "vitest";
import {
  ConflictResolver,
  type ConflictData,
  resolveConflict,
  wouldConflict,
} from "@/lib/offline/conflict-resolver";

describe("ConflictResolver", () => {
  let resolver: ConflictResolver;

  beforeEach(() => {
    resolver = new ConflictResolver();
    resolver.clearLogs();
  });

  describe("Last-Write-Wins Strategy", () => {
    it("should choose local when local is newer", () => {
      const conflict: ConflictData<{ value: string }> = {
        local: { value: "local data" },
        remote: { value: "remote data" },
        localTimestamp: "2024-01-02T00:00:00Z",
        remoteTimestamp: "2024-01-01T00:00:00Z",
        dataType: "quiz_answer",
        id: "answer_1",
      };

      const result = resolver.resolve(conflict);

      expect(result.winner).toBe("local");
      expect(result.data).toEqual({ value: "local data" });
      expect(result.hadConflict).toBe(true);
      expect(result.strategy).toBe("last-write-wins");
    });

    it("should choose remote when remote is newer", () => {
      const conflict: ConflictData<{ value: string }> = {
        local: { value: "local data" },
        remote: { value: "remote data" },
        localTimestamp: "2024-01-01T00:00:00Z",
        remoteTimestamp: "2024-01-02T00:00:00Z",
        dataType: "quiz_answer",
        id: "answer_1",
      };

      const result = resolver.resolve(conflict);

      expect(result.winner).toBe("remote");
      expect(result.data).toEqual({ value: "remote data" });
      expect(result.hadConflict).toBe(true);
    });

    it("should prefer remote when timestamps are equal", () => {
      const conflict: ConflictData<{ value: string }> = {
        local: { value: "local data" },
        remote: { value: "remote data" },
        localTimestamp: "2024-01-01T00:00:00Z",
        remoteTimestamp: "2024-01-01T00:00:00Z",
        dataType: "quiz_answer",
        id: "answer_1",
      };

      const result = resolver.resolve(conflict);

      expect(result.winner).toBe("remote");
      expect(result.data).toEqual({ value: "remote data" });
    });

    it("should detect no conflict when data is identical", () => {
      const conflict: ConflictData<{ value: string }> = {
        local: { value: "same data" },
        remote: { value: "same data" },
        localTimestamp: "2024-01-01T00:00:00Z",
        remoteTimestamp: "2024-01-02T00:00:00Z",
        dataType: "quiz_answer",
        id: "answer_1",
      };

      const result = resolver.resolve(conflict);

      expect(result.hadConflict).toBe(false);
      expect(result.data).toEqual({ value: "same data" });
    });
  });

  describe("Timestamp Parsing", () => {
    it("should handle ISO string timestamps", () => {
      const conflict: ConflictData<string> = {
        local: "local",
        remote: "remote",
        localTimestamp: "2024-01-02T00:00:00Z",
        remoteTimestamp: "2024-01-01T00:00:00Z",
        dataType: "test",
        id: "1",
      };

      const result = resolver.resolve(conflict);
      expect(result.winner).toBe("local");
    });

    it("should handle unix timestamps (milliseconds)", () => {
      const conflict: ConflictData<string> = {
        local: "local",
        remote: "remote",
        localTimestamp: 1704240000000, // 2024-01-03
        remoteTimestamp: 1704153600000, // 2024-01-02
        dataType: "test",
        id: "1",
      };

      const result = resolver.resolve(conflict);
      expect(result.winner).toBe("local");
    });

    it("should handle mixed timestamp formats", () => {
      const conflict: ConflictData<string> = {
        local: "local",
        remote: "remote",
        localTimestamp: 1704240000000,
        remoteTimestamp: "2024-01-01T00:00:00Z",
        dataType: "test",
        id: "1",
      };

      const result = resolver.resolve(conflict);
      expect(result.winner).toBe("local");
    });
  });

  describe("Alternative Strategies", () => {
    it("should always choose local with local-wins", () => {
      const conflict: ConflictData<string> = {
        local: "local",
        remote: "remote",
        localTimestamp: "2024-01-01T00:00:00Z",
        remoteTimestamp: "2024-01-02T00:00:00Z", // Remote is newer
        dataType: "test",
        id: "1",
      };

      const result = resolver.resolveLocalWins(conflict);

      expect(result.winner).toBe("local");
      expect(result.data).toBe("local");
      expect(result.strategy).toBe("local-wins");
    });

    it("should always choose remote with remote-wins", () => {
      const conflict: ConflictData<string> = {
        local: "local",
        remote: "remote",
        localTimestamp: "2024-01-02T00:00:00Z", // Local is newer
        remoteTimestamp: "2024-01-01T00:00:00Z",
        dataType: "test",
        id: "1",
      };

      const result = resolver.resolveRemoteWins(conflict);

      expect(result.winner).toBe("remote");
      expect(result.data).toBe("remote");
      expect(result.strategy).toBe("remote-wins");
    });
  });

  describe("Conflict Logging", () => {
    it("should log conflicts", () => {
      const conflict: ConflictData<string> = {
        local: "local",
        remote: "remote",
        localTimestamp: "2024-01-02T00:00:00Z",
        remoteTimestamp: "2024-01-01T00:00:00Z",
        dataType: "quiz_answer",
        id: "answer_1",
      };

      resolver.resolve(conflict);

      const logs = resolver.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].dataType).toBe("quiz_answer");
      expect(logs[0].winner).toBe("local");
    });

    it("should not log when no conflict", () => {
      const conflict: ConflictData<string> = {
        local: "same",
        remote: "same",
        localTimestamp: "2024-01-01T00:00:00Z",
        remoteTimestamp: "2024-01-02T00:00:00Z",
        dataType: "test",
        id: "1",
      };

      resolver.resolve(conflict);

      const logs = resolver.getLogs();
      expect(logs).toHaveLength(0);
    });

    it("should filter logs by type", () => {
      resolver.resolve({
        local: "a",
        remote: "b",
        localTimestamp: 100,
        remoteTimestamp: 50,
        dataType: "quiz_answer",
        id: "1",
      });

      resolver.resolve({
        local: "c",
        remote: "d",
        localTimestamp: 100,
        remoteTimestamp: 50,
        dataType: "attempt",
        id: "2",
      });

      const quizLogs = resolver.getLogsByType("quiz_answer");
      expect(quizLogs).toHaveLength(1);
      expect(quizLogs[0].dataType).toBe("quiz_answer");
    });

    it("should filter logs by ID", () => {
      resolver.resolve({
        local: "a",
        remote: "b",
        localTimestamp: 100,
        remoteTimestamp: 50,
        dataType: "test",
        id: "item_1",
      });

      resolver.resolve({
        local: "c",
        remote: "d",
        localTimestamp: 100,
        remoteTimestamp: 50,
        dataType: "test",
        id: "item_2",
      });

      const logs = resolver.getLogsById("item_1");
      expect(logs).toHaveLength(1);
      expect(logs[0].dataId).toBe("item_1");
    });

    it("should clear logs", () => {
      resolver.resolve({
        local: "a",
        remote: "b",
        localTimestamp: 100,
        remoteTimestamp: 50,
        dataType: "test",
        id: "1",
      });

      expect(resolver.getLogs()).toHaveLength(1);

      resolver.clearLogs();
      expect(resolver.getLogs()).toHaveLength(0);
    });
  });

  describe("Statistics", () => {
    it("should generate statistics", () => {
      resolver.resolve({
        local: "a",
        remote: "b",
        localTimestamp: 100,
        remoteTimestamp: 50,
        dataType: "quiz_answer",
        id: "1",
      });

      resolver.resolve({
        local: "c",
        remote: "d",
        localTimestamp: 50,
        remoteTimestamp: 100,
        dataType: "quiz_answer",
        id: "2",
      });

      resolver.resolve({
        local: "e",
        remote: "f",
        localTimestamp: 100,
        remoteTimestamp: 50,
        dataType: "attempt",
        id: "3",
      });

      const stats = resolver.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byType["quiz_answer"]).toBe(2);
      expect(stats.byType["attempt"]).toBe(1);
      expect(stats.byWinner["local"]).toBe(2);
      expect(stats.byWinner["remote"]).toBe(1);
      expect(stats.byStrategy["last-write-wins"]).toBe(3);
    });
  });

  describe("Helper Functions", () => {
    it("resolveConflict should use default resolver", () => {
      const conflict: ConflictData<string> = {
        local: "local",
        remote: "remote",
        localTimestamp: 100,
        remoteTimestamp: 50,
        dataType: "test",
        id: "1",
      };

      const result = resolveConflict(conflict);
      expect(result.winner).toBe("local");
    });

    it("wouldConflict should detect conflicts", () => {
      expect(wouldConflict("a", "b", 100, 50)).toBe(true);
      expect(wouldConflict("a", "a", 100, 50)).toBe(false);
      expect(wouldConflict("a", "b", 100, 100)).toBe(false);
    });
  });
});
