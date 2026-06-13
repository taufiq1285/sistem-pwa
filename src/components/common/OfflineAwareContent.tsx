import React from "react";
import { useOfflineContext } from "@/context/OfflineContext";
import { EmptyState } from "./EmptyState";
import { OfflineBanner } from "./OfflineBanner";

export interface OfflineAwareContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; // optional custom offline UI
  hasData?: boolean; // deteksi cached data via props
  context?: string; // context for offline empty state
  onSync?: () => void;
}

export function OfflineAwareContent({
  children,
  fallback,
  hasData = false,
  context,
  onSync,
}: OfflineAwareContentProps) {
  const { isOffline } = useOfflineContext();

  if (!isOffline) {
    return <>{children}</>;
  }

  // Jika offline + ada cached data
  if (hasData) {
    return (
      <div className="space-y-4">
        <OfflineBanner onSync={onSync} />
        {children}
      </div>
    );
  }

  // Jika offline + tidak ada cached data
  if (fallback) {
    return <>{fallback}</>;
  }

  return <EmptyState variant="offline" context={context} />;
}

export default OfflineAwareContent;
