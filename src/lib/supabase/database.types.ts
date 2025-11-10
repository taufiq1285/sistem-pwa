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
          started_at: string | null
          status: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at: string | null
          sync_attempted_at: string | null
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          time_spent: number | null
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
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
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at?: string | null
          sync_attempted_at?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          time_spent?: number | null
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
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
          started_at?: string | null
          status?: Database["public"]["Enums"]["attempt_status"] | null
          submitted_at?: string | null
          sync_attempted_at?: string | null
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          time_spent?: number | null
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
            referencedRelation: "vw_kuis_statistics"
            referencedColumns: ["id"]
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
          queue_item_id: string | null
          record_id: string
          resolution_strategy: Database["public"]["Enums"]["conflict_strategy"]
          resolved_at: string | null
          resolved_by: string | null
          resolved_data: Json | null
          server_data: Json
          table_name: string
          user_id: string
        }
        Insert: {
          client_data: Json
          created_at?: string | null
          id?: string
          queue_item_id?: string | null
          record_id: string
          resolution_strategy: Database["public"]["Enums"]["conflict_strategy"]
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_data?: Json | null
          server_data: Json
          table_name: string
          user_id: string
        }
        Update: {
          client_data?: Json
          created_at?: string | null
          id?: string
          queue_item_id?: string | null
          record_id?: string
          resolution_strategy?: Database["public"]["Enums"]["conflict_strategy"]
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_data?: Json | null
          server_data?: Json
          table_name?: string
          user_id?: string
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
          nip: string
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
          nip: string
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
          nip?: string
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
          laboratorium_id: string
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
          laboratorium_id: string
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
          laboratorium_id?: string
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
          catatan: string | null
          created_at: string | null
          deskripsi: string | null
          hari: Database["public"]["Enums"]["day_of_week"]
          id: string
          is_active: boolean | null
          jam_mulai: string
          jam_selesai: string
          kelas: string
          kelas_id: string | null
          laboratorium_id: string
          minggu_ke: number | null
          tanggal_praktikum: string | null
          topik: string | null
          updated_at: string | null
        }
        Insert: {
          catatan?: string | null
          created_at?: string | null
          deskripsi?: string | null
          hari: Database["public"]["Enums"]["day_of_week"]
          id?: string
          is_active?: boolean | null
          jam_mulai: string
          jam_selesai: string
          kelas: string
          kelas_id?: string | null
          laboratorium_id: string
          minggu_ke?: number | null
          tanggal_praktikum?: string | null
          topik?: string | null
          updated_at?: string | null
        }
        Update: {
          catatan?: string | null
          created_at?: string | null
          deskripsi?: string | null
          hari?: Database["public"]["Enums"]["day_of_week"]
          id?: string
          is_active?: boolean | null
          jam_mulai?: string
          jam_selesai?: string
          kelas?: string
          kelas_id?: string | null
          laboratorium_id?: string
          minggu_ke?: number | null
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
            foreignKeyName: "jadwal_praktikum_laboratorium_id_fkey"
            columns: ["laboratorium_id"]
            isOneToOne: false
            referencedRelation: "laboratorium"
            referencedColumns: ["id"]
          },
        ]
      }
      jawaban: {
        Row: {
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
        }
        Insert: {
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
        }
        Update: {
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
        ]
      }
      kehadiran: {
        Row: {
          created_at: string | null
          id: string
          jadwal_id: string
          keterangan: string | null
          mahasiswa_id: string
          status: string
          updated_at: string | null
          waktu_check_in: string | null
          waktu_check_out: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          jadwal_id: string
          keterangan?: string | null
          mahasiswa_id: string
          status?: string
          updated_at?: string | null
          waktu_check_in?: string | null
          waktu_check_out?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          jadwal_id?: string
          keterangan?: string | null
          mahasiswa_id?: string
          status?: string
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
            foreignKeyName: "kehadiran_jadwal_id_fkey"
            columns: ["jadwal_id"]
            isOneToOne: false
            referencedRelation: "vw_mahasiswa_dashboard"
            referencedColumns: ["jadwal_id"]
          },
          {
            foreignKeyName: "kehadiran_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas: {
        Row: {
          created_at: string | null
          dosen_id: string | null
          id: string
          is_active: boolean | null
          kode_kelas: string
          kuota: number | null
          mata_kuliah_id: string
          nama_kelas: string
          ruangan: string | null
          semester_ajaran: number
          tahun_ajaran: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dosen_id?: string | null
          id?: string
          is_active?: boolean | null
          kode_kelas: string
          kuota?: number | null
          mata_kuliah_id: string
          nama_kelas: string
          ruangan?: string | null
          semester_ajaran: number
          tahun_ajaran: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dosen_id?: string | null
          id?: string
          is_active?: boolean | null
          kode_kelas?: string
          kuota?: number | null
          mata_kuliah_id?: string
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
      kelas_mahasiswa: {
        Row: {
          enrolled_at: string | null
          id: string
          is_active: boolean | null
          kelas_id: string
          mahasiswa_id: string
        }
        Insert: {
          enrolled_at?: string | null
          id?: string
          is_active?: boolean | null
          kelas_id: string
          mahasiswa_id: string
        }
        Update: {
          enrolled_at?: string | null
          id?: string
          is_active?: boolean | null
          kelas_id?: string
          mahasiswa_id?: string
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
          max_attempts: number | null
          passing_score: number | null
          published_at: string | null
          randomize_options: boolean | null
          randomize_questions: boolean | null
          show_results_immediately: boolean | null
          status: Database["public"]["Enums"]["quiz_status"] | null
          tanggal_mulai: string
          tanggal_selesai: string
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
          max_attempts?: number | null
          passing_score?: number | null
          published_at?: string | null
          randomize_options?: boolean | null
          randomize_questions?: boolean | null
          show_results_immediately?: boolean | null
          status?: Database["public"]["Enums"]["quiz_status"] | null
          tanggal_mulai: string
          tanggal_selesai: string
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
          max_attempts?: number | null
          passing_score?: number | null
          published_at?: string | null
          randomize_options?: boolean | null
          randomize_questions?: boolean | null
          show_results_immediately?: boolean | null
          status?: Database["public"]["Enums"]["quiz_status"] | null
          tanggal_mulai?: string
          tanggal_selesai?: string
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
        ]
      }
      nilai: {
        Row: {
          created_at: string | null
          id: string
          kelas_id: string
          keterangan: string | null
          mahasiswa_id: string
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
            foreignKeyName: "nilai_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
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
            referencedRelation: "mahasiswa"
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
            referencedRelation: "vw_kuis_statistics"
            referencedColumns: ["id"]
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
      vw_kuis_statistics: {
        Row: {
          avg_score: number | null
          id: string | null
          in_progress_count: number | null
          judul: string | null
          kelas_id: string | null
          status: Database["public"]["Enums"]["quiz_status"] | null
          submitted_count: number | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          total_attempts: number | null
          unique_students: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kuis_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_mahasiswa_dashboard: {
        Row: {
          deskripsi: string | null
          hari: Database["public"]["Enums"]["day_of_week"] | null
          is_active: boolean | null
          jadwal_id: string | null
          jam_mulai: string | null
          jam_selesai: string | null
          kapasitas: number | null
          kelas: string | null
          kode_lab: string | null
          laboratorium_id: string | null
          nama_lab: string | null
          topik: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jadwal_praktikum_laboratorium_id_fkey"
            columns: ["laboratorium_id"]
            isOneToOne: false
            referencedRelation: "laboratorium"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_sync_queue_summary: {
        Row: {
          conflict_count: number | null
          item_count: number | null
          newest_item: string | null
          oldest_item: string | null
          operation: string | null
          status: Database["public"]["Enums"]["sync_status"] | null
          table_name: string | null
          user_id: string | null
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
    }
    Functions: {
      get_active_kuis_for_mahasiswa: {
        Args: { p_mahasiswa_id: string }
        Returns: {
          attempts_taken: number
          deskripsi: string
          durasi_menit: number
          judul: string
          kuis_id: string
          max_attempts: number
          tanggal_mulai: string
          tanggal_selesai: string
        }[]
      }
      get_jadwal_praktikum_mahasiswa: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          catatan: string
          deskripsi: string
          hari: string
          jadwal_id: string
          jam_mulai: string
          jam_selesai: string
          kode_kelas: string
          kode_lab: string
          kode_mk: string
          lokasi: string
          minggu_ke: number
          nama_dosen: string
          nama_kelas: string
          nama_lab: string
          nama_mk: string
          tanggal_praktikum: string
          topik: string
        }[]
      }
      get_quiz_attempt_details: {
        Args: { p_attempt_id: string }
        Returns: Json
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      attempt_status: "in_progress" | "submitted" | "graded" | "pending_sync"
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
      question_type: "multiple_choice" | "true_false" | "essay" | "short_answer"
      quiz_status: "draft" | "published" | "archived"
      sync_status: "pending" | "syncing" | "synced" | "failed" | "conflict"
      user_role: "admin" | "dosen" | "mahasiswa" | "laboran"
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
      attempt_status: ["in_progress", "submitted", "graded", "pending_sync"],
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
      question_type: ["multiple_choice", "true_false", "essay", "short_answer"],
      quiz_status: ["draft", "published", "archived"],
      sync_status: ["pending", "syncing", "synced", "failed", "conflict"],
      user_role: ["admin", "dosen", "mahasiswa", "laboran"],
    },
  },
} as const
