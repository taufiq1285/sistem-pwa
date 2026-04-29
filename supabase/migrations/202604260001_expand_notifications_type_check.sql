-- Expand allowed notification types so DB constraint matches the app.
-- This fixes trigger/client inserts for assignment and academic workflow notifications.

alter table public.notifications
drop constraint if exists notifications_type_check;

alter table public.notifications
add constraint notifications_type_check
check (
  type in (
    'info',
    'warning',
    'error',
    'success',
    'quiz',
    'grade',
    'announcement',
    'booking',
    'jadwal_baru',
    'jadwal_diupdate',
    'jadwal_updated',
    'jadwal_pending_approval',
    'jadwal_disetujui',
    'jadwal_ditolak',
    'jadwal_dibatalkan',
    'peminjaman_baru',
    'peminjaman_disetujui',
    'peminjaman_ditolak',
    'peminjaman_terlambat',
    'kuis_published',
    'kuis_baru',
    'tugas_baru',
    'tugas_submitted',
    'tugas_graded',
    'materi_baru',
    'dosen_changed',
    'assignment_added',
    'assignment_deleted',
    'assignment_reassigned',
    'perbaikan_nilai_request',
    'perbaikan_nilai_response',
    'logbook_submitted',
    'logbook_approved',
    'logbook_rejected',
    'logbook_revision',
    'pengumuman',
    'sistem',
    'test_notification',
    'other'
  )
);
