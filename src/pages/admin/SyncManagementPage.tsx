import { useEffect, useState } from "react";
import {
  RefreshCw,
  Cloud,
  Database,
  CheckCircle,
  AlertCircle,
  History,
} from "lucide-react";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";
import { ButtonEnhanced } from "@/components/ui/button-enhanced";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getSyncManagementStats,
  forceSyncNow,
  type SyncManagementStats,
} from "@/lib/api/sync.api";
import { toastConfig } from "@/lib/toast-config";

export default function SyncManagementPage() {
  const [syncStats, setSyncStats] = useState<SyncManagementStats>({
    pendingSync: 0,
    synced: 0,
    failed: 0,
    conflicts: 0,
    lastSync: "Never",
    queueStats: { total: 0, pending: 0, syncing: 0, completed: 0, failed: 0 },
    syncStats: {
      totalSynced: 0,
      totalFailed: 0,
      averageDuration: 0,
      syncHistory: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void loadSyncStats();
    const interval = window.setInterval(() => {
      void loadSyncStats();
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const loadSyncStats = async () => {
    try {
      setLoading(true);
      const data = await getSyncManagementStats();
      setSyncStats(data);
    } catch (error) {
      console.error("Failed to load sync stats:", error);
      toastConfig.error("Gagal memuat statistik sinkronisasi");
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      await forceSyncNow();
      toastConfig.success(
        "Sinkronisasi dimulai",
        "Status akan diperbarui otomatis dalam beberapa detik",
      );
      window.setTimeout(() => {
        void loadSyncStats();
      }, 2000);
    } catch (error) {
      console.error(error);
      toastConfig.error("Gagal memulai sinkronisasi");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Management</h1>
          <p className="text-muted-foreground">
            Monitor offline synchronization dengan ringkasan yang lebih jelas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonEnhanced
            variant="outline"
            onClick={() => void loadSyncStats()}
            loading={loading}
            loadingText="Memuat..."
          >
            {!loading && <RefreshCw className="h-4 w-4" />}
            Refresh
          </ButtonEnhanced>
          <ButtonEnhanced
            onClick={handleForceSync}
            loading={syncing}
            loadingText="Sinkronisasi..."
          >
            {!syncing && <RefreshCw className="h-4 w-4" />}
            Force Sync
          </ButtonEnhanced>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Pending"
          value={syncStats.pendingSync}
          icon={Cloud}
          color="amber"
        />
        <DashboardCard
          title="Synced"
          value={syncStats.synced}
          icon={CheckCircle}
          color="green"
        />
        <DashboardCard
          title="Failed"
          value={syncStats.failed}
          icon={AlertCircle}
          color="red"
        />
        <DashboardCard
          title="Riwayat Sync"
          value={syncStats.syncStats.syncHistory.length}
          icon={History}
          color="blue"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Queue Statistics</CardTitle>
            <CardDescription>
              Status item pada offline sync queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Items</span>
              <StatusBadge status="info" pulse={false}>
                {syncStats.queueStats.total}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pending</span>
              <StatusBadge status="warning" pulse={false}>
                {syncStats.queueStats.pending}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Syncing</span>
              <StatusBadge status="info">
                {syncStats.queueStats.syncing}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completed</span>
              <StatusBadge status="success" pulse={false}>
                {syncStats.queueStats.completed}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Failed</span>
              <StatusBadge status="error" pulse={false}>
                {syncStats.queueStats.failed}
              </StatusBadge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Sync Performance</CardTitle>
            <CardDescription>
              Ringkasan performa sinkronisasi historis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Synced</span>
              <span className="text-2xl font-bold">
                {syncStats.syncStats.totalSynced}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Failed</span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {syncStats.syncStats.totalFailed}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Duration</span>
              <span className="text-lg font-bold">
                {Math.round(syncStats.syncStats.averageDuration)}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mode</span>
              <StatusBadge status="success">Auto</StatusBadge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/60 bg-linear-to-br from-background via-background to-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle>Offline Synchronization</CardTitle>
          <CardDescription>PWA offline data sync system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
              <Database className="h-12 w-12" />
            </div>
            <p className="font-medium text-foreground">Background sync aktif</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitoring {syncStats.queueStats.total} queue items, dengan{" "}
              {syncStats.pendingSync} item menunggu sinkronisasi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
