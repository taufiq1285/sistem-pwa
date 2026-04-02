# Tambah Menu Mata Kuliah untuk Admin

## File: `src/config/navigation.config.ts`

### STEP 1: Tambahkan import BookOpen icon

Di line 9-24, tambahkan `BookOpen` ke import:

```typescript
import {
  Home,
  Calendar,
  ClipboardList,
  Award,
  Users,
  FileText,
  Settings,
  Package,
  BarChart3,
  ClipboardCheck,
  Building2,
  UserCog,
  Boxes,
  BookOpen,  // ✅ TAMBAHKAN INI
  type LucideIcon
} from 'lucide-react';
```

### STEP 2: Tambahkan menu Mata Kuliah di admin navigation

Di sekitar line 151, **GANTI** comment ini:

```typescript
// ❌ REMOVED: Mata Kuliah (system focuses on praktikum, not courses)
```

**DENGAN** menu item ini:

```typescript
{
  label: 'Mata Kuliah',
  href: '/admin/mata-kuliah',
  icon: BookOpen,
  description: 'Kelola mata kuliah'
},
```

### HASIL AKHIR (line 140-160):

```typescript
const adminNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: Home,
    description: 'Ringkasan sistem'
  },
  {
    label: 'User Management',
    href: '/admin/users',
    icon: UserCog,
    description: 'Kelola pengguna'
  },
  {
    label: 'Mata Kuliah',           // ✅ TAMBAHKAN menu ini
    href: '/admin/mata-kuliah',     // ✅
    icon: BookOpen,                  // ✅
    description: 'Kelola mata kuliah' // ✅
  },
  {
    label: 'Kelas',
    href: '/admin/kelas',
    icon: Users,
    description: 'Kelola kelas'
  },
  {
    label: 'Laboratorium',
    href: '/admin/laboratorium',
    icon: Building2,
    description: 'Kelola laboratorium'
  },
  // ... dst
];
```

---

## ✅ Setelah Update:

1. **Save file**
2. **Refresh browser** (atau restart dev server)
3. **Login sebagai admin**
4. **Menu "Mata Kuliah" akan muncul** di sidebar
5. **Klik menu** → Bisa tambah/edit/hapus mata kuliah
6. **Dosen bisa buat kelas** untuk kuis setelah ada mata kuliah

---

## 🎯 Kenapa Perlu?

- Kuis membutuhkan **Kelas**
- Kelas membutuhkan **Mata Kuliah**
- Jadi admin harus input Mata Kuliah dulu!
