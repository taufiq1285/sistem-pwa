/**
 * Network Detector
 *
 * Detects and monitors network connectivity status
 * - Listen to online/offline events
 * - Ping test for connectivity validation
 * - Network quality check (latency, speed)
 * - Event emitter for state changes
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Network status
 */
export type NetworkStatus = "online" | "offline" | "unstable";

/**
 * Connection type from Network Information API
 */
export type ConnectionType =
  | "slow-2g"
  | "2g"
  | "3g"
  | "4g"
  | "wifi"
  | "ethernet"
  | "unknown";

/**
 * Network quality metrics
 */
export interface NetworkQuality {
  latency: number; // in milliseconds
  downlink: number; // in Mbps
  effectiveType: ConnectionType;
  saveData: boolean;
  rtt: number; // Round-trip time in ms
}

/**
 * Network change event
 */
export interface NetworkChangeEvent {
  status: NetworkStatus;
  isOnline: boolean;
  quality?: NetworkQuality;
  timestamp: number;
}

/**
 * Network detector configuration
 */
export interface NetworkDetectorConfig {
  pingUrl?: string;
  pingInterval?: number; // in milliseconds
  pingTimeout?: number; // in milliseconds
  enableQualityCheck?: boolean;
  enablePeriodicCheck?: boolean;
  onStatusChange?: (event: NetworkChangeEvent) => void;
}

/**
 * Event listener callback
 */
type NetworkEventListener = (event: NetworkChangeEvent) => void;

// ============================================================================
// NETWORK DETECTOR CLASS
// ============================================================================

/**
 * NetworkDetector class
 * Monitors network connectivity and quality
 */
export class NetworkDetector {
  private config: Required<NetworkDetectorConfig>;
  private currentStatus: NetworkStatus = "online";
  private listeners: Set<NetworkEventListener> = new Set();
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  constructor(config: NetworkDetectorConfig = {}) {
    this.config = {
      pingUrl: config.pingUrl || "/api/ping",
      pingInterval: config.pingInterval || 30000, // 30 seconds
      pingTimeout: config.pingTimeout || 5000, // 5 seconds
      enableQualityCheck: config.enableQualityCheck ?? true,
      enablePeriodicCheck: config.enablePeriodicCheck ?? true,
      onStatusChange: config.onStatusChange || (() => {}),
    };

    // Set initial status based on navigator.onLine
    this.currentStatus = this.getInitialStatus();
  }

  /**
   * Get initial network status from browser
   */
  private getInitialStatus(): NetworkStatus {
    if (typeof navigator === "undefined") return "online";
    return navigator.onLine ? "online" : "offline";
  }

  /**
   * Initialize network detector
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn("NetworkDetector already initialized");
      return;
    }

    // Listen to browser online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }

    // Start periodic ping checks if enabled
    if (this.config.enablePeriodicCheck) {
      this.startPeriodicCheck();
    }

    this.isInitialized = true;
    console.log("✅ NetworkDetector initialized");

    // Emit initial status
    this.emitStatusChange(this.currentStatus, true);
  }

  /**
   * Cleanup and stop network detector
   */
  destroy(): void {
    if (!this.isInitialized) return;

    // Remove event listeners
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }

    // Stop periodic checks
    this.stopPeriodicCheck();

    // Clear listeners
    this.listeners.clear();

    this.isInitialized = false;
    console.log("🛑 NetworkDetector destroyed");
  }

  /**
   * Handle browser online event
   */
  private handleOnline = async (): Promise<void> => {
    console.log("📶 Browser online event detected");

    // Verify with ping test
    const isReachable = await this.ping();

    if (isReachable) {
      this.updateStatus("online");
    } else {
      this.updateStatus("unstable");
    }
  };

  /**
   * Handle browser offline event
   */
  private handleOffline = (): void => {
    console.log("📵 Browser offline event detected");
    this.updateStatus("offline");
  };

  /**
   * Update network status and emit change event
   */
  private updateStatus(newStatus: NetworkStatus): void {
    if (this.currentStatus === newStatus) return;

    const previousStatus = this.currentStatus;
    this.currentStatus = newStatus;

    console.log(`🔄 Network status changed: ${previousStatus} → ${newStatus}`);

    this.emitStatusChange(newStatus);
  }

  /**
   * Emit status change event to all listeners
   */
  private emitStatusChange(
    status: NetworkStatus,
    skipQualityCheck = false
  ): void {
    const event: NetworkChangeEvent = {
      status,
      isOnline: status === "online",
      timestamp: Date.now(),
    };

    // Add quality metrics if enabled and online
    if (
      this.config.enableQualityCheck &&
      !skipQualityCheck &&
      status !== "offline"
    ) {
      event.quality = this.checkQuality();
    }

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in network listener:", error);
      }
    });

    // Call config callback
    if (this.config.onStatusChange) {
      this.config.onStatusChange(event);
    }
  }

  /**
   * Start periodic ping checks
   */
  private startPeriodicCheck(): void {
    if (this.pingIntervalId) return;

    this.pingIntervalId = setInterval(async () => {
      // Only check if browser thinks we're online
      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      const isReachable = await this.ping();

      if (isReachable) {
        if (this.currentStatus !== "online") {
          this.updateStatus("online");
        }
      } else {
        if (this.currentStatus === "online") {
          this.updateStatus("unstable");
        }
      }
    }, this.config.pingInterval);

    console.log(
      `⏰ Periodic network check started (interval: ${this.config.pingInterval}ms)`
    );
  }

  /**
   * Stop periodic ping checks
   */
  private stopPeriodicCheck(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
      console.log("⏸️  Periodic network check stopped");
    }
  }

  /**
   * Ping test to verify connectivity
   * Returns true if server is reachable
   */
  async ping(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.pingTimeout
      );

      const response = await fetch(this.config.pingUrl, {
        method: "HEAD",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch (error) {
      // Network error, timeout, or abort
      return false;
    }
  }

  /**
   * Check network quality using Network Information API
   */
  checkQuality(): NetworkQuality | undefined {
    // Check if Network Information API is available
    if (typeof navigator === "undefined" || !("connection" in navigator)) {
      return undefined;
    }

    try {
      // Type assertion for Network Information API (not fully supported in TypeScript)
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (!connection) return undefined;

      return {
        latency: connection.rtt || 0,
        downlink: connection.downlink || 0,
        effectiveType: this.mapEffectiveType(connection.effectiveType),
        saveData: connection.saveData || false,
        rtt: connection.rtt || 0,
      };
    } catch (error) {
      console.warn("Failed to check network quality:", error);
      return undefined;
    }
  }

  /**
   * Map effectiveType to ConnectionType
   */
  private mapEffectiveType(effectiveType: string | undefined): ConnectionType {
    if (!effectiveType) return "unknown";

    switch (effectiveType) {
      case "slow-2g":
        return "slow-2g";
      case "2g":
        return "2g";
      case "3g":
        return "3g";
      case "4g":
        return "4g";
      default:
        return "unknown";
    }
  }

  /**
   * Measure connection latency by pinging
   */
  async measureLatency(): Promise<number> {
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.pingTimeout
      );

      await fetch(this.config.pingUrl, {
        method: "HEAD",
        cache: "no-cache",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const endTime = performance.now();
      return Math.round(endTime - startTime);
    } catch (error) {
      // Return max timeout if failed
      return this.config.pingTimeout;
    }
  }

  // ============================================================================
  // EVENT EMITTER METHODS
  // ============================================================================

  /**
   * Subscribe to network status changes
   */
  on(listener: NetworkEventListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Unsubscribe from network status changes
   */
  off(listener: NetworkEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Subscribe to network status changes (one-time)
   */
  once(listener: NetworkEventListener): void {
    const wrappedListener: NetworkEventListener = (event) => {
      listener(event);
      this.off(wrappedListener);
    };

    this.on(wrappedListener);
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus === "online";
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return this.currentStatus === "offline";
  }

  /**
   * Check if network is unstable
   */
  isUnstable(): boolean {
    return this.currentStatus === "unstable";
  }

  /**
   * Get number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Check if detector is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Default network detector instance
 * Periodic ping disabled to avoid 500 errors when /api/ping doesn't exist
 */
export const networkDetector = new NetworkDetector({
  enablePeriodicCheck: false,
  enableQualityCheck: false,
});
