/**
 * Service Worker for PWA Sistem Praktikum
 * 
 * CRITICAL: This file MUST be at root level
 * Location: /sw.js
 * 
 * Features:
 * - Static asset caching
 * - API response caching
 * - Offline fallback
 * - Background sync
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `praktikum-pwa-${CACHE_VERSION}`;

// TODO: Implement cache strategies
// TODO: Implement background sync
// TODO: Implement offline fallback

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  // TODO: Cache static assets
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  // TODO: Clean old caches
});

self.addEventListener('fetch', (event) => {
  // TODO: Implement fetch strategy
});

self.addEventListener('sync', (event) => {
  // TODO: Implement background sync
});