# Quick Fix - Registration Bug (Orphaned Users)

## Problem
Registration creates orphaned users: user exists in `auth.users` but not in `public.users`, causing **"User account has been deleted"** error.

## Root Cause
RLS policies block INSERT when `auth.uid()` is NULL during registration.

---

## 🚀 QUICK FIX (2 Steps)

### Step 1: Run SQL Fix

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy entire contents from `APPLY_FIX_NOW.sql`
3. Paste and click **Run**

### Step 2: Delete Orphaned User

1. Go to **Authentication** → **Users**
2. Find `asti@test.com`
3. Click **Delete**

---

## ✅ Test Registration

1. Open http://localhost:5173/register
2. Register with:
   - Email: `asti@test.com`
   - Name: `Asti Budi`
   - Role: `Mahasiswa`
   - NIM: `2401XXXX`

3. Should work without errors!

---

## 📋 What Got Fixed

- ✅ `users` INSERT policy allows registration
- ✅ `mahasiswa` INSERT policy allows registration
- ✅ `dosen` INSERT policy allows registration
- ✅ `laboran` INSERT policy allows registration
- ✅ `admin` INSERT policy allows registration

All policies now allow `auth.uid() IS NULL` during registration.

---

## 📂 Files Created

1. **APPLY_FIX_NOW.sql** - Single file to fix everything (use this!)
2. **supabase/migrations/30_fix_registration_rls_policies.sql** - Permanent migration
3. **FIX_REGISTRATION_GUIDE.md** - Detailed guide
4. **QUICK_FIX_STEPS.md** - This file

---

## ❓ Troubleshooting

**Still getting duplicate key error?**
→ Orphaned user still exists, run Step 2 again

**Still getting "User account has been deleted"?**
→ SQL fix not applied, run Step 1 again

**Need to delete other orphaned users?**
→ See `FIX_REGISTRATION_GUIDE.md` section "Other Orphaned Users to Clean"
