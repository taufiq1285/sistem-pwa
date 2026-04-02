# Sistem Praktikum PWA

Progressive Web Application (PWA) untuk manajemen praktikum laboratorium kebidanan.

## 🎯 Fitur Utama

### Untuk Mahasiswa
- 📝 Mengikuti kuis online/offline
- 📚 Akses materi praktikum
- 📋 Lihat jadwal praktikum
- ✅ Presensi kehadiran
- 📊 Lihat nilai dan progress
- 🔔 Notifikasi pengumuman

### Untuk Dosen
- ➕ Buat dan kelola kuis
- 📊 Kelola nilai mahasiswa
- 📅 Atur jadwal praktikum
- 👥 Monitor kehadiran
- 📤 Upload materi
- 🏆 Evaluasi hasil praktikum

### Untuk Laboran
- 🏥 Kelola inventaris laboratorium
- 📦 Persetujuan peminjaman alat
- 📈 Laporan penggunaan lab
- 🔧 Maintenance tracking

### Untuk Admin
- 👤 Manajemen user
- 🏫 Kelola kelas & mata kuliah
- 📊 Analytics & reporting
- ⚙️ Konfigurasi sistem

## 🚀 Teknologi

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Navigation
- **Zustand** - State management

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage
  - Row Level Security (RLS)

### PWA Features
- **Service Worker** - Offline support
- **IndexedDB** - Local storage
- **Background Sync** - Auto sync when online
- **Push Notifications** - Real-time alerts
- **Installable** - Add to home screen

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **MSW** - API mocking

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd sistem-praktikum-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` dan isi dengan credentials Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Aplikasi akan berjalan di `http://localhost:5173`

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
npm test             # Run tests
```

## 📁 Project Structure

```
sistem-praktikum-pwa/
├── public/              # Static assets
│   ├── manifest.json    # PWA manifest
│   ├── sw.js           # Service Worker
│   └── icons/          # PWA icons
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # Base UI components (shadcn)
│   │   ├── features/  # Feature-specific components
│   │   └── layout/    # Layout components
│   ├── pages/         # Page components
│   │   ├── admin/     # Admin pages
│   │   ├── dosen/     # Dosen pages
│   │   ├── laboran/   # Laboran pages
│   │   └── mahasiswa/ # Mahasiswa pages
│   ├── lib/           # Utilities & helpers
│   │   ├── api/       # API functions
│   │   ├── hooks/     # Custom React hooks
│   │   ├── offline/   # Offline/sync logic
│   │   ├── pwa/       # PWA utilities
│   │   └── supabase/  # Supabase client
│   ├── types/         # TypeScript types
│   ├── context/       # React contexts
│   ├── providers/     # React providers
│   ├── routes/        # Routing config
│   └── main.tsx       # Entry point
├── .env.example       # Environment template
├── package.json       # Dependencies
├── vite.config.ts     # Vite config
├── tsconfig.json      # TypeScript config
└── README.md          # This file
```

## 🔐 Authentication & Roles

Aplikasi menggunakan Supabase Authentication dengan 4 role:

1. **Mahasiswa** - Student users
2. **Dosen** - Lecturer/faculty
3. **Laboran** - Lab technician
4. **Admin** - System administrator

Role-based access control (RBAC) diterapkan di level:
- Route protection (frontend)
- Row Level Security (database)
- API endpoints

## 🌐 PWA Features

### Offline Support
- ✅ Bekerja tanpa koneksi internet
- ✅ Auto-sync saat online kembali
- ✅ Cache materi & kuis
- ✅ Offline queue untuk operasi

### Installation
- ✅ Bisa diinstall sebagai app
- ✅ Standalone mode
- ✅ Custom splash screen
- ✅ App-like experience

### Performance
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Image optimization
- ✅ Service Worker caching

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📊 Build & Deployment

### Production Build
```bash
npm run build
```

Build output akan ada di folder `dist/`

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## 🔧 Configuration

### Supabase Setup
1. Create project di [Supabase](https://supabase.com)
2. Run database migrations (jika ada)
3. Setup Row Level Security policies
4. Copy API credentials ke `.env.local`

### Environment Variables
```env
# Required
VITE_SUPABASE_URL=          # Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Supabase anon key

# Optional
VITE_APP_NAME=              # App name
VITE_APP_VERSION=           # App version
VITE_APP_ENV=               # Environment (development/production)
```

## 📝 Code Quality

- **TypeScript** - 100% type coverage
- **ESLint** - 0 errors, warnings only
- **Build** - No TypeScript errors
- **Tests** - Comprehensive test coverage

### Quality Metrics
- ✅ 0 TypeScript compilation errors
- ✅ 0 ESLint blocking errors
- ✅ Production build ready
- ⚠️ 222 ESLint warnings (non-blocking)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

[Specify your license here]

## 👥 Team

[Add your team information]

## 📞 Support

For issues and questions:
- Create an issue in GitHub
- Contact: [your-contact-info]

---

**Built with ❤️ using React + TypeScript + Supabase**
