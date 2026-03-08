# Panduan Implementasi Praktis - Contoh di Halaman yang Sudah Ada

Panduan ini menunjukkan cara menerapkan tema baru dan komponen custom di halaman-halaman yang sudah ada tanpa merusak fungsionalitas.

---

## 🎯 Contoh 1: LoginPage - Upgrade Visual

### Sebelum (Kode yang Sudah Ada)

```tsx
// pages/auth/LoginPage.tsx - VERSI LAMA
<div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/70">
  <div className="w-full max-w-md">
    <Card>
      <CardHeader className="bg-linear-to-br from-blue-800 via-blue-700 to-indigo-700">
        <Stethoscope className="h-12 w-12 text-white" />
        <h1 className="text-2xl font-black text-white">Selamat Datang</h1>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  </div>
</div>
```

### Setelah (Dengan Tema Baru)

```tsx
// pages/auth/LoginPage.tsx - VERSI BARU (TETAP BERFUNGSI SAMA)
<div className="min-h-screen bg-linear-to-br from-background via-muted to-primary/5">
  {/* Glassmorphism background orbs */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
  </div>
  
  <div className="w-full max-w-md relative z-10">
    {/* Gunakan GlassCard untuk efek modern */}
    <GlassCard intensity="high" className="overflow-hidden">
      <CardHeader className="bg-linear-to-br from-primary via-primary/90 to-accent/80">
        <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl inline-block">
          <Stethoscope className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">Selamat Datang</h1>
      </CardHeader>
      <CardContent className="p-6">
        <LoginForm />
      </CardContent>
    </GlassCard>
  </div>
</div>
```

**Perubahan:**
- Background: Dari warna hardcoded → CSS variables
- Card: Bisa pakai GlassCard atau tetap Card biasa
- Gradient: Menggunakan primary dan accent variables
- **Fungsionalitas tetap sama!**

---

## 🎯 Contoh 2: DashboardPage - Stats Cards

### Sebelum

```tsx
// pages/dosen/DashboardPage.tsx - VERSI LAMA
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Mahasiswa</p>
          <p className="text-3xl font-bold">{stats.totalMahasiswa}</p>
        </div>
        <Users className="h-6 w-6 text-blue-500" />
      </div>
    </CardContent>
  </Card>
  {/* ... card lainnya ... */}
</div>
```

### Setelah (Dengan DashboardCard)

```tsx
// pages/dosen/DashboardPage.tsx - VERSI BARU
import { DashboardCard } from "@/components/ui/dashboard-card";

<div className="grid grid-cols-4 gap-4">
  <DashboardCard
    title="Total Mahasiswa"
    value={stats.totalMahasiswa}
    icon={Users}
    color="blue"
    trend={{ value: 12, isPositive: true }}
  />
  <DashboardCard
    title="Total Kelas"
    value={stats.totalKelas}
    icon={BookOpen}
    color="green"
  />
  <DashboardCard
    title="Jadwal Aktif"
    value={stats.jadwalAktif}
    icon={Calendar}
    color="amber"
  />
  <DashboardCard
    title="Rata-rata Nilai"
    value={stats.rataNilai}
    icon={Award}
    color="purple"
  />
</div>
```

**Keuntungan:**
- Animated counter otomatis
- Trend indicator
- Hover effects
- Konsisten styling
- **Data dan logic tetap sama!**

---

## 🎯 Contoh 3: Status Indicators

### Sebelum

```tsx
// VERSI LAMA - Badge biasa
<Badge variant="outline">Aktif</Badge>
<Badge variant="destructive">Nonaktif</Badge>
```

### Setelah (Dengan StatusBadge)

```tsx
// VERSI BARU - StatusBadge dengan animasi
import { StatusBadge } from "@/components/ui/status-badge";

<StatusBadge status="success">Aktif</StatusBadge>
<StatusBadge status="error" pulse={false}>Nonaktif</StatusBadge>
<StatusBadge status="warning">Menunggu</StatusBadge>
<StatusBadge status="info">Draft</StatusBadge>
```

**Keuntungan:**
- Warna konsisten (success=green, error=red, etc.)
- Animasi pulse untuk live status
- Icon otomatis
- **Cukup ganti komponen, logic tetap!**

---

## 🎯 Contoh 4: Loading States

### Sebelum

```tsx
// VERSI LAMA - Text loading
if (loading) {
  return <div>Loading...</div>;
}
```

### Setelah (Dengan Skeleton)

```tsx
// VERSI BARU - DashboardSkeleton
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

if (loading) {
  return <DashboardSkeleton />;
}
```

**Keuntungan:**
- Shimmer effect
- Layout yang sama dengan data asli
- Better UX
- **Ganti 1 baris saja!**

---

## 🎯 Contoh 5: Form dengan Stepper

### Sebelum

```tsx
// VERSI LAMA - Form biasa
<Form>
  <FormField>...</FormField>
  <FormField>...</FormField>
  <Button type="submit">Submit</Button>
</Form>
```

### Setelah (Dengan Stepper)

```tsx
// VERSI BARU - Multi-step form
import { Stepper } from "@/components/ui/stepper";

const steps = [
  { id: "1", label: "Data Diri", description: "Informasi pribadi" },
  { id: "2", label: "Akademik", description: "Data akademik" },
  { id: "3", label: "Konfirmasi", description: "Verifikasi data" },
];

<div>
  <Stepper steps={steps} currentStep={currentStep} className="mb-8" />
  
  {currentStep === 0 && <DataDiriForm />}
  {currentStep === 1 && <AkademikForm />}
  {currentStep === 2 && <KonfirmasiForm />}
  
  <div className="flex justify-between mt-6">
    <Button
      variant="outline"
      onClick={() => setCurrentStep((prev) => prev - 1)}
      disabled={currentStep === 0}
    >
      Kembali
    </Button>
    <Button
      onClick={() => setCurrentStep((prev) => prev + 1)}
      disabled={currentStep === steps.length - 1}
    >
      {currentStep === steps.length - 1 ? "Selesai" : "Lanjut"}
    </Button>
  </div>
</div>
```

---

## 🎯 Contoh 6: Toast Notifications

### Sebelum

```tsx
// VERSI LAMA - Alert manual
const handleSave = async () => {
  try {
    await saveData();
    alert("Data berhasil disimpan");
  } catch (error) {
    alert("Gagal menyimpan data");
  }
};
```

### Setelah (Dengan toastConfig)

```tsx
// VERSI BARU - Toast notifications
import { toastConfig } from "@/lib/toast-config";

const handleSave = async () => {
  try {
    await saveData();
    toastConfig.success("Data berhasil disimpan", "Perubahan telah tersimpan");
  } catch (error) {
    toastConfig.error("Gagal menyimpan data", "Silakan coba lagi");
  }
};

// Atau dengan promise
const handleSave = () => {
  toastConfig.promise(saveData(), {
    loading: "Menyimpan data...",
    success: "Data berhasil disimpan",
    error: "Gagal menyimpan data",
  });
};
```

---

## 🎯 Contoh 7: Animasi Scroll

### Sebelum

```tsx
// VERSI LAMA - Muncul langsung
<div className="grid grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

### Setelah (Dengan useIntersectionAnimation)

```tsx
// VERSI BARU - Fade in on scroll
import { useIntersectionAnimation } from "@/lib/hooks/use-animation";
import { cn } from "@/lib/utils";

function FadeInCard({ item }) {
  const { ref, isVisible } = useIntersectionAnimation();

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <Card>{item.content}</Card>
    </div>
  );
}

<div className="grid grid-cols-3 gap-4">
  {items.map((item) => (
    <FadeInCard key={item.id} item={item} />
  ))}
</div>
```

---

## 🎯 Contoh 8: Button dengan Loading State

### Sebelum

```tsx
// VERSI LAMA - Button biasa
<Button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

### Setelah (Dengan ButtonEnhanced)

```tsx
// VERSI BARU - Button dengan loading state
import { ButtonEnhanced } from "@/components/ui/button-enhanced";

<ButtonEnhanced
  onClick={handleSubmit}
  loading={isLoading}
  loadingText="Menyimpan..."
>
  Submit
</ButtonEnhanced>
```

**Keuntungan:**
- Loading spinner otomatis
- Disabled otomatis saat loading
- Text berubah saat loading
- **Props sama, lebih powerful!**

---

## 🎯 Contoh 9: Counter Animasi

### Sebelum

```tsx
// VERSI LAMA - Angka statis
<div className="text-3xl font-bold">{totalMahasiswa}</div>
```

### Setelah (Dengan AnimatedCounter)

```tsx
// VERSI BARU - Angka animasi
import { AnimatedCounter } from "@/components/ui/animated-counter";

<AnimatedCounter
  value={totalMahasiswa}
  className="text-3xl font-bold"
  duration={1500}
/>
```

**Keuntungan:**
- Animasi counting smooth
- Format number otomatis
- Customizable duration
- **Ganti 1 komponen saja!**

---

## 🎯 Contoh 10: Glassmorphism Cards

### Sebelum

```tsx
// VERSI LAMA - Card biasa
<Card className="p-6">
  <h3>Feature Title</h3>
  <p>Feature description</p>
</Card>
```

### Setelah (Dengan GlassCard)

```tsx
// VERSI BARU - Glassmorphism effect
import { GlassCard } from "@/components/ui/glass-card";

<GlassCard intensity="medium" className="p-6">
  <h3 className="text-lg font-semibold">Feature Title</h3>
  <p className="text-muted-foreground">Feature description</p>
</GlassCard>
```

**Keuntungan:**
- Backdrop blur effect
- Modern glassmorphism look
- Hover animation
- **Drop-in replacement!**

---

## ✅ Checklist Implementasi per Halaman

### Untuk Setiap Halaman:

- [ ] Import komponen baru yang diperlukan
- [ ] Ganti bagian yang ingin diupgrade (tidak semua harus diganti)
- [ ] Test fungsionalitas tetap berjalan
- [ ] Verifikasi responsive masih OK
- [ ] Cek dark mode berfungsi

### Prioritas Upgrade:

1. **High Impact**: Dashboard stats, Login page, Landing page
2. **Medium Impact**: Form pages, List pages
3. **Low Impact**: Detail pages, Settings pages

---

## 🎨 Tips Migrasi Bertahap

### Minggu 1: CSS Variables Only
- Update warna di `index.css`
- Semua halaman otomatis dapat warna baru
- Zero code changes

### Minggu 2: Dashboard & Landing
- Upgrade halaman utama
- Implementasi DashboardCard
- Tambah animated counters

### Minggu 3: Forms & Lists
- Upgrade form pages dengan stepper
- Tambah loading skeletons
- Implementasi status badges

### Mingku 4: Polish
- Tambah micro-interactions
- Implementasi scroll animations
- Final testing

---

## 🚀 Kesimpulan

Setiap contoh di atas menunjukkan bahwa:

1. **Kode lama tetap berfungsi** - Tidak ada breaking changes
2. **Upgrade adalah opt-in** - Pilih bagian yang mau diupgrade
3. **Ganti 1 komponen saja** - Tidak perlu rewrite seluruh halaman
4. **Data & logic tetap sama** - Hanya UI yang berubah
5. **Rollback mudah** - Hapus import baru kalau ada masalah

Selamat mengupgrade UI! 🎨✨
