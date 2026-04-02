# Load Testing - Sistem Praktikum PWA

## Cara Install k6

### Windows
```
winget install k6 --source winget
```
Atau download installer dari: https://dl.k6.io/msi/k6-latest-amd64.msi

### Verifikasi instalasi
```
k6 version
```

---

## Cara Menjalankan

### 1. Test cepat (smoke test, 1 user saja)
```bash
k6 run --vus 1 --duration 30s load-test.js
```

### 2. Jalankan full 3 skenario
```bash
k6 run load-test.js
```

### 3. Simpan hasil ke file JSON (untuk dokumentasi skripsi)
```bash
k6 run --out json=results-$(date +%Y%m%d).json load-test.js
```

### 4. Jalankan hanya 1 skenario (misal peak load saja)
```bash
k6 run --scenario peak_load load-test.js
```

---

## Membaca Hasil

Output k6 akan menampilkan:

```
scenarios: (100.00%) 3 scenarios, 80 max VUs

✓ [Kuis List] status 200
✓ [Kuis List] response < 2s
✗ [Submit] response < 3s   ← ini berarti ada masalah

http_req_duration............: avg=450ms  min=120ms med=380ms max=4200ms p(90)=900ms p(95)=1800ms
http_req_failed..............: 2.30%  ← error rate, harus < 5%
```

### Kolom penting untuk skripsi:
| Metric | Arti |
|---|---|
| `p(95)` | 95% request selesai dalam waktu ini |
| `http_req_failed` | Persentase request gagal |
| `http_reqs` | Total request yang dikirim |
| `vus_max` | Puncak concurrent user |

---

## Skenario yang Diuji

| Skenario | Concurrent User | Durasi | Simulasi |
|---|---|---|---|
| Normal Load | 20 user | 4.5 menit | Hari biasa |
| Peak Load | 50 user | 7 menit | Saat ujian/praktikum |
| Stress Test | 80 user | 6 menit | Batas maksimal |

---

## Target Threshold

| Endpoint | Target Response Time (p95) |
|---|---|
| List Kuis (dashboard) | < 2 detik |
| Polling Notifikasi | < 1.5 detik |
| Submit Jawaban | < 3 detik |
| Error Rate Global | < 5% |
