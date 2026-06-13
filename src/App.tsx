import { ThemeProvider } from "@/providers/ThemeProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { OfflineProvider } from "@/providers/OfflineProvider";
import { SyncProvider } from "@/providers/SyncProvider";
import { AppRouter } from "@/routes";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import errorLogger from "@/lib/utils/error-logger";
import { initializeCacheManager } from "@/lib/utils/cache-manager";
import { useRoleTheme } from "@/lib/hooks/useRoleTheme";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RoleThemeBridge() {
  useRoleTheme();
  return null;
}

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
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <OfflineProvider>
              <SyncProvider autoSync={true}>
                <AuthProvider>
                  <RoleThemeBridge />
                  <OfflineIndicator position="top" hideWhenOnline={true} />
                  <PWAInstallPrompt />
                  <AnimatePresence mode="wait">
                    <AppRouter />
                  </AnimatePresence>
                </AuthProvider>
              </SyncProvider>
            </OfflineProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
