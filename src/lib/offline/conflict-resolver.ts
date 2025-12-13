/**
 * Simple Conflict Resolver
 * Purpose: Resolve conflicts between local and remote data
 * Strategy: Last-Write-Wins (LWW)
 */

export type ConflictStrategy =
  | "last-write-wins"
  | "local-wins"
  | "remote-wins"
  | "manual";

export interface ConflictData<T = any> {
  local: T;
  remote: T;
  localTimestamp: string | number;
  remoteTimestamp: string | number;
  dataType: string;
  id: string;
}

export interface ConflictResolution<T = any> {
  data: T;
  winner: "local" | "remote" | "merged";
  strategy: ConflictStrategy;
  resolvedAt: string;
  hadConflict: boolean;
  reason: string;
}

export interface ConflictLog {
  id: string;
  dataType: string;
  dataId: string;
  winner: "local" | "remote" | "merged";
  strategy: ConflictStrategy;
  localTimestamp: string | number;
  remoteTimestamp: string | number;
  resolvedAt: string;
  reason: string;
  rejectedData?: any;
}

export class ConflictResolver {
  private conflictLogs: ConflictLog[] = [];
  private maxLogs: number;

  constructor(maxLogs: number = 100) {
    this.maxLogs = maxLogs;
    this.loadLogs();
  }

  resolve<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { local, remote, localTimestamp, remoteTimestamp, dataType, id } =
      conflict;

    const localTime = this.parseTimestamp(localTimestamp);
    const remoteTime = this.parseTimestamp(remoteTimestamp);

    let winner: "local" | "remote" | "merged";
    let data: T;
    let reason: string;
    let hadConflict: boolean;

    if (this.isEqual(local, remote)) {
      winner = "local";
      data = local;
      reason = "Data is identical, no conflict";
      hadConflict = false;
    } else if (localTime > remoteTime) {
      winner = "local";
      data = local;
      reason = `Local is newer (${new Date(localTime).toISOString()} > ${new Date(remoteTime).toISOString()})`;
      hadConflict = true;
    } else if (remoteTime > localTime) {
      winner = "remote";
      data = remote;
      reason = `Remote is newer (${new Date(remoteTime).toISOString()} > ${new Date(localTime).toISOString()})`;
      hadConflict = true;
    } else {
      winner = "remote";
      data = remote;
      reason = "Timestamps equal, preferring remote (server)";
      hadConflict = true;
    }

    if (hadConflict) {
      this.logConflict({
        dataType,
        dataId: id,
        winner,
        strategy: "last-write-wins",
        localTimestamp,
        remoteTimestamp,
        reason,
        rejectedData: winner === "local" ? remote : local,
      });
    }

    return {
      data,
      winner,
      strategy: "last-write-wins",
      resolvedAt: new Date().toISOString(),
      hadConflict,
      reason,
    };
  }

  resolveLocalWins<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { local, remote, dataType, id } = conflict;
    const hadConflict = !this.isEqual(local, remote);

    if (hadConflict) {
      this.logConflict({
        dataType,
        dataId: id,
        winner: "local",
        strategy: "local-wins",
        localTimestamp: conflict.localTimestamp,
        remoteTimestamp: conflict.remoteTimestamp,
        reason: "Local-wins strategy",
        rejectedData: remote,
      });
    }

    return {
      data: local,
      winner: "local",
      strategy: "local-wins",
      resolvedAt: new Date().toISOString(),
      hadConflict,
      reason: "Local-wins strategy",
    };
  }

  resolveRemoteWins<T>(conflict: ConflictData<T>): ConflictResolution<T> {
    const { local, remote, dataType, id } = conflict;
    const hadConflict = !this.isEqual(local, remote);

    if (hadConflict) {
      this.logConflict({
        dataType,
        dataId: id,
        winner: "remote",
        strategy: "remote-wins",
        localTimestamp: conflict.localTimestamp,
        remoteTimestamp: conflict.remoteTimestamp,
        reason: "Remote-wins strategy",
        rejectedData: local,
      });
    }

    return {
      data: remote,
      winner: "remote",
      strategy: "remote-wins",
      resolvedAt: new Date().toISOString(),
      hadConflict,
      reason: "Remote-wins strategy",
    };
  }

  getLogs(): ConflictLog[] {
    return [...this.conflictLogs];
  }

  getLogsByType(dataType: string): ConflictLog[] {
    return this.conflictLogs.filter((log) => log.dataType === dataType);
  }

  getLogsById(dataId: string): ConflictLog[] {
    return this.conflictLogs.filter((log) => log.dataId === dataId);
  }

  clearLogs(): void {
    this.conflictLogs = [];
    this.saveLogs();
  }

  getStats() {
    const stats = {
      total: this.conflictLogs.length,
      byType: {} as Record<string, number>,
      byWinner: {} as Record<string, number>,
      byStrategy: {} as Record<string, number>,
    };

    this.conflictLogs.forEach((log) => {
      stats.byType[log.dataType] = (stats.byType[log.dataType] || 0) + 1;
      stats.byWinner[log.winner] = (stats.byWinner[log.winner] || 0) + 1;
      stats.byStrategy[log.strategy] =
        (stats.byStrategy[log.strategy] || 0) + 1;
    });

    return stats;
  }

  private parseTimestamp(timestamp: string | number): number {
    if (typeof timestamp === "number") {
      return timestamp;
    }

    const parsed = Date.parse(timestamp);
    if (isNaN(parsed)) {
      console.warn(`Invalid timestamp: ${timestamp}`);
      return Date.now();
    }
    return parsed;
  }

  private isEqual(a: any, b: any): boolean {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  private logConflict(logData: Omit<ConflictLog, "id" | "resolvedAt">): void {
    const log: ConflictLog = {
      ...logData,
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resolvedAt: new Date().toISOString(),
    };

    this.conflictLogs.unshift(log);

    if (this.conflictLogs.length > this.maxLogs) {
      this.conflictLogs = this.conflictLogs.slice(0, this.maxLogs);
    }

    this.saveLogs();

    console.log("[ConflictResolver]", {
      dataType: log.dataType,
      dataId: log.dataId,
      winner: log.winner,
      reason: log.reason,
    });
  }

  private saveLogs(): void {
    try {
      localStorage.setItem("conflict_logs", JSON.stringify(this.conflictLogs));
    } catch (error) {
      console.warn("Failed to save conflict logs:", error);
    }
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem("conflict_logs");
      if (stored) {
        this.conflictLogs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load conflict logs:", error);
      this.conflictLogs = [];
    }
  }
}

export const conflictResolver = new ConflictResolver();

export function resolveConflict<T>(
  conflict: ConflictData<T>,
): ConflictResolution<T> {
  return conflictResolver.resolve(conflict);
}

export function wouldConflict<T>(
  local: T,
  remote: T,
  localTimestamp: string | number,
  remoteTimestamp: string | number,
): boolean {
  const isDifferent = JSON.stringify(local) !== JSON.stringify(remote);

  const localTime =
    typeof localTimestamp === "number"
      ? localTimestamp
      : Date.parse(localTimestamp);
  const remoteTime =
    typeof remoteTimestamp === "number"
      ? remoteTimestamp
      : Date.parse(remoteTimestamp);

  return isDifferent && localTime !== remoteTime;
}
