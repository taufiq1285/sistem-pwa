import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/pwa/register-sw'

// Render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker (PRODUCTION ONLY)
const isDevelopment = import.meta.env.DEV

if (!isDevelopment) {
  // Production: Enable full SW functionality
  registerServiceWorker({
    onSuccess: (registration) => {
      console.log('✅ Service Worker registered successfully')
      console.log('Scope:', registration.scope)
    },
    onUpdate: (registration) => {
      console.log('🔄 New service worker version available')

      if (confirm('New version available! Reload to update?')) {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }
    },
    onError: (error) => {
      console.error('❌ Service Worker registration failed:', error)
    },
    enableAutoUpdate: true,
    checkUpdateInterval: 60 * 60 * 1000, // Check every hour
  })
} else {
  // Development: Disable SW to avoid update loops and HMR issues
  console.log('🔧 Development Mode: Service Worker disabled')
  console.log('💡 To test PWA features, run: npm run build && npm run preview')

  // Unregister any existing service workers from previous sessions
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister()
        console.log('🗑️ Unregistered old service worker')
      })
    })
  }
}
