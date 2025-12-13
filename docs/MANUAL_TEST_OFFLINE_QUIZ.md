# 📋 Manual Test Guide: Offline Quiz Feature

## Week 17 Checkpoint - CRITICAL TEST

This is the ultimate test of your CORE contribution. Follow each step carefully and verify all checkpoints.

---

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open DevTools:**
   - Press `F12` to open Chrome DevTools
   - Go to **Application** tab → **Service Workers**
   - Verify service worker is registered

3. **Prepare Test Data:**
   - Have a published quiz with at least 5 questions
   - Be logged in as a mahasiswa (student)
   - Know the quiz URL (e.g., `/mahasiswa/kuis/quiz-123/attempt`)

---

## Test Scenario: Complete Offline-Online Flow

### Step 1: Start Quiz ONLINE ✅

**Actions:**
1. Navigate to quiz list: `/mahasiswa/kuis`
2. Click "Mulai Kuis" on any available quiz
3. Wait for quiz to load

**Expected Results:**
- ✅ Quiz loads successfully
- ✅ Questions are displayed
- ✅ Timer starts counting down
- ✅ No connection alerts shown

**Verification:**
```
Check Console:
- Should see: "✅ Quiz cached for offline use"
- Should see: "✅ Questions cached for offline use"
```

---

### Step 2: Answer 2 Questions ONLINE ✅

**Actions:**
1. Answer Question 1 (select or type answer)
2. Wait 3-4 seconds
3. Click "Selanjutnya" to go to Question 2
4. Answer Question 2
5. Wait 3-4 seconds

**Expected Results:**
- ✅ Green success alert shows: "Tersimpan otomatis X detik yang lalu"
- ✅ Cloud icon (☁️) visible in save indicator
- ✅ No offline warnings

**Verification:**
```
Check Console:
- Should see: "Answer saved successfully"
- Should NOT see: "Saving offline"

Check Network Tab:
- Should see POST requests to Supabase for answers
```

---

### Step 3: Turn OFF WiFi ✅

**Actions:**
1. **In DevTools** → **Network** tab → Check "Offline" checkbox
   OR
2. Turn off WiFi/Network in your OS

**Expected Results:**
- ✅ Red alert appears: "Tidak Ada Koneksi Internet"
- ✅ Alert text: "Anda sedang bekerja dalam mode offline"
- ✅ Alert mentions: "disinkronkan saat koneksi kembali tersedia"

**Verification:**
```
Visual Check:
- Red alert with WiFi-off icon (📡❌)
- Timer still running
- Questions still accessible
```

---

### Step 4: See "Offline" Badge Appear ✅

**Expected Results:**
- ✅ ConnectionLostAlert is displayed
- ✅ Status shows "Offline Mode"
- ✅ Quiz is still fully functional

---

### Step 5: Continue Answering Questions 3-5 OFFLINE ✅

**Actions:**
1. Click "Selanjutnya" to Question 3
2. Answer Question 3, wait 3-4 seconds
3. Navigate to Question 4
4. Answer Question 4, wait 3-4 seconds
5. Navigate to Question 5
6. Answer Question 5, wait 3-4 seconds

**Expected Results:**
- ✅ Each answer triggers auto-save
- ✅ Save indicator shows: "Tersimpan lokal X detik yang lalu"
- ✅ Cloud-off icon (☁️❌) visible
- ✅ No errors in console

**Verification:**
```
Check Console:
- Should see: "Answer saved offline, will sync when online"
- Should see: "Offline answer stored in IndexedDB"

Check Application → IndexedDB → praktikum-pwa → offline_answers:
- Should see 3 entries (answers 3, 4, 5)
- Each entry should have: attempt_id, soal_id, jawaban, synced: false
```

---

### Step 6: See "Saved Locally" Indicator ✅

**Expected Results:**
- ✅ Green alert with cloud-off icon
- ✅ Text: "Tersimpan lokal baru saja" or "...X detik yang lalu"
- ✅ No error messages

---

### Step 7: Press F5 (Refresh Browser) ✅

**Actions:**
1. Press `F5` or click browser refresh button
2. Wait for page to reload

**Expected Results:**
- ✅ Quiz reloads successfully (from cache)
- ✅ Current question number preserved
- ✅ All answers still present
- ✅ Offline alert still shown
- ✅ Timer continues (may reset to cached time)

**Verification:**
```
Check Application → IndexedDB:
- offline_quiz: Should have cached quiz data
- offline_questions: Should have all questions
- offline_answers: Should have all 5 answers (2 synced + 3 unsynced)
- offline_attempts: Should have current attempt

Try navigating:
- Go back to Question 3 → Answer should be there
- Go to Question 4 → Answer should be there
- Go to Question 5 → Answer should be there
```

---

### Step 8: Progress Still There ✅

**Expected Results:**
- ✅ All previous answers (1-5) are preserved
- ✅ Can navigate between questions
- ✅ Answers are visible in their input fields
- ✅ No data loss

---

### Step 9: Turn ON WiFi ✅

**Actions:**
1. **In DevTools** → **Network** tab → Uncheck "Offline" checkbox
   OR
2. Turn WiFi/Network back on in your OS

**Expected Results:**
- ✅ Green alert appears: "Koneksi Kembali Tersedia"
- ✅ Alert text: "Koneksi internet telah dipulihkan"
- ✅ Auto-hide after 5 seconds

**Verification:**
```
Visual Check:
- Green alert with checkmark icon (✅)
- Red offline alert disappears
```

---

### Step 10: See "Syncing..." ✅

**Expected Results:**
- ✅ Alert shows: "Menyinkronkan 3 jawaban ke server..."
- ✅ Loading spinner visible
- ✅ Sync happens automatically

**Verification:**
```
Check Console:
- Should see: "Syncing 3 offline answers..."
- Should see: "Synced answer for soal-3"
- Should see: "Synced answer for soal-4"
- Should see: "Synced answer for soal-5"

Check Network Tab:
- Should see POST requests to Supabase for each answer
```

---

### Step 11: Wait for "Synced!" ✅

**Expected Results:**
- ✅ Sync completes within 5-10 seconds
- ✅ Success message appears
- ✅ All offline answers removed from IndexedDB

**Verification:**
```
Check Console:
- Should see: "Offline answers synced successfully"

Check Application → IndexedDB → offline_answers:
- Should be EMPTY (all offline answers deleted after sync)
```

---

### Step 12: Check Server (Answers on Supabase) ✅

**Actions:**
1. Go to Supabase Dashboard
2. Navigate to **Table Editor** → `jawaban` table
3. Filter by your `attempt_id`

**Expected Results:**
- ✅ All 5 answers are in the database
- ✅ Each answer has:
  - `attempt_id` matching your attempt
  - `soal_id` matching each question
  - `jawaban` containing your answer text
  - `is_synced: true`
- ✅ Timestamps are accurate

**Verification:**
```sql
-- Run this query in Supabase SQL Editor:
SELECT
  id,
  attempt_id,
  soal_id,
  jawaban,
  is_synced,
  created_at,
  updated_at
FROM jawaban
WHERE attempt_id = 'your-attempt-id-here'
ORDER BY created_at ASC;

-- Should return 5 rows with all your answers
```

---

## Success Criteria

### ✅ ALL MUST PASS:

- [x] Quiz loads and caches offline
- [x] Online answers save to server
- [x] Offline alert appears when disconnected
- [x] Offline answers save to IndexedDB
- [x] Data persists through browser refresh
- [x] Reconnection detected automatically
- [x] Offline answers sync to server
- [x] All answers visible in Supabase

---

## Troubleshooting

### Issue: Quiz doesn't load offline

**Solution:**
1. Clear IndexedDB: DevTools → Application → IndexedDB → Delete database
2. Reload page while ONLINE first
3. Wait for "cached" messages in console
4. Then go offline

### Issue: Answers not syncing

**Solution:**
1. Check console for errors
2. Verify network is actually online (check other sites)
3. Check Supabase connection (auth token valid?)
4. Look for sync queue errors

### Issue: "Gagal memuat kuis" error

**Solution:**
1. Quiz not cached yet - load once while online
2. Check IndexedDB has quiz data
3. Verify quiz ID is correct

### Issue: Refresh loses data

**Solution:**
1. Check if service worker is active
2. Verify IndexedDB persistence is enabled
3. Make sure browser isn't in incognito mode
4. Check browser storage isn't full

---

## Performance Benchmarks

**Expected Performance:**
- Initial quiz load (online): < 2 seconds
- Auto-save trigger: 3 seconds after typing stops
- Offline save to IndexedDB: < 100ms
- Page refresh with cache: < 500ms
- Sync 10 answers: < 5 seconds
- Connection detection: < 1 second

---

## Additional Tests

### Test A: Submit Quiz Offline

1. Go offline after answering all questions
2. Click "Submit Kuis"
3. **Expected:** Quiz submission queued for sync
4. Come back online
5. **Expected:** Quiz submission syncs automatically

### Test B: Multiple Offline Sessions

1. Answer questions 1-3 offline
2. Close browser (data should persist)
3. Reopen browser (still offline)
4. Continue from question 4-5
5. Come online → All should sync

### Test C: Conflict Resolution

1. Answer question 1 offline: "Answer A"
2. Wait (don't sync yet)
3. Go back to question 1
4. Change answer to "Answer B"
5. Come online
6. **Expected:** Latest answer ("Answer B") syncs

---

## Report Template

```
## Offline Quiz Test Report

**Date:** [Date]
**Browser:** [Chrome/Firefox/Safari]
**Version:** [Browser version]

### Test Results:
- [ ] ✅ Start quiz online
- [ ] ✅ Answer 2 questions
- [ ] ✅ Turn OFF WiFi
- [ ] ✅ See "Offline" badge
- [ ] ✅ Answer questions 3-5
- [ ] ✅ See "Saved locally"
- [ ] ✅ Press F5 refresh
- [ ] ✅ Progress still there
- [ ] ✅ Turn ON WiFi
- [ ] ✅ See "Syncing..."
- [ ] ✅ Wait for "Synced!"
- [ ] ✅ Check server

### Issues Found:
[Describe any issues or unexpected behavior]

### Screenshots:
[Attach screenshots of alerts and console]

### Overall Result: PASS / FAIL
```

---

## IF ANY FAIL → CRITICAL!

This is your CORE contribution! Do NOT proceed to Week 18 until this works 100%!

### Debug Checklist:

1. ✅ Check all imports in modified files
2. ✅ Verify IndexedDB stores are created
3. ✅ Test network detection separately
4. ✅ Check sync queue functionality
5. ✅ Verify service worker is active
6. ✅ Test with real Supabase connection
7. ✅ Check browser console for errors
8. ✅ Verify storage permissions

### Get Help:

If issues persist:
1. Share console logs
2. Share network tab screenshots
3. Share IndexedDB structure
4. Describe exact steps that fail
5. Note any error messages

---

## Next Steps After Success

Once ALL tests pass:

1. ✅ Document any edge cases discovered
2. ✅ Create user guide for offline mode
3. ✅ Proceed to Week 18 features
4. ✅ Consider adding offline indicators in UI
5. ✅ Plan stress testing (100+ questions, slow network)

**Remember:** This offline functionality is the heart of your PWA! Take time to test thoroughly! 🚀
