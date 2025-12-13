/**
 * Conflict Notification Badge Component
 *
 * FASE 3 - Week 4 Day 2: Displays pending conflicts count in header
 * Provides quick access to conflict resolution dialog
 */

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConflicts } from "@/lib/hooks/useConflicts";
import { ConflictResolver } from "@/components/features/sync/ConflictResolver";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface ConflictNotificationBadgeProps {
  className?: string;
  autoRefreshInterval?: number; // In milliseconds, default 30 seconds
  showLabel?: boolean; // Show "Conflicts" text or just icon
  variant?: "default" | "ghost" | "outline";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConflictNotificationBadge({
  className,
  autoRefreshInterval = 30000, // 30 seconds
  showLabel = false,
  variant = "ghost",
}: ConflictNotificationBadgeProps) {
  const [showResolver, setShowResolver] = useState(false);
  const { pendingConflicts, refreshConflicts, loading } = useConflicts();

  // Auto-refresh conflicts at interval
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        refreshConflicts();
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, refreshConflicts]);

  // Don't show if no conflicts
  if (pendingConflicts.length === 0) {
    return null;
  }

  const conflictCount = pendingConflicts.length;

  return (
    <>
      <Button
        variant={variant}
        size={showLabel ? "sm" : "icon"}
        className={cn("relative", className)}
        onClick={() => setShowResolver(true)}
        title={`${conflictCount} data conflict${conflictCount > 1 ? "s" : ""} need${conflictCount === 1 ? "s" : ""} your attention`}
        disabled={loading}
      >
        <AlertCircle
          className={cn("h-5 w-5", conflictCount > 0 && "text-orange-500")}
        />

        {showLabel && <span className="ml-2">Conflicts</span>}

        {conflictCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-600"
          >
            {conflictCount > 9 ? "9+" : conflictCount}
          </Badge>
        )}
      </Button>

      <ConflictResolver open={showResolver} onOpenChange={setShowResolver} />
    </>
  );
}

export default ConflictNotificationBadge;
