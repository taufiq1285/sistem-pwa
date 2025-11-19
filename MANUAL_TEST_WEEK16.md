# Week 16 Manual Testing Guide

Panduan untuk melakukan manual testing Week 16: Offline Infrastructure

## Prerequisites

1. Start development server: `npm run dev`
2. Open browser: http://localhost:5173
3. Open DevTools (F12)

---

## Test 1: IndexedDB - Write & Read ✓

### Test Write to IndexedDB

**Console Commands:**
```javascript
// Import IndexedDB Manager
import { indexedDBManager } from './src/lib/offline/indexeddb';

// Initialize
await indexedDBManager.initialize();

// Write test data
const testData = {
  id: 'test-1',
  name: 'Test Item',
  timestamp: Date.now()
};

await indexedDBManager.create('sync_queue', testData);
console.log('✅ Data written to IndexedDB');
```

**Expected Result:**
- Console shows: `✅ Data written to IndexedDB`
- No errors

**DevTools Verification:**
1. Go to: **Application** tab
2. Expand: **IndexedDB** → **praktikum-offline-db** → **sync_queue**
3. See: Your test data with id 'test-1'

---

### Test Read from IndexedDB

**Console Commands:**
```javascript
// Read the data we just created
const data = await indexedDBManager.read('sync_queue', 'test-1');
console.log('✅ Data read from IndexedDB:', data);

// Read all items
const allData = await indexedDBManager.getAll('sync_queue');
console.log('✅ All data:', allData);
```

**Expected Result:**
- Console shows the test data object
- `name: 'Test Item'` is visible

---

## Test 2: Network Status Detection ✓

### Test Network Detector

**Console Commands:**
```javascript
// Import Network Detector
import { networkDetector } from './src/lib/offline/network-detector';

// Initialize
networkDetector.initialize();

// Check current status
console.log('Network Status:', networkDetector.getStatus());
console.log('Is Online:', networkDetector.isOnline());

// Listen to changes
networkDetector.on((event) => {
  console.log('Network changed:', event);
});
```

**Manual Test:**
1. Open DevTools → **Network** tab
2. Set throttling to **Offline**
3. Watch console for network change event
4. Set back to **No throttling**
5. Watch console for online event

**Expected Result:**
- Console shows: `Network changed: { status: 'offline', ... }`
- Then shows: `Network changed: { status: 'online', ... }`

---

## Test 3: Queue Manager - Store Items ✓

### Test Queue Storage

**Console Commands:**
```javascript
// Import Queue Manager
import { queueManager } from './src/lib/offline/queue-manager';

// Initialize
await queueManager.initialize();

// Add items to queue
await queueManager.enqueue('kuis', 'create', {
  title: 'Test Quiz',
  questions: 5
});

await queueManager.enqueue('materi', 'update', {
  id: 'mat-1',
  title: 'Updated Material'
});

// Check queue stats
const stats = await queueManager.getStats();
console.log('✅ Queue Stats:', stats);
```

**Expected Result:**
- Console shows stats with:
  - `total: 2`
  - `pending: 2`
  - Items stored in queue

**DevTools Verification:**
1. **Application** tab → **IndexedDB** → **praktikum-offline-db** → **sync_queue**
2. See 2 items in the queue

---

## Test 4: Service Worker Registration ✓

### Test SW Registration

**Browser Steps:**
1. Open DevTools
2. Go to **Application** tab
3. Click **Service Workers** (left sidebar)

**Expected Result:**
- See: Service worker registered
- Status: **activated and is running**
- Source: `/sw.js`
- Scope: `http://localhost:5173/`

**Console Verification:**
```javascript
// Check if SW is registered
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) {
    console.log('✅ Service Worker registered');
    console.log('Scope:', reg.scope);
    console.log('Active:', reg.active);
  } else {
    console.log('❌ No Service Worker registered');
  }
});
```

---

## Test 5: Static Assets Cached ✓

### Test Cache Storage

**DevTools Steps:**
1. Go to **Application** tab
2. Expand **Cache Storage** (left sidebar)
3. Look for caches starting with `praktikum-pwa-`

**Expected Caches:**
- `praktikum-pwa-static-v1.0.0`
- `praktikum-pwa-dynamic-v1.0.0`
- `praktikum-pwa-api-v1.0.0`
- `praktikum-pwa-images-v1.0.0`
- `praktikum-pwa-fonts-v1.0.0`

**Console Verification:**
```javascript
// Check cache names
caches.keys().then(names => {
  console.log('✅ Available caches:', names);
});

// Check static cache contents
caches.open('praktikum-pwa-static-v1.0.0').then(cache => {
  cache.keys().then(requests => {
    console.log('✅ Cached assets:', requests.map(r => r.url));
  });
});
```

**Test Offline Access:**
1. With DevTools open, go to **Network** tab
2. Check **Offline** checkbox
3. Refresh the page (Ctrl+R)
4. If assets are cached properly, page should still load from cache

---

## Test 6: Network First Strategy (API Calls) ✓

### Test API Caching

**Simulate API Call:**
```javascript
// Make an API call (will be cached)
fetch('/api/ping', { method: 'HEAD' })
  .then(() => console.log('✅ API call successful'))
  .catch(() => console.log('⚠️ API call failed (expected if no server)'));
```

**Test Offline API:**
1. Make the API call while **online**
2. Go offline (DevTools Network → Offline)
3. Make the same API call again
4. Should get cached response

---

## Test 7: Cache First Strategy (Images) ✓

### Test Image Caching

**Load an Image:**
```html
<!-- Add to your HTML or console -->
const img = new Image();
img.src = 'https://via.placeholder.com/150';
img.onload = () => console.log('✅ Image loaded');
document.body.appendChild(img);
```

**Verify Caching:**
1. Load image while online
2. Check **Application** → **Cache Storage** → **praktikum-pwa-images-v1.0.0**
3. See the image URL cached
4. Go offline and reload - image should still appear

---

## Test 8: Background Sync ✓

### Test Queue Processing

**Console Commands:**
```javascript
import { queueManager } from './src/lib/offline/queue-manager';

// Set a processor
queueManager.setProcessor(async (item) => {
  console.log('Processing:', item);
  // Simulate async work
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Process the queue
const result = await queueManager.processQueue();
console.log('✅ Process Result:', result);
```

**Expected Result:**
- Console shows each item being processed
- Result shows: `{ processed: 2, succeeded: 2, failed: 0 }`

---

## Cleanup After Testing

**Clear Test Data:**
```javascript
// Clear IndexedDB
await indexedDBManager.clear('sync_queue');

// Clear all caches
await caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Unregister Service Worker
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) reg.unregister();
});

console.log('✅ All test data cleared');
```

---

## Quick Test Script

**Run all tests at once:**
```javascript
// Copy-paste this into DevTools Console

async function runWeek16Tests() {
  console.log('🧪 Starting Week 16 Manual Tests...\n');

  try {
    // 1. IndexedDB Test
    const { indexedDBManager } = await import('./src/lib/offline/indexeddb');
    await indexedDBManager.initialize();
    await indexedDBManager.create('sync_queue', { id: 'test-1', name: 'Test' });
    const data = await indexedDBManager.read('sync_queue', 'test-1');
    console.log('✅ Test 1: IndexedDB Write/Read -', data ? 'PASSED' : 'FAILED');

    // 2. Network Detector Test
    const { networkDetector } = await import('./src/lib/offline/network-detector');
    networkDetector.initialize();
    const status = networkDetector.getStatus();
    console.log('✅ Test 2: Network Detection -', status ? 'PASSED' : 'FAILED');

    // 3. Queue Manager Test
    const { queueManager } = await import('./src/lib/offline/queue-manager');
    await queueManager.initialize();
    await queueManager.enqueue('test', 'create', { test: true });
    const stats = await queueManager.getStats();
    console.log('✅ Test 3: Queue Storage -', stats.total > 0 ? 'PASSED' : 'FAILED');

    // 4. Service Worker Test
    const swReg = await navigator.serviceWorker.getRegistration();
    console.log('✅ Test 4: Service Worker -', swReg ? 'PASSED' : 'FAILED');

    // 5. Cache Test
    const cacheNames = await caches.keys();
    console.log('✅ Test 5: Caches Created -', cacheNames.length > 0 ? 'PASSED' : 'FAILED');

    console.log('\n🎉 All tests completed!\n');
    console.log('Cache names:', cacheNames);
    console.log('Queue stats:', stats);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runWeek16Tests();
```

---

## Checklist

Use this checklist while testing:

### Manual Testing
- [ ] Can write to IndexedDB (DevTools check)
- [ ] Can read from IndexedDB
- [ ] Network status detected correctly
- [ ] Queue stores items
- [ ] Service Worker registered (DevTools check)
- [ ] Static assets cached
- [ ] API responses cached (Network First)
- [ ] Images cached (Cache First)
- [ ] Offline page shows when offline

### Unit Tests
- [✓] indexeddb.test.ts: 79% coverage (54 tests passing)
- [✓] network-detector.test.ts: 99% coverage (47 tests passing)
- [✓] queue-manager.test.ts: 94.77% coverage (47 tests passing)
- [✓] cache-strategies.test.ts: 83.07% coverage (35 tests passing)

---

## Troubleshooting

### Service Worker not registering
- Check console for errors
- Make sure you're on `localhost` or `HTTPS`
- Clear browser cache and reload

### IndexedDB not working
- Check if IndexedDB is enabled in browser
- Clear IndexedDB and try again
- Check console for errors

### Caches not created
- Service Worker must be active first
- Check Application → Service Workers → Status
- Wait a few seconds after page load

### Network detector not working
- Make sure `networkDetector.initialize()` was called
- Check browser compatibility for Network Information API
- Some features may not work in all browsers

---

## Success Criteria

All tests should show:
- ✅ Green checkmarks in console
- No red errors
- Data visible in DevTools
- Service Worker status: **activated and is running**
- At least 5 caches created
- Queue items stored in IndexedDB
