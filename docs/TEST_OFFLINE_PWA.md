# Test PWA Offline Functionality

## ⚠️ PENTING: Dev Server vs Production

**Dev Server (`npm run dev`):**

- ❌ TIDAK support offline mode
- ❌ Memerlukan HMR/WebSocket connection
- ❌ Vite client harus terkoneksi
- ✅ Hanya untuk development

**Production Build:**

- ✅ FULL offline support
- ✅ Service Worker caching
- ✅ Background sync
- ✅ Offline fallback

---

## 📋 Cara Test Offline dengan Benar

### Step 1: Build Production

```bash
npm run build
```

### Step 2: Preview Production Build

```bash
npm run preview
```

Ini akan serve production build di `http://localhost:4173` (bukan 5173)

### Step 3: Test Offline Mode

1. Buka `http://localhost:4173` di browser
2. Login ke aplikasi
3. **Buka DevTools** (F12)
4. Tab **Application** → **Service Workers**
5. Verify SW status: ✅ **Activated**
6. Tab **Network** → Centang **Offline**
7. Refresh browser (F5)
8. ✅ **Aplikasi harus tetap jalan!**

---

## 🧪 Test Cases Offline

### 1. **Navigation Test**

- Offline → klik menu sidebar
- Semua page cached harus bisa dibuka

### 2. **Data Test**

- Offline → lihat data yang sudah di-load
- Data harus tersimpan di IndexedDB

### 3. **Form Submission Test**

- Offline → coba submit form (buat kuis, dll)
- Data harus masuk queue untuk sync nanti

### 4. **Background Sync Test**

- Offline → submit form
- Online kembali → data auto sync

---

## 🐛 Troubleshooting

### Error: "ERR_INTERNET_DISCONNECTED" di Dev Mode

**Normal!** Dev server butuh koneksi. Gunakan production build.

### Service Worker tidak aktif

```bash
# Clear cache & rebuild
npm run build
npm run preview
# Hard refresh: Ctrl+Shift+R
```

### Data tidak tersimpan offline

- Check IndexedDB di DevTools → Application tab
- Verify data di-sync saat online

---

## ✅ Expected Behavior

**Development Mode:**

```
Online: ✅ Works (with HMR)
Offline: ❌ Fails (ERR_INTERNET_DISCONNECTED)
```

**Production Mode:**

```
Online: ✅ Works
Offline: ✅ Works (from cache + IndexedDB)
```
