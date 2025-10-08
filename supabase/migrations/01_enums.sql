-- ============================================================================
-- ENUMS
-- ============================================================================

-- User Roles
CREATE TYPE user_role AS ENUM ('admin', 'dosen', 'mahasiswa', 'laboran');

-- Gender
CREATE TYPE gender_type AS ENUM ('L', 'P');

-- Quiz Status
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');

-- Question Types
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'essay', 'short_answer');

-- Quiz Attempt Status
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'graded', 'pending_sync');

-- Borrowing Status
CREATE TYPE borrowing_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'overdue');

-- Equipment Condition
CREATE TYPE equipment_condition AS ENUM ('baik', 'rusak_ringan', 'rusak_berat', 'maintenance');

-- Day of Week
CREATE TYPE day_of_week AS ENUM ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu');

-- Sync Status
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed', 'conflict');

-- Conflict Resolution Strategy
CREATE TYPE conflict_strategy AS ENUM ('server_wins', 'client_wins', 'manual');