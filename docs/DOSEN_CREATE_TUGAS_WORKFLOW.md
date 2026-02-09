# 📝 Workflow: Dosen Membuat Tugas/Kuis

## 🎯 Overview

Saat dosen membuat tugas praktikum atau kuis, mereka dapat memilih:

1. **Mata Kuliah** - Mata kuliah apa untuk tugas ini
2. **Kelas** - Kelas mana saja yang diberi tugas (single atau multiple)

## 📋 User Flow

```
┌─────────────────────────────────────────────────┐
│  Dosen: Buat Tugas Praktikum                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. [Dropdown] Pilih Mata Kuliah               │
│     ├─ Praktikum Kimia Organik                 │
│     ├─ Praktikum Fisika Dasar                  │
│     └─ Praktikum Biologi                       │
│                                                 │
│  2. [Multi-Select] Pilih Kelas                 │
│     ├─ ☑ Kelas A (30 mahasiswa)                │
│     ├─ ☑ Kelas B (25 mahasiswa)                │
│     └─ ☐ Kelas C (28 mahasiswa)                │
│                                                 │
│  3. Detail Tugas                                │
│     ├─ Judul: "Laporan Praktikum 1"            │
│     ├─ Deskripsi: ...                          │
│     ├─ Deadline: 2026-01-20                    │
│     └─ Tipe: FILE_UPLOAD (Laporan)             │
│                                                 │
│  [Simpan & Publikasikan]                       │
└─────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

### **Table: `kuis`**

```sql
CREATE TABLE kuis (
    id UUID PRIMARY KEY,
    kelas_id UUID NOT NULL,              -- Single kelas
    dosen_id UUID NOT NULL,              -- Creator
    mata_kuliah_id UUID NULL,            -- Explicitly selected by dosen
    judul TEXT NOT NULL,
    deskripsi TEXT,
    -- ... other fields
);
```

**Key Points:**

- `kelas_id`: Single kelas (existing design)
- `mata_kuliah_id`: **NEW** - Explicitly set by dosen in UI
- For multiple kelas → Create multiple kuis records (1 per kelas)

---

## 🔧 Implementation Options

### **Option 1: Multiple Kuis Records (Current Schema Compatible)** ⭐

**Approach:** Create 1 kuis record per selected kelas

```typescript
// Frontend: QuizBuilder.tsx
const handleCreateTugas = async (data: FormData) => {
  const selectedMataKuliahId = data.mata_kuliah_id;
  const selectedKelasIds = data.kelas_ids; // ['kelas-a', 'kelas-b']

  // Create kuis for each selected kelas
  const promises = selectedKelasIds.map((kelasId) =>
    createKuis({
      kelas_id: kelasId,
      dosen_id: currentDosenId,
      mata_kuliah_id: selectedMataKuliahId, // ✅ Explicitly set
      judul: data.judul,
      deskripsi: data.deskripsi,
      // ... other fields
    })
  );

  await Promise.all(promises);
  toast.success(`Tugas dibuat untuk ${selectedKelasIds.length} kelas`);
};
```

**Pros:**

- ✅ Compatible with existing schema
- ✅ No database changes needed
- ✅ Each kelas has own kuis instance (can customize per kelas)
- ✅ Automatic multi-dosen grading (same mata_kuliah_id)

**Cons:**

- ⚠️ Creates multiple records (but OK for performance)
- ⚠️ If dosen edits tugas, must update all instances

---

### **Option 2: Junction Table (Advanced)**

**Approach:** Many-to-many relationship between kuis and kelas

```sql
-- New table
CREATE TABLE kuis_kelas (
    id UUID PRIMARY KEY,
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    UNIQUE(kuis_id, kelas_id)
);

-- Modify kuis table (make kelas_id nullable)
ALTER TABLE kuis ALTER COLUMN kelas_id DROP NOT NULL;
```

**Pros:**

- ✅ Single kuis for multiple kelas
- ✅ Easy to edit (update 1 record affects all kelas)

**Cons:**

- ❌ Requires schema changes
- ❌ Breaking change for existing code
- ❌ More complex queries

---

## 🎨 UI Components

### **1. Mata Kuliah Selector**

```typescript
// components/features/kuis/MataKuliahSelector.tsx
import { Select } from "@/components/ui/select";
import { useMataKuliah } from "@/lib/hooks/useMataKuliah";

interface MataKuliahSelectorProps {
  value?: string;
  onChange: (mataKuliahId: string) => void;
  dosenId: string;
}

export function MataKuliahSelector({ value, onChange, dosenId }: MataKuliahSelectorProps) {
  const { mataKuliahList, isLoading } = useMataKuliah(dosenId);

  return (
    <div>
      <Label>Mata Kuliah *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih mata kuliah untuk tugas ini" />
        </SelectTrigger>
        <SelectContent>
          {mataKuliahList.map(mk => (
            <SelectItem key={mk.id} value={mk.id}>
              {mk.kode_mk} - {mk.nama_mk}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground mt-1">
        Pilih mata kuliah yang relevan dengan tugas ini
      </p>
    </div>
  );
}
```

---

### **2. Kelas Multi-Selector**

```typescript
// components/features/kuis/KelasMultiSelector.tsx
import { Checkbox } from "@/components/ui/checkbox";
import { useKelas } from "@/lib/hooks/useKelas";

interface KelasMultiSelectorProps {
  value: string[]; // selected kelas IDs
  onChange: (kelasIds: string[]) => void;
  dosenId: string;
  mataKuliahId?: string; // Optional filter
}

export function KelasMultiSelector({
  value,
  onChange,
  dosenId,
  mataKuliahId
}: KelasMultiSelectorProps) {
  const { kelasList, isLoading } = useKelas(dosenId);

  // Optional: Filter by mata_kuliah
  const filteredKelas = mataKuliahId
    ? kelasList.filter(k => k.mata_kuliah_id === mataKuliahId)
    : kelasList;

  const handleToggle = (kelasId: string) => {
    if (value.includes(kelasId)) {
      onChange(value.filter(id => id !== kelasId));
    } else {
      onChange([...value, kelasId]);
    }
  };

  return (
    <div>
      <Label>Kelas *</Label>
      <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
        {filteredKelas.map(kelas => (
          <div key={kelas.id} className="flex items-center space-x-3">
            <Checkbox
              id={`kelas-${kelas.id}`}
              checked={value.includes(kelas.id)}
              onCheckedChange={() => handleToggle(kelas.id)}
            />
            <label
              htmlFor={`kelas-${kelas.id}`}
              className="flex-1 cursor-pointer"
            >
              <div className="font-medium">{kelas.nama_kelas}</div>
              <div className="text-sm text-muted-foreground">
                {kelas.jumlah_mahasiswa || 0} mahasiswa
              </div>
            </label>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {value.length} kelas dipilih
      </p>
    </div>
  );
}
```

---

### **3. Updated QuizBuilder Form**

```typescript
// components/features/kuis/builder/QuizBuilder.tsx
import { MataKuliahSelector } from "../MataKuliahSelector";
import { KelasMultiSelector } from "../KelasMultiSelector";

export function QuizBuilder({ dosenId }: { dosenId: string }) {
  const [mataKuliahId, setMataKuliahId] = useState<string>("");
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);

  const handleSave = async (formData: CreateKuisData) => {
    if (!mataKuliahId) {
      toast.error("Pilih mata kuliah terlebih dahulu");
      return;
    }

    if (selectedKelasIds.length === 0) {
      toast.error("Pilih minimal 1 kelas");
      return;
    }

    try {
      // Create kuis for each selected kelas
      const promises = selectedKelasIds.map(kelasId =>
        createKuis({
          ...formData,
          kelas_id: kelasId,
          dosen_id: dosenId,
          mata_kuliah_id: mataKuliahId, // ✅ Explicitly set
        })
      );

      await Promise.all(promises);

      toast.success(
        `Tugas berhasil dibuat untuk ${selectedKelasIds.length} kelas`
      );
      navigate("/dosen/kuis");

    } catch (error) {
      toast.error("Gagal membuat tugas");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSave)}>
      {/* Step 1: Select Mata Kuliah */}
      <MataKuliahSelector
        value={mataKuliahId}
        onChange={setMataKuliahId}
        dosenId={dosenId}
      />

      {/* Step 2: Select Kelas (enabled after mata kuliah selected) */}
      <KelasMultiSelector
        value={selectedKelasIds}
        onChange={setSelectedKelasIds}
        dosenId={dosenId}
        mataKuliahId={mataKuliahId}
        disabled={!mataKuliahId}
      />

      {/* Step 3: Tugas Details */}
      <Input name="judul" placeholder="Judul tugas" required />
      <Textarea name="deskripsi" placeholder="Deskripsi tugas" />
      {/* ... other fields */}

      <Button type="submit" disabled={!mataKuliahId || selectedKelasIds.length === 0}>
        Buat Tugas untuk {selectedKelasIds.length} Kelas
      </Button>
    </form>
  );
}
```

---

## 🔐 Security & Validation

### **Backend Validation**

```typescript
// lib/api/kuis.api.ts
export async function createKuis(data: CreateKuisData): Promise<Kuis> {
  // Validate mata_kuliah_id is provided
  if (!data.mata_kuliah_id) {
    throw new Error("Mata kuliah harus dipilih");
  }

  // Validate dosen teaches this mata kuliah OR kelas
  const hasAccess = await validateDosenAccess(
    data.dosen_id,
    data.mata_kuliah_id,
    data.kelas_id
  );

  if (!hasAccess) {
    throw new Error(
      "Anda tidak memiliki akses untuk mata kuliah atau kelas ini"
    );
  }

  return await insert("kuis", data);
}

async function validateDosenAccess(
  dosenId: string,
  mataKuliahId: string,
  kelasId: string
): Promise<boolean> {
  // Check if dosen teaches this mata_kuliah
  const { data: kelas } = await supabase
    .from("kelas")
    .select("id")
    .eq("dosen_id", dosenId)
    .eq("mata_kuliah_id", mataKuliahId)
    .eq("is_active", true)
    .single();

  return !!kelas;
}
```

---

## 🎯 Multi-Dosen Grading Scenario

### **Example: 2 Dosen Teaching Same Mata Kuliah**

```
Mata Kuliah: "Praktikum Kimia Organik" (ID: mk-123)

Dosen A:
├─ Mengajar Kelas A (ID: kelas-a)
└─ Buat tugas: "Laporan 1"
   └─ mata_kuliah_id: mk-123 ✅
   └─ kelas_id: kelas-a

Dosen B:
├─ Mengajar Kelas B (ID: kelas-b)
└─ Buat tugas: "Laporan 1" (same topic)
   └─ mata_kuliah_id: mk-123 ✅
   └─ kelas_id: kelas-b

RESULT:
✅ Dosen A can grade Kelas B's laporan (same mata_kuliah_id)
✅ Dosen B can grade Kelas A's laporan (same mata_kuliah_id)
✅ Standardized grading across kelas
```

---

## 📊 Query Examples

### **Get All Tugas for Mata Kuliah (Cross-Kelas)**

```sql
-- Dosen dashboard: Show all tugas I can grade
SELECT DISTINCT
    k.id,
    k.judul,
    k.mata_kuliah_id,
    mk.nama_mk,
    kl.nama_kelas,
    COUNT(ak.id) AS total_submissions,
    COUNT(CASE WHEN ak.status = 'submitted' THEN 1 END) AS pending_grading
FROM kuis k
INNER JOIN mata_kuliah mk ON k.mata_kuliah_id = mk.id
INNER JOIN kelas kl ON k.kelas_id = kl.id
LEFT JOIN attempt_kuis ak ON k.id = ak.kuis_id
WHERE k.mata_kuliah_id IN (
    -- Mata kuliah that current dosen teaches
    SELECT DISTINCT mata_kuliah_id
    FROM kelas
    WHERE dosen_id = get_current_dosen_id()
    AND is_active = TRUE
)
GROUP BY k.id, k.judul, k.mata_kuliah_id, mk.nama_mk, kl.nama_kelas
ORDER BY k.tanggal_selesai DESC;
```

---

## ✅ Summary

### **Workflow:**

1. ✅ Dosen **explicitly selects** mata kuliah
2. ✅ Dosen **selects multiple kelas** (creates 1 kuis per kelas)
3. ✅ `mata_kuliah_id` is **set by dosen**, not auto-populated
4. ✅ All dosen teaching same MK can **grade each other's tugas**
5. ✅ Trigger exists as **fallback** for legacy data

### **Benefits:**

- 🎯 **Flexible**: Dosen controls which MK and kelas get the tugas
- 🤝 **Collaborative**: Multi-dosen grading enabled automatically
- 📊 **Transparent**: Clear relationship between tugas → MK → dosen
- 🔒 **Secure**: RLS policies enforce proper access

---

**Last Updated:** 2026-01-14  
**Status:** ✅ Ready for Implementation
