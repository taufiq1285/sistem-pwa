# 📚 Total Mata Kuliah Dashboard - Data Source & Flow

## 🎯 Pertanyaan

**"Total mata kuliah pada dashboard mahasiswa itu dari mana asalnya?"**

## ✅ Jawaban Lengkap

### Alur Data: Dashboard → API → Database

```
┌─────────────────────────────────────────────────────────┐
│         Dashboard Mahasiswa (Front-end)                 │
│   src/pages/mahasiswa/DashboardPage.tsx                 │
│                                                         │
│   Menampilkan: {stats?.totalMataKuliah || 0}          │
└──────────────────┬──────────────────────────────────────┘
                   │ Call API
                   ↓
┌─────────────────────────────────────────────────────────┐
│       getMahasiswaStats() API Function                  │
│  src/lib/api/mahasiswa.api.ts (line 152-226)           │
│                                                         │
│   Query Database untuk get stats                        │
└──────────────────┬──────────────────────────────────────┘
                   │ Query 1
                   ↓
┌─────────────────────────────────────────────────────────┐
│      Database Query (Supabase)                          │
│                                                         │
│  SELECT kelas_id FROM kelas_mahasiswa                  │
│  WHERE mahasiswa_id = {currentMahasiswaId}             │
│  AND is_active = true                                  │
│                                                         │
│  Result: array of kelas IDs                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────┐
│    const totalMataKuliah = kelasData?.length || 0      │
│                                                         │
│    = Jumlah KELAS yang diambil mahasiswa               │
│      (bukan jumlah MATA KULIAH unik!)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Detail Implementasi

### 1. **Front-end: Dashboard Mahasiswa**

**File**: `src/pages/mahasiswa/DashboardPage.tsx` (line 141-147)

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-gray-600">
      Total Mata Kuliah
    </CardTitle>
    <BookOpen className="h-4 w-4 text-gray-400" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {stats?.totalMataKuliah || 0} ← ✅ Ditampilkan dari sini
    </div>
    <p className="text-xs text-gray-500 mt-1">Mata kuliah aktif</p>
  </CardContent>
</Card>
```

**Data Mengalir**:

- Dashboard call: `getMahasiswaStats()`
- Set state: `setStats(statsData.value)`
- Display: `stats?.totalMataKuliah || 0`

---

### 2. **API: getMahasiswaStats Function**

**File**: `src/lib/api/mahasiswa.api.ts` (line 152-226)

**Type Definition** (line 18):

```typescript
export interface MahasiswaStats {
  totalMataKuliah: number;    ← ✅ Ini yang ditampilkan
  totalKuis: number;
  rataRataNilai: number | null;
  jadwalHariIni: number;
}
```

**Full Implementation**:

```typescript
export async function getMahasiswaStats(): Promise<MahasiswaStats> {
  return cacheAPI(
    "mahasiswa_stats",
    async () => {
      try {
        const mahasiswaId = await getMahasiswaId();
        if (!mahasiswaId) {
          return {
            totalMataKuliah: 0,
            totalKuis: 0,
            rataRataNilai: null,
            jadwalHariIni: 0,
          };
        }

        // ✅ DATABASE QUERY #1: Get all kelas for this mahasiswa
        const { data: kelasData } = await supabase
          .from("kelas_mahasiswa")
          .select("kelas_id")
          .eq("mahasiswa_id", mahasiswaId)
          .eq("is_active", true);

        // ✅ CALCULATION: Count kelas entries
        const totalMataKuliah = kelasData?.length || 0;
        //                      ↑
        //                      Jumlah KELAS (bisa dari mata kuliah berbeda!)

        // [Additional queries for other stats...]

        return {
          totalMataKuliah, // ← Return nilai ke frontend
          totalKuis,
          rataRataNilai,
          jadwalHariIni,
        };
      } catch (error: unknown) {
        console.error("Error fetching mahasiswa stats:", error);
        return {
          totalMataKuliah: 0, // Default value on error
          totalKuis: 0,
          rataRataNilai: null,
          jadwalHariIni: 0,
        };
      }
    },
    {
      ttl: 5 * 60 * 1000, // ⏱️ Cache for 5 minutes
      staleWhileRevalidate: true, // 🔄 Serve stale data while refreshing
    }
  );
}
```

---

### 3. **Database: kelas_mahasiswa Table**

**Query yang dijalankan**:

```sql
SELECT kelas_id
FROM kelas_mahasiswa
WHERE mahasiswa_id = :mahasiswa_id
AND is_active = true;
```

**Expected Result** (example):

```
mahasiswa_id | kelas_id | is_active
─────────────┼──────────┼──────────
123          | kelas-1  | true
123          | kelas-2  | true
123          | kelas-3  | true

Result: 3 rows → totalMataKuliah = 3
```

---

## ⚠️ **IMPORTANT: Perbedaan antara Kelas vs Mata Kuliah**

### Scenario 1: Normal (1 Mata Kuliah per Kelas)

```
Mahasiswa A mengambil:
- Kelas C (Algoritma)       → 1 kelas
- Kelas D (Database)        → 1 kelas
- Kelas E (Web Dev)         → 1 kelas

totalMataKuliah = 3 ✅ (3 kelas = 3 mata kuliah berbeda)
```

### Scenario 2: Kemungkinan Error (1 Mata Kuliah, Multiple Kelas)

```
Mahasiswa A mengambil PARALEL:
- Kelas C (Algoritma - Grup A)  → 1 kelas
- Kelas D (Algoritma - Grup B)  → 1 kelas (SAMA MATA KULIAH!)
- Kelas E (Web Dev)             → 1 kelas

totalMataKuliah = 3 ❌ (tapi sebenarnya hanya 2 mata kuliah)
```

---

## 🔍 Database Schema

### Table: `kelas_mahasiswa`

```sql
CREATE TABLE kelas_mahasiswa (
  id UUID PRIMARY KEY,
  mahasiswa_id UUID NOT NULL (FK: mahasiswa.id),
  kelas_id UUID NOT NULL (FK: kelas.id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Table: `kelas` (for reference)

```sql
CREATE TABLE kelas (
  id UUID PRIMARY KEY,
  mata_kuliah_id UUID NOT NULL (FK: mata_kuliah.id),
  dosen_id UUID NOT NULL (FK: dosen.id),
  kode_kelas VARCHAR,
  nama_kelas VARCHAR,
  is_active BOOLEAN DEFAULT true
);
```

### Table: `mata_kuliah` (for reference)

```sql
CREATE TABLE mata_kuliah (
  id UUID PRIMARY KEY,
  kode_mk VARCHAR UNIQUE,
  nama_mk VARCHAR,
  sks INTEGER,
  semester INTEGER,
  program_studi VARCHAR
);
```

---

## 💾 Caching Strategy

**Lokasi**: `cacheAPI()` wrapper function

```typescript
cacheAPI(
  "mahasiswa_stats", // Cache key
  async () => {
    /* query */
  }, // Fetch function
  {
    ttl: 5 * 60 * 1000, // Cache 5 minutes
    staleWhileRevalidate: true, // Serve old data while refreshing
  }
);
```

**Benefit**:

- ✅ Faster subsequent loads (serve from cache)
- ✅ Reduces database queries
- ✅ Graceful degradation (serve stale data if fetch fails)

---

## 🔄 Complete Data Flow (Step-by-Step)

```
1. User opens Dashboard
   ↓
2. Component mounts → useEffect triggered
   ↓
3. Call: getMahasiswaStats()
   ↓
4. Check cache: "mahasiswa_stats"
   ├─ If FOUND (fresh < 5 min):
   │  └─ Return cached data immediately ⚡
   ├─ If STALE (> 5 min):
   │  ├─ Return stale data immediately ⚡
   │  ├─ Fetch fresh data in background 🔄
   │  └─ Update cache when done
   └─ If NOT FOUND:
      └─ Fetch fresh data 📡
5. Database Query:
   SELECT kelas_id FROM kelas_mahasiswa
   WHERE mahasiswa_id = ? AND is_active = true
   ↓
6. Response: Array of kelas_id
   ↓
7. Calculate: totalMataKuliah = kelasData.length
   ↓
8. Return to frontend
   ↓
9. Set state: setStats({...})
   ↓
10. Render: {stats?.totalMataKuliah || 0}
```

---

## 📊 Summary: Data Source Tracking

| Level     | Source      | File                       | Details                     |
| --------- | ----------- | -------------------------- | --------------------------- |
| **UI**    | React State | `DashboardPage.tsx:147`    | `stats?.totalMataKuliah`    |
| **API**   | Function    | `mahasiswa.api.ts:152`     | `getMahasiswaStats()`       |
| **Query** | Supabase    | `mahasiswa.api.ts:168-170` | `kelas_mahasiswa` table     |
| **DB**    | Table       | `kelas_mahasiswa`          | Count of active enrollments |
| **Cache** | Memory      | `cacheAPI()`               | 5-minute TTL                |

---

## ✅ Kesimpulan

**Total Mata Kuliah di Dashboard Mahasiswa adalah:**

1. **Dihitung dari**: Jumlah **kelas yang aktif** yang diambil mahasiswa saat ini
2. **Source**: Tabel `kelas_mahasiswa` (where `is_active = true`)
3. **Method**: `getMahasiswaStats()` API function
4. **Caching**: Cached 5 menit untuk performa optimal
5. **Logic**: `totalMataKuliah = kelasData?.length || 0`

**⚠️ Note**: Ini menghitung **jumlah kelas**, bukan **jumlah mata kuliah unik**. Jika mahasiswa mengambil 2 kelas dari mata kuliah yang sama (paralel), totalnya akan 2, bukan 1.
