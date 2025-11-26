import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/pwa/register-sw'
import { initializeSyncManager } from './lib/offline/sync-manager'
import { logger } from '@/lib/utils/logger'

// Render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker (PRODUCTION ONLY)
const isDevelopment = import.meta.env.DEV

// Flag to prevent handling update multiple times
let updateHandled = false

if (!isDevelopment) {
  // Production: Enable full SW functionality
  registerServiceWorker({
    onSuccess: (registration) => {
      logger.info('Service Worker registered successfully')
      logger.info('Scope:', registration.scope)

      // Initialize sync manager after SW is ready
      initializeSyncManager().catch((error) => {
        logger.error('Failed to initialize sync manager:', error)
      })
    },
    onUpdate: (registration) => {
      // Prevent handling the same update multiple times
      if (updateHandled) {
        logger.info('[SW] Update already handled, skipping...')
        return
      }

      updateHandled = true

      logger.info('New service worker version available')
      logger.info('Refresh page to activate new version')

      // Auto-activate update without prompting
      // This will reload the page once via controllerchange event
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        logger.info('New version will activate on next page load')
      }
    },
    onError: (error) => {
      logger.error('Service Worker registration failed:', error)
    },
    enableAutoUpdate: false, // Disabled to prevent update loops
    checkUpdateInterval: 60 * 60 * 1000, // Check every hour
  })
} else {
  // Development: Disable SW to avoid update loops and HMR issues
  logger.info('Development Mode: Service Worker disabled')
  logger.info('To test PWA features, run: npm run build && npm run preview')

  // Unregister any existing service workers from previous sessions
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister()
        logger.info('Unregistered old service worker')
      })
    })
  }
}
