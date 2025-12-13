# 🔍 Cara Run Debug SQL Queries

## 📋 File SQL Sudah Dibuat

File: `DEBUG_SQL_QUERIES.sql` - Berisi 10 query untuk debugging

---

## 🚀 CARA RUN (RECOMMENDED ORDER):

### **STEP 1: Buka Supabase Dashboard**
1. Go to `https://app.supabase.com`
2. Login dengan akun Anda
3. Select project "sistem-praktikum-pwa"

### **STEP 2: Buka SQL Editor**
4. Di sidebar kiri, cari **"SQL Editor"** atau **"Editor"**
5. Klik menu **"+" (New Query)**

### **STEP 3: Run Query 10 (SUMMARY - Tercepat!)**

**Copy query ini:**

```sql
SELECT
  'Total Kelas' as metric,
  COUNT(*)::text as value
FROM kelas
UNION ALL
SELECT 'Kelas dengan dosen_id', COUNT(*)::text FROM kelas WHERE dosen_id IS NOT NULL
UNION ALL
SELECT 'Kelas tanpa dosen_id (NULL)', COUNT(*)::text FROM kelas WHERE dosen_id IS NULL
UNION ALL
SELECT 'Total Jadwal', COUNT(*)::text FROM jadwal_praktikum
UNION ALL
SELECT 'Jadwal dengan kelas_id', COUNT(*)::text FROM jadwal_praktikum WHERE kelas_id IS NOT NULL
UNION ALL
SELECT 'Jadwal tanpa kelas_id (NULL)', COUNT(*)::text FROM jadwal_praktikum WHERE kelas_id IS NULL;
```

**Paste ke SQL Editor dan klik "RUN"**

Expected result:
```
metric                          | value
------------------------------- | -----
Total Kelas                     | X
Kelas dengan dosen_id           | Y
Kelas tanpa dosen_id (NULL)     | Z
Total Jadwal                    | A
Jadwal dengan kelas_id          | B
Jadwal tanpa kelas_id (NULL)    | C
```

**PENTING - Cek:**
- Jika "Kelas tanpa dosen_id (NULL)" > 0 → MASALAH!
- Jika "Jadwal tanpa kelas_id (NULL)" > 0 → MASALAH!

---

### **STEP 4: Run Query 6 (Cek Kelas Terbaru)**

```sql
SELECT
  k.id,
  k.nama_kelas,
  k.kode_kelas,
  k.dosen_id,
  k.created_at,
  (SELECT COUNT(*) FROM jadwal_praktikum WHERE kelas_id = k.id) as jadwal_count
FROM kelas k
ORDER BY k.created_at DESC
LIMIT 5;
```

**Penting:**
- Look at top row (kelas terbaru)
- Check `dosen_id` column
  - ✅ Jika ADA value (long string) → GOOD
  - ❌ Jika NULL → CODE FIX TIDAK JALAN!

---

### **STEP 5: Run Query 7 (Cek Jadwal Terbaru)**

```sql
SELECT
  j.id,
  j.kelas_id,
  j.tanggal_praktikum,
  j.jam_mulai,
  k.nama_kelas,
  k.dosen_id,
  j.created_at
FROM jadwal_praktikum j
LEFT JOIN kelas k ON k.id = j.kelas_id
ORDER BY j.created_at DESC
LIMIT 5;
```

**Penting:**
- Look at top row (jadwal terbaru)
- Check `kelas_id` column
  - ✅ Jika ADA value → GOOD
  - ❌ Jika NULL → JADWAL NOT SAVED CORRECTLY!
- Check `dosen_id` column (from kelas)
  - ✅ Jika ADA value → GOOD
  - ❌ Jika NULL → KELAS MASALAH!

---

### **STEP 6 (OPTIONAL): Run Query 1 (Lihat Semua Kelas)**

```sql
SELECT
  k.id,
  k.nama_kelas,
  k.kode_kelas,
  k.dosen_id,
  d.id as dosen_check_id,
  COUNT(j.id) as jumlah_jadwal
FROM kelas k
LEFT JOIN dosen d ON d.id = k.dosen_id
LEFT JOIN jadwal_praktikum j ON j.kelas_id = k.id
GROUP BY k.id, k.nama_kelas, k.kode_kelas, k.dosen_id, d.id
ORDER BY k.created_at DESC
LIMIT 20;
```

---

## 📸 SHARE HASIL:

**Screenshot atau paste hasil queries di atas!**

Terutama dari:
- Query 10 (SUMMARY)
- Query 6 (Kelas terbaru - ada dosen_id?)
- Query 7 (Jadwal terbaru - ada kelas_id?)

---

## 🎯 INTERPRETASI HASIL:

### **Scenario 1: Kelas baru punya dosen_id ✅**
```
Query 6 Result:
nama_kelas  | dosen_id
------------ | --------
Kelas Test A | c123...456 (NOT NULL)

Query 7 Result:
nama_kelas  | kelas_id
------------ | --------
Kelas Test A | k123...456 (NOT NULL)
```

**DIAGNOSIS:** Code fix berhasil! Data saved correctly!
**MASALAH:** Di KehadiranPage logic/filter

---

### **Scenario 2: Kelas baru dosen_id = NULL ❌**
```
Query 6 Result:
nama_kelas  | dosen_id
------------ | --------
Kelas Test A | (NULL)
```

**DIAGNOSIS:** Code fix NOT WORKING!
**MASALAH:** JadwalPage getOrCreateKelas function tidak jalan

---

### **Scenario 3: Jadwal kelas_id = NULL ❌**
```
Query 7 Result:
jadwal_id | kelas_id
--------- | --------
j123...   | (NULL)
```

**DIAGNOSIS:** Jadwal not linked to kelas!
**MASALAH:** CreateJadwal function issue

---

## ❓ PERTANYAAN JIKA STUCK:

1. Anda login sebagai siapa (email)?
2. Kelas baru dibuat kapan? (lihat tanggal)
3. Jadwal dibuat sebelum atau sesudah kelas?
4. Ada error di console browser? (F12)

---

## 📝 NEXT STEPS:

1. **Run Query 10 → Copy hasil**
2. **Run Query 6 → Copy hasil**
3. **Run Query 7 → Copy hasil**
4. **Share semua hasil!**

Dengan hasil query, saya bisa langsung tahu dimana masalahnya! 🎯
