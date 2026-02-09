# 🔧 FIX TOMBOL DIALOG TIDAK MUNCUL

## MASALAH
Tombol "Tambahkan X Soal" tidak terlihat di dialog karena **DialogFooter terpotong**.

## PENYEBAB
- ScrollArea tingginya 400px
- Total tinggi dialog melebihi max-h-[90vh]
- DialogFooter ada di luar viewport

## SOLUSI CEPAT

Edit file: `src/components/features/kuis/AddFromBankDialog.tsx`

### 1. Fix line 142 (DialogContent):
```tsx
SEBELUM:
<DialogContent className="max-w-3xl max-h-[90vh]">

SESUDAH:
<DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
```

### 2. Fix line 200 (ScrollArea):
```tsx
SEBELUM:
<ScrollArea className="h-[400px] pr-4">

SESUDAH:
<ScrollArea className="flex-1 max-h-[300px] pr-4">
```

### 3. Tambah wrapper di line 150 (setelah DialogHeader):
```tsx
<div className="flex-1 flex flex-col overflow-hidden space-y-4">
  {/* Filters */}
  <div className="space-y-4">
    ...existing filters code...
  </div>

  {/* Questions List */}
  <ScrollArea className="flex-1 max-h-[300px] pr-4">
    ...existing questions list...
  </ScrollArea>

  {/* Summary */}
  {selectedIds.length > 0 && (
    ...existing summary...
  )}
</div>
```

### 4. DialogFooter tetap di bawah (line 294):
```tsx
<DialogFooter className="mt-4">
  <Button variant="outline" onClick={() => onOpenChange(false)}>
    Batal
  </Button>
  <Button
    onClick={handleAdd}
    disabled={selectedIds.length === 0 || isAdding}
  >
    {isAdding ? "Menambahkan..." : `Tambahkan ${selectedIds.length} Soal`}
  </Button>
</DialogFooter>
```

## ATAU SOLUSI SUPER CEPAT

Edit hanya **line 200**:

```tsx
<ScrollArea className="h-[250px] pr-4">
```

Kurangi dari 400px ke 250px, tombol akan muncul!

---

## VERIFIKASI

Setelah fix:
1. Refresh browser (Ctrl+R)
2. Buka dialog "Ambil dari Bank"
3. **Scroll ke bawah** di dalam dialog
4. Tombol "Batal" dan "Tambahkan X Soal" harus terlihat!
