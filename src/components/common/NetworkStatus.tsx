/**
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
                {quality.downlink ? `${quality.downlink.toFixed(1)} Mbps` : 'N/A'}
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
