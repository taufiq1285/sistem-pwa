# ✅ Tombol "Simpan Kuis" Muncul Setelah Buat Soal

## 🔍 Masalah

Tombol "Simpan Kuis" muncul **SEBELUM** dosen buat soal. Ini membingungkan karena kuis tanpa soal tidak ada gunanya!

**Flow Lama (❌):**
```
1. Isi form kuis
2. ❌ Klik "Simpan Kuis" (padahal belum ada soal!)
3. Klik "Tambah Soal"
4. Buat soal-soal
```

---

## ✅ Solusi

Tombol "Simpan Kuis" **HANYA muncul SETELAH** dosen selesai buat soal!

**Flow Baru (✅):**
```
1. Isi form kuis (judul, durasi)
2. ✅ Klik "Tambah Soal"
3. ✅ Auto-save kuis + buka editor soal
4. Buat soal-soal (essay, pilihan ganda, dll)
5. ✅ Tombol "Simpan & Kembali" BARU muncul
```

---

## 📝 Perubahan Code

### File: `src/components/features/kuis/builder/QuizBuilder.tsx`

**1. Hapus Tombol "Simpan Kuis" dari Form Metadata**

**SEBELUM:**
```typescript
<div className="flex gap-2 pt-4">
  {onCancel && <Button onClick={onCancel}>Batal</Button>}
  <Button onClick={handleSubmit(handleSaveQuizMetadata)}>
    <Save className="h-4 w-4 mr-2" />
    Simpan Kuis  // ❌ Terlalu dini!
  </Button>
</div>
```

**SESUDAH:**
```typescript
{/* ✅ REMOVED: Simpan Kuis button - auto-save when adding questions */}
```

**2. Auto-save Kuis Saat Klik "Tambah Soal"**

**SEBELUM:**
```typescript
const handleAddQuestion = () => {
  if (!currentQuiz) {
    toast.error('Simpan kuis terlebih dahulu'); // ❌ User harus save manual
    return;
  }
  setEditorState({ isOpen: true, index: questions.length });
};
```

**SESUDAH:**
```typescript
const handleAddQuestion = async () => {
  // ✅ Auto-save quiz if not saved yet
  if (!currentQuiz) {
    const formData = watch();
    const validation = await handleSubmit(() => {})();

    if (!validation) {
      toast.error('Isi form kuis dengan lengkap terlebih dahulu');
      return;
    }

    // Auto-save quiz
    setIsSaving(true);
    try {
      const dataWithDates = {
        ...formData,
        tanggal_mulai: formData.tanggal_mulai || new Date().toISOString(),
        tanggal_selesai: formData.tanggal_selesai || (() => {
          const oneYearLater = new Date();
          oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
          return oneYearLater.toISOString();
        })(),
      };

      const savedQuiz = await createKuis(dataWithDates);
      setCurrentQuiz(savedQuiz);
      toast.success('Kuis disimpan! Silakan tambah soal.');
      setEditorState({ isOpen: true, index: questions.length });
    } catch (error: any) {
      toast.error('Gagal menyimpan kuis');
    } finally {
      setIsSaving(false);
    }
    return;
  }

  setEditorState({ isOpen: true, index: questions.length });
};
```

**3. Tombol "Simpan" Hanya Muncul Setelah Ada Soal**

**SEBELUM:**
```typescript
{currentQuiz && (  // ✅ Muncul setelah save, meski belum ada soal
  <Button onClick={() => onSave(currentQuiz)}>
    Selesai & Kembali
  </Button>
)}
```

**SESUDAH:**
```typescript
{currentQuiz && questions.length > 0 && (  // ✅ Muncul hanya setelah ada soal
  <Button onClick={() => onSave(currentQuiz)}>
    Simpan & Kembali ke Daftar Kuis
  </Button>
)}
```

**4. Tombol "Tambah Soal" Selalu Aktif**

**SEBELUM:**
```typescript
const canAddQuestions = !!currentQuiz; // ❌ Disabled sampai save
```

**SESUDAH:**
```typescript
const canAddQuestions = true; // ✅ Always enabled - auto-save on first add
```

---

## 🎨 Tampilan UI Baru

### 1. Form Kuis (Awal)

```
┌────────────────────────────────────┐
│ Informasi Kuis                     │
├────────────────────────────────────┤
│ Kelas: [Pilih Kelas ▼]            │
│ Judul: Kuis Anatomi                │
│ Deskripsi: ______________          │
│ Durasi (menit): 60                 │
│                                    │
│ ⚠️ TIDAK ADA tombol "Simpan Kuis"  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Daftar Soal        [Tambah Soal]  │
├────────────────────────────────────┤
│                                    │
│    📄                              │
│                                    │
│    [Tambah Soal]                   │
│                                    │
└────────────────────────────────────┘

⚠️ TIDAK ADA tombol "Simpan & Kembali"
```

### 2. Klik "Tambah Soal"

```
✅ Auto-save kuis terjadi!
✅ Toast: "Kuis disimpan! Silakan tambah soal."
✅ Editor soal muncul
```

### 3. Setelah Tambah Soal

```
┌────────────────────────────────────┐
│ Informasi Kuis                     │
├────────────────────────────────────┤
│ Kelas: Kelas A                     │
│ Judul: Kuis Anatomi                │
│ Deskripsi: Kuis tentang anatomi    │
│ Durasi (menit): 60                 │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Daftar Soal        [Tambah Soal]  │
│ 3 soal · 30 poin                   │
├────────────────────────────────────┤
│ #1 Jelaskan anatomi jantung        │
│    10 poin | essay   [Edit] [🗑]  │
│                                    │
│ #2 Berapa ruang jantung manusia?   │
│    10 poin | essay   [Edit] [🗑]  │
│                                    │
│ #3 Fungsi katup mitral adalah...   │
│    10 poin | essay   [Edit] [🗑]  │
└────────────────────────────────────┘

✅ [Simpan & Kembali ke Daftar Kuis]  ← MUNCUL!
```

---

## 🚀 Flow Lengkap Buat Kuis (Updated)

### SEBELUM (❌ Ribet):

1. Isi form kuis
2. Klik "Simpan Kuis" ← Tombol ini muncul terlalu dini!
3. Klik "Tambah Soal"
4. Buat soal
5. Klik "Selesai"

### SESUDAH (✅ Simple):

1. **Isi form kuis** (judul, kelas, durasi)
2. **Klik "Tambah Soal"**
   - ✅ Auto-save kuis terjadi
   - ✅ Editor soal langsung muncul
3. **Buat soal** (essay, pilihan ganda, dll)
4. **Ulangi** untuk soal lainnya
5. **Klik "Simpan & Kembali"** ← Tombol ini BARU muncul setelah ada soal!

---

## 🎯 Keuntungan

✅ **Tidak ada kuis kosong** - Dosen harus buat soal dulu
✅ **Lebih intuitif** - Tombol muncul saat yang tepat
✅ **Auto-save** - Tidak perlu klik "Simpan Kuis" manual
✅ **Lebih efisien** - Langsung ke inti (buat soal)

---

## ✅ Test Checklist

- [ ] Refresh browser (F5)
- [ ] Login sebagai dosen
- [ ] Klik "Buat Kuis"
- [ ] Isi form kuis:
  - [ ] Pilih/buat kelas
  - [ ] Isi judul: "Kuis Anatomi"
  - [ ] Isi durasi: 60
- [ ] ✅ **Cek:** TIDAK ada tombol "Simpan Kuis"
- [ ] ✅ **Cek:** TIDAK ada tombol "Simpan & Kembali"
- [ ] Klik "Tambah Soal"
- [ ] ✅ **Cek:** Toast "Kuis disimpan!"
- [ ] ✅ **Cek:** Editor soal muncul
- [ ] Buat soal essay
- [ ] Klik "Simpan Soal"
- [ ] ✅ **Cek:** Soal muncul di daftar
- [ ] ✅ **Cek:** Tombol "Simpan & Kembali" MUNCUL!
- [ ] Tambah 2-3 soal lagi
- [ ] Klik "Simpan & Kembali ke Daftar Kuis"
- [ ] ✅ **Cek:** Redirect ke /dosen/kuis
- [ ] ✅ **Cek:** Kuis muncul di daftar dengan jumlah soal

---

Dev server: **http://localhost:5174/**

Test sekarang dan report hasilnya! 🚀
