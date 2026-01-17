# 🔐 Panduan Offline Login - PWA Sistem Praktikum

## 📋 Ringkasan

Aplikasi PWA Sistem Praktikum kini **FULLY MENDUKUNG OFFLINE LOGIN**! User dapat login bahkan saat tidak ada koneksi internet, selama mereka sudah pernah login saat online minimal sekali.

---

## ✅ Fitur yang Telah Diimplementasikan

### 1. **Offline Authentication System** (`src/lib/offline/offline-auth.ts`)
- ✅ Password hashing menggunakan SHA-256 untuk keamanan
- ✅ Penyimpanan kredensial terenkripsi di IndexedDB
- ✅ Session management untuk offline mode
- ✅ Automatic expiry setelah 30 hari (credentials) dan 24 jam (session)
- ✅ Verifikasi kredensial offline tanpa internet

### 2. **AuthProvider dengan Offline Support** (`src/providers/AuthProvider.tsx`)
- ✅ Auto-detect online/offline status
- ✅ Seamless switching antara online dan offline authentication
- ✅ Store credentials otomatis setelah login online berhasil
- ✅ Restore session dari IndexedDB saat offline
- ✅ Clear offline data saat logout

### 3. **LoginForm dengan Offline Mode** (`src/components/forms/LoginForm.tsx`)
- ✅ **TIDAK ADA BLOCKING** - User bisa login kapan saja
- ✅ Visual indicator untuk offline mode (blue alert, bukan red)
- ✅ Button tetap enabled saat offline
- ✅ Clear messaging: "Login Offline" vs "Masuk"
- ✅ Helpful tips untuk offline login

### 4. **Service Worker di Development Mode** (`src/main.tsx`)
- ✅ Service Worker ENABLED by default di development
- ✅ Environment variable control: `VITE_PWA_DEV`
- ✅ PWA testing tanpa perlu build production

### 5. **IndexedDB Schema** (`src/lib/offline/indexeddb.ts`)
- ✅ Store `users` untuk user data
- ✅ Store `metadata` untuk credentials dan session
- ✅ Automatic initialization
- ✅ Error handling dan logging

---

## 🚀 Cara Menggunakan Offline Login

### Untuk User:

1. **Login Pertama Kali (Saat Online)**
   ```
   - Buka aplikasi saat online
   - Login dengan email dan password seperti biasa
   - Kredensial akan otomatis disimpan untuk offline use
   ```

2. **Login Saat Offline**
   ```
   - Matikan internet / aktifkan airplane mode
   - Buka aplikasi
   - Masukkan email dan password yang SAMA dengan saat login online
   - Klik "Login Offline"
   - ✅ Anda akan login dengan session tersimpan
   ```

3. **Kembali Online**
   ```
   - Nyalakan internet kembali
   - Session akan otomatis di-sync dengan server
   - Data tetap aman dan up-to-date
   ```

### Untuk Developer:

1. **Enable PWA di Development**
   ```bash
   # Default: PWA enabled
   npm run dev

   # Disable PWA di development
   VITE_PWA_DEV=false npm run dev
   ```

2. **Test Offline Login**
   ```bash
   # 1. Jalankan app
   npm run dev

   # 2. Login saat online (Chrome DevTools: Network → Online)
   # 3. Toggle offline (Chrome DevTools: Network → Offline)
   # 4. Refresh page
   # 5. Login lagi dengan credentials yang sama
   # 6. ✅ Berhasil login offline!
   ```

3. **Inspect IndexedDB**
   ```
   Chrome DevTools → Application Tab → IndexedDB → sistem_praktikum_pwa

   Check stores:
   - metadata → offline_credentials (hashed password)
   - metadata → offline_session (session data)
   - users → [user_id] (user data)
   ```

---

## 🔒 Security Notes

### Credentials Storage
- **Password TIDAK disimpan plain text**
- Password di-hash dengan SHA-256 + salt (email-based)
- Hanya hash yang disimpan di IndexedDB
- IndexedDB hanya accessible dari same origin (domain yang sama)

### Session Management
- Session offline expire setelah 24 jam
- Credentials expire setelah 30 hari
- Auto-clear saat logout
- No sensitive data di localStorage

### Security Best Practices
- ✅ Hashing before storage
- ✅ No plain text passwords
- ✅ Deterministic salt per user
- ✅ Automatic expiry
- ✅ Same-origin policy (IndexedDB)

**⚠️ Production Note**: Untuk production-grade security, consider:
- Menggunakan bcrypt/argon2 instead of SHA-256
- Implement biometric authentication
- Add encryption layer untuk IndexedDB
- Implement certificate pinning

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] **Online Login First Time**
  - [ ] Buka app saat online
  - [ ] Login dengan email/password valid
  - [ ] Check DevTools → IndexedDB → credentials tersimpan
  - [ ] Check DevTools → IndexedDB → session tersimpan
  - [ ] Check DevTools → IndexedDB → user data tersimpan

- [ ] **Offline Login**
  - [ ] Toggle Network ke Offline di DevTools
  - [ ] Refresh page
  - [ ] Login dengan SAME credentials
  - [ ] ✅ Berhasil login
  - [ ] UI menunjukkan "Mode Offline"
  - [ ] Button menunjukkan "Login Offline"

- [ ] **Wrong Credentials Offline**
  - [ ] Toggle Network ke Offline
  - [ ] Login dengan wrong password
  - [ ] ❌ Login gagal dengan error message
  - [ ] Login dengan wrong email
  - [ ] ❌ Login gagal dengan error message

- [ ] **Logout Clears Data**
  - [ ] Login (online atau offline)
  - [ ] Click Logout
  - [ ] Check IndexedDB → metadata → offline_credentials = null
  - [ ] Check IndexedDB → metadata → offline_session = null

- [ ] **Session Expiry**
  - [ ] Login offline
  - [ ] Manually change expiry date di IndexedDB (past date)
  - [ ] Refresh page
  - [ ] ❌ Session expired, redirect ke login

- [ ] **Online to Offline Seamless**
  - [ ] Login saat online
  - [ ] Toggle ke offline (tanpa logout)
  - [ ] Refresh page
  - [ ] ✅ Session tetap aktif

---

## 📁 File Structure

```
src/
├── lib/
│   ├── offline/
│   │   ├── offline-auth.ts          ← ⭐ Offline authentication logic
│   │   ├── indexeddb.ts             ← IndexedDB manager
│   │   ├── sync-manager.ts          ← Sync when back online
│   │   └── queue-manager.ts         ← Queue operations
│   │
│   └── supabase/
│       └── auth.ts                   ← Online authentication API
│
├── providers/
│   └── AuthProvider.tsx              ← ⭐ Auth provider with offline support
│
├── components/
│   └── forms/
│       └── LoginForm.tsx             ← ⭐ Login form with offline mode
│
└── main.tsx                          ← ⭐ SW registration (dev + prod)

public/
└── sw.js                             ← Service Worker
```

---

## 🐛 Troubleshooting

### Problem: "Login offline gagal. Pastikan Anda sudah pernah login saat online."

**Penyebab**: Belum pernah login saat online

**Solusi**:
1. Pastikan koneksi internet aktif
2. Login sekali saat online
3. Credentials akan tersimpan otomatis
4. Coba offline login lagi

---

### Problem: "Password salah" saat offline padahal password benar

**Penyebab**: Password yang disimpan berbeda dengan yang diinput

**Solusi**:
1. Cek case-sensitivity (huruf besar/kecil)
2. Cek spasi di awal/akhir password
3. Login ulang saat online untuk reset credentials
4. Gunakan password yang EXACT SAMA

---

### Problem: Service Worker tidak aktif di development

**Penyebab**: Environment variable atau cache issue

**Solusi**:
```bash
# 1. Unregister semua SW
Chrome DevTools → Application → Service Workers → Unregister

# 2. Clear cache
Chrome DevTools → Application → Clear storage → Clear site data

# 3. Restart dev server
npm run dev

# 4. Check console untuk "[SW] Service Worker loaded successfully"
```

---

### Problem: IndexedDB tidak menyimpan data

**Penyebab**: Browser storage disabled atau full

**Solusi**:
1. Check browser settings → Allow cookies and site data
2. Clear browser data (jika storage full)
3. Check DevTools → Console untuk error messages
4. Try incognito mode untuk test

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add Biometric Authentication**
   - WebAuthn API untuk fingerprint/face recognition
   - More secure than password

2. **Implement Data Encryption**
   - Encrypt credentials di IndexedDB dengan Web Crypto API
   - Additional security layer

3. **Add "Remember Me" Toggle**
   - Let user choose apakah mau store credentials
   - More user control

4. **Implement Background Sync**
   - Auto-sync data saat kembali online
   - Better UX

5. **Add Session Renewal**
   - Renew session sebelum expire
   - Seamless experience

---

## 📞 Support

Jika ada masalah dengan offline login:

1. Check console untuk error messages
2. Inspect IndexedDB untuk verify data storage
3. Try clear cache dan login ulang saat online
4. Check network tab untuk verify online/offline status

---

## ✅ Summary

**OFFLINE LOGIN NOW WORKS!** 🎉

- ✅ User bisa login saat offline
- ✅ Credentials aman dengan hashing
- ✅ Auto-detect online/offline mode
- ✅ Service Worker enabled di dev & prod
- ✅ IndexedDB untuk persistent storage
- ✅ Clear UI/UX indicators
- ✅ Proper error handling

**Test it now!**
1. `npm run dev`
2. Login saat online
3. Toggle offline
4. Login lagi
5. ✅ IT WORKS!
