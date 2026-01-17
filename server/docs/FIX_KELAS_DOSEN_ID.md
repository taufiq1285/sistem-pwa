# 🔧 FIX: Update Kelas Lama dengan Dosen ID

## 🔍 ROOT CAUSE DITEMUKAN

**Masalah:**
- Jadwal tidak muncul di kehadiran dropdown
- KehadiranPage filter kelas by `dosen_id`
- Tapi **kelas LAMA punya `dosen_id = null`**
- Jadi tidak ada kelas yang ter-filter
- Hasilnya: Jadwal tidak muncul

---

## ✅ SOLUSI TERCEPAT: BUAT KELAS BARU

### **Step 1: Login sebagai Dosen**

### **Step 2: Buka JADWAL page**

### **Step 3: Klik "Tambah Jadwal"**

### **Step 4: Create NEW Kelas**
```
Mata Kuliah: Pilih atau ketik baru
Kelas: Ketik NAMA BARU (PENTING: HARUS BARU!)
Tanggal: Pilih tanggal
Jam Mulai: 09:00
Jam Selesai: 11:00
Laboratorium: Pilih
```

### **Step 5: Save Jadwal**
Kelas baru akan dibuat dengan `dosen_id = current dosen` ✅

### **Step 6: Open KEHADIRAN page**

### **Step 7: Check "Pilih Jadwal Praktikum" dropdown**
Should see jadwal yang baru dibuat!

### **Step 8: Test Kehadiran**
- Select jadwal
- Mahasiswa should auto-load
- Input kehadiran & save

---

## 📋 JIKA BERHASIL:
```
✅ Jadwal muncul di dropdown
✅ Mahasiswa auto-load
✅ Kehadiran input bekerja

FIX BERHASIL!
```

---

## 🔧 UPDATE KELAS LAMA (Optional - Run SQL)

Jika sudah ada kelas lama yang ingin di-recover:

### **SQL Query:**
```sql
UPDATE kelas
SET dosen_id = 'DOSEN_ID_HERE'
WHERE dosen_id IS NULL;
```

**Substitute `DOSEN_ID_HERE` dengan dosen ID dari database**

---

## 📝 CATATAN

**Mengapa?**
- Kelas lama punya `dosen_id = null`
- Code fix sudah diterapkan → Kelas BARU punya dosen_id
- KehadiranPage filter by dosen_id
- Jadi kelas lama tidak ter-filter

**Solusi:**
1. Buat kelas baru (sudah fixed di code)
2. Atau update kelas lama via SQL

Coba Opsi 1 dulu (buat kelas baru) untuk verify fix bekerja! 🚀
