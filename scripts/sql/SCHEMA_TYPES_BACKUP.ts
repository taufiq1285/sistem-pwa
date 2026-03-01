Forgot your password? Reset it from the Dashboard: https://supabase.com/dashboard/project/rkyoifqbfcztnhevpnpx/settings/database
Enter your database password: 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          permissions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_kuis: {
        Row: {
          _version: number
          attempt_number: number
          auto_save_data: Json | null
          created_at: string | null
          device_id: string | null
          id: string
          is_offline_attempt: boolean | null
          is_passed: boolean | null
          kuis_id: string
          last_auto_save_at: string | null
          mahasiswa_id: string
          percentage: number | null
          sisa_waktu: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at: string | null
          sync_attempted_at: string | null
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          time_spent: number | null
          total_poin: number | null
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          _version?: number
          attempt_number?: number
          auto_save_data?: Json | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_offline_attempt?: boolean | null
          is_passed?: boolean | null
          kuis_id: string
          last_auto_save_at?: string | null
          mahasiswa_id: string
          percentage?: number | null
          sisa_waktu?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at?: string | null
          sync_attempted_at?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          time_spent?: number | null
          total_poin?: number | null
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          _version?: number
          attempt_number?: number
          auto_save_data?: Json | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_offline_attempt?: boolean | null
          is_passed?: boolean | null
          kuis_id?: string
          last_auto_save_at?: string | null
          mahasiswa_id?: string
          percentage?: number | null
          sisa_waktu?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at?: string | null
          sync_attempted_at?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          time_spent?: number | null
          total_poin?: number | null
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_kuis_kuis_id_fkey"
            columns: ["kuis_id"]
            isOneToOne: false
            referencedRelation: "kuis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_kuis_kuis_id_fkey"
            columns: ["kuis_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kuis_id"]
          },
          {
            foreignKeyName: "attempt_kuis_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          request_method: string | null
          request_path: string | null
          resource_description: string | null
          resource_id: string | null
          resource_type: string
          success: boolean | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_role: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          request_method?: string | null
          request_path?: string | null
          resource_description?: string | null
          resource_id?: string | null
          resource_type: string
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          request_method?: string | null
          request_path?: string | null
          resource_description?: string | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs_archive: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          request_method: string | null
          request_path: string | null
          resource_description: string | null
          resource_id: string | null
          resource_type: string
          success: boolean | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
          user_role: string
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          request_method?: string | null
          request_path?: string | null
          resource_description?: string | null
          resource_id?: string | null
          resource_type: string
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role: string
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          request_method?: string | null
          request_path?: string | null
          resource_description?: string | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
          user_role?: string
        }
        Relationships: []
      }
      bank_soal: {
        Row: {
          created_at: string | null
          dosen_id: string
          id: string
          is_public: boolean | null
          jawaban_benar: string | null
          mata_kuliah_id: string | null
          opsi_jawaban: Json | null
          penjelasan: string | null
          pertanyaan: string
          poin: number
          tags: string[] | null
          tipe_soal: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          dosen_id: string
          id?: string
          is_public?: boolean | null
          jawaban_benar?: string | null
          mata_kuliah_id?: string | null
          opsi_jawaban?: Json | null
          penjelasan?: string | null
          pertanyaan: string
          poin?: number
          tags?: string[] | null
          tipe_soal: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          dosen_id?: string
          id?: string
          is_public?: boolean | null
          jawaban_benar?: string | null
          mata_kuliah_id?: string | null
          opsi_jawaban?: Json | null
          penjelasan?: string | null
          pertanyaan?: string
          poin?: number
          tags?: string[] | null
          tipe_soal?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_soal_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_soal_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_metadata: {
        Row: {
          cache_key: string
          cached_at: string | null
          data_hash: string | null
          expires_at: string | null
          id: string
          last_modified_at: string | null
          record_id: string
          table_name: string
          user_id: string
          version: number | null
        }
        Insert: {
          cache_key: string
          cached_at?: string | null
          data_hash?: string | null
          expires_at?: string | null
          id?: string
          last_modified_at?: string | null
          record_id: string
          table_name: string
          user_id: string
          version?: number | null
        }
        Update: {
          cache_key?: string
          cached_at?: string | null
          data_hash?: string | null
          expires_at?: string | null
          id?: string
          last_modified_at?: string | null
          record_id?: string
          table_name?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cache_metadata_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conflict_log: {
        Row: {
          client_data: Json
          created_at: string | null
          id: string
          local_version: number | null
          queue_item_id: string | null
          record_id: string
          remote_version: number | null
          resolution_strategy: Database["public"]["Enums"]["conflict_strategy"]
          resolved_at: string | null
          resolved_by: string | null
          resolved_data: Json | null
          server_data: Json
          status: string | null
          table_name: string
          user_id: string
          winner: string | null
        }
        Insert: {
          client_data: Json
          created_at?: string | null
          id?: string
          local_version?: number | null
          queue_item_id?: string | null
          record_id: string
          remote_version?: number | null
          resolution_strategy: Database["public"]["Enums"]["conflict_strategy"]
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_data?: Json | null
          server_data: Json
          status?: string | null
          table_name: string
          user_id: string
          winner?: string | null
        }
        Update: {
          client_data?: Json
          created_at?: string | null
          id?: string
          local_version?: number | null
          queue_item_id?: string | null
          record_id?: string
          remote_version?: number | null
          resolution_strategy?: Database["public"]["Enums"]["conflict_strategy"]
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_data?: Json | null
          server_data?: Json
          status?: string | null
          table_name?: string
          user_id?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conflict_log_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "offline_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_log_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conflict_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dosen: {
        Row: {
          created_at: string | null
          fakultas: string | null
          gelar_belakang: string | null
          gelar_depan: string | null
          id: string
          nidn: string | null
          nip: string | null
          nuptk: string | null
          office_room: string | null
          phone: string | null
          program_studi: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fakultas?: string | null
          gelar_belakang?: string | null
          gelar_depan?: string | null
          id?: string
          nidn?: string | null
          nip?: string | null
          nuptk?: string | null
          office_room?: string | null
          phone?: string | null
          program_studi?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fakultas?: string | null
          gelar_belakang?: string | null
          gelar_depan?: string | null
          id?: string
          nidn?: string | null
          nip?: string | null
          nuptk?: string | null
          office_room?: string | null
          phone?: string | null
          program_studi?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dosen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dosen_mata_kuliah: {
        Row: {
          created_at: string | null
          dosen_id: string
          id: string
          is_active: boolean | null
          mata_kuliah_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dosen_id: string
          id?: string
          is_active?: boolean | null
          mata_kuliah_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dosen_id?: string
          id?: string
          is_active?: boolean | null
          mata_kuliah_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_dosen_mk_dosen"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dosen_mk_mata_kuliah"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      inventaris: {
        Row: {
          created_at: string | null
          foto_url: string | null
          harga_satuan: number | null
          id: string
          is_available_for_borrowing: boolean | null
          jumlah: number
          jumlah_tersedia: number
          kategori: string | null
          keterangan: string | null
          kode_barang: string
          kondisi: Database["public"]["Enums"]["equipment_condition"] | null
          laboratorium_id: string | null
          merk: string | null
          nama_barang: string
          spesifikasi: string | null
          tahun_pengadaan: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          foto_url?: string | null
          harga_satuan?: number | null
          id?: string
          is_available_for_borrowing?: boolean | null
          jumlah?: number
          jumlah_tersedia?: number
          kategori?: string | null
          keterangan?: string | null
          kode_barang: string
          kondisi?: Database["public"]["Enums"]["equipment_condition"] | null
          laboratorium_id?: string | null
          merk?: string | null
          nama_barang: string
          spesifikasi?: string | null
          tahun_pengadaan?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          foto_url?: string | null
          harga_satuan?: number | null
          id?: string
          is_available_for_borrowing?: boolean | null
          jumlah?: number
          jumlah_tersedia?: number
          kategori?: string | null
          keterangan?: string | null
          kode_barang?: string
          kondisi?: Database["public"]["Enums"]["equipment_condition"] | null
          laboratorium_id?: string | null
          merk?: string | null
          nama_barang?: string
          spesifikasi?: string | null
          tahun_pengadaan?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventaris_laboratorium_id_fkey"
            columns: ["laboratorium_id"]
            isOneToOne: false
            referencedRelation: "laboratorium"
            referencedColumns: ["id"]
          },
        ]
      }
      jadwal_praktikum: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          catatan: string | null
          created_at: string | null
          deskripsi: string | null
          dosen_id: string | null
          hari: Database["public"]["Enums"]["day_of_week"]
          id: string
          is_active: boolean | null
          jam_mulai: string
          jam_selesai: string
          kelas_id: string
          laboratorium_id: string
          mata_kuliah_id: string | null
          minggu_ke: number | null
          status: string | null
          tanggal_praktikum: string | null
          topik: string | null
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          catatan?: string | null
          created_at?: string | null
          deskripsi?: string | null
          dosen_id?: string | null
          hari: Database["public"]["Enums"]["day_of_week"]
          id?: string
          is_active?: boolean | null
          jam_mulai: string
          jam_selesai: string
          kelas_id: string
          laboratorium_id: string
          mata_kuliah_id?: string | null
          minggu_ke?: number | null
          status?: string | null
          tanggal_praktikum?: string | null
          topik?: string | null
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          catatan?: string | null
          created_at?: string | null
          deskripsi?: string | null
          dosen_id?: string | null
          hari?: Database["public"]["Enums"]["day_of_week"]
          id?: string
          is_active?: boolean | null
          jam_mulai?: string
          jam_selesai?: string
          kelas_id?: string
          laboratorium_id?: string
          mata_kuliah_id?: string | null
          minggu_ke?: number | null
          status?: string | null
          tanggal_praktikum?: string | null
          topik?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jadwal_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "jadwal_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "jadwal_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "jadwal_praktikum_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_praktikum_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_praktikum_laboratorium_id_fkey"
            columns: ["laboratorium_id"]
            isOneToOne: false
            referencedRelation: "laboratorium"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_praktikum_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      jawaban: {
        Row: {
          _version: number
          attempt_id: string
          created_at: string | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          is_auto_saved: boolean | null
          is_correct: boolean | null
          jawaban_data: Json | null
          jawaban_mahasiswa: string | null
          poin_diperoleh: number | null
          saved_at: string | null
          soal_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          _version?: number
          attempt_id: string
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_auto_saved?: boolean | null
          is_correct?: boolean | null
          jawaban_data?: Json | null
          jawaban_mahasiswa?: string | null
          poin_diperoleh?: number | null
          saved_at?: string | null
          soal_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          _version?: number
          attempt_id?: string
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          is_auto_saved?: boolean | null
          is_correct?: boolean | null
          jawaban_data?: Json | null
          jawaban_mahasiswa?: string | null
          poin_diperoleh?: number | null
          saved_at?: string | null
          soal_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jawaban_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempt_kuis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jawaban_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jawaban_soal_id_fkey"
            columns: ["soal_id"]
            isOneToOne: false
            referencedRelation: "soal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jawaban_soal_id_fkey"
            columns: ["soal_id"]
            isOneToOne: false
            referencedRelation: "soal_mahasiswa"
            referencedColumns: ["id"]
          },
        ]
      }
      kehadiran: {
        Row: {
          created_at: string | null
          id: string
          jadwal_id: string | null
          kelas_id: string | null
          keterangan: string | null
          mahasiswa_id: string
          mata_kuliah_id: string | null
          status: string
          tanggal: string | null
          updated_at: string | null
          waktu_check_in: string | null
          waktu_check_out: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          jadwal_id?: string | null
          kelas_id?: string | null
          keterangan?: string | null
          mahasiswa_id: string
          mata_kuliah_id?: string | null
          status?: string
          tanggal?: string | null
          updated_at?: string | null
          waktu_check_in?: string | null
          waktu_check_out?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          jadwal_id?: string | null
          kelas_id?: string | null
          keterangan?: string | null
          mahasiswa_id?: string
          mata_kuliah_id?: string | null
          status?: string
          tanggal?: string | null
          updated_at?: string | null
          waktu_check_in?: string | null
          waktu_check_out?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kehadiran_jadwal_id_fkey"
            columns: ["jadwal_id"]
            isOneToOne: false
            referencedRelation: "jadwal_praktikum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kehadiran_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kehadiran_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kehadiran_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kehadiran_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kehadiran_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kehadiran_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas: {
        Row: {
          bobot_nilai: Json | null
          created_at: string | null
          dosen_id: string | null
          id: string
          is_active: boolean | null
          kode_kelas: string | null
          kuota: number | null
          mata_kuliah_id: string | null
          nama_kelas: string
          ruangan: string | null
          semester_ajaran: number
          tahun_ajaran: string
          updated_at: string | null
        }
        Insert: {
          bobot_nilai?: Json | null
          created_at?: string | null
          dosen_id?: string | null
          id?: string
          is_active?: boolean | null
          kode_kelas?: string | null
          kuota?: number | null
          mata_kuliah_id?: string | null
          nama_kelas: string
          ruangan?: string | null
          semester_ajaran: number
          tahun_ajaran: string
          updated_at?: string | null
        }
        Update: {
          bobot_nilai?: Json | null
          created_at?: string | null
          dosen_id?: string | null
          id?: string
          is_active?: boolean | null
          kode_kelas?: string | null
          kuota?: number | null
          mata_kuliah_id?: string | null
          nama_kelas?: string
          ruangan?: string | null
          semester_ajaran?: number
          tahun_ajaran?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas_dosen_assignment: {
        Row: {
          created_at: string | null
          dosen_id: string
          id: string
          is_koordinator: boolean | null
          kelas_id: string
          mata_kuliah_id: string
          pertemuan_dari: number
          pertemuan_sampai: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dosen_id: string
          id?: string
          is_koordinator?: boolean | null
          kelas_id: string
          mata_kuliah_id: string
          pertemuan_dari: number
          pertemuan_sampai: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dosen_id?: string
          id?: string
          is_koordinator?: boolean | null
          kelas_id?: string
          mata_kuliah_id?: string
          pertemuan_dari?: number
          pertemuan_sampai?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_dosen_assignment_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_dosen_assignment_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_dosen_assignment_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kelas_dosen_assignment_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kelas_dosen_assignment_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kelas_dosen_assignment_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas_mahasiswa: {
        Row: {
          enrolled_at: string | null
          id: string
          is_active: boolean | null
          kelas_id: string
          mahasiswa_id: string
          semester_saat_enroll: number | null
          semester_terakhir: number | null
        }
        Insert: {
          enrolled_at?: string | null
          id?: string
          is_active?: boolean | null
          kelas_id: string
          mahasiswa_id: string
          semester_saat_enroll?: number | null
          semester_terakhir?: number | null
        }
        Update: {
          enrolled_at?: string | null
          id?: string
          is_active?: boolean | null
          kelas_id?: string
          mahasiswa_id?: string
          semester_saat_enroll?: number | null
          semester_terakhir?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_mahasiswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_mahasiswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kelas_mahasiswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kelas_mahasiswa_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kelas_mahasiswa_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
        ]
      }
      kuis: {
        Row: {
          allow_review: boolean | null
          auto_save_interval: number | null
          created_at: string | null
          deskripsi: string | null
          dosen_id: string
          durasi_menit: number
          id: string
          is_offline_capable: boolean | null
          judul: string
          kelas_id: string
          mata_kuliah_id: string | null
          max_attempts: number | null
          passing_score: number | null
          published_at: string | null
          randomize_options: boolean | null
          randomize_questions: boolean | null
          show_results_immediately: boolean | null
          status: Database["public"]["Enums"]["quiz_status"] | null
          tanggal_mulai: string
          tanggal_selesai: string
          tipe_kuis: Database["public"]["Enums"]["kuis_type"] | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          allow_review?: boolean | null
          auto_save_interval?: number | null
          created_at?: string | null
          deskripsi?: string | null
          dosen_id: string
          durasi_menit: number
          id?: string
          is_offline_capable?: boolean | null
          judul: string
          kelas_id: string
          mata_kuliah_id?: string | null
          max_attempts?: number | null
          passing_score?: number | null
          published_at?: string | null
          randomize_options?: boolean | null
          randomize_questions?: boolean | null
          show_results_immediately?: boolean | null
          status?: Database["public"]["Enums"]["quiz_status"] | null
          tanggal_mulai: string
          tanggal_selesai: string
          tipe_kuis?: Database["public"]["Enums"]["kuis_type"] | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          allow_review?: boolean | null
          auto_save_interval?: number | null
          created_at?: string | null
          deskripsi?: string | null
          dosen_id?: string
          durasi_menit?: number
          id?: string
          is_offline_capable?: boolean | null
          judul?: string
          kelas_id?: string
          mata_kuliah_id?: string | null
          max_attempts?: number | null
          passing_score?: number | null
          published_at?: string | null
          randomize_options?: boolean | null
          randomize_questions?: boolean | null
          show_results_immediately?: boolean | null
          status?: Database["public"]["Enums"]["quiz_status"] | null
          tanggal_mulai?: string
          tanggal_selesai?: string
          tipe_kuis?: Database["public"]["Enums"]["kuis_type"] | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kuis_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kuis_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kuis_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kuis_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kuis_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "kuis_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      laboran: {
        Row: {
          created_at: string | null
          id: string
          nip: string
          phone: string | null
          shift: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nip: string
          phone?: string | null
          shift?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nip?: string
          phone?: string | null
          shift?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboran_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratorium: {
        Row: {
          created_at: string | null
          fasilitas: string[] | null
          id: string
          is_active: boolean | null
          kapasitas: number | null
          keterangan: string | null
          kode_lab: string
          lokasi: string | null
          nama_lab: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fasilitas?: string[] | null
          id?: string
          is_active?: boolean | null
          kapasitas?: number | null
          keterangan?: string | null
          kode_lab: string
          lokasi?: string | null
          nama_lab: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fasilitas?: string[] | null
          id?: string
          is_active?: boolean | null
          kapasitas?: number | null
          keterangan?: string | null
          kode_lab?: string
          lokasi?: string | null
          nama_lab?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      logbook_entries: {
        Row: {
          catatan_tambahan: string | null
          created_at: string
          created_by: string | null
          dosen_feedback: string | null
          dosen_id: string | null
          graded_at: string | null
          hasil_observasi: string | null
          id: string
          jadwal_id: string
          kendala_dihadapi: string | null
          mahasiswa_id: string
          nilai: number | null
          prosedur_dilakukan: string | null
          refleksi: string | null
          reviewed_at: string | null
          skill_dipelajari: string[] | null
          status: string
          submitted_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          catatan_tambahan?: string | null
          created_at?: string
          created_by?: string | null
          dosen_feedback?: string | null
          dosen_id?: string | null
          graded_at?: string | null
          hasil_observasi?: string | null
          id?: string
          jadwal_id: string
          kendala_dihadapi?: string | null
          mahasiswa_id: string
          nilai?: number | null
          prosedur_dilakukan?: string | null
          refleksi?: string | null
          reviewed_at?: string | null
          skill_dipelajari?: string[] | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          catatan_tambahan?: string | null
          created_at?: string
          created_by?: string | null
          dosen_feedback?: string | null
          dosen_id?: string | null
          graded_at?: string | null
          hasil_observasi?: string | null
          id?: string
          jadwal_id?: string
          kendala_dihadapi?: string | null
          mahasiswa_id?: string
          nilai?: number | null
          prosedur_dilakukan?: string | null
          refleksi?: string | null
          reviewed_at?: string | null
          skill_dipelajari?: string[] | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logbook_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_jadwal_id_fkey"
            columns: ["jadwal_id"]
            isOneToOne: false
            referencedRelation: "jadwal_praktikum"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logbook_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mahasiswa: {
        Row: {
          address: string | null
          angkatan: number
          created_at: string | null
          date_of_birth: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          nim: string
          phone: string | null
          program_studi: string
          semester: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          angkatan: number
          created_at?: string | null
          date_of_birth?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          nim: string
          phone?: string | null
          program_studi: string
          semester?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          angkatan?: number
          created_at?: string | null
          date_of_birth?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          nim?: string
          phone?: string | null
          program_studi?: string
          semester?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mahasiswa_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mahasiswa_semester_audit: {
        Row: {
          id: string
          mahasiswa_id: string
          notes: string | null
          semester_baru: number
          semester_lama: number
          updated_at: string | null
          updated_by_admin_id: string | null
        }
        Insert: {
          id?: string
          mahasiswa_id: string
          notes?: string | null
          semester_baru: number
          semester_lama: number
          updated_at?: string | null
          updated_by_admin_id?: string | null
        }
        Update: {
          id?: string
          mahasiswa_id?: string
          notes?: string | null
          semester_baru?: number
          semester_lama?: number
          updated_at?: string | null
          updated_by_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mahasiswa_semester_audit_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
        ]
      }
      mata_kuliah: {
        Row: {
          created_at: string | null
          deskripsi: string | null
          id: string
          is_active: boolean | null
          kode_mk: string
          nama_mk: string
          program_studi: string
          semester: number
          silabus_url: string | null
          sks: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deskripsi?: string | null
          id?: string
          is_active?: boolean | null
          kode_mk: string
          nama_mk: string
          program_studi: string
          semester: number
          silabus_url?: string | null
          sks: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deskripsi?: string | null
          id?: string
          is_active?: boolean | null
          kode_mk?: string
          nama_mk?: string
          program_studi?: string
          semester?: number
          silabus_url?: string | null
          sks?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      materi: {
        Row: {
          cache_version: number | null
          created_at: string | null
          deskripsi: string | null
          dosen_id: string
          download_count: number | null
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean | null
          is_downloadable: boolean | null
          judul: string
          kelas_id: string
          last_cached_at: string | null
          minggu_ke: number | null
          published_at: string | null
          tipe_file: string | null
          updated_at: string | null
        }
        Insert: {
          cache_version?: number | null
          created_at?: string | null
          deskripsi?: string | null
          dosen_id: string
          download_count?: number | null
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean | null
          is_downloadable?: boolean | null
          judul: string
          kelas_id: string
          last_cached_at?: string | null
          minggu_ke?: number | null
          published_at?: string | null
          tipe_file?: string | null
          updated_at?: string | null
        }
        Update: {
          cache_version?: number | null
          created_at?: string | null
          deskripsi?: string | null
          dosen_id?: string
          download_count?: number | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          is_downloadable?: boolean | null
          judul?: string
          kelas_id?: string
          last_cached_at?: string | null
          minggu_ke?: number | null
          published_at?: string | null
          tipe_file?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materi_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "materi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "materi_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
        ]
      }
      nilai: {
        Row: {
          created_at: string | null
          id: string
          kelas_id: string
          keterangan: string | null
          mahasiswa_id: string
          mata_kuliah_id: string | null
          nilai_akhir: number | null
          nilai_huruf: string | null
          nilai_kehadiran: number | null
          nilai_kuis: number | null
          nilai_praktikum: number | null
          nilai_tugas: number | null
          nilai_uas: number | null
          nilai_uts: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          kelas_id: string
          keterangan?: string | null
          mahasiswa_id: string
          mata_kuliah_id?: string | null
          nilai_akhir?: number | null
          nilai_huruf?: string | null
          nilai_kehadiran?: number | null
          nilai_kuis?: number | null
          nilai_praktikum?: number | null
          nilai_tugas?: number | null
          nilai_uas?: number | null
          nilai_uts?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          kelas_id?: string
          keterangan?: string | null
          mahasiswa_id?: string
          mata_kuliah_id?: string | null
          nilai_akhir?: number | null
          nilai_huruf?: string | null
          nilai_kehadiran?: number | null
          nilai_kuis?: number | null
          nilai_praktikum?: number | null
          nilai_tugas?: number | null
          nilai_uas?: number | null
          nilai_uts?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nilai_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "nilai_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "nilai_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "nilai_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_queue: {
        Row: {
          attempt_count: number | null
          client_timestamp: string | null
          conflict_data: Json | null
          conflict_resolution:
            | Database["public"]["Enums"]["conflict_strategy"]
            | null
          created_at: string | null
          data: Json
          device_id: string | null
          error_message: string | null
          error_stack: string | null
          has_conflict: boolean | null
          id: string
          last_attempt_at: string | null
          max_attempts: number | null
          operation: string
          priority: number | null
          record_id: string | null
          status: Database["public"]["Enums"]["sync_status"] | null
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          attempt_count?: number | null
          client_timestamp?: string | null
          conflict_data?: Json | null
          conflict_resolution?:
            | Database["public"]["Enums"]["conflict_strategy"]
            | null
          created_at?: string | null
          data: Json
          device_id?: string | null
          error_message?: string | null
          error_stack?: string | null
          has_conflict?: boolean | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          operation: string
          priority?: number | null
          record_id?: string | null
          status?: Database["public"]["Enums"]["sync_status"] | null
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          attempt_count?: number | null
          client_timestamp?: string | null
          conflict_data?: Json | null
          conflict_resolution?:
            | Database["public"]["Enums"]["conflict_strategy"]
            | null
          created_at?: string | null
          data?: Json
          device_id?: string | null
          error_message?: string | null
          error_stack?: string | null
          has_conflict?: boolean | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number | null
          operation?: string
          priority?: number | null
          record_id?: string | null
          status?: Database["public"]["Enums"]["sync_status"] | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      peminjaman: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          denda: number | null
          dosen_id: string | null
          id: string
          inventaris_id: string
          jumlah_pinjam: number
          keperluan: string
          keterangan_kembali: string | null
          kondisi_kembali:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          kondisi_pinjam:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          peminjam_id: string
          peminjam_id_backup: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["borrowing_status"] | null
          tanggal_kembali_aktual: string | null
          tanggal_kembali_rencana: string
          tanggal_pinjam: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          denda?: number | null
          dosen_id?: string | null
          id?: string
          inventaris_id: string
          jumlah_pinjam?: number
          keperluan: string
          keterangan_kembali?: string | null
          kondisi_kembali?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          kondisi_pinjam?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          peminjam_id: string
          peminjam_id_backup?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["borrowing_status"] | null
          tanggal_kembali_aktual?: string | null
          tanggal_kembali_rencana: string
          tanggal_pinjam?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          denda?: number | null
          dosen_id?: string | null
          id?: string
          inventaris_id?: string
          jumlah_pinjam?: number
          keperluan?: string
          keterangan_kembali?: string | null
          kondisi_kembali?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          kondisi_pinjam?:
            | Database["public"]["Enums"]["equipment_condition"]
            | null
          peminjam_id?: string
          peminjam_id_backup?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["borrowing_status"] | null
          tanggal_kembali_aktual?: string | null
          tanggal_kembali_rencana?: string
          tanggal_pinjam?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "peminjaman_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peminjaman_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peminjaman_inventaris_id_fkey"
            columns: ["inventaris_id"]
            isOneToOne: false
            referencedRelation: "inventaris"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peminjaman_peminjam_id_fkey"
            columns: ["peminjam_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
        ]
      }
      pengumuman: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          judul: string
          konten: string
          penulis_id: string
          prioritas: string | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          target_kelas_id: string | null
          target_role: Database["public"]["Enums"]["user_role"][] | null
          tipe: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          judul: string
          konten: string
          penulis_id: string
          prioritas?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          target_kelas_id?: string | null
          target_role?: Database["public"]["Enums"]["user_role"][] | null
          tipe?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          judul?: string
          konten?: string
          penulis_id?: string
          prioritas?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          target_kelas_id?: string | null
          target_role?: Database["public"]["Enums"]["user_role"][] | null
          tipe?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pengumuman_penulis_id_fkey"
            columns: ["penulis_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengumuman_target_kelas_id_fkey"
            columns: ["target_kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengumuman_target_kelas_id_fkey"
            columns: ["target_kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "pengumuman_target_kelas_id_fkey"
            columns: ["target_kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "pengumuman_target_kelas_id_fkey"
            columns: ["target_kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
        ]
      }
      permintaan_perbaikan_nilai: {
        Row: {
          alasan_permintaan: string
          bukti_pendukung: string[] | null
          created_at: string | null
          id: string
          kelas_id: string
          komponen_nilai: string
          mahasiswa_id: string
          nilai_baru: number | null
          nilai_id: string
          nilai_lama: number
          nilai_usulan: number | null
          response_dosen: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          alasan_permintaan: string
          bukti_pendukung?: string[] | null
          created_at?: string | null
          id?: string
          kelas_id: string
          komponen_nilai: string
          mahasiswa_id: string
          nilai_baru?: number | null
          nilai_id: string
          nilai_lama: number
          nilai_usulan?: number | null
          response_dosen?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          alasan_permintaan?: string
          bukti_pendukung?: string[] | null
          created_at?: string | null
          id?: string
          kelas_id?: string
          komponen_nilai?: string
          mahasiswa_id?: string
          nilai_baru?: number | null
          nilai_id?: string
          nilai_lama?: number
          nilai_usulan?: number | null
          response_dosen?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permintaan_perbaikan_nilai_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permintaan_perbaikan_nilai_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_available_kelas"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "permintaan_perbaikan_nilai_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "permintaan_perbaikan_nilai_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "v_kelas_assignments"
            referencedColumns: ["kelas_id"]
          },
          {
            foreignKeyName: "permintaan_perbaikan_nilai_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permintaan_perbaikan_nilai_nilai_id_fkey"
            columns: ["nilai_id"]
            isOneToOne: false
            referencedRelation: "nilai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permintaan_perbaikan_nilai_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
        ]
      }
      sensitive_operations: {
        Row: {
          audit_log_id: string | null
          created_at: string | null
          id: string
          operation_type: string
          requires_review: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
        }
        Insert: {
          audit_log_id?: string | null
          created_at?: string | null
          id?: string
          operation_type: string
          requires_review?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: string
        }
        Update: {
          audit_log_id?: string | null
          created_at?: string | null
          id?: string
          operation_type?: string
          requires_review?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensitive_operations_audit_log_id_fkey"
            columns: ["audit_log_id"]
            isOneToOne: false
            referencedRelation: "audit_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensitive_operations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      soal: {
        Row: {
          created_at: string | null
          id: string
          jawaban_benar: string | null
          kuis_id: string
          media_url: string | null
          pembahasan: string | null
          pertanyaan: string
          pilihan_jawaban: Json | null
          poin: number
          rubrik_penilaian: Json | null
          tipe: Database["public"]["Enums"]["question_type"]
          updated_at: string | null
          urutan: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          jawaban_benar?: string | null
          kuis_id: string
          media_url?: string | null
          pembahasan?: string | null
          pertanyaan: string
          pilihan_jawaban?: Json | null
          poin?: number
          rubrik_penilaian?: Json | null
          tipe: Database["public"]["Enums"]["question_type"]
          updated_at?: string | null
          urutan: number
        }
        Update: {
          created_at?: string | null
          id?: string
          jawaban_benar?: string | null
          kuis_id?: string
          media_url?: string | null
          pembahasan?: string | null
          pertanyaan?: string
          pilihan_jawaban?: Json | null
          poin?: number
          rubrik_penilaian?: Json | null
          tipe?: Database["public"]["Enums"]["question_type"]
          updated_at?: string | null
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "soal_kuis_id_fkey"
            columns: ["kuis_id"]
            isOneToOne: false
            referencedRelation: "kuis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soal_kuis_id_fkey"
            columns: ["kuis_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kuis_id"]
          },
        ]
      }
      sync_history: {
        Row: {
          completed_at: string | null
          device_id: string | null
          duration_ms: number | null
          error_summary: Json | null
          id: string
          records_failed: number | null
          records_synced: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["sync_status"]
          sync_type: string
          table_name: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          device_id?: string | null
          duration_ms?: number | null
          error_summary?: Json | null
          id?: string
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string | null
          status: Database["public"]["Enums"]["sync_status"]
          sync_type: string
          table_name?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          device_id?: string | null
          duration_ms?: number | null
          error_summary?: Json | null
          id?: string
          records_failed?: number | null
          records_synced?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["sync_status"]
          sync_type?: string
          table_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          metadata: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          metadata?: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          metadata?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      soal_mahasiswa: {
        Row: {
          created_at: string | null
          id: string | null
          jawaban_benar: string | null
          kuis_id: string | null
          media_url: string | null
          pembahasan: string | null
          pertanyaan: string | null
          pilihan_jawaban: Json | null
          poin: number | null
          rubrik_penilaian: Json | null
          tipe: Database["public"]["Enums"]["question_type"] | null
          updated_at: string | null
          urutan: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          jawaban_benar?: never
          kuis_id?: string | null
          media_url?: string | null
          pembahasan?: string | null
          pertanyaan?: string | null
          pilihan_jawaban?: Json | null
          poin?: number | null
          rubrik_penilaian?: Json | null
          tipe?: Database["public"]["Enums"]["question_type"] | null
          updated_at?: string | null
          urutan?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          jawaban_benar?: never
          kuis_id?: string | null
          media_url?: string | null
          pembahasan?: string | null
          pertanyaan?: string | null
          pilihan_jawaban?: Json | null
          poin?: number | null
          rubrik_penilaian?: Json | null
          tipe?: Database["public"]["Enums"]["question_type"] | null
          updated_at?: string | null
          urutan?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "soal_kuis_id_fkey"
            columns: ["kuis_id"]
            isOneToOne: false
            referencedRelation: "kuis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soal_kuis_id_fkey"
            columns: ["kuis_id"]
            isOneToOne: false
            referencedRelation: "v_dosen_grading_access"
            referencedColumns: ["kuis_id"]
          },
        ]
      }
      v_available_kelas: {
        Row: {
          created_at: string | null
          is_active: boolean | null
          kelas_id: string | null
          kuota: number | null
          nama_kelas: string | null
          semester_ajaran: number | null
          tahun_ajaran: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          is_active?: boolean | null
          kelas_id?: string | null
          kuota?: number | null
          nama_kelas?: string | null
          semester_ajaran?: number | null
          tahun_ajaran?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          is_active?: boolean | null
          kelas_id?: string | null
          kuota?: number | null
          nama_kelas?: string | null
          semester_ajaran?: number | null
          tahun_ajaran?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_dosen_grading_access: {
        Row: {
          created_at: string | null
          creator_name: string | null
          creator_user_id: string | null
          graded_count: number | null
          kelas_dosen_id: string | null
          kelas_dosen_name: string | null
          kelas_dosen_user_id: string | null
          kelas_id: string | null
          kode_mk: string | null
          kuis_creator_dosen_id: string | null
          kuis_deskripsi: string | null
          kuis_id: string | null
          kuis_judul: string | null
          mata_kuliah_id: string | null
          nama_kelas: string | null
          nama_mk: string | null
          pending_grading: number | null
          tanggal_selesai: string | null
          total_attempts: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dosen_user_id_fkey"
            columns: ["kelas_dosen_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dosen_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_dosen_id_fkey"
            columns: ["kelas_dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kuis_dosen_id_fkey"
            columns: ["kuis_creator_dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kuis_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
      v_kelas_assignments: {
        Row: {
          assignment_status: string | null
          created_at: string | null
          dosen_email: string | null
          dosen_id: string | null
          dosen_name: string | null
          is_active: boolean | null
          kelas_id: string | null
          kode_kelas: string | null
          kuota: number | null
          mahasiswa_count: number | null
          mata_kuliah_id: string | null
          mata_kuliah_kode: string | null
          mata_kuliah_nama: string | null
          nama_kelas: string | null
          semester_ajaran: number | null
          tahun_ajaran: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kelas_dosen_id_fkey"
            columns: ["dosen_id"]
            isOneToOne: false
            referencedRelation: "dosen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kelas_mata_kuliah_id_fkey"
            columns: ["mata_kuliah_id"]
            isOneToOne: false
            referencedRelation: "mata_kuliah"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_attendance_percentage: {
        Args: { p_kelas_id: string; p_mahasiswa_id: string }
        Returns: number
      }
      calculate_final_grade: {
        Args: { p_kelas_id: string; p_mahasiswa_id: string }
        Returns: number
      }
      calculate_nilai_kehadiran_aggregated: {
        Args: { p_kelas_id: string; p_mahasiswa_id: string }
        Returns: number
      }
      can_access_materi_file: {
        Args: { p_file_path: string }
        Returns: boolean
      }
      can_dosen_input_kehadiran: {
        Args: { p_dosen_id: string; p_kelas_id: string; p_minggu_ke: number }
        Returns: boolean
      }
      can_unassign_kelas: { Args: { p_kelas_id: string }; Returns: boolean }
      cancel_jadwal_praktikum: {
        Args: { p_jadwal_id: string }
        Returns: boolean
      }
      check_pertemuan_overlap: {
        Args: {
          p_assignment_id?: string
          p_dosen_id: string
          p_kelas_id: string
          p_pertemuan_dari: number
          p_pertemuan_sampai: number
        }
        Returns: boolean
      }
      check_version_conflict: {
        Args: {
          p_client_version: number
          p_record_id: string
          p_table_name: string
        }
        Returns: boolean
      }
      create_user_profile: {
        Args: {
          p_identifier?: string
          p_name: string
          p_role: string
          p_user_id: string
        }
        Returns: string
      }
      dosen_teaches_kelas: { Args: { p_kelas_id: string }; Returns: boolean }
      dosen_teaches_mahasiswa: {
        Args: { p_mahasiswa_id: string }
        Returns: boolean
      }
      dosen_teaches_mata_kuliah: {
        Args: { p_mata_kuliah_id: string }
        Returns: boolean
      }
      get_active_kuis_for_mahasiswa: {
        Args: { p_mahasiswa_id: string }
        Returns: {
          deskripsi: string
          durasi_menit: number
          judul: string
          kelas_id: string
          kelas_nama: string
          kuis_id: string
          waktu_mulai: string
          waktu_selesai: string
        }[]
      }
      get_assignment_stats: {
        Args: never
        Returns: {
          assigned_kelas: number
          total_kelas: number
          unassigned_kelas: number
        }[]
      }
      get_current_dosen_id: { Args: never; Returns: string }
      get_current_laboran_id: { Args: never; Returns: string }
      get_current_mahasiswa_id: { Args: never; Returns: string }
      get_dosen_for_pertemuan: {
        Args: { p_kelas_id: string; p_minggu_ke: number }
        Returns: {
          dosen_id: string
          dosen_name: string
          is_koordinator: boolean
          pertemuan_dari: number
          pertemuan_sampai: number
        }[]
      }
      get_dosen_id: { Args: never; Returns: string }
      get_dosen_kelas_ids: { Args: never; Returns: string[] }
      get_failed_logins: {
        Args: { p_email: string; p_since?: string }
        Returns: number
      }
      get_jadwal_praktikum_mahasiswa: {
        Args: { p_mahasiswa_id: string }
        Returns: {
          jadwal_id: string
          kelas_id: string
          kelas_nama: string
          ruangan: string
          tanggal: string
          topik: string
          waktu_mulai: string
          waktu_selesai: string
        }[]
      }
      get_kehadiran_by_kelas_daterange: {
        Args: { p_end_date?: string; p_kelas_id: string; p_start_date?: string }
        Returns: {
          created_at: string
          id: string
          jadwal_id: string
          keterangan: string
          mahasiswa_id: string
          mahasiswa_nama: string
          mahasiswa_nim: string
          status: string
          tanggal: string
        }[]
      }
      get_laboran_id: { Args: never; Returns: string }
      get_mahasiswa_id: { Args: never; Returns: string }
      get_mahasiswa_kelas_ids: { Args: never; Returns: string[] }
      get_my_kelas_assignments_v2: {
        Args: { p_dosen_id: string }
        Returns: {
          assignment_id: string
          is_koordinator: boolean
          kelas_id: string
          kelas_nama: string
          mahasiswa_count: number
          mata_kuliah_id: string
          mata_kuliah_kode: string
          mata_kuliah_nama: string
          pertemuan_dari: number
          pertemuan_sampai: number
          total_dosen: number
        }[]
      }
      get_my_mahasiswa_id: { Args: never; Returns: string }
      get_quiz_attempt_details: {
        Args: { p_attempt_id: string }
        Returns: {
          attempt_id: string
          kuis_id: string
          mahasiswa_id: string
          score: number
          started_at: string
          status: string
          submitted_at: string
        }[]
      }
      get_user_role: { Args: never; Returns: string }
      increment_bank_soal_usage: {
        Args: { p_bank_soal_id: string }
        Returns: undefined
      }
      increment_materi_download_count: {
        Args: { materi_id: string }
        Returns: undefined
      }
      increment_sync_attempt: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_dosen: { Args: never; Returns: boolean }
      is_laboran: { Args: never; Returns: boolean }
      is_mahasiswa: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_error_message?: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id?: string
          p_resource_type: string
          p_success?: boolean
        }
        Returns: string
      }
      log_conflict: {
        Args: {
          p_client_data: Json
          p_record_id: string
          p_resolution?: string
          p_server_data: Json
          p_table_name: string
        }
        Returns: string
      }
      mahasiswa_in_kelas: { Args: { p_kelas_id: string }; Returns: boolean }
      reactivate_jadwal_praktikum: {
        Args: { p_jadwal_id: string }
        Returns: boolean
      }
      review_sensitive_operation: {
        Args: { p_log_id: string; p_notes?: string; p_status: string }
        Returns: boolean
      }
      safe_update_with_version: {
        Args: {
          p_client_version: number
          p_data: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: boolean
      }
      suggest_kelas_for_semester: {
        Args: { p_semester: string }
        Returns: {
          dosen_nama: string
          kelas_id: string
          kelas_nama: string
          mata_kuliah: string
        }[]
      }
      validate_quiz_attempt: {
        Args: { p_kuis_id: string; p_mahasiswa_id: string }
        Returns: boolean
      }
    }
    Enums: {
      attempt_status:
        | "in_progress"
        | "submitted"
        | "graded"
        | "pending_sync"
        | "pending"
        | "completed"
        | "abandoned"
      borrowing_status:
        | "pending"
        | "approved"
        | "rejected"
        | "returned"
        | "overdue"
      conflict_strategy: "server_wins" | "client_wins" | "manual"
      day_of_week:
        | "senin"
        | "selasa"
        | "rabu"
        | "kamis"
        | "jumat"
        | "sabtu"
        | "minggu"
      equipment_condition:
        | "baik"
        | "rusak_ringan"
        | "rusak_berat"
        | "maintenance"
      gender_type: "L" | "P"
      kuis_type: "essay" | "pilihan_ganda" | "campuran"
      question_type:
        | "multiple_choice"
        | "true_false"
        | "essay"
        | "short_answer"
        | "pilihan_ganda"
        | "benar_salah"
        | "file_upload"
        | "jawaban_singkat"
        | "menjodohkan"
        | "isian_singkat"
      quiz_status: "draft" | "published" | "archived"
      sync_status: "pending" | "syncing" | "synced" | "failed" | "conflict"
      user_role: "admin" | "dosen" | "mahasiswa" | "laboran"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attempt_status: [
        "in_progress",
        "submitted",
        "graded",
        "pending_sync",
        "pending",
        "completed",
        "abandoned",
      ],
      borrowing_status: [
        "pending",
        "approved",
        "rejected",
        "returned",
        "overdue",
      ],
      conflict_strategy: ["server_wins", "client_wins", "manual"],
      day_of_week: [
        "senin",
        "selasa",
        "rabu",
        "kamis",
        "jumat",
        "sabtu",
        "minggu",
      ],
      equipment_condition: [
        "baik",
        "rusak_ringan",
        "rusak_berat",
        "maintenance",
      ],
      gender_type: ["L", "P"],
      kuis_type: ["essay", "pilihan_ganda", "campuran"],
      question_type: [
        "multiple_choice",
        "true_false",
        "essay",
        "short_answer",
        "pilihan_ganda",
        "benar_salah",
        "file_upload",
        "jawaban_singkat",
        "menjodohkan",
        "isian_singkat",
      ],
      quiz_status: ["draft", "published", "archived"],
      sync_status: ["pending", "syncing", "synced", "failed", "conflict"],
      user_role: ["admin", "dosen", "mahasiswa", "laboran"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.75.0 (currently installed v2.26.9)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
