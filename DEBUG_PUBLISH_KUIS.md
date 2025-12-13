# 🐛 DEBUG: Tombol Publish Tidak Berfungsi

## LANGKAH DEBUG

### 1. Buka Browser Console (F12)

Tekan **F12** atau klik kanan → Inspect → Console tab

### 2. Refresh Halaman & Test Publish

1. Refresh halaman kuis (Ctrl+R atau F5)
2. Klik tombol **[Publish Kuis]**
3. **Lihat console**, cari pesan:

#### **Kemungkinan 1: Handler Dipanggil**
```
🔵 handlePublishQuiz called
🔵 currentQuiz: {id: "...", judul: "..."}
🔵 questions.length: 5
```

✅ **Handler jalan!** Lanjut ke log berikutnya:

#### **Kemungkinan 2: Confirm Dialog**
```
🔵 User confirmed: true
```

✅ **User konfirmasi!** Lanjut...

```
🔵 Calling updateKuis with status: published
```

✅ **API dipanggil!** Tunggu response...

#### **Kemungkinan 3A: SUCCESS**
```
✅ Updated quiz: {id: "...", status: "published"}
```

✅ **BERHASIL!** Kuis sudah published. Toast muncul.

#### **Kemungkinan 3B: ERROR**
```
❌ Error publishing quiz: {message: "..."}
```

❌ **ADA ERROR!** Copy error message dan kasih tahu saya.

---

### 3. Error yang Mungkin Muncul

#### **Error A: Permission Denied**
```
PermissionError: Insufficient permissions to manage:kuis
```

**Penyebab:** User bukan dosen atau tidak punya permission
**Solusi:** Cek user role di database

**SQL Check:**
```sql
-- Cek role user
SELECT u.id, u.email, u.role, d.id as dosen_id
FROM users u
LEFT JOIN dosen d ON d.user_id = u.id
WHERE u.email = 'your-email@example.com';
```

**Harus:**
- `role = 'dosen'`
- `dosen_id` tidak null

---

#### **Error B: Ownership Check Failed**
```
OwnershipError: Not the owner of this resource
```

**Penyebab:** Kuis bukan milik dosen yang login
**Solusi:** Cek dosen_id di table kuis

**SQL Check:**
```sql
-- Cek owner kuis
SELECT k.id, k.judul, k.dosen_id, d.user_id
FROM kuis k
LEFT JOIN dosen d ON d.id = k.dosen_id
WHERE k.id = 'KUIS_ID_HERE';
```

**Harus match dengan:** user yang login

---

#### **Error C: No Questions**
```
❌ No questions
```

**Penyebab:** Belum ada soal di kuis
**Solusi:** Tambah minimal 1 soal dulu!

---

#### **Error D: Kuis Belum Disimpan**
```
❌ No currentQuiz
```

**Penyebab:** Kuis belum disimpan (button "Simpan Informasi Kuis" belum diklik)
**Solusi:** Klik **[Simpan Informasi Kuis]** dulu!

---

#### **Error E: User Cancelled**
```
❌ User cancelled
```

**Penyebab:** User klik "Cancel" di confirm dialog
**Solusi:** Klik "OK" di confirm dialog

---

### 4. Kalau TIDAK ADA LOG SAMA SEKALI

Jika setelah klik [Publish Kuis] tidak ada log apapun:

**Kemungkinan:**
1. ❌ Tombol tidak terhubung ke handler
2. ❌ JavaScript error sebelum handler dipanggil
3. ❌ Event listener tidak ter-attach

**Check:**
- Lihat tab **Console** untuk error JavaScript lain (merah)
- Refresh halaman (Ctrl+R)
- Hard refresh (Ctrl+Shift+R)

---

## SOLUSI CEPAT

### Fix 1: Pastikan User adalah Dosen

```sql
-- Update user jadi dosen (jika belum)
UPDATE users SET role = 'dosen' WHERE email = 'your-email@example.com';

-- Pastikan ada record di table dosen
INSERT INTO dosen (user_id, nip, email)
SELECT id, 'NIP123', email
FROM users
WHERE email = 'your-email@example.com'
ON CONFLICT DO NOTHING;
```

### Fix 2: Pastikan Kuis Punya Soal

```sql
-- Cek jumlah soal
SELECT COUNT(*) FROM soal WHERE kuis_id = 'KUIS_ID';

-- Jika 0, tambah soal via UI atau:
-- Buka halaman edit kuis → Tambah soal
```

### Fix 3: Bypass Permission (Temporary Test)

Edit file: `src/lib/api/kuis.api.ts:223`

**BEFORE:**
```typescript
export const updateKuis = requirePermissionAndOwnership(
  "manage:kuis",
  { table: "kuis", ownerField: "dosen_id" },
  0,
  updateKuisImpl,
);
```

**AFTER (TEST ONLY!):**
```typescript
export const updateKuis = updateKuisImpl; // ⚠️ BYPASS PERMISSION
```

**⚠️ WARNING:** Ini hanya untuk testing! Jangan commit ke production!

---

## HASIL YANG BENAR

Setelah klik [Publish Kuis], seharusnya:

1. ✅ Muncul confirm dialog
2. ✅ Klik OK
3. ✅ Toast hijau: "Kuis berhasil dipublish!"
4. ✅ Badge status berubah: 🟡 Draft → 🟢 Published
5. ✅ Tombol [Publish Kuis] hilang (karena sudah published)

---

## NEXT STEPS

**Setelah debug, kasih tahu saya:**

1. **Apa yang muncul di console?** (screenshot atau copy text)
2. **Apakah ada error merah?**
3. **Tombol klik tapi tidak ada response?**
4. **Confirm dialog muncul?**

Dengan info ini saya bisa fix masalahnya! 🎯
