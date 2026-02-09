# 🗑️ Fitur yang Dihapus/Dinonaktifkan

**Tanggal:** 2025-12-16
**Alasan:** Fitur tidak termasuk dalam scope proposal penelitian

---

## 📊 Fitur Analytics (Dihapus)

### **File Terkait:**
- ❌ `src/pages/admin/AnalyticsPage.tsx` - Halaman analytics dashboard
- ❌ `src/lib/api/analytics.api.ts` - API analytics
- ❌ Route `/admin/analytics` - Routing ke halaman analytics

### **Fungsi yang Dihapus:**
- Dashboard analytics untuk admin
- Statistik penggunaan sistem
- Grafik dan chart analytics
- Export data analytics

### **Dampak:**
- Menu "Analytics" di sidebar admin akan dihapus
- Tidak ada dampak ke fitur inti (Kuis, Nilai, Peminjaman, dll)

---

## 🔄 Fitur Sync Manager (Dinonaktifkan)

### **File Terkait:**
- ⏸️ `src/lib/offline/sync-manager.ts` - Sync manager service
- ⏸️ `src/lib/api/sync.api.ts` - Sync API
- ⏸️ Initialization di `src/main.tsx`

### **Fungsi yang Dinonaktifkan:**
- Auto-sync data ke server
- Background sync saat online kembali
- Sync queue management
- Conflict resolution

### **Dampak:**
- Data masih bisa disimpan dan diambil dari database
- Tidak ada auto-sync background
- User harus refresh manual untuk melihat data terbaru
- Offline functionality tetap ada (via PWA cache)

---

## ⚙️ Menu Pengaturan (Dinonaktifkan)

### **File Terkait:**
- ⏸️ `src/components/layout/Header.tsx` - User dropdown menu
- ⏸️ `src/components/layout/AppLayout.tsx` - Settings handler

### **Fungsi yang Dinonaktifkan:**
- Menu "Pengaturan" di user dropdown (klik avatar)
- Navigation ke halaman pengaturan per role

### **Alasan:**
- Route `/{role}/pengaturan` tidak dibuat (404 Not Found)
- Fitur settings (ubah password, preferences, dll) tidak termasuk scope proposal
- User masih bisa ubah profil via menu "Profil"

### **Dampak:**
- Menu "Pengaturan" tidak muncul di dropdown user
- Menu "Profil" tetap ada dan berfungsi
- Menu "Logout" tetap ada dan berfungsi
- Tidak ada dampak ke fitur inti

---

## ✅ Fitur yang TETAP AKTIF

### **Core Features (Sesuai Proposal):**

1. **Manajemen Kuis** ✅
   - Dosen: Buat, edit, kelola kuis
   - Mahasiswa: Kerjakan kuis
   - Auto-grading

2. **Penilaian** ✅
   - Input nilai oleh dosen
   - Lihat nilai oleh mahasiswa
   - Permintaan perbaikan nilai

3. **Peminjaman Alat Lab** ✅
   - Request peminjaman
   - Approval oleh laboran
   - Return management
   - Inventory tracking

4. **Jadwal Praktikum** ✅
   - Buat jadwal
   - Lihat jadwal
   - Manajemen kelas

5. **Presensi** ✅
   - QR Code check-in
   - Tracking kehadiran

6. **Materi** ✅
   - Upload materi
   - Download materi

7. **User Management** ✅
   - RBAC (Role-Based Access Control)
   - Admin, Dosen, Laboran, Mahasiswa

8. **PWA Features** ✅
   - Offline capability
   - Install app
   - Service worker

---

## 🔧 Cara Reaktivasi (Jika Diperlukan Nanti)

### **Analytics:**
1. Uncomment route di `src/routes/index.tsx`
2. Uncomment menu di sidebar component
3. Test halaman analytics

### **Sync Manager:**
1. Uncomment initialization di `src/main.tsx`
2. Uncomment sync API calls
3. Test sync functionality

---

## 📝 Catatan

Fitur ini dihapus/dinonaktifkan untuk:
- ✅ Fokus pada scope proposal penelitian
- ✅ Mengurangi kompleksitas sistem
- ✅ Mempercepat development fitur inti
- ✅ Menghindari scope creep

Semua file tetap ada di repository (tidak dihapus permanen), hanya di-disable untuk tidak muncul di aplikasi.

---

## 🎯 Fokus Development Selanjutnya

1. Testing fitur inti (Kuis, Nilai, Peminjaman)
2. Bug fixes
3. UI/UX improvements
4. Dokumentasi user manual
5. Persiapan deployment production
