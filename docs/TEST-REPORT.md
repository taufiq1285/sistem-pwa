# Laporan Hasil `npm run test`
## Sistem Praktikum PWA

**Tanggal**: 2026-02-27  
**Perintah**: `npm run test`  
**Runner**: Vitest (`v3.2.4`)

---

## Ringkasan Eksekusi Terbaru

| Metrik | Hasil |
|---|---|
| Status | ✅ Sukses (semua test lulus) |
| Test Files | 131 passed (total 131) |
| Total Tests | 4382 passed (total 4382) |
| Durasi | 147.85s |

---

## Penambahan Test Core Logic (Non-Analytics)

Periode ini menambahkan test untuk modul core logic yang sebelumnya belum punya direct unit test:

1. [`src/__tests__/unit/core-logic/errors/permission.errors.test.ts`](src/__tests__/unit/core-logic/errors/permission.errors.test.ts)
   - Menguji custom error RBAC dan helper guard/error-message.

2. [`src/__tests__/unit/core-logic/utils.test.ts`](src/__tests__/unit/core-logic/utils.test.ts)
   - Menguji helper [`cn()`](src/lib/utils.ts:4) (class merge, falsy handling, tailwind conflict).

3. [`src/__tests__/unit/core-logic/offline/conflict-rules.config.test.ts`](src/__tests__/unit/core-logic/offline/conflict-rules.config.test.ts)
   - Menguji rule registry + seluruh validator branch untuk entitas conflict resolution.

4. [`src/__tests__/unit/core-logic/offline/queue-manager-idempotent.test.ts`](src/__tests__/unit/core-logic/offline/queue-manager-idempotent.test.ts)
   - Menguji jalur idempotent enqueue/process/delegation/duplicate detection/migration.

---

## Validasi Run Terfokus

### 1) Conflict Rules

```bash
npx vitest run src/__tests__/unit/core-logic/offline/conflict-rules.config.test.ts
```

Hasil: **1 file passed, 8 tests passed**.

### 2) Queue Manager Idempotent

```bash
npx vitest run src/__tests__/unit/core-logic/offline/queue-manager-idempotent.test.ts
```

Hasil: **1 file passed, 10 tests passed**.

---

## Validasi Run Penuh

```bash
npm run test
```

Hasil: **131 file passed, 4382 tests passed**.

---

## Potongan Output Penting

```text
Test Files  131 passed (131)
Tests       4382 passed (4382)
Duration    147.85s
```

---

## Catatan Scope (Agar Interpretasi Tepat)

- Test analytics untuk admin sengaja **tidak dijadikan prioritas** sesuai scope saat ini.
- Beberapa file terdeteksi sebagai placeholder (`export {}`) sehingga tidak memiliki logic untuk diuji langsung:
  - [`src/lib/pwa/push-notifications.ts`](src/lib/pwa/push-notifications.ts)
  - [`src/lib/pwa/update-manager.ts`](src/lib/pwa/update-manager.ts)
  - [`src/lib/supabase/realtime.ts`](src/lib/supabase/realtime.ts)
- File anomali bernama salah terdeteksi:
  - [`src/lib/validations/Jadwal.schema .ts`](src/lib/validations/Jadwal.schema%20.ts)
  - Implementasi aktif tetap mengacu ke [`src/lib/validations/jadwal.schema.ts`](src/lib/validations/jadwal.schema.ts), yang sudah memiliki test di [`src/__tests__/unit/core-logic/validations/jadwal.schema.test.ts`](src/__tests__/unit/core-logic/validations/jadwal.schema.test.ts)

---

## Kesimpulan

Status testing saat ini **stabil dan hijau** pada eksekusi terbaru: seluruh suite lulus dengan **4382/4382 tests**.

Dokumen ini memperbarui laporan sebelumnya yang masih memakai angka run lama (128/4354).
