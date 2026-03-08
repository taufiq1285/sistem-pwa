# Panduan Integrasi: Custom Components + shadcn/ui

## ✅ Tidak Ada Masalah Menggunakan Keduanya!

Komponen-komponen baru yang kita buat adalah **komplemen** yang sempurna untuk shadcn/ui yang sudah ada, bukan pengganti.

---

## 🎯 Konsep Integrasi

### 1. shadcn/ui = Foundation
- Menyediakan **primitives** (Button, Card, Dialog, dll)
- Sudah accessible dan well-tested
- Styling konsisten dengan Tailwind CSS

### 2. Custom Components = Ekstensi
- **Menggunakan** shadcn/ui sebagai base
- Menambahkan **business logic** dan **domain-specific** features
- **Enhanced animations** dan **app-specific** styling

---

## 🏗️ Struktur Folder yang Direkomendasikan

```
src/components/ui/
├── button.tsx              # shadcn/ui (existing)
├── card.tsx                # shadcn/ui (existing)
├── dialog.tsx              # shadcn/ui (existing)
├── badge.tsx               # shadcn/ui (existing)
├── input.tsx               # shadcn/ui (existing)
├── select.tsx              # shadcn/ui (existing)
├── table.tsx               # shadcn/ui (existing)
├── tabs.tsx                # shadcn/ui (existing)
├── ...                     # komponen shadcn/ui lainnya
│
├── glass-card.tsx          # custom (baru) - extends Card
├── animated-counter.tsx    # custom (baru) - standalone
├── status-badge.tsx        # custom (baru) - extends Badge
├── stepper.tsx            # custom (baru) - standalone
├── dashboard-card.tsx      # custom (baru) - uses Card
├── dashboard-skeleton.tsx  # custom (baru) - uses Skeleton
└── button-enhanced.tsx     # custom (baru) - extends Button
```

---

## 💻 Contoh Integrasi

### 1. DashboardCard Menggunakan Card dari shadcn/ui

```tsx
// src/components/ui/dashboard-card.tsx
import { Card, CardContent } from "@/components/ui/card";  // shadcn/ui
import { AnimatedCounter } from "./animated-counter";     // custom
import { cn } from "@/lib/utils";

export function DashboardCard({ title, value, icon: Icon }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">  {/* shadcn Card */}
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <AnimatedCounter value={value} className="text-3xl font-bold" />
          </div>
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. StatusBadge Menggunakan Badge dari shadcn/ui

```tsx
// src/components/ui/status-badge.tsx
import { Badge } from "@/components/ui/badge";  // shadcn/ui
import { cn } from "@/lib/utils";

export function StatusBadge({ status, children }) {
  return (
    <Badge variant="outline" className="relative pl-6">  {/* shadcn Badge */}
      <span className="absolute left-2 flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {children}
    </Badge>
  );
}
```

### 3. ButtonEnhanced Menggunakan Button dari shadcn/ui

```tsx
// src/components/ui/button-enhanced.tsx
import { Button } from "@/components/ui/button";  // shadcn/ui
import { Loader2 } from "lucide-react";

export function ButtonEnhanced({ loading, children, ...props }) {
  return (
    <Button disabled={loading} {...props}>  {/* shadcn Button */}
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}
```

---

## 🎨 Update CSS Variables untuk Tema Baru

Tambahkan di `src/index.css` (tanpa menghapus yang sudah ada):

```css
:root {
  /* Warna baru - mengganti yang sudah ada */
  --primary: oklch(0.34 0.17 263);      /* Deep Blue */
  --accent: oklch(0.83 0.11 82);        /* Warm Gold */
  --success: oklch(0.72 0.13 167);     /* Green */
  --warning: oklch(0.83 0.11 82);      /* Amber */
  --destructive: oklch(0.6 0.22 24);   /* Red */
  
  /* Tambahan untuk custom components */
  --glass-bg: rgba(255, 255, 255, 0.6);
  --glass-border: rgba(255, 255, 255, 0.2);
}

.dark {
  --glass-bg: rgba(0, 0, 0, 0.4);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

---

## 📦 Update index.ts untuk Export

```typescript
// src/components/ui/index.ts

// Re-export shadcn/ui components (existing)
export * from "./button";
export * from "./card";
export * from "./dialog";
export * from "./badge";
export * from "./input";
export * from "./select";
export * from "./table";
export * from "./tabs";
// ... semua komponen shadcn/ui

// Export custom components (baru)
export * from "./glass-card";
export * from "./animated-counter";
export * from "./status-badge";
export * from "./stepper";
export * from "./dashboard-card";
export * from "./dashboard-skeleton";
export * from "./button-enhanced";
```

---

## ✅ Keuntungan Menggunakan Keduanya

| Aspek | shadcn/ui | Custom Components |
|-------|-----------|-------------------|
| **Foundation** | ✅ Primitives | ✅ Business logic |
| **Accessibility** | ✅ Built-in | ✅ Inherits from base |
| **Testing** | ✅ Well-tested | ✅ App-specific tests |
| **Styling** | ✅ Consistent | ✅ Enhanced animations |
| **Maintenance** | ✅ Community | ✅ Full control |

---

## 🚀 Cara Penggunaan di Page

```tsx
// src/pages/dosen/DashboardPage.tsx
import { 
  Card,           // shadcn/ui
  Button,         // shadcn/ui
  Badge,          // shadcn/ui
} from "@/components/ui";

import {
  DashboardCard,      // custom
  StatusBadge,        // custom
  AnimatedCounter,    // custom
  ButtonEnhanced,     // custom
} from "@/components/ui";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Menggunakan custom component */}
      <div className="grid grid-cols-4 gap-4">
        <DashboardCard title="Mahasiswa" value={1234} icon={Users} />
        <DashboardCard title="Kelas" value={42} icon={BookOpen} />
      </div>
      
      {/* Menggunakan shadcn/ui langsung */}
      <Card>
        <CardHeader>
          <CardTitle>Data Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusBadge status="success">Aktif</StatusBadge>
          <ButtonEnhanced loading={isLoading}>
            Simpan
          </ButtonEnhanced>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📝 Checklist Integrasi

- [ ] Copy komponen custom ke `src/components/ui/`
- [ ] Update `src/components/ui/index.ts` untuk export
- [ ] Update CSS variables di `src/index.css`
- [ ] Test import di salah satu page
- [ ] Verifikasi dark mode berfungsi
- [ ] Verifikasi semua komponen shadcn/ui masih berfungsi

---

## ❓ FAQ

### Q: Apakah custom component akan mengganggu shadcn/ui?
**A:** Tidak! Custom component menggunakan shadcn/ui sebagai base, jadi justru saling melengkapi.

### Q: Bagaimana jika ada nama yang sama?
**A:** Pastikan nama custom component berbeda atau gunakan alias saat import.

### Q: Apakah perlu reinstall shadcn/ui?
**A:** Tidak perlu, shadcn/ui yang sudah ada tetap berfungsi normal.

### Q: Bagaimana dengan update shadcn/ui di masa depan?
**A:** Custom component tidak terpengaruh karena menggunakan import yang jelas.

---

## 🎉 Kesimpulan

**Tidak ada masalah** menggunakan custom components bersama shadcn/ui! Justru ini adalah **best practice**:

1. **shadcn/ui** = Foundation yang solid
2. **Custom components** = Ekstensi untuk kebutuhan spesifik aplikasi
3. **Integrasi** = Seamless dan saling melengkapi

Selamat mengembangkan! 🚀
