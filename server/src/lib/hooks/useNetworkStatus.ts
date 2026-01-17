/**
 * useNetworkStatus Hook
 *
 * React hook for monitoring network connectivity status
 * - Subscribes to network status changes
 * - Returns current status and quality metrics
 * - Auto-initializes network detector
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  networkDetector,
  type NetworkStatus,
  type NetworkQuality,
  type NetworkChangeEvent,
} from "../offline/network-detector";

// ============================================================================
// TYPES
// ============================================================================

export interface UseNetworkStatusReturn {
  /** Current network status */
  status: NetworkStatus;
  /** Whether the network is online */
  isOnline: boolean;
  /** Whether the network is offline */
  isOffline: boolean;
  /** Whether the network is unstable */
  isUnstable: boolean;
  /** Network quality metrics (if available) */
  quality?: NetworkQuality;
  /** Timestamp of last status change */
  lastChanged: number;
  /** Whether the detector is ready */
  isReady: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for monitoring network status
 *
 * @returns Network status and helper methods
 *
 * @example
 * \`\`\`tsx
 * function MyComponent() {
 *   const { isOnline, isOffline, status, quality } = useNetworkStatus();
 *
 *   if (isOffline) {
 *     return <div>You are offline</div>;
 *   }
 *
 *   return <div>You are {status}</div>;
 * }
 * \`\`\`
 */
export function useNetworkStatus(): UseNetworkStatusReturn {
  // ============================================================================
  // STATE
  // ============================================================================

  const [status, setStatus] = useState<NetworkStatus>(() =>
    networkDetector.getStatus(),
  );
  const [quality, setQuality] = useState<NetworkQuality | undefined>();
  const [lastChanged, setLastChanged] = useState<number>(Date.now());
  const [isReady, setIsReady] = useState<boolean>(false);

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  /**
   * Handle network status change
   */
  const handleNetworkChange = useCallback((event: NetworkChangeEvent) => {
    setStatus(event.status);
    setQuality(event.quality);
    setLastChanged(event.timestamp);
  }, []);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Initialize network detector and subscribe to changes
   */
  useEffect(() => {
    // Initialize network detector if not already initialized
    if (!networkDetector.isReady()) {
      networkDetector.initialize();
    }

    // Subscribe to network changes
    networkDetector.on(handleNetworkChange);

    // Mark as ready
    setIsReady(true);

    // Cleanup
    return () => {
      networkDetector.off(handleNetworkChange);
    };
  }, [handleNetworkChange]);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const isOnline = useMemo(() => status === "online", [status]);
  const isOffline = useMemo(() => status === "offline", [status]);
  const isUnstable = useMemo(() => status === "unstable", [status]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    status,
    isOnline,
    isOffline,
    isUnstable,
    quality,
    lastChanged,
    isReady,
  };
}
