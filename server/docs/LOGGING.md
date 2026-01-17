# Logging Configuration

## Overview

The application uses a conditional logging system that reduces console noise in production while keeping helpful debugging information in development.

## Logging Levels

### 1. **Development Mode** (Default)
When running `npm run dev`, you'll see:
- ✅ Important auth events (login, logout)
- ❌ No verbose debugging logs (unless enabled)
- ✅ All errors and warnings

### 2. **Production Mode**
When built with `npm run build`:
- ❌ No info/debug logs
- ✅ Errors and warnings only

## Controlling Logs

### Enable All Debug Logs
Open browser console and run:
```javascript
localStorage.setItem('debug', 'true')
```
Then refresh the page. You'll see detailed logs for everything.

### Disable Auth Logs
If auth logs are too verbose:
```javascript
localStorage.setItem('debug_auth', 'false')
```

### Reset to Default
```javascript
localStorage.removeItem('debug')
localStorage.removeItem('debug_auth')
```

## Logger API

```typescript
import logger from '@/lib/utils/logger';

// Only in development
logger.info('Something happened');

// Always logged
logger.error('Error occurred');
logger.warn('Warning message');

// Only when debug=true
logger.debug('Detailed debugging info');

// Auth-specific (controlled by debug_auth)
logger.auth('User logged in', { userId: '123' });

// Grouped logs
logger.group('My Group');
logger.info('Nested log');
logger.groupEnd();
```

## Why Some Logs Appear Twice?

In development, React 18 **Strict Mode** runs effects twice to detect bugs. This is normal behavior and only happens in development.

To disable Strict Mode (not recommended), edit `src/main.tsx`:

```tsx
// Before
<React.StrictMode>
  <App />
</React.StrictMode>

// After
<App />
```

## Log Meanings

### Auth Logs

| Log | Meaning |
|-----|---------|
| `🔐 login: START` | User attempting to login |
| `🔐 login: Success ✅` | Login successful |
| `🔐 getSession: User loaded ✅` | Session loaded from cache/database |
| `🔐 Using cached auth ⚡` | **Fast!** Loaded from localStorage |
| `🔐 getUserProfile: SUCCESS ✅` | User profile fetched |

### Why `onAuthStateChange`?

This is Supabase's listener that detects:
- ✅ Login events
- ✅ Logout events
- 🔄 Token refresh
- 🔄 Session expiry

**It's important** because it keeps your auth state synced across tabs!

## Best Practices

1. **Development:** Keep default settings (some auth logs, no debug logs)
2. **Debugging:** Enable `debug=true` only when needed
3. **Production:** Logs are automatically minimal
4. **CI/CD:** Set `NODE_ENV=production` to disable all dev logs

## Environment Variables

```env
# .env.development
VITE_LOG_LEVEL=debug

# .env.production
VITE_LOG_LEVEL=error
```

## Performance Impact

- **With caching:** Auth loads in ~50ms (instant!)
- **Without caching:** Auth loads in 2-3s (first visit only)
- **Logging overhead:** Negligible (~1-2ms per log)

## Troubleshooting

### Too many logs?
```javascript
localStorage.setItem('debug_auth', 'false')
```

### Not seeing any logs?
Check if you're in production mode:
```javascript
console.log(import.meta.env.MODE) // Should be 'development'
```

### Want completely silent console?
Not recommended, but you can:
```typescript
// src/lib/utils/logger.ts
const isDevelopment = false; // Force disable
```

---

**Pro Tip:** Use browser's console filter to hide specific logs!

Filter examples:
- Hide auth logs: `-🔐`
- Show only errors: `level:error`
- Show only auth: `🔐`
