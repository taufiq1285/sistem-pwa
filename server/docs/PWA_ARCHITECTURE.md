# Arsitektur PWA - Sistem Praktikum

> **Dokumentasi Lengkap: Progressive Web App (PWA) Architecture**
> Menjelaskan bagaimana sistem PWA bekerja, offline mode, dan strategi caching

---

## 📑 Daftar Isi

1. [Overview](#overview)
2. [Konsep PWA](#konsep-pwa)
3. [Arsitektur Sistem](#arsitektur-sistem)
4. [Login & Autentikasi](#login--autentikasi)
5. [Offline vs Online Mode](#offline-vs-online-mode)
6. [Flow Diagram](#flow-diagram)
7. [Data Storage](#data-storage)
8. [Implementasi Saat Ini](#implementasi-saat-ini)
9. [Best Practices](#best-practices)

---

## Overview

Sistem Praktikum PWA adalah aplikasi web yang dapat bekerja secara offline menggunakan teknologi Progressive Web App. Aplikasi ini menggunakan:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Auth + Database + Storage)
- **PWA Infrastructure**: Service Worker + IndexedDB + Cache API
- **Offline Support**: Network Detector + Queue Manager

---

## Konsep PWA

### Apa itu PWA?

Progressive Web App (PWA) adalah aplikasi web yang menggunakan teknologi modern untuk memberikan pengalaman seperti aplikasi native:

- ✅ **Installable**: Bisa di-install ke home screen
- ✅ **Offline-capable**: Bisa jalan tanpa internet (dengan batasan)
- ✅ **Fast**: Menggunakan cache untuk load cepat
- ✅ **Responsive**: Adaptif di semua device
- ✅ **Secure**: Harus menggunakan HTTPS

### PWA vs Web Biasa

| Fitur | Web Biasa | PWA |
|-------|-----------|-----|
| Butuh internet | Selalu ✅ | Tidak selalu ❌ |
| Install ke device | Tidak ❌ | Bisa ✅ |
| Push notification | Tidak ❌ | Bisa ✅ |
| Offline mode | Tidak ❌ | Bisa ✅ |
| Cache strategy | Basic | Advanced ✅ |
| Load speed | Lambat jika koneksi jelek | Tetap cepat ✅ |

---

## Arsitektur Sistem

### Layer Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     LAYER 1: FRONTEND                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React App (Vite) - UI Components                        │  │
│  │  - LoginForm, MateriPage, KuisPage, dll                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                            ↕
┌────────────────────────────────────────────────────────────────┐
│                  LAYER 2: PWA INFRASTRUCTURE                   │
│  ┌────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Service Worker    │  │  IndexedDB                       │ │
│  │  (sw.js)           │  │  - kuis, materi, nilai, users    │ │
│  │  - Cache static    │  │  - 7 object stores               │ │
│  │  - Network First   │  │  - Offline data storage          │ │
│  │  - Offline page    │  │                                  │ │
│  └────────────────────┘  └──────────────────────────────────┘ │
│  ┌────────────────────┐  ┌──────────────────────────────────┐ │
│  │  Queue Manager     │  │  Network Detector                │ │
│  │  - Sync queue      │  │  - Online/offline detection      │ │
│  │  - Retry failed    │  │  - Quality check                 │ │
│  └────────────────────┘  └──────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                            ↕
┌────────────────────────────────────────────────────────────────┐
│                    LAYER 3: API LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  base.api.ts - query(), insert(), update(), delete()    │  │
│  │  - Offline check ✅ (sudah ada)                          │  │
│  │  - Error handling dengan errors.ts                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                            ↕
┌────────────────────────────────────────────────────────────────┐
│                  LAYER 4: BACKEND (Supabase)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Auth (Login/Session)                                  │  │
│  │  - PostgreSQL Database                                   │  │
│  │  - Storage (File uploads)                                │  │
│  │  - Realtime (Optional)                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Komponen Utama

#### 1. Service Worker (`sw.js`)

**Lokasi:** `/sw.js` (root level)

**Fungsi:**
- Cache static assets (HTML, CSS, JS)
- Cache API responses
- Serve offline fallback page
- Background sync

**Cache Strategies:**
- **Static Assets**: Cache First (instant load)
- **API Calls**: Network First (fresh data, fallback to cache)
- **Images**: Stale While Revalidate (show cached, update in background)

**Cache Configuration:**
```javascript
const CACHE_CONFIG = {
  maxAge: {
    api: 5 * 60 * 1000,         // 5 minutes
    dynamic: 24 * 60 * 60 * 1000, // 24 hours
    images: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  maxEntries: {
    api: 50,
    dynamic: 100,
    images: 60,
  },
};
```

#### 2. IndexedDB Manager (`src/lib/offline/indexeddb.ts`)

**Database:** `sistem_praktikum_pwa`
**Version:** 1

**Object Stores:**
1. `kuis` - Data kuis
2. `kuis_soal` - Soal-soal kuis
3. `kuis_jawaban` - Jawaban mahasiswa
4. `nilai` - Data nilai
5. `materi` - Materi pembelajaran
6. `kelas` - Data kelas
7. `users` - Data user

**Fungsi:**
- Menyimpan data untuk offline access
- Query dengan filters
- Batch operations
- Migration support

#### 3. Network Detector (`src/lib/offline/network-detector.ts`)

**Fungsi:**
- Detect online/offline status
- Monitor network quality
- Ping test untuk verify connectivity
- Event emitter untuk status changes

**API:**
```typescript
networkDetector.initialize()
networkDetector.isOnline() // true/false
networkDetector.on((event) => {
  console.log('Network status:', event.status)
})
```

#### 4. Queue Manager (`src/lib/offline/queue-manager.ts`)

**Fungsi:**
- Queue operasi saat offline
- Auto retry saat online
- Priority queue
- Conflict resolution

---

## Login & Autentikasi

### ❌ TIDAK BISA LOGIN SAAT OFFLINE

```
User Offline → Coba Login → ❌ GAGAL
```

**Alasan:**
- Login membutuhkan autentikasi ke Supabase server
- Supabase Auth API hanya bisa diakses online
- Token autentikasi harus di-verify oleh server

### ✅ SESSION TETAP AKTIF OFFLINE

```
User Online → Login → Session Tersimpan → User Offline → ✅ Masih Login
```

**Mekanisme:**
1. User login saat online
2. Supabase return session token (JWT)
3. Session token disimpan di `localStorage`
4. Session berlaku selama ~7 hari
5. Saat offline, app tetap bisa baca session dari localStorage
6. User tetap bisa akses protected routes

### Session Management

**File:** `src/lib/supabase/auth.ts`

```typescript
// Login (MUST be online)
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Call Supabase Auth API
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  // Get user profile
  const user = await getUserProfile(data.user.id);

  // Return session (saved to localStorage by AuthProvider)
  return {
    success: true,
    user,
    session: {
      user,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      expires_at: data.session?.expires_at,
    },
  };
}

// Get session (works offline if cached)
export async function getSession(): Promise<AuthSession | null> {
  const { data } = await supabase.auth.getSession();

  if (!data.session) return null;

  const user = await getUserProfile(data.session.user.id);

  return {
    user,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  };
}
```

---

## Offline vs Online Mode

### Fitur yang Tersedia

#### ✅ STATUS: ONLINE

- Login/Logout
- Fetch data baru dari server
- Create (tambah kuis, materi, dll)
- Update (edit data)
- Delete (hapus data)
- Upload file (materi, avatar)
- Download file
- Sinkronisasi data

#### ⚠️ STATUS: OFFLINE (Session Masih Valid)

**Yang Bisa:**
- ✅ Buka aplikasi (PWA dari cache)
- ✅ Lihat halaman yang sudah di-cache
- ✅ Lihat data yang sudah di-cache (IndexedDB)
- ✅ Navigasi antar halaman

**Yang Tidak Bisa:**
- ❌ Login baru (butuh server)
- ❌ Fetch data baru (butuh server)
- ❌ Create/Update/Delete (butuh server)*
- ❌ Upload/Download file (butuh server)

> *Bisa di-queue untuk sync nanti jika Queue Manager aktif

#### ❌ STATUS: OFFLINE (Session Expired/Belum Login)

- ✅ Buka aplikasi (PWA dari cache)
- ✅ Lihat halaman login/register
- ❌ Login (butuh server)
- ❌ Akses halaman protected (redirect ke login)
- ❌ Semua fitur lainnya

---

## Flow Diagram

### Flow 1: User Pertama Kali (Belum Pernah Login)

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: User buka app (OFFLINE)                             │
└──────────────────────────────────────────────────────────────┘
Service Worker: Load static assets dari cache
      ↓
React App: Render halaman login
      ↓
LoginForm: Detect offline → Show warning banner
      ↓
Result: ❌ Tidak bisa login


┌──────────────────────────────────────────────────────────────┐
│  STEP 2: User sambung internet (ONLINE)                      │
└──────────────────────────────────────────────────────────────┘
NetworkDetector: Emit "online" event
      ↓
LoginForm: Hide offline warning
      ↓
User bisa input email/password


┌──────────────────────────────────────────────────────────────┐
│  STEP 3: User klik "Sign In" (ONLINE)                        │
└──────────────────────────────────────────────────────────────┘
LoginForm: Validate form → Call login()
      ↓
auth.ts: POST ke Supabase Auth API
      ↓
Supabase: Verify credentials
      ↓
Supabase: Return session token + user data
      ↓
auth.ts: Fetch full user profile dari database
      ↓
AuthProvider: Save session ke state + localStorage
      ↓
Service Worker: Cache user data
      ↓
Result: ✅ Login berhasil → Redirect ke dashboard


┌──────────────────────────────────────────────────────────────┐
│  STEP 4: User navigate ke MateriPage (ONLINE)                │
└──────────────────────────────────────────────────────────────┘
MateriPage: useEffect → Call fetchMateri()
      ↓
base.api.ts: Check online → Proceed with fetch
      ↓
Supabase: Query materi table → Return data
      ↓
IndexedDB: Save materi to offline storage (background)
      ↓
MateriPage: Display materi cards
      ↓
Service Worker: Cache API response


┌──────────────────────────────────────────────────────────────┐
│  STEP 5: User offline (sambil masih buka app)                │
└──────────────────────────────────────────────────────────────┘
NetworkDetector: Emit "offline" event
      ↓
All pages: Show offline indicator badge
      ↓
base.api.ts: Check offline → Return [] (empty array)
      ↓
MateriPage: Show data dari IndexedDB (jika ada)
      ↓
User masih bisa navigasi (session masih valid)
```

### Flow 2: Returning User (Sudah Pernah Login)

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: User buka app (OFFLINE)                             │
└──────────────────────────────────────────────────────────────┘
Service Worker: Load dari cache (instant!)
      ↓
React App: Check localStorage untuk session
      ↓
AuthProvider: Session found & still valid
      ↓
AuthProvider: Auto login dengan cached session
      ↓
IndexedDB: Load cached data (materi, kuis, nilai)
      ↓
Result: ✅ User langsung masuk dashboard (OFFLINE MODE)


┌──────────────────────────────────────────────────────────────┐
│  STEP 2: User navigate antar halaman (OFFLINE)               │
└──────────────────────────────────────────────────────────────┘
MateriPage: Call fetchMateri()
      ↓
base.api.ts: Check offline → Return [] (empty)
      ↓
MateriPage: Fallback to IndexedDB → Load cached materi
      ↓
KuisPage: Same flow
      ↓
NilaiPage: Same flow
      ↓
Result: ✅ Bisa lihat data yang sudah di-cache


┌──────────────────────────────────────────────────────────────┐
│  STEP 3: User coba create/update (OFFLINE)                   │
└──────────────────────────────────────────────────────────────┘
QuizBuilder: Submit form
      ↓
base.api.ts: Check offline → Throw OfflineError
      ↓
OR: QueueManager: Add operation to sync queue
      ↓
UI: Show toast "You are offline, changes will sync later"
      ↓
Result: ⚠️ Operasi di-queue, tunggu online


┌──────────────────────────────────────────────────────────────┐
│  STEP 4: User online lagi (AUTO SYNC)                        │
└──────────────────────────────────────────────────────────────┘
NetworkDetector: Emit "online" event
      ↓
QueueManager: Start processing sync queue
      ↓
API calls: Retry all queued operations
      ↓
Supabase: Process create/update/delete
      ↓
IndexedDB: Update with fresh data from server
      ↓
UI: Show toast "All changes synced successfully"
      ↓
Result: ✅ Data ter-sync otomatis
```

### Flow 3: Session Expired

```
┌──────────────────────────────────────────────────────────────┐
│  User buka app setelah 7 hari (ONLINE/OFFLINE)               │
└──────────────────────────────────────────────────────────────┘
AuthProvider: Check session in localStorage
      ↓
Session expired (created_at > 7 days ago)
      ↓
AuthProvider: Clear expired session
      ↓
Router: Redirect ke /login
      ↓
User harus login ulang (butuh ONLINE)
```

---

## Data Storage

### Browser Storage Layer

```
┌─────────────────────────────────────────────────────────────┐
│  1. LocalStorage (5-10 MB limit)                            │
└─────────────────────────────────────────────────────────────┘
Key: sb-{project-id}-auth-token
  └─ Session token (JWT)
  └─ User profile cache
  └─ Refresh token

Key: app-preferences
  └─ Theme (light/dark)
  └─ Language
  └─ Notifications settings

Key: last-sync-timestamp
  └─ Timestamp of last successful sync


┌─────────────────────────────────────────────────────────────┐
│  2. IndexedDB (50+ MB, dapat lebih)                         │
└─────────────────────────────────────────────────────────────┘
Database: sistem_praktikum_pwa

Object Store: kuis
  ├─ Indexes: kelas_id, dosen_id, created_at, is_published
  └─ Data: All quiz metadata

Object Store: kuis_soal
  ├─ Indexes: kuis_id, nomor_soal
  └─ Data: Quiz questions

Object Store: kuis_jawaban
  ├─ Indexes: kuis_id, soal_id, mahasiswa_id
  └─ Data: Student answers

Object Store: nilai
  ├─ Indexes: mahasiswa_id, kelas_id
  └─ Data: Grades

Object Store: materi
  ├─ Indexes: kelas_id, dosen_id, is_published
  └─ Data: Learning materials metadata

Object Store: kelas
  ├─ Indexes: dosen_id, is_active
  └─ Data: Class information

Object Store: users
  ├─ Indexes: role, is_active
  └─ Data: User profiles cache


┌─────────────────────────────────────────────────────────────┐
│  3. Cache Storage (via Service Worker)                     │
└─────────────────────────────────────────────────────────────┘
Cache: praktikum-pwa-static-v1.0.0
  ├─ /index.html
  ├─ /offline.html
  ├─ /manifest.json
  ├─ /assets/*.js (bundled JS)
  ├─ /assets/*.css (bundled CSS)
  └─ /assets/icons/* (PWA icons)

Cache: praktikum-pwa-dynamic-v1.0.0
  ├─ /login
  ├─ /dashboard
  ├─ /materi
  ├─ /kuis
  └─ Other dynamically loaded pages

Cache: praktikum-pwa-api-v1.0.0 (Max age: 5 min)
  ├─ API responses from Supabase
  └─ Auto-deleted after 5 minutes

Cache: praktikum-pwa-images-v1.0.0 (Max age: 7 days)
  ├─ User avatars
  ├─ Materi thumbnails
  └─ Other images

Cache: praktikum-pwa-fonts-v1.0.0
  └─ Web fonts (Google Fonts, etc)


┌─────────────────────────────────────────────────────────────┐
│  4. Session Storage (per-tab, hilang saat close)           │
└─────────────────────────────────────────────────────────────┘
Key: temp-form-data
  └─ Form input yang belum di-submit

Key: scroll-position
  └─ Scroll position untuk restore

Key: active-tab
  └─ Tab yang sedang aktif di UI
```

---

## Implementasi Saat Ini

### ✅ Sudah Diimplementasikan

1. **Service Worker** (`sw.js`)
   - Cache strategies (Cache First, Network First, Stale While Revalidate)
   - Offline fallback page
   - Cache versioning & cleanup
   - Install & activate lifecycle

2. **IndexedDB Manager** (`src/lib/offline/indexeddb.ts`)
   - 7 object stores untuk data offline
   - CRUD operations
   - Query dengan filters
   - Batch operations

3. **Network Detector** (`src/lib/offline/network-detector.ts`)
   - Online/offline detection
   - Network quality monitoring
   - Ping test
   - Event emitter untuk status changes

4. **Queue Manager** (`src/lib/offline/queue-manager.ts`)
   - Queue untuk operasi offline
   - Priority queue
   - Retry mechanism
   - Conflict resolution

5. **Offline Checks** (`src/lib/api/base.api.ts`)
   - Check `navigator.onLine` sebelum fetch
   - Return empty array saat offline (read operations)
   - Prevent error spam di console

6. **Smart Error Logging** (`src/lib/utils/errors.ts`)
   - Network errors: Simple warning `⚠️ Offline`
   - Other errors: Full details dengan stack trace
   - Development mode only

### ⚠️ Belum Fully Implemented

1. **Auto Save to IndexedDB**
   - Data dari API belum otomatis tersimpan ke IndexedDB
   - Perlu tambah interceptor di base.api.ts

2. **Auto Load from IndexedDB saat Offline**
   - Pages belum otomatis fallback ke IndexedDB
   - Perlu tambah logic di setiap page

3. **Background Sync**
   - Queue operations belum otomatis ter-sync
   - Perlu implement Background Sync API

4. **Offline Indicator UI**
   - Belum ada visual indicator di semua halaman
   - Perlu tambah banner/badge

5. **Conflict Resolution**
   - Belum ada handling untuk data conflicts
   - Perlu strategy: Last Write Wins vs Manual Resolution

---

## Best Practices

### 1. Login Flow

**✅ DO:**
```typescript
// Check online before login
if (!navigator.onLine) {
  showError('Cannot login while offline');
  return;
}

await login(credentials);
```

**❌ DON'T:**
```typescript
// Langsung call login tanpa check
await login(credentials); // Will fail with network error
```

### 2. Data Fetching

**✅ DO:**
```typescript
async function fetchData() {
  // Check online first
  if (!navigator.onLine) {
    // Fallback to IndexedDB
    const cached = await indexedDB.getAll('materi');
    return cached;
  }

  // Fetch from server
  const data = await api.query('materi');

  // Save to IndexedDB for offline
  await indexedDB.saveAll('materi', data);

  return data;
}
```

**❌ DON'T:**
```typescript
async function fetchData() {
  // Langsung fetch tanpa check
  return await api.query('materi'); // Fails offline
}
```

### 3. Create/Update Operations

**✅ DO:**
```typescript
async function createKuis(data) {
  if (!navigator.onLine) {
    // Queue for later sync
    await queueManager.add({
      operation: 'create',
      table: 'kuis',
      data,
    });

    showToast('Saved offline. Will sync when online.');
    return;
  }

  // Create directly
  await api.insert('kuis', data);
}
```

**❌ DON'T:**
```typescript
async function createKuis(data) {
  // Langsung create, fails offline
  await api.insert('kuis', data);
}
```

### 4. Session Management

**✅ DO:**
```typescript
// Check session validity
const session = await getSession();

if (!session) {
  // Not logged in
  redirectToLogin();
  return;
}

if (isSessionExpired(session)) {
  // Session expired
  clearSession();
  redirectToLogin();
  return;
}

// Session valid, proceed
```

**❌ DON'T:**
```typescript
// Assume session is always valid
const user = localStorage.getItem('user');
// No expiry check, no validation
```

### 5. Cache Management

**✅ DO:**
```typescript
// Version your caches
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `app-${CACHE_VERSION}`;

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

**❌ DON'T:**
```typescript
// No versioning, caches grow forever
const CACHE_NAME = 'app-cache';
// Never clean up old caches
```

---

## Troubleshooting

### Problem: User tidak bisa login

**Kemungkinan Penyebab:**
1. User sedang offline
2. Supabase server down
3. Invalid credentials

**Solusi:**
```typescript
// Add error handling
try {
  if (!navigator.onLine) {
    throw new Error('Cannot login while offline');
  }

  await login(credentials);
} catch (error) {
  if (error.message.includes('offline')) {
    showError('You are offline. Please check your connection.');
  } else if (error.message.includes('Invalid')) {
    showError('Invalid email or password');
  } else {
    showError('Login failed. Please try again.');
  }
}
```

### Problem: Data tidak muncul saat offline

**Kemungkinan Penyebab:**
1. Data belum pernah di-fetch saat online
2. IndexedDB belum diimplementasikan untuk page tersebut
3. Cache sudah expired

**Solusi:**
```typescript
async function loadData() {
  try {
    if (navigator.onLine) {
      // Fetch from API
      const data = await api.query('materi');
      // Save to IndexedDB
      await indexedDB.saveAll('materi', data);
      return data;
    } else {
      // Load from IndexedDB
      return await indexedDB.getAll('materi');
    }
  } catch (error) {
    console.error('Failed to load data:', error);
    return [];
  }
}
```

### Problem: Console spam dengan error saat offline

**Status:** ✅ SUDAH DIPERBAIKI

**Sebelum Fix:**
```
❌ TypeError: Failed to fetch (x300 lines)
```

**Sesudah Fix:**
```
✅ ⚠️ Offline (query:materi)
✅ ⚠️ Offline (query:kuis)
```

**Implementasi:**
- File: `src/lib/utils/errors.ts` - Reduced network error logging
- File: `src/lib/api/base.api.ts` - Added offline check before fetch

---

## Referensi

### File-file Penting

1. **PWA Core**
   - `sw.js` - Service Worker
   - `public/manifest.json` - PWA Manifest
   - `src/lib/pwa/register-sw.ts` - SW Registration

2. **Offline Support**
   - `src/lib/offline/indexeddb.ts` - IndexedDB Manager
   - `src/lib/offline/network-detector.ts` - Network Detection
   - `src/lib/offline/queue-manager.ts` - Sync Queue

3. **API Layer**
   - `src/lib/api/base.api.ts` - Base API with offline checks
   - `src/lib/utils/errors.ts` - Error handling
   - `src/lib/supabase/auth.ts` - Authentication

4. **Cache Strategies**
   - `src/lib/pwa/cache-strategies.ts` - Cache implementations
   - `src/config/cache.config.ts` - Cache configuration

### External Documentation

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google: PWA Training](https://web.dev/progressive-web-apps/)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## Changelog

### v1.0.0 - 2025-01-19

**Added:**
- ✅ Offline check di `base.api.ts` query functions
- ✅ Smart error logging untuk network errors
- ✅ Dokumentasi lengkap PWA architecture

**Fixed:**
- ✅ Console spam saat offline (300+ lines → 4-5 lines)
- ✅ Network error logging terlalu verbose

**Known Issues:**
- ⚠️ Auto save to IndexedDB belum implemented
- ⚠️ Background sync belum implemented
- ⚠️ Offline indicator UI belum di semua halaman

---

**Dokumentasi dibuat:** 19 Januari 2025
**Terakhir diupdate:** 19 Januari 2025
**Versi:** 1.0.0
