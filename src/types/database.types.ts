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
      jadwal_praktikum: {
        Row: {
          created_at: string | null
          deskripsi: string | null
          hari: Database["public"]["Enums"]["day_of_week"]
          id: string
          is_active: boolean | null
          jam_mulai: string
          jam_selesai: string
          kelas_id: string
          laboratorium_id: string
          minggu_ke: number | null
          tanggal_praktikum: string | null
          topik: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deskripsi?: string | null
          hari: Database["public"]["Enums"]["day_of_week"]
          id?: string
          is_active?: boolean | null
          jam_mulai: string
          jam_selesai: string
          kelas_id: string
          laboratorium_id: string
          minggu_ke?: number | null
          tanggal_praktikum?: string | null
          topik?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deskripsi?: string | null
          hari?: Database["public"]["Enums"]["day_of_week"]
          id?: string
          is_active?: boolean | null
          jam_mulai?: string
          jam_selesai?: string
          kelas_id?: string
          laboratorium_id?: string
          minggu_ke?: number | null
          tanggal_praktikum?: string | null
          topik?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jadwal_praktikum_kelas_id_fkey"
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
      kelas: {
        Row: {
          created_at: string | null
          dosen_id: string
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
          dosen_id: string
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
          dosen_id?: string
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
          id: string
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      day_of_week:
        | "senin"
        | "selasa"
        | "rabu"
        | "kamis"
        | "jumat"
        | "sabtu"
        | "minggu"
      gender_type: "L" | "P"
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
      day_of_week: [
        "senin",
        "selasa",
        "rabu",
        "kamis",
        "jumat",
        "sabtu",
        "minggu",
      ],
      gender_type: ["L", "P"],
      user_role: ["admin", "dosen", "mahasiswa", "laboran"],
    },
  },
} as const
