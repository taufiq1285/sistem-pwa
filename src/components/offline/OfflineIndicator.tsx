
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

export interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  hideWhenOnline?: boolean;
  className?: string;
}

export function OfflineIndicator({
  position = 'top',
  hideWhenOnline = true,
  className,
}: OfflineIndicatorProps) {
  const { status, isOnline, quality } = useNetworkStatus();

  if (hideWhenOnline && isOnline) {
    return null;
  }

  const statusConfig = {
    online: {
      icon: Wifi,
      bg: 'bg-green-500',
      text: 'Online',
      description: quality
        ? `${quality.effectiveType.toUpperCase()} • ${Math.round(quality.latency)}ms`
        : 'Connected',
    },
    offline: {
      icon: WifiOff,
      bg: 'bg-red-500',
      text: 'Offline',
      description: 'No internet connection',
    },
    unstable: {
      icon: AlertTriangle,
      bg: 'bg-yellow-500',
      text: 'Unstable',
      description: 'Poor connection',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 flex items-center justify-center px-4 py-2 text-white shadow-lg',
        config.bg,
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="text-sm font-semibold">{config.text}</span>
          <span className="text-xs opacity-90">{config.description}</span>
        </div>
      </div>
    </div>
  );
}
