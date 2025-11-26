import { useState, useEffect } from 'react';
import { RefreshCw, Cloud, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getSyncManagementStats, forceSyncNow, type SyncManagementStats } from '@/lib/api/sync.api';

export default function SyncManagementPage() {
  const [syncStats, setSyncStats] = useState<SyncManagementStats>({
    pendingSync: 0, synced: 0, failed: 0, conflicts: 0, lastSync: 'Never',
    queueStats: { total: 0, pending: 0, syncing: 0, completed: 0, failed: 0 },
    syncStats: { totalSynced: 0, totalFailed: 0, averageDuration: 0, syncHistory: [] },
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSyncStats();
    const interval = setInterval(loadSyncStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncStats = async () => {
    try {
      setLoading(true);
      const data = await getSyncManagementStats();
      setSyncStats(data);
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async () => {
    try {
      setSyncing(true);
      await forceSyncNow();
      toast.success('Sync process initiated');
      setTimeout(loadSyncStats, 2000);
    } catch (error) {
      toast.error('Failed to trigger sync');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  return (<div className="container mx-auto py-6 max-w-7xl space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Sync Management</h1><p className="text-muted-foreground">Monitor offline synchronization</p></div><div className="flex gap-2"><Button variant="outline" onClick={loadSyncStats} disabled={loading}><RefreshCw className={loading ? 'h-4 w-4 mr-2 animate-spin' : 'h-4 w-4 mr-2'} />Refresh</Button><Button onClick={handleForceSync} disabled={syncing}><RefreshCw className={syncing ? 'h-4 w-4 mr-2 animate-spin' : 'h-4 w-4 mr-2'} />Force Sync</Button></div></div><div className="grid gap-4 md:grid-cols-4"><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Cloud className="h-4 w-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{syncStats.pendingSync}</div><p className="text-xs text-muted-foreground mt-1">{syncStats.queueStats.syncing} syncing</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Synced</CardTitle><CheckCircle className="h-4 w-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{syncStats.synced}</div><p className="text-xs text-muted-foreground mt-1">{syncStats.syncStats.totalSynced} total</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Failed</CardTitle><AlertCircle className="h-4 w-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold">{syncStats.failed}</div><p className="text-xs text-muted-foreground mt-1">Needs retry</p></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Last Sync</CardTitle><RefreshCw className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-sm font-bold">{syncStats.lastSync}</div><Badge variant="outline" className="mt-2">Auto</Badge></CardContent></Card></div><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Queue Statistics</CardTitle><CardDescription>Offline sync queue status</CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">Total Items</span><Badge variant="outline">{syncStats.queueStats.total}</Badge></div><div className="flex items-center justify-between"><span className="text-sm font-medium">Pending</span><Badge variant="secondary">{syncStats.queueStats.pending}</Badge></div><div className="flex items-center justify-between"><span className="text-sm font-medium">Syncing</span><Badge variant="default">{syncStats.queueStats.syncing}</Badge></div><div className="flex items-center justify-between"><span className="text-sm font-medium">Completed</span><Badge variant="outline" className="bg-green-50">{syncStats.queueStats.completed}</Badge></div><div className="flex items-center justify-between"><span className="text-sm font-medium">Failed</span><Badge variant="destructive">{syncStats.queueStats.failed}</Badge></div></div></CardContent></Card><Card><CardHeader><CardTitle>Sync Performance</CardTitle><CardDescription>Historical sync metrics</CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">Total Synced</span><span className="text-2xl font-bold">{syncStats.syncStats.totalSynced}</span></div><div className="flex items-center justify-between"><span className="text-sm font-medium">Total Failed</span><span className="text-2xl font-bold text-red-600">{syncStats.syncStats.totalFailed}</span></div><div className="flex items-center justify-between"><span className="text-sm font-medium">Avg Duration</span><span className="text-lg font-bold">{Math.round(syncStats.syncStats.averageDuration)}ms</span></div><div className="flex items-center justify-between"><span className="text-sm font-medium">Sync History</span><Badge variant="outline">{syncStats.syncStats.syncHistory.length} records</Badge></div></div></CardContent></Card></div><Card><CardHeader><CardTitle>Offline Synchronization</CardTitle><CardDescription>PWA offline data sync system</CardDescription></CardHeader><CardContent><div className="text-center py-8"><Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Background sync is active</p><p className="text-sm text-muted-foreground mt-2">Monitoring {syncStats.queueStats.total} queue items, {syncStats.pendingSync} pending synchronization</p></div></CardContent></Card></div>);
}
