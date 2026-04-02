/**
 * Load Testing Script - Sistem Praktikum PWA
 * Akademi Kebidanan Mega Buana
 *
 * Tool: k6 (https://k6.io)
 * Install: https://k6.io/docs/get-started/installation/
 * Run: k6 run load-test.js
 * Run with report: k6 run --out json=results.json load-test.js
 *
 * Skenario:
 *   1. Normal Load  - 20 user concurrent (hari biasa)
 *   2. Peak Load    - 50 user concurrent (saat ujian/praktikum massal)
 *   3. Stress Test  - 80 user concurrent (batas maksimal)
 */

import http from "k6/http";
import { sleep, check, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// ============================================================
// KONFIGURASI
// ============================================================

const SUPABASE_URL = "https://rkyoifqbfcztnhevpnpx.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJreW9pZnFiZmN6dG5oZXZwbnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NDQyNDMsImV4cCI6MjA3NjMyMDI0M30.-P894i9DGQdkSl-_4gu9rJL9vu0SPnRMDy4yK5grw-E";

const BASE_URL = `${SUPABASE_URL}/rest/v1`;
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

const HEADERS = {
  apikey: ANON_KEY,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// ============================================================
// SKENARIO LOAD TEST (3 FASE)
// ============================================================

export const options = {
  scenarios: {
    // SKENARIO 1: Normal Load - hari biasa
    normal_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 }, // ramp up ke 20 user dalam 1 menit
        { duration: "3m", target: 20 }, // tahan 20 user selama 3 menit
        { duration: "30s", target: 0 }, // ramp down
      ],
      startTime: "0s",
      tags: { scenario: "normal_load" },
    },

    // SKENARIO 2: Peak Load - saat ujian/praktikum massal
    peak_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 50 }, // ramp up ke 50 user (semua mahasiswa)
        { duration: "5m", target: 50 }, // tahan 50 user selama 5 menit
        { duration: "1m", target: 0 },  // ramp down
      ],
      startTime: "5m", // mulai setelah normal_load selesai
      tags: { scenario: "peak_load" },
    },

    // SKENARIO 3: Stress Test - cari batas maksimal
    stress_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 80 }, // ramp up agresif ke 80 user
        { duration: "3m", target: 80 }, // tahan
        { duration: "1m", target: 0 },  // ramp down
      ],
      startTime: "13m", // mulai setelah peak_load selesai
      tags: { scenario: "stress_test" },
    },
  },

  // Threshold: batas minimum yang harus dipenuhi
  thresholds: {
    // 95% request harus selesai < 3 detik
    http_req_duration: ["p(95)<3000"],
    // Error rate maksimal 5%
    http_req_failed: ["rate<0.05"],
    // Threshold per endpoint kritis
    "http_req_duration{endpoint:kuis_list}": ["p(95)<2000"],
    "http_req_duration{endpoint:notif_poll}": ["p(95)<1500"],
    "http_req_duration{endpoint:attempt_start}": ["p(95)<3000"],
  },
};

// ============================================================
// CUSTOM METRICS
// ============================================================

const kuisLoadErrors = new Counter("kuis_load_errors");
const notifPollErrors = new Counter("notif_poll_errors");
const attemptErrors = new Counter("attempt_errors");
const successRate = new Rate("success_rate");
const kuisResponseTime = new Trend("kuis_response_time");
const notifResponseTime = new Trend("notif_response_time");

// ============================================================
// HELPER: Buat headers dengan auth token
// ============================================================

function authHeaders(token) {
  return {
    ...HEADERS,
    Authorization: `Bearer ${token || ANON_KEY}`,
  };
}

// ============================================================
// SKENARIO UTAMA
// ============================================================

export default function () {
  // Simulasi pola penggunaan nyata mahasiswa
  // 60% load dashboard, 25% jawab kuis, 15% cek notifikasi
  const rand = Math.random();

  if (rand < 0.60) {
    scenarioDashboardMahasiswa();
  } else if (rand < 0.85) {
    scenarioJawabKuis();
  } else {
    scenarioCekNotifikasi();
  }
}

// ============================================================
// SKENARIO A: Mahasiswa Load Dashboard
// Ini bottleneck utama - N+1 query pattern
// ============================================================

function scenarioDashboardMahasiswa() {
  group("Dashboard Mahasiswa", function () {
    // 1. Fetch kuis published (query utama dashboard)
    const kuisRes = http.get(
      `${BASE_URL}/kuis?status=eq.published&order=tanggal_mulai.desc`,
      {
        headers: authHeaders(),
        tags: { endpoint: "kuis_list" },
      }
    );

    const kuisOk = check(kuisRes, {
      "[Kuis List] status 200": (r) => r.status === 200,
      "[Kuis List] response < 2s": (r) => r.timings.duration < 2000,
      "[Kuis List] ada data": (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
    });

    kuisResponseTime.add(kuisRes.timings.duration);
    successRate.add(kuisOk);
    if (!kuisOk) kuisLoadErrors.add(1);

    sleep(0.5);

    // 2. Fetch kelas mahasiswa (cek enrollment)
    const kelasRes = http.get(
      `${BASE_URL}/kelas_mahasiswa?is_active=eq.true&select=kelas_id`,
      {
        headers: authHeaders(),
        tags: { endpoint: "kelas_mahasiswa" },
      }
    );

    check(kelasRes, {
      "[Kelas] status 200": (r) => r.status === 200,
    });

    sleep(0.5);

    // 3. Fetch attempt kuis (cek sudah dikerjakan atau belum)
    const attemptRes = http.get(
      `${BASE_URL}/attempt_kuis?select=kuis_id,status,total_poin&order=started_at.desc&limit=20`,
      {
        headers: authHeaders(),
        tags: { endpoint: "attempt_list" },
      }
    );

    check(attemptRes, {
      "[Attempt] status 200": (r) => r.status === 200,
    });

    sleep(1);
  });
}

// ============================================================
// SKENARIO B: Mahasiswa Mengerjakan Kuis
// Ini simulasi saat ujian praktikum berlangsung
// ============================================================

function scenarioJawabKuis() {
  group("Mengerjakan Kuis", function () {
    // 1. Load detail kuis + soal
    const kuisDetailRes = http.get(
      `${BASE_URL}/kuis?status=eq.published&select=id,judul,tanggal_mulai,tanggal_selesai,max_attempts&limit=5`,
      {
        headers: authHeaders(),
        tags: { endpoint: "kuis_detail" },
      }
    );

    check(kuisDetailRes, {
      "[Kuis Detail] status 200": (r) => r.status === 200,
      "[Kuis Detail] response < 2s": (r) => r.timings.duration < 2000,
    });

    sleep(1);

    // 2. Load soal kuis (data terbesar, ada pilihan jawaban)
    const soalRes = http.get(
      `${BASE_URL}/soal?select=id,pertanyaan,tipe,pilihan_jawaban,poin,urutan&limit=20`,
      {
        headers: authHeaders(),
        tags: { endpoint: "soal_list" },
      }
    );

    check(soalRes, {
      "[Soal] status 200": (r) => r.status === 200,
      "[Soal] response < 3s": (r) => r.timings.duration < 3000,
    });

    sleep(2); // Simulasi mahasiswa baca soal

    // 3. Simulasi submit jawaban (POST - operasi tulis)
    // Menggunakan dummy data karena tidak ada session aktif
    const jawabanPayload = JSON.stringify({
      attempt_id: "00000000-0000-0000-0000-000000000001", // dummy
      soal_id: "00000000-0000-0000-0000-000000000002",    // dummy
      jawaban: "A",
    });

    const submitRes = http.post(
      `${BASE_URL}/jawaban`,
      jawabanPayload,
      {
        headers: authHeaders(),
        tags: { endpoint: "submit_jawaban" },
      }
    );

    // Expect 401/403 karena tidak auth - yang ditest adalah response time server
    const submitOk = check(submitRes, {
      "[Submit] server merespons": (r) => r.status !== 0,
      "[Submit] response < 3s": (r) => r.timings.duration < 3000,
    });

    if (!submitOk) attemptErrors.add(1);

    sleep(1);
  });
}

// ============================================================
// SKENARIO C: Polling Notifikasi
// Setiap user aktif polling tiap 30 detik
// ============================================================

function scenarioCekNotifikasi() {
  group("Polling Notifikasi", function () {
    const notifRes = http.get(
      `${BASE_URL}/notifications?is_read=eq.false&order=created_at.desc&limit=10`,
      {
        headers: authHeaders(),
        tags: { endpoint: "notif_poll" },
      }
    );

    const notifOk = check(notifRes, {
      "[Notif] status 200": (r) => r.status === 200,
      "[Notif] response < 1.5s": (r) => r.timings.duration < 1500,
    });

    notifResponseTime.add(notifRes.timings.duration);
    if (!notifOk) notifPollErrors.add(1);

    sleep(0.5);

    // Cek pengumuman juga (sering di-poll bersamaan)
    const announcementRes = http.get(
      `${BASE_URL}/pengumuman?order=created_at.desc&limit=5`,
      {
        headers: authHeaders(),
        tags: { endpoint: "pengumuman" },
      }
    );

    check(announcementRes, {
      "[Pengumuman] status 200": (r) => r.status === 200,
    });

    sleep(1);
  });
}

// ============================================================
// LIFECYCLE HOOKS
// ============================================================

export function setup() {
  console.log("=== Load Test Sistem Praktikum PWA ===");
  console.log(`Target: ${SUPABASE_URL}`);
  console.log("Skenario: Normal(20) → Peak(50) → Stress(80) concurrent users");
  console.log("Estimasi durasi total: ~21 menit");

  // Verifikasi koneksi ke Supabase
  const healthCheck = http.get(`${BASE_URL}/kuis?limit=1`, {
    headers: HEADERS,
  });

  if (healthCheck.status !== 200) {
    console.error(`Health check GAGAL: status ${healthCheck.status}`);
  } else {
    console.log("Health check OK - Supabase dapat dijangkau");
  }
}

export function teardown() {
  console.log("=== Load Test Selesai ===");
  console.log("Lihat hasil di terminal atau file results.json");
}
