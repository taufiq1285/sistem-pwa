/**
 * Smart Conflict Resolver
 *
 * FASE 3 IMPLEMENTATION - MEDIUM-HIGH RISK
 * Business logic-aware conflict resolution
 * - Field-level conflict detection
 * - Entity-specific resolution rules
 * - Optimistic locking support
 * - Manual resolution workflow
 *
 * BACKWARD COMPATIBLE:
 * - Falls back to simple LWW if no rules defined
 * - Can be disabled via feature flag
 * - Existing conflict resolver still works
 */

import { ConflictResolver } from "./conflict-resolver";
import type {
  ConflictData,
  ConflictResolution,
  ConflictStrategy,
  ConflictLog,
} from "./conflict-resolver";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Field-level conflict information
 */
export interface FieldConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  localTimestamp?: number;
  remoteTimestamp?: number;
  winner?: "local" | "remote";
  reason?: string;
}

/**
 * Business rule for conflict resolution
 */
export interface ConflictRule {
  /**
   * Entity type this rule applies to
   */
  entity: string;

  /**
   * Fields that should never be overwritten by remote
   * (always keep local)
   */
  protectedFields?: string[];

  /**
   * Fields that should always use remote value
   * (server is authoritative)
   */
  serverAuthoritativeFields?: string[];

  /**
   * Fields that require manual resolution
   */
  manualFields?: string[];

  /**
   * Custom resolution function
   */
  customResolver?: (conflict: ConflictData) => ConflictResolution | null;

  /**
   * Validation function - return error if conflict is invalid
   */
  validator?: (local: any, remote: any) => string | null;
}

/**
 * Smart conflict resolution result
 */
export interface SmartConflictResolution<
  T = any,
> extends ConflictResolution<T> {
  /**
   * Field-level conflicts detected
   */
  fieldConflicts?: FieldConflict[];

  /**
   * Whether manual resolution is required
   */
  requiresManual?: boolean;

  /**
   * Validation errors
   */
  validationErrors?: string[];

  /**
   * Applied business rules
   */
  appliedRules?: string[];
}

/**
 * Configuration for smart conflict resolver
 */
export interface SmartConflictConfig {
  /**
   * Enable smart conflict resolution
   * Default: true
   */
  enabled?: boolean;

  /**
   * Enable field-level detection
   * Default: true
   */
  enableFieldLevel?: boolean;

  /**
   * Enable version checking
   * Default: true
   */
  enableVersionCheck?: boolean;

  /**
   * Fallback to simple LWW if no rules match
   * Default: true
   */
  fallbackToLWW?: boolean;

  /**
   * Store field conflicts for review
   * Default: true
   */
  storeFieldConflicts?: boolean;
}

// ============================================================================
// SMART CONFLICT RESOLVER CLASS
// ============================================================================

export class SmartConflictResolver {
  private simpleResolver: ConflictResolver;
  private rules: Map<string, ConflictRule> = new Map();
  private config: Required<SmartConflictConfig>;
  private fieldConflictLogs: Array<{
    id: string;
    timestamp: number;
    entity: string;
    dataId: string;
    conflicts: FieldConflict[];
  }> = [];

  constructor(config: SmartConflictConfig = {}) {
    this.simpleResolver = new ConflictResolver();
    this.config = {
      enabled: config.enabled ?? true,
      enableFieldLevel: config.enableFieldLevel ?? true,
      enableVersionCheck: config.enableVersionCheck ?? true,
      fallbackToLWW: config.fallbackToLWW ?? true,
      storeFieldConflicts: config.storeFieldConflicts ?? true,
    };

    // Register default rules
    this.registerDefaultRules();
  }

  /**
   * Register a conflict resolution rule
   */
  registerRule(rule: ConflictRule): void {
    this.rules.set(rule.entity, rule);
    console.log(`📋 Registered conflict rule for: ${rule.entity}`);
  }

  /**
   * Register default business rules
   */
  private registerDefaultRules(): void {
    // Rule: Kuis (Quiz)
    this.registerRule({
      entity: "kuis",
      protectedFields: [], // None - server can update all
      serverAuthoritativeFields: [
        "is_published", // Only server can publish
        "passing_grade", // Only server can set passing grade
      ],
      customResolver: (conflict) => {
        const local = conflict.local as any;
        const remote = conflict.remote as any;

        // CRITICAL RULE: If quiz is published on server, never unpublish locally
        if (remote.is_published && !local.is_published) {
          return {
            data: remote,
            winner: "remote",
            strategy: "remote-wins",
            resolvedAt: new Date().toISOString(),
            hadConflict: true,
            reason:
              "Cannot unpublish quiz - server authoritative for published status",
            requiresManual: false,
          } as SmartConflictResolution;
        }

        return null; // Continue with normal resolution
      },
    });

    // Rule: Kuis Jawaban (Quiz Answers)
    this.registerRule({
      entity: "kuis_jawaban",
      protectedFields: [
        "waktu_mulai", // Student's start time should not be overwritten
        "waktu_selesai", // Student's end time should not be overwritten
        "jawaban", // Student's answers should not be overwritten
      ],
      serverAuthoritativeFields: [
        "nilai", // Score calculated by server
        "status", // Grading status from server
        "feedback", // Teacher's feedback
      ],
      manualFields: [], // None require manual resolution
      validator: (local, remote) => {
        // If remote is graded but local is draft, this is a problem
        if (remote.status === "graded" && local.status === "draft") {
          return "Cannot overwrite graded quiz with draft. Teacher has already graded this submission.";
        }
        return null;
      },
    });

    // Rule: Nilai (Grades)
    this.registerRule({
      entity: "nilai",
      protectedFields: [], // None - server is authoritative
      serverAuthoritativeFields: [
        "nilai", // Grade from teacher
        "keterangan", // Comments from teacher
        "updated_at", // When teacher updated
      ],
      manualFields: ["nilai"], // Grade conflicts require manual review
      customResolver: (conflict) => {
        const local = conflict.local as any;
        const remote = conflict.remote as any;

        // CRITICAL: Never overwrite teacher's grade with local changes
        if (remote.nilai !== undefined && local.nilai !== remote.nilai) {
          console.warn(
            "⚠️  Grade conflict detected - using server value (teacher authoritative)",
          );
          return {
            data: remote,
            winner: "remote",
            strategy: "remote-wins",
            resolvedAt: new Date().toISOString(),
            hadConflict: true,
            reason:
              "Teacher grade is authoritative - cannot be overwritten locally",
            requiresManual: false,
          } as SmartConflictResolution;
        }

        return null;
      },
    });

    // Rule: Kehadiran (Attendance)
    this.registerRule({
      entity: "kehadiran",
      protectedFields: [
        "waktu_check_in", // Student's actual check-in time
        "lokasi", // Student's check-in location
      ],
      serverAuthoritativeFields: [
        "status", // Approval status from teacher/admin
        "keterangan", // Notes from teacher
      ],
      validator: (local, remote) => {
        // If server marked as present but local is absent, prefer server
        if (remote.status === "hadir" && local.status === "tidak_hadir") {
          return null; // Allow - teacher override is valid
        }
        return null;
      },
    });

    // Rule: Materi (Learning Materials)
    this.registerRule({
      entity: "materi",
      protectedFields: [], // Teacher can update all
      serverAuthoritativeFields: [
        "is_published", // Only teacher can publish
        "file_url", // Server manages files
      ],
      customResolver: (conflict) => {
        const remote = conflict.remote as any;

        // If material is published on server, always use server version
        if (remote.is_published) {
          return {
            data: remote,
            winner: "remote",
            strategy: "remote-wins",
            resolvedAt: new Date().toISOString(),
            hadConflict: true,
            reason: "Published materials use server version",
            requiresManual: false,
          } as SmartConflictResolution;
        }

        return null;
      },
    });
  }

  /**
   * Resolve conflict with smart business logic
   */
  resolve<T>(conflict: ConflictData<T>): SmartConflictResolution<T> {
    // If disabled, use simple resolver
    if (!this.config.enabled) {
      return this.simpleResolver.resolve(
        conflict,
      ) as SmartConflictResolution<T>;
    }

    const { dataType, local, remote, id } = conflict;

    console.log(`🔍 Smart conflict resolution for ${dataType}:${id}`);

    // Check version if enabled
    if (this.config.enableVersionCheck) {
      const versionConflict = this.checkVersionConflict(local, remote);
      if (versionConflict) {
        return versionConflict as SmartConflictResolution<T>;
      }
    }

    // Get business rule for this entity
    const rule = this.rules.get(dataType);

    if (!rule) {
      console.log(`⚪ No rule for ${dataType}, using fallback`);
      if (this.config.fallbackToLWW) {
        return this.simpleResolver.resolve(
          conflict,
        ) as SmartConflictResolution<T>;
      }
    }

    // Run custom resolver if defined
    if (rule?.customResolver) {
      const customResult = rule.customResolver(conflict);
      if (customResult) {
        console.log(`✅ Custom resolver applied for ${dataType}`);
        return customResult as SmartConflictResolution<T>;
      }
    }

    // Run validator if defined
    if (rule?.validator) {
      const validationError = rule.validator(local, remote);
      if (validationError) {
        console.error(`❌ Validation failed: ${validationError}`);
        return {
          data: remote, // Use remote on validation error (safe default)
          winner: "remote",
          strategy: "remote-wins",
          resolvedAt: new Date().toISOString(),
          hadConflict: true,
          reason: `Validation failed: ${validationError}`,
          requiresManual: true,
          validationErrors: [validationError],
        } as SmartConflictResolution<T>;
      }
    }

    // Field-level resolution
    if (this.config.enableFieldLevel && rule) {
      return this.resolveFieldLevel(conflict, rule);
    }

    // Fallback to simple LWW
    console.log(`⚪ Using fallback LWW for ${dataType}`);
    return this.simpleResolver.resolve(conflict) as SmartConflictResolution<T>;
  }

  /**
   * Resolve conflicts at field level
   */
  private resolveFieldLevel<T>(
    conflict: ConflictData<T>,
    rule: ConflictRule,
  ): SmartConflictResolution<T> {
    const { local, remote, dataType, id, localTimestamp, remoteTimestamp } =
      conflict;

    const fieldConflicts: FieldConflict[] = [];
    const merged: any = { ...local }; // Start with local
    const appliedRules: string[] = [];

    // Get all fields from both objects
    const allFields = new Set([
      ...Object.keys(local as any),
      ...Object.keys(remote as any),
    ]);

    for (const field of allFields) {
      const localValue = (local as any)[field];
      const remoteValue = (remote as any)[field];

      // Skip if values are identical
      if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
        continue;
      }

      // Record conflict
      const fieldConflict: FieldConflict = {
        field,
        localValue,
        remoteValue,
      };

      // Apply resolution rules
      if (rule.protectedFields?.includes(field)) {
        // Protected: Always use local
        merged[field] = localValue;
        fieldConflict.winner = "local";
        fieldConflict.reason = "Protected field - local value preserved";
        appliedRules.push(`protected:${field}`);
      } else if (rule.serverAuthoritativeFields?.includes(field)) {
        // Server authoritative: Always use remote
        merged[field] = remoteValue;
        fieldConflict.winner = "remote";
        fieldConflict.reason = "Server authoritative field";
        appliedRules.push(`server-auth:${field}`);
      } else if (rule.manualFields?.includes(field)) {
        // Manual resolution required
        merged[field] = remoteValue; // Use remote for safety
        fieldConflict.winner = "remote";
        fieldConflict.reason =
          "Requires manual resolution (using remote temporarily)";
        appliedRules.push(`manual:${field}`);
      } else {
        // Default: Last-Write-Wins
        const localTime =
          typeof localTimestamp === "number"
            ? localTimestamp
            : new Date(localTimestamp).getTime();
        const remoteTime =
          typeof remoteTimestamp === "number"
            ? remoteTimestamp
            : new Date(remoteTimestamp).getTime();

        if (localTime > remoteTime) {
          merged[field] = localValue;
          fieldConflict.winner = "local";
          fieldConflict.reason = "Local is newer (LWW)";
        } else {
          merged[field] = remoteValue;
          fieldConflict.winner = "remote";
          fieldConflict.reason = "Remote is newer (LWW)";
        }
        appliedRules.push(`lww:${field}`);
      }

      fieldConflicts.push(fieldConflict);
    }

    // Determine if manual resolution required
    const requiresManual = fieldConflicts.some((fc) =>
      rule.manualFields?.includes(fc.field),
    );

    // Store field conflicts if enabled
    if (this.config.storeFieldConflicts && fieldConflicts.length > 0) {
      this.fieldConflictLogs.push({
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        entity: dataType,
        dataId: id,
        conflicts: fieldConflicts,
      });

      // Keep only last 100 logs
      if (this.fieldConflictLogs.length > 100) {
        this.fieldConflictLogs = this.fieldConflictLogs.slice(-100);
      }
    }

    console.log(
      `🔀 Field-level resolution for ${dataType}:${id} - ${fieldConflicts.length} conflicts, ${appliedRules.length} rules applied`,
    );

    return {
      data: merged as T,
      winner: "merged",
      strategy: "last-write-wins", // Base strategy
      resolvedAt: new Date().toISOString(),
      hadConflict: fieldConflicts.length > 0,
      reason: `Field-level merge: ${fieldConflicts.length} conflicts resolved`,
      fieldConflicts,
      requiresManual,
      appliedRules,
    };
  }

  /**
   * Check version-based conflict (optimistic locking)
   */
  private checkVersionConflict(
    local: any,
    remote: any,
  ): SmartConflictResolution | null {
    // Check if both have version field
    if (local._version === undefined || remote._version === undefined) {
      return null; // No version info
    }

    const localVersion = parseInt(local._version, 10);
    const remoteVersion = parseInt(remote._version, 10);

    // If local version is behind remote, reject local changes
    if (localVersion < remoteVersion) {
      console.warn(
        `⚠️  Version conflict: local (v${localVersion}) < remote (v${remoteVersion})`,
      );
      return {
        data: remote,
        winner: "remote",
        strategy: "remote-wins",
        resolvedAt: new Date().toISOString(),
        hadConflict: true,
        reason: `Version conflict - local is outdated (v${localVersion} < v${remoteVersion})`,
        requiresManual: true,
        validationErrors: [
          "Your local copy is outdated. Server has a newer version.",
        ],
      };
    }

    // If local version is ahead, this shouldn't happen (data loss risk)
    if (localVersion > remoteVersion) {
      console.error(
        `❌ CRITICAL: Local version ahead of remote! v${localVersion} > v${remoteVersion}`,
      );
      return {
        data: local,
        winner: "local",
        strategy: "local-wins",
        resolvedAt: new Date().toISOString(),
        hadConflict: true,
        reason: `Version anomaly - local ahead of remote (v${localVersion} > v${remoteVersion})`,
        requiresManual: true,
        validationErrors: [
          "CRITICAL: Local version ahead of server. Please contact support.",
        ],
      };
    }

    // Versions match - no conflict
    return null;
  }

  /**
   * Get field conflict logs
   */
  getFieldConflictLogs(entity?: string): Array<{
    id: string;
    timestamp: number;
    entity: string;
    dataId: string;
    conflicts: FieldConflict[];
  }> {
    if (entity) {
      return this.fieldConflictLogs.filter((log) => log.entity === entity);
    }
    return this.fieldConflictLogs;
  }

  /**
   * Clear field conflict logs
   */
  clearFieldConflictLogs(): void {
    this.fieldConflictLogs = [];
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalRules: number;
    totalFieldConflicts: number;
    conflictsByEntity: Record<string, number>;
    enabled: boolean;
  } {
    const conflictsByEntity: Record<string, number> = {};

    for (const log of this.fieldConflictLogs) {
      conflictsByEntity[log.entity] = (conflictsByEntity[log.entity] || 0) + 1;
    }

    return {
      totalRules: this.rules.size,
      totalFieldConflicts: this.fieldConflictLogs.length,
      conflictsByEntity,
      enabled: this.config.enabled,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance with feature flag
 */
export const smartConflictResolver = new SmartConflictResolver({
  enabled: true, // Can be toggled via env var or config
  enableFieldLevel: true,
  enableVersionCheck: true,
  fallbackToLWW: true,
  storeFieldConflicts: true,
});
