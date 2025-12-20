/**
 * Kehadiran Export Utility
 * Exports attendance data to CSV format
 */

export interface KehadiranExportData {
  tanggal: string;
  kelas: string;
  mata_kuliah: string;
  nim: string;
  nama_mahasiswa: string;
  status: string;
  keterangan: string;
}

/**
 * Convert kehadiran data to CSV
 */
export function exportKehadiranToCSV(
  data: KehadiranExportData[],
  filename: string = 'kehadiran-export.csv'
): void {
  // CSV Headers
  const headers = [
    'Tanggal',
    'Kelas',
    'Mata Kuliah',
    'NIM',
    'Nama Mahasiswa',
    'Status',
    'Keterangan'
  ];

  // Convert data to CSV rows
  const rows = data.map(item => [
    item.tanggal,
    item.kelas,
    item.mata_kuliah,
    item.nim,
    item.nama_mahasiswa,
    item.status,
    item.keterangan || '-'
  ]);

  // Combine headers and rows, properly escaping CSV values
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        const escaped = String(cell).replace(/"/g, '""');
        return /[,"\n]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    )
  ].join('\n');

  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  // Trigger download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format tanggal for export filename
 */
export function formatExportFilename(
  mataKuliah: string,
  kelas: string,
  tanggal: string
): string {
  const dateStr = tanggal.replace(/-/g, '');
  const mkStr = mataKuliah.replace(/[^a-zA-Z0-9]/g, '_');
  const kelasStr = kelas.replace(/[^a-zA-Z0-9]/g, '_');
  return `kehadiran_${mkStr}_${kelasStr}_${dateStr}.csv`;
}
