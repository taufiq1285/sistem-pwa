# UPDATE DOSEN: NIP → NIDN/NUPTK

## 📋 Summary
Mengubah sistem dosen dari menggunakan **NIP** menjadi **NIDN/NUPTK** sebagai identifier utama.

---

## 🔧 STEP 1: Update Database (Supabase)

Jalankan file `supabase/add_nidn_nuptk.sql` di **Supabase SQL Editor**:

```sql
-- Tambahkan kolom NIDN dan NUPTK
ALTER TABLE public.dosen
ADD COLUMN IF NOT EXISTS nidn VARCHAR(20),
ADD COLUMN IF NOT EXISTS nuptk VARCHAR(20);

-- Drop unique constraint dari NIP
ALTER TABLE public.dosen
DROP CONSTRAINT IF EXISTS dosen_nip_key;

-- Tambahkan unique constraint ke NIDN
ALTER TABLE public.dosen
ADD CONSTRAINT dosen_nidn_key UNIQUE (nidn);

-- Ubah NIP jadi NULLABLE
ALTER TABLE public.dosen
ALTER COLUMN nip DROP NOT NULL;

-- Update data existing - Pindahkan NIP ke NIDN
UPDATE public.dosen
SET nidn = nip,
    nip = NULL
WHERE nidn IS NULL;
```

---

## 📝 STEP 2: Update Validation Schema

**File:** `src/lib/validations/auth.schema.ts`

Ganti bagian `staffFields` (line 74-85) dengan ini:

```typescript
// ✅ UPDATED: Dosen fields - NIDN/NUPTK instead of NIP
const dosenFields = z.object({
  nidn: z
    .string()
    .min(1, 'NIDN is required')
    .regex(
      /^\d{10}$/,
      'NIDN must be exactly 10 digits'
    ),
  nuptk: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{16}$/.test(val),
      'NUPTK must be exactly 16 digits if provided'
    ),
  nip: z.string().optional(), // NIP opsional (hanya untuk PNS)
  gelar_depan: z.string().optional(),
  gelar_belakang: z.string().optional(),
  fakultas: z.string().optional(),
  program_studi: z.string().optional(),
});

// Laboran fields - need NIP
const laboranFields = z.object({
  nip: z
    .string()
    .min(1, 'NIP is required')
    .regex(
      /^\d{10,18}$/,
      'NIP must be 10-18 digits'
    ),
});
```

Dan ubah `registerSchema` (line 90-94):

```typescript
z.discriminatedUnion('role', [
  z.object({ role: z.literal('mahasiswa') }).merge(mahasiswaFields),
  z.object({ role: z.literal('dosen') }).merge(dosenFields),       // ✅ CHANGED
  z.object({ role: z.literal('laboran') }).merge(laboranFields),   // ✅ CHANGED
])
```

**ATAU** copy file `src/lib/validations/auth.schema.NEW.ts` → replace `auth.schema.ts`

---

## 🔄 STEP 3: Update Types

**File:** `src/types/auth.types.ts` (line 30-38)

Sudah benar! Sudah ada `nidn`:

```typescript
dosen?: {
  id: string;
  nip: string;
  nidn?: string;  // ✅ Already exists
  gelar_depan?: string;
  gelar_belakang?: string;
  fakultas?: string;
  program_studi?: string;
};
```

---

## 🔍 STEP 4: Update Dosen Existing

Di **Supabase SQL Editor**, update dosen yang sudah ada:

```sql
-- Update dosen test dengan NIDN
UPDATE public.dosen
SET nidn = '0123456789',  -- ⚠️ GANTI dengan NIDN yang benar (10 digit)
    nuptk = '1234567890123456',  -- ⚠️ OPTIONAL: NUPTK (16 digit)
    nip = NULL  -- Kosongkan NIP (kecuali dosen PNS)
WHERE user_id IN (
  SELECT id FROM public.users WHERE email = 'dosen@akbid.ac.id'
);
```

---

## ✅ STEP 5: Verifikasi

```sql
-- Cek struktur table dosen
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'dosen'
AND column_name IN ('nip', 'nidn', 'nuptk')
ORDER BY ordinal_position;

-- Cek data dosen
SELECT
    u.email,
    d.nip,
    d.nidn,
    d.nuptk,
    d.gelar_depan,
    d.gelar_belakang
FROM public.dosen d
JOIN public.users u ON d.user_id = u.id;
```

---

## 📚 Format NIDN & NUPTK

### NIDN (10 digit)
Format: `DDMMYYKKNNN`
- DD = Tanggal lahir
- MM = Bulan lahir
- YY = 2 digit tahun lahir terakhir
- KK = Kode PT
- NNN = Nomor urut

Contoh: `0112806501`

### NUPTK (16 digit)
Format: `XXXXYYYYMMDDNNNN`

Contoh: `1234567890123456`

### NIP (Opsional)
Hanya untuk dosen PNS
Format: 18 digit

---

## 🚀 Testing

1. **Update database** dengan SQL di atas
2. **Replace** file `auth.schema.ts` dengan versi baru
3. **Restart** development server: `npm run dev`
4. **Test registrasi** dosen baru → Harus input NIDN (10 digit)
5. **Test login** dosen existing → Harus bisa login

---

## ✅ Checklist

- [ ] Run SQL migration di Supabase
- [ ] Update `auth.schema.ts`
- [ ] Update NIDN untuk dosen existing
- [ ] Test registrasi dosen baru
- [ ] Test login dosen
- [ ] Verifikasi data di database

---

**Need Help?** Jika ada error, check:
1. Apakah NIDN sudah unique di database?
2. Apakah validation schema sudah di-update?
3. Apakah dev server sudah di-restart?
