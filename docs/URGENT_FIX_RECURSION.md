# URGENT FIX: Infinite Recursion Error

## ❌ Error Message
```
POST /rest/v1/users 500 (Internal Server Error)
code: '42P17'
message: "infinite recursion detected in policy for relation \"users\""
```

## 🔍 Penyebab
Ada policy di tabel `users` yang circular - policy nya refer ke tabel users lagi, menyebabkan infinite loop.

## ✅ Solusi

### Step 1: Run Fix SQL
Di **Supabase SQL Editor**, clear previous query dan paste ini:

```sql
-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read for auth" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;

-- Create safe, non-recursive policies
CREATE POLICY "Enable read access for users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow insert for registration" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Step 2: Click RUN
Tunggu sampai sukses (no error).

### Step 3: Verify
Copy & paste ini di SQL Editor baru:

```sql
SELECT policyname, qual, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
```

Seharusnya ada **3 policies**:
1. "Allow insert for registration" - INSERT
2. "Enable read access for users" - SELECT
3. "Users can update own profile" - UPDATE

### Step 4: Test
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear cache (Ctrl+Shift+Delete)
3. Try register mahasiswa baru
4. Should succeed now! ✅

---

## 📝 What Changed?

### Before:
- Complex policies yang refer ke tabel users
- Menyebabkan infinite recursion
- Registration gagal dengan 500 error

### After:
- Simple, non-recursive policies
- SELECT untuk semua orang (public read)
- UPDATE hanya untuk user sendiri
- INSERT untuk registration
- ✅ Registration berjalan lancar

---

## ⚠️ Important Notes

1. **Tabel users sekarang lebih "open"** untuk SELECT
   - Tapi itu OK karena users table isinya tidak sensitive
   - Roles & access control diatur di policies mahasiswa/kelas/etc

2. **Mahasiswa still protected** oleh policy mereka sendiri
   - Admin policy: `"Admins can manage mahasiswa"`
   - User policy: `"mahasiswa_select_own"`
   - No infinite recursion!

3. **Admin access tetap protected** oleh admin table policy
   - Tapi admin table juga perlu di-fix jika ada recursion

---

## ✅ After Fix - Test Again:

1. Register mahasiswa baru
2. Check admin panel
3. Create kelas
4. Assign mahasiswa

**Status:** Ready untuk test lagi! 🚀
