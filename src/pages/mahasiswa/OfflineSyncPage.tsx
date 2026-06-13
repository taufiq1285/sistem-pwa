/**
 * Offline Sync Page - Mahasiswa
 * Display synchronization status for offline data and allow manual sync trigger.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertTriangle,
  BookOpen,
  CheckCheck,
  CheckCircle2,
  CloudOff,
  Edit3,
  FileClock,
  RefreshCcw,
  Send,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSync } from "@/lib/hooks/useSync";
import { useNetworkStatus } from "@/lib/hooks/useNetworkStatus";
import {
  getOfflineAttemptSyncItemsForMahasiswa,
  syncPendingOfflineQuizSubmissions,
  type OfflineAttemptSyncItem,
} from "@/lib/api/kuis.api";
import { toast } from "sonner";

export default function OfflineSyncPage() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { processQueue, stats, isProcessing, isReady } = useSync();
  const [offlineTasks, setOfflineTasks] = useState<OfflineAttemptSyncItem[]>(
    [],
  );
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const pendingCount = stats?.pending ?? 0;
  const failedCount = stats?.failed ?? 0;
  const completedCount = stats?.completed ?? 0;
  const pendingTaskCount = offlineTasks.filter(
    (task) => task.offline_submit_pending,
  ).length;
  const syncedTaskCount = offlineTasks.filter(
    (task) => task.display_status === "synced",
  ).length;
  const localDraftCount = offlineTasks.filter(
    (task) => task.display_status === "draft_local",
  ).length;
  const localAnswerCount = offlineTasks.filter(
    (task) => task.display_status === "answers_local",
  ).length;

  useEffect(() => {
    const loadOfflineTasks = async () => {
      if (!user?.mahasiswa?.id) {
        setOfflineTasks([]);
        setIsLoadingTasks(false);
        return;
      }

      setIsLoadingTasks(true);
      try {
        const items = await getOfflineAttemptSyncItemsForMahasiswa(
          user.mahasiswa.id,
        );
        setOfflineTasks(items);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadOfflineTasks();

    const handleOfflineSyncCompleted = () => {
      loadOfflineTasks().catch((error) => {
        console.error("Failed to refresh offline sync items:", error);
      });
    };

    window.addEventListener(
      "kuis:offline-sync-completed",
      handleOfflineSyncCompleted,
    );

    return () => {
      window.removeEventListener(
        "kuis:offline-sync-completed",
        handleOfflineSyncCompleted,
      );
    };
  }, [user?.mahasiswa?.id]);

  const handleSync = async () => {
    if (!isOnline) return;

    try {
      await processQueue();
      if (user?.mahasiswa?.id) {
        await syncPendingOfflineQuizSubmissions(user.mahasiswa.id);
        const refreshed = await getOfflineAttemptSyncItemsForMahasiswa(
          user.mahasiswa.id,
        );
        setOfflineTasks(refreshed);
      }
      toast.success("Sinkronisasi selesai!");
    } catch {
      toast.error("Gagal sinkronisasi. Coba lagi.");
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  const getTaskStatusMeta = (task: OfflineAttemptSyncItem) => {
    switch (task.display_status) {
      case "draft_local":
        return {
          badgeStatus: "info" as const,
          label: "Baru dibuka di perangkat",
          description:
            "Attempt sudah tersimpan lokal, tetapi belum ada jawaban offline yang tercatat.",
          icon: <FileClock className="mr-1 h-3.5 w-3.5" />,
        };
      case "answers_local":
        return {
          badgeStatus: "info" as const,
          label: "Jawaban tersimpan lokal",
          description: `${task.answer_count} jawaban tersimpan di perangkat dan bisa dilanjutkan.`,
          icon: <Edit3 className="mr-1 h-3.5 w-3.5" />,
        };
      case "pending_submit":
        return {
          badgeStatus: "offline" as const,
          label: "Submit menunggu sinkron",
          description:
            "Tugas sudah dikumpulkan offline. Sistem akan mengirim jawaban dan submit ke server saat sinkronisasi berhasil.",
          icon: <Send className="mr-1 h-3.5 w-3.5" />,
        };
      default:
        return {
          badgeStatus: "success" as const,
          label: "Sudah tersinkron",
          description:
            "Data tugas praktikum dari perangkat ini sudah tersinkron ke server.",
          icon: <CheckCheck className="mr-1 h-3.5 w-3.5" />,
        };
    }
  };

  return (
    <div className="app-container py-4 sm:py-6 lg:py-8 space-y-6">
      <div className="section-shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Sinkronisasi Offline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Kelola data lokal dan sinkronkan saat koneksi internet tersedia.
          </p>
        </div>

        <StatusBadge
          status={isOnline ? "online" : "offline"}
          pulse={isOnline}
          className="w-fit"
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
          <AlertDescription>
            Koneksi internet tidak tersedia. Data tetap tersimpan lokal dan akan
            disinkronkan otomatis saat online kembali.
          </AlertDescription>
        </Alert>
      )}

      {failedCount > 0 && (
        <Alert className="rounded-2xl border-danger/30 bg-danger/10 text-danger">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {failedCount} item gagal disinkronkan. Coba klik "Sinkronkan
            Sekarang" saat online.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border border-primary/20 bg-white/95 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">
              Status Sinkronisasi
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
              Keamanan Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              Data lokal disimpan aman pada perangkat.
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
              Jawaban dan submit offline akan dilanjutkan sinkron otomatis saat
              online.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-primary/20 bg-white/95 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg text-foreground">
                Riwayat Tugas Praktikum Offline
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Daftar tugas yang pernah dikerjakan atau dikumpulkan dari
                perangkat ini.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status="info" pulse={false}>
                <FileClock className="mr-1 h-3.5 w-3.5" />
                Draft: {localDraftCount}
              </StatusBadge>
              <StatusBadge status="info" pulse={false}>
                <Edit3 className="mr-1 h-3.5 w-3.5" />
                Jawaban lokal: {localAnswerCount}
              </StatusBadge>
              <StatusBadge status="offline" pulse={false}>
                <BookOpen className="mr-1 h-3.5 w-3.5" />
                Menunggu: {pendingTaskCount}
              </StatusBadge>
              <StatusBadge status="success" pulse={false}>
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Tersinkron: {syncedTaskCount}
              </StatusBadge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingTasks ? (
            <p className="text-sm text-muted-foreground">
              Memuat riwayat tugas offline...
            </p>
          ) : offlineTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada tugas praktikum offline yang tersimpan pada perangkat
              ini.
            </p>
          ) : (
            offlineTasks.map((task) => {
              const statusMeta = getTaskStatusMeta(task);

              return (
                <div
                  key={task.attempt_id}
                  className="rounded-xl border border-border/60 bg-background/80 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {task.judul}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {[task.nama_mk, task.nama_kelas]
                          .filter(Boolean)
                          .join(" • ") ||
                          "Informasi kelas belum tersimpan lengkap"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Aktivitas terakhir:{" "}
                        {formatDateTime(task.last_activity_at)}
                      </p>
                      {task.answer_count > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Jawaban lokal tersimpan: {task.answer_count}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {statusMeta.description}
                      </p>
                    </div>

                    <StatusBadge
                      status={statusMeta.badgeStatus}
                      pulse={false}
                      className="w-fit"
                    >
                      {statusMeta.icon}
                      {statusMeta.label}
                    </StatusBadge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
