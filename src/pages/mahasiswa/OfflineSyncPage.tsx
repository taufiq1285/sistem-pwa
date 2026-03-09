/**
 * Offline Sync Page - Mahasiswa
 * Display synchronization status for offline data and allow manual sync trigger.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  const { isOnline } = useNetworkStatus();
  const { processQueue, stats, isProcessing, isReady } = useSync();

  const pendingCount = stats?.pending ?? 0;
  const failedCount = stats?.failed ?? 0;
  const completedCount = stats?.completed ?? 0;

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
    <div className="app-container space-y-6">
      <div className="section-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Sinkronisasi Offline
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Kelola data lokal dan sinkronkan saat koneksi internet tersedia.
          </p>
        </div>

        <Badge
          className={`w-fit ${
            isOnline
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
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
        </Badge>
      </div>

      {!isOnline && (
        <Alert className="rounded-2xl border-amber-200 bg-amber-50 text-amber-800">
          <CloudOff className="h-4 w-4" />
          <AlertDescription>
            Koneksi internet tidak tersedia. Data tetap tersimpan lokal dan akan
            bisa disinkronkan saat online.
          </AlertDescription>
        </Alert>
      )}

      {failedCount > 0 && (
        <Alert className="rounded-2xl border-red-200 bg-red-50 text-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {failedCount} item gagal disinkronkan. Coba klik "Sinkronkan
            Sekarang" saat online.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border border-blue-100/70 bg-white/95 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Status Sinkronisasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Menunggu Sync
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700">
                  {isReady ? pendingCount : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Berhasil
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {isReady ? completedCount : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Gagal
                </p>
                <p className="mt-1 text-2xl font-bold text-red-700">
                  {isReady ? failedCount : "—"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSync}
              disabled={!isOnline || isProcessing || !isReady}
              className="h-11 bg-blue-700 text-white shadow-lg shadow-blue-900/15 hover:bg-blue-800"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isProcessing ? "animate-spin" : ""}`}
              />
              {isProcessing ? "Sinkronisasi..." : "Sinkronkan Sekarang"}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-blue-100/70 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Keamanan Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-700" />
              Data lokal disimpan aman pada perangkat.
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              Sinkronisasi otomatis dilanjutkan saat online.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
