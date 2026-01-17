const fs = require('fs');
const path = require('path');

console.log('🚀 Creating UI Components for Day 128...\n');

const components = {
  'src/components/common/OfflineIndicator.tsx': `/**
 * OfflineIndicator Component
 *
 * Purpose: Badge showing online/offline status
 * Usage: Place in header/navigation for quick status check
 */

import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

export interface OfflineIndicatorProps {
  /** Show text label alongside icon */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
  /** Compact mode (icon only) */
  compact?: boolean;
}

/**
 * OfflineIndicator Component
 *
 * Displays current network status as a badge
 * - Green: Online
 * - Yellow: Unstable
 * - Red: Offline
 */
export function OfflineIndicator({
  showLabel = true,
  className,
  compact = false,
}: OfflineIndicatorProps) {
  const { isOnline, isOffline, isUnstable } = useNetworkStatus();

  const getBadgeVariant = () => {
    if (isOffline) return 'destructive';
    if (isUnstable) return 'warning';
    return 'success';
  };

  const getIcon = () => {
    if (isOffline) return WifiOff;
    if (isUnstable) return AlertTriangle;
    return Wifi;
  };

  const getLabel = () => {
    if (isOffline) return 'Offline';
    if (isUnstable) return 'Unstable';
    return 'Online';
  };

  const Icon = getIcon();
  const variant = getBadgeVariant();
  const label = getLabel();

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full',
          isOffline && 'bg-destructive/10',
          isUnstable && 'bg-yellow-500/10',
          isOnline && !isUnstable && 'bg-green-500/10',
          className
        )}
        title={label}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            isOffline && 'text-destructive',
            isUnstable && 'text-yellow-600',
            isOnline && !isUnstable && 'text-green-600'
          )}
        />
      </div>
    );
  }

  return (
    <Badge
      variant={variant}
      className={cn('flex items-center gap-1.5', className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </Badge>
  );
}

/**
 * Variant with pulse animation for offline state
 */
export function OfflineIndicatorPulse({
  className,
  ...props
}: OfflineIndicatorProps) {
  const { isOffline } = useNetworkStatus();

  return (
    <div className={cn('relative', className)}>
      {isOffline && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}
      <OfflineIndicator {...props} />
    </div>
  );
}
`,

  'src/components/common/SyncStatus.tsx': `/**
 * SyncStatus Component
 *
 * Purpose: Shows sync queue status and progress
 * Usage: Display in header or as floating indicator
 */

import { Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSyncContext } from '@/providers/SyncProvider';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

export interface SyncStatusProps {
  /** Show detailed status text */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

/**
 * SyncStatus Component
 *
 * Displays current sync status:
 * - Idle: No pending items
 * - Syncing: Processing queue
 * - Pending: Items waiting for sync
 * - Error: Sync failed
 */
export function SyncStatus({
  showDetails = true,
  className,
  compact = false,
}: SyncStatusProps) {
  const { stats, isProcessing, error } = useSyncContext();
  const { isOnline } = useNetworkStatus();

  const hasPending = stats && stats.pending > 0;
  const hasError = !!error;

  const getStatus = () => {
    if (hasError) return { icon: AlertCircle, label: 'Sync Error', variant: 'destructive' as const };
    if (isProcessing) return { icon: Loader2, label: 'Syncing...', variant: 'default' as const };
    if (hasPending && !isOnline) return { icon: CloudOff, label: \`\${stats.pending} Pending\`, variant: 'warning' as const };
    if (hasPending) return { icon: Cloud, label: \`\${stats.pending} Pending\`, variant: 'secondary' as const };
    return { icon: CheckCircle2, label: 'All Synced', variant: 'success' as const };
  };

  const status = getStatus();
  const Icon = status.icon;

  const tooltipContent = (
    <div className="space-y-1 text-xs">
      <div className="font-semibold">{status.label}</div>
      {stats && (
        <>
          <div>Pending: {stats.pending}</div>
          <div>Completed: {stats.completed}</div>
          <div>Failed: {stats.failed}</div>
        </>
      )}
      {!isOnline && <div className="text-yellow-400">Offline - Will sync when online</div>}
    </div>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full cursor-help',
                hasError && 'bg-destructive/10',
                isProcessing && 'bg-primary/10',
                hasPending && !isOnline && 'bg-yellow-500/10',
                !hasPending && !hasError && 'bg-green-500/10',
                className
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  hasError && 'text-destructive',
                  isProcessing && 'text-primary animate-spin',
                  hasPending && !isOnline && 'text-yellow-600',
                  !hasPending && !hasError && 'text-green-600'
                )}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={status.variant}
            className={cn('flex items-center gap-1.5 cursor-help', className)}
          >
            <Icon className={cn('h-3.5 w-3.5', isProcessing && 'animate-spin')} />
            {showDetails && <span className="text-xs font-medium">{status.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
`,

  'src/components/common/NetworkStatus.tsx': `/**
 * NetworkStatus Component
 *
 * Purpose: Detailed network status indicator with quality metrics
 * Usage: Status bar or settings page
 */

import { Wifi, WifiOff, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

export interface NetworkStatusProps {
  /** Show quality metrics */
  showQuality?: boolean;
  /** Custom className */
  className?: string;
  /** Variant */
  variant?: 'inline' | 'card';
}

/**
 * NetworkStatus Component
 *
 * Shows detailed network information:
 * - Connection status
 * - Connection type
 * - Quality metrics (if available)
 */
export function NetworkStatus({
  showQuality = true,
  className,
  variant = 'inline',
}: NetworkStatusProps) {
  const { status, isOnline, isOffline, quality } = useNetworkStatus();

  const getStatusColor = () => {
    if (isOffline) return 'text-red-600';
    if (quality?.downlink && quality.downlink < 1) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = () => {
    if (isOffline) return 'destructive';
    if (quality?.downlink && quality.downlink < 1) return 'warning';
    return 'success';
  };

  const content = (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className={cn('h-5 w-5', getStatusColor())} />
        ) : (
          <WifiOff className="h-5 w-5 text-red-600" />
        )}
        <div>
          <div className="text-sm font-medium">
            {isOnline ? 'Connected' : 'Disconnected'}
          </div>
          <div className="text-xs text-muted-foreground capitalize">{status}</div>
        </div>
      </div>

      {showQuality && quality && (
        <>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium">
                {quality.downlink ? \`\${quality.downlink.toFixed(1)} Mbps\` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">
                {quality.effectiveType || 'Unknown'}
              </div>
            </div>
          </div>
        </>
      )}

      <Badge variant={getStatusBadge()} className="ml-auto">
        {isOnline ? 'Online' : 'Offline'}
      </Badge>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardContent className="pt-6">{content}</CardContent>
      </Card>
    );
  }

  return <div className={cn('flex items-center', className)}>{content}</div>;
}
`,

  'src/components/layout/OfflineBar.tsx': `/**
 * OfflineBar Component
 *
 * Purpose: Banner alert for offline status
 * Usage: Top of page or layout to notify users of offline mode
 */

import { useState, useEffect } from 'react';
import { WifiOff, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useSyncContext } from '@/providers/SyncProvider';
import { cn } from '@/lib/utils';

export interface OfflineBarProps {
  /** Custom className */
  className?: string;
  /** Allow user to dismiss */
  dismissible?: boolean;
  /** Show sync status */
  showSyncStatus?: boolean;
}

/**
 * OfflineBar Component
 *
 * Displays a prominent banner when offline:
 * - Alert user about offline status
 * - Show number of pending changes
 * - Provide sync button when back online
 */
export function OfflineBar({
  className,
  dismissible = true,
  showSyncStatus = true,
}: OfflineBarProps) {
  const { isOnline, isOffline } = useNetworkStatus();
  const { stats, processQueue, isProcessing } = useSyncContext();
  const [isDismissed, setIsDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Track offline → online transition
  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setIsDismissed(false); // Reset dismiss when going offline
    }
  }, [isOffline]);

  // Don't show if:
  // - Currently online AND was never offline
  // - User dismissed it
  if ((isOnline && !wasOffline) || isDismissed) {
    return null;
  }

  const hasPending = stats && stats.pending > 0;

  const handleSync = async () => {
    try {
      await processQueue();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (isOnline) {
      setWasOffline(false);
    }
  };

  // Offline state
  if (isOffline) {
    return (
      <Alert
        variant="destructive"
        className={cn('border-l-4 border-l-red-600 rounded-none', className)}
      >
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-semibold">You are offline.</span>{' '}
            {showSyncStatus && hasPending && (
              <span>
                You have {stats.pending} unsaved change{stats.pending !== 1 ? 's' : ''}.{' '}
                They will be synced when you reconnect.
              </span>
            )}
            {showSyncStatus && !hasPending && (
              <span>All changes are saved locally.</span>
            )}
          </div>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-4"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Back online with pending changes
  if (wasOffline && hasPending) {
    return (
      <Alert
        variant="default"
        className={cn(
          'border-l-4 border-l-green-600 rounded-none bg-green-50 dark:bg-green-950',
          className
        )}
      >
        <RefreshCw className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <span className="font-semibold text-green-900 dark:text-green-100">
              You are back online!
            </span>{' '}
            <span className="text-green-800 dark:text-green-200">
              You have {stats.pending} pending change{stats.pending !== 1 ? 's' : ''} to sync.
            </span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleSync}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Sync Now
                </>
              )}
            </Button>
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
`,
};

// Write all components
let successCount = 0;
for (const [filePath, content] of Object.entries(components)) {
  const fullPath = path.join(__dirname, filePath);

  try {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Written: ${filePath}`);
    console.log(`   Lines: ${content.split('\n').length}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed: ${filePath}`, error.message);
  }
  console.log();
}

console.log(`\n📊 Summary: ${successCount}/${Object.keys(components).length} components created successfully!\n`);

if (successCount === Object.keys(components).length) {
  console.log('🎉 All UI components created!');
  console.log('\nNext steps:');
  console.log('  1. Check Badge variants in src/components/ui/badge.tsx');
  console.log('  2. Add Tooltip component if missing');
  console.log('  3. Test components in your app');
  console.log('  4. Integrate OfflineBar into your layout\n');
} else {
  console.log('⚠️  Some components failed. Please check errors above.\n');
}
