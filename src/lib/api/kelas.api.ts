/**
 * Kelas API - Using Base API Pattern
 * 
 * Purpose: API functions for managing Kelas (Classes)
 * Used by: Dosen, Admin
 * Pattern: Uses base.api abstraction layer (matches kuis.api pattern)
 */

import {
  queryWithFilters,
  getById,
  insert,
  update,
  remove,
} from './base.api';

import type { 
  Kelas, 
  KelasFilters, 
  CreateKelasData, 
  UpdateKelasData 
} from '@/types/kelas.types';

/**
 * Get all kelas with optional filters
 */
export async function getKelas(filters?: KelasFilters): Promise<Kelas[]> {
  try {
    const filterConditions = [];
    
    if (filters?.dosen_id) {
      filterConditions.push({
        column: 'dosen_id',
        operator: 'eq' as const,
        value: filters.dosen_id,
      });
    }
    
    if (filters?.mata_kuliah_id) {
      filterConditions.push({
        column: 'mata_kuliah_id',
        operator: 'eq' as const,
        value: filters.mata_kuliah_id,
      });
    }
    
    if (filters?.semester_ajaran !== undefined) {
      filterConditions.push({
        column: 'semester_ajaran',
        operator: 'eq' as const,
        value: filters.semester_ajaran,
      });
    }
    
    if (filters?.tahun_ajaran) {
      filterConditions.push({
        column: 'tahun_ajaran',
        operator: 'eq' as const,
        value: filters.tahun_ajaran,
      });
    }
    
    if (filters?.is_active !== undefined) {
      filterConditions.push({
        column: 'is_active',
        operator: 'eq' as const,
        value: filters.is_active,
      });
    } else {
      // Default: only active kelas
      filterConditions.push({
        column: 'is_active',
        operator: 'eq' as const,
        value: true,
      });
    }
    
    const options = {
      select: `
        *,
        mata_kuliah:mata_kuliah_id (
          id,
          nama_mk,
          kode_mk
        ),
        dosen:dosen_id (
          id,
          users:user_id (
            full_name
          )
        )
      `,
      order: {
        column: 'nama_kelas',
        ascending: true,
      },
    };
    
    return await queryWithFilters<Kelas>('kelas', filterConditions, options);
  } catch (error: any) {
    console.error('Error fetching kelas:', error);
    throw new Error(`Failed to fetch kelas: ${error.message}`);
  }
}

/**
 * Get single kelas by ID
 */
export async function getKelasById(id: string): Promise<Kelas> {
  try {
    const options = {
      select: `
        *,
        mata_kuliah:mata_kuliah_id (
          id,
          nama_mk,
          kode_mk
        ),
        dosen:dosen_id (
          id,
          users:user_id (
            full_name
          )
        )
      `,
    };
    
    return await getById<Kelas>('kelas', id, options);
  } catch (error: any) {
    console.error('Error fetching kelas:', error);
    throw new Error(`Failed to fetch kelas: ${error.message}`);
  }
}

/**
 * Create new kelas
 * Note: insert() returns data with default select, 
 * then we fetch again with relations if needed
 */
export async function createKelas(data: CreateKelasData): Promise<Kelas> {
  try {
    // Insert returns basic data
    const newKelas = await insert<Kelas>('kelas', data);
    
    // Fetch again with relations
    return await getKelasById(newKelas.id);
  } catch (error: any) {
    console.error('Error creating kelas:', error);
    throw new Error(`Failed to create kelas: ${error.message}`);
  }
}

/**
 * Update kelas
 * Note: update() returns data with default select,
 * then we fetch again with relations if needed
 */
export async function updateKelas(id: string, data: UpdateKelasData): Promise<Kelas> {
  try {
    // Update returns basic data
    await update<Kelas>('kelas', id, data);
    
    // Fetch again with relations
    return await getKelasById(id);
  } catch (error: any) {
    console.error('Error updating kelas:', error);
    throw new Error(`Failed to update kelas: ${error.message}`);
  }
}

/**
 * Delete kelas
 */
export async function deleteKelas(id: string): Promise<void> {
  try {
    await remove('kelas', id);
  } catch (error: any) {
    console.error('Error deleting kelas:', error);
    throw new Error(`Failed to delete kelas: ${error.message}`);
  }
}
// ============================================================================
// KELAS MAHASISWA (ENROLLMENT) OPERATIONS
// ============================================================================

export interface KelasMahasiswa {
  id: string;
  kelas_id: string;
  mahasiswa_id: string;
  enrolled_at: string | null;
  is_active: boolean | null;
  mahasiswa?: {
    id: string;
    nim: string;
    users?: {
      full_name: string;
      email: string;
    };
  };
}

/**
 * Get enrolled students in a kelas
 */
export async function getEnrolledStudents(kelasId: string): Promise<KelasMahasiswa[]> {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { data, error } = await supabase
      .from('kelas_mahasiswa')
      .select(`
        *,
        mahasiswa:mahasiswa_id (
          id,
          nim,
          users:user_id (
            full_name,
            email
          )
        )
      `)
      .eq('kelas_id', kelasId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching enrolled students:', error);
    throw new Error(`Failed to fetch enrolled students: ${error.message}`);
  }
}

/**
 * Enroll student to kelas
 */
export async function enrollStudent(
  kelasId: string,
  mahasiswaId: string
): Promise<KelasMahasiswa> {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { data, error } = await supabase
      .from('kelas_mahasiswa')
      .insert({
        kelas_id: kelasId,
        mahasiswa_id: mahasiswaId,
        is_active: true,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error enrolling student:', error);
    throw new Error(`Failed to enroll student: ${error.message}`);
  }
}

/**
 * Remove student from kelas
 */
export async function unenrollStudent(
  kelasId: string,
  mahasiswaId: string
): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { error } = await supabase
      .from('kelas_mahasiswa')
      .delete()
      .eq('kelas_id', kelasId)
      .eq('mahasiswa_id', mahasiswaId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error unenrolling student:', error);
    throw new Error(`Failed to unenroll student: ${error.message}`);
  }
}

/**
 * Toggle student active status in kelas
 */
export async function toggleStudentStatus(
  kelasId: string,
  mahasiswaId: string,
  isActive: boolean
): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { error } = await supabase
      .from('kelas_mahasiswa')
      .update({ is_active: isActive })
      .eq('kelas_id', kelasId)
      .eq('mahasiswa_id', mahasiswaId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error toggling student status:', error);
    throw new Error(`Failed to toggle student status: ${error.message}`);
  }
}

/**
 * Get all mahasiswa (for enrollment selection)
 */
export async function getAllMahasiswa(): Promise<
  Array<{
    id: string;
    nim: string;
    users: { full_name: string; email: string };
  }>
> {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { data, error } = await supabase
      .from('mahasiswa')
      .select(`
        id,
        nim,
        users:user_id (
          full_name,
          email
        )
      `)
      .order('nim', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching mahasiswa:', error);
    throw new Error(`Failed to fetch mahasiswa: ${error.message}`);
  }
}

/**
 * Create or get mahasiswa by NIM and enroll to kelas
 * If mahasiswa doesn't exist, create new user account and mahasiswa record
 */
export async function createOrEnrollMahasiswa(
  kelasId: string,
  data: {
    nim: string;
    full_name: string;
    email: string;
  }
): Promise<{ success: boolean; message: string; mahasiswaId?: string }> {
  try {
    const { supabase } = await import('@/lib/supabase/client');

    // Check if mahasiswa with NIM already exists
    const { data: existingMahasiswa } = await supabase
      .from('mahasiswa')
      .select('id, user_id')
      .eq('nim', data.nim)
      .limit(1);

    let mahasiswaId: string;

    if (existingMahasiswa && existingMahasiswa.length > 0) {
      // Mahasiswa exists, use existing ID
      mahasiswaId = existingMahasiswa[0].id;
    } else {
      // Create new user account
      const defaultPassword = `${data.nim}123`; // Default password: NIM + 123

      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: defaultPassword,
        options: {
          data: {
            full_name: data.full_name,
            role: 'mahasiswa',
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!newUser.user) throw new Error('Failed to create user account');

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: newUser.user.id,
          email: data.email,
          full_name: data.full_name,
          role: 'mahasiswa',
        });

      if (profileError) {
        // If profile creation fails, delete the auth user
        console.error('Profile creation failed:', profileError);
        throw new Error('Failed to create user profile');
      }

      // Create mahasiswa record
      const { data: newMahasiswa, error: mahasiswaError } = await supabase
        .from('mahasiswa')
        .insert({
          user_id: newUser.user.id,
          nim: data.nim,
          angkatan: new Date().getFullYear(),
          program_studi: 'Unknown',
        })
        .select('id')
        .single();

      if (mahasiswaError) throw mahasiswaError;
      mahasiswaId = newMahasiswa.id;
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('kelas_mahasiswa')
      .select('id')
      .eq('kelas_id', kelasId)
      .eq('mahasiswa_id', mahasiswaId)
      .limit(1);

    if (existingEnrollment && existingEnrollment.length > 0) {
      return {
        success: false,
        message: 'Mahasiswa sudah terdaftar di kelas ini',
      };
    }

    // Enroll to kelas
    await enrollStudent(kelasId, mahasiswaId);

    return {
      success: true,
      message: 'Mahasiswa berhasil ditambahkan ke kelas',
      mahasiswaId,
    };
  } catch (error: any) {
    console.error('Error creating/enrolling mahasiswa:', error);
    return {
      success: false,
      message: error.message || 'Gagal menambahkan mahasiswa',
    };
  }
}
