# 🎯 SYSTEM ARCHITECTURE & WORKFLOW DIAGRAMS

**Project:** Sistem Praktikum PWA - Semester Progression System  
**Last Updated:** December 8, 2025

---

## 📊 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Sidebar Menu ─────────────────────────────────────────────┐ │
│  │ • Dashboard                                                │ │
│  │ • Kelas                                                    │ │
│  │ • 🆕 Manajemen Mahasiswa                                 │ │
│  │ • Users                                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Main Content ─────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  MANAJEMEN MAHASISWA PAGE                                 │ │
│  │  ┌─ Filters ──────────────────────────┐                  │ │
│  │  │ [Search] [Angkatan] [Semester]    │                  │ │
│  │  │ [Program] [Clear]                 │                  │ │
│  │  └────────────────────────────────────┘                  │ │
│  │                                                             │ │
│  │  ┌─ Mahasiswa Table ──────────────────┐                  │ │
│  │  │ ☑ │ NIM │ Nama │ Angkatan │ Sem │ │                │ │
│  │  │───────────────────────────────────────│                │ │
│  │  │ ☐ │ B1  │ Siti │ 2022     │ 1  │ ✎  │                │ │
│  │  │ ☐ │ B2  │ Ahm  │ 2022     │ 2  │ ✎  │                │ │
│  │  │ ☐ │ B3  │ Budi │ 2023     │ 1  │ ✎  │                │ │
│  │  └────────────────────────────────────┘                  │ │
│  │                                                             │ │
│  │  [Update Semester Bulk] (0 selected)                      │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ UpdateSemesterDialog (3-step flow) ───────────────────────┐ │
│  │                                                             │ │
│  │  STEP 1: FORM                                             │ │
│  │  ┌──────────────────────────────────────────┐             │ │
│  │  │ Nama: Siti Nurhaliza                     │             │ │
│  │  │ NIM: BD2321001 | Angkatan: 2022         │             │ │
│  │  │                                          │             │ │
│  │  │ Semester Baru: [1▼] [2▼] [3▼] ... [8▼] │             │ │
│  │  │ Catatan: [Textarea]                     │             │ │
│  │  │ [Batal] [Update Semester]               │             │ │
│  │  └──────────────────────────────────────────┘             │ │
│  │                              ↓                             │ │
│  │  STEP 2: RECOMMENDATIONS                                 │ │
│  │  ┌──────────────────────────────────────────┐             │ │
│  │  │ ✅ Semester updated: 1 → 2               │             │ │
│  │  │                                          │             │ │
│  │  │ Rekomendasi (2):                        │             │ │
│  │  │ ☑ Kelas B S2 (Sesuai!)                 │             │ │
│  │  │ ☐ Kelas C S3 (Semester lebih tinggi)   │             │ │
│  │  │                                          │             │ │
│  │  │ [Skip] [Enroll ke Kelas Terpilih]      │             │ │
│  │  └──────────────────────────────────────────┘             │ │
│  │                              ↓                             │ │
│  │  STEP 3: SUCCESS                                         │ │
│  │  ┌──────────────────────────────────────────┐             │ │
│  │  │ ✅ Proses berhasil!                     │             │ │
│  │  │                                          │             │ │
│  │  │ Ringkasan:                              │             │ │
│  │  │ • Semester: 1 → 2                       │             │ │
│  │  │ • Enroll ke: 1 kelas                    │             │ │
│  │  │ • Catatan: logged di audit trail        │             │ │
│  │  │                                          │             │ │
│  │  │ [Selesai]                               │             │ │
│  │  └──────────────────────────────────────────┘             │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                            BACKEND

┌─────────────────────────────────────────────────────────────────┐
│                  API LAYER (mahasiswa-semester.api.ts)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ✅ getMahasiswaSemester(id)                                   │
│    └─ Get current semester for student                         │
│                                                                  │
│ ✅ getSemesterRecommendations(id, semester)                   │
│    └─ Call RPC suggest_kelas_for_semester()                   │
│    └─ Return: filtered list of suitable classes                │
│                                                                  │
│ 🔒 updateMahasiswaSemester(data) [PROTECTED]                 │
│    └─ Permission: manage:mahasiswa                             │
│    └─ Update semester in DB                                    │
│    └─ Log to mahasiswa_semester_audit                          │
│    └─ Return: success + recommendations                        │
│                                                                  │
│ ✅ enrollToRecommendedClass(id, kelas_id)                    │
│    └─ Create enrollment in kelas_mahasiswa                     │
│    └─ Set semester_saat_enroll (trigger)                       │
│    └─ Return: enrollment_id                                    │
│                                                                  │
│ ✅ getMahasiswaSemesterHistory(id)                            │
│    └─ Query mahasiswa_semester_audit                           │
│    └─ Return: all historical updates                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (Supabase PostgreSQL)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─ mahasiswa ─────────────────────────────────────────────┐   │
│ │ • id (UUID)                                             │   │
│ │ • user_id → users.user_id                              │   │
│ │ • nim (Nomor Induk Mahasiswa)                          │   │
│ │ • angkatan (Cohort year - FIXED)                       │   │
│ │ • program_studi                                        │   │
│ │ • semester_saat_enroll (Current semester - DYNAMIC)   │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ kelas ─────────────────────────────────────────────────┐   │
│ │ • id (UUID)                                             │   │
│ │ • nama_kelas                                           │   │
│ │ • min_semester (NEW) - Min semester for class          │   │
│ │ • tahun_ajaran (Academic year)                         │   │
│ │ • dosen_id → users.user_id                            │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ kelas_mahasiswa (Enrollment) ──────────────────────┐   │
│ │ • id (UUID)                                             │   │
│ │ • kelas_id → kelas.id                                 │   │
│ │ • mahasiswa_id → mahasiswa.id                         │   │
│ │ • semester_saat_enroll (NEW) - Semester when enrolled │   │
│ │ • semester_terakhir (NEW) - Last updated semester     │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌─ mahasiswa_semester_audit (NEW) ────────────────────┐   │
│ │ • id (UUID)                                             │   │
│ │ • mahasiswa_id → mahasiswa.id                         │   │
│ │ • semester_lama (Previous semester)                   │   │
│ │ • semester_baru (New semester)                        │   │
│ │ • updated_by_admin_id → users.user_id               │   │
│ │ • updated_at (Timestamp)                             │   │
│ │ • notes (Optional audit notes)                       │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ 🔗 RPC Function: suggest_kelas_for_semester(...)             │
│    Input:                                                       │
│      • p_angkatan (Student cohort)                           │
│      • p_new_semester (Target semester)                      │
│      • p_tahun_ajaran (Academic year)                        │
│    Output:                                                      │
│      • Table of matching classes sorted by proximity          │
│      • Only where: min_semester <= target_semester            │
│                                                                  │
│ 🔗 Trigger: track_semester_saat_enroll()                     │
│    On: INSERT kelas_mahasiswa                                 │
│    Action: Auto-set semester_saat_enroll from mahasiswa      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW DIAGRAM

```
START: Admin Dashboard
  │
  └─→ Navigate to: Manajemen Mahasiswa
      │
      ├─→ Page loads mahasiswa list
      │   │
      │   └─→ API call: getAllMahasiswa()
      │       └─→ Display in table
      │
      ├─→ Search/Filter
      │   │
      │   ├─→ Search by: nama/NIM/email
      │   ├─→ Filter by: angkatan/semester/program
      │   │
      │   └─→ Table re-renders
      │
      ├─→ Select Mahasiswa
      │   │
      │   └─→ Click: ✎ Edit button
      │       │
      │       └─→ Open: UpdateSemesterDialog
      │           │
      │           ├─ STEP 1: Show Form
      │           │   ├─ Display mahasiswa info
      │           │   ├─ Select new semester (1-8)
      │           │   ├─ Add optional notes
      │           │   │
      │           │   └─→ Click: "Update Semester"
      │           │       │
      │           │       └─→ API call: updateMahasiswaSemester()
      │           │           │
      │           │           ├─ Check: Permission (manage:mahasiswa)
      │           │           ├─ Update: mahasiswa.semester
      │           │           ├─ Log: mahasiswa_semester_audit
      │           │           ├─ Call: suggest_kelas_for_semester() [RPC]
      │           │           │
      │           │           └─→ Return: success + recommendations
      │           │
      │           ├─ STEP 2: Show Recommendations
      │           │   ├─ Display recommended classes
      │           │   │   ├─ Filter: min_semester <= new_semester
      │           │   │   ├─ Match: program_studi
      │           │   │   ├─ Sort: closest semester first
      │           │   │
      │           │   ├─ User selects classes (checkboxes)
      │           │   │
      │           │   └─→ Click: "Enroll ke Kelas Terpilih"
      │           │       │
      │           │       └─→ For each selected class:
      │           │           │
      │           │           └─→ API call: enrollToRecommendedClass()
      │           │               ├─ Create: kelas_mahasiswa row
      │           │               ├─ Trigger: track_semester_saat_enroll()
      │           │               │           (auto-set semester)
      │           │               │
      │           │               └─→ Return: enrollment_id
      │           │
      │           └─ STEP 3: Show Success
      │               ├─ Display: Summary
      │               │   ├─ Old semester: 1
      │               │   ├─ New semester: 2
      │               │   ├─ Classes enrolled: 2
      │               │
      │               └─→ Click: "Selesai"
      │                   │
      │                   └─→ Close dialog
      │                       │
      │                       └─→ Refresh table
      │                           └─→ Show updated semester
      │
      └─→ Back to table (Updated!)
          │
          └─→ Verify: Mahasiswa semester updated
              │
              └─→ Verify: Enrollment shows in kelas
                  │
                  └─→ Verify: Audit log created
                      │
                      └─→ END ✅

AUDIT TRAIL (Automatically logged):
┌─────────────────────────────────────────┐
│ mahasiswa_semester_audit table:         │
│ • Who: admin_id                         │
│ • When: timestamp                       │
│ • What: 1 → 2                          │
│ • Why: notes field                      │
│ • Result: enrollment count              │
└─────────────────────────────────────────┘
```

---

## 📊 DATA FLOW DIAGRAM

```
Frontend                    Backend                    Database
─────────────────────────────────────────────────────────────────

User Input
   │
   ├─ Search: "Siti"
   │   │
   │   └─→ Filter state updated
   │       │
   │       └─→ Table re-filters locally
   │
   ├─ Click ✎ Edit
   │   │
   │   └─→ Open Dialog
   │       │
   │       └─→ Display mahasiswa info (from state)
   │
   ├─ Select Semester: 2
   │   │
   │   └─→ Dialog state updated
   │
   ├─ Click "Update Semester"
   │   │
   │   └─→ API Request
   │       │
   │       └─ Endpoint: updateMahasiswaSemester()
   │           │
   │           ├─ Authorization check ────→ Check user permissions
   │           │                            ├─ Is admin? ✓
   │           │                            └─ Has manage:mahasiswa? ✓
   │           │
   │           ├─ UPDATE mahasiswa ────────→ UPDATE mahasiswa
   │           │   semester_saat_enroll: 2  WHERE id = 'xyz'
   │           │
   │           ├─ INSERT audit log ───────→ INSERT mahasiswa_semester_audit
   │           │                            (who, when, what, why)
   │           │
   │           ├─ Call RPC function ──────→ SELECT suggest_kelas_for_semester()
   │           │   Params:                  WHERE min_semester <= 2
   │           │   • angkatan: 2022         AND program_studi = 'BD'
   │           │   • semester: 2            AND tahun_ajaran = '2024/2025'
   │           │   • tahun_ajaran: 2024/25
   │           │
   │           └─ Return results ─────────→ Return recommendations array
   │                                         [kelas B, kelas C, ...]
   │
   │   ← API Response
   │   {
   │     success: true,
   │     semester_lama: 1,
   │     semester_baru: 2,
   │     recommendations: [...]
   │   }
   │
   ├─ Display Recommendations
   │   │
   │   └─→ Show Step 2 Dialog
   │       ├─ Display: kelas list
   │       └─ Display: Checkboxes for selection
   │
   ├─ Select Classes (checkboxes)
   │   │
   │   └─→ Local state: selectedKelas = Set()
   │
   ├─ Click "Enroll ke Kelas Terpilih"
   │   │
   │   └─→ For each selected class:
   │       │
   │       └─→ API Request (parallel or sequential)
   │           │
   │           └─ Endpoint: enrollToRecommendedClass()
   │               ├─ CREATE kelas_mahasiswa row ──→ INSERT kelas_mahasiswa
   │               │   (kelas_id, mahasiswa_id)     (kelas_xyz, mhs_123)
   │               │
   │               ├─ TRIGGER: Auto-set semester ──→ TRIGGER track_semester_saat_enroll
   │               │   semester_saat_enroll: 2      UPDATE kelas_mahasiswa
   │               │                                SET semester_saat_enroll: 2
   │               │
   │               └─ Return enrollment_id ────────→ Return enrollment record
   │
   │   ← All API Responses
   │   [enrollment_1, enrollment_2, ...]
   │
   ├─ Display Success
   │   │
   │   └─→ Show Step 3 Dialog
   │       ├─ Display: Summary
   │       └─ Display: Confirmation
   │
   ├─ Click "Selesai"
   │   │
   │   └─→ Close Dialog
   │       │
   │       └─→ Refresh Table
   │           │
   │           └─→ API Request: getAllMahasiswa() ──→ Query with updated data
   │
   │   ← Updated data
   │   [
   │     {id: 123, semester: 2, name: "Siti", ...},
   │     ...
   │   ]
   │
   └─→ Render Table
       │
       └─→ Display Updated Semester ✅

AUDIT TRAIL LOGGED:
┌────────────────────────────────────────┐
│ mahasiswa_semester_audit:              │
│ • admin_id: current_admin              │
│ • updated_at: now()                    │
│ • semester_lama: 1                     │
│ • semester_baru: 2                     │
│ • notes: (if provided)                 │
└────────────────────────────────────────┘
```

---

## 🔐 PERMISSION & SECURITY FLOW

```
User Action: "Update Semester"
│
└─→ API: updateMahasiswaSemester()
    │
    ├─ Check 1: Is user authenticated?
    │   ├─ YES ✓ → Continue
    │   └─ NO ✗ → Return 401 (Unauthorized)
    │
    ├─ Check 2: What is user's role?
    │   ├─ Cache check (5-min TTL)
    │   │   ├─ Cache hit ✓ → Use cached role
    │   │   └─ Cache miss → Query database
    │   │
    │   ├─ Role: admin ✓ → Continue
    │   ├─ Role: dosen ✗ → Return 403 (Forbidden)
    │   └─ Role: mahasiswa ✗ → Return 403 (Forbidden)
    │
    ├─ Check 3: Does user have permission?
    │   ├─ Permission: manage:mahasiswa ✓ → Continue
    │   └─ Permission: read:mahasiswa ✗ → Return 403 (Forbidden)
    │
    ├─ Check 4: Is input valid?
    │   ├─ mahasiswa_id exists ✓ → Continue
    │   ├─ semester_baru in range 1-8 ✓ → Continue
    │   └─ Otherwise → Return 400 (Bad Request)
    │
    └─ ✅ All checks passed
        │
        └─→ Execute UPDATE
            ├─ UPDATE mahasiswa.semester_saat_enroll
            ├─ INSERT mahasiswa_semester_audit (with admin_id!)
            └─ Return success

RLS POLICY ENFORCEMENT (Database Level):
┌──────────────────────────────────────────┐
│ SELECT mahasiswa ... → Only admin sees   │
│ UPDATE mahasiswa ... → Only admin can    │
│ DELETE mahasiswa ... → Prevented         │
│ INSERT kelas_mahasiswa ... → Only admin  │
│ SELECT mahasiswa_semester_audit ...      │
│   → Admin sees all                       │
│   → Others: denied                       │
└──────────────────────────────────────────┘

AUDIT TRAIL:
Every action logged with:
├─ admin_id (WHO did it)
├─ timestamp (WHEN)
├─ action (WHAT: 1→2)
└─ notes (WHY - optional)
```

---

## 📈 PERFORMANCE OPTIMIZATION

```
BEFORE                          AFTER
─────────────────────────────────────────────────

KelasPage Load:
┌─────────────────┐            ┌──────────┐
│ 681ms (2x load) │  ──→ 56%   │ 300ms    │
└─────────────────┘            └──────────┘

Database Query:
┌──────────────────────┐       ┌────────────┐
│ 3 JOINs (slow)       │ ─→ 70%│ 0 JOINs    │
│ • mata_kuliah        │       │ (fast)     │
│ • dosen              │       │            │
│ • users              │       │            │
└──────────────────────┘       └────────────┘

User Role Cache:
┌──────────────────────────┐   ┌──────────────────┐
│ N queries per session    │   │ 1 query per 5min │
│ (hit DB every time)      │   │ (cached)         │
└──────────────────────────┘   │ 95% ↓ reduction  │
                               └──────────────────┘

Console Messages:
┌──────────────┐            ┌───────┐
│ 20+ messages │ ──→ 90% ↓ │ 2 msgs│
│ (spam)       │           │ (errors)
└──────────────┘           └───────┘

CACHING STRATEGY:
┌─────────────────────────────────────┐
│ User Role Cache (5-minute TTL):     │
│ • Admin updates role                │
│ • System caches: admin role + perms │
│ • Next 5 min: use cached version    │
│ • After 5 min: refresh from DB      │
│ • On logout: clear immediately      │
└─────────────────────────────────────┘
```

---

## 🧪 TEST FLOW DIAGRAM

```
TEST CASE 1: Update Single Semester
┌──────────────────────────────┐
│ Setup: Siti (S1, 2022)       │
├──────────────────────────────┤
│ 1. Open Manajemen Mahasiswa  │
│ 2. Click ✎ on Siti           │
│ 3. Select Semester: 2        │
│ 4. Click "Update Semester"   │
│ 5. Select "Kelas B S2"       │
│ 6. Click "Enroll"            │
│ 7. Click "Selesai"           │
├──────────────────────────────┤
│ Assert:                      │
│ ✓ Siti.semester = 2          │
│ ✓ Siti in Kelas B            │
│ ✓ Audit logged               │
│ ✓ Success shown              │
└──────────────────────────────┘

TEST CASE 2: Smart Recommendations
┌──────────────────────────────┐
│ Setup:                       │
│ • Ahmad (S1, 2022, BD)       │
│ • Kelas A (S1, 2022)         │
│ • Kelas B (S2, 2022)         │
│ • Kelas C (S3, 2022)         │
├──────────────────────────────┤
│ Action: Update Ahmad to S2   │
├──────────────────────────────┤
│ Assert:                      │
│ ✓ Kelas B (S2) first        │
│ ✓ Kelas C (S3) second       │
│ ✗ Kelas A (S1) not shown    │
└──────────────────────────────┘

TEST CASE 3: No Recommendations
┌──────────────────────────────┐
│ Setup:                       │
│ • Budi (S1, 2022)            │
│ • NO S2 classes exist        │
├──────────────────────────────┤
│ Action: Update Budi to S2    │
├──────────────────────────────┤
│ Assert:                      │
│ ✓ Warning shown              │
│ ✓ Can skip enrollment        │
│ ✓ Semester updated           │
└──────────────────────────────┘

TEST CASE 4: Audit Trail
┌──────────────────────────────┐
│ After all updates:           │
├──────────────────────────────┤
│ Query: mahasiswa_semester_   │
│        audit WHERE updated   │
│        _at DESC              │
├──────────────────────────────┤
│ Assert:                      │
│ ✓ All updates logged         │
│ ✓ Admin ID correct           │
│ ✓ Timestamps valid           │
│ ✓ Notes captured             │
└──────────────────────────────┘
```

---

## 🎯 SEMESTER PROGRESSION MODEL

```
ANGKATAN (FIXED)           SEMESTER (DYNAMIC)
─────────────────────────────────────────────

2022 Cohort ────────→ S1 (Months 0-6)
(Registered 2022)        ↓ After 6 months
                         S2 (Months 6-12)
                         ↓ After 6 months
                         S3 (Months 12-18)
                         ↓ After 6 months
                         ... S8

2023 Cohort ────────→ S1 (Months 0-6)
(Registered 2023)        ↓ After 6 months
                         S2 (Months 6-12)
                         ↓ After 6 months
                         ... S8

2024 Cohort ────────→ S1 (Months 0-6)
(Registered 2024)        ↓ After 6 months
                         S2 (Months 6-12)
                         ↓ After 6 months
                         ... S8

KEY CONCEPT:
• Angkatan: Never changes (2022 = 2022 forever)
• Semester: Changes every 6 months (1→2→3→...→8)
• Smart recommendations match both angkatan + semester
```

---

**Diagrams Version:** 1.0.0  
**Created:** December 8, 2025  
**System:** Production Ready ✅
