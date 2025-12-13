/**
 * Sync Monitoring Page
 *
 * FASE 1 IMPLEMENTATION - ZERO RISK
 * Admin dashboard untuk monitoring offline sync queue
 * - View queue statistics
 * - See failed items with error details
 * - Retry failed syncs manually
 * - Clear completed items
 *
 * TIDAK MENGUBAH LOGIC EXISTING:
 * - Hanya menggunakan method yang sudah ada di useSync
 * - Pure read + trigger existing methods
 * - Tidak modify queue processing logic
 */

import { useEffect, useState } from "react";
import { useSync } from "@/lib/hooks/useSync";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  RotateCcw,
} from "lucide-react";
import type { SyncQueueItem } from "@/types/offline.types";
import { toast } from "sonner";

export function SyncMonitoringPage() {
  // ============================================================================
  // HOOKS - Menggunakan hook yang SUDAH ADA
  // ============================================================================

  const {
    stats,
    isProcessing,
    isReady,
    getAllItems,
    processQueue,
    retryFailed,
    clearCompleted,
    refreshStats,
  } = useSync();

  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([]);
  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([]);
  const [completedItems, setCompletedItems] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load items on mount and when stats change
   * HANYA READ - tidak modify apapun
   */
  useEffect(() => {
    if (!isReady) return;

    const loadItems = async () => {
      try {
        setLoading(true);

        // Menggunakan method EXISTING getAllItems()
        const [failed, pending, completed] = await Promise.all([
          getAllItems("failed"),
          getAllItems("pending"),
          getAllItems("completed"),
        ]);

        setFailedItems(failed);
        setPendingItems(pending);
        setCompletedItems(completed.slice(0, 10)); // Show last 10 completed
      } catch (error) {
        console.error("Failed to load queue items:", error);
        toast.error("Gagal memuat data queue");
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [isReady, getAllItems, stats]);

  // ============================================================================
  // HANDLERS - Semua menggunakan method EXISTING
  // ============================================================================

  /**
   * Handle manual sync trigger
   * Menggunakan processQueue() yang SUDAH ADA
   */
  const handleSyncNow = async () => {
    try {
      await processQueue();
      await refreshStats();
      toast.success("Sinkronisasi berhasil!");
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Sinkronisasi gagal");
    }
  };

  /**
   * Handle retry failed items
   * Menggunakan retryFailed() yang SUDAH ADA
   */
  const handleRetryFailed = async () => {
    try {
      const count = await retryFailed();
      await refreshStats();
      toast.success(`${count} item telah di-retry`);
    } catch (error) {
      console.error("Retry failed:", error);
      toast.error("Gagal retry item");
    }
  };

  /**
   * Handle clear completed items
   * Menggunakan clearCompleted() yang SUDAH ADA
   */
  const handleClearCompleted = async () => {
    try {
      const count = await clearCompleted();
      await refreshStats();
      toast.success(`${count} item berhasil dihapus`);
    } catch (error) {
      console.error("Clear failed:", error);
      toast.error("Gagal menghapus item");
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("id-ID");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      case "syncing":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case "create":
        return "Buat";
      case "update":
        return "Update";
      case "delete":
        return "Hapus";
      default:
        return operation;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isReady || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor dan kelola offline sync queue
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSyncNow}
            disabled={isProcessing || stats?.pending === 0}
            variant="default"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isProcessing ? "animate-spin" : ""}`}
            />
            Sync Sekarang
          </Button>
          <Button onClick={() => refreshStats()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Total dalam queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Menunggu sinkronisasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Berhasil disinkronkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">Gagal disinkronkan</p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Items Section */}
      {failedItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Failed Items</CardTitle>
                <CardDescription>
                  Item yang gagal disinkronkan setelah{" "}
                  {failedItems[0]?.retryCount || 3}x percobaan
                </CardDescription>
              </div>
              <Button onClick={handleRetryFailed} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {failedItems.map((item) => (
                <Alert key={item.id} variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {getOperationLabel(item.operation)} {item.entity}
                          </Badge>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-mono mb-1">ID: {item.id}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {formatTimestamp(item.timestamp)}
                        </p>
                        {item.error && (
                          <div className="bg-red-50 dark:bg-red-950 p-2 rounded text-sm">
                            <strong>Error:</strong> {item.error}
                          </div>
                        )}
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer hover:underline">
                            Lihat Data
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                            {JSON.stringify(item.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Items Section */}
      {pendingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Items</CardTitle>
            <CardDescription>
              Item yang menunggu untuk disinkronkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">
                        {getOperationLabel(item.operation)} {item.entity}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Items Section */}
      {completedItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Completed</CardTitle>
                <CardDescription>
                  10 item terakhir yang berhasil disinkronkan
                </CardDescription>
              </div>
              <Button
                onClick={handleClearCompleted}
                variant="outline"
                size="sm"
                disabled={stats?.completed === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">
                        {getOperationLabel(item.operation)} {item.entity}
                      </Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {failedItems.length === 0 &&
        pendingItems.length === 0 &&
        completedItems.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Queue Kosong</h3>
              <p className="text-muted-foreground text-center">
                Tidak ada item dalam sync queue.
                <br />
                Semua data telah tersinkronisasi.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
