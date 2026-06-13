/**
 * Offline Sync Page - Shared across all roles
 * Displays sync status and allows manual sync trigger.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  RefreshCcw,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSync } from "@/lib/hooks/useSync";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import { toast } from "sonner";

export default function OfflineSyncPage() {
  const location = useLocation();
  const { isOnline } = useNetworkStatus();
  const { processQueue, stats, isProcessing, isReady } = useSync();

  const pendingCount = stats?.pending ?? 0;
  const failedCount = stats?.failed ?? 0;
  const completedCount = stats?.completed ?? 0;
  const isAdminRoute = location.pathname.startsWith("/admin/");

  const copy = isAdminRoute
    ? {
        title: "Monitoring Sinkronisasi Offline",
        description:
          "Pantau antrian data lokal dan jalankan sinkronisasi pemulihan saat koneksi internet tersedia.",
        offlineMessage:
          "Koneksi internet tidak tersedia. Data lokal tetap tersimpan di perangkat dan admin dapat memantau antrian yang menunggu sinkronisasi.",
        failedMessage: `${failedCount} item gagal disinkronkan. Admin dapat menjalankan sinkronisasi ulang saat online untuk membantu pemulihan data.`,
        statusTitle: "Status Monitoring Sinkronisasi",
        securityTitle: "Pemulihan Data",
        securityPointOne:
          "Admin memakai halaman ini untuk memantau dan membantu pemulihan data offline.",
        securityPointTwo:
          "Sinkronisasi ulang dapat dijalankan saat koneksi kembali stabil.",
      }
    : {
        title: "Sinkronisasi Offline",
        description:
          "Kelola data lokal dan sinkronkan saat koneksi internet tersedia.",
        offlineMessage:
          "Koneksi internet tidak tersedia. Data tetap tersimpan lokal dan akan disinkronkan otomatis saat online kembali.",
        failedMessage: `${failedCount} item gagal disinkronkan. Klik "Sinkronkan Sekarang" saat online.`,
        statusTitle: "Status Sinkronisasi",
        securityTitle: "Keamanan Data",
        securityPointOne: "Data lokal disimpan aman pada perangkat.",
        securityPointTwo: "Sinkronisasi otomatis berjalan saat kembali online.",
      };

  const handleSync = async () => {
    if (!isOnline) return;
    try {
      await processQueue();
      toast.success("Sinkronisasi selesai!");
    } catch {
      toast.error("Gagal sinkronisasi. Coba lagi.");
    }
  };

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      <div className="section-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl p-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {copy.description}
          </p>
        </div>

        <StatusBadge
          status={isOnline ? "online" : "offline"}
          pulse={isOnline}
          className="w-fit shrink-0"
        >
          {isOnline ? (
            <>
              <Wifi className="mr-1 h-3.5 w-3.5" /> Online
            </>
          ) : (
            <>
              <WifiOff className="mr-1 h-3.5 w-3.5" /> Offline
            </>
          )}
        </StatusBadge>
      </div>

      {!isOnline && (
        <Alert className="rounded-2xl border-warning/30 bg-warning/10 text-warning">
          <CloudOff className="h-4 w-4" />
          <AlertDescription>{copy.offlineMessage}</AlertDescription>
        </Alert>
      )}

      {failedCount > 0 && (
        <Alert className="rounded-2xl border-danger/30 bg-danger/10 text-danger">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{copy.failedMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border border-primary/20 bg-white/95 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              {copy.statusTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Menunggu Sync
                </p>
                <p className="mt-1 text-2xl font-bold text-warning">
                  {isReady ? pendingCount : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Berhasil
                </p>
                <p className="mt-1 text-2xl font-bold text-success">
                  {isReady ? completedCount : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Gagal
                </p>
                <p className="mt-1 text-2xl font-bold text-danger">
                  {isReady ? failedCount : "—"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSync}
              disabled={!isOnline || isProcessing || !isReady}
              className="h-11 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`}
              />
              {isProcessing ? "Sinkronisasi..." : "Sinkronkan Sekarang"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-primary/20 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              {copy.securityTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              {copy.securityPointOne}
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
              {copy.securityPointTwo}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
