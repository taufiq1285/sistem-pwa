# Week 19: Laboran Pages - Day 138-139

## Implementation Summary

### ✅ Completed Features

#### 1. **PersetujuanPage** (`src/pages/laboran/PersetujuanPage.tsx`)

Quick approval dashboard focused on pending requests only. Provides streamlined interface for laboran to quickly process approvals.

**Key Features:**
- ✅ **Pending Equipment Borrowing**
  - View all pending equipment borrowing requests
  - Quick approve/reject actions
  - Shows borrower info, equipment details, quantities
  - Displays borrow and return dates
  - Purpose/keperluan field

- ✅ **Pending Room Booking**
  - View all pending lab room booking requests
  - Shows class, lecturer, lab, schedule information
  - Lab capacity display
  - Quick approve/reject actions

- ✅ **Alert System**
  - Yellow alert banner when there are pending approvals
  - Shows total count of pending requests
  - Prominent visual indicator

- ✅ **Statistics Cards**
  - Pending Equipment Borrowing count
  - Pending Room Booking count
  - Real-time updates after approval/rejection

- ✅ **Dialogs**
  - Approve confirmation dialog
  - Reject dialog with reason textarea (required)
  - Proper validation and error handling
  - Success/error toasts

**UI/UX Features:**
- Empty state with clock icon when no pending requests
- Two separate tables for equipment and room bookings
- Approve (green) and Reject (red) action buttons
- Clean, focused interface for quick processing

---

#### 2. **LaporanPage** (`src/pages/laboran/LaporanPage.tsx`)

Comprehensive reports and analytics dashboard with 5-tab interface showing detailed statistics.

**Key Features:**

**Tab 1: Overview**
- ✅ **Borrowing Statistics Cards:**
  - Total Borrowings (all time)
  - Pending count
  - Approved count (currently borrowed)
  - Returned count

- ✅ **Equipment Status Card:**
  - Total items
  - Available count
  - Currently borrowed count
  - Low stock alerts (< 5 items)
  - Out of stock count
  - Total categories

- ✅ **Laboratory Usage Card:**
  - Total laboratories
  - Active schedules
  - Approved bookings
  - Pending bookings
  - Total capacity

**Tab 2: Borrowing**
- ✅ **Top Borrowed Equipment Table:**
  - Ranking (#1, #2, #3 with special badges)
  - Equipment name and code
  - Category
  - Times borrowed
  - Total quantity borrowed
  - CSV Export functionality

**Tab 3: Equipment**
- ✅ **Equipment Overview Cards:**
  - Total items with available count
  - Low stock alerts (highlighted in red)
  - Categories count

**Tab 4: Laboratories**
- ✅ **Laboratory Utilization Table:**
  - Lab name and code
  - Total schedules
  - Total hours
  - Utilization percentage (color-coded)
    - Red: > 75% (high utilization)
    - Blue: 50-75% (medium)
    - Gray: < 50% (low)
  - CSV Export functionality

**Tab 5: Activities**
- ✅ **Recent Activities Timeline:**
  - Activity type with icon (borrowing, return, approval, rejection)
  - Description of action
  - User name
  - Timestamp (localized to id-ID)
  - Up to 15 most recent activities

**Additional Features:**
- Refresh Data button (re-fetch all stats)
- Loading states for all tabs
- CSV export functionality for reports
- Responsive design
- Color-coded badges for visual clarity

---

#### 3. **Reports API** (`src/lib/api/reports.api.ts`)

Comprehensive API functions for generating statistics and reports.

**Functions Implemented:**

1. **`getBorrowingStats()`**
   - Returns: Total borrowings, pending, approved, rejected, returned, overdue counts
   - Total equipment borrowed (sum of quantities)

2. **`getEquipmentStats()`**
   - Returns: Total items, low stock count, out of stock, available, borrowed
   - Total categories count

3. **`getLabUsageStats()`**
   - Returns: Total labs, active schedules, pending/approved bookings
   - Total capacity across all labs

4. **`getTopBorrowedItems(limit)`**
   - Returns: Most frequently borrowed equipment
   - Aggregates by item, counts times borrowed and total quantity
   - Sorted by times_borrowed (descending)

5. **`getBorrowingTrends(days)`**
   - Returns: Borrowing trends over time (last N days)
   - Groups by date with approved/rejected counts
   - Ready for chart visualization (not yet implemented)

6. **`getLabUtilization()`**
   - Returns: Per-lab utilization statistics
   - Calculates total schedules and hours
   - Computes utilization percentage (based on 40h/week baseline)

7. **`getRecentActivities(limit)`**
   - Returns: Recent borrowing-related activities
   - Activity types: borrowing, return, approval, rejection
   - Includes user name, description, timestamp

**Type Definitions:**
- `BorrowingStats` - Borrowing statistics interface
- `EquipmentStats` - Equipment inventory statistics
- `LabUsageStats` - Lab usage statistics
- `TopBorrowedItem` - Top borrowed equipment item
- `BorrowingTrend` - Trend data point (date-based)
- `LabUtilization` - Per-lab utilization data
- `RecentActivity` - Activity log entry

---

## Files Created/Modified

1. ✅ `src/pages/laboran/PersetujuanPage.tsx` (480 lines)
2. ✅ `src/pages/laboran/LaporanPage.tsx` (645 lines)
3. ✅ `src/lib/api/reports.api.ts` (370 lines)
4. ⏳ `src/routes/routes.config.ts` - Need to add routes
5. ⏳ `src/config/navigation.config.ts` - Need to add menu items

---

## Page Differences

### PersetujuanPage vs PeminjamanPage

**PersetujuanPage** (Quick Approval Dashboard):
- **Focus**: Pending items only
- **Purpose**: Fast approval processing
- **Features**: Only approve/reject actions
- **View**: Two simple tables (equipment + room)
- **Use Case**: Quick daily approval workflow

**PeminjamanPage** (Full Management):
- **Focus**: All statuses (pending, approved, rejected, returned, overdue)
- **Purpose**: Complete borrowing management
- **Features**: Approve, reject, mark as returned, search, filter
- **View**: Tabs with comprehensive details
- **Use Case**: Full borrowing lifecycle management

**Recommendation**: Use PersetujuanPage for quick approval queue, use PeminjamanPage for detailed management.

---

## API Usage Examples

```typescript
// Get borrowing statistics
const stats = await getBorrowingStats();
console.log(stats.pending); // Number of pending requests

// Get equipment statistics
const equipment = await getEquipmentStats();
console.log(equipment.low_stock); // Low stock count

// Get lab usage
const labStats = await getLabUsageStats();
console.log(labStats.total_labs);

// Get top borrowed items
const topItems = await getTopBorrowedItems(10); // Top 10
topItems.forEach((item, index) => {
  console.log(`#${index + 1}: ${item.nama_barang} - ${item.times_borrowed} times`);
});

// Get lab utilization
const utilization = await getLabUtilization();
utilization.forEach((lab) => {
  console.log(`${lab.nama_lab}: ${lab.utilization_percentage}% utilized`);
});

// Get recent activities
const activities = await getRecentActivities(20); // Last 20 activities
activities.forEach((activity) => {
  console.log(`[${activity.type}] ${activity.description}`);
});
```

---

## Export Functionality

Both reports pages include CSV export:

**LaporanPage CSV Exports:**
- Top Borrowed Equipment
- Lab Utilization

**Export Format:**
```csv
inventaris_id,kode_barang,nama_barang,kategori,total_borrowed,times_borrowed
id-1,ALB-001,Mikroskop Digital,Alat Lab,45,15
id-2,ALB-002,Beaker Glass,Alat Lab,120,30
```

**Filename Format:**
`{report-name}-{YYYY-MM-DD}.csv`

Example: `top-borrowed-equipment-2025-11-21.csv`

---

## Testing Checklist

### PersetujuanPage
- [ ] Can view pending equipment borrowing requests
- [ ] Can view pending room booking requests
- [ ] Alert banner shows when there are pending items
- [ ] Can approve equipment borrowing
- [ ] Can reject equipment borrowing with reason
- [ ] Can approve room booking
- [ ] Can reject room booking with reason
- [ ] Rejection reason is required (validation works)
- [ ] Stats cards update after approve/reject
- [ ] Empty states show correctly
- [ ] Success/error toasts appear

### LaporanPage
- [ ] Overview tab shows all statistics correctly
- [ ] Borrowing statistics cards display accurate counts
- [ ] Equipment status card shows accurate data
- [ ] Lab usage card shows accurate data
- [ ] Borrowing tab shows top borrowed items
- [ ] Equipment tab shows equipment overview
- [ ] Labs tab shows lab utilization
- [ ] Activities tab shows recent activities
- [ ] Refresh button reloads all data
- [ ] CSV export works for top borrowed items
- [ ] CSV export works for lab utilization
- [ ] Loading states work
- [ ] Color-coded badges display correctly
- [ ] Utilization percentage calculated correctly

### Reports API
- [ ] getBorrowingStats returns accurate counts
- [ ] getEquipmentStats returns accurate inventory data
- [ ] getLabUsageStats returns accurate lab data
- [ ] getTopBorrowedItems aggregates correctly
- [ ] getLabUtilization calculates percentages correctly
- [ ] getRecentActivities returns activities in correct order
- [ ] All functions handle empty data gracefully
- [ ] Error handling works properly

---

## Integration Notes

### Data Sources
**PersetujuanPage:**
- `getPendingApprovals()` from laboran.api.ts (equipment)
- `getPendingRoomBookings()` from peminjaman-extensions.ts (rooms)
- `approvePeminjaman()`, `rejectPeminjaman()` from laboran.api.ts
- `approveRoomBooking()`, `rejectRoomBooking()` from peminjaman-extensions.ts

**LaporanPage:**
- All functions from `reports.api.ts`
- Aggregates data from: peminjaman, inventaris, laboratorium, jadwal_praktikum tables

### Performance Considerations
- LaporanPage loads multiple statistics in parallel (Promise.all)
- Reports API uses aggregation queries to minimize database calls
- CSV export handles large datasets client-side
- Recent activities limited to 15-20 items by default
- Top borrowed items limited to 10 by default

---

## Future Enhancements

### PersetujuanPage
- [ ] Add batch approve/reject functionality
- [ ] Add filters (by date, lab, category)
- [ ] Add search functionality
- [ ] Add notifications when new approvals arrive
- [ ] Add auto-refresh every N minutes

### LaporanPage
- [ ] Add date range filters for statistics
- [ ] Add chart visualizations (borrowing trends over time)
- [ ] Add export to PDF functionality
- [ ] Add scheduled reports (email weekly summary)
- [ ] Add equipment depreciation tracking
- [ ] Add cost analysis reports
- [ ] Add comparison views (month-over-month)
- [ ] Add export to Excel with formatting

### Reports API
- [ ] Add caching layer for frequently accessed stats
- [ ] Add date range parameters to all functions
- [ ] Add per-lab breakdowns
- [ ] Add per-category equipment reports
- [ ] Add borrower analytics (top borrowers)
- [ ] Add overdue tracking and alerts
- [ ] Add equipment lifecycle reports
- [ ] Add financial reports (equipment value, depreciation)

---

## Day 138-139 Summary

**Completed:**
- ✅ PersetujuanPage - Quick approval dashboard (480 lines)
- ✅ LaporanPage - Comprehensive reports (645 lines)
- ✅ Reports API - 7 statistics functions (370 lines)
- ✅ All lint checks passing (0 errors, 0 warnings)
- ✅ Complete documentation
- ✅ CSV export functionality
- ✅ Responsive design
- ✅ Error handling and validation
- ✅ Empty states and loading states

**Remaining:**
- Add routing for PersetujuanPage and LaporanPage
- Add navigation menu items
- Integration testing
- Add chart visualizations (future enhancement)

**Total Lines of Code:**
- PersetujuanPage.tsx: 480 lines
- LaporanPage.tsx: 645 lines
- reports.api.ts: 370 lines
- Documentation: This file
- **Total: ~1,495 lines**

**Time Estimate:** Day 138-139 implementation complete, ready for integration and testing.

---

## Navigation Setup

### Add Routes

Add to `src/routes/routes.config.ts`:

```typescript
// Laboran routes
{
  path: '/laboran/persetujuan',
  element: <PersetujuanPage />,
  meta: {
    title: 'Persetujuan',
    roles: ['laboran'],
    requiresAuth: true,
  },
},
{
  path: '/laboran/laporan',
  element: <LaporanPage />,
  meta: {
    title: 'Laporan & Analitik',
    roles: ['laboran'],
    requiresAuth: true,
  },
}
```

### Add Navigation Menu

Add to `src/config/navigation.config.ts`:

```typescript
// Laboran navigation
{
  name: 'Persetujuan',
  href: '/laboran/persetujuan',
  icon: CheckCircle,
  roles: ['laboran'],
  badge: pendingCount, // Optional: Show pending count
},
{
  name: 'Laporan',
  href: '/laboran/laporan',
  icon: BarChart3,
  roles: ['laboran'],
}
```

---

## Screenshots Descriptions

### PersetujuanPage
- Yellow alert banner at top when pending requests exist
- Two statistics cards showing pending counts
- Two tables: Equipment Borrowing and Room Booking
- Green "Approve" and red "Reject" buttons per row
- Empty states with clock icon

### LaporanPage
- 5-tab interface: Overview, Borrowing, Equipment, Labs, Activities
- Overview: 4 stat cards + 2 detailed cards (Equipment Status + Lab Usage)
- Borrowing: Ranked table with #1/#2/#3 badges
- Labs: Utilization table with color-coded percentages
- Activities: Timeline with icons per activity type
- Export CSV buttons on tables

---

## Color Coding

### Badges
- **Blue (default)**: Approved, active items
- **Yellow (secondary)**: Pending items
- **Red (destructive)**: Rejected, low stock, high utilization (>75%)
- **Gray (outline)**: Neutral info, returned items

### Utilization Percentage
- **Red**: > 75% (overutilized)
- **Blue**: 50-75% (well-utilized)
- **Gray**: < 50% (underutilized)

---

This completes the Day 138-139 implementation of Laboran Pages (PersetujuanPage and LaporanPage) with comprehensive reports and analytics functionality!
