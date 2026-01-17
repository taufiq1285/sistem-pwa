/**
 * Network Status Utilities
 *
 * Provides utilities for detecting network status and quality
 * Helps the app make smart decisions about caching and request strategies
 */

/**
 * Network connection types
 */
export type NetworkType =
  | "wifi"
  | "4g"
  | "3g"
  | "2g"
  | "slow-2g"
  | "unknown"
  | "offline";

/**
 * Network quality levels
 */
export type NetworkQuality = "excellent" | "good" | "poor" | "offline";

/**
 * Network status information
 */
export interface NetworkStatus {
  online: boolean;
  type: NetworkType;
  quality: NetworkQuality;
  effectiveType: string;
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData: boolean;
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Check if browser is offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Get network connection information
 * Uses Network Information API (experimental)
 */
export function getConnectionInfo(): Partial<NetworkStatus> {
  type NavigatorWithConnection = Navigator & {
    connection?: any;
    mozConnection?: any;
    webkitConnection?: any;
  };

  const nav = navigator as NavigatorWithConnection;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  if (!connection) {
    return {
      online: navigator.onLine,
      type: "unknown",
      quality: navigator.onLine ? "good" : "offline",
      effectiveType: "unknown",
      saveData: false,
    };
  }

  const effectiveType = connection.effectiveType || "unknown";
  const type = mapEffectiveTypeToNetworkType(effectiveType);
  const quality = getNetworkQuality(connection);

  return {
    online: navigator.onLine,
    type,
    quality,
    effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData || false,
  };
}

/**
 * Map effective connection type to simplified network type
 */
function mapEffectiveTypeToNetworkType(effectiveType: string): NetworkType {
  switch (effectiveType) {
    case "4g":
      return "4g";
    case "3g":
      return "3g";
    case "2g":
      return "2g";
    case "slow-2g":
      return "slow-2g";
    default:
      return "unknown";
  }
}

/**
 * Determine network quality based on connection info
 */
function getNetworkQuality(connection: any): NetworkQuality {
  if (!navigator.onLine) {
    return "offline";
  }

  const effectiveType = connection.effectiveType;
  const rtt = connection.rtt || 0;
  const downlink = connection.downlink || 0;

  // Excellent: 4G with low RTT
  if (effectiveType === "4g" && rtt < 100) {
    return "excellent";
  }

  // Good: 4G or good 3G
  if (effectiveType === "4g" || (effectiveType === "3g" && rtt < 300)) {
    return "good";
  }

  // Poor: 2G or slow 3G
  if (effectiveType === "2g" || effectiveType === "slow-2g" || rtt > 500) {
    return "poor";
  }

  // Default to good if we can't determine
  return "good";
}

/**
 * Get current network status
 */
export function getNetworkStatus(): NetworkStatus {
  const connectionInfo = getConnectionInfo();

  return {
    online: navigator.onLine,
    type: connectionInfo.type || "unknown",
    quality: connectionInfo.quality || (navigator.onLine ? "good" : "offline"),
    effectiveType: connectionInfo.effectiveType || "unknown",
    downlink: connectionInfo.downlink,
    rtt: connectionInfo.rtt,
    saveData: connectionInfo.saveData || false,
  };
}

/**
 * Check if network quality is poor
 */
export function isPoorConnection(): boolean {
  const status = getNetworkStatus();
  return status.quality === "poor";
}

/**
 * Check if should use aggressive caching
 * Returns true if network is poor or save-data is enabled
 */
export function shouldUseAggressiveCaching(): boolean {
  const status = getNetworkStatus();
  return status.quality === "poor" || status.saveData;
}

/**
 * Get recommended timeout based on network quality
 */
export function getRecommendedTimeout(): number {
  const status = getNetworkStatus();

  switch (status.quality) {
    case "excellent":
      return 5000; // 5 seconds
    case "good":
      return 8000; // 8 seconds
    case "poor":
      return 15000; // 15 seconds
    case "offline":
      return 3000; // 3 seconds (quick fail)
    default:
      return 8000;
  }
}

/**
 * Get recommended cache strategy based on network quality
 */
export function getRecommendedCacheStrategy():
  | "cache-first"
  | "network-first"
  | "stale-while-revalidate" {
  const status = getNetworkStatus();

  if (status.quality === "offline" || status.quality === "poor") {
    return "cache-first"; // Prefer cache on poor connections
  }

  if (status.saveData) {
    return "cache-first"; // Save data mode - use cache
  }

  return "network-first"; // Default to network first
}

/**
 * Listen to network status changes
 */
export function onNetworkStatusChange(
  callback: (status: NetworkStatus) => void,
): () => void {
  const handleOnline = () => callback(getNetworkStatus());
  const handleOffline = () => callback(getNetworkStatus());
  const handleConnectionChange = () => callback(getNetworkStatus());

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  type NavigatorWithConnection = Navigator & {
    connection?: any;
    mozConnection?: any;
    webkitConnection?: any;
  };

  const nav = navigator as NavigatorWithConnection;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;
  if (connection) {
    connection.addEventListener("change", handleConnectionChange);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    if (connection) {
      connection.removeEventListener("change", handleConnectionChange);
    }
  };
}

/**
 * Wait for network to be online
 * Returns a promise that resolves when network becomes available
 */
export function waitForOnline(timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Network timeout - still offline"));
    }, timeout);

    const handleOnline = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      window.removeEventListener("online", handleOnline);
    };

    window.addEventListener("online", handleOnline);
  });
}

/**
 * Estimate if request will succeed based on network status
 */
export function estimateRequestSuccess(): number {
  const status = getNetworkStatus();

  if (status.quality === "offline") {
    return 0; // 0% chance
  }

  if (status.quality === "poor") {
    return 0.5; // 50% chance
  }

  if (status.quality === "good") {
    return 0.8; // 80% chance
  }

  return 0.95; // 95% chance for excellent
}

/**
 * Check if should attempt network request
 * Based on network quality and previous failures
 */
export function shouldAttemptNetworkRequest(failureCount: number = 0): boolean {
  const status = getNetworkStatus();

  // Always fail if offline
  if (!status.online) {
    return false;
  }

  // Too many failures - don't try
  if (failureCount >= 3) {
    return false;
  }

  // Poor connection and already failed once - don't try
  if (status.quality === "poor" && failureCount > 0) {
    return false;
  }

  return true;
}

/**
 * Format network status for display
 */
export function formatNetworkStatus(status: NetworkStatus): string {
  if (!status.online) {
    return "Offline";
  }

  const parts: string[] = [];

  // Connection type
  if (status.type !== "unknown") {
    parts.push(status.type.toUpperCase());
  }

  // Quality indicator
  switch (status.quality) {
    case "excellent":
      parts.push("(Sangat Baik)");
      break;
    case "good":
      parts.push("(Baik)");
      break;
    case "poor":
      parts.push("(Lambat)");
      break;
  }

  // Save data mode
  if (status.saveData) {
    parts.push("Mode Hemat Data");
  }

  return parts.join(" ") || "Online";
}

/**
 * Get network status indicator color
 */
export function getNetworkStatusColor(status: NetworkStatus): string {
  if (!status.online) {
    return "text-red-600";
  }

  switch (status.quality) {
    case "excellent":
      return "text-green-600";
    case "good":
      return "text-blue-600";
    case "poor":
      return "text-orange-600";
    default:
      return "text-gray-600";
  }
}
