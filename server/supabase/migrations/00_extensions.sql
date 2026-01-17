-- ============================================================================
-- MIGRATION 00: EXTENSIONS & ENUMS
-- PostgreSQL extensions and custom types
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- ============================================================================
-- 2. ENUMS
-- ============================================================================

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Gender
DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('L', 'P');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Days of week
DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Quiz status
DO $$ BEGIN
    CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Question types
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('multiple_choice', 'essay', 'true_false');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Attempt status
DO $$ BEGIN
    CREATE TYPE attempt_status AS ENUM ('pending', 'in_progress', 'completed', 'graded', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sync status (for offline)
DO $$ BEGIN
    CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Equipment condition
DO $$ BEGIN
    CREATE TYPE equipment_condition AS ENUM ('baik', 'rusak_ringan', 'rusak_berat', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Borrowing status
DO $$ BEGIN
    CREATE TYPE borrowing_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;