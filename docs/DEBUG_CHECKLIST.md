# ✅ Debug Checklist - Jadwal Tidak Muncul

## 🔍 Quick Diagnosis

Copy & paste salah satu query ini ke Supabase SQL Editor:

---

## **Query 1: Quick Summary**

```sql
SELECT
  'Kelas tanpa dosen_id' as issue,
  COUNT(*)::text as jumlah
FROM kelas WHERE dosen_id IS NULL
UNION ALL
SELECT 'Jadwal tanpa kelas_id', COUNT(*)::text
FROM jadwal_praktikum WHERE kelas_id IS NULL;
```

**Result interpretation:**
- Jika kedua nilai = 0 → Data OK, masalah di logic
- Jika ada nilai > 0 → Data NOT SAVED correctly

---

## **Query 2: Cek Kelas Terbaru**

```sql
SELECT nama_kelas, dosen_id, created_at
FROM kelas
ORDER BY created_at DESC
LIMIT 1;
```

**Check:**
- `dosen_id` harus NOT NULL
- Jika NULL → Code fix tidak jalan

---

## **Query 3: Cek Jadwal Terbaru**

```sql
SELECT j.id, j.kelas_id, k.nama_kelas, k.dosen_id, j.created_at
FROM jadwal_praktikum j
LEFT JOIN kelas k ON k.id = j.kelas_id
ORDER BY j.created_at DESC
LIMIT 1;
```

**Check:**
- `kelas_id` harus NOT NULL
- `dosen_id` (dari kelas) harus NOT NULL

---

## **🎯 STEP BY STEP:**

1. ☐ Buka https://app.supabase.com
2. ☐ Select project
3. ☐ Click "SQL Editor"
4. ☐ Click "+ New Query"
5. ☐ Copy Query 1
6. ☐ Paste ke editor
7. ☐ Click "RUN"
8. ☐ **Share hasil dengan developer!**

---

## 📸 HASIL YANG EXPECTED:

### If Query 1 returns (0, 0):
```
issue                  | jumlah
---------------------- | ------
Kelas tanpa dosen_id   | 0
Jadwal tanpa kelas_id  | 0
```
✅ Data OK → Problem di KehadiranPage filter logic

### If Query 1 returns (X > 0) or (Y > 0):
```
issue                  | jumlah
---------------------- | ------
Kelas tanpa dosen_id   | 5
Jadwal tanpa kelas_id  | 3
```
❌ Data NOT SAVED → Problem di Create Jadwal/Kelas

---

## 💬 THEN TELL ME:

1. **Query 1 results** - Angka berapa?
2. **Query 2 results** - dosen_id ada atau NULL?
3. **Query 3 results** - kelas_id ada atau NULL?
4. **Username yang login** - Siapa?

**Then I can fix it!** 🚀
