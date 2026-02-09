# Fix Kuis Offline - IndexedDB Schema Update

## Masalah yang Diperbaiki

### 1. Error IndexedDB saat Akses Kuis Offline
**Error:**
```
NotFoundError: Failed to execute 'transaction' on 'IDBDatabase':
One of the specified object stores was not found.
```

**Penyebab:**
- Kode `kuis.api.ts` menggunakan object stores: `offline_quiz`, `offline_questions`, `offline_answers`, `offline_attempts`
- Schema IndexedDB di `indexeddb.ts` tidak memiliki object stores tersebut

**Solusi:**
- ✅ Menambahkan 4 object stores baru ke schema IndexedDB
- ✅ Upgrade database version dari 1 ke 2
- ✅ Menambahkan indexes untuk optimasi query

### 2. Validasi Akses Kuis Mahasiswa
**Masalah:**
- Mahasiswa tidak bisa mengakses kuis yang sudah dipublish
- Validasi menggunakan tanggal yang seharusnya tidak diperlukan

**Solusi:**
- ✅ Hapus validasi tanggal di `KuisAttemptPage.tsx`
- ✅ Hanya check status: `published` = mahasiswa bisa akses
- ✅ Update status label di `QuizCard.tsx` - hapus "Terjadwal"
- ✅ Simplify logic status di `KuisListPage.tsx`

### 3. Teks "Tambah Soal" → "Buat Soal"
- ✅ Update semua teks "Tambah Soal" menjadi "Buat Soal"
- ✅ Lokasi: `QuizBuilder.tsx`, `QuestionEditor.tsx`

---

## Perubahan File

### 1. `src/lib/offline/indexeddb.ts`
```typescript
// Upgrade database version
const DB_VERSION = 2; // ✅ Was: 1

// Tambah object stores baru:
{
  name: "offline_quiz",
  keyPath: "id",
  indexes: [{ name: "cachedAt", keyPath: "cachedAt" }],
},
{
  name: "offline_questions",
  keyPath: "id",
  indexes: [
    { name: "kuis_id", keyPath: "kuis_id" },
    { name: "cachedAt", keyPath: "cachedAt" },
  ],
},
{
  name: "offline_answers",
  keyPath: "id",
  indexes: [
    { name: "kuis_id", keyPath: "kuis_id" },
    { name: "mahasiswa_id", keyPath: "mahasiswa_id" },
    { name: "attempt_id", keyPath: "attempt_id" },
    { name: "synced", keyPath: "synced" },
  ],
},
{
  name: "offline_attempts",
  keyPath: "id",
  indexes: [
    { name: "kuis_id", keyPath: "kuis_id" },
    { name: "mahasiswa_id", keyPath: "mahasiswa_id" },
    { name: "synced", keyPath: "synced" },
    { name: "cachedAt", keyPath: "cachedAt" },
  ],
}
```

### 2. `src/pages/mahasiswa/kuis/KuisAttemptPage.tsx`
```typescript
// ✅ BEFORE: Check dates + status
if (!isActive) { ... }
if (now < startDate) { ... }
if (now > endDate) { ... }

// ✅ AFTER: Only check status
if (status !== 'published' && status !== 'active') {
  setError("Kuis ini belum dipublish oleh dosen");
  return;
}
```

### 3. `src/pages/dosen/kuis/KuisListPage.tsx`
```typescript
// ✅ Simplified status filter (removed "scheduled")
type StatusFilter = "all" | "draft" | "active" | "ended";

// ✅ Simplified status logic
function getQuizStatusFromDates(quiz: Kuis): StatusFilter {
  const status = quiz.status || 'draft';
  if (status === 'published') return 'active';
  if (status === 'draft') return 'draft';
  if (status === 'archived') return 'ended';
  return 'draft';
}
```

### 4. `src/components/features/kuis/QuizCard.tsx`
```typescript
// ✅ Removed date logic
if (quizStatus === "archived") {
  statusLabel = "Diarsipkan";
} else if (isPublished) {
  statusLabel = "Aktif"; // No date checking
}
```

---

## Cara Test

### A. Clear IndexedDB (WAJIB!)
Karena database version diupgrade dari 1 → 2, user harus clear IndexedDB:

**Opsi 1: Lewat Browser DevTools**
1. Buka DevTools (F12)
2. Tab **Application** → **Storage** → **IndexedDB**
3. Klik kanan `sistem_praktikum_pwa` → **Delete database**
4. Refresh halaman (Ctrl+R)

**Opsi 2: Lewat Console**
```javascript
indexedDB.deleteDatabase('sistem_praktikum_pwa')
```
Kemudian refresh halaman.

**Opsi 3: Hard Refresh**
```
Ctrl + Shift + Delete → Clear browsing data → Cached images and files
```

### B. Test Flow Kuis

#### 1. Sebagai Dosen:
1. Login sebagai dosen
2. Buat kuis baru → Isi form → Klik "Buat Soal"
3. Tambahkan beberapa soal
4. **Publish kuis** (klik tombol Publish/Aktifkan di QuizCard)

#### 2. Sebagai Mahasiswa:
1. Login sebagai mahasiswa (di kelas yang sama dengan kuis)
2. Pergi ke menu **Kuis**
3. Kuis yang sudah dipublish **harus muncul**
4. Klik **"Mulai Kuis"**
5. **Harusnya TIDAK ada error** "Kuis belum aktif"
6. Form kuis harusnya muncul

#### 3. Test Offline Mode:
1. Buka kuis (saat online)
2. Disconnect internet (Airplane mode / disable network)
3. Jawab beberapa soal
4. Harusnya data tersimpan di IndexedDB (cek di DevTools)
5. Reconnect internet
6. Data harusnya auto-sync ke server

---

## Console Debug

Saat mengakses kuis, di console harusnya muncul:
```
🔵 Quiz status: published
🔵 Quiz data: {...}
✅ Kuis sudah dipublish, mahasiswa bisa mengakses
```

Jika masih error:
```
❌ Kuis ini belum dipublish oleh dosen
```
Berarti status kuis masih `draft`, dosen perlu publish dulu.

---

## Rollback Console.log

File yang masih ada console.log debug:
1. `src/components/features/kuis/builder/QuizBuilder.tsx` (line 218-240)
2. `src/pages/mahasiswa/kuis/KuisAttemptPage.tsx` (line 62-73)

Hapus console.log setelah testing selesai.

---

## Checklist

- [x] Update IndexedDB schema (tambah 4 object stores)
- [x] Upgrade database version ke 2
- [x] Hapus validasi tanggal di KuisAttemptPage
- [x] Simplify status logic di KuisListPage
- [x] Update QuizCard status display
- [x] Ganti "Tambah Soal" → "Buat Soal"
- [x] TypeScript compile tanpa error
- [ ] Clear IndexedDB di browser (USER WAJIB!)
- [ ] Test create kuis + publish
- [ ] Test mahasiswa akses kuis
- [ ] Test offline mode
- [ ] Hapus console.log debug
