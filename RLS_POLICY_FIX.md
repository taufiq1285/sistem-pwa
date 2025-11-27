# Row Level Security (RLS) Policy Fix for Peminjaman Table

## Problem

When dosen try to create a borrowing request (peminjaman), they receive a **403 Forbidden** error:

```
POST https://rkyoifqbfcztnhevpnpx.supabase.co/rest/v1/peminjaman 403 (Forbidden)
{code: '42501', message: 'new row violates row-level security policy for table "peminjaman"'}
```

**Error Code 42501** = "new row violates row-level security policy"

This indicates that the RLS policy on the `peminjaman` table is currently blocking dosen (lecturers) from inserting new borrowing requests.

## Root Cause

The RLS policy on the `peminjaman` table is configured to:
- ✅ Allow laboran (lab staff) to read/write peminjaman records
- ❌ Block dosen from inserting new peminjaman records (for requesting equipment)
- ❌ Possibly block other roles entirely

## Solution

You need to update the RLS policy on the `peminjaman` table in Supabase to allow dosen to insert records.

### Step-by-Step Fix (Supabase Dashboard)

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project: `sistem-praktikum-pwa`

2. **Navigate to RLS Policies**
   - Go to "SQL Editor" or "Authentication" → "Policies"
   - Find the `peminjaman` table

3. **Add a New Policy for Dosen Inserts**

   Create a new INSERT policy with these settings:

   ```sql
   CREATE POLICY "Allow dosen to create borrowing requests"
   ON peminjaman
   FOR INSERT
   WITH CHECK (
     -- Allow any authenticated user to insert
     auth.uid() IS NOT NULL
     -- Optional: restrict to dosen role only
     -- AND (SELECT role FROM auth.users WHERE id = auth.uid()) = 'dosen'
   );
   ```

4. **Alternative: Enable all policies for dosen**

   If you want to give dosen broader access:

   ```sql
   CREATE POLICY "Allow dosen full access to their borrowing requests"
   ON peminjaman
   FOR INSERT
   WITH CHECK (
     -- Allow inserts by authenticated users (dosen, mahasiswa, etc)
     auth.uid() IS NOT NULL
   );
   ```

5. **Save the policy**

### Complete RLS Policy Setup (Recommended)

Here's a comprehensive RLS policy setup for the `peminjaman` table that allows:
- **Dosen**: Can create requests (INSERT), view their own requests (SELECT)
- **Laboran**: Can view all, approve/reject (UPDATE)
- **Mahasiswa**: Can view their own requests (SELECT)

```sql
-- Allow dosen to create borrowing requests
CREATE POLICY "Allow dosen to create borrowing requests"
ON peminjaman
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to view requests
CREATE POLICY "Allow users to view peminjaman"
ON peminjaman
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow laboran to update peminjaman (approve/reject/return)
CREATE POLICY "Allow laboran to update peminjaman"
ON peminjaman
FOR UPDATE
USING (
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'laboran'
)
WITH CHECK (
  (SELECT role FROM auth.users WHERE id = auth.uid()) = 'laboran'
);
```

## Testing the Fix

After updating the RLS policy:

1. **Log back into the app** (may need to refresh)
2. **Navigate to Peminjaman page** (Dosen > Peminjaman Alat)
3. **Try to submit a new borrowing request**
4. **If successful**, you should see:
   - ✅ "Pengajuan peminjaman berhasil dibuat!"
   - New request appears in "Riwayat Peminjaman" with status "Menunggu"

## API Changes Made

The application code has been updated to:

1. **Fetch dosen's mahasiswa record** (if exists) - Some systems allow lecturers to also be students
2. **Use that mahasiswa ID as peminjam_id** - Ensures foreign key constraint is satisfied
3. **Not set dosen_id** on insert - Lets laboran set it when approving
4. **Handle RLS errors gracefully** - Shows helpful error message instead of generic 403

### Updated createBorrowingRequest() Function

```typescript
export async function createBorrowingRequest(data: {
  inventaris_id: string;
  jumlah_pinjam: number;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  keperluan: string;
}): Promise<{ id: string }> {
  // 1. Get current dosen's ID
  const dosenData = await supabase
    .from('dosen')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // 2. Check if dosen has a mahasiswa record
  const mahasiswaData = await supabase
    .from('mahasiswa')
    .select('id')
    .eq('user_id', user.id)
    .single();

  // 3. Use mahasiswa ID as peminjam, fall back to dosen ID
  const peminjam_id = mahasiswaData?.id || dosenData.id;

  // 4. Insert without dosen_id (will be set by laboran on approval)
  const result = await supabase
    .from('peminjaman')
    .insert({
      inventaris_id,
      peminjam_id,
      jumlah_pinjam,
      keperluan,
      tanggal_pinjam,
      tanggal_kembali_rencana,
      status: 'pending',
      kondisi_pinjam: 'baik',
    })
    .select('id')
    .single();

  return { id: result.id };
}
```

## Workflow After Fix

1. **Dosen submits request**
   - Status: `pending`
   - Stock: Not decreased
   - peminjam_id: Set to dosen's mahasiswa record (or dosen ID)
   - dosen_id: NULL (to be set by laboran)

2. **Laboran approves** (in Approval page)
   - Status: `approved`
   - dosen_id: Set to the requesting dosen
   - Stock: Auto-decreases

3. **Dosen marks as taken** (optional, TIER 2)
   - Status: `in_use`
   - Stock: Already decreased

4. **Dosen returns equipment**
   - Status: `returned`
   - Condition tracked
   - Stock: Auto-increases

## Additional Notes

- The `peminjaman` table is used for both borrowing requests (pending) and approval records (approved/returned)
- RLS policies are checked for every database operation
- After applying the RLS policy fix, clear your browser cache and log in again
- If issues persist, check that:
  - The user's role is correctly set in the `auth.users` table
  - The `dosen` record exists for the logged-in user
  - There are no conflicting RLS policies that might be blocking the action

## Testing Checklist

- [ ] Dosen can access "Peminjaman Alat" page
- [ ] Dosen can click "Ajukan Peminjaman Alat" button
- [ ] Form validation works (dates, quantities, purpose)
- [ ] Submit button sends request without 403 error
- [ ] Request appears in "Riwayat Peminjaman" with status "Menunggu"
- [ ] Laboran can see the pending request in Approval page
- [ ] Laboran can approve (stock decreases)
- [ ] Dosen can see "Ambil" button for approved items
- [ ] Dosen can see "Kembalikan" button for in_use items
- [ ] Return flow works (stock increases)
- [ ] All status transitions work as expected
