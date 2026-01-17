-- ============================================================================
-- MIGRATION 03: FUNCTIONS
-- Helper functions and business logic
-- ============================================================================

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get user role function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = required_role
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- GRADE CALCULATION FUNCTIONS
-- ============================================================================

-- Calculate final grade
CREATE OR REPLACE FUNCTION calculate_final_grade()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate weighted average
    NEW.nilai_akhir := (
        (NEW.nilai_kuis * 0.20) +
        (NEW.nilai_tugas * 0.15) +
        (NEW.nilai_uts * 0.25) +
        (NEW.nilai_uas * 0.25) +
        (NEW.nilai_praktikum * 0.10) +
        (NEW.nilai_kehadiran * 0.05)
    );
    
    -- Assign letter grade
    IF NEW.nilai_akhir >= 85 THEN
        NEW.nilai_huruf := 'A';
    ELSIF NEW.nilai_akhir >= 80 THEN
        NEW.nilai_huruf := 'A-';
    ELSIF NEW.nilai_akhir >= 75 THEN
        NEW.nilai_huruf := 'B+';
    ELSIF NEW.nilai_akhir >= 70 THEN
        NEW.nilai_huruf := 'B';
    ELSIF NEW.nilai_akhir >= 65 THEN
        NEW.nilai_huruf := 'B-';
    ELSIF NEW.nilai_akhir >= 60 THEN
        NEW.nilai_huruf := 'C+';
    ELSIF NEW.nilai_akhir >= 55 THEN
        NEW.nilai_huruf := 'C';
    ELSIF NEW.nilai_akhir >= 50 THEN
        NEW.nilai_huruf := 'D';
    ELSE
        NEW.nilai_huruf := 'E';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INVENTORY FUNCTIONS
-- ============================================================================

-- Update inventory availability
CREATE OR REPLACE FUNCTION update_inventory_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'approved') THEN
            UPDATE inventaris 
            SET jumlah_tersedia = jumlah_tersedia - NEW.jumlah_pinjam
            WHERE id = NEW.inventaris_id;
        ELSIF NEW.status = 'returned' AND OLD.status = 'approved' THEN
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

-- ============================================================================
-- QUIZ VALIDATION FUNCTIONS
-- ============================================================================

-- Validate quiz attempt
CREATE OR REPLACE FUNCTION validate_quiz_attempt()
RETURNS TRIGGER AS $$
DECLARE
    quiz_record RECORD;
    attempt_count INTEGER;
BEGIN
    -- Get quiz details
    SELECT * INTO quiz_record FROM kuis WHERE id = NEW.kuis_id;
    
    -- Check if quiz is published
    IF quiz_record.status != 'published' THEN
        RAISE EXCEPTION 'Quiz is not published';
    END IF;
    
    -- Check if within time range
    IF NOW() < quiz_record.tanggal_mulai OR NOW() > quiz_record.tanggal_selesai THEN
        RAISE EXCEPTION 'Quiz is not available at this time';
    END IF;
    
    -- Check attempt limit
    SELECT COUNT(*) INTO attempt_count
    FROM attempt_kuis
    WHERE kuis_id = NEW.kuis_id 
    AND mahasiswa_id = NEW.mahasiswa_id;
    
    IF attempt_count >= quiz_record.max_attempts THEN
        RAISE EXCEPTION 'Maximum attempts reached';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTO-CREATE USER PROFILE FUNCTION
-- ============================================================================

-- Handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
  user_role_text TEXT;
  user_role_enum user_role;
BEGIN
  -- Extract full_name from metadata
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1),
    'Unknown User'
  );
  
  -- Extract role from metadata
  user_role_text := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'mahasiswa'
  );
  
  -- Validate and cast role
  BEGIN
    user_role_enum := user_role_text::user_role;
  EXCEPTION
    WHEN OTHERS THEN
      user_role_enum := 'mahasiswa'::user_role;
  END;
  
  -- Insert into public.users
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_role_enum,
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, skip
      NULL;
    WHEN OTHERS THEN
      -- Log error but don't fail auth
      RAISE WARNING 'Error creating user profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- QUIZ HELPER FUNCTIONS
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- DATABASE HELPER FUNCTIONS
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