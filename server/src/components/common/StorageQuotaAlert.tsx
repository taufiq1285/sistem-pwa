/**
 * Storage Quota Alert Component
 *
 * FASE 1 IMPLEMENTATION - ZERO RISK
 * Monitor browser storage quota dan tampilkan warning
 * - Check IndexedDB & Cache storage usage
 * - Show alert when storage nearly full (>80%)
 * - Provide clear action button
 *
 * TIDAK MENGUBAH LOGIC EXISTING:
 * - Hanya READ storage API
 * - Tidak modify data
 * - Pure monitoring & UI
 */

import { useEffect, useState, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  HardDrive,
  Trash2,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useSync } from "@/lib/hooks/useSync";

interface StorageInfo {
  usage: number;
  quota: number;
  percentage: number;
  usageMB: number;
  quotaMB: number;
}

interface StorageQuotaAlertProps {
  /**
   * Show detailed info even when quota is fine
   * Default: false
   */
  alwaysShow?: boolean;
  /**
   * Threshold percentage to show warning
   * Default: 80
   */
  warningThreshold?: number;
  /**
   * Show as compact badge instead of full alert
   * Default: false
   */
  compact?: boolean;
}

export function StorageQuotaAlert({
  alwaysShow = false,
  warningThreshold = 80,
  compact = false,
}: StorageQuotaAlertProps) {
  // ============================================================================
  // HOOKS
  // ============================================================================

  const { clearCompleted } = useSync();

  // ============================================================================
  // STATE
  // ============================================================================

  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [supported, setSupported] = useState(true);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  /**
   * Check storage quota
   * HANYA READ - tidak modify apapun
   */
  const checkStorageQuota = useCallback(async () => {
    try {
      setIsChecking(true);

      // Check if Storage API is supported
      if (!navigator.storage || !navigator.storage.estimate) {
        setSupported(false);
        return;
      }

      // Get storage estimate
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;

      if (quota === 0) {
        setSupported(false);
        return;
      }

      const percentage = (usage / quota) * 100;
      const usageMB = usage / (1024 * 1024);
      const quotaMB = quota / (1024 * 1024);

      setStorageInfo({
        usage,
        quota,
        percentage,
        usageMB,
        quotaMB,
      });

      setSupported(true);
    } catch (error) {
      console.error("Failed to check storage quota:", error);
      setSupported(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Clear completed sync items to free space
   * Menggunakan method EXISTING clearCompleted()
   */
  const handleClearStorage = async () => {
    try {
      setIsClearing(true);

      // Clear completed sync items
      const count = await clearCompleted();

      // Re-check quota
      await checkStorageQuota();

      toast.success(`${count} sync items dihapus. Storage diperbarui.`);
    } catch (error) {
      console.error("Failed to clear storage:", error);
      toast.error("Gagal membersihkan storage");
    } finally {
      setIsClearing(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Check quota on mount and periodically
   */
  useEffect(() => {
    checkStorageQuota();

    // Recheck every 5 minutes
    const interval = setInterval(checkStorageQuota, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkStorageQuota]);

  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================

  // Don't show if not supported
  if (!supported) {
    return null;
  }

  // Don't show if no info yet
  if (!storageInfo) {
    return null;
  }

  const { percentage, usageMB, quotaMB } = storageInfo;
  const isWarning = percentage >= warningThreshold;

  // Auto-hide when quota is fine (unless alwaysShow is true)
  if (!alwaysShow && !isWarning) {
    return null;
  }

  // ============================================================================
  // RENDER COMPACT VERSION
  // ============================================================================

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <HardDrive
          className={`w-4 h-4 ${isWarning ? "text-yellow-500" : "text-green-500"}`}
        />
        <span className="text-muted-foreground">
          {Math.round(percentage)}% used
        </span>
        {isWarning && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearStorage}
            disabled={isClearing}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER FULL VERSION
  // ============================================================================

  return (
    <Alert variant={isWarning ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Storage {isWarning ? "Hampir Penuh" : "Normal"}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={checkStorageQuota}
          disabled={isChecking}
        >
          <RefreshCw
            className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
          />
        </Button>
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3 mt-2">
          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress value={percentage} className="h-2" />
            <div className="flex items-center justify-between text-xs">
              <span>
                {formatBytes(storageInfo.usage)} /{" "}
                {formatBytes(storageInfo.quota)}
              </span>
              <span className="font-semibold">{Math.round(percentage)}%</span>
            </div>
          </div>

          {/* Warning Message */}
          {isWarning && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-sm">
              <Info className="w-4 h-4 inline mr-2" />
              Storage browser Anda sudah mencapai {Math.round(percentage)}%.
              Sebaiknya bersihkan data yang tidak diperlukan.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isWarning ? "default" : "outline"}
              onClick={handleClearStorage}
              disabled={isClearing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isClearing ? "Membersihkan..." : "Bersihkan Sync Queue"}
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground">
            Aplikasi menggunakan IndexedDB untuk menyimpan data offline.
            Membersihkan sync queue akan menghapus item yang sudah selesai
            disinkronkan.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Detailed Storage Info Card (for settings page)
 */
export function StorageInfoCard() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [supported, setSupported] = useState(true);
  const { clearCompleted } = useSync();

  const checkStorageQuota = async () => {
    try {
      setIsChecking(true);

      if (!navigator.storage || !navigator.storage.estimate) {
        setSupported(false);
        return;
      }

      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;

      if (quota === 0) {
        setSupported(false);
        return;
      }

      const percentage = (usage / quota) * 100;
      const usageMB = usage / (1024 * 1024);
      const quotaMB = quota / (1024 * 1024);

      setStorageInfo({
        usage,
        quota,
        percentage,
        usageMB,
        quotaMB,
      });

      setSupported(true);
    } catch (error) {
      console.error("Failed to check storage quota:", error);
      setSupported(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearStorage = async () => {
    try {
      const count = await clearCompleted();
      await checkStorageQuota();
      toast.success(`${count} items dihapus`);
    } catch (error) {
      console.error("Failed to clear storage:", error);
      toast.error("Gagal membersihkan storage");
    }
  };

  useEffect(() => {
    checkStorageQuota();
  }, []);

  if (!supported || !storageInfo) {
    return null;
  }

  const { percentage, usageMB, quotaMB } = storageInfo;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-semibold">{usageMB.toFixed(2)} MB</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className="font-semibold">{quotaMB.toFixed(2)} MB</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-center text-sm text-muted-foreground">
            {Math.round(percentage)}% used
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={checkStorageQuota}
            disabled={isChecking}
            className="flex-1"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isChecking ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearStorage}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
