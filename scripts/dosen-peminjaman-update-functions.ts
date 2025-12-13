/**
 * NEW FUNCTIONS untuk Update dan Cancel Peminjaman
 * Tambahkan ke src/lib/api/dosen.api.ts setelah markBorrowingAsTaken
 */

import { supabase } from '@/lib/supabase/client';
import { requirePermission } from '@/lib/middleware';

/**
 * Update borrowing request (Edit Peminjaman)
 * Allows dosen to update borrowing details ONLY if status is still 'pending'
 */
async function updateBorrowingRequestImpl(
  peminjaman_id: string,
  data: {
    inventaris_id?: string;
    jumlah_pinjam?: number;
    tanggal_pinjam?: string;
    tanggal_kembali_rencana?: string;
    keperluan?: string;
  }
): Promise<{ id: string }> {
  try {
    // Get current peminjaman to check status and ownership
    const { data: currentPeminjaman, error: fetchError } = await supabase
      .from('peminjaman')
      .select('id, status, dosen_id, inventaris_id, jumlah_pinjam')
      .eq('id', peminjaman_id)
      .single();

    if (fetchError || !currentPeminjaman) {
      throw new Error('Peminjaman tidak ditemukan');
    }

    // Only allow update if status is 'pending'
    if (currentPeminjaman.status !== 'pending') {
      throw new Error('Peminjaman hanya dapat diubah jika statusnya masih menunggu (pending)');
    }

    // Verify ownership (dosen can only update their own borrowing)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User tidak terautentikasi');

    const { data: dosenData, error: dosenError } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (dosenError || !dosenData) {
      throw new Error('Data dosen tidak ditemukan');
    }

    if (currentPeminjaman.dosen_id !== dosenData.id) {
      throw new Error('Anda hanya dapat mengubah peminjaman Anda sendiri');
    }

    // Validate dates if both provided
    if (data.tanggal_pinjam && data.tanggal_kembali_rencana) {
      const pinjamDate = new Date(data.tanggal_pinjam);
      const kembaliDate = new Date(data.tanggal_kembali_rencana);
      if (kembaliDate <= pinjamDate) {
        throw new Error('Tanggal kembali harus setelah tanggal pinjam');
      }
    }

    // If changing inventaris_id, check available stock
    if (data.inventaris_id && data.inventaris_id !== currentPeminjaman.inventaris_id) {
      const { data: newInvData, error: invError } = await supabase
        .from('inventaris')
        .select('jumlah_tersedia')
        .eq('id', data.inventaris_id)
        .single();

      if (invError || !newInvData) {
        throw new Error('Alat yang dipilih tidak ditemukan');
      }

      const requestedQty = data.jumlah_pinjam || currentPeminjaman.jumlah_pinjam;
      if (newInvData.jumlah_tersedia < requestedQty) {
        throw new Error(`Stok tidak cukup. Tersedia: ${newInvData.jumlah_tersedia}`);
      }
    }

    // If only changing quantity, check current inventaris stock
    if (data.jumlah_pinjam && !data.inventaris_id) {
      const { data: invData, error: invError } = await supabase
        .from('inventaris')
        .select('jumlah_tersedia')
        .eq('id', currentPeminjaman.inventaris_id)
        .single();

      if (invError || !invData) {
        throw new Error('Alat tidak ditemukan');
      }

      if (invData.jumlah_tersedia < data.jumlah_pinjam) {
        throw new Error(`Stok tidak cukup. Tersedia: ${invData.jumlah_tersedia}`);
      }
    }

    // Update peminjaman
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.inventaris_id) updateData.inventaris_id = data.inventaris_id;
    if (data.jumlah_pinjam) updateData.jumlah_pinjam = data.jumlah_pinjam;
    if (data.tanggal_pinjam) updateData.tanggal_pinjam = data.tanggal_pinjam;
    if (data.tanggal_kembali_rencana) updateData.tanggal_kembali_rencana = data.tanggal_kembali_rencana;
    if (data.keperluan) updateData.keperluan = data.keperluan;

    const { error: updateError } = await supabase
      .from('peminjaman')
      .update(updateData)
      .eq('id', peminjaman_id);

    if (updateError) {
      console.error('Error updating peminjaman:', updateError);
      throw updateError;
    }

    return { id: peminjaman_id };
  } catch (error) {
    console.error('Error updating borrowing request:', error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires update:peminjaman permission
export const updateBorrowingRequest = requirePermission('update:peminjaman', updateBorrowingRequestImpl);

/**
 * Cancel borrowing request (Batalkan Peminjaman)
 * Allows dosen to cancel their borrowing request ONLY if status is still 'pending'
 */
async function cancelBorrowingRequestImpl(peminjaman_id: string): Promise<{ id: string }> {
  try {
    // Get current peminjaman to check status and ownership
    const { data: currentPeminjaman, error: fetchError } = await supabase
      .from('peminjaman')
      .select('id, status, dosen_id')
      .eq('id', peminjaman_id)
      .single();

    if (fetchError || !currentPeminjaman) {
      throw new Error('Peminjaman tidak ditemukan');
    }

    // Only allow cancel if status is 'pending'
    if (currentPeminjaman.status !== 'pending') {
      throw new Error('Peminjaman hanya dapat dibatalkan jika statusnya masih menunggu (pending)');
    }

    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User tidak terautentikasi');

    const { data: dosenData, error: dosenError } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (dosenError || !dosenData) {
      throw new Error('Data dosen tidak ditemukan');
    }

    if (currentPeminjaman.dosen_id !== dosenData.id) {
      throw new Error('Anda hanya dapat membatalkan peminjaman Anda sendiri');
    }

    // Delete the peminjaman (hard delete karena status masih pending)
    const { error: deleteError } = await supabase
      .from('peminjaman')
      .delete()
      .eq('id', peminjaman_id);

    if (deleteError) {
      console.error('Error deleting peminjaman:', deleteError);
      throw deleteError;
    }

    return { id: peminjaman_id };
  } catch (error) {
    console.error('Error canceling borrowing request:', error);
    throw error;
  }
}

// 🔒 PROTECTED: Requires update:peminjaman permission
export const cancelBorrowingRequest = requirePermission('update:peminjaman', cancelBorrowingRequestImpl);

/**
 * INSTRUKSI PENAMBAHAN KE dosen.api.ts:
 *
 * 1. Copy kedua fungsi di atas (updateBorrowingRequestImpl dan cancelBorrowingRequestImpl)
 * 2. Tambahkan SETELAH fungsi markBorrowingAsTaken (sekitar line 1139)
 * 3. Tambahkan export ke dosenApi object di bagian EXPORTS:
 *
 *    export const dosenApi = {
 *      ...existing exports...
 *
 *      // Borrowing Request Management
 *      createBorrowingRequest,
 *      updateBorrowingRequest,   // <-- TAMBAHKAN INI
 *      cancelBorrowingRequest,   // <-- TAMBAHKAN INI
 *      getAvailableEquipment,
 *      markBorrowingAsTaken,
 *      returnBorrowingRequest,
 *    };
 */
