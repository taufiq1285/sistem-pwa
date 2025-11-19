# Error Handling System

## Overview

The application implements a comprehensive global error handling system using React ErrorBoundary and custom error logging services.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  React Application                                   │
│  ├─ Components (throw errors)                       │
│  ├─ API calls (throw errors)                        │
│  └─ Event handlers (throw errors)                   │
└─────────────┬───────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────┐
│  ErrorBoundary Component                            │
│  ├─ Catches: React render errors                    │
│  ├─ Displays: ErrorFallback UI                      │
│  └─ Logs: To error logger service                   │
└─────────────┬───────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────┐
│  Global Error Handlers                              │
│  ├─ window.onerror (JS errors)                      │
│  ├─ unhandledrejection (Promise rejections)         │
│  └─ Logs: To error logger service                   │
└─────────────┬───────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────┐
│  Error Logger Service                               │
│  ├─ Queues errors locally                           │
│  ├─ Sends to external service (Sentry, etc)         │
│  └─ Stores in localStorage for debugging            │
└─────────────────────────────────────────────────────┘
```

## Components

### 1. ErrorBoundary Component

Located: `src/components/common/ErrorBoundary.tsx`

**Features:**
- Catches React component errors during render
- Displays fallback UI when errors occur
- Supports custom error handlers via `onError` prop
- Auto-reset capability with `resetKeys` prop
- Logs errors to error logging service

**Usage:**

```tsx
// Wrap your app or specific components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>

// With custom error handler
<ErrorBoundary onError={(error, errorInfo) => {
  console.log('Custom handler', error);
}}>
  <YourComponent />
</ErrorBoundary>

// With auto-reset on prop change
<ErrorBoundary resetKeys={[userId, pageId]}>
  <YourComponent />
</ErrorBoundary>
```

### 2. ErrorFallback Component

Located: `src/components/common/ErrorFallback.tsx`

**Features:**
- User-friendly error message display
- Recovery options (Try Again, Reload, Go Home)
- Shows error stack trace in development mode
- Responsive design with Card UI

**Props:**
```typescript
interface ErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
  showDetails?: boolean; // Auto: true in dev, false in prod
  className?: string;
}
```

### 3. Error Logger Service

Located: `src/lib/utils/error-logger.ts`

**Features:**
- Centralized error logging for production monitoring
- Supports integration with Sentry, LogRocket, etc.
- Global error handlers (uncaught errors, promise rejections)
- Local error queue with localStorage persistence
- User context tracking
- Breadcrumb support for debugging
- Sample rate configuration

**Usage:**

```typescript
import errorLogger, { logError, setErrorUser } from '@/lib/utils/error-logger';

// Initialize (done in App.tsx)
errorLogger.init({
  enabled: true, // Enable in production
  environment: 'production',
  release: '1.0.0',
  sampleRate: 0.5, // Log 50% of errors
  dsn: 'YOUR_SENTRY_DSN', // Optional
  beforeSend: (log) => {
    // Filter or modify logs
    return log;
  },
});

// Log custom errors
try {
  riskyOperation();
} catch (error) {
  logError(error, { context: 'riskyOperation', userId: '123' });
}

// Set user context
setErrorUser('user-123', { email: 'user@example.com' });

// Add breadcrumbs
errorLogger.addBreadcrumb('User clicked submit button', 'user-action', {
  formId: 'login-form',
});
```

### 4. Error Utilities

Located: `src/lib/utils/errors.ts`

**Custom Error Classes:**
- `BaseApiError` - Base class for all API errors
- `NetworkError` - Network-related errors
- `TimeoutError` - Request timeout errors
- `ValidationError` - Form/data validation errors
- `AuthenticationError` - Auth failures (401)
- `AuthorizationError` - Permission denied (403)
- `NotFoundError` - Resource not found (404)
- `ConflictError` - Resource conflict (409)
- `ServerError` - Server errors (500)
- `ServiceUnavailableError` - Service down (503)
- `OfflineError` - Offline mode errors

**Utility Functions:**
```typescript
// Handle any error and convert to BaseApiError
const apiError = handleError(error);

// Map Supabase errors
const apiError = handleSupabaseError(supabaseError);

// Get user-friendly error message
const message = getErrorMessage(ApiErrorCode.NOT_FOUND);

// Check error types
if (isNetworkError(error)) { /* ... */ }
if (shouldRetry(error, attempt, maxAttempts)) { /* ... */ }
```

## Integration in App.tsx

```tsx
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import errorLogger from '@/lib/utils/error-logger';

function App() {
  useEffect(() => {
    errorLogger.init({
      enabled: !import.meta.env.DEV,
      environment: import.meta.env.MODE,
      sampleRate: 1.0,
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
```

## Testing

### Error Test Component

Located: `src/components/test/ErrorTest.tsx`

Test different error scenarios:
1. **Render Error** - Caught by ErrorBoundary
2. **Promise Rejection** - Caught by global handler
3. **JavaScript Error** - Caught by global handler
4. **Async Error** - Caught by global handler

**Usage:**
```tsx
import { ErrorTest } from '@/components/test/ErrorTest';

// Add to a development route
<Route path="/dev/error-test" element={<ErrorTest />} />
```

### Manual Testing Steps

1. **Test ErrorBoundary:**
   - Navigate to `/dev/error-test`
   - Click "Trigger Render Error"
   - Verify ErrorFallback UI displays
   - Click "Try Again" to reset
   - Verify app recovers

2. **Test Global Handlers:**
   - Click "Trigger Promise Rejection"
   - Check console for error log
   - Verify app doesn't crash
   - Check localStorage for error logs

3. **Test Production Logging:**
   - Set `NODE_ENV=production`
   - Trigger errors
   - Verify errors sent to external service
   - Check network tab for POST requests

## Production Setup

### 1. Enable Error Tracking Service

**Option A: Sentry (Recommended)**

```bash
npm install @sentry/react
```

Update `src/lib/utils/error-logger.ts`:

```typescript
import * as Sentry from '@sentry/react';

private initializeExternalService() {
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
}

private sendToExternalService(log: ErrorLog) {
  Sentry.captureException(new Error(log.message), {
    extra: log.metadata,
    contexts: {
      error: {
        stack: log.stack,
        componentStack: log.componentStack,
      },
    },
  });
}
```

**Option B: Custom Endpoint**

Set DSN to your custom logging endpoint:

```typescript
errorLogger.init({
  dsn: 'https://your-api.com/api/errors',
  // ...
});
```

### 2. Configure in App.tsx

```typescript
errorLogger.init({
  enabled: !import.meta.env.DEV,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  dsn: import.meta.env.VITE_SENTRY_DSN, // From .env
  sampleRate: 0.5, // Adjust based on traffic
  beforeSend: (log) => {
    // Filter sensitive data
    if (log.message.includes('password')) return null;
    return log;
  },
});
```

### 3. Environment Variables

Add to `.env.production`:

```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

## Best Practices

### 1. Error Handling in Components

```tsx
function MyComponent() {
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      // Log error
      logError(error, { context: 'handleSubmit' });

      // Show user-friendly message
      setError(getErrorMessage(error.code));

      // Don't throw - handle gracefully
    }
  };

  return (
    <>
      {error && <Alert variant="destructive">{error}</Alert>}
      <Button onClick={handleSubmit}>Submit</Button>
    </>
  );
}
```

### 2. Error Handling in API Calls

```typescript
export async function fetchData(): Promise<Data> {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*');

    if (error) throw handleSupabaseError(error);
    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, { context: 'fetchData' });
    throw apiError; // Re-throw for component to handle
  }
}
```

### 3. Add Context to Errors

```typescript
// Set user context after login
setErrorUser(user.id, {
  email: user.email,
  role: user.role,
});

// Add breadcrumbs for important actions
errorLogger.addBreadcrumb('Started quiz attempt', 'quiz', {
  quizId: quiz.id,
  attemptId: attempt.id,
});
```

### 4. Error Recovery

```tsx
// Use resetKeys to auto-reset ErrorBoundary
<ErrorBoundary resetKeys={[userId, quizId]}>
  <QuizComponent userId={userId} quizId={quizId} />
</ErrorBoundary>

// When userId or quizId changes, ErrorBoundary resets automatically
```

## Monitoring and Analytics

### View Error Logs

```typescript
// Get local error logs (development)
const logs = errorLogger.getErrorLogs();
console.log('Error logs:', logs);

// Clear logs
errorLogger.clearErrorLogs();

// Check localStorage
const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
```

### Production Monitoring

1. **Sentry Dashboard:**
   - View error frequency and trends
   - See affected users
   - Track error resolution
   - Set up alerts for critical errors

2. **Custom Analytics:**
   - Query your error logging endpoint
   - Build dashboards with error metrics
   - Set up alerts for error spikes

## Troubleshooting

### ErrorBoundary Not Catching Errors

**Problem:** Error not caught by ErrorBoundary

**Causes:**
- Error occurs in event handler (not during render)
- Error occurs in async code
- Error occurs outside React tree

**Solution:** Use try/catch in event handlers and async functions

```tsx
// ❌ Not caught by ErrorBoundary
<button onClick={() => throw new Error('error')}>Click</button>

// ✅ Handle manually
<button onClick={() => {
  try {
    throw new Error('error');
  } catch (error) {
    logError(error);
  }
}}>Click</button>
```

### Errors Not Logged to External Service

**Problem:** Errors not appearing in Sentry/logging service

**Checks:**
1. Verify DSN is correct
2. Check `enabled` is true in production
3. Verify network requests in DevTools
4. Check `beforeSend` not filtering all errors
5. Verify error tracking service is configured

### Too Many Error Logs

**Problem:** Too many errors logged, high costs

**Solutions:**
1. Adjust `sampleRate` (e.g., 0.1 = 10%)
2. Filter errors in `beforeSend`
3. Set up error rate limits in Sentry

```typescript
errorLogger.init({
  sampleRate: 0.1, // Log only 10%
  beforeSend: (log) => {
    // Ignore non-critical errors
    if (log.message.includes('Warning')) return null;
    return log;
  },
});
```

## Files Modified/Created

### Created:
- ✅ `src/lib/utils/error-logger.ts` - Error logging service
- ✅ `src/components/test/ErrorTest.tsx` - Error testing component
- ✅ `docs/ERROR_HANDLING.md` - This documentation

### Modified:
- ✅ `src/App.tsx` - Added ErrorBoundary wrapper and error logger initialization
- ✅ `src/components/common/ErrorBoundary.tsx` - Integrated error logger

### Already Existed (No changes needed):
- ✅ `src/components/common/ErrorFallback.tsx` - Error fallback UI
- ✅ `src/lib/utils/errors.ts` - Error utilities and custom error classes

## Summary

The error handling system is now fully configured with:

✅ Global ErrorBoundary wrapping the entire app
✅ User-friendly error fallback UI
✅ Comprehensive error logging service
✅ Global error handlers for uncaught errors
✅ Custom error classes for API errors
✅ Test component for verification
✅ Production-ready with Sentry support
✅ Complete documentation

All errors are now caught, logged, and displayed gracefully to users!
