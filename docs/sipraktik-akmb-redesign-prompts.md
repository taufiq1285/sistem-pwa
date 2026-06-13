# Master Prompt — Redesign UI/UX SiPraktik AKMB

> Kumpulan 15 prompt siap pakai untuk redesign sistem informasi praktikum AKMB.  
> Setiap prompt bersifat self-contained dan dapat dijalankan secara mandiri.  
> Sertakan blok **Konteks Proyek** di awal setiap sesi.

---

## Daftar Isi

| No | Nama Prompt | Estimasi |
|----|-------------|----------|
| — | Konteks Proyek | Referensi wajib |
| 01 | Design Token System | 3 jam |
| 02 | Dark Mode | 2 jam |
| 03 | Sidebar Collapsible + Breadcrumb | 3 jam |
| 04 | Bottom Tab Bar Mobile | 2 jam |
| 05 | Page Transitions + Micro-interactions | 3 jam |
| 06 | Skeleton Loader | 2 jam |
| 07 | Empty States Kontekstual | 2 jam |
| 08 | Aksesibilitas WCAG 2.2 AA | 3 jam |
| 09 | Command Palette | 2 jam |
| 10 | Dashboard Charts & Data Visualization | 4 jam |
| 11 | Typography & Font System | 1 jam |
| 12 | Halaman Login & Register | 3 jam |
| 13 | Dashboard Polish per Role | 4 jam |
| 14 | Standardisasi Form & Validasi | 4 jam |
| 15 | Notifikasi & Real-time Updates | 3 jam |

**Total estimasi: 41–60 jam implementasi**

### Urutan implementasi yang disarankan

```
01 → 11 → 06 → 03 → 04 → 05 → 02 → 07 → 08 → 12 → 13 → 10 → 09 → 14 → 15
```

---

## Konteks Proyek

> Salin blok ini dan tempelkan di awal setiap prompt.

```
Proyek   : SiPraktik AKMB — Sistem Informasi Praktikum Akademi Kebidanan Mega Buana
Stack    : React 18 + TypeScript (strict mode) + Vite + Tailwind CSS v4 + shadcn/ui + Supabase
State    : TanStack Query v5 (server state) + Zustand (client state)
PWA      : Offline-first, IndexedDB, Service Worker via Workbox
Role     : Admin (#6d28d9 ungu) · Dosen (#1d4ed8 biru) · Mahasiswa (#0d9488 teal) · Laboran (#c2410c oranye)
Struktur : src/components/ · src/pages/ · src/lib/ · src/context/ · src/hooks/ · src/types/
UI Lib   : shadcn/ui — button, card, dialog, badge, skeleton, tooltip, command, avatar,
           progress, tabs, select, input, form, table, dropdown-menu, popover, scroll-area
Icons    : Tabler Icons (@tabler/icons-react) — selalu pakai named import
           contoh: import { IconBell } from '@tabler/icons-react'
Chart    : Recharts (sudah terinstall)
Toast    : Sonner — import { toast } from 'sonner'
Form     : react-hook-form + zod
Router   : react-router-dom v6

TAILWIND V4 — ATURAN WAJIB:
- Tidak ada tailwind.config.ts — semua konfigurasi via @theme {} di CSS
- Import utama: @import "tailwindcss" (bukan @tailwind base/components/utilities)
- Token design: gunakan --color-nama di dalam @theme {} agar otomatis jadi utility class
- Dark mode: gunakan [data-theme="dark"] selector, bukan class dark
- Plugin: @plugin "@tailwindcss/typography" di CSS
- Nilai dinamis (role, dark mode): taruh di :root biasa di tokens.css, bukan @theme

ATURAN UMUM (berlaku untuk semua prompt):
- TypeScript strict — tidak ada penggunaan 'any'
- Semua async function pakai try/catch dengan error typing yang proper
- Import path alias: '@/' untuk src/
- Jangan hapus kode yang sudah ada kecuali diminta — tambahkan atau modifikasi saja
- Gunakan cn() dari '@/lib/utils' untuk className conditional
- Setiap file baru wajib ada JSDoc singkat di atas
```

---

## Prompt 01 — Design Token System

> Membuat fondasi token desain terpusat: warna per role, semantic token, dark mode, dan type scale. Wajib dikerjakan pertama sebelum semua prompt lainnya.

### Konteks Tambahan

File yang dibuat baru — belum ada sebelumnya.

### Requirement

#### 1. Struktur File CSS Utama

Update `src/index.css` dengan struktur berikut:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* Font */
  --font-sans: "Plus Jakarta Sans Variable", system-ui, sans-serif;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  /* Warna semantic — otomatis jadi utility class Tailwind */
  --color-bg-primary:    #ffffff;
  --color-bg-secondary:  #f8fafc;
  --color-bg-tertiary:   #f1f5f9;

  --color-text-primary:   #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted:     #94a3b8;

  --color-border:        #e2e8f0;
  --color-border-strong: #cbd5e1;

  --color-success-bg:     #f0fdf4;
  --color-success-border: #bbf7d0;
  --color-success-text:   #166534;
  --color-warning-bg:     #fffbeb;
  --color-warning-border: #fde68a;
  --color-warning-text:   #92400e;
  --color-danger-bg:      #fef2f2;
  --color-danger-border:  #fecaca;
  --color-danger-text:    #991b1b;
  --color-info-bg:        #eff6ff;
  --color-info-border:    #bfdbfe;
  --color-info-text:      #1e40af;
}
```

#### 2. Token Role (src/styles/tokens.css)

Buat file baru `src/styles/tokens.css` khusus untuk token dinamis (role & dark mode). Token ini menggunakan CSS custom property biasa — **bukan** di dalam `@theme {}`.

Sediakan token lengkap untuk 4 role berikut menggunakan selector `[data-role="..."]`:

| Token | Keterangan |
|-------|------------|
| `--role-50` hingga `--role-900` | Full shade palette |
| `--role-sidebar-from` / `--role-sidebar-to` | Gradient sidebar |
| `--role-accent` | Warna CTA utama |
| `--role-surface` | Background card ringan |
| `--role-border` | Border berwarna |
| `--role-text` | Teks berwarna |
| `--role-chip-bg` / `--role-chip-text` | Badge role di topbar |
| `--role-focus-ring` | Outline focus |

Nilai warna dasar per role:

```
Admin     : base #6d28d9 (ungu)
Dosen     : base #1d4ed8 (biru)
Mahasiswa : base #0d9488 (teal)
Laboran   : base #c2410c (oranye)
```

#### 3. Dark Mode Override

Tambahkan di `tokens.css`:

```css
[data-theme="dark"] {
  --color-bg-primary:    #0f172a;
  --color-bg-secondary:  #1e293b;
  --color-bg-tertiary:   #0f172a;
  --color-text-primary:   #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted:     #64748b;
  --color-border:        #1e293b;
  --color-border-strong: #334155;
}
```

Untuk shadcn/ui, tambahkan juga override variabel hsl-nya di dalam `[data-theme="dark"]`.

#### 4. Type Scale & Shadow

Tambahkan di `:root` dalam `tokens.css`:

```css
:root {
  --text-display: 24px;
  --text-title:   18px;
  --text-heading: 15px;
  --text-body:    14px;
  --text-small:   12px;
  --text-caption: 11px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04);
}
```

#### 5. Hook useRoleTheme

Buat `src/lib/hooks/useRoleTheme.ts`:

```ts
// Inject data-role ke <html> saat user login, cleanup saat logout
export function useRoleTheme(): void
```

- Baca role dari auth store/context
- Set `document.documentElement.setAttribute('data-role', role)`
- Cleanup di return effect

#### 6. Update Entry Point

Update `src/main.tsx` — urutan import:

```ts
import '@fontsource-variable/plus-jakarta-sans'
import './styles/tokens.css'   // sebelum index.css
import './index.css'
```

Hapus `tailwind.config.ts` jika masih ada.

### Output

- `src/index.css` (dengan `@import "tailwindcss"` + `@theme {}`)
- `src/styles/tokens.css` (role tokens + dark mode + type scale + shadow)
- `src/lib/hooks/useRoleTheme.ts`
- `src/main.tsx` (urutan import diperbarui)

---

## Prompt 02 — Dark Mode

> Menghubungkan ThemeContext yang sudah ada ke CSS, membuat ThemeToggle component, dan memastikan semua komponen shadcn/ui terlihat baik di mode gelap.

### Konteks Tambahan

File yang sudah ada:

- `src/context/ThemeContext.tsx` — ada tapi belum lengkap
- `src/lib/hooks/useTheme.ts` — sudah ada
- `src/providers/ThemeProvider.tsx` — sudah ada
- Dark mode **belum** terhubung ke CSS sama sekali
- Design token sudah dibuat (Prompt 01)

### Requirement

#### 1. Update ThemeContext

```ts
type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'   // hasil resolve setelah 'system' dikalkulasi
  setTheme: (t: Theme) => void
}
```

- Detect system preference via `window.matchMedia('(prefers-color-scheme: dark)')`
- Persist ke `localStorage` key `'sipraktik-theme'`
- Listen perubahan system preference secara real-time

#### 2. Update ThemeProvider

- Inject `data-theme="dark|light"` ke `document.documentElement`
- Gunakan `resolvedTheme` (bukan raw `theme`) untuk inject
- Gunakan `useLayoutEffect` untuk mencegah flash saat pertama load

#### 3. Buat ThemeToggle Component

Buat `src/components/common/ThemeToggle.tsx`:

- 3 opsi: Light (`IconSun`) / Dark (`IconMoon`) / System (`IconDeviceLaptop`)
- Implementasi: icon button + shadcn `DropdownMenu`
- Icon aktif sesuai `resolvedTheme`, animasi `opacity` transition 200ms
- Item aktif di dropdown ditandai dengan checkmark
- `aria-label="Ganti tema"` pada trigger button

#### 4. Update Header

Tambahkan `ThemeToggle` di `src/components/layout/Header.tsx` — posisi antara search button dan notification bell.

#### 5. CSS Dark Mode Shadcn

Tambahkan di `tokens.css` di dalam `[data-theme="dark"]`:

```css
[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  /* ... lanjutkan semua variabel shadcn */
}
```

### Output

- `src/context/ThemeContext.tsx`
- `src/providers/ThemeProvider.tsx`
- `src/components/common/ThemeToggle.tsx`
- `src/components/layout/Header.tsx`
- `src/styles/tokens.css` (dark mode additions)

---

## Prompt 03 — Sidebar Collapsible + Breadcrumb

> Mengubah sidebar statis menjadi collapsible dengan animasi smooth, menambahkan drawer mode untuk mobile, dan implementasi breadcrumb otomatis berbasis route.

### Konteks Tambahan

File yang sudah ada:

- `src/components/layout/Sidebar.tsx` — sidebar statis lebar 220px
- `src/components/layout/AppLayout.tsx` — layout wrapper
- `src/components/layout/Navigation.tsx`
- `src/config/navigation.config.ts` — konfigurasi nav per role

### Requirement

#### 1. Sidebar Collapsible

Update `src/components/layout/Sidebar.tsx`:

- State: `const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')`
- Persist setiap perubahan ke `localStorage`
- Lebar: `220px` expanded → `64px` collapsed
- Transisi CSS: `transition-[width] duration-200 ease-in-out`

Perilaku collapsed mode:
- Label nav item: hilang (opacity 0, pointer-events none)
- Section label: tersembunyi
- Hanya icon yang tampil, posisi centered
- Avatar user: hanya tampil avatar, nama dan role text hilang
- Badge counter: tampil sebagai dot kecil di sudut icon

Tambahan komponen:
- Tooltip shadcn pada setiap nav item saat `isCollapsed = true`, isi tooltip = label nav item
- Tombol toggle: `IconChevronLeft` / `IconChevronRight` di sudut bawah sidebar, posisi `absolute bottom-4 right-[-12px]`, styled sebagai circle button dengan border

#### 2. Update AppLayout

Update `src/components/layout/AppLayout.tsx`:

- Buat `SidebarContext` untuk share state `isCollapsed` ke seluruh layout
- `main` margin kiri: `isCollapsed ? '64px' : '220px'`
- Tambah `transition-[margin-left] duration-200 ease-in-out`

#### 3. Mobile Behavior

Di viewport `< 768px`:

- Sidebar berubah jadi **drawer overlay** (fixed, bukan layout shift)
- State terpisah: `isDrawerOpen` (tidak di-persist)
- Backdrop: `fixed inset-0 bg-black/40` saat drawer terbuka
- Auto-close: saat klik backdrop ATAU saat navigasi (listen `pathname` via `useEffect`)
- Hamburger button: di Header, hanya tampil di mobile (`md:hidden`)

#### 4. Breadcrumb

Buat `src/components/common/Breadcrumb.tsx`:

```ts
interface BreadcrumbItem {
  label: string
  href?: string
}
```

- Gunakan `useMatches()` dari react-router-dom v6
- Baca `handle: { breadcrumb: string }` dari setiap route match
- Filter hanya match yang punya `handle.breadcrumb`
- Max 4 level; jika lebih tampilkan: `item[0]` + `...` + `item[n-2]` + `item[n-1]`
- Separator: `<IconChevronRight size={14} />`
- Item terakhir: `font-medium`, tidak dapat diklik, warna `text-primary`
- Item lain: link dengan `hover:underline`, warna `text-muted`

Update `src/router/index.tsx`:
- Tambah `handle: { breadcrumb: 'Nama Halaman' }` ke setiap route leaf

Integrasikan di `AppLayout.tsx`:
- Breadcrumb muncul di bawah Header, di atas konten halaman
- Hanya tampil jika ada lebih dari 1 item

### Output

- `src/components/layout/Sidebar.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/context/SidebarContext.tsx` (baru)
- `src/components/common/Breadcrumb.tsx` (baru)
- `src/router/index.tsx`

---

## Prompt 04 — Bottom Tab Bar Mobile

> Membuat navigasi bawah layar untuk PWA mobile dengan 5 tab per role, badge notifikasi, dan bottom sheet untuk menu tambahan.

### Konteks Tambahan

File yang sudah ada:

- `src/components/layout/MobileNav.tsx` — bukan bottom tab bar, perlu diganti
- `src/lib/hooks/useRole.ts` — sudah ada

### Requirement

#### 1. Spesifikasi Komponen

Buat `src/components/layout/BottomTabBar.tsx`:

- Tampil **hanya** di viewport `≤ 768px` (class `md:hidden`)
- Posisi: `fixed bottom-0 left-0 right-0 z-50`
- Background: `rgba(255,255,255,0.85)` + `backdrop-blur-md`
- Dark mode: `rgba(15,23,42,0.85)` + `backdrop-blur-md`
- Height: `64px + env(safe-area-inset-bottom)` (iPhone notch safe)
- Border top: `0.5px solid var(--color-border)`

TypeScript interface:

```ts
interface TabItem {
  id: string
  label: string
  icon: React.ElementType
  href?: string
  action?: 'more-sheet'
}
```

#### 2. Konfigurasi Tab per Role

| Role | Tab 1 | Tab 2 | Tab 3 | Tab 4 | Tab 5 |
|------|-------|-------|-------|-------|-------|
| Admin | Dashboard | Pengguna | Lab | Peminjaman | Lebih |
| Dosen | Dashboard | Jadwal | Kuis | Nilai | Profil |
| Mahasiswa | Dashboard | Jadwal | Kuis | Materi | Nilai |
| Laboran | Dashboard | Inventaris | Persetujuan | Jadwal | Laporan |

#### 3. Interaksi & State

- Active state: icon + label warna `var(--role-accent)`, background pill `var(--role-surface)`
- Transisi active: 150ms ease
- Badge notifikasi: dot merah 6px di sudut kanan atas icon, data dari `useUnreadNotifications()`
- Dot badge: animasi pulse CSS

#### 4. Tab "Lebih" / "Profil"

- Buka shadcn `Sheet` dengan `side="bottom"`
- Isi: link menu tambahan yang tidak muat di tab bar
- DragBar di atas sheet untuk UX yang natural

#### 5. Update AppLayout

Di `src/components/layout/AppLayout.tsx`:

- Render `BottomTabBar` di bawah `<main>`, **bukan** di dalam `main`
- Tambah `pb-[80px] md:pb-0` ke `main` saat `BottomTabBar` aktif
- Sembunyikan `BottomTabBar` di path: `/auth/*` dan `/kuis/:id/attempt`

### Output

- `src/components/layout/BottomTabBar.tsx` (baru)
- `src/components/layout/AppLayout.tsx` (diperbarui)

---

## Prompt 05 — Page Transitions + Micro-interactions

> Menambahkan animasi perpindahan halaman dengan framer-motion dan micro-interactions CSS untuk meningkatkan feel aplikasi.

### Konteks Tambahan

Belum ada animasi apapun. Install yang diperlukan:

```bash
npm install framer-motion
```

### Requirement

#### 1. Page Transition Component

Buat `src/components/common/PageTransition.tsx`:

```ts
interface PageTransitionProps {
  children: React.ReactNode
}
```

- Gunakan `motion.div` dari framer-motion
- Variants: `initial: { opacity: 0, y: 8 }` → `animate: { opacity: 1, y: 0 }` → `exit: { opacity: 0, y: -4 }`
- Transition: `{ duration: 0.18, ease: 'easeOut' }`

Update `src/App.tsx`:

- Wrap `<Routes>` dengan `<AnimatePresence mode="wait">`
- Key berdasarkan `useLocation().pathname`
- Wrap di level layout route — bukan per halaman manual

#### 2. Keyframe Animations

Tambahkan di `src/index.css` — di dalam `@theme {}`:

```css
@theme {
  --animate-shimmer:     shimmer 1.5s ease-in-out infinite;
  --animate-badge-pop:   badge-pop 300ms ease;
  --animate-bell-ring:   bell-ring 500ms ease;
  --animate-card-in:     card-in 200ms ease both;
  --animate-field-error: error-in 150ms ease;
  --animate-shake:       shake 250ms ease;
}
```

Keyframe definitions di luar `@theme {}`:

```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
@keyframes badge-pop {
  0%,100% { transform: scale(1); }
  40%     { transform: scale(1.3); }
}
@keyframes bell-ring {
  0%,100% { rotate: 0deg; }
  20%     { rotate: -15deg; }
  40%     { rotate: 15deg; }
  60%     { rotate: -10deg; }
  80%     { rotate: 10deg; }
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes error-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%     { transform: translateX(-4px); }
  75%     { transform: translateX(4px); }
}
```

#### 3. Micro-interactions CSS

Tambahkan utility dan class berikut ke `src/index.css`:

##### Button

```css
/* Semua shadcn Button */
.btn-base:active { transform: scale(0.97); }
/* Tailwind v4 cara langsung: */
/* className="active:scale-[0.97] transition-transform duration-100" */
```

##### Card Interactive

Gunakan hanya untuk card yang bisa diklik:

```css
.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.card-interactive {
  transition: transform 150ms ease, box-shadow 150ms ease;
}
```

##### Sidebar Nav Item Hover

Slide-in background dari kiri:

```css
.nav-item { position: relative; overflow: hidden; }
.nav-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--role-surface);
  transform: translateX(-100%);
  transition: transform 150ms ease;
}
.nav-item:hover::before { transform: translateX(0); }
```

##### Stat Card Stagger

```css
.stat-card { animation: card-in 200ms ease both; }
.stat-card:nth-child(1) { animation-delay: 0ms; }
.stat-card:nth-child(2) { animation-delay: 50ms; }
.stat-card:nth-child(3) { animation-delay: 100ms; }
.stat-card:nth-child(4) { animation-delay: 150ms; }
```

##### Form Error State

```css
.input-error {
  border-color: var(--color-danger-border);
  animation: shake 250ms ease;
}
.input-success { border-color: var(--color-success-border); }
.field-error { animation: error-in 150ms ease; }
```

### Output

- `src/components/common/PageTransition.tsx` (baru)
- `src/App.tsx` (wrap AnimatePresence)
- `src/index.css` (keyframes + utility classes)

---

## Prompt 06 — Skeleton Loader

> Membuat sistem skeleton loading yang konsisten di seluruh aplikasi, menggantikan spinner generik dengan skeleton yang sesuai shape konten sebenarnya.

### Konteks Tambahan

File yang sudah ada:

- `src/components/ui/skeleton.tsx` (shadcn) — sudah ada
- `src/components/common/dashboard-skeleton.tsx` — ada tapi jarang dipakai
- Banyak halaman masih pakai `LoadingSpinner` (bulat di tengah)

### Requirement

#### 1. Shimmer Base Style

Tambahkan ke `src/index.css`:

```css
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 25%,
    var(--color-border)       50%,
    var(--color-bg-secondary) 75%
  );
  background-size: 200%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

Dark mode otomatis karena menggunakan CSS variables.

#### 2. DashboardSkeleton

Buat `src/components/common/skeletons/DashboardSkeleton.tsx`:

- 4 stat card skeleton — height `96px`, `rounded-xl`, full width
- 2 content card skeleton di bawah — height `240px`
- Layout **identik** dengan dashboard nyata (same grid classes)
- Gunakan class `skeleton-shimmer`

#### 3. TableSkeleton

Buat `src/components/common/skeletons/TableSkeleton.tsx`:

```ts
interface TableSkeletonProps {
  rows?: number     // default 6
  columns?: number  // default 5
}
```

- Header row: opacity lebih gelap
- Body rows: lebar kolom bervariasi (60%, 80%, 50%, 70%, 40%)

#### 4. CardListSkeleton

Buat `src/components/common/skeletons/CardListSkeleton.tsx`:

```ts
interface CardListSkeletonProps {
  count?: number  // default 4
}
```

- Card skeleton: height `120px`, gap `12px`, full width

#### 5. FormSkeleton

Buat `src/components/common/skeletons/FormSkeleton.tsx`:

- 4 field skeleton: label `12px` height + input `40px` height, gap `20px`
- 1 button skeleton di bawah: height `40px`, width `120px`

#### 6. ErrorFallback Component

Buat `src/components/common/ErrorFallback.tsx`:

```ts
interface ErrorFallbackProps {
  message: string
  onRetry?: () => void
}
```

- Icon `IconAlertTriangle` + pesan error + tombol "Coba lagi"

#### 7. Update Halaman

Terapkan pola wajib di setiap halaman berikut:

```tsx
if (isLoading) return <[Tipe]Skeleton />
if (error)     return <ErrorFallback message={error.message} onRetry={refetch} />
if (!data?.length) return <EmptyState variant="no-data" context="..." />
return <KontenAsli />
```

| Halaman | Skeleton yang dipakai |
|---------|----------------------|
| `src/pages/admin/DashboardPage.tsx` | `DashboardSkeleton` |
| `src/pages/dosen/DashboardPage.tsx` | `DashboardSkeleton` |
| `src/pages/mahasiswa/DashboardPage.tsx` | `DashboardSkeleton` |
| `src/pages/laboran/DashboardPage.tsx` | `DashboardSkeleton` |
| `src/pages/mahasiswa/NilaiPage.tsx` | `CardListSkeleton` |
| `src/pages/mahasiswa/MateriPage.tsx` | `CardListSkeleton` |
| `src/pages/dosen/kuis/KuisListPage.tsx` | `CardListSkeleton` |
| `src/pages/admin/UsersPage.tsx` | `TableSkeleton` |
| `src/pages/laboran/InventarisPage.tsx` | `TableSkeleton` |

### Output

- `src/index.css` (shimmer style)
- `src/components/common/skeletons/DashboardSkeleton.tsx`
- `src/components/common/skeletons/TableSkeleton.tsx`
- `src/components/common/skeletons/CardListSkeleton.tsx`
- `src/components/common/skeletons/FormSkeleton.tsx`
- `src/components/common/ErrorFallback.tsx`
- Semua halaman yang terdaftar di atas (diperbarui)

---

## Prompt 07 — Empty States Kontekstual

> Mengubah empty state generik "Tidak ada data" menjadi pesan yang informatif dan kontekstual per fitur, termasuk penanganan kondisi offline.

### Konteks Tambahan

File yang sudah ada:

- `src/components/common/EmptyState.tsx` — ada tapi sangat generik
- `src/context/OfflineContext.tsx` — sudah ada dengan `isOffline` boolean
- Banyak halaman tidak menangani kondisi offline sama sekali

### Requirement

#### 1. Refactor EmptyState

Update `src/components/common/EmptyState.tsx`:

```ts
type EmptyStateVariant = 'no-data' | 'no-results' | 'offline' | 'error' | 'first-time'

interface EmptyStateProps {
  variant: EmptyStateVariant
  context?: string
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}
```

#### 2. Konten Default per Variant

| Variant | Icon | Judul Default | Deskripsi Default |
|---------|------|---------------|-------------------|
| `no-data` | `IconInbox` | `Belum ada {context}` | Sesuai context |
| `no-results` | `IconSearchOff` | Tidak ada hasil | Coba kata kunci lain... |
| `offline` | `IconWifiOff` | Tidak ada koneksi | Data belum tersimpan offline... |
| `error` | `IconAlertTriangle` | Terjadi kesalahan | Dari props `description` |
| `first-time` | `IconSparkles` | Selamat datang! | Sesuai context |

#### 3. Deskripsi per Context (variant no-data)

| Context | Deskripsi |
|---------|-----------|
| `kuis` | Buat kuis pertama untuk mulai mengevaluasi mahasiswamu |
| `materi` | Upload materi agar mahasiswa bisa belajar kapan saja |
| `mahasiswa` | Belum ada mahasiswa terdaftar di kelas ini |
| `peralatan` | Tambahkan peralatan untuk mulai mengelola inventaris lab |
| `jadwal` | Belum ada jadwal yang dibuat untuk periode ini |
| `nilai` | Nilai akan muncul setelah kuis atau tugas dinilai |
| `logbook` | Logbook akan muncul setelah mahasiswa mengisinya |

#### 4. Offline Detection di Halaman

Di setiap halaman yang fetch data:

```tsx
const { isOffline } = useOfflineContext()
// Jika offline && !data?.length → paksa variant="offline"
```

#### 5. OfflineAwareContent Wrapper

Buat `src/components/common/OfflineAwareContent.tsx`:

```ts
interface OfflineAwareContentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}
```

Logika:
- Online: render `children`
- Offline + ada cached data: render `children` + `<OfflineBanner />`
- Offline + tidak ada cached data: render `EmptyState variant="offline"`

#### 6. OfflineBanner Component

Buat `src/components/common/OfflineBanner.tsx`:

- Banner kuning di atas konten: "Anda sedang offline — menampilkan data tersimpan"
- Tombol "Sync sekarang" (disabled saat masih offline)
- Tombol dismiss

#### 7. Update Halaman

| Halaman | Variant | Context | Action |
|---------|---------|---------|--------|
| `KuisListPage` (dosen) | `no-data` | `kuis` | Navigate to create |
| `MateriPage` | `no-data` | `materi` | Navigate to upload |
| `NilaiPage` (mahasiswa) | `first-time` | `nilai` | — |
| `InventarisPage` | `no-data` | `peralatan` | Navigate to add |
| `JadwalPage` | `no-data` | `jadwal` | — |
| `LogbookPage` | `no-data` | `logbook` | — |
| Semua halaman search/filter | `no-results` | — | Reset filter |

### Output

- `src/components/common/EmptyState.tsx` (refactored)
- `src/components/common/OfflineAwareContent.tsx` (baru)
- `src/components/common/OfflineBanner.tsx` (baru)
- Semua halaman yang terdaftar (diperbarui)

---

## Prompt 08 — Aksesibilitas WCAG 2.2 AA

> Audit dan perbaikan aksesibilitas menyeluruh: focus ring, semantic HTML, ARIA labels, color contrast, keyboard navigation, dan form accessibility.

### Konteks Tambahan

Belum ada audit aksesibilitas sebelumnya. Semua perbaikan bersifat additive.

### Requirement

#### 1. Focus Ring

Tambahkan ke `src/index.css`:

```css
/* JANGAN pakai * { outline: none } — itu merusak keyboard navigation */
*:not(:focus-visible) { outline: none; }

*:focus-visible {
  outline: 2px solid var(--role-focus-ring, #6d28d9);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

#### 2. Skip Link

Tambahkan sebagai element pertama di `AppLayout.tsx`:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
             focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:rounded-md
             focus:text-sm focus:font-medium focus:shadow-lg"
>
  Langsung ke konten
</a>
```

#### 3. Semantic HTML

Update semua layout component:

| Component | Sebelum | Sesudah |
|-----------|---------|---------|
| `AppLayout.tsx` | `<div>` wrapper | `<div>` yang wrap `<aside>` + `<main>` |
| `Sidebar.tsx` | root `<div>` | `<aside aria-label="Navigasi utama" role="navigation">` |
| `Header.tsx` | root `<div>` | `<header role="banner">` |
| Main content | `<div>` | `<main id="main-content" tabIndex={-1}>` |

#### 4. Navigation Items

- Nav link ke halaman lain: gunakan `<NavLink>` dari react-router-dom (render sebagai `<a>`)
- Aksi bukan navigasi: gunakan `<button>`
- **Dilarang** menggunakan `<div>` atau `<span>` sebagai nav item yang interaktif
- `aria-current="page"` pada item aktif — sudah otomatis via `NavLink`

#### 5. Icon Accessibility

Aturan untuk semua icon di seluruh aplikasi:

```tsx
// Dekoratif (dalam tombol yang punya teks label):
<IconBell aria-hidden="true" />

// Interaktif (icon-only button) — wajib ada aria-label:
<button aria-label="Notifikasi (3 belum dibaca)">
  <IconBell aria-hidden="true" />
</button>

// DILARANG:
<button><IconBell /></button>  // tanpa aria-label
```

#### 6. Color Contrast

Perbaiki nilai berikut di seluruh codebase:

| Sebelum | Sesudah | Keterangan |
|---------|---------|------------|
| `text-gray-400` | `text-gray-500` | Untuk teks konten |
| `text-gray-300` | `text-gray-400` | Untuk placeholder saja |
| Sidebar text `rgba(255,255,255,0.65)` | `rgba(255,255,255,0.85)` | Minimal ratio 4.5:1 |

#### 7. Form Accessibility

Update semua form di aplikasi:

```tsx
// Setiap input wajib:
<Label htmlFor="field-email">Email</Label>
<Input id="field-email" aria-required="true" aria-describedby="field-email-error" aria-invalid={!!error} />
<p id="field-email-error" role="alert">{error}</p>

// Submit loading:
<button aria-busy="true" aria-label="Sedang memproses, mohon tunggu">
```

#### 8. Table Accessibility

Untuk semua DataTable di halaman admin:

```tsx
<table>
  <caption className="sr-only">Deskripsi isi tabel</caption>
  <thead>
    <tr>
      <th scope="col" aria-sort="none">Nama</th>
    </tr>
  </thead>
</table>
```

### Output

- `src/index.css` (focus ring)
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- Semua form components (diperbarui)

---

## Prompt 09 — Command Palette

> Implementasi command palette global (Ctrl+K / Cmd+K) dengan navigasi cepat, aksi per role, dan live search data.

### Konteks Tambahan

File yang sudah ada:

- `src/components/ui/command.tsx` — sudah ada (cmdk-based shadcn component)
- `src/lib/hooks/useRole.ts` — sudah ada
- `useNavigate` dari react-router-dom tersedia

### Requirement

#### 1. Hook useCommandPalette

Buat `src/lib/hooks/useCommandPalette.ts`:

```ts
interface UseCommandPaletteReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}
```

- `useEffect` untuk keyboard listener: `Ctrl+K` / `Meta+K`
- `preventDefault()` agar tidak trigger shortcut browser
- Cleanup listener di return effect

#### 2. CommandPalette Component

Buat `src/components/common/CommandPalette.tsx`:

- Gunakan shadcn `CommandDialog` sebagai base
- State search string, debounce 300ms untuk live search
- Render hanya saat `isOpen = true`

TypeScript interface:

```ts
interface CommandItem {
  id: string
  label: string
  icon: React.ElementType
  shortcut?: string
  onSelect: () => void
  group: 'nav' | 'action' | 'setting' | 'search'
}
```

#### 3. Struktur Konten Command Groups

| Group | Isi | Sifat |
|-------|-----|-------|
| "Navigasi" | Halaman sesuai role | Static, dari `navigation.config.ts` |
| "Aksi Cepat" | Aksi role-specific | Static, lihat tabel bawah |
| "Pengaturan" | Profil, Ganti Tema, Logout | Static, selalu ada |
| "Hasil Pencarian" | Data Supabase | Dinamis, muncul saat search > 0 |

Aksi cepat per role:

| Role | Aksi |
|------|------|
| Admin | Tambah User · Buat Pengumuman · Export Laporan |
| Dosen | Buat Kuis · Upload Materi · Absen Kelas |
| Mahasiswa | Sync Materi Offline · Lihat Jadwal Hari Ini |
| Laboran | Setujui Peminjaman · Cek Inventaris Kritis |

> **Catatan:** jangan hardcode ulang item navigasi. Import dari `navigation.config.ts` yang sudah ada, filter sesuai role.

#### 4. Keyboard Navigation dalam Palette

- Arrow Up/Down: pilih item
- Enter: jalankan aksi / navigasi
- Escape: tutup

#### 5. Animasi

```css
[data-state="open"]  { animation: cmd-in  150ms ease; }
[data-state="closed"]{ animation: cmd-out 100ms ease; }

@keyframes cmd-in  {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes cmd-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.95); }
}
```

#### 6. Integrasi ke Layout

- Render `CommandPalette` **sekali** di `AppLayout.tsx` di root layout
- Tambah search button di `Header.tsx` dengan hint badge `⌘K`

### Output

- `src/lib/hooks/useCommandPalette.ts` (baru)
- `src/components/common/CommandPalette.tsx` (baru)
- `src/components/layout/AppLayout.tsx` (render CommandPalette)
- `src/components/layout/Header.tsx` (search button + hint)

---

## Prompt 10 — Dashboard Charts & Data Visualization

> Menambahkan visualisasi data berupa berbagai jenis chart ke 4 dashboard per role menggunakan Recharts yang sudah terinstall.

### Konteks Tambahan

File yang sudah ada:

- `src/components/common/DashboardChart.tsx` — ada sebagai base
- `src/components/common/NilaiChart.tsx` — ada tapi tidak dipakai
- Recharts sudah terinstall

### Requirement

#### 1. ChartCard Wrapper

Buat `src/components/common/ChartCard.tsx`:

```ts
interface ChartCardProps {
  title: string
  subtitle?: string
  period?: '7d' | '30d' | 'semester'
  onPeriodChange?: (p: '7d' | '30d' | 'semester') => void
  isLoading?: boolean
  isEmpty?: boolean
  children: React.ReactNode
  className?: string
}
```

- Header: title (`text-heading`) + subtitle (`text-small text-muted`) + period selector
- Loading: skeleton 200px
- Empty: `EmptyState variant="no-data"`
- Wrapper: `rounded-xl border bg-bg-primary p-5`

#### 2. Data Transformers

Buat `src/lib/utils/chart-transformers.ts` — semua fungsi transformer di sini:

```ts
// Contoh signature:
function transformUserGrowthData(users: User[]): { month: string; admin: number; dosen: number; mahasiswa: number; laboran: number }[]
function transformAttendanceData(attendance: Attendance[]): { kelas: string; persen: number }[]
function transformRoleDistribution(users: User[]): { name: string; value: number; color: string }[]
function transformGradeDistribution(grades: Grade[]): { grade: string; count: number }[]
// dst...
```

> **Catatan:** tidak ada hardcoded mock data. Semua data dari `useQuery`, jika kosong tampilkan `EmptyState`.

#### 3. Chart per Dashboard

##### Admin

| Chart | Tipe | Data |
|-------|------|------|
| Pertumbuhan Pengguna | AreaChart multi-line | 6 bulan, per role |
| Kehadiran per Kelas | BarChart | % kehadiran per kelas |
| Distribusi Role | PieChart (donut) | Admin/Dosen/Mahasiswa/Laboran |

##### Dosen

| Chart | Tipe | Data |
|-------|------|------|
| Distribusi Nilai | BarChart | A/B/C/D/E per kelas |
| Trend Kehadiran | LineChart | % per minggu |
| Progres Kuis | RadialBarChart | % mahasiswa selesai |

##### Mahasiswa (NilaiPage)

| Chart | Tipe | Data |
|-------|------|------|
| Nilai per Kompetensi | RadarChart | Per mata kuliah |
| Tren Nilai | LineChart | Per semester |

##### Laboran

| Chart | Tipe | Data |
|-------|------|------|
| Status Inventaris | PieChart | Tersedia/Dipinjam/Rusak |
| Penggunaan Lab per Jam | Heatmap custom | Grid 7 hari × 12 jam |

#### 4. Aturan Semua Chart

- Warna dari CSS variables: `var(--role-accent)`, `var(--role-50)`, dll
- `<ResponsiveContainer width="100%" height={220}>`
- Tooltip: `background var(--color-bg-primary)`, `border var(--color-border)`
- `isAnimationActive={true}` dengan `animationDuration={600}`

### Output

- `src/components/common/ChartCard.tsx` (baru)
- `src/lib/utils/chart-transformers.ts` (baru)
- `src/pages/admin/DashboardPage.tsx` (diperbarui)
- `src/pages/dosen/DashboardPage.tsx` (diperbarui)
- `src/pages/mahasiswa/NilaiPage.tsx` (diperbarui)
- `src/pages/laboran/DashboardPage.tsx` (diperbarui)

---

## Prompt 11 — Typography & Font System

> Standardisasi tipografi dengan variable font offline-friendly untuk PWA, type scale utility classes, dan audit teks yang terlalu terang.

### Konteks Tambahan

Font saat ini: system-ui (default). Belum ada standar type scale.

### Requirement

#### 1. Install Font

```bash
npm install @fontsource-variable/plus-jakarta-sans
```

Gunakan variable font (satu file untuk semua weight) — lebih efisien untuk PWA.

#### 2. Update Entry Point

Di `src/main.tsx`, import sebelum CSS lainnya:

```ts
import '@fontsource-variable/plus-jakarta-sans'
import './styles/tokens.css'
import './index.css'
```

#### 3. Registrasi Font di @theme

Tambahkan di `src/index.css` dalam `@theme {}`:

```css
@theme {
  --font-sans: "Plus Jakarta Sans Variable", system-ui, sans-serif;
}
```

Ini otomatis membuat class `font-sans` di Tailwind v4.

#### 4. Plugin Typography

Install dan registrasi:

```bash
npm install -D @tailwindcss/typography
```

Tambahkan di awal `src/index.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

Gunakan class `prose` di: MateriViewer, InstruksiKuis, DeskripsiKelas.

#### 5. Type Scale Utility Classes

Type scale **tidak** masuk `@theme {}` (nilainya tidak generate utility yang berguna). Taruh di `:root` dalam `tokens.css` (sudah dibuat di Prompt 01), lalu buat utility manual di `src/index.css`:

```css
.text-display { font-size: var(--text-display); font-weight: 600; line-height: 1.2; }
.text-title   { font-size: var(--text-title);   font-weight: 500; line-height: 1.3; }
.text-heading { font-size: var(--text-heading); font-weight: 500; line-height: 1.4; }
.text-body    { font-size: var(--text-body);    font-weight: 400; line-height: 1.6; }
.text-small   { font-size: var(--text-small);   font-weight: 400; line-height: 1.5; }
.text-caption { font-size: var(--text-caption); font-weight: 500; line-height: 1.4; }
```

Class ini tidak konflik dengan Tailwind v4 karena tidak di-generate secara default.

#### 6. Update PageHeader

Update `src/components/layout/PageHeader.tsx`:

- Title: gunakan class `text-display`
- Subtitle: gunakan class `text-small` + `text-text-muted`
- Pastikan konsisten di semua halaman

#### 7. Audit Teks Pucat

Temukan dan ganti di seluruh codebase:

| Sebelum | Sesudah | Konteks |
|---------|---------|---------|
| `text-gray-400` | `text-gray-500` | Teks konten |
| `text-gray-300` | `text-gray-400` | Placeholder saja |
| `opacity-50` pada teks | `text-text-muted` via CSS variable | — |

### Output

- `src/main.tsx` (import font)
- `src/index.css` (`@plugin typography` + utility classes)
- `src/components/layout/PageHeader.tsx`

---

## Prompt 12 — Halaman Login & Register

> Redesign total halaman login dan register dengan split-panel layout modern, warna brand AKMB (ungu-indigo), validasi inline, dan penanganan PWA offline.

### Konteks Tambahan

File yang sudah ada:

- `src/pages/auth/LoginPage.tsx`
- `src/components/forms/LoginForm.tsx`
- `src/pages/auth/RegisterPage.tsx`
- `src/components/forms/RegisterForm.tsx`
- `src/components/layout/AuthLayout.tsx`
- `src/lib/offline-auth.ts`

Referensi desain: split-screen modern seperti Linear/Vercel/Supabase login page.  
> Brand color: gradient ungu-indigo (`#7c3aed → #4f46e5 → #1d4ed8`) — bukan pink.

### Requirement

#### 1. AuthLayout — Split Panel

Update `src/components/layout/AuthLayout.tsx`:

```ts
interface AuthLayoutProps {
  variant: 'login' | 'register'
  children: React.ReactNode
}
```

- Login: brand panel **kiri** (42%) + form **kanan** (58%)
- Register: form **kiri** (58%) + brand panel **kanan** (42%)
- Brand panel background: `linear-gradient(145deg, #7c3aed 0%, #4f46e5 55%, #1d4ed8 100%)`

Isi brand panel:
- Atas: icon `IconBuildingHospital` + nama "SiPraktik AKMB" + tagline
- Tengah: headline besar + deskripsi + 3 feature item (icon box + teks)
- Bawah: PWA badge "Dapat diinstal sebagai aplikasi"

Mobile `< 768px`:
- 1 kolom: brand panel collapse jadi strip header `80px`
- Strip: gradient mini + logo + nama sistem
- Form: full width, `padding: 24px`

#### 2. LoginForm

Zod schema:

```ts
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  rememberMe: z.boolean().optional(),
})
```

Layout form:
- Header: "Masuk ke akun Anda" (`text-display`) + subtitle `text-muted`
- Field Email: icon `IconMail` kiri, placeholder `nama@akmb.ac.id`
- Field Password: icon `IconLock` kiri + toggle show/hide (`IconEye` / `IconEyeOff`) kanan
- Row: checkbox "Ingat saya" + link "Lupa password?"
- Submit: full width, gradient ungu-indigo, icon `IconLogin`
- Divider "atau lanjutkan dengan"
- Social: Google (`IconBrandGoogle`) · GitHub (`IconBrandGithub`) · Microsoft (`IconBrandWindows`)

States:

| State | Tampilan |
|-------|---------|
| Default | Normal |
| Loading | `IconLoader2 animate-spin` + "Sedang masuk..." + input disabled |
| Success | `IconCheck` hijau + "Berhasil!" → navigate ke dashboard |
| Error | Banner merah di atas form + shake animation |
| Locked | Countdown "Coba lagi dalam X detik" |

PWA Offline:
- Deteksi dari `useOfflineContext()`
- Banner kuning: "Mode offline — gunakan kredensial terakhir"
- Handle via `offline-auth.ts`

#### 3. RegisterForm

Zod schema:

```ts
const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName:  z.string().min(2),
  email:     z.string().email(),
  role:      z.enum(['admin', 'dosen', 'mahasiswa', 'laboran']),
  password:  z.string()
    .min(8)
    .regex(/[A-Z]/, 'Harus ada huruf kapital')
    .regex(/[0-9]/, 'Harus ada angka'),
})
```

Layout form:
- Header: "Buat akun baru" + badge chip 4 role (pill berwarna sesuai role)
- Grid 2 kolom: Nama Depan + Nama Belakang
- Field Email, Select Role, Field Password
- Password: toggle + strength indicator bar 4 segmen (Weak/Fair/Good/Strong)
- Submit: icon `IconUserPlus`

#### 4. Validasi Inline

Mode: `onBlur` untuk semua field.

- Error: border `danger` + icon `IconX` kanan + pesan `animate-in`
- Valid: border `success` + icon `IconCheck` kanan
- Email `@akmb.ac.id`: hint biru "Email institusi terdeteksi ✓"

#### 5. Aksesibilitas

- Setiap input: `htmlFor` + `id` terhubung
- Error: `aria-describedby` + `aria-invalid`
- Required: `aria-required="true"`
- Submit loading: `aria-busy="true"`
- Auto-focus ke email input saat halaman mount

### Output

- `src/components/layout/AuthLayout.tsx`
- `src/pages/auth/LoginPage.tsx`
- `src/components/forms/LoginForm.tsx`
- `src/pages/auth/RegisterPage.tsx`
- `src/components/forms/RegisterForm.tsx`

---

## Prompt 13 — Dashboard Polish per Role

> Melengkapi dan memperhalus 4 dashboard utama dengan layout yang sesuai prinsip desain per role, quick actions, alert, dan auto-refresh.

### Konteks Tambahan

File yang sudah ada — perlu diupdate:

- `src/pages/admin/DashboardPage.tsx`
- `src/pages/dosen/DashboardPage.tsx`
- `src/pages/mahasiswa/DashboardPage.tsx`
- `src/pages/laboran/DashboardPage.tsx`

Prinsip desain per role:

| Role | Prinsip |
|------|---------|
| Admin | Dense, data-heavy, monitoring focus |
| Dosen | Action-oriented, kelas & kuis focus |
| Mahasiswa | Clean, motivational, progress focus |
| Laboran | Urgent, approval-first |

### Requirement

#### 1. Admin Dashboard

Section dan urutannya:

1. **Alert Bar** — banner merah jika ada pending peminjaman; banner kuning jika ada konflik sinkronisasi
2. **Quick Actions** — tombol: Tambah User · Buat Pengumuman · Export Laporan
3. **Stats Grid** (4 kartu, 4 kolom desktop / 2 kolom mobile):
   - Total User · Kelas Aktif · Lab Aktif · Peminjaman Pending
   - Setiap kartu: angka besar + label + trend indicator (↑↓ dengan %)
4. **Grid 2 Kolom**:
   - Kiri: Chart pertumbuhan pengguna (dari Prompt 10)
   - Kanan: Tabel 5 user terbaru (avatar + nama + role + tanggal daftar)
5. **Status Sistem** — 3 badge: Database · Queue · Konflik
6. **Recent Activity Feed** — 10 log terakhir: icon + deskripsi + timestamp relatif

#### 2. Dosen Dashboard

Section dan urutannya:

1. **Greeting Personal** — "Selamat pagi/siang/sore, {firstName}!" + tanggal lengkap (waktu dinamis)
2. **Jadwal Hari Ini** — chip status: Selesai (hijau) · Berlangsung (biru, pulse) · Akan Datang (abu)
3. **Quick Actions** — Absen Kelas · Buat Kuis · Upload Materi
4. **Kuis Aktif** — nama + deadline + progress bar (% selesai) + tombol "Lihat Detail"
5. **Logbook Menunggu Review** — badge count merah + nama mahasiswa + kelas + tanggal
6. **Kehadiran Overview** — per kelas: nama + progress bar % + angka hadir/total

#### 3. Mahasiswa Dashboard

Section dan urutannya:

1. **Welcome Card** — avatar inisial + nama + NIM + semester + kelas, background `var(--role-50)`
2. **Alert Deadline** — banner merah jika kuis deadline ≤ 24 jam dengan countdown; banner kuning jika ≤ 3 hari
3. **Stats** (4 kartu) — Nilai Rata-rata · Kehadiran % · Logbook Terisi · Materi Offline
4. **Kuis Tersedia** — sort by deadline ASC, per item: nama + mata kuliah + countdown + tombol "Kerjakan"
5. **Jadwal Minggu Ini** — 3–5 jadwal terdekat: hari + jam + mata kuliah + ruang/lab
6. **Nilai Terbaru + Streak** — 3 nilai terakhir + streak kehadiran jika ada

#### 4. Laboran Dashboard

Section dan urutannya:

1. **Alert Prominant** (jika ada pending) — banner merah besar + 3 peminjaman teratas dengan tombol **Setujui / Tolak inline** (tanpa perlu navigasi)
2. **Status Lab Real-time** — grid 5 kartu lab: nama + chip status (Kosong/Dipakai/Maintenance) + info kelas saat dipakai
3. **Inventaris Kritis** — item stok rendah (< 5) atau status Rusak, badge merah di header section
4. **Jadwal Lab Hari Ini** — timeline: jam · nama kelas · dosen · lab

#### 5. Aturan Semua Dashboard

- Skeleton loading: `DashboardSkeleton` dari Prompt 06
- Empty state per section: `EmptyState` dari Prompt 07
- Responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` sesuai kebutuhan
- Auto-refresh setiap 5 menit: `useEffect + setInterval → queryClient.invalidateQueries()`
- Pull-to-refresh mobile: touch event listener dengan threshold `70px`

### Output

- `src/pages/admin/DashboardPage.tsx`
- `src/pages/dosen/DashboardPage.tsx`
- `src/pages/mahasiswa/DashboardPage.tsx`
- `src/pages/laboran/DashboardPage.tsx`

---

## Prompt 14 — Standardisasi Form & Validasi

> Membuat komponen form reusable, standardisasi semua form ke mode onBlur, dan menambahkan enhancement seperti input dengan icon, file upload zone, dan character counter.

### Konteks Tambahan

File yang sudah ada:

- react-hook-form sudah dipakai
- zod sudah dipakai
- shadcn/ui Form, Input, Label, Select sudah ada

### Requirement

#### 1. FormField Component

Buat `src/components/common/FormField.tsx`:

```ts
interface FormFieldProps {
  name: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  isValid?: boolean
  children: React.ReactNode
  className?: string
}
```

- Label: `font-medium 13px` + asterisk merah jika required
- Hint: `text-small text-muted` di bawah input (opsional)
- Error: `text-danger text-small` + `IconAlertCircle` 14px + class `field-error` (animate-in dari Prompt 05)
- Valid: `IconCircleCheck` 14px warna success, fade-in

#### 2. Input Enhancement Components

Buat di `src/components/common/inputs/`:

| File | Deskripsi |
|------|-----------|
| `EmailInput.tsx` | Input + `IconMail` kiri, `type="email"` |
| `PasswordInput.tsx` | Input + `IconLock` kiri + toggle show/hide kanan |
| `SearchInput.tsx` | Input + `IconSearch` kiri + clear button (`IconX`) kanan |
| `TextareaWithCounter.tsx` | Textarea + counter "X / maxLength karakter" pojok kanan bawah, merah jika melebihi limit |

#### 3. Submit Button States

Buat `src/lib/hooks/useSubmitState.ts`:

```ts
type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export function useSubmitState(): {
  state: SubmitState
  setLoading: () => void
  setSuccess: () => void  // otomatis kembali ke idle setelah 2 detik
  setError: () => void
  setIdle: () => void
}
```

Buat `src/components/common/SubmitButton.tsx`:

```ts
interface SubmitButtonProps {
  state: SubmitState
  label: string
  loadingLabel?: string
  className?: string
}
```

| State | Tampilan |
|-------|---------|
| `idle` | Label normal |
| `loading` | `IconLoader2 animate-spin` + loadingLabel ?? "Menyimpan..." |
| `success` | `IconCheck` hijau + "Tersimpan!" |
| `error` | Label normal, siap disubmit ulang |

#### 4. File Upload Zone

Buat `src/components/common/FileUploadZone.tsx`:

```ts
interface FileUploadZoneProps {
  accept: string[]           // ['application/pdf', 'image/*']
  maxSizeMB: number
  onFileSelect: (file: File) => void
  isUploading?: boolean
  uploadProgress?: number    // 0-100
}
```

- Drop zone: `border-dashed 2px border-muted rounded-xl padding-8`
- Drag-over: `border-role-accent bg-role-surface`
- Preview: nama file + ukuran + icon sesuai tipe
- Progress: linear progress bar saat `isUploading`
- Error: file terlalu besar / format tidak diterima (ditampilkan di dalam zona)
- Aksesibel: `<input type="file" className="sr-only">` + label keyboard-accessible

#### 5. Update Semua Form

Update file-file berikut ke mode `onBlur`:

```ts
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur',
  reValidateMode: 'onChange',
})
```

File yang diupdate:

- `src/components/forms/LoginForm.tsx`
- `src/components/forms/RegisterForm.tsx`
- `src/components/forms/ProfileForm.tsx`
- `src/components/forms/PasswordForm.tsx`
- Semua form di `src/pages/admin/` (user, kelas, mata kuliah, lab, peralatan)
- Semua form di `src/pages/dosen/` (jadwal, materi, kuis, bank soal)

#### 6. Select Enhancement

Semua shadcn `<Select>`:
- Placeholder spesifik: "Pilih kelas..." bukan "Select..."
- Disabled state: `opacity-50 cursor-not-allowed`

### Output

- `src/components/common/FormField.tsx` (baru)
- `src/components/common/inputs/EmailInput.tsx` (baru)
- `src/components/common/inputs/PasswordInput.tsx` (baru)
- `src/components/common/inputs/SearchInput.tsx` (baru)
- `src/components/common/inputs/TextareaWithCounter.tsx` (baru)
- `src/lib/hooks/useSubmitState.ts` (baru)
- `src/components/common/SubmitButton.tsx` (baru)
- `src/components/common/FileUploadZone.tsx` (baru)
- Semua form files (diperbarui)

---

## Prompt 15 — Notifikasi & Real-time Updates

> Memperbaiki tampilan NotificationBell, redesign dropdown notifikasi dengan grouping per hari, membuat halaman notifikasi penuh, dan menambahkan PWA push notification permission flow.

### Konteks Tambahan

File yang sudah ada:

- `src/components/layout/NotificationBell.tsx`
- `src/components/layout/NotificationDropdown.tsx`
- `src/context/NotificationContext.tsx`
- `src/lib/hooks/useNotifications.ts`
- `src/lib/hooks/useUnreadNotifications.ts`
- `src/lib/api/notification.api.ts`
- `src/components/common/RoleNotificationCenter.tsx`
- Polling via `useNotificationPolling` — perlu diverifikasi intervalnya

### Requirement

#### 1. Update NotificationBell

Update `src/components/layout/NotificationBell.tsx`:

- Icon: `<IconBell>`
- Animasi ring saat `unreadCount` bertambah: `animation: bell-ring 500ms ease` (dari Prompt 05)
- Badge: absolute top-right, background merah, teks putih `font-mono text-[10px]`, animasi `badge-pop` saat angka berubah
- Tooltip shadcn: "{unreadCount} notifikasi belum dibaca"

#### 2. Update NotificationDropdown

Update `src/components/layout/NotificationDropdown.tsx`:

- Implementasi: shadcn `Popover` atau `DropdownMenu`
- Max-height: `400px` dengan `overflow-y-auto`
- Header: "Notifikasi" (`text-heading`) + button "Tandai semua dibaca"
- Footer: link "Lihat semua notifikasi →"
- Empty state: `IconBellOff` + "Tidak ada notifikasi"

Grouping per hari:

```ts
type GroupLabel = 'Hari ini' | 'Kemarin' | 'Minggu ini' | 'Lebih lama'

function groupNotifications(
  notifications: Notification[]
): Record<GroupLabel, Notification[]>
```

Item notifikasi:
- Unread: `bg-role-surface` + dot biru 8px di kiri
- Read: background normal
- Hover: `bg-bg-secondary`
- Waktu relatif: gunakan `formatDistanceToNow` dari `date-fns`

#### 3. Mapping Tipe Notifikasi

| Tipe | Icon | Warna |
|------|------|-------|
| `kuis_baru` | `IconClipboardCheck` | Biru |
| `nilai_keluar` | `IconStar` | Kuning |
| `jadwal_baru` | `IconCalendarEvent` | Ungu |
| `peminjaman_disetujui` | `IconCircleCheck` | Hijau |
| `peminjaman_ditolak` | `IconCircleX` | Merah |
| `pengumuman` | `IconSpeakerphone` | Oranye |
| `logbook_direview` | `IconNotebook` | Teal |
| default | `IconBell` | Abu |

#### 4. Verifikasi Polling

Di `useNotificationPolling`:
- Interval wajib: `30000ms` (30 detik)
- Cleanup `clearInterval` saat unmount — pastikan ada
- Pause saat tab tidak aktif: `document.addEventListener('visibilitychange', ...)`

#### 5. Halaman Notifikasi Penuh

Buat `src/pages/shared/NotificationsPage.tsx`:

- Header: `PageHeader title="Notifikasi"`
- Filter tab: Semua · Belum Dibaca · Sudah Dibaca
- Filter dropdown: per tipe notifikasi
- List dengan infinite scroll menggunakan `useInfiniteQuery` dari TanStack Query
- Per item: layout sama dengan dropdown + tombol hapus `IconTrash`
- Bulk action: checkbox select + "Tandai dibaca" + "Hapus"

#### 6. PWA Push Permission Flow

Buat `src/components/common/PushPermissionPrompt.tsx`:

- Tampil sebagai shadcn `Sheet` dengan `side="bottom"` setelah login pertama kali
- **Bukan** browser default prompt langsung
- Konten: icon bell besar + judul "Aktifkan notifikasi?" + 3 manfaat + tombol "Izinkan" + "Nanti saja"
- Setelah "Izinkan": baru panggil `Notification.requestPermission()`
- Simpan preferensi di `localStorage` key `'push-prompt-shown'`
- Tidak muncul lagi jika sudah pernah ditampilkan

### Output

- `src/components/layout/NotificationBell.tsx`
- `src/components/layout/NotificationDropdown.tsx`
- `src/pages/shared/NotificationsPage.tsx` (baru)
- `src/components/common/PushPermissionPrompt.tsx` (baru)
- `src/lib/hooks/useNotificationPolling.ts` (diverifikasi)

---

## Referensi Cepat Tailwind v4

| Hal | Tailwind v3 | Tailwind v4 |
|----|-------------|-------------|
| Konfigurasi | `tailwind.config.ts` | `@theme {}` di CSS |
| Import | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Tambah warna | `extend.colors` di config | `--color-nama` dalam `@theme {}` |
| Tambah font | `extend.fontFamily` di config | `--font-nama` dalam `@theme {}` |
| Tambah animasi | `extend.keyframes + animation` | `--animate-nama` dalam `@theme {}` + `@keyframes` di luar |
| Dark mode | `darkMode: 'class'` + class `dark` | `[data-theme="dark"]` selector |
| Plugin | `plugins: [require(...)]` | `@plugin "nama-plugin"` |
| Arbitrary value | `bg-[#hex]` | sama |
| CSS variable utility | manual extend | otomatis dari `@theme {}` |

> **Aturan sederhana:** nilai statis → `@theme {}`. Nilai dinamis (role, dark mode) → `:root` biasa di `tokens.css`.

---

## Tips Penggunaan Prompt

- Selalu sertakan blok **Konteks Proyek** di awal setiap sesi baru
- Jika output terpotong: "Lanjutkan output untuk file `[nama file]` berikutnya"
- Setelah implementasi: "Review kode yang baru dibuat, apakah ada yang tidak konsisten dengan file lain?"
- Untuk setiap prompt: "Berikan juga unit test sederhana untuk komponen utama yang dibuat"
- Jika ada error TypeScript: "Fix TypeScript error berikut sambil tetap mengikuti aturan di Konteks Proyek"
