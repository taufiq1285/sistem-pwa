import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppRouter } from '@/routes';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useEffect } from 'react';
import errorLogger from '@/lib/utils/error-logger';
import { initializeCacheManager } from '@/lib/utils/cache-manager';

function App() {
  // Initialize cache manager and error logger
  useEffect(() => {
    // Clear old cache on version update
    initializeCacheManager();

    // Initialize error logger
    errorLogger.init({
      enabled: !import.meta.env.DEV, // Enable in production only
      environment: import.meta.env.MODE || 'development',
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
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;