import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { OfflineProvider } from "@/providers/OfflineProvider";
import { SyncProvider } from "@/providers/SyncProvider";
import { AppRouter } from "@/routes";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { useEffect } from "react";
import errorLogger from "@/lib/utils/error-logger";
import { initializeCacheManager } from "@/lib/utils/cache-manager";

function App() {
  // Initialize cache manager and error logger
  useEffect(() => {
    // Clear old cache on version updatec
    initializeCacheManager();

    // Initialize error logger
    errorLogger.init({
      enabled: !import.meta.env.DEV, // Enable in production only
      environment: import.meta.env.MODE || "development",
      release: import.meta.env.VITE_APP_VERSION,
      sampleRate: 1.0, // Log all errors (adjust for production)
      // dsn: 'YOUR_SENTRY_DSN_HERE', // Uncomment to enable Sentry
      beforeSend: (log) => {
        // Filter out non-critical errors if needed
        // return null to skip logging
        return log;
      },
    });
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <NotificationProvider>
            <OfflineProvider>
              <SyncProvider autoSync={true}>
                <AuthProvider>
                  <OfflineIndicator position="top" hideWhenOnline={true} />
                  <AppRouter />
                </AuthProvider>
              </SyncProvider>
            </OfflineProvider>
          </NotificationProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
