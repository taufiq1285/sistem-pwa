# Test Guide: Mahasiswa Registration & 406 Error Fix

## Quick Test (5 minutes)

### Step 1: Prepare
1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (or Cmd+Shift+Delete on Mac)
   - Clear "Cookies and other site data"
   - Clear "Cached images and files"
   - Click "Clear data"

2. **Hard refresh app:**
   - Press `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)
   - Wait for page to load completely

3. **Log out:**
   - Click logout button in top-right
   - Confirm you're on login page

### Step 2: Register New Mahasiswa

1. Go to **Register** page
2. Fill in the form:
   - **Name:** Tes Mahasiswa (or any name)
   - **Email:** `tes-mhs-{timestamp}@example.com` (make it unique)
   - **Password:** `Test123!@#` or any strong password
   - **Confirm:** Same password
   - **Role:** Select "**Mahasiswa**" ✅
   - **NIM:** `2024001` (or any format)
   - **Program Studi:** Kebidanan
   - **Angkatan:** 2024
   - **Semester:** 1

3. Click **"Create Account"**
4. You should see: **"Registration successful! Please check your email..."**
5. ✅ Account created

### Step 3: Check Console for Errors

1. **Open DevTools:** Press `F12`
2. Go to **Console** tab
3. **Register the mahasiswa again** (new email) and watch the console
4. **Expected Result:**
   - ❌ NO `406 (Not Acceptable)` errors
   - ❌ NO `GET /mahasiswa...` errors
   - ✅ Console should be CLEAN (or minimal warnings)
   - ✅ Mahasiswa data should load correctly

### Step 4: Verify Login

1. **Log in** with the new mahasiswa account
2. **Expected Results:**
   - ✅ Dashboard loads without errors
   - ✅ Console shows NO 406 errors
   - ✅ Can see dashboard content
   - ✅ Profile loads correctly

### Step 5: Check Admin Panel

1. **Log out** and log back in as **Admin**
2. Go to **Admin** → **Users** or **Mahasiswa Management**
3. **Expected:**
   - ✅ See the newly registered mahasiswa
   - ✅ Can view their details (NIM, Name, Email, etc.)
   - ✅ Can manage their enrollment

---

## Detailed Test Scenarios

### Scenario A: Single Registration (Simplest)
```
1. Clear cache & hard refresh
2. Register 1 new mahasiswa
3. Check console (should be clean, NO 406 errors)
4. Log in as admin, verify mahasiswa appears in system
5. ✅ PASS if no 406 errors and mahasiswa is visible
```

### Scenario B: Multi-Registration (More Thorough)
```
1. Clear cache & hard refresh
2. Register 3 different mahasiswa accounts
3. For each registration:
   - Check console after registration
   - Look for 406 errors (should be NONE)
   - Verify account creation message
4. Log in as each mahasiswa:
   - Verify dashboard loads clean
   - Check console (NO 406 errors)
5. Log in as admin:
   - Verify all 3 mahasiswa appear in system
6. ✅ PASS if all load without 406 errors
```

### Scenario C: Check Network Tab (Advanced)
```
1. Open DevTools (F12)
2. Go to Network tab
3. Register new mahasiswa
4. Filter by "mahasiswa" in network requests
5. Expected:
   - Should see GET requests to /mahasiswa
   - Status should be 200 (not 406)
   - Or if status is 200, data loaded successfully
   - No repeated 406 errors
6. ✅ PASS if requests succeed
```

---

## Success Criteria

### ✅ PASS (Fix Working)
- [x] Mahasiswa can register
- [x] Registration completes successfully
- [x] No 406 errors in console
- [x] Can log in as mahasiswa
- [x] Dashboard loads without errors
- [x] Admin can see mahasiswa in system
- [x] No console errors about "mahasiswa" queries

### ❌ FAIL (Fix Not Working)
- [ ] Still seeing `406 (Not Acceptable)` errors
- [ ] Mahasiswa can't log in
- [ ] Dashboard shows errors
- [ ] Admin can't see mahasiswa in system
- [ ] Multiple `GET /mahasiswa?...` failures

---

## Troubleshooting

### If Still Getting 406 Errors

**Option 1: Hard Refresh Again**
```
1. Ctrl+Shift+R (or Cmd+Shift+R)
2. Wait 5 seconds
3. Try registering again
```

**Option 2: Clear All Browser Data**
```
1. Go to DevTools → Application
2. Storage → Clear Site Data
3. Hard refresh (Ctrl+Shift+R)
4. Try again
```

**Option 3: Check If RLS Policy Needs Update**
- See `MAHASISWA_RLS_FIX.md` for RLS setup
- The code fix alone might not be enough
- May need to update database RLS policies too

**Option 4: Different Browser**
```
Try in incognito/private window:
1. Ctrl+Shift+N (new private window)
2. Register and test
3. If works, browser cache was issue
```

---

## What Each Component Does

```
Registration Flow:
  ↓
  Register → Create Auth User → Create User Profile → Create Mahasiswa Record
  ↓
  Mahasiswa tries to log in
  ↓
  getMahasiswaId() called
  ↓
  Query: SELECT id FROM mahasiswa WHERE user_id = {userId}
  ↓
  With .single(): Throws 406 if RLS denies or 0 rows
  ↓
  With .maybeSingle(): Returns null gracefully, no error
  ↓
  ✅ Dashboard loads, mahasiswa sees content
```

---

## Files Involved

| File | What It Does |
|------|-------------|
| `src/lib/api/mahasiswa.api.ts` | Queries mahasiswa data, line 83 has the fix |
| `src/lib/supabase/auth.ts` | Creates mahasiswa record during registration |
| `src/components/forms/RegisterForm.tsx` | Registration UI and form |
| `src/pages/mahasiswa/Dashboard.tsx` | Calls `getMahasiswaStats()` which uses `getMahasiswaId()` |

---

## Next Steps If Issues Persist

1. **Check the fix was applied:**
   ```bash
   grep "maybeSingle" src/lib/api/mahasiswa.api.ts
   # Should output: .maybeSingle();
   ```

2. **Check build succeeded:**
   ```bash
   npm run build
   # Should complete without errors
   ```

3. **Check RLS policies in Supabase:**
   - Go to Supabase → SQL Editor
   - Run: `SELECT * FROM pg_tables WHERE tablename='mahasiswa';`
   - Check if RLS is enabled

4. **Contact Support with:**
   - Screenshot of the 406 error
   - Full console error message
   - Steps to reproduce
   - Browser console log

---

**Test Status:** Ready to Test ✅
**Expected Result:** No 406 errors ✅
**Build Status:** Passing ✅
