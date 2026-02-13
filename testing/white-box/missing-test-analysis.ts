/**
 * ANALISIS LOGIKA CORE YANG BELUM ADA UNIT TEST
 * Untuk Penelitian Whitebox Testing
 * 
 * Generated: 2026-02-12
 */

export interface MissingTestFile {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  filePath: string;
  category: 'API' | 'Utils' | 'Offline' | 'PWA' | 'Hooks' | 'Validation' | 'Supabase';
  complexity: 'High' | 'Medium' | 'Low';
  businessImpact: string;
  coreFunctions: string[];
  testCases: string[];
  whiteboxFocus: string[];
}

/**
 * FILES YANG BELUM ADA UNIT TEST
 * Total: 30 files tanpa test coverage
 */
export const MISSING_TEST_FILES: MissingTestFile[] = [
  // ==========================================
  // CRITICAL PRIORITY (11 files)
  // ==========================================
  {
    priority: 'CRITICAL',
    filePath: 'src/lib/api/kehadiran.api.ts',
    category: 'API',
    complexity: 'High',
    businessImpact: 'Absensi mahasiswa tidak tercatat dengan benar',
    coreFunctions: [
      'markAttendance()',
      'getAttendanceByKelas()',
      'getAttendanceByMahasiswa()',
      'validateAttendance()',
      'updateAttendance()',
      'calculateAttendancePercentage()',
    ],
    testCases: [
      'TC001: Mark attendance untuk mahasiswa yang valid',
      'TC002: Prevent duplicate attendance di hari yang sama',
      'TC003: Validate attendance time (harus dalam jadwal)',
      'TC004: Calculate attendance percentage dengan benar',
      'TC005: Handle late attendance',
      'TC006: Handle early checkout',
      'TC007: Reject attendance untuk mahasiswa tidak terdaftar',
      'TC008: Update attendance status (hadir/izin/sakit/alpa)',
    ],
    whiteboxFocus: [
      'Statement coverage: Semua path di markAttendance()',
      'Branch coverage: If-else untuk validasi waktu',
      'Path coverage: Success/error paths',
      'Condition coverage: Validasi (isEnrolled && inTimeRange && !duplicate)',
    ],
  },

  {
    priority: 'CRITICAL',
    filePath: 'src/lib/api/kelas.api.ts',
    category: 'API',
    complexity: 'High',
    businessImpact: 'Manajemen kelas tidak berfungsi',
    coreFunctions: [
      'getKelas()',
      'createKelas()',
      'updateKelas()',
      'deleteKelas()',
      'getKelasStudents()',
      'addStudentToKelas()',
      'removeStudentFromKelas()',
      'checkKelasCapacity()',
    ],
    testCases: [
      'TC001: Create kelas dengan data valid',
      'TC002: Prevent duplicate kelas name untuk mata kuliah yang sama',
      'TC003: Validate kuota (max 30 mahasiswa)',
      'TC004: Add student dengan capacity check',
      'TC005: Remove student dan update kuota',
      'TC006: Delete kelas dengan cascade (hapus enrollment)',
      'TC007: Get students dengan pagination',
      'TC008: Update kelas info (nama, kuota, jadwal)',
    ],
    whiteboxFocus: [
      'Statement coverage: Semua CRUD operations',
      'Branch coverage: Capacity validation (jumlah_terisi < kuota)',
      'Path coverage: Create success, create duplicate, create full',
      'Loop coverage: Pagination logic di getKelasStudents()',
    ],
  },

  {
    priority: 'CRITICAL',
    filePath: 'src/lib/api/users.api.ts',
    category: 'API',
    complexity: 'High',
    businessImpact: 'User management tidak bekerja',
    coreFunctions: [
      'getUsers()',
      'getUserById()',
      'createUser()',
      'updateUser()',
      'deleteUser()',
      'updateProfile()',
      'changePassword()',
      'validateUserRole()',
    ],
    testCases: [
      'TC001: Create user dengan role yang valid',
      'TC002: Prevent duplicate email',
      'TC003: Update profile dengan validasi',
      'TC004: Change password dengan current password check',
      'TC005: Delete user dengan cascade (hapus related data)',
      'TC006: Get users dengan filter by role',
      'TC007: Validate user permissions',
      'TC008: Handle user tidak ditemukan',
    ],
    whiteboxFocus: [
      'Statement coverage: Semua CRUD + auth operations',
      'Branch coverage: Role validation (admin/dosen/mahasiswa/laboran)',
      'Path coverage: Success/error/not-found paths',
      'Condition coverage: Password validation rules',
    ],
  },

  {
    priority: 'HIGH',
    filePath: 'src/lib/api/mata-kuliah.api.ts',
    category: 'API',
    complexity: 'Medium',
    businessImpact: 'Mata kuliah tidak bisa dikelola',
    coreFunctions: [
      'getMataKuliah()',
      'createMataKuliah()',
      'updateMataKuliah()',
      'deleteMataKuliah()',
      'getMataKuliahByDosen()',
      'assignDosenToMataKuliah()',
    ],
    testCases: [
      'TC001: Create mata kuliah dengan data valid',
      'TC002: Prevent duplicate kode mata kuliah',
      'TC003: Update mata kuliah info',
      'TC004: Delete mata kuliah dengan cascade check',
      'TC005: Get mata kuliah by dosen',
      'TC006: Assign dosen ke mata kuliah',
      'TC007: Validate SKS (1-4)',
      'TC008: Handle mata kuliah tidak ditemukan',
    ],
    whiteboxFocus: [
      'Statement coverage: Semua CRUD operations',
      'Branch coverage: SKS validation (1 <= sks <= 4)',
      'Path coverage: Create/update/delete paths',
      'Data flow: kode_mk uniqueness check',
    ],
  },

  {
    priority: 'HIGH',
    filePath: 'src/lib/api/materi.api.ts',
    category: 'API',
    complexity: 'High',
    businessImpact: 'Materi pembelajaran tidak bisa diupload/download',
    coreFunctions: [
      'getMateri()',
      'uploadMateri()',
      'downloadMateri()',
      'deleteMateri()',
      'getMateriByKelas()',
      'downloadForOffline()',
    ],
    testCases: [
      'TC001: Upload materi dengan file valid (PDF)',
      'TC002: Validate file size (max 10MB)',
      'TC003: Validate file type (PDF only)',
      'TC004: Download materi dengan signed URL',
      'TC005: Delete materi dan file storage',
      'TC006: Get materi by kelas',
      'TC007: Handle upload error',
      'TC008: Handle storage error',
    ],
    whiteboxFocus: [
      'Statement coverage: Upload/download/delete paths',
      'Branch coverage: File validation (size && type)',
      'Path coverage: Success/error/storage-error paths',
      'Exception handling: Storage errors',
    ],
  },

  {
    priority: 'HIGH',
    filePath: 'src/lib/api/sync.api.ts',
    category: 'API',
    complexity: 'High',
    businessImpact: 'Offline sync tidak bekerja',
    coreFunctions: [
      'syncData()',
      'getSyncStatus()',
      'forceSyncAll()',
      'resolveSyncConflict()',
      'syncByEntity()',
    ],
    testCases: [
      'TC001: Sync data dari offline ke online',
      'TC002: Handle sync conflicts (server-wins)',
      'TC003: Get sync status (pending count)',
      'TC004: Force sync all entities',
      'TC005: Sync by entity type',
      'TC006: Handle network error saat sync',
      'TC007: Retry failed sync',
      'TC008: Mark sync as complete',
    ],
    whiteboxFocus: [
      'Statement coverage: Semua sync paths',
      'Branch coverage: Conflict resolution logic',
      'Path coverage: Success/conflict/error paths',
      'Loop coverage: Sync queue processing',
    ],
  },

  {
    priority: 'HIGH',
    filePath: 'src/lib/api/analytics.api.ts',
    category: 'API',
    complexity: 'Medium',
    businessImpact: 'Dashboard analytics tidak berfungsi',
    coreFunctions: [
      'getUserAnalytics()',
      'getSystemAnalytics()',
      'generateReport()',
      'getAttendanceStats()',
      'getGradeDistribution()',
    ],
    testCases: [
      'TC001: Get user analytics dengan data valid',
      'TC002: Calculate attendance statistics',
      'TC003: Calculate grade distribution',
      'TC004: Generate report dengan filter',
      'TC005: Handle empty data',
      'TC006: Aggregate data by period',
      'TC007: Export analytics to CSV',
      'TC008: Cache analytics results',
    ],
    whiteboxFocus: [
      'Statement coverage: Calculation functions',
      'Branch coverage: Empty data handling',
      'Path coverage: Success/empty/error paths',
      'Data flow: Aggregation logic',
    ],
  },

  {
    priority: 'HIGH',
    filePath: 'src/lib/api/announcements.api.ts',
    category: 'API',
    complexity: 'Medium',
    businessImpact: 'Pengumuman tidak bisa dikelola',
    coreFunctions: [
      'getAnnouncements()',
      'createAnnouncement()',
      'updateAnnouncement()',
      'deleteAnnouncement()',
      'getAnnouncementsByRole()',
    ],
    testCases: [
      'TC001: Create announcement untuk role tertentu',
      'TC002: Update announcement',
      'TC003: Delete announcement',
      'TC004: Get announcements by role (admin/dosen/mahasiswa)',
      'TC005: Validate announcement data',
      'TC006: Handle expired announcements',
      'TC007: Pagination untuk announcements',
      'TC008: Filter announcements by date',
    ],
    whiteboxFocus: [
      'Statement coverage: CRUD operations',
      'Branch coverage: Role filtering',
      'Path coverage: Create/update/delete paths',
      'Condition coverage: Date filtering',
    ],
  },

  {
    priority: 'MEDIUM',
    filePath: 'src/lib/api/reports.api.ts',
    category: 'API',
    complexity: 'High',
    businessImpact: 'Laporan tidak bisa digenerate',
    coreFunctions: [
      'generateAttendanceReport()',
      'generateGradeReport()',
      'exportToExcel()',
      'exportToPDF()',
      'getReportHistory()',
    ],
    testCases: [
      'TC001: Generate attendance report dengan filter',
      'TC002: Generate grade report untuk kelas',
      'TC003: Export report to Excel',
      'TC004: Export report to PDF',
      'TC005: Handle empty report data',
      'TC006: Validate date range',
      'TC007: Get report history',
      'TC008: Handle export errors',
    ],
    whiteboxFocus: [
      'Statement coverage: Report generation paths',
      'Branch coverage: Format selection (Excel/PDF)',
      'Path coverage: Success/empty/error paths',
      'Data flow: Report data aggregation',
    ],
  },

  {
    priority: 'MEDIUM',
    filePath: 'src/lib/api/peminjaman-extensions.ts',
    category: 'API',
    complexity: 'Medium',
    businessImpact: 'Fitur peminjaman advanced tidak teruji',
    coreFunctions: [
      'extendPeminjaman()',
      'returnPeminjaman()',
      'calculateLateFee()',
      'getPeminjamanHistory()',
    ],
    testCases: [
      'TC001: Extend peminjaman (max 1 week)',
      'TC002: Prevent extend sudah dikembalikan',
      'TC003: Return peminjaman dan update stock',
      'TC004: Calculate late fee (1000/day)',
      'TC005: Get peminjaman history',
      'TC006: Validate return date',
      'TC007: Handle already returned',
      'TC008: Update peminjaman status',
    ],
    whiteboxFocus: [
      'Statement coverage: Extend/return logic',
      'Branch coverage: Late fee calculation',
      'Path coverage: Success/late/already-returned paths',
      'Data flow: Stock update flow',
    ],
  },

  {
    priority: 'LOW',
    filePath: 'src/lib/api/index.ts',
    category: 'API',
    complexity: 'Low',
    businessImpact: 'Re-export file, tidak ada logic',
    coreFunctions: [],
    testCases: [],
    whiteboxFocus: ['N/A - Re-export only'],
  },

  // ==========================================
  // HOOKS (3 files)
  // ==========================================
  {
    priority: 'MEDIUM',
    filePath: 'src/lib/hooks/useLocalStorage.ts',
    category: 'Hooks',
    complexity: 'Medium',
    businessImpact: 'Local storage tidak terkelola',
    coreFunctions: [
      'useLocalStorage()',
      'setItem()',
      'getItem()',
      'removeItem()',
      'syncWithStorage()',
    ],
    testCases: [
      'TC001: Set item ke localStorage',
      'TC002: Get item dari localStorage',
      'TC003: Remove item dari localStorage',
      'TC004: Handle storage event (multi-tab sync)',
      'TC005: Handle storage quota exceeded',
      'TC006: Handle invalid JSON parse',
      'TC007: Handle storage disabled',
      'TC008: Clear all storage items',
    ],
    whiteboxFocus: [
      'Statement coverage: Set/get/remove operations',
      'Branch coverage: Try-catch error handling',
      'Path coverage: Success/quota-exceeded/parse-error paths',
      'Exception handling: Storage errors',
    ],
  },

  {
    priority: 'MEDIUM',
    filePath: 'src/lib/hooks/useSessionTimeout.ts',
    category: 'Hooks',
    complexity: 'Medium',
    businessImpact: 'Session timeout tidak bekerja',
    coreFunctions: [
      'useSessionTimeout()',
      'resetTimeout()',
      'handleActivity()',
      'logout()',
    ],
    testCases: [
      'TC001: Timeout setelah 30 menit inactivity',
      'TC002: Reset timeout on user activity',
      'TC003: Show warning sebelum timeout (5 menit)',
      'TC004: Auto logout setelah timeout',
      'TC005: Handle manual logout',
      'TC006: Multiple activity listeners',
      'TC007: Cleanup on unmount',
      'TC008: Custom timeout duration',
    ],
    whiteboxFocus: [
      'Statement coverage: Timeout logic',
      'Branch coverage: Activity detection',
      'Path coverage: Timeout/activity/manual-logout paths',
      'Timer coverage: setTimeout/clearTimeout',
    ],
  },

  {
    priority: 'LOW',
    filePath: 'src/lib/hooks/useSignedUrl.ts',
    category: 'Hooks',
    complexity: 'Low',
    businessImpact: 'Signed URL generation untuk storage',
    coreFunctions: ['useSignedUrl()', 'generateSignedUrl()', 'refreshUrl()'],
    testCases: [
      'TC001: Generate signed URL untuk file',
      'TC002: Refresh URL before expiry',
      'TC003: Handle file tidak ditemukan',
      'TC004: Handle storage error',
      'TC005: Cache signed URLs',
      'TC006: Cleanup on unmount',
    ],
    whiteboxFocus: [
      'Statement coverage: URL generation',
      'Branch coverage: Expiry check',
      'Path coverage: Success/not-found/error paths',
      'Cache management',
    ],
  },

  // ==========================================
  // UTILS (3 files)
  // ==========================================
  {
    priority: 'MEDIUM',
    filePath: 'src/lib/utils/kehadiran-export.ts',
    category: 'Utils',
    complexity: 'High',
    businessImpact: 'Export kehadiran ke Excel/PDF',
    coreFunctions: [
      'exportKehadiranToExcel()',
      'exportKehadiranToPDF()',
      'formatKehadiranData()',
      'calculateStatistics()',
    ],
    testCases: [
      'TC001: Export kehadiran to Excel',
      'TC002: Export kehadiran to PDF',
      'TC003: Format data dengan benar',
      'TC004: Calculate attendance percentage',
      'TC005: Handle empty data',
      'TC006: Handle large dataset',
      'TC007: Validate export format',
      'TC008: Handle export errors',
    ],
    whiteboxFocus: [
      'Statement coverage: Export functions',
      'Branch coverage: Format selection',
      'Path coverage: Excel/PDF/error paths',
      'Data flow: Data formatting',
    ],
  },

  {
    priority: 'LOW',
    filePath: 'src/lib/utils/pdf-viewer.ts',
    category: 'Utils',
    complexity: 'Low',
    businessImpact: 'PDF viewer utility',
    coreFunctions: ['loadPDF()', 'renderPage()', 'navigatePage()'],
    testCases: [
      'TC001: Load PDF dari URL',
      'TC002: Render PDF page',
      'TC003: Navigate between pages',
      'TC004: Handle PDF load error',
      'TC005: Handle invalid PDF',
      'TC006: Zoom in/out',
    ],
    whiteboxFocus: [
      'Statement coverage: Load/render operations',
      'Branch coverage: Error handling',
      'Path coverage: Success/error paths',
    ],
  },

  {
    priority: 'LOW',
    filePath: 'src/lib/utils/device-detect.ts',
    category: 'Utils',
    complexity: 'Low',
    businessImpact: 'Device detection',
    coreFunctions: ['isMobile()', 'isTablet()', 'isDesktop()', 'getOS()'],
    testCases: [
      'TC001: Detect mobile device',
      'TC002: Detect tablet device',
      'TC003: Detect desktop device',
      'TC004: Detect OS (Windows/Mac/Linux)',
      'TC005: Detect browser',
    ],
    whiteboxFocus: [
      'Statement coverage: Detection functions',
      'Branch coverage: Device type checks',
      'Condition coverage: UserAgent parsing',
    ],
  },

  // ==========================================
  // VALIDATION SCHEMAS (5 files)
  // ==========================================
  {
    priority: 'HIGH',
    filePath: 'src/lib/validations/jadwal.schema.ts',
    category: 'Validation',
    complexity: 'Medium',
    businessImpact: 'Validasi jadwal tidak teruji',
    coreFunctions: [
      'jadwalFormSchema',
      'validateJadwalTime()',
      'validateJadwalConflict()',
    ],
    testCases: [
      'TC001: Valid jadwal data',
      'TC002: Invalid time format',
      'TC003: Invalid date range',
      'TC004: Conflict with existing jadwal',
      'TC005: Lab unavailable',
      'TC006: Invalid waktu_mulai > waktu_selesai',
    ],
    whiteboxFocus: [
      'Statement coverage: Validation rules',
      'Branch coverage: Time/date validation',
      'Condition coverage: Complex validation rules',
    ],
  },

  {
    priority: 'MEDIUM',
    filePath: 'src/lib/validations/mata-kuliah.schema.ts',
    category: 'Validation',
    complexity: 'Low',
    businessImpact: 'Validasi mata kuliah',
    coreFunctions: ['mataKuliahFormSchema', 'validateKodeMK()'],
    testCases: [
      'TC001: Valid mata kuliah data',
      'TC002: Invalid kode_mk format',
      'TC003: Invalid SKS (must be 1-4)',
      'TC004: Empty nama_mk',
    ],
    whiteboxFocus: [
      'Statement coverage: Schema validation',
      'Branch coverage: Field validation',
    ],
  },

  {
    priority: 'LOW',
    filePath: 'src/lib/validations/Jadwal.schema .ts',
    category: 'Validation',
    complexity: 'Low',
    businessImpact: 'Duplicate file (typo in filename)',
    coreFunctions: [],
    testCases: [],
    whiteboxFocus: ['N/A - Should be removed, duplicate of jadwal.schema.ts'],
  },

  // ==========================================
  // OFFLINE (3 files)
  // ==========================================
  {
    priority: 'HIGH',
    filePath: 'src/lib/offline/storage-manager.ts',
    category: 'Offline',
    complexity: 'High',
    businessImpact: 'Offline storage tidak terkelola',
    coreFunctions: [
      'saveToStorage()',
      'getFromStorage()',
      'clearStorage()',
      'getStorageUsage()',
      'checkQuota()',
    ],
    testCases: [
      'TC001: Save data to IndexedDB',
      'TC002: Get data from IndexedDB',
      'TC003: Clear storage',
      'TC004: Get storage usage',
      'TC005: Check storage quota',
      'TC006: Handle quota exceeded',
      'TC007: Handle storage error',
      'TC008: Migrate storage version',
    ],
    whiteboxFocus: [
      'Statement coverage: Storage operations',
      'Branch coverage: Quota check',
      'Path coverage: Success/quota-exceeded/error paths',
      'Exception handling: Storage errors',
    ],
  },

  {
    priority: 'HIGH',
    filePath: 'src/lib/offline/api-cache.ts',
    category: 'Offline',
    complexity: 'High',
    businessImpact: 'API caching tidak bekerja',
    coreFunctions: [
      'cacheResponse()',
      'getCachedResponse()',
      'invalidateCache()',
      'clearOldCache()',
    ],
    testCases: [
      'TC001: Cache API response',
      'TC002: Get cached response',
      'TC003: Invalidate cache by key',
      'TC004: Clear old cache (TTL)',
      'TC005: Handle cache miss',
      'TC006: Handle cache error',
      'TC007: Cache versioning',
      'TC008: Cache size limit',
    ],
    whiteboxFocus: [
      'Statement coverage: Cache operations',
      'Branch coverage: TTL check',
      'Path coverage: Hit/miss/expired paths',
      'Data flow: Cache invalidation',
    ],
  },

  {
    priority: 'MEDIUM',
    filePath: 'src/lib/offline/offline-auth.ts',
    category: 'Offline',
    complexity: 'High',
    businessImpact: 'Offline authentication',
    coreFunctions: [
      'authenticateOffline()',
      'validateOfflineToken()',
      'syncAuthState()',
    ],
    testCases: [
      'TC001: Authenticate dengan cached credentials',
      'TC002: Validate offline token',
      'TC003: Sync auth state saat online',
      'TC004: Handle token expiry',
      'TC005: Handle invalid credentials',
      'TC006: Clear offline auth',
    ],
    whiteboxFocus: [
      'Statement coverage: Auth operations',
      'Branch coverage: Token validation',
      'Path coverage: Success/invalid/expired paths',
      'Security: Credential storage',
    ],
  },

  // ==========================================
  // PWA (3 files)
  // ==========================================
  {
    priority: 'MEDIUM',
    filePath: 'src/lib/pwa/update-manager.ts',
    category: 'PWA',
    complexity: 'Medium',
    businessImpact: 'PWA update tidak terkelola',
    coreFunctions: [
      'checkForUpdates()',
      'installUpdate()',
      'skipWaiting()',
      'notifyUpdate()',
    ],
    testCases: [
      'TC001: Check for app updates',
      'TC002: Install update',
      'TC003: Skip waiting dan activate',
      'TC004: Notify user tentang update',
      'TC005: Handle update error',
      'TC006: Force update',
      'TC007: Cancel update',
    ],
    whiteboxFocus: [
      'Statement coverage: Update flow',
      'Branch coverage: Update available check',
      'Path coverage: Update/skip/error paths',
      'Event handling: SW lifecycle events',
    ],
  },

  {
    priority: 'LOW',
    filePath: 'src/lib/pwa/register-sw.ts',
    category: 'PWA',
    complexity: 'Low',
    businessImpact: 'Service worker registration',
    coreFunctions: ['registerSW()', 'unregisterSW()'],
    testCases: [
      'TC001: Register service worker',
      'TC002: Unregister service worker',
      'TC003: Handle SW not supported',
      'TC004: Handle registration error',
    ],
    whiteboxFocus: [
      'Statement coverage: Registration logic',
      'Branch coverage: SW support check',
      'Path coverage: Success/not-supported/error paths',
    ],
  },

  {
    priority: 'LOW',
    filePath: 'src/lib/pwa/push-notifications.ts',
    category: 'PWA',
    complexity: 'Medium',
    businessImpact: 'Push notifications',
    coreFunctions: [
      'requestPermission()',
      'subscribe()',
      'unsubscribe()',
      'sendNotification()',
    ],
    testCases: [
      'TC001: Request notification permission',
      'TC002: Subscribe to push',
      'TC003: Unsubscribe from push',
      'TC004: Send notification',
      'TC005: Handle permission denied',
      'TC006: Handle not supported',
    ],
    whiteboxFocus: [
      'Statement coverage: Notification flow',
      'Branch coverage: Permission check',
      'Path coverage: Granted/denied/not-supported paths',
    ],
  },

  // ==========================================
  // SUPABASE (2 files)
  // ==========================================
  {
    priority: 'LOW',
    filePath: 'src/lib/supabase/storage.ts',
    category: 'Supabase',
    complexity: 'Medium',
    businessImpact: 'File storage operations',
    coreFunctions: [
      'uploadFile()',
      'downloadFile()',
      'deleteFile()',
      'getSignedUrl()',
    ],
    testCases: [
      'TC001: Upload file to storage',
      'TC002: Download file from storage',
      'TC003: Delete file from storage',
      'TC004: Get signed URL',
      'TC005: Handle upload error',
      'TC006: Handle file not found',
    ],
    whiteboxFocus: [
      'Statement coverage: Storage operations',
      'Branch coverage: Error handling',
      'Path coverage: Success/not-found/error paths',
    ],
  },

  {
    priority: 'LOW',
    filePath: 'src/lib/supabase/realtime.ts',
    category: 'Supabase',
    complexity: 'Medium',
    businessImpact: 'Realtime subscriptions',
    coreFunctions: [
      'subscribe()',
      'unsubscribe()',
      'handleRealtimeEvent()',
    ],
    testCases: [
      'TC001: Subscribe to table changes',
      'TC002: Unsubscribe from changes',
      'TC003: Handle realtime event',
      'TC004: Handle connection error',
      'TC005: Multiple subscriptions',
    ],
    whiteboxFocus: [
      'Statement coverage: Subscription logic',
      'Branch coverage: Event handling',
      'Path coverage: Success/error paths',
    ],
  },
];

/**
 * SUMMARY STATISTICS
 */
export const WHITEBOX_TEST_SUMMARY = {
  totalMissingTests: 30,
  bySriority: {
    CRITICAL: 3,
    HIGH: 8,
    MEDIUM: 11,
    LOW: 8,
  },
  byCategory: {
    API: 11,
    Hooks: 3,
    Utils: 3,
    Validation: 3,
    Offline: 3,
    PWA: 3,
    Supabase: 2,
  },
  byComplexity: {
    High: 12,
    Medium: 12,
    Low: 6,
  },
  estimatedTestCases: 250, // Total TC yang perlu dibuat
  whiteboxCoverageGoal: {
    statementCoverage: '100%',
    branchCoverage: '100%',
    conditionCoverage: '100%',
    pathCoverage: '95%', // Some paths might be unreachable
  },
};

/**
 * WHITEBOX TESTING PRIORITIES
 */
export const WHITEBOX_PRIORITY_ORDER = [
  // Phase 1: CRITICAL (Week 1)
  'src/lib/api/kehadiran.api.ts',
  'src/lib/api/kelas.api.ts',
  'src/lib/api/users.api.ts',

  // Phase 2: HIGH Priority APIs (Week 2)
  'src/lib/api/mata-kuliah.api.ts',
  'src/lib/api/materi.api.ts',
  'src/lib/api/sync.api.ts',
  'src/lib/api/analytics.api.ts',
  'src/lib/api/announcements.api.ts',
  'src/lib/offline/storage-manager.ts',
  'src/lib/offline/api-cache.ts',
  'src/lib/validations/jadwal.schema.ts',

  // Phase 3: MEDIUM Priority (Week 3)
  'src/lib/api/reports.api.ts',
  'src/lib/api/peminjaman-extensions.ts',
  'src/lib/hooks/useLocalStorage.ts',
  'src/lib/hooks/useSessionTimeout.ts',
  'src/lib/offline/offline-auth.ts',
  'src/lib/pwa/update-manager.ts',
  'src/lib/utils/kehadiran-export.ts',
  'src/lib/validations/mata-kuliah.schema.ts',

  // Phase 4: LOW Priority (Week 4)
  'src/lib/hooks/useSignedUrl.ts',
  'src/lib/utils/pdf-viewer.ts',
  'src/lib/utils/device-detect.ts',
  'src/lib/pwa/register-sw.ts',
  'src/lib/pwa/push-notifications.ts',
  'src/lib/supabase/storage.ts',
  'src/lib/supabase/realtime.ts',
];

/**
 * WHITEBOX TESTING TECHNIQUES
 */
export const WHITEBOX_TECHNIQUES = {
  statementCoverage: {
    description: 'Setiap statement code harus dieksekusi minimal 1x',
    goal: '100%',
    example: 'Test setiap line di function markAttendance()',
  },
  branchCoverage: {
    description: 'Setiap if-else branch harus ditest',
    goal: '100%',
    example: 'Test both true/false dari if (isEnrolled && inTimeRange)',
  },
  conditionCoverage: {
    description: 'Setiap atomic condition harus ditest true/false',
    goal: '100%',
    example: 'Test isEnrolled=true/false, inTimeRange=true/false',
  },
  pathCoverage: {
    description: 'Setiap possible path di function harus ditest',
    goal: '95%',
    example: 'Success path, error path, edge case path',
  },
  loopCoverage: {
    description: 'Test loop 0x, 1x, 2x, many times',
    goal: '100%',
    example: 'Pagination: no data, 1 page, multiple pages',
  },
  dataFlowCoverage: {
    description: 'Test dari definisi variable sampai penggunaannya',
    goal: '90%',
    example: 'Follow stock value dari query -> validation -> update',
  },
};

console.log('✅ Missing test analysis generated');
console.log(`📊 Total files missing tests: ${WHITEBOX_TEST_SUMMARY.totalMissingTests}`);
console.log(`🎯 Estimated test cases: ${WHITEBOX_TEST_SUMMARY.estimatedTestCases}`);
