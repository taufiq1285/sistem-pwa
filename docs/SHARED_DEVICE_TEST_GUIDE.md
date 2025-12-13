# 🧪 Shared Device Multi-User Security Test Guide

## 📋 Overview

This document provides step-by-step instructions to test the shared device security features implemented in the system:

- **Session Timeout**: Auto-logout after 15 minutes of inactivity
- **Multi-Tab Sync**: Detect login from different user and auto-logout current tab
- **Comprehensive Cache Cleanup**: Clear all IndexedDB, localStorage, Service Worker cache on logout

---

## 🎯 Test Credentials

Use these accounts for testing:

```
Mahasiswa: mahasiswa@test.com / password123
Dosen:     dosen@test.com / password123
Admin:     admin@test.com / password123
Laboran:   laboran@test.com / password123
```

---

## 🧪 Test 1: Manual Logout & Cache Clearing

### **Objective**

Verify that logging out completely clears all cached data

### **Steps**

1. **Login as Mahasiswa A**

   ```
   Email:    mahasiswa@test.com
   Password: password123
   ```

2. **Verify IndexedDB is populated**
   - Open DevTools (F12)
   - Go to: Application → Storage → IndexedDB → `sistem-pwa`
   - Should see 12+ stores:
     - ✅ users
     - ✅ mahasiswa
     - ✅ dosen
     - ✅ kelas
     - ✅ jadwal
     - ✅ kehadiran
     - ✅ kuis
     - ✅ nilai
     - ✅ materi
     - ✅ peminjaman
     - ✅ announcements
     - ✅ settings

3. **Check localStorage**
   - DevTools → Application → Storage → Local Storage → `http://localhost:5173`
   - Should contain:
     - ✅ `auth_cache` (encrypted session)
     - ✅ `auth_token` (JWT token)
     - ✅ `user_id` (user UUID)
     - ✅ other app data

4. **Click Logout Button**
   - Locate logout button in header/menu
   - Click it

5. **Verify Complete Cache Clear (CRITICAL)**
   - DevTools → Application → Storage → IndexedDB → `sistem-pwa`
   - Should be EMPTY ❌ (all stores deleted)
   - DevTools → Application → Storage → Local Storage
   - Should be EMPTY ❌ (all keys except 'theme', 'lang' removed)
   - DevTools → Application → Storage → Session Storage
   - Should be EMPTY ❌
   - DevTools → Application → Storage → Cookies
   - Session cookies cleared ✅

6. **Expected Result**
   - ✅ Redirected to `/login`
   - ✅ All cache completely cleared
   - ✅ No old user data accessible

### **Pass/Fail Criteria**

- **PASS** ✅: All cache cleared, redirected to login
- **FAIL** ❌: Old data still in IndexedDB or localStorage

---

## 🧪 Test 2: Multi-Tab Sync (Different User Login)

### **Objective**

Verify that logging in as different user in another tab auto-logouts current tab

### **Steps**

1. **Tab 1: Login as Mahasiswa**

   ```
   Email:    mahasiswa@test.com
   Password: password123
   ```

   - Wait for dashboard to load
   - Note dashboard shows: Mahasiswa data, NIM, kelas info

2. **Tab 2: (Same browser, same laptop) Login as Dosen**

   ```
   URL:      http://localhost:5173/login
   Email:    dosen@test.com
   Password: password123
   ```

   - Click Login
   - Wait for dashboard to load

3. **Check Tab 1 (Mahasiswa tab)**
   - **Expected**: Tab 1 should auto-logout or show error
   - **Check**:
     - Does Tab 1 show warning toast message?
     - Is Tab 1 redirected to `/login`?
     - Can Tab 1 still access app? (should be NO)

4. **Verify Tab 2 (Dosen tab)**
   - ✅ Should show Dosen dashboard
   - ✅ Should show Dosen menu (Kehadiran, Kuis, Jadwal, Materi)
   - ✅ Should NOT show Mahasiswa menu

5. **Browser DevTools**
   - Tab 1 DevTools → Console
   - Should see log: "Detected logout from another tab, current tab logging out"
   - Or: "Different user detected in another tab"

### **Pass/Fail Criteria**

- **PASS** ✅: Tab 1 auto-logouts, shows toast warning, redirected to login
- **WARN** ⚠️: Tab 1 doesn't auto-logout but shows same data (cache issue)
- **FAIL** ❌: Tab 1 still shows Mahasiswa dashboard (security issue)

---

## 🧪 Test 3: Session Timeout (15 Min Inactivity)

### **Objective**

Verify auto-logout after 15 minutes without activity

### **Steps**

1. **Login as Mahasiswa**
   - Go to dashboard
   - Verify you can see data

2. **Verify Warning Message (at 13 minutes)**
   - At the 13-minute mark, a warning toast should appear:
     - "Session akan berakhir dalam 2 menit. Lakukan aktivitas untuk melanjutkan."
   - This gives user 2 minutes to do something (mouse click, keyboard)

3. **Test A: Let Timeout Expire (No Activity)**
   - Don't touch keyboard/mouse
   - Wait for 15 minutes total
   - At 15 minutes:
     - ✅ Error toast: "Sesi Anda telah berakhir karena tidak ada aktivitas"
     - ✅ Redirected to `/login`
     - ✅ All data cleared

4. **Test B: Reset Timeout (Activity Before 15 min)**
   - Login again
   - Wait 5 minutes
   - Move mouse or click somewhere
   - Timer resets! (another 15 minutes countdown starts)
   - Verify console shows: "User activity detected - resetting session timeout"

5. **Activity Detection**
   - Should detect:
     - ✅ Mouse move
     - ✅ Keyboard input
     - ✅ Click
     - ✅ Scroll
     - ✅ Touch (mobile)

### **Pass/Fail Criteria**

- **PASS** ✅: Auto-logout at 15 min, timer resets on activity
- **PARTIAL** ⚠️: Timeout works but warning message missing
- **FAIL** ❌: No timeout or timeout doesn't logout

---

## 🧪 Test 4: Offline Mode (IndexedDB Persistence)

### **Objective**

Verify offline login works via IndexedDB cache

### **Steps**

1. **Login as Mahasiswa (Online)**
   - Go to dashboard
   - Verify data loads from server

2. **Simulate Offline**
   - DevTools → Network tab
   - Set Throttling to: **Offline**
   - See all requests fail (red X)

3. **Refresh Page (F5)**
   - While still offline

4. **Expected Result**
   - ✅ Dashboard still shows (from IndexedDB cache)
   - ✅ All menu items visible
   - ✅ Data is readable
   - ✅ **Cannot write** - any create/update shows error

5. **Try Write Operation (Should Fail)**
   - Try to update profile
   - Try to submit presensi
   - Should show: "Offline - cannot save data"

6. **Go Back Online**
   - DevTools → Network → Set back to: **No throttling**
   - Refresh page
   - Data syncs from server

7. **Check Service Worker Cache**
   - DevTools → Application → Service Workers
   - Should show active Service Worker
   - DevTools → Application → Cache Storage
   - Should have caches for:
     - ✅ Static assets
     - ✅ API responses
     - ✅ Manifest

### **Pass/Fail Criteria**

- **PASS** ✅: Offline dashboard works, write fails, sync on reconnect
- **PARTIAL** ⚠️: Offline reads work but Service Worker missing
- **FAIL** ❌: Page blank when offline

---

## 🧪 Test 5: Shared Laptop Scenario (Complete Flow)

### **Objective**

Simulate real lab scenario: 2 students using same laptop

### **Steps**

1. **Student A (9:00 AM)**
   - Login: mahasiswa@test.com
   - View their classes, presensi, nilai
   - Leave without logging out (forgot to click logout button)

2. **Student B (9:15 AM, walks up to same laptop)**
   - Without refreshing, what happens?
   - **Old behavior** ❌: Would see Student A's data
   - **New behavior** ✅: Should see...?

3. **Student B clicks on something**
   - Try to access profile
   - Should show Student A's profile (PROBLEM)

4. **Fix: Manual Logout**
   - Student A needs to explicit logout
   - After logout → cache cleared
   - Now Student B can login safely

5. **Alternative: Wait for Timeout**
   - If Student A doesn't touch screen for 15 min
   - Auto-logout happens
   - Student B can safely login

6. **Best Case: Multi-Tab Login**
   - If laptop is still open to login page
   - Student B logs in a NEW tab
   - Student A's tab auto-detects and logs out
   - Student B's tab continues

### **Pass/Fail Criteria**

- **PASS** ✅: Can handle Student A + Student B scenario safely
- **PARTIAL** ⚠️: Requires manual logout, but works
- **FAIL** ❌: Student B can see Student A's data

---

## 📊 Test Results Template

Copy this table and fill in results:

```markdown
| Test                    | Expected                | Actual | Status   | Notes |
| ----------------------- | ----------------------- | ------ | -------- | ----- |
| 1. Logout clears cache  | Cache empty, redirected | ?      | ❌/⚠️/✅ | ?     |
| 2. Multi-tab sync       | Tab 1 auto-logout       | ?      | ❌/⚠️/✅ | ?     |
| 2a. Toast warning       | Warning shown           | ?      | ❌/⚠️/✅ | ?     |
| 3. Timeout at 15 min    | Auto-logout             | ?      | ❌/⚠️/✅ | ?     |
| 3a. Warning at 13 min   | Toast warning shown     | ?      | ❌/⚠️/✅ | ?     |
| 3b. Activity reset      | Timer resets on click   | ?      | ❌/⚠️/✅ | ?     |
| 4. Offline mode         | Dashboard cached        | ?      | ❌/⚠️/✅ | ?     |
| 4a. Write fails offline | Error on submit         | ?      | ❌/⚠️/✅ | ?     |
| 5. Lab scenario         | Handled safely          | ?      | ❌/⚠️/✅ | ?     |
```

---

## 🐛 Troubleshooting

### **Problem: Tab 1 still shows old data after Tab 2 login**

- **Cause**: Multi-tab sync not working
- **Solution**:
  - Check localStorage `_multiTabSync` event
  - Verify storage event listener is active
  - Check browser console for errors

### **Problem: Timeout doesn't trigger**

- **Cause**: Session timeout hook not mounted or user not detected
- **Solution**:
  - Verify `useSessionTimeout` in AppLayout
  - Check user state is not null
  - Check browser console for "Session timeout" messages

### **Problem: Offline mode shows error**

- **Cause**: Service Worker not registered or IndexedDB missing
- **Solution**:
  - Check DevTools → Service Workers
  - Check DevTools → Application → IndexedDB
  - Reload with cache enabled

### **Problem: Cache not cleared on logout**

- **Cause**: `cleanupAllCache` failed
- **Solution**:
  - Check browser console for errors
  - Verify IndexedDB databases exist
  - Try manual cache clear: F12 → Network → Disable cache, then F5

---

## 📝 Test Report Example

```
TEST DATE: 2025-12-08
TESTER: QA Team

✅ Test 1: PASS - Cache completely cleared
✅ Test 2: PASS - Tab 1 auto-logout on Tab 2 login
⚠️ Test 3: PARTIAL - Timeout works, warning message shows correctly
✅ Test 4: PASS - Offline mode works, Service Worker active
✅ Test 5: PASS - Lab scenario handled safely

SUMMARY: PRODUCTION READY ✅
- All critical tests pass
- Minor: Consider stronger warning for timeout
```

---

## 🚀 Next Steps

After all tests pass:

1. ✅ Document any failures
2. ✅ Fix failures if needed
3. ✅ Run stress test (multiple tabs, rapid logout/login)
4. ✅ Test on mobile browsers
5. ✅ Deploy to production

---

## 📚 Related Files

- **Hook Implementation**: `src/lib/hooks/useSessionTimeout.ts`
- **Multi-Tab Sync**: `src/lib/hooks/useMultiTabSync.ts`
- **Cache Cleaner**: `src/lib/utils/cache-cleaner.ts`
- **Auth Provider**: `src/providers/AuthProvider.tsx`
- **App Layout**: `src/components/layout/AppLayout.tsx`
