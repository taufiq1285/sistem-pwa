-- ============================================================================
-- QUIZ SYSTEM TABLES (CRITICAL - OFFLINE CAPABLE)
-- ============================================================================

-- Kuis (Quizzes)
CREATE TABLE kuis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    dosen_id UUID NOT NULL REFERENCES dosen(id) ON DELETE RESTRICT,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    durasi_menit INTEGER NOT NULL,
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 1,
    randomize_questions BOOLEAN DEFAULT false,
    randomize_options BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    allow_review BOOLEAN DEFAULT true,
    status quiz_status DEFAULT 'draft',
    
    -- Scheduling
    tanggal_mulai TIMESTAMPTZ NOT NULL,
    tanggal_selesai TIMESTAMPTZ NOT NULL,
    
    -- Offline support
    is_offline_capable BOOLEAN DEFAULT false,
    auto_save_interval INTEGER DEFAULT 30, -- seconds
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    CONSTRAINT kuis_durasi_check CHECK (durasi_menit > 0),
    CONSTRAINT kuis_passing_score_check CHECK (passing_score BETWEEN 0 AND 100),
    CONSTRAINT kuis_tanggal_check CHECK (tanggal_selesai > tanggal_mulai),
    CONSTRAINT kuis_max_attempts_check CHECK (max_attempts > 0)
);

-- Soal (Questions)
CREATE TABLE soal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    tipe question_type NOT NULL,
    pertanyaan TEXT NOT NULL,
    poin INTEGER NOT NULL DEFAULT 1,
    urutan INTEGER NOT NULL,
    
    -- Options for multiple choice/true-false
    pilihan_jawaban JSONB, -- [{text: "", isCorrect: boolean, feedback: ""}]
    
    -- For essay/short answer
    jawaban_benar TEXT, -- For short answer
    rubrik_penilaian JSONB, -- For essay grading
    
    pembahasan TEXT,
    media_url TEXT, -- Image/audio/video for question
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT soal_poin_check CHECK (poin > 0),
    CONSTRAINT soal_urutan_check CHECK (urutan > 0)
);

-- Attempt Kuis (Quiz Attempts)
CREATE TABLE attempt_kuis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kuis_id UUID NOT NULL REFERENCES kuis(id) ON DELETE CASCADE,
    mahasiswa_id UUID NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status attempt_status DEFAULT 'in_progress',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    time_spent INTEGER, -- seconds
    
    -- Scoring
    total_score DECIMAL(5,2),
    percentage DECIMAL(5,2),
    is_passed BOOLEAN,
    
    -- Offline support
    is_offline_attempt BOOLEAN DEFAULT false,
    sync_status sync_status DEFAULT 'synced',
    sync_attempted_at TIMESTAMPTZ,
    sync_error TEXT,
    device_id VARCHAR(255),
    
    -- Auto-save data
    last_auto_save_at TIMESTAMPTZ,
    auto_save_data JSONB, -- Cached answers before submission
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT attempt_kuis_unique UNIQUE(kuis_id, mahasiswa_id, attempt_number),
    CONSTRAINT attempt_score_check CHECK (total_score >= 0),
    CONSTRAINT attempt_percentage_check CHECK (percentage BETWEEN 0 AND 100)
);

-- Jawaban (Answers)
CREATE TABLE jawaban (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES attempt_kuis(id) ON DELETE CASCADE,
    soal_id UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
    jawaban_mahasiswa TEXT,
    jawaban_data JSONB, -- For complex answer types
    
    -- Scoring
    is_correct BOOLEAN,
    poin_diperoleh DECIMAL(5,2) DEFAULT 0,
    feedback TEXT,
    graded_by UUID REFERENCES dosen(id),
    graded_at TIMESTAMPTZ,
    
    -- Auto-save tracking
    is_auto_saved BOOLEAN DEFAULT false,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(attempt_id, soal_id)
);