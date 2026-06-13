# CODE SNIPPETS UNTUK SLIDE TEKNIS

## File ini berisi kutipan kode yang akan ditampilkan di slide presentasi

---

## SLIDE 8 & 15: PWA - SERVICE WORKER & OFFLINE

### 1. Service Worker Registration

**File:** [src/main.tsx](src/main.tsx) (line 17-33)

```typescript
// Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("SW registered:", registration);

      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New content available
            console.log("New content available, refresh to update.");
          }
        });
      });
    } catch (error) {
      console.error("SW registration failed:", error);
    }
  });
}
```

**Talking Point:** Service Worker berhasil didaftarkan, sehingga aplikasi mulai mendukung akses offline.

---

### 2. Cache Strategy - Network First

**File:** [src/sw.ts](src/sw.ts) (line 336-380)

```typescript
// Network First Strategy with 5-second timeout
async function networkFirstStrategy(
  request: Request,
  cacheName: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(request, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Fallback to cache
    const cached = await caches.match(request);
    if (cached) {
      console.log(`[SW] Serving from cache: ${request.url}`);
      return cached;
    }

    // Return offline fallback for navigation requests
    if (request.mode === "navigate") {
      const offlineCache = await caches.match("/offline.html");
      if (offlineCache) return offlineCache;
    }

    throw error;
  }
}
```

**Talking Point:**
- Strategi network first mencoba mengambil data dari jaringan terlebih dahulu.
- Jika jaringan tidak stabil, sistem kembali memakai cache agar data tetap dapat diakses.

---

### 3. Cache Strategy - Cache First

**File:** [src/sw.ts](src/sw.ts) (line 260-300)

```typescript
// Cache First Strategy - for static assets
async function cacheFirstStrategy(
  request: Request,
  cacheName: string
): Promise<Response> {
  // Check cache first
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log(`[SW] Cache hit: ${request.url}`);
    return cachedResponse;
  }

  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error(`[SW] Fetch failed: ${request.url}`, error);
    throw error;
  }
}
```

**Talking Point:**
- Strategi cache first digunakan untuk aset statis seperti CSS, JavaScript, dan gambar.
- Setelah aset tersimpan di cache, aplikasi dapat membukanya tanpa selalu meminta ulang ke jaringan.

---

### 4. Background Sync Handler

**File:** [src/sw.ts](src/sw.ts)

```typescript
// Background Sync Handler
self.addEventListener("sync", (event: SyncEvent) => {
  console.log("[SW] Sync event:", event.tag);

  if (event.tag === "sync-quiz-answers") {
    event.waitUntil(syncQuizAnswers());
  }

  if (event.tag === "sync-logbook") {
    event.waitUntil(syncLogbookEntries());
  }

  if (event.tag === "sync-kehadiran") {
    event.waitUntil(syncKehadiran());
  }
});

async function syncQuizAnswers() {
  console.log("[SW] Syncing quiz answers...");

  const db = await openDB();
  const pendingAnswers = await db.getAll("offline_answers");

  for (const answer of pendingAnswers) {
    try {
      const response = await fetch("/api/quiz/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });

      if (response.ok) {
        await db.delete("offline_answers", answer.id);
        console.log(`[SW] Synced answer: ${answer.id}`);
      }
    } catch (error) {
      console.error(`[SW] Failed to sync answer: ${answer.id}`, error);
    }
  }

  console.log("[SW] Quiz sync complete");
}
```

**Talking Point:**
- Background sync berjalan saat koneksi kembali tersedia.
- Jawaban atau data tertunda dapat dikirim ulang dari antrean lokal saat aplikasi kembali online.

---

### 5. IndexedDB Store Structure

**File:** [src/lib/offline/indexeddb.ts](src/lib/offline/indexeddb.ts)

```typescript
// IndexedDB Schema - 14 Object Stores
export const DB_NAME = "praktikum-pwa";
export const DB_VERSION = 1;

const stores = [
  "kuis",           // Quiz data cache
  "kuis_soal",      // Quiz questions
  "kuis_jawaban",   // Student answers
  "nilai",          // Grades cache
  "materi",         // Learning materials
  "kelas",          // Class data
  "jadwal",         // Schedule cache
  "mahasiswa",      // Student data
  "dosen",          // Lecturer data
  "laboran",        // Laboran data
  "users",          // User data
  "sync_queue",     // Pending sync items
  "metadata",       // App metadata
  "offline_quiz",   // Offline quiz attempts
  "offline_questions", // Cached questions
  "offline_answers",   // Pending answers
  "offline_attempts",  // Quiz attempt tracking
];

export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores with indexes
      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "id" });
          store.createIndex("updated_at", "updated_at", { unique: false });
        }
      });

      console.log("[IndexedDB] Database upgraded, stores created:", stores);
    };
  });
}
```

**Talking Point:**
- Object store IndexedDB mendukung penyimpanan data penting untuk fitur offline.
- Setiap store dapat diberi indeks agar proses pencarian data lebih cepat.

---

### 6. PWA Manifest

**File:** [public/manifest.json](public/manifest.json)

```json
{
  "name": "Sistem Praktikum Akademi Kebidanan Mega Buana",
  "short_name": "Praktikum PWA",
  "description": "Sistem Informasi Praktikum Berbasis PWA dengan Fitur Offline",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-48x48.png",
      "sizes": "48x48",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-256x256.png",
      "sizes": "256x256",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard Mahasiswa",
      "short_name": "Mahasiswa",
      "url": "/mahasiswa/dashboard",
      "description": "Akses dashboard mahasiswa"
    },
    {
      "name": "Dashboard Dosen",
      "short_name": "Dosen",
      "url": "/dosen/dashboard",
      "description": "Akses dashboard dosen"
    },
    {
      "name": "Login",
      "short_name": "Login",
      "url": "/login",
      "description": "Masuk ke sistem"
    }
  ]
}
```

**Talking Point:**
- Manifest membuat aplikasi dapat dipasang seperti aplikasi mandiri.
- Shortcuts membantu pengguna membuka fitur penting dengan cepat.

---

## SLIDE 9: RBAC - ROLE-BASED ACCESS CONTROL

### 1. User Role Type Definition

**File:** [src/types/auth.types.ts](src/types/auth.types.ts)

```typescript
// User Role Types
export type UserRole = "admin" | "dosen" | "mahasiswa" | "laboran";
export type RegisterableRole = "mahasiswa" | "dosen" | "laboran";

// Role Permissions
export const ROLE_PERMISSIONS = {
  admin: {
    users: { read: true, write: true, delete: true },
    jadwal: { read: true, write: true },
    kuis: { read: true, write: true, delete: true },
    logbook: { read: true, write: true },
    peminjaman: { read: true, write: true },
    inventaris: { read: true, write: true },
    pengumuman: { read: true, write: true },
  },
  dosen: {
    users: { read: false, write: false, delete: false },
    jadwal: { read: true, write: true },
    kuis: { read: true, write: true, delete: true },
    logbook: { read: true, write: true }, // review only
    peminjaman: { read: true, write: false },
    inventaris: { read: true, write: false },
    pengumuman: { read: true, write: true },
  },
  mahasiswa: {
    users: { read: false, write: false, delete: false },
    jadwal: { read: true, write: false },
    kuis: { read: true, write: true }, // attempt only
    logbook: { read: true, write: true }, // entry only
    peminjaman: { read: true, write: true },
    inventaris: { read: false, write: false },
    pengumuman: { read: true, write: false },
  },
  laboran: {
    users: { read: false, write: false, delete: false },
    jadwal: { read: true, write: true },
    kuis: { read: false, write: false },
    logbook: { read: false, write: false },
    peminjaman: { read: true, write: true },
    inventaris: { read: true, write: true },
    pengumuman: { read: true, write: true },
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.admin;
```

**Talking Point:**
- Sistem memiliki empat peran utama dengan matriks hak akses yang jelas.
- TypeScript membantu menjaga konsistensi tipe data role dan permission.

---

### 2. Route Protection with RBAC

**File:** [src/routes/index.tsx](src/routes/index.tsx)

```typescript
// Route configuration with role-based access
const routes: RouteConfig[] = [
  // Public routes
  { path: "/login", component: LoginPage, roles: ["public"] },
  { path: "/register", component: RegisterPage, roles: ["public"] },

  // Admin routes
  { path: "/admin/dashboard", component: AdminDashboard, roles: ["admin"] },
  { path: "/admin/users", component: UserManagement, roles: ["admin"] },
  { path: "/admin/laboratories", component: Laboratories, roles: ["admin"] },

  // Dosen routes
  { path: "/dosen/dashboard", component: DosenDashboard, roles: ["dosen"] },
  { path: "/dosen/jadwal", component: JadwalPage, roles: ["dosen"] },
  { path: "/dosen/kuis", component: KuisListPage, roles: ["dosen"] },

  // Mahasiswa routes
  { path: "/mahasiswa/dashboard", component: MahasiswaDashboard, roles: ["mahasiswa"] },
  { path: "/mahasiswa/jadwal", component: JadwalPage, roles: ["mahasiswa"] },
  { path: "/mahasiswa/kuis", component: KuisListPage, roles: ["mahasiswa"] },
  { path: "/mahasiswa/logbook", component: LogbookPage, roles: ["mahasiswa"] },

  // Laboran routes
  { path: "/laboran/dashboard", component: LaboranDashboard, roles: ["laboran"] },
  { path: "/laboran/inventaris", component: InventarisPage, roles: ["laboran"] },
  { path: "/laboran/persetujuan", component: PersetujuanPage, roles: ["laboran"] },
];

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's dashboard based on role
    const roleDashboard = {
      admin: "/admin/dashboard",
      dosen: "/dosen/dashboard",
      mahasiswa: "/mahasiswa/dashboard",
      laboran: "/laboran/dashboard",
    };

    return <Navigate to={roleDashboard[user.role]} replace />;
  }

  return children;
}
```

**Talking Point:**
- Route dilindungi berdasarkan peran pengguna.
- Pengguna yang tidak berwenang diarahkan kembali ke dashboard sesuai rolenya.

---

### 3. Role Guard Component

**File:** [src/components/common/RoleGuard.tsx](src/components/common/RoleGuard.tsx)

```typescript
interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) return fallback;

  if (!allowedRoles.includes(user.role)) {
    console.warn(`[RoleGuard] Access denied for role: ${user.role}`);
    return fallback;
  }

  return <>{children}</>;
}

// Usage example
function DosenOnlyFeature() {
  return (
    <RoleGuard allowedRoles={["dosen", "admin"]}>
      <Button variant="primary">Buat Kuis Baru</Button>
    </RoleGuard>
  );
}
```

**Talking Point:**
- Kontrol hak akses juga diterapkan pada level komponen.
- Satu fitur dapat dibuka untuk lebih dari satu peran, misalnya dosen dan admin.

---

## SLIDE 16-17: TESTING

### 1. Test File Count

**Command:** `find src/__tests__ -name "*.test.ts*" | wc -l`

**Result:**
- 241 test files total
- 5.231 test cases

**Source:** [src/__tests__/](src/__tests__/)

---

### 2. API Unit Test Example

**File:** [src/__tests__/unit/core-logic/api/auth.api.test.ts](src/__tests__/unit/core-logic/api/auth.api.test.ts)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, logout, register } from "@/lib/api/auth.api";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should return user data on successful login", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        role: "mahasiswa" as const,
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: { access_token: "token" } },
        error: null,
      });

      const result = await login("test@example.com", "password123");

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("should return error on invalid credentials", async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

      const result = await login("wrong@example.com", "wrongpass");

      expect(result.user).toBeNull();
      expect(result.error).toBe("Invalid login credentials");
    });
  });

  describe("logout", () => {
    it("should call signOut", async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await logout();

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Talking Point:**
- Fungsi API diuji dengan unit test pada skenario utama dan skenario error.
- Mock dependency eksternal digunakan agar pengujian lebih terisolasi.

---

### 3. Integration Test Example

**File:** [src/__tests__/integration/auth-flow.test.tsx](src/__tests__/integration/auth-flow.test.tsx)

```typescript
import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { LoginPage } from "@/pages/auth/LoginPage";
import userEvent from "@testing-library/user-event";

describe("Auth Flow Integration", () => {
  it("should login and redirect to dashboard", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginPage />);

    // Fill login form
    await user.type(screen.getByLabelText(/email/i), "test@akbid.ac.id");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // Submit
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    // Wait for redirect
    await waitFor(() => {
      expect(window.location.pathname).toBe("/mahasiswa/dashboard");
    });
  });

  it("should show error on failed login", async () => {
    renderWithProviders(<LoginPage />);

    // Try with wrong credentials
    await user.type(screen.getByLabelText(/email/i), "wrong@email.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByText(/kredensial tidak valid/i)).toBeInTheDocument();
    });
  });
});
```

**Talking Point:**
- Integration test memeriksa alur login pengguna dari form hingga perubahan status.
- Pengujian memastikan interaksi UI berjalan sampai kondisi akhir yang diharapkan.

---

### 4. Coverage Configuration

**File:** [vitest.config.ts](vitest.config.ts)

```typescript
export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "src/__tests__/**",
        "src/types/**",
        "*.config.*",
        "**/*.d.ts",
      ],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
```

**Coverage Results:**
- Lines: ~32-37%
- Branches: ~82%
- Functions: ~89%
- Statements: ~87%

**Talking Point:**
- Pengujian diarahkan pada logika penting, cabang keputusan, dan fungsi inti.
- Coverage membantu menunjukkan area kode yang sudah dilindungi test otomatis.

---

## SLIDE 18: SUS EVALUATION

### 1. SUS Score Calculation

**File:** [docs/BAB4/GAMBAR-40-DIAGRAM-DISTRIBUSI-RESPONDEN-SUS.md](docs/BAB4/GAMBAR-40-DIAGRAM-DISTRIBUSI-RESPONDEN-SUS.md)

```markdown
## System Usability Scale (SUS) Results

### Metodologi
- 10 pertanyaan SUS (5-point Likert scale: 1-5)
- 46 responden (Admin: 2, Dosen: 8, Mahasiswa: 30, Laboran: 6)
- Skor dihitung berdasarkan formula SUS standar

### Formula Perhitungan
```
SUS Score = (Σodd_questions - 5) + (5 - Σeven_questions) * 2.5
```

### Hasil
| Responden | R1 | R2 | R3 | ... | R46 |
|-----------|----|----|----|-----|-----|
| Skor     | 72 | 78 | 65 | ... | 80 |

### Statistik
- Mean Score: 75,11
- Std Dev: 8.5
- Min: 58
- Max: 92

### Interpretasi
| Skor | Grade | Kategori |
|------|-------|----------|
| < 50 | F | Poor |
| 50-64 | D-C | OK |
| 65-74 | C | OK |
| 75-79 | B | Good |
| 80-84 | B+ | Good |
| 85+ | A | Excellent |

### Kesimpulan
Skor SUS 75,11 = Grade B = Good = Acceptable
```

**Talking Point:**
- SUS adalah instrumen standar untuk mengevaluasi usability sistem.
- Skor 75,11 menunjukkan sistem berada pada kategori Good dan Acceptable.

---

## SLIDE 14: DASHBOARD IMPLEMENTATION

### 1. Dashboard Stats Cards

**File:** [src/pages/admin/DashboardPage.tsx](src/pages/admin/DashboardPage.tsx)

```typescript
interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: number;
  color: string;
}

export function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
              {trend > 0 ? "+" : ""}{trend}% dari bulan lalu
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Usage in Dashboard
function AdminDashboard() {
  const stats = [
    { title: "Total Users", value: 156, icon: Users, color: "bg-blue-500" },
    { title: "Mahasiswa", value: 98, icon: GraduationCap, color: "bg-green-500" },
    { title: "Dosen", value: 12, icon: BookOpen, color: "bg-purple-500" },
    { title: "Laboran", value: 4, icon: Wrench, color: "bg-orange-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
```

**Talking Point:**
- Layout kartu membuat ringkasan data mudah dipindai.
- Indikator tren membantu pengguna membaca perubahan data secara cepat.

---

## PANDUAN MENAMPILKAN CODE SNIPPET DI SLIDE

### Tips Presentasi:
1. **Jangan tampilkan semua kode** - Pilih bagian yang paling relevan
2. **Highlight bagian penting** - Gunakan warna untuk menonjolkan poin utama
3. **Jelaskan secara lisan** - Kode adalah pendukung, bukan fokus utama
4. **Gunakan font monospace** - Untuk readability

### Contoh Penyajian:
```typescript
// Tampilkan hanya ini:
async function networkFirstStrategy(request, cacheName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // ⭐ 5 detik timeout

  try {
    const response = await fetch(request, { signal: controller.signal });
    // Simpan ke cache
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    // Fallback ke cache
    return await caches.match(request);
  }
}
```

### Hal yang Perlu Dihafal:
- Cara membuka file dengan cepat (Ctrl+P di VS Code)
- Line number untuk setiap snippet
- Cara demo kode bekerja
