-- ============================================================================
-- DAY 13: HELPER FUNCTIONS
-- Additional utility functions
-- ============================================================================

-- ============================================================================
-- USER ROLE HELPER
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = required_role
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- QUIZ HELPERS
-- ============================================================================

-- Get active quizzes for student
CREATE OR REPLACE FUNCTION get_active_kuis_for_mahasiswa(p_mahasiswa_id UUID)
RETURNS TABLE (
    kuis_id UUID,
    judul VARCHAR,
    deskripsi TEXT,
    durasi_menit INTEGER,
    tanggal_mulai TIMESTAMPTZ,
    tanggal_selesai TIMESTAMPTZ,
    attempts_taken INTEGER,
    max_attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id,
        k.judul,
        k.deskripsi,
        k.durasi_menit,
        k.tanggal_mulai,
        k.tanggal_selesai,
        COALESCE(COUNT(a.id)::INTEGER, 0) as attempts_taken,
        k.max_attempts
    FROM kuis k
    JOIN kelas kl ON k.kelas_id = kl.id
    JOIN kelas_mahasiswa km ON kl.id = km.kelas_id
    LEFT JOIN attempt_kuis a ON k.id = a.kuis_id AND a.mahasiswa_id = p_mahasiswa_id
    WHERE km.mahasiswa_id = p_mahasiswa_id
        AND k.status = 'published'
        AND k.tanggal_mulai <= NOW()
        AND k.tanggal_selesai >= NOW()
    GROUP BY k.id
    HAVING COUNT(a.id) < k.max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get quiz attempt with details
CREATE OR REPLACE FUNCTION get_quiz_attempt_details(p_attempt_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'attempt', row_to_json(a.*),
        'kuis', row_to_json(k.*),
        'soal', (
            SELECT json_agg(
                json_build_object(
                    'soal', row_to_json(s.*),
                    'jawaban', (
                        SELECT row_to_json(j.*) 
                        FROM jawaban j 
                        WHERE j.attempt_id = a.id AND j.soal_id = s.id
                    )
                )
            )
            FROM soal s
            WHERE s.kuis_id = k.id
            ORDER BY s.urutan
        )
    )
    INTO result
    FROM attempt_kuis a
    JOIN kuis k ON a.kuis_id = k.id
    WHERE a.id = p_attempt_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATABASE HELPERS
-- ============================================================================

-- Get table row count
CREATE OR REPLACE FUNCTION get_table_count(table_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    count_result INTEGER;
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO count_result;
    RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check database connection
CREATE OR REPLACE FUNCTION check_connection()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Clean old sync history (for future offline system)
CREATE OR REPLACE FUNCTION cleanup_old_sync_history(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Check if sync_history table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'sync_history') THEN
        EXECUTE format(
            'DELETE FROM sync_history WHERE completed_at < NOW() - interval ''%s days'' AND status = ''synced''',
            days_to_keep
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END IF;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;