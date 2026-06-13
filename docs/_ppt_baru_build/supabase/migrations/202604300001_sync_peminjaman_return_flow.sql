DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'borrowing_status'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public.borrowing_status'::regtype
      AND enumlabel = 'return_requested'
  ) THEN
    ALTER TYPE public.borrowing_status ADD VALUE 'return_requested' AFTER 'approved';
  END IF;
END $$;

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (
  type IN (
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
    'peminjaman_pengembalian_diajukan',
    'peminjaman_pengembalian_diverifikasi',
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

CREATE OR REPLACE FUNCTION public.update_inventory_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'approved') THEN
            UPDATE inventaris 
            SET jumlah_tersedia = jumlah_tersedia - NEW.jumlah_pinjam
            WHERE id = NEW.inventaris_id;
        ELSIF NEW.status = 'returned' AND OLD.status = 'return_requested' THEN
            UPDATE inventaris 
            SET jumlah_tersedia = jumlah_tersedia + NEW.jumlah_pinjam
            WHERE id = NEW.inventaris_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'approved' THEN
            UPDATE inventaris 
            SET jumlah_tersedia = jumlah_tersedia + OLD.jumlah_pinjam
            WHERE id = OLD.inventaris_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
