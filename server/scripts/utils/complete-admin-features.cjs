const fs = require('fs');
const path = require('path');

// 1. Update users.api.ts with createUser function
const usersApiPath = path.join(__dirname, 'src/lib/api/users.api.ts');
const usersApiContent = `/**
 * Users API for Admin
 * Functions to manage all system users
 */

import { supabase } from '@/lib/supabase/client';

export interface SystemUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'dosen' | 'mahasiswa' | 'laboran';
  is_active: boolean;
  created_at: string;
  nim?: string;
  nip?: string;
  nidn?: string;
  phone?: string;
}

export interface UserStats {
  total: number;
  admin: number;
  dosen: number;
  mahasiswa: number;
  laboran: number;
  active: number;
  inactive: number;
}

/**
 * Get all users with their role information
 */
export async function getAllUsers(): Promise<SystemUser[]> {
  try {
    // Step 1: Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;
    if (!users || users.length === 0) return [];

    // Step 2: Get role-specific data
    const userIds = users.map(u => u.id);

    const [mahasiswaData, dosenData] = await Promise.all([
      supabase.from('mahasiswa').select('user_id, nim, phone').in('user_id', userIds),
      supabase.from('dosen').select('user_id, nip, nidn, phone').in('user_id', userIds),
    ]);

    // Step 3: Create lookup maps
    const mahasiswaMap = new Map((mahasiswaData.data || []).map((m: any) => [m.user_id, m]));
    const dosenMap = new Map((dosenData.data || []).map((d: any) => [d.user_id, d]));

    // Step 4: Combine data
    return users.map((user: any) => {
      const mahasiswa = mahasiswaMap.get(user.id);
      const dosen = dosenMap.get(user.id);

      return {
        id: user.id,
        email: user.email || '-',
        full_name: user.full_name || '-',
        role: user.role || 'mahasiswa',
        is_active: user.is_active ?? true,
        created_at: user.created_at,
        nim: mahasiswa?.nim,
        nip: dosen?.nip,
        nidn: dosen?.nidn,
        phone: mahasiswa?.phone || dosen?.phone,
      };
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const users = await getAllUsers();

    return {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      dosen: users.filter(u => u.role === 'dosen').length,
      mahasiswa: users.filter(u => u.role === 'mahasiswa').length,
      laboran: users.filter(u => u.role === 'laboran').length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      total: 0,
      admin: 0,
      dosen: 0,
      mahasiswa: 0,
      laboran: 0,
      active: 0,
      inactive: 0,
    };
  }
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
}

/**
 * Update user data
 */
export interface UpdateUserData {
  email?: string;
  full_name?: string;
  role?: 'admin' | 'dosen' | 'mahasiswa' | 'laboran';
  is_active?: boolean;
}

export async function updateUser(id: string, data: UpdateUserData): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Create new user
 */
export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'dosen' | 'mahasiswa' | 'laboran';
  nim?: string;
  nip?: string;
  nidn?: string;
  phone?: string;
}

export async function createUser(data: CreateUserData): Promise<void> {
  try {
    // Step 1: Create user in auth and users table
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    const userId = authData.user.id;

    // Step 2: Update users table with complete info
    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: data.full_name,
        role: data.role,
        is_active: true,
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Step 3: Insert role-specific data
    if (data.role === 'mahasiswa' && data.nim) {
      const { error: mahasiswaError } = await supabase
        .from('mahasiswa')
        .insert({
          user_id: userId,
          nim: data.nim,
          phone: data.phone || null,
        });

      if (mahasiswaError) throw mahasiswaError;
    } else if (data.role === 'dosen' && (data.nip || data.nidn)) {
      const { error: dosenError } = await supabase
        .from('dosen')
        .insert({
          user_id: userId,
          nip: data.nip || null,
          nidn: data.nidn || null,
          phone: data.phone || null,
        });

      if (dosenError) throw dosenError;
    } else if (data.role === 'laboran') {
      const { error: laboranError } = await supabase
        .from('laboran')
        .insert({
          user_id: userId,
          phone: data.phone || null,
        });

      if (laboranError) throw laboranError;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
`;

fs.writeFileSync(usersApiPath, usersApiContent);
console.log('✅ Updated users.api.ts with createUser function');

// 2. Add createLaboratorium function to laboran.api.ts
const laboranApiPath = path.join(__dirname, 'src/lib/api/laboran.api.ts');
let laboranApiContent = fs.readFileSync(laboranApiPath, 'utf-8');

// Check if createLaboratorium already exists
if (!laboranApiContent.includes('export async function createLaboratorium')) {
  // Find the end of the file and add the function
  const createLabFunction = `

/**
 * Create new laboratorium
 */
export interface CreateLaboratoriumData {
  kode_lab: string;
  nama_lab: string;
  lokasi?: string;
  kapasitas?: number;
  keterangan?: string;
  is_active?: boolean;
}

export async function createLaboratorium(data: CreateLaboratoriumData): Promise<void> {
  try {
    const { error } = await supabase
      .from('laboratorium')
      .insert(data);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating laboratorium:', error);
    throw error;
  }
}
`;
  laboranApiContent += createLabFunction;
  fs.writeFileSync(laboranApiPath, laboranApiContent);
  console.log('✅ Added createLaboratorium to laboran.api.ts');
}

// 3. Add createInventaris function
if (!laboranApiContent.includes('export async function createInventaris')) {
  const createInventFunction = `

/**
 * Create new inventaris
 */
export interface CreateInventarisData {
  kode_barang: string;
  nama_barang: string;
  laboratorium_id?: string;
  jumlah?: number;
  kondisi?: 'baik' | 'rusak_ringan' | 'rusak_berat';
  keterangan?: string;
  is_available_for_borrowing?: boolean;
}

export async function createInventaris(data: CreateInventarisData): Promise<void> {
  try {
    const { error } = await supabase
      .from('inventaris')
      .insert(data);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating inventaris:', error);
    throw error;
  }
}
`;
  laboranApiContent += createInventFunction;
  fs.writeFileSync(laboranApiPath, laboranApiContent);
  console.log('✅ Added createInventaris to laboran.api.ts');
}

// 4. Update routes.config.ts
const routesConfigPath = path.join(__dirname, 'src/routes/routes.config.ts');
const routesContent = `/**
 * Routes Configuration - COMPLETE VERSION
 * Define all route paths for the application
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/403',

  // Admin routes
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    LABORATORIES: '/admin/laboratories',
    EQUIPMENTS: '/admin/equipments',
    ANNOUNCEMENTS: '/admin/announcements',
    ANALYTICS: '/admin/analytics',
    SYNC_MANAGEMENT: '/admin/sync-management',
    MATA_KULIAH: '/admin/mata-kuliah',
    KELAS: '/admin/kelas',
  },

  // Dosen routes
  DOSEN: {
    ROOT: '/dosen',
    DASHBOARD: '/dosen/dashboard',
    JADWAL: '/dosen/jadwal',
    KUIS: {
      LIST: '/dosen/kuis',
      CREATE: '/dosen/kuis/create',
      EDIT: '/dosen/kuis/:id/edit',
      RESULTS: '/dosen/kuis/:id/results',
    },
    PEMINJAMAN: '/dosen/peminjaman',
    KEHADIRAN: '/dosen/kehadiran',
    MATERI: '/dosen/materi',
    PENILAIAN: '/dosen/penilaian',
  },

  // Mahasiswa routes
  MAHASISWA: {
    ROOT: '/mahasiswa',
    DASHBOARD: '/mahasiswa/dashboard',
    JADWAL: '/mahasiswa/jadwal',
    KUIS: {
      LIST: '/mahasiswa/kuis',
      ATTEMPT: '/mahasiswa/kuis/:id/attempt',
      RESULT: '/mahasiswa/kuis/:id/result',
    },
    MATERI: '/mahasiswa/materi',
    NILAI: '/mahasiswa/nilai',
    PRESENSI: '/mahasiswa/presensi',
    PENGUMUMAN: '/mahasiswa/pengumuman',
    PROFILE: '/mahasiswa/profile',
    OFFLINE_SYNC: '/mahasiswa/offline-sync',
  },

  // Laboran routes
  LABORAN: {
    ROOT: '/laboran',
    DASHBOARD: '/laboran/dashboard',
    INVENTARIS: '/laboran/inventaris',
    PEMINJAMAN: '/laboran/peminjaman',
    PERSETUJUAN: '/laboran/persetujuan',
    LABORATORIUM: '/laboran/laboratorium',
    LAPORAN: '/laboran/laporan',
  },
} as const;

/**
 * Helper function to build dynamic routes
 */
export const buildRoute = (template: string, params: Record<string, string | number>): string => {
  let route = template;
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(\`:$\{key}\`, String(value));
  });
  return route;
};

/**
 * Get base path for a role
 */
export const getRoleBasePath = (role: string): string => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN.ROOT;
    case 'dosen':
      return ROUTES.DOSEN.ROOT;
    case 'mahasiswa':
      return ROUTES.MAHASISWA.ROOT;
    case 'laboran':
      return ROUTES.LABORAN.ROOT;
    default:
      return ROUTES.HOME;
  }
};

/**
 * Get dashboard path for a role
 */
export const getRoleDashboard = (role: string): string => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN.DASHBOARD;
    case 'dosen':
      return ROUTES.DOSEN.DASHBOARD;
    case 'mahasiswa':
      return ROUTES.MAHASISWA.DASHBOARD;
    case 'laboran':
      return ROUTES.LABORAN.DASHBOARD;
    default:
      return ROUTES.HOME;
  }
};
`;

fs.writeFileSync(routesConfigPath, routesContent);
console.log('✅ Updated routes.config.ts with MATA_KULIAH and KELAS routes');

console.log('\n✅ All API functions updated!');
console.log('\nNext steps:');
console.log('1. Run: node complete-admin-features.cjs');
console.log('2. Update admin pages with Create dialogs');
