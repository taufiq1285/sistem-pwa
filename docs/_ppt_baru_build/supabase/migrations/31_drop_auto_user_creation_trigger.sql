-- ============================================================================
-- MIGRATION 31: Drop Auto User Creation Trigger
-- ============================================================================
-- Reason: Konflik dengan kode aplikasi yang menyebabkan user auth tetap
-- terbuat meskipun registrasi gagal. Registrasi akan sepenuhnya dihandle
-- oleh aplikasi dengan rollback mechanism via Edge Function.
-- ============================================================================

-- Drop trigger yang otomatis membuat user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Note: Function handle_new_user() dibiarkan untuk backward compatibility
-- tapi tidak akan dipanggil lagi karena trigger sudah dihapus.
-- Bisa dihapus di migration berikutnya jika sudah yakin tidak dibutuhkan.

-- Logging
DO $$
BEGIN
  RAISE NOTICE 'Migration 31 completed: Removed auto user creation trigger';
END $$;
