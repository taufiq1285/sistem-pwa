# Deployment Guide - Vercel

Panduan lengkap untuk deploy **Sistem Praktikum PWA** ke Vercel.

---

## Prasyarat

- Akun GitHub (dengan repository ini)
- Akun Vercel (gratis)
- Project sudah ter-commit ke GitHub

---

## Metode 1: Deploy via Vercel Dashboard (Paling Mudah)

### 1. Push ke GitHub (jika belum)

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy di Vercel

1. Buka [vercel.com](https://vercel.com)
2. Login dengan GitHub
3. Klik **"Add New Project"**
4. Import repository `sistem-praktikum-pwa`
5. Konfigurasi:

   **Framework Preset:** Vite

   **Build Command:** `npm run build`

   **Output Directory:** `dist`

   **Install Command:** `npm install`

### 3. Environment Variables

Tambahkan environment variables di Vercel Dashboard:

```
VITE_SUPABASE_URL=https://rkyoifqbfcztnhevpnpx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (paste full key)
VITE_APP_NAME=Sistem Praktikum PWA
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

### 4. Deploy

Klik **"Deploy"** dan tunggu beberapa detik. Aplikasi akan live di:
- `https://sistem-praktikum-pwa.vercel.app`

---

## Metode 2: Deploy via Vercel CLI

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Deploy

```bash
# Deploy ke preview URL
vercel

# Deploy ke production
vercel --prod
```

---

## Konfigurasi PWA

Service Worker dan manifest sudah terkonfigurasi otomatis di `vercel.json`:

- ✅ SPA Routing (semua route redirect ke index.html)
- ✅ Service Worker headers (no-cache untuk sw.js)
- ✅ Cache headers untuk assets (1 tahun)
- ✅ Security headers (X-Frame-Options, X-XSS-Protection)

---

## Setelah Deployment

### 1. Test PWA Installation

Buka aplikasi di browser:
- **Chrome:** Install icon akan muncul di address bar
- **iOS Safari:** Share > Add to Home Screen
- **Android:** Browser akan prompt install

### 2. Test Offline Mode

1. Buka DevTools > Application > Service Workers
2. Cek "Offline" checkbox
3. Refresh halaman - aplikasi harus tetap jalan dengan cached data

### 3. Test Network Detection

Buka Console dan cek:
- ✅ Tidak ada error 401 dari network detector
- ✅ Status "online" saat ada koneksi
- ✅ Status "offline" saat tidak ada koneksi

---

## Custom Domain (Opsional)

### 1. Di Vercel Dashboard

1. Buka project settings
2. Go to **Domains**
3. Add custom domain (misal: `praktikum.akmb.ac.id`)

### 2. Configure DNS

Tambahkan CNAME record di DNS provider:

```
Type: CNAME
Name: praktikum
Value: cname.vercel-dns.com
```

---

## Troubleshooting

### Service Worker tidak terupdate

```bash
# Clear cache dan rebuild
npm run clean
npm run build
vercel --prod
```

### Environment variables tidak terbaca

- Pastikan variable diawali dengan `VITE_` (Vite requirement)
- Redeploy setelah menambah environment variables

### PWA tidak bisa diinstall

- Pastikan site sudah HTTPS (Vercel otomatis)
- Cek manifest.webmanifest di Application tab
- Pastikan icons ada di folder `/public/icons/`

### Offline mode tidak jalan

- Pastikan service worker registered: DevTools > Application > Service Workers
- Cek network status di console
- Clear browser cache dan reload

---

## Monitoring

### Vercel Analytics

Aktifkan di Dashboard > Analytics untuk tracking:
- Page views
- Unique visitors
- Core Web Vitals (LCP, FID, CLS)

### Supabase Logs

Monitoring di Supabase Dashboard:
- Database logs
- Auth logs
- Storage logs

---

## Update Deployment

Setiap push ke branch `main` akan otomatis trigger redeploy:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel akan otomatis build dan deploy.

---

## Cost

- **Vercel:** Gratis untuk penggunaan personal (Hobby plan)
  - 100GB bandwidth per bulan
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN

- **Supabase:** Gratis tier (guna saat ini cukup)
  - 500MB database
  - 1GB storage
  - 2GB bandwidth per bulan

---

## Support

Jika ada masalah:
1. Cek Vercel deployment logs
2. Cek browser console untuk errors
3. Test di local: `npm run build && npm run preview`

---

**Selamat! PWA Sistem Praktikum sudah siap di-deploy! 🚀**
