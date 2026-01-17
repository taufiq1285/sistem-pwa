/**
 * AUTO-GENERATED DATABASE TYPES
 * Generated from actual Supabase database schema
 * Last Updated: 2025-12-11
 *
 * DO NOT EDIT MANUALLY - Update this file by running database schema verification
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      // ====================================================================
      // USER MANAGEMENT TABLES
      // ====================================================================
      users: {
        Row: {
          id: string;
          instance_id: string | null;
          email: string;
          full_name: string;
          aud: string | null;
          role: string | null; // varchar - can be admin, dosen, mahasiswa, laboran
          avatar_url: string | null;
          is_active: boolean | null;
          encrypted_password: string | null;
          last_seen_at: string | null;
          email_confirmed_at: string | null;
          invited_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          confirmation_token: string | null;
          metadata: Json | null;
          confirmation_sent_at: string | null;
          recovery_token: string | null;
          recovery_sent_at: string | null;
          email_change_token_new: string | null;
          email_change: string | null;
          email_change_sent_at: string | null;
          last_sign_in_at: string | null;
          raw_app_meta_data: Json | null;
          raw_user_meta_data: Json | null;
          is_super_admin: boolean | null;
          phone: string | null;
          phone_confirmed_at: string | null;
          phone_change: string | null;
          phone_change_token: string | null;
          phone_change_sent_at: string | null;
          confirmed_at: string | null;
          email_change_token_current: string | null;
          email_change_confirm_status: number | null;
          banned_until: string | null;
          reauthentication_token: string | null;
          reauthentication_sent_at: string | null;
          is_sso_user: boolean;
          deleted_at: string | null;
          is_anonymous: boolean;
        };
        Insert: {
          id?: string;
          instance_id?: string | null;
          email: string;
          full_name: string;
          aud?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          is_active?: boolean | null;
          encrypted_password?: string | null;
          last_seen_at?: string | null;
          email_confirmed_at?: string | null;
          invited_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          confirmation_token?: string | null;
          metadata?: Json | null;
          confirmation_sent_at?: string | null;
          recovery_token?: string | null;
          recovery_sent_at?: string | null;
          email_change_token_new?: string | null;
          email_change?: string | null;
          email_change_sent_at?: string | null;
          last_sign_in_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          is_super_admin?: boolean | null;
          phone?: string | null;
          phone_confirmed_at?: string | null;
          phone_change?: string | null;
          phone_change_token?: string | null;
          phone_change_sent_at?: string | null;
          confirmed_at?: string | null;
          email_change_token_current?: string | null;
          email_change_confirm_status?: number | null;
          banned_until?: string | null;
          reauthentication_token?: string | null;
          reauthentication_sent_at?: string | null;
          is_sso_user?: boolean;
          deleted_at?: string | null;
          is_anonymous?: boolean;
        };
        Update: {
          id?: string;
          instance_id?: string | null;
          email?: string;
          full_name?: string;
          aud?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          is_active?: boolean | null;
          encrypted_password?: string | null;
          last_seen_at?: string | null;
          email_confirmed_at?: string | null;
          invited_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          confirmation_token?: string | null;
          metadata?: Json | null;
          confirmation_sent_at?: string | null;
          recovery_token?: string | null;
          recovery_sent_at?: string | null;
          email_change_token_new?: string | null;
          email_change?: string | null;
          email_change_sent_at?: string | null;
          last_sign_in_at?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
          is_super_admin?: boolean | null;
          phone?: string | null;
          phone_confirmed_at?: string | null;
          phone_change?: string | null;
          phone_change_token?: string | null;
          phone_change_sent_at?: string | null;
          confirmed_at?: string | null;
          email_change_token_current?: string | null;
          email_change_confirm_status?: number | null;
          banned_until?: string | null;
          reauthentication_token?: string | null;
          reauthentication_sent_at?: string | null;
          is_sso_user?: boolean;
          deleted_at?: string | null;
          is_anonymous?: boolean;
        };
        Relationships: [];
      };

      // ====================================================================
      // JADWAL PRAKTIKUM TABLE
      // ====================================================================
      jadwal_praktikum: {
        Row: {
          id: string;
          kelas_id: string;
          laboratorium_id: string;
          hari: Database["public"]["Enums"]["day_of_week"];
          jam_mulai: string; // time without time zone
          jam_selesai: string; // time without time zone
          minggu_ke: number | null;
          tanggal_praktikum: string | null; // date
          topik: string | null;
          deskripsi: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          catatan: string | null;
          status: string | null; // varchar - pending, approved, rejected, cancelled
          cancelled_by: string | null; // uuid
          cancelled_at: string | null; // timestamptz
          cancellation_reason: string | null;
        };
        Insert: {
          id?: string;
          kelas_id: string;
          laboratorium_id: string;
          hari: Database["public"]["Enums"]["day_of_week"];
          jam_mulai: string;
          jam_selesai: string;
          minggu_ke?: number | null;
          tanggal_praktikum?: string | null;
          topik?: string | null;
          deskripsi?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          catatan?: string | null;
          status?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
        };
        Update: {
          id?: string;
          kelas_id?: string;
          laboratorium_id?: string;
          hari?: Database["public"]["Enums"]["day_of_week"];
          jam_mulai?: string;
          jam_selesai?: string;
          minggu_ke?: number | null;
          tanggal_praktikum?: string | null;
          topik?: string | null;
          deskripsi?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          catatan?: string | null;
          status?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "jadwal_praktikum_kelas_id_fkey";
            columns: ["kelas_id"];
            isOneToOne: false;
            referencedRelation: "kelas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jadwal_praktikum_laboratorium_id_fkey";
            columns: ["laboratorium_id"];
            isOneToOne: false;
            referencedRelation: "laboratorium";
            referencedColumns: ["id"];
          },
        ];
      };

      // ====================================================================
      // KUIS TABLE
      // ====================================================================
      kuis: {
        Row: {
          id: string;
          kelas_id: string;
          dosen_id: string;
          judul: string;
          deskripsi: string | null;
          durasi_menit: number;
          passing_score: number | null;
          max_attempts: number | null;
          randomize_questions: boolean | null;
          randomize_options: boolean | null;
          show_results_immediately: boolean | null;
          allow_review: boolean | null;
          status: Database["public"]["Enums"]["quiz_status"] | null;
          tanggal_mulai: string;
          tanggal_selesai: string;
          is_offline_capable: boolean | null;
          auto_save_interval: number | null;
          version: number | null;
          created_at: string | null;
          updated_at: string | null;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          kelas_id: string;
          dosen_id: string;
          judul: string;
          deskripsi?: string | null;
          durasi_menit: number;
          passing_score?: number | null;
          max_attempts?: number | null;
          randomize_questions?: boolean | null;
          randomize_options?: boolean | null;
          show_results_immediately?: boolean | null;
          allow_review?: boolean | null;
          status?: Database["public"]["Enums"]["quiz_status"] | null;
          tanggal_mulai: string;
          tanggal_selesai: string;
          is_offline_capable?: boolean | null;
          auto_save_interval?: number | null;
          version?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          kelas_id?: string;
          dosen_id?: string;
          judul?: string;
          deskripsi?: string | null;
          durasi_menit?: number;
          passing_score?: number | null;
          max_attempts?: number | null;
          randomize_questions?: boolean | null;
          randomize_options?: boolean | null;
          show_results_immediately?: boolean | null;
          allow_review?: boolean | null;
          status?: Database["public"]["Enums"]["quiz_status"] | null;
          tanggal_mulai?: string;
          tanggal_selesai?: string;
          is_offline_capable?: boolean | null;
          auto_save_interval?: number | null;
          version?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "kuis_kelas_id_fkey";
            columns: ["kelas_id"];
            isOneToOne: false;
            referencedRelation: "kelas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kuis_dosen_id_fkey";
            columns: ["dosen_id"];
            isOneToOne: false;
            referencedRelation: "dosen";
            referencedColumns: ["id"];
          },
        ];
      };

      // ====================================================================
      // SOAL TABLE
      // ====================================================================
      soal: {
        Row: {
          id: string;
          kuis_id: string;
          tipe: Database["public"]["Enums"]["question_type"];
          pertanyaan: string;
          poin: number;
          urutan: number;
          pilihan_jawaban: Json | null; // JSONB
          jawaban_benar: string | null;
          rubrik_penilaian: Json | null; // JSONB
          pembahasan: string | null;
          media_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          kuis_id: string;
          tipe: Database["public"]["Enums"]["question_type"];
          pertanyaan: string;
          poin: number;
          urutan: number;
          pilihan_jawaban?: Json | null;
          jawaban_benar?: string | null;
          rubrik_penilaian?: Json | null;
          pembahasan?: string | null;
          media_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          kuis_id?: string;
          tipe?: Database["public"]["Enums"]["question_type"];
          pertanyaan?: string;
          poin?: number;
          urutan?: number;
          pilihan_jawaban?: Json | null;
          jawaban_benar?: string | null;
          rubrik_penilaian?: Json | null;
          pembahasan?: string | null;
          media_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "soal_kuis_id_fkey";
            columns: ["kuis_id"];
            isOneToOne: false;
            referencedRelation: "kuis";
            referencedColumns: ["id"];
          },
        ];
      };

      // ====================================================================
      // JAWABAN TABLE
      // ====================================================================
      jawaban: {
        Row: {
          id: string;
          attempt_id: string;
          soal_id: string;
          jawaban_mahasiswa: string | null;
          jawaban_data: Json | null; // JSONB
          is_correct: boolean | null;
          poin_diperoleh: number | null;
          feedback: string | null;
          graded_by: string | null; // uuid
          graded_at: string | null;
          is_auto_saved: boolean | null;
          saved_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          soal_id: string;
          jawaban_mahasiswa?: string | null;
          jawaban_data?: Json | null;
          is_correct?: boolean | null;
          poin_diperoleh?: number | null;
          feedback?: string | null;
          graded_by?: string | null;
          graded_at?: string | null;
          is_auto_saved?: boolean | null;
          saved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          soal_id?: string;
          jawaban_mahasiswa?: string | null;
          jawaban_data?: Json | null;
          is_correct?: boolean | null;
          poin_diperoleh?: number | null;
          feedback?: string | null;
          graded_by?: string | null;
          graded_at?: string | null;
          is_auto_saved?: boolean | null;
          saved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "jawaban_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "attempt_kuis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jawaban_soal_id_fkey";
            columns: ["soal_id"];
            isOneToOne: false;
            referencedRelation: "soal";
            referencedColumns: ["id"];
          },
        ];
      };

      // ====================================================================
      // ATTEMPT KUIS TABLE
      // ====================================================================
      attempt_kuis: {
        Row: {
          id: string;
          kuis_id: string;
          mahasiswa_id: string;
          attempt_number: number;
          started_at: string | null;
          submitted_at: string | null;
          status: Database["public"]["Enums"]["attempt_status"] | null;
          total_score: number | null;
          percentage: number | null;
          is_passed: boolean | null;
          time_spent: number | null;
          auto_save_data: Json | null;
          last_auto_save_at: string | null;
          is_offline_attempt: boolean | null;
          device_id: string | null;
          sync_status: Database["public"]["Enums"]["sync_status"] | null;
          sync_attempted_at: string | null;
          sync_error: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          kuis_id: string;
          mahasiswa_id: string;
          attempt_number?: number;
          started_at?: string | null;
          submitted_at?: string | null;
          status?: Database["public"]["Enums"]["attempt_status"] | null;
          total_score?: number | null;
          percentage?: number | null;
          is_passed?: boolean | null;
          time_spent?: number | null;
          auto_save_data?: Json | null;
          last_auto_save_at?: string | null;
          is_offline_attempt?: boolean | null;
          device_id?: string | null;
          sync_status?: Database["public"]["Enums"]["sync_status"] | null;
          sync_attempted_at?: string | null;
          sync_error?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          kuis_id?: string;
          mahasiswa_id?: string;
          attempt_number?: number;
          started_at?: string | null;
          submitted_at?: string | null;
          status?: Database["public"]["Enums"]["attempt_status"] | null;
          total_score?: number | null;
          percentage?: number | null;
          is_passed?: boolean | null;
          time_spent?: number | null;
          auto_save_data?: Json | null;
          last_auto_save_at?: string | null;
          is_offline_attempt?: boolean | null;
          device_id?: string | null;
          sync_status?: Database["public"]["Enums"]["sync_status"] | null;
          sync_attempted_at?: string | null;
          sync_error?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attempt_kuis_kuis_id_fkey";
            columns: ["kuis_id"];
            isOneToOne: false;
            referencedRelation: "kuis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempt_kuis_mahasiswa_id_fkey";
            columns: ["mahasiswa_id"];
            isOneToOne: false;
            referencedRelation: "mahasiswa";
            referencedColumns: ["id"];
          },
        ];
      };

      // ====================================================================
      // BASIC TABLES (SIMPLIFIED)
      // ====================================================================
      admin: {
        Row: {
          id: string;
          user_id: string;
          level: string | null;
          permissions: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          level?: string | null;
          permissions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          level?: string | null;
          permissions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      mahasiswa: {
        Row: {
          id: string;
          user_id: string;
          nim: string;
          nama: string;
          jenis_kelamin: Database["public"]["Enums"]["gender_type"] | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          nim: string;
          nama: string;
          jenis_kelamin?: Database["public"]["Enums"]["gender_type"] | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          nim?: string;
          nama?: string;
          jenis_kelamin?: Database["public"]["Enums"]["gender_type"] | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: [];
      };

      dosen: {
        Row: {
          id: string;
          user_id: string;
          nip: string;
          nama: string;
          jenis_kelamin: Database["public"]["Enums"]["gender_type"] | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          nip: string;
          nama: string;
          jenis_kelamin?: Database["public"]["Enums"]["gender_type"] | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          nip?: string;
          nama?: string;
          jenis_kelamin?: Database["public"]["Enums"]["gender_type"] | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Relationships: [];
      };

      kelas: {
        Row: {
          id: string;
          nama_kelas: string;
          dosen_id: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          nama_kelas: string;
          dosen_id?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          nama_kelas?: string;
          dosen_id?: string | null;
          [key: string]: any;
        };
        Relationships: [];
      };

      kelas_mahasiswa: {
        Row: {
          id: string;
          kelas_id: string;
          mahasiswa_id: string;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          kelas_id: string;
          mahasiswa_id: string;
          [key: string]: any;
        };
        Update: {
          id?: string;
          kelas_id?: string;
          mahasiswa_id?: string;
          [key: string]: any;
        };
        Relationships: [];
      };

      laboratorium: {
        Row: {
          id: string;
          nama_lab: string;
          kode_lab: string;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          nama_lab: string;
          kode_lab: string;
          [key: string]: any;
        };
        Update: {
          id?: string;
          nama_lab?: string;
          kode_lab?: string;
          [key: string]: any;
        };
        Relationships: [];
      };

      kehadiran: {
        Row: {
          id: string;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          [key: string]: any;
        };
        Update: {
          id?: string;
          [key: string]: any;
        };
        Relationships: [];
      };

      inventaris: {
        Row: {
          id: string;
          nama: string;
          kondisi: Database["public"]["Enums"]["equipment_condition"] | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          nama: string;
          kondisi?: Database["public"]["Enums"]["equipment_condition"] | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          nama?: string;
          kondisi?: Database["public"]["Enums"]["equipment_condition"] | null;
          [key: string]: any;
        };
        Relationships: [];
      };

      peminjaman: {
        Row: {
          id: string;
          status: Database["public"]["Enums"]["borrowing_status"] | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          status?: Database["public"]["Enums"]["borrowing_status"] | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          status?: Database["public"]["Enums"]["borrowing_status"] | null;
          [key: string]: any;
        };
        Relationships: [];
      };

      mata_kuliah: {
        Row: {
          id: string;
          nama_mk: string;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          nama_mk: string;
          [key: string]: any;
        };
        Update: {
          id?: string;
          nama_mk?: string;
          [key: string]: any;
        };
        Relationships: [];
      };

      // Placeholder for other tables
      [key: string]: any;
    };

    Views: {
      [key: string]: {
        Row: {
          [key: string]: any;
        };
        Relationships: [];
      };
    };

    Functions: {
      [key: string]: {
        Args: {
          [key: string]: any;
        };
        Returns: any;
      };
    };

    Enums: {
      aal_level: "aal1" | "aal2" | "aal3";
      action: "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "ERROR";
      attempt_status:
        | "in_progress"
        | "submitted"
        | "graded"
        | "pending_sync"
        | "pending"
        | "completed"
        | "abandoned";
      borrowing_status:
        | "pending"
        | "approved"
        | "rejected"
        | "returned"
        | "overdue";
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR";
      code_challenge_method: "s256" | "plain";
      conflict_strategy: "server_wins" | "client_wins" | "manual";
      day_of_week:
        | "senin"
        | "selasa"
        | "rabu"
        | "kamis"
        | "jumat"
        | "sabtu"
        | "minggu";
      equality_op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in";
      equipment_condition:
        | "baik"
        | "rusak_ringan"
        | "rusak_berat"
        | "maintenance";
      factor_status: "unverified" | "verified";
      factor_type: "totp" | "webauthn" | "phone";
      gender_type: "L" | "P";
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired";
      oauth_client_type: "public" | "confidential";
      oauth_registration_type: "dynamic" | "manual";
      oauth_response_type: "code";
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token";
      question_type:
        | "multiple_choice"
        | "true_false"
        | "essay"
        | "short_answer";
      quiz_status: "draft" | "published" | "archived";
      sync_status: "pending" | "syncing" | "synced" | "failed" | "conflict";
      user_role: "admin" | "dosen" | "mahasiswa" | "laboran";
    };

    CompositeTypes: {
      [key: string]: {
        [key: string]: any;
      };
    };
  };
};
