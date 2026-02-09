-- ============================================================================
-- FIX INVENTORY TABLE NAME
-- ============================================================================
-- Problem: update_inventory_availability() uses wrong table name 'inventory'
--          Should use 'inventaris' instead
-- Also fixes wrong column names
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS public.update_inventory_availability() CASCADE;

-- Recreate with correct table and column names
CREATE OR REPLACE FUNCTION public.update_inventory_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- When peminjaman is approved, decrease stock
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE public.inventaris  -- FIXED: inventory -> inventaris
        SET jumlah_tersedia = jumlah_tersedia - NEW.jumlah_pinjam  -- FIXED: available_quantity -> jumlah_tersedia, quantity -> jumlah_pinjam
        WHERE id = NEW.inventaris_id;  -- FIXED: inventory_id -> inventaris_id

    -- When peminjaman status changes to returned, increase stock
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'returned' AND NEW.status = 'returned' THEN
        UPDATE public.inventaris  -- FIXED: inventory -> inventaris
        SET jumlah_tersedia = jumlah_tersedia + NEW.jumlah_pinjam  -- FIXED: available_quantity -> jumlah_tersedia, quantity -> jumlah_pinjam
        WHERE id = NEW.inventaris_id;  -- FIXED: inventory_id -> inventaris_id
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION public.update_inventory_availability IS
'Automatically updates inventaris stock when peminjaman status changes';

-- ============================================================================
-- RECREATE TRIGGER
-- ============================================================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS update_inventaris_availability ON public.peminjaman;

-- Create trigger
CREATE TRIGGER update_inventaris_availability
    AFTER INSERT OR UPDATE ON public.peminjaman
    FOR EACH ROW
    EXECUTE FUNCTION public.update_inventory_availability();

COMMENT ON TRIGGER update_inventaris_availability ON public.peminjaman IS
'Updates inventaris stock automatically when peminjaman is approved or returned';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_func_exists BOOLEAN;
    v_trigger_exists BOOLEAN;
BEGIN
    -- Check function
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'update_inventory_availability'
        AND pronamespace = 'public'::regnamespace
    ) INTO v_func_exists;

    -- Check trigger
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'update_inventaris_availability'
        AND event_object_table = 'peminjaman'
    ) INTO v_trigger_exists;

    RAISE NOTICE '
    ============================================================
    ✅ INVENTORY TABLE NAME FIX
    ============================================================
    ';

    IF v_func_exists THEN
        RAISE NOTICE '✅ Function update_inventory_availability exists';
    ELSE
        RAISE NOTICE '❌ Function update_inventory_availability MISSING';
    END IF;

    IF v_trigger_exists THEN
        RAISE NOTICE '✅ Trigger update_inventaris_availability exists';
    ELSE
        RAISE NOTICE '❌ Trigger update_inventaris_availability MISSING';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Fixed References:';
    RAISE NOTICE '  - inventory → inventaris';
    RAISE NOTICE '  - inventory_id → inventaris_id';
    RAISE NOTICE '  - available_quantity → jumlah_tersedia';
    RAISE NOTICE '  - quantity → jumlah_pinjam';
    RAISE NOTICE '';

    IF v_func_exists AND v_trigger_exists THEN
        RAISE NOTICE '🎉 ALL FIXED!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next Steps:';
        RAISE NOTICE '1. Refresh browser (Ctrl+Shift+R)';
        RAISE NOTICE '2. Test "Sudah Kembali" button';
        RAISE NOTICE '3. It should work now! ✨';
    ELSE
        RAISE NOTICE '⚠️  SOME COMPONENTS MISSING';
    END IF;

    RAISE NOTICE '
    ============================================================
    ';
END $$;
