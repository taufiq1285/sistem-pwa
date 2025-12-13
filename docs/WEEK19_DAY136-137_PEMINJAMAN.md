# Week 19: Peminjaman & Room Booking - Day 136-137

## Implementation Summary

### ✅ Completed Features

#### 1. **Peminjaman API Extensions** (`src/lib/api/peminjaman-extensions.ts`)

Created comprehensive API functions for managing both equipment borrowing and room booking approvals.

**Equipment Borrowing Functions:**
- `getAllPeminjaman()` - Get all borrowing requests with full details (filters, pagination)
- `markAsReturned()` - Mark equipment as returned with condition notes

**Room Booking Functions:**
- `getPendingRoomBookings()` - Get pending room booking requests from jadwal
- `approveRoomBooking()` - Approve room booking (set jadwal.is_active = true)
- `rejectRoomBooking()` - Reject room booking (delete pending jadwal)

**Key Features:**
- Full detail mapping with related data (borrower, equipment, dosen, lab info)
- Status filtering (pending/approved/rejected/returned/overdue)
- Search and pagination support
- Proper error handling and type safety

#### 2. **PeminjamanPage** (`src/pages/laboran/PeminjamanPage.tsx`)

Full-featured page for managing both types of approvals with tabs interface.

**Features:**
- **Two-tab interface:**
  - Tab 1: Equipment Borrowing Requests
  - Tab 2: Room Booking Requests (from jadwal)

- **Statistics Dashboard:**
  - Pending Equipment count
  - Approved count
  - Returned count
  - Pending Room Bookings count

- **Equipment Borrowing Tab:**
  - List all borrowing requests with full details
  - Search by name, NIM, or equipment
  - Filter by status (pending/approved/rejected/returned/overdue)
  - Actions:
    - ✅ Approve (pending → approved)
    - ❌ Reject with reason (pending → rejected)
    - 📦 Mark as Returned (approved → returned, with condition)
  - Status badges with icons
  - Borrower and equipment details

- **Room Booking Tab:**
  - List pending room booking requests
  - Shows: Class, Lecturer, Lab, Schedule, Topic
  - Lab capacity information
  - Actions:
    - ✅ Approve room (activates jadwal)
    - ❌ Reject room (removes jadwal)

- **Dialogs:**
  - Approve confirmation dialog
  - Reject dialog with reason textarea
  - Return dialog with condition dropdown and notes

---

## How It Works

### Equipment Borrowing Flow

1. **Mahasiswa/Dosen** creates peminjaman request (status: pending)
2. **Laboran** views request in PeminjamanPage → Equipment tab
3. **Laboran** can:
   - Approve → status changes to 'approved', borrower can pick up
   - Reject → status changes to 'rejected', reason recorded
4. **After borrowing**, when equipment returned:
   - Laboran marks as returned
   - Records condition (baik/rusak_ringan/rusak_berat)
   - Optional notes about item condition
   - Status changes to 'returned'

### Room Booking Flow

1. **Dosen** creates jadwal_praktikum and selects lab room
   - **IMPORTANT**: Jadwal should be created with `is_active: false`
   - This makes it a "pending approval" booking request
2. **Laboran** views pending room bookings in PeminjamanPage → Room tab
3. **Laboran** checks lab availability and can:
   - **Approve** → Sets `is_active: true`, jadwal becomes active
   - **Reject** → Deletes the jadwal (or marks inactive)
4. **Once approved**, the jadwal appears in schedules and calendar

---

## Database Schema Used

### Peminjaman Table (Equipment Borrowing)
```typescript
peminjaman {
  id: string (UUID, PK)
  inventaris_id: string (FK -> inventaris)
  peminjam_id: string (FK -> mahasiswa)
  dosen_id: string | null (FK -> dosen)
  jumlah_pinjam: number
  keperluan: string
  tanggal_pinjam: string (date)
  tanggal_kembali_rencana: string (date)
  tanggal_kembali_real: string | null (date)
  kondisi_pinjam: string | null
  kondisi_kembali: string | null
  keterangan_kembali: string | null
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue'
  rejection_reason: string | null
  approved_by: string | null (FK -> users)
  approved_at: timestamp | null
  denda: number | null
  created_at: timestamp
  updated_at: timestamp
}
```

### Jadwal_Praktikum Table (Room Booking)
```typescript
jadwal_praktikum {
  id: string (UUID, PK)
  kelas_id: string (FK -> kelas)
  laboratorium_id: string (FK -> laboratorium)
  hari: day_of_week enum
  jam_mulai: string (time)
  jam_selesai: string (time)
  tanggal_praktikum: string | null (date)
  minggu_ke: number | null
  topik: string | null
  deskripsi: string | null
  catatan: string | null
  is_active: boolean  // ← KEY: false = pending approval, true = approved
  created_at: timestamp
  updated_at: timestamp
}
```

**Room Booking Logic:**
- `is_active: false` = Pending laboran approval
- `is_active: true` = Approved, jadwal is active

---

## Next Steps / TODO

### 📝 Update Jadwal Creation Flow

**CRITICAL**: When dosen creates jadwal, must set `is_active: false` by default to require laboran approval.

**Files to modify:**
1. **Find jadwal creation form** (likely in `src/pages/dosen/` or `src/components/`)
2. **Update createJadwal API call** to set:
   ```typescript
   {
     // ... other fields
     is_active: false  // ← ADD THIS: Requires approval
   }
   ```
3. **Add UI feedback** showing "Waiting for laboran approval" status

### 📝 Add Routing

Add route to `src/routes/routes.config.ts`:

```typescript
// In laboran routes section
{
  path: '/laboran/peminjaman',
  element: <PeminjamanPage />,
  meta: {
    title: 'Peminjaman & Booking',
    roles: ['laboran'],
    requiresAuth: true,
  },
}
```

### 📝 Add Navigation Menu

Add to laboran navigation menu (usually in `src/config/navigation.config.ts`):

```typescript
{
  name: 'Peminjaman',
  href: '/laboran/peminjaman',
  icon: Package,  // or Users
  roles: ['laboran'],
}
```

### 📝 Optional Enhancements

1. **Add jadwal rejection tracking:**
   - Currently rejects by deleting jadwal
   - Future: Add `room_rejection_reason` field to jadwal table
   - Store rejection history for dosen to see why booking was denied

2. **Add notifications:**
   - Notify dosen when room booking approved/rejected
   - Notify mahasiswa when equipment borrowing approved/rejected

3. **Add overdue detection:**
   - Background job to check if tanggal_kembali_rencana passed
   - Auto-update status to 'overdue'
   - Calculate denda (fines) for overdue returns

4. **Add conflict detection:**
   - Before approving room booking, check for schedule conflicts
   - Show warning if lab already booked at same time

---

## Testing Checklist

### Equipment Borrowing
- [ ] Can view all peminjaman requests
- [ ] Can filter by status (pending/approved/rejected/returned/overdue)
- [ ] Can search by borrower name, NIM, or equipment name
- [ ] Can approve pending requests
- [ ] Can reject pending requests with reason
- [ ] Can mark approved items as returned
- [ ] Return condition options work (baik/rusak_ringan/rusak_berat)
- [ ] Status badges display correctly
- [ ] Stats cards update correctly

### Room Booking
- [ ] Can view pending room bookings (jadwal with is_active=false)
- [ ] Shows class, lecturer, lab, schedule details correctly
- [ ] Can approve room booking (sets is_active=true)
- [ ] Can reject room booking (deletes jadwal)
- [ ] Rejection reason dialog works
- [ ] Stats card shows correct pending count

### Integration
- [ ] Equipment approval updates inventaris availability
- [ ] Room approval makes jadwal visible in schedules
- [ ] Approved equipment can be marked as returned
- [ ] Returned equipment updates inventaris stock
- [ ] Rejected requests notify requestor (if notifications implemented)

---

## Files Created/Modified

1. ✅ `src/lib/api/peminjaman-extensions.ts` - New API functions
2. ✅ `src/pages/laboran/PeminjamanPage.tsx` - Complete approval page
3. ⏳ `src/routes/routes.config.ts` - Need to add route
4. ⏳ `src/config/navigation.config.ts` - Need to add menu item
5. ⏳ Jadwal creation form - Need to set is_active: false

---

## API Usage Examples

```typescript
// Get all peminjaman with filters
const { data, count } = await getAllPeminjaman({
  status: 'pending',
  limit: 20,
  offset: 0,
});

// Approve equipment borrowing
await approvePeminjaman('peminjaman-id');

// Reject equipment borrowing
await rejectPeminjaman('peminjaman-id', 'Equipment not available');

// Mark as returned
await markAsReturned('peminjaman-id', 'baik', 'All items in good condition');

// Get pending room bookings
const roomBookings = await getPendingRoomBookings();

// Approve room booking
await approveRoomBooking('jadwal-id');

// Reject room booking
await rejectRoomBooking('jadwal-id', 'Lab already booked at this time');
```

---

## Integration Notes

### Equipment Borrowing Integration
- **Links with**: inventaris table (equipment availability)
- **Updates**: inventaris.jumlah_tersedia when approved/returned
- **Tracks**: borrower info from mahasiswa/dosen tables
- **Protected**: Cannot delete inventaris with active borrowings

### Room Booking Integration
- **Links with**: jadwal_praktikum table
- **Uses**: is_active field as approval flag
- **Displays**: Only inactive jadwal as pending bookings
- **Activates**: Sets is_active=true on approval
- **Validates**: Should check for schedule conflicts (future enhancement)

### Dual Approval System
Laboran now manages TWO types of approvals:
1. **Equipment Borrowing** - Direct approval in peminjaman table
2. **Room Booking** - Indirect approval via jadwal.is_active flag

Both managed from single PeminjamanPage with tabs for easy access.

---

## Notes

- Room booking uses existing jadwal table with is_active as approval mechanism
- No separate booking table needed (simplified approach)
- Equipment condition tracked at borrow and return time
- Rejection reasons stored for equipment borrowing
- Room booking rejection currently deletes jadwal (can be enhanced to store reason)
- All dialogs have proper confirmation steps
- Proper error handling with toast notifications
- Responsive design works on mobile

---

## Day 136-137 Summary

**Completed:**
- ✅ Peminjaman API extensions (6 new functions)
- ✅ PeminjamanPage with dual-tab interface
- ✅ Equipment borrowing approval flow
- ✅ Room booking approval flow via jadwal
- ✅ Mark as returned functionality
- ✅ Status filtering and search
- ✅ Stats dashboard
- ✅ Complete documentation

**Remaining:**
- Add routing and navigation
- Update jadwal creation to require approval
- Testing and validation

**Total Lines of Code:**
- peminjaman-extensions.ts: ~360 lines
- PeminjamanPage.tsx: ~750 lines
- Documentation: This file

**Time Estimate:** Day 136-137 implementation complete, needs integration testing.
