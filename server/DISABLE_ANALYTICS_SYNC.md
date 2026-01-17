# 📝 Panduan Disable Analytics & Sync Manager

## 🎯 Tujuan
Menonaktifkan fitur Analytics dan Sync Manager karena tidak termasuk dalam scope proposal penelitian.

---

## ✅ Langkah 1: Disable Analytics Route

**File:** `src/routes/index.tsx`

### Cari dan Comment Out (Lines 33, 258-263):

```typescript
// ❌ DISABLED: Analytics tidak dalam scope proposal
// import AdminAnalyticsPage from "@/pages/admin/AnalyticsPage";
```

```typescript
// ❌ DISABLED: Analytics route
// <Route
//   path="/admin/analytics"
//   element={
//     <RoleGuard requiredRole="admin">
//       <AppLayout>
//         <AdminAnalyticsPage />
//       </AppLayout>
//     </RoleGuard>
//   }
// />
```

---

## ✅ Langkah 2: Disable Sync Management Route

**File:** `src/routes/index.tsx`

### Cari dan Comment Out (Lines 34, 270-275):

```typescript
// ❌ DISABLED: Sync Management tidak dalam scope proposal
// import AdminSyncManagementPage from "@/pages/admin/SyncManagementPage";
```

```typescript
// ❌ DISABLED: Sync Management route
// <Route
//   path="/admin/sync-management"
//   element={
//     <RoleGuard requiredRole="admin">
//       <AppLayout>
//         <AdminSyncManagementPage />
//       </AppLayout>
//     </RoleGuard>
//   }
// />
```

---

## ✅ Langkah 3: Disable Sync Manager Initialization

**File:** `src/main.tsx`

### Cari dan Comment Out bagian SyncManager:

```typescript
// ❌ DISABLED: Auto-sync tidak dalam scope proposal
// import { syncManager } from '@/lib/offline/sync-manager';

// ❌ DISABLED: Sync initialization
// syncManager.initialize();
```

---

## ✅ Langkah 4: Remove Analytics Menu dari Sidebar

**File:** `src/components/layout/Sidebar.tsx` (atau file sidebar lainnya)

### Cari dan Comment Out menu Analytics:

```typescript
// ❌ DISABLED: Analytics menu
// {
//   icon: ChartBar,
//   label: 'Analytics',
//   href: '/admin/analytics',
//   role: 'admin',
// },
```

---

## ✅ Langkah 5: Remove Sync Menu dari Sidebar

**File:** `src/components/layout/Sidebar.tsx`

### Cari dan Comment Out menu Sync:

```typescript
// ❌ DISABLED: Sync Management menu
// {
//   icon: RefreshCw,
//   label: 'Sync Management',
//   href: '/admin/sync-management',
//   role: 'admin',
// },
```

---

## ✅ Langkah 6: Test Aplikasi

1. **Build aplikasi:**
   ```bash
   npm run build
   ```

2. **Test routing:**
   - Login sebagai Admin
   - Pastikan menu Analytics TIDAK muncul
   - Pastikan menu Sync Management TIDAK muncul
   - Coba akses URL langsung: `/admin/analytics` → Should show 404

3. **Test fitur inti:**
   - ✅ Kuis masih bisa dibuat dan dikerjakan
   - ✅ Nilai masih bisa diinput dan dilihat
   - ✅ Peminjaman masih berfungsi
   - ✅ Jadwal masih bisa dikelola

---

## 🔄 Cara Reaktivasi (Jika Diperlukan)

Jika suatu saat fitur ini dibutuhkan lagi:

1. Uncomment semua baris yang di-comment
2. Run `npm run build`
3. Test semua fungsi analytics dan sync

---

## 📊 Dampak ke Aplikasi

### ✅ Tidak Ada Dampak:
- Fitur kuis tetap berfungsi
- Penilaian tetap berfungsi
- Peminjaman tetap berfungsi
- RBAC tetap berfungsi
- PWA tetap berfungsi

### ⚠️ Yang Hilang:
- Tidak ada dashboard analytics untuk admin
- Tidak ada auto-sync background
- Tidak ada grafik statistik penggunaan

---

## 💡 Catatan Penting

1. **File TIDAK dihapus**, hanya di-disable
2. **Git history tetap ada** untuk tracking
3. **Bisa di-enable kembali** kapan saja
4. **Fokus development** ke fitur yang sesuai proposal

---

**Dibuat:** 2025-12-16
**Status:** Ready to implement
