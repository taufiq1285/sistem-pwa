# Mahasiswa Registration Flow - Complete Setup

## 🎯 Tujuan
Ketika mahasiswa register → Langsung terlihat di Admin panel secara real-time untuk di-assign ke kelas

---

## 📊 Current Status

### RLS Policies
| Tabel | RLS | Policies | Status |
|-------|-----|----------|--------|
| users | ❌ DISABLED | 5 | ⚠️ Perlu di-ENABLE |
| admin | ❌ DISABLED | 3 | ⚠️ Perlu di-ENABLE |
| dosen | ❌ DISABLED | 3 | ⚠️ Perlu di-ENABLE |
| mahasiswa | ✅ ENABLED | 6 | ✅ OK |
| kelas | ✅ ENABLED | 4 | ✅ OK |
| kelas_mahasiswa | ✅ ENABLED | 6 | ✅ OK |

### Data Status
✅ 2 Admin users: superadmin@akbid.ac.id, test@admin.com
✅ 2 Mahasiswa users registered
⚠️ 1 Mahasiswa (asti@asti.com) belum punya record di tabel mahasiswa

---

## 🔧 Fixes Required

### Fix #1: Enable RLS pada 3 tabel
**File:** `FIX_ENABLE_RLS.sql`

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosen ENABLE ROW LEVEL SECURITY;
```

### Fix #2: Create missing mahasiswa record
**File:** `FIX_MISSING_MAHASISWA.sql`

Untuk user asti@asti.com yang belum punya mahasiswa record.

---

## 📋 Complete Registration Flow

```
┌─────────────────────────────────────────┐
│ MAHASISWA REGISTER (RegisterForm.tsx)    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Call auth.register(data)                │
│ (src/lib/supabase/auth.ts:62)           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ auth.signUp() → Create Auth User        │
│ + metadata (full_name, role, nim, etc)  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ createUserProfile(userId, data)         │
│ (src/lib/supabase/auth.ts:295)          │
└────────────┬────────────────────────────┘
             │
             ├─→ INSERT users table ✅
             │   - id, email, full_name, role
             │
             └─→ INSERT mahasiswa table ✅
                 - user_id, nim, program_studi
                 - angkatan, semester
┌─────────────────────────────────────────┐
│ Registration Success ✅                  │
│ Mahasiswa bisa login                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ ADMIN PANEL                              │
│ (Admin melihat list mahasiswa baru)      │
│                                          │
│ Query: SELECT * FROM mahasiswa          │
│ WHERE is_active = true                  │
│                                          │
│ RLS Check: admin check ✅                │
│ Policies: "Admins can manage mahasiswa"  │
└─────────────────────────────────────────┘
```

---

## 🔐 RLS Policy Flow

### When Mahasiswa Registers:

```
1. Auth.signUp() → Create auth user ✅
   └─ No DB access needed yet

2. createUserProfile() → INSERT into users table
   └─ INSERT users table
      └─ RLS Policy Check: "Admins can manage all users"
         ✅ ALLOWS INSERT from authenticated user

3. createUserProfile() → INSERT into mahasiswa table
   └─ INSERT mahasiswa table
      └─ RLS Policy: "mahasiswa_insert_own"
         WITH CHECK: (auth.uid() = user_id) OR (user is admin)
         ✅ ALLOWS because auth.uid() = user_id

4. Admin views mahasiswa in Admin panel
   └─ SELECT mahasiswa
      └─ RLS Policy: "mahasiswa_select_own"
         USING: (auth.uid() = user_id) OR (user is admin)
         ✅ ALLOWS because admin check passes
```

---

## ✅ Step-by-Step Fix

### Step 1: Enable RLS on 3 tables
1. Open Supabase Dashboard → SQL Editor
2. Copy & paste `FIX_ENABLE_RLS.sql`
3. Click **Run**
4. Verify all 6 tables now have RLS ENABLED

### Step 2: Fix missing mahasiswa record
1. In SQL Editor, copy & paste `FIX_MISSING_MAHASISWA.sql`
2. **Edit** the NIM value (currently '232100002', ganti sesuai kebutuhan)
3. Click **Run**
4. Verify asti@asti.com now has mahasiswa record

### Step 3: Test Flow
1. **Test as Admin:**
   - Log in sebagai admin
   - Buka Admin panel → Mahasiswa list
   - Verify: Melihat 2 mahasiswa (mahasiswa@akbid.ac.id + asti@asti.com)

2. **Test Register New Mahasiswa:**
   - Log out
   - Register user baru sebagai mahasiswa
   - Log in sebagai admin
   - Verify: Mahasiswa baru langsung terlihat di list

3. **Test Create Kelas:**
   - Admin buat kelas baru
   - Buka student assignment
   - Verify: Melihat semua mahasiswa yang terdaftar
   - Admin assign mahasiswa ke kelas

---

## 🔍 Verification Queries

Run these di SQL Editor untuk verify semuanya OK:

```sql
-- 1. Cek RLS enabled pada semua tabel
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'admin', 'dosen', 'mahasiswa', 'kelas', 'kelas_mahasiswa')
ORDER BY tablename;

-- 2. Cek semua mahasiswa
SELECT u.email, u.full_name, m.nim, m.program_studi, m.angkatan
FROM users u
LEFT JOIN mahasiswa m ON u.id = m.user_id
WHERE u.role = 'mahasiswa';

-- 3. Cek admin users
SELECT email, full_name FROM users WHERE role = 'admin';

-- 4. Cek policies count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('users', 'admin', 'dosen', 'mahasiswa', 'kelas', 'kelas_mahasiswa')
GROUP BY tablename;
```

---

## 📝 Important Notes

### About RLS Disabled on users/admin/dosen
- ⚠️ **Security Risk**: Policies ada tapi RLS belum enabled
- ✅ **Fix**: Run `FIX_ENABLE_RLS.sql`
- 🔒 **After Fix**: Hanya yang sesuai policy yang bisa akses

### About Mahasiswa Registration
- ✅ Code sudah benar (createUserProfile function added)
- ✅ Policy untuk INSERT/SELECT sudah OK
- ⚠️ Tinggal enable RLS aja di tabel users

### About Real-time Visibility
- Saat ini: Admin harus refresh untuk lihat mahasiswa baru
- Opsi 1: Polling (current implementation)
- Opsi 2: Supabase Realtime subscriptions (lebih efisien)
- Opsi 3: WebSocket (untuk production)

---

## 🚀 Next Steps

1. ✅ Run `FIX_ENABLE_RLS.sql` di Supabase
2. ✅ Run `FIX_MISSING_MAHASISWA.sql` di Supabase (jika perlu)
3. ✅ Test registration & admin panel
4. ✅ Test create kelas & assign mahasiswa
5. ⚡ (Optional) Add realtime subscriptions untuk instant visibility

---

## 📞 Troubleshooting

### Admin tidak bisa lihat mahasiswa
- Check: RLS enabled pada mahasiswa table? ✅
- Check: Admin memiliki proper role? ✅
- Check: Admin login dengan correct account? ✅
- Fix: Run `FIX_ENABLE_RLS.sql`

### Mahasiswa register tapi tidak muncul di admin
- Check: Mahasiswa record created di DB?
  ```sql
  SELECT * FROM mahasiswa WHERE user_id = '...';
  ```
- Check: User record created di users table?
  ```sql
  SELECT * FROM users WHERE role = 'mahasiswa';
  ```
- Check: RLS policy allow admin SELECT?
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'mahasiswa';
  ```

### Admin tidak bisa create kelas
- Check: Admin memiliki proper role?
- Check: RLS enabled di kelas table? ✅
- Check: Policy "Admins can manage all kelas" exists?
- Fix: Re-run kelas RLS policy creation

---

**Last Updated:** 2025-11-27
**Status:** Ready untuk di-fix
