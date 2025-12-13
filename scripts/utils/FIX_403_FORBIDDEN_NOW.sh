#!/bin/bash

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║  🔧 FINAL FIX: 403 Forbidden - Application Middleware Issue               ║
║                                                                            ║
║  Root Cause: public.users table role column not populated                 ║
║  Impact: Middleware can't check permissions → 403 Forbidden               ║
║  Solution: Populate users.role from role table membership                 ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

CRITICAL FINDING:
═══════════════════════════════════════════════════════════════════════════

The 403 error is NOT from RLS policies (those are working!).
It's from APPLICATION MIDDLEWARE checking permissions.

Middleware flow:
  1. Check if user has 'manage:jadwal' permission
  2. Get user role from: SELECT role FROM public.users WHERE id = ?
  3. ❌ users.role is NULL → Throws 403 Forbidden
  4. RLS policies never get evaluated

═══════════════════════════════════════════════════════════════════════════

THE FIX (2 minutes):
═══════════════════════════════════════════════════════════════════════════

Step 1: Go to Supabase SQL Editor

Step 2: Run this migration:
   📄 supabase/migrations/44_fix_users_role_column.sql

Step 3: Verify output shows:
   ✅ All users have role set
   ✅ No NULL roles remaining
   ✅ All verifications show '✓ OK'

Step 4: Test in application:
   - Dosen creates jadwal_praktikum
   - Should now succeed! ✅

═══════════════════════════════════════════════════════════════════════════

WHAT THE FIX DOES:
═══════════════════════════════════════════════════════════════════════════

Migration 44 will:
  ✅ Check if users.role is populated
  ✅ For any NULL roles, look up from role tables:
     - Check if user in admin table → set role='admin'
     - Check if user in dosen table → set role='dosen'
     - Check if user in laboran table → set role='laboran'
     - Check if user in mahasiswa table → set role='mahasiswa'
  ✅ Default to 'mahasiswa' if not found in any table
  ✅ Verify all users now have correct role
  ✅ Confirm no NULL roles remain

═══════════════════════════════════════════════════════════════════════════

WHY THIS SOLVES THE 403:
═══════════════════════════════════════════════════════════════════════════

Before:
  Middleware: "Get user role from users.role"
  Database: "users.role is NULL"
  Middleware: "❌ Can't determine role - Permission denied (403)"

After:
  Middleware: "Get user role from users.role"
  Database: "users.role = 'dosen'"
  Middleware: "✅ User is dosen"
  Middleware: "✅ Dosen has 'manage:jadwal' permission"
  RLS Policy: "is_dosen() = true"
  Result: "✅ jadwal_praktikum created successfully!"

═══════════════════════════════════════════════════════════════════════════

ARCHITECTURE OVERVIEW:
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ Frontend (UI)                                                       │
│  ├─ RoleGuard: Checks if user is dosen                             │
│  └─ Redirects to /dosen dashboard                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Application Middleware Layer (FIX APPLIES HERE!)                    │
│  ├─ requirePermission('manage:jadwal')                              │
│  ├─ getCurrentUserWithRole() ← Queries users.role                  │
│  ├─ hasPermission('dosen', 'manage:jadwal') ← Check permissions    │
│  └─ ❌ 403 if users.role = NULL → ✅ 200 if users.role = 'dosen'  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Database Layer (RLS Policies)                                       │
│  ├─ RLS INSERT policy: is_dosen()                                   │
│  ├─ ✅ is_dosen() = true                                            │
│  ├─ RLS SELECT policy: is_dosen()                                   │
│  └─ ✅ jadwal_praktikum record inserted                             │
└─────────────────────────────────────────────────────────────────────┘

Migration 44 fixes Layer 2 (Middleware) by populating users.role

═══════════════════════════════════════════════════════════════════════════

TIMELINE:
═══════════════════════════════════════════════════════════════════════════

Earlier Migrations:
  ✅ Migration 39: Fixed is_dosen() and RLS policies
  ✅ Migration 42: Fixed JWT metadata

THIS MIGRATION:
  → Migration 44: Fix users.role for middleware (THIS IS THE KEY!)

Result:
  ✅ Middleware permission check works
  ✅ RLS policies work
  ✅ Dosen can create jadwal_praktikum

═══════════════════════════════════════════════════════════════════════════

SUCCESS INDICATORS:
═══════════════════════════════════════════════════════════════════════════

After running Migration 44:
  ✅ No 403 Forbidden errors
  ✅ Jadwal praktikum created successfully
  ✅ Can view/edit/delete schedules
  ✅ Appears in jadwal list immediately

═══════════════════════════════════════════════════════════════════════════

READY? 🚀

Go to Supabase SQL Editor and run Migration 44 now!
The fix takes less than 1 minute.

═══════════════════════════════════════════════════════════════════════════

EOF
