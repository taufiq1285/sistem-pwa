# 📚 LOGIKA KUIS MAHASISWA - SINKRONISASI DENGAN DOSEN

## 🔄 **ALUR SINKRONISASI LENGKAP**

### **STEP 1: DOSEN BUAT KUIS**
```
Dosen → Buat Kuis → Simpan Info
           ↓
    Table: kuis (status: draft)
           ↓
    Tambah Soal (manual/dari bank)
           ↓
    Table: soal (kuis_id = kuis.id)
           ↓
    Publish Kuis
           ↓
    Table: kuis (status: published)
```

**File:** `src/pages/dosen/kuis/KuisCreatePage.tsx`
**API:** `createKuis()`, `createSoal()`, `addQuestionsFromBank()`

---

### **STEP 2: MAHASISWA LIHAT KUIS**

```sql
-- Query di getUpcomingQuizzes()
SELECT kuis.*
FROM kuis
WHERE kuis.status = 'published'
  AND kuis.kelas_id IN (
    SELECT kelas_id
    FROM kelas_mahasiswa
    WHERE mahasiswa_id = ?
      AND is_active = true
  )
```

**Logic:**
1. Ambil `kelas_id` yang mahasiswa enrolled
2. Query kuis yang **published** di kelas tersebut
3. Join dengan `soal` untuk hitung total soal
4. Join dengan `attempt_kuis` untuk check berapa kali sudah attempt

**File:** `src/pages/mahasiswa/kuis/KuisListPage.tsx:89`
**API:** `getUpcomingQuizzes()` (line 825)

**Output:**
```tsx
{
  id: "uuid",
  judul: "Kuis Anatomi",
  nama_mk: "Anatomi Fisiologi",
  nama_kelas: "Kelas A",
  dosen_name: "Dr. Ahmad",
  durasi_menit: 60,
  total_soal: 10,  // ✅ Include soal dari bank!
  attempts_used: 0,
  max_attempts: 3,
  can_attempt: true,
  status: "upcoming" | "ongoing" | "completed"
}
```

---

### **STEP 3: MAHASISWA KERJAKAN KUIS**

#### **3A. Load Kuis & Soal**
```typescript
// KuisAttemptPage.tsx:55
const quizData = await getKuisById(kuisId);

// API Query:
SELECT kuis.*, soal.*
FROM kuis
LEFT JOIN soal ON soal.kuis_id = kuis.id
WHERE kuis.id = ?
ORDER BY soal.urutan ASC
```

**Output:**
```tsx
{
  id: "uuid",
  judul: "Kuis Anatomi",
  durasi_menit: 60,
  status: "published",
  soal: [
    {
      id: "soal-1",
      pertanyaan: "Apa fungsi jantung?",
      tipe: "pilihan_ganda",
      poin: 10,
      urutan: 1,
      pilihan_jawaban: [{...}]
    },
    {
      id: "soal-2",  // ✅ Soal dari bank soal!
      pertanyaan: "Jelaskan sistem peredaran darah",
      tipe: "essay",
      poin: 20,
      urutan: 2
    }
  ]
}
```

**✅ SINKRONISASI:** Soal dari bank soal sudah di-**copy** ke table `soal`, jadi otomatis ter-load!

**File:** `src/pages/mahasiswa/kuis/KuisAttemptPage.tsx:55`
**API:** `getKuisById()` (line 137)

---

#### **3B. Start Attempt**
```typescript
// QuizAttempt component
const attempt = await startAttempt({
  kuis_id: quiz.id,
  mahasiswa_id: user.mahasiswa.id
});

// Insert ke table attempt_kuis:
INSERT INTO attempt_kuis (
  kuis_id,
  mahasiswa_id,
  started_at,
  status
) VALUES (?, ?, NOW(), 'in_progress')
```

**File:** `src/components/features/kuis/attempt/QuizAttempt.tsx`
**API:** `startAttempt()` (line 575)

---

#### **3C. Mahasiswa Jawab Soal**
```typescript
// Setiap soal dijawab
await submitAnswer({
  attempt_id: currentAttempt.id,
  soal_id: question.id,
  jawaban: userAnswer
});

// Insert/Update ke table jawaban:
INSERT INTO jawaban (
  attempt_id,
  soal_id,
  jawaban_text,  // atau jawaban_pilihan
  created_at
) VALUES (?, ?, ?, NOW())
ON CONFLICT (attempt_id, soal_id) DO UPDATE
SET jawaban_text = EXCLUDED.jawaban_text
```

**Features:**
- ✅ **Auto-save** setiap 30 detik
- ✅ **Offline support** (simpan di IndexedDB, sync nanti)
- ✅ Bisa next/previous soal
- ✅ Timer countdown

**File:** `src/components/features/kuis/attempt/QuizAttempt.tsx`
**API:** `submitAnswer()` (line 705)

---

#### **3D. Submit Kuis**
```typescript
await submitQuiz({
  attempt_id: currentAttempt.id,
  submitted_at: new Date().toISOString()
});

// Update attempt_kuis:
UPDATE attempt_kuis
SET status = 'submitted',
    submitted_at = NOW(),
    time_spent = ?
WHERE id = ?

// Auto-grading untuk pilihan ganda:
FOR EACH jawaban WHERE tipe_soal = 'pilihan_ganda':
  IF jawaban_pilihan = soal.jawaban_benar:
    UPDATE jawaban SET poin_diperoleh = soal.poin, is_correct = true
  ELSE:
    UPDATE jawaban SET poin_diperoleh = 0, is_correct = false

// Hitung total score:
UPDATE attempt_kuis
SET total_poin = (
  SELECT SUM(poin_diperoleh) FROM jawaban WHERE attempt_id = ?
)
```

**File:** `src/components/features/kuis/attempt/QuizAttempt.tsx`
**API:** `submitQuiz()` (line 719)

---

### **STEP 4: MAHASISWA LIHAT HASIL**

```typescript
// KuisResultPage.tsx
const attempt = await getAttemptById(attemptId);

// Query:
SELECT
  attempt_kuis.*,
  jawaban.*,
  soal.pertanyaan,
  soal.poin,
  soal.jawaban_benar
FROM attempt_kuis
LEFT JOIN jawaban ON jawaban.attempt_id = attempt_kuis.id
LEFT JOIN soal ON soal.id = jawaban.soal_id
WHERE attempt_kuis.id = ?
```

**Output:**
```tsx
{
  total_poin: 80,  // dari 100
  percentage: 80,
  is_passed: true,  // >= passing_score
  status: "graded",
  jawaban: [
    {
      soal: "Apa fungsi jantung?",
      jawaban_mahasiswa: "B",
      jawaban_benar: "B",
      is_correct: true,
      poin_diperoleh: 10
    },
    {
      soal: "Jelaskan sistem peredaran darah",
      jawaban_mahasiswa: "...",
      is_correct: null,  // Essay, belum dinilai dosen
      poin_diperoleh: 0,
      feedback: null
    }
  ]
}
```

**File:** `src/pages/mahasiswa/kuis/KuisResultPage.tsx`
**API:** `getAttemptById()` (line 544)

---

## 🔑 **KEY POINTS SINKRONISASI**

### ✅ **1. Soal dari Bank Soal**
```
bank_soal (soal reusable)
     ↓ COPY saat "Tambahkan dari Bank"
soal (soal dalam kuis tertentu)
     ↓ Query saat mahasiswa load kuis
QuizAttempt component (mahasiswa kerjakan)
```

**Tidak ada foreign key!** Soal di-copy, bukan di-link. Jadi:
- ✅ Edit soal di bank tidak affect kuis existing
- ✅ Hapus soal di bank tidak affect kuis existing
- ✅ Mahasiswa tetap lihat soal yang sama

---

### ✅ **2. Status Kuis**

| Status | Dosen | Mahasiswa |
|--------|-------|-----------|
| `draft` | ✅ Bisa edit | ❌ Tidak muncul di list |
| `published` | ⚠️ Terbatas edit | ✅ Muncul di list, bisa dikerjakan |
| `archived` | ✅ Bisa lihat | ❌ Tidak bisa attempt |

**Logic:** Mahasiswa **hanya lihat kuis dengan status = 'published'**

**File:** `src/lib/api/kuis.api.ts:841` (filter status)

---

### ✅ **3. Enrollment Check**

```sql
-- Mahasiswa hanya lihat kuis di kelas yang enrolled
SELECT * FROM kuis
WHERE kelas_id IN (
  SELECT kelas_id FROM kelas_mahasiswa
  WHERE mahasiswa_id = ?
    AND is_active = true
)
```

**Logic:**
- Admin/Dosen enroll mahasiswa ke kelas via `kelas_mahasiswa`
- Mahasiswa otomatis lihat semua kuis di kelas tersebut

**File:** `src/lib/api/kuis.api.ts:810-823`

---

### ✅ **4. Auto-Grading**

**Pilihan Ganda:**
```typescript
// Auto-grading saat submit
if (soal.tipe === 'pilihan_ganda') {
  const isCorrect = jawaban.jawaban_pilihan === soal.jawaban_benar;
  poin_diperoleh = isCorrect ? soal.poin : 0;
}
```

**Essay:**
```typescript
// Manual grading oleh dosen
// Status: 'submitted' → dosen review → 'graded'
// Dosen bisa kasih:
// - poin_diperoleh (0 - soal.poin)
// - feedback (text)
```

**File:** `src/lib/api/kuis.api.ts:775-800` (gradeAnswer)

---

## 🐛 **POTENTIAL ISSUES & FIXES**

### **Issue 1: Mahasiswa tidak lihat kuis**
**Penyebab:**
- Kuis status bukan 'published'
- Mahasiswa belum enrolled di kelas
- RLS policy block

**Fix:**
```sql
-- Cek status kuis
SELECT id, judul, status FROM kuis WHERE id = ?;

-- Cek enrollment
SELECT * FROM kelas_mahasiswa
WHERE mahasiswa_id = ? AND kelas_id = ?;

-- Cek RLS policy
SELECT * FROM kuis WHERE id = ? AND auth.uid() = ?;
```

---

### **Issue 2: Soal tidak muncul**
**Penyebab:**
- Soal belum di-add ke kuis
- Table `soal` kosong untuk kuis ini

**Fix:**
```sql
-- Cek soal di kuis
SELECT COUNT(*) FROM soal WHERE kuis_id = ?;

-- Jika 0, dosen perlu tambah soal!
```

---

### **Issue 3: Timer tidak akurat**
**Penyebab:**
- Client-side timer bisa di-manipulate
- Perlu server-side validation

**Fix:**
```typescript
// Validate di backend
const timeSpent = (submitTime - startTime) / 1000 / 60; // minutes
if (timeSpent > kuis.durasi_menit + 5) {
  // Allow 5 min tolerance
  throw new Error("Waktu pengerjaan melebihi durasi");
}
```

**File:** `src/lib/api/kuis.api.ts:719` (submitQuiz)

---

## 📊 **DATABASE FLOW**

```
┌─────────────┐
│ DOSEN       │
│ Creates     │
└──────┬──────┘
       │ createKuis()
       ↓
┌─────────────┐     ┌─────────────┐
│ kuis        │     │ bank_soal   │
│ id          │     │ id          │
│ judul       │     │ pertanyaan  │
│ status      │     └──────┬──────┘
└──────┬──────┘            │
       │                   │ addQuestionsFromBank()
       │ ←─────COPY────────┘
       ↓
┌─────────────┐
│ soal        │
│ id          │
│ kuis_id (FK)│
│ pertanyaan  │
│ urutan      │
└──────┬──────┘
       │
       │ getKuisById()
       ↓
┌─────────────┐
│ MAHASISWA   │
│ Views Quiz  │
└──────┬──────┘
       │ startAttempt()
       ↓
┌─────────────┐
│attempt_kuis │
│ id          │
│ kuis_id (FK)│
│ mahasiswa_id│
│ status      │
└──────┬──────┘
       │ submitAnswer()
       ↓
┌─────────────┐
│ jawaban     │
│ id          │
│ attempt_id  │
│ soal_id (FK)│
│ jawaban_text│
│ poin        │
└─────────────┘
```

---

## ✅ **CHECKLIST SINKRONISASI**

- [x] Dosen buat kuis → Tersimpan ke table `kuis`
- [x] Dosen tambah soal manual → Insert ke table `soal`
- [x] Dosen ambil dari bank → Copy dari `bank_soal` ke `soal`
- [x] Dosen publish → Update `kuis.status` = 'published'
- [x] Mahasiswa enrolled → Check table `kelas_mahasiswa`
- [x] Mahasiswa lihat list → Query `getUpcomingQuizzes()`
- [x] Mahasiswa load kuis → Query `getKuisById()` with soal
- [x] Mahasiswa start → Insert ke `attempt_kuis`
- [x] Mahasiswa jawab → Insert/Update ke `jawaban`
- [x] Mahasiswa submit → Update `attempt_kuis`, auto-grade PG
- [x] Mahasiswa lihat hasil → Query `getAttemptById()` with jawaban

---

## 🎯 **KESIMPULAN**

**Logika sudah SINKRON dan BENAR!**

✅ Soal dari bank soal **ter-load** ke mahasiswa
✅ Mahasiswa **hanya lihat** kuis yang published
✅ Mahasiswa **hanya lihat** kuis di kelas enrolled
✅ Jawaban **auto-save** dan **tersimpan**
✅ Pilihan ganda **auto-grade**
✅ Essay **manual grade** by dosen
✅ Support **offline mode**

**Tidak ada bug major dalam flow sinkronisasi!**

---

## 📁 **FILE REFERENSI**

| Component | File |
|-----------|------|
| Mahasiswa List | `src/pages/mahasiswa/kuis/KuisListPage.tsx` |
| Mahasiswa Attempt | `src/pages/mahasiswa/kuis/KuisAttemptPage.tsx` |
| Quiz Component | `src/components/features/kuis/attempt/QuizAttempt.tsx` |
| API Functions | `src/lib/api/kuis.api.ts` |
| Types | `src/types/kuis.types.ts` |

---

**Status:** ✅ Logika SINKRON dan SIAP DIGUNAKAN!
