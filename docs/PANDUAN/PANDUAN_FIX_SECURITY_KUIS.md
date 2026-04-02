# 🔐 PANDUAN FIX SECURITY KUIS

## ⚠️ **MASALAH**

**Saat ini:** Jawaban benar MUNCUL di browser mahasiswa saat mengerjakan kuis!

**Risiko:**
- Mahasiswa bisa curang dengan mudah (buka DevTools → lihat jawaban)
- Sistem penilaian tidak fair
- Integritas kuis terancam

---

## ✅ **SOLUSI YANG SUDAH DIBUAT**

### **1. Database Migration**

**File:** `supabase/migrations/40_create_soal_mahasiswa_view.sql`

**Apa yang dilakukan:**
- Membuat VIEW `soal_mahasiswa` yang menyembunyikan `jawaban_benar`
- Mahasiswa yang mengerjakan kuis akan query ke view ini
- Field `jawaban_benar` di-set jadi `NULL`

**Cara apply:**
```bash
# Via Supabase CLI
supabase db push

# Atau via SQL Editor di Supabase Dashboard
# Copy-paste isi file 40_create_soal_mahasiswa_view.sql
```

---

### **2. Secure API**

**File:** `src/lib/api/kuis-secure.api.ts`

**Fungsi baru:**
- `getSoalForAttempt(kuisId)` → Untuk mahasiswa mengerjakan (jawaban HIDDEN)
- `getSoalForResult(kuisId)` → Untuk mahasiswa lihat hasil (jawaban VISIBLE)
- `getKuisForAttempt(kuisId)` → Load kuis untuk dikerjakan (secure)
- `getKuisForResult(kuisId)` → Load kuis untuk lihat hasil (dengan jawaban)

---

## 📝 **CARA IMPLEMENTASI**

### **Step 1: Apply Database Migration**

```bash
cd "F:\tes 9\sistem-praktikum-pwa"

# Jalankan migration
supabase db push
```

**Atau manual via Supabase Dashboard:**
1. Buka https://app.supabase.com
2. Pilih project Anda
3. Klik "SQL Editor"
4. Copy-paste isi file `supabase/migrations/40_create_soal_mahasiswa_view.sql`
5. Klik "Run"

---

### **Step 2: Update QuizAttempt Component**

**File:** `src/components/features/kuis/attempt/QuizAttempt.tsx`

**BEFORE (VULNERABLE):**
```typescript
// Line ~164
const quizData = await getKuisByIdOffline(kuisId);
const questionsData = await getSoalByKuisOffline(kuisId);
```

**AFTER (SECURE):**
```typescript
// Import secure API
import { getKuisForAttempt } from "@/lib/api/kuis-secure.api";

// Line ~164
const quizData = await getKuisForAttempt(kuisId);
const questionsData = quizData.soal || [];
```

**Full change:**
```typescript
// Di bagian loadQuiz() function
async function loadQuiz() {
  try {
    setIsLoading(true);
    setError(null);

    // ✅ BEFORE (VULNERABLE):
    // const quiz = await getKuisByIdOffline(kuisId);
    // const questions = await getSoalByKuisOffline(kuisId);

    // ✅ AFTER (SECURE):
    const quiz = await getKuisForAttempt(kuisId);
    const questions = quiz.soal || [];

    // Validate quiz
    if (!quiz) {
      throw new Error("Kuis tidak ditemukan");
    }

    if (questions.length === 0) {
      throw new Error("Kuis ini belum memiliki soal");
    }

    setQuiz(quiz);
    setQuestions(questions);

    // ... rest of code
  } catch (err: any) {
    // ... error handling
  }
}
```

---

### **Step 3: Update KuisResultPage Component**

**File:** `src/pages/mahasiswa/kuis/KuisResultPage.tsx`

**Change:**
```typescript
// Import secure API
import { getKuisForResult } from "@/lib/api/kuis-secure.api";

// Di bagian loadAttemptData() function
async function loadAttemptData() {
  try {
    setLoading(true);
    setError(null);

    // Load attempt with all related data
    const attemptData = await getAttemptById(attemptId);

    // ✅ Load kuis WITH jawaban_benar (for showing correct answers)
    const quizData = await getKuisForResult(attemptData.kuis_id);
    const questionsData = quizData.soal || [];
    const answersData = (attemptData.jawaban as Jawaban[]) || [];

    setAttempt(attemptData);
    setQuiz(quizData);
    setQuestions(questionsData);
    setAnswers(answersData);

    // Auto-grade if needed
    await autoGradeAnswers(questionsData, answersData);
  } catch (err) {
    console.error("Error loading attempt:", err);
    setError(err instanceof Error ? err.message : "Gagal memuat hasil kuis");
  } finally {
    setLoading(false);
  }
}
```

---

### **Step 4: Testing**

#### **Test 1: Cek Database View**

```sql
-- Run di SQL Editor Supabase
SELECT * FROM soal_mahasiswa LIMIT 5;

-- ✅ EXPECTED: jawaban_benar harus NULL
-- ❌ FAIL: kalau jawaban_benar ada isinya
```

#### **Test 2: Cek API Response**

1. Buka aplikasi sebagai **Mahasiswa**
2. Mulai mengerjakan kuis
3. Buka **DevTools (F12)**
4. Klik tab **Network**
5. Cari request ke `/soal_mahasiswa`
6. Lihat response:

**✅ EXPECTED:**
```json
{
  "id": "soal-1",
  "pertanyaan": "Apa ibu kota Indonesia?",
  "jawaban_benar": null,  // ✅ NULL (hidden)
  "opsi_jawaban": [...]
}
```

**❌ FAIL jika:**
```json
{
  "jawaban_benar": "opt-1"  // ❌ Masih visible!
}
```

#### **Test 3: Cek Result Page**

1. Submit kuis
2. Lihat hasil
3. Buka DevTools > Network
4. Cari request ke `/soal` (bukan soal_mahasiswa)
5. Response harus include `jawaban_benar`

**✅ EXPECTED:**
```json
{
  "id": "soal-1",
  "pertanyaan": "Apa ibu kota Indonesia?",
  "jawaban_benar": "opt-1",  // ✅ Visible (untuk tampilkan jawaban benar)
  "opsi_jawaban": [...]
}
```

---

## 📋 **CHECKLIST IMPLEMENTASI**

### **Phase 1: Database (Critical)**
- [ ] Apply migration `40_create_soal_mahasiswa_view.sql`
- [ ] Test: `SELECT * FROM soal_mahasiswa` → jawaban_benar harus NULL
- [ ] Test: `SELECT * FROM soal` → jawaban_benar masih ada

### **Phase 2: API (Important)**
- [ ] Create `src/lib/api/kuis-secure.api.ts`
- [ ] Test API functions dengan Postman/curl

### **Phase 3: Frontend (Important)**
- [ ] Update `QuizAttempt.tsx` → gunakan `getKuisForAttempt()`
- [ ] Update `KuisResultPage.tsx` → gunakan `getKuisForResult()`
- [ ] Test: Mahasiswa mengerjakan kuis → jawaban tidak visible di DevTools
- [ ] Test: Mahasiswa lihat hasil → jawaban benar ditampilkan

### **Phase 4: Verification (Critical)**
- [ ] Login sebagai Mahasiswa
- [ ] Mulai kuis baru
- [ ] Buka DevTools → Network tab
- [ ] Verify: `jawaban_benar` = null di request `/soal_mahasiswa`
- [ ] Submit kuis
- [ ] Lihat hasil
- [ ] Verify: Jawaban benar ditampilkan di UI
- [ ] Verify: `jawaban_benar` ada di request `/soal` (untuk result)

---

## 🎯 **EXPECTED BEHAVIOR AFTER FIX**

### **SAAT MENGERJAKAN KUIS:**
```
Mahasiswa → Load kuis
         ↓
API call → soal_mahasiswa view
         ↓
Response → jawaban_benar = NULL ✅
         ↓
Mahasiswa → Kerjakan soal (TIDAK bisa lihat jawaban)
         ↓
Mahasiswa → Submit
```

### **SAAT LIHAT HASIL:**
```
Mahasiswa → Submit kuis
         ↓
Status → 'submitted'
         ↓
Mahasiswa → Klik "Lihat Hasil"
         ↓
API call → soal table (original)
         ↓
Response → jawaban_benar = "opt-1" ✅
         ↓
Auto-grade → Bandingkan jawaban
         ↓
UI → Tampilkan:
     "Jawaban Anda: B (Salah)"
     "Jawaban Benar: A" ✅
```

---

## 🚨 **TROUBLESHOOTING**

### **Problem 1: View tidak bisa dibuat**
```
ERROR: permission denied for table soal
```

**Solution:**
```sql
-- Grant permissions
GRANT SELECT ON soal TO postgres;
GRANT SELECT ON soal TO authenticated;
```

---

### **Problem 2: Mahasiswa masih bisa lihat jawaban**

**Check:**
1. Apakah migration sudah di-apply?
   ```sql
   SELECT * FROM information_schema.views WHERE table_name = 'soal_mahasiswa';
   ```

2. Apakah frontend sudah update?
   - Check import statement di QuizAttempt.tsx
   - Check apakah masih pakai `getSoalByKuisOffline()` (old) atau `getKuisForAttempt()` (new)

---

### **Problem 3: Auto-grading tidak jalan**

**Penyebab:** Result page tidak bisa akses `jawaban_benar`

**Check:**
- Pastikan `KuisResultPage.tsx` pakai `getKuisForResult()` (WITH jawaban_benar)
- JANGAN pakai `getKuisForAttempt()` di result page

---

## 📊 **COMPARISON: BEFORE vs AFTER**

### **BEFORE (VULNERABLE):**

| Scenario | API Used | View/Table | jawaban_benar |
|----------|----------|------------|---------------|
| Mahasiswa attempt kuis | `getKuisById()` | `soal` | ❌ VISIBLE |
| Mahasiswa lihat hasil | `getKuisById()` | `soal` | ✅ VISIBLE |
| Dosen lihat soal | `getKuisById()` | `soal` | ✅ VISIBLE |

**Risk:** Mahasiswa bisa curang!

---

### **AFTER (SECURE):**

| Scenario | API Used | View/Table | jawaban_benar |
|----------|----------|------------|---------------|
| Mahasiswa attempt kuis | `getKuisForAttempt()` | `soal_mahasiswa` | ✅ HIDDEN (NULL) |
| Mahasiswa lihat hasil | `getKuisForResult()` | `soal` | ✅ VISIBLE |
| Dosen lihat soal | `getKuisById()` | `soal` | ✅ VISIBLE |

**Benefit:** Mahasiswa TIDAK bisa curang! ✅

---

## ✅ **CONCLUSION**

Setelah implementasi fix ini:
- ✅ Jawaban benar **HIDDEN** saat mahasiswa mengerjakan kuis
- ✅ Jawaban benar **VISIBLE** saat mahasiswa lihat hasil (untuk edukasi)
- ✅ Dosen tetap bisa lihat jawaban benar kapan saja
- ✅ Sistem penilaian menjadi **FAIR** dan **SECURE**

---

**Status:** 📝 Panduan lengkap - Siap untuk implementasi

**Estimated Time:** 30-60 menit untuk implementasi lengkap

**Priority:** 🔴 **CRITICAL** - Harus segera diimplementasikan!
