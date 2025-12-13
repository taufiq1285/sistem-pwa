/**
 * Error Logger Service
 * Centralized error logging for production monitoring
 * Supports integration with Sentry, LogRocket, or custom logging services
 */

import type { ErrorInfo } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorLog {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLoggerConfig {
  enabled: boolean;
  dsn?: string; // Sentry DSN or other service endpoint
  environment: string;
  release?: string;
  sampleRate?: number;
  beforeSend?: (log: ErrorLog) => ErrorLog | null;
}

// ============================================================================
// ERROR LOGGER CLASS
// ============================================================================

class ErrorLogger {
  private config: ErrorLoggerConfig;
  private queue: ErrorLog[] = [];
  private readonly MAX_QUEUE_SIZE = 50;

  constructor() {
    this.config = {
      enabled: !import.meta.env.DEV,
      environment: import.meta.env.MODE || "development",
      release: import.meta.env.VITE_APP_VERSION,
      sampleRate: 1.0,
    };
  }

  /**
   * Initialize error logger with config
   */
  init(config: Partial<ErrorLoggerConfig>) {
    this.config = { ...this.config, ...config };

    // Initialize external service if DSN provided
    if (this.config.enabled && this.config.dsn) {
      this.initializeExternalService();
    }

    // Setup global error handlers
    this.setupGlobalHandlers();

    console.log("✅ Error Logger initialized", {
      enabled: this.config.enabled,
      environment: this.config.environment,
    });
  }

  /**
   * Log React error boundary errors
   */
  logReactError(
    error: Error,
    errorInfo: ErrorInfo,
    metadata?: Record<string, any>,
  ) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata: {
        ...metadata,
        errorType: "React Error Boundary",
        errorName: error.name,
      },
    };

    this.sendLog(errorLog);
  }

  /**
   * Log JavaScript errors
   */
  logJSError(error: Error | ErrorEvent, metadata?: Record<string, any>) {
    const err = error instanceof ErrorEvent ? error.error : error;

    const errorLog: ErrorLog = {
      message: err?.message || "Unknown JavaScript error",
      stack: err?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata: {
        ...metadata,
        errorType: "JavaScript Error",
        errorName: err?.name,
      },
    };

    this.sendLog(errorLog);
  }

  /**
   * Log promise rejection errors
   */
  logPromiseRejection(reason: any, metadata?: Record<string, any>) {
    const errorLog: ErrorLog = {
      message:
        reason?.message ||
        (reason != null ? String(reason) : "Unhandled Promise Rejection"),
      stack: reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata: {
        ...metadata,
        errorType: "Unhandled Promise Rejection",
        reason: String(reason),
      },
    };

    this.sendLog(errorLog);
  }

  /**
   * Log custom errors
   */
  logError(error: Error | string, metadata?: Record<string, any>) {
    const err = typeof error === "string" ? new Error(error) : error;

    const errorLog: ErrorLog = {
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata: {
        ...metadata,
        errorType: "Custom Error",
      },
    };

    this.sendLog(errorLog);
  }

  /**
   * Send error log
   */
  private sendLog(log: ErrorLog) {
    // Apply beforeSend hook
    if (this.config.beforeSend) {
      const processedLog = this.config.beforeSend(log);
      if (!processedLog) return; // beforeSend returned null, skip logging
      log = processedLog;
    }

    // Check sample rate
    if (Math.random() > (this.config.sampleRate ?? 1.0)) {
      return; // Skip this error based on sample rate
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group("🔴 Error Logged");
      console.error("Message:", log.message);
      console.error("Stack:", log.stack);
      console.error("Component Stack:", log.componentStack);
      console.error("Metadata:", log.metadata);
      console.groupEnd();
    }

    // Add to queue
    this.addToQueue(log);

    // Send to external service if enabled
    if (this.config.enabled && this.config.dsn) {
      this.sendToExternalService(log);
    }
  }

  /**
   * Add error to local queue
   */
  private addToQueue(log: ErrorLog) {
    this.queue.push(log);

    // Maintain max queue size
    if (this.queue.length > this.MAX_QUEUE_SIZE) {
      this.queue.shift();
    }

    // Store in localStorage for debugging
    try {
      localStorage.setItem("error_logs", JSON.stringify(this.queue.slice(-10)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Get error logs from queue
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.queue];
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    this.queue = [];
    try {
      localStorage.removeItem("error_logs");
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Initialize external error tracking service
   */
  private initializeExternalService() {
    // TODO: Initialize Sentry or other error tracking service
    // Example for Sentry:
    /*
    import * as Sentry from '@sentry/react';

    Sentry.init({
      dsn: this.config.dsn,
      environment: this.config.environment,
      release: this.config.release,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
    */

    console.log("📡 External error service configured (not yet implemented)");
  }

  /**
   * Send error to external service
   */
  private sendToExternalService(log: ErrorLog) {
    // TODO: Send to Sentry or other service
    // Example for Sentry:
    /*
    import * as Sentry from '@sentry/react';

    Sentry.captureException(new Error(log.message), {
      extra: log.metadata,
      contexts: {
        error: {
          stack: log.stack,
          componentStack: log.componentStack,
        },
      },
    });
    */

    // Fallback: Send to custom endpoint
    if (this.config.dsn && !this.config.dsn.includes("sentry")) {
      this.sendToCustomEndpoint(log);
    }
  }

  /**
   * Send error to custom logging endpoint
   */
  private async sendToCustomEndpoint(log: ErrorLog) {
    try {
      await fetch(this.config.dsn!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(log),
      });
    } catch (error) {
      // Silently fail - don't want error logger to cause errors
      console.warn("Failed to send error log to custom endpoint", error);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers() {
    // Handle uncaught JavaScript errors
    window.addEventListener("error", (event: ErrorEvent) => {
      event.preventDefault(); // Prevent default browser error handling
      this.logJSError(event);
    });

    // Handle unhandled promise rejections
    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent) => {
        event.preventDefault(); // Prevent default browser error handling
        this.logPromiseRejection(event.reason);
      },
    );
  }

  /**
   * Set user context for error logs
   */
  setUser(userId: string, metadata?: Record<string, any>) {
    // Store user context for future error logs
    // TODO: If using Sentry, call Sentry.setUser()
    try {
      localStorage.setItem(
        "error_logger_user",
        JSON.stringify({ userId, ...metadata }),
      );
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    try {
      localStorage.removeItem("error_logger_user");
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(
    message: string,
    category?: string,
    data?: Record<string, any>,
  ) {
    // TODO: If using Sentry, call Sentry.addBreadcrumb()
    if (import.meta.env.DEV) {
      console.log("🍞 Breadcrumb:", { message, category, data });
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const errorLogger = new ErrorLogger();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Log React error boundary errors
 */
export function logReactError(
  error: Error,
  errorInfo: ErrorInfo,
  metadata?: Record<string, any>,
) {
  errorLogger.logReactError(error, errorInfo, metadata);
}

/**
 * Log custom errors
 */
export function logError(
  error: Error | string,
  metadata?: Record<string, any>,
) {
  errorLogger.logError(error, metadata);
}

/**
 * Set user context
 */
export function setErrorUser(userId: string, metadata?: Record<string, any>) {
  errorLogger.setUser(userId, metadata);
}

/**
 * Clear user context
 */
export function clearErrorUser() {
  errorLogger.clearUser();
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, any>,
) {
  errorLogger.addBreadcrumb(message, category, data);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default errorLogger;
