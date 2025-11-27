/**
 * Data Normalization Utilities
 * Standardize user inputs to ensure data consistency
 */

/**
 * Normalize full name - Title Case + Trim + Normalize spaces
 * @example
 * normalizeFullName("  siti  nurhaliza  ") → "Siti Nurhaliza"
 * normalizeFullName("SITI NURHALIZA") → "Siti Nurhaliza"
 */
export const normalizeFullName = (name: string): string => {
  if (!name) return '';

  return name
    .trim()
    .split(/\s+/) // Split by any whitespace, remove empty strings
    .filter(word => word.length > 0)
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

/**
 * Normalize NIM (Student ID) - UPPERCASE + Trim
 * @example
 * normalizeNIM("bd2321001") → "BD2321001"
 * normalizeNIM("BD 2321 001") → "BD2321001"
 */
export const normalizeNIM = (nim: string): string => {
  if (!nim) return '';

  return nim
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ''); // Remove all spaces
};

/**
 * Normalize email - Lowercase + Trim
 * @example
 * normalizeEmail("SITI@MAHASISWA.AC.ID") → "siti@mahasiswa.ac.id"
 * normalizeEmail("  Siti@Mahasiswa.ac.id  ") → "siti@mahasiswa.ac.id"
 */
export const normalizeEmail = (email: string): string => {
  if (!email) return '';

  return email.trim().toLowerCase();
};

/**
 * Normalize kelas nama - Title Case + Normalize spaces
 * @example
 * normalizeKelasNama("kelas a") → "Kelas A"
 * normalizeKelasNama("kelas a (pin merah)") → "Kelas A (Pin Merah)"
 */
export const normalizeKelasNama = (nama: string): string => {
  if (!nama) return '';

  return nama
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => {
      // Handle parentheses and special characters
      if (word.startsWith('(') || word.startsWith('-')) {
        // Keep opening parens as is, capitalize next letter
        const rest = word.slice(1);
        return (
          word.charAt(0) +
          (rest.length > 0
            ? rest.charAt(0).toUpperCase() + rest.slice(1).toLowerCase()
            : '')
        );
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Normalize kode kelas - UPPERCASE + Trim
 * @example
 * normalizeKodeKelas("kl-a") → "KL-A"
 * normalizeKodeKelas("kelas-a") → "KELAS-A"
 */
export const normalizeKodeKelas = (kode: string): string => {
  if (!kode) return '';

  return kode.trim().toUpperCase().replace(/\s+/g, '');
};

/**
 * Normalize phone - Remove special chars except +
 * @example
 * normalizePhone("+62 812 3456 7890") → "+628123456789"
 * normalizePhone("0812 3456 7890") → "08123456789"
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) return '';

  return phone.trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');
};

/**
 * Normalize program studi - Title Case
 * @example
 * normalizeProgramStudi("kebidanan") → "Kebidanan"
 * normalizeProgramStudi("KEPERAWATAN") → "Keperawatan"
 */
export const normalizeProgramStudi = (program: string): string => {
  if (!program) return '';

  return program
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

/**
 * Normalize dosen nama - Title Case + Trim
 * @example
 * normalizeDosenNama("dr. budi santoso") → "Dr. Budi Santoso"
 */
export const normalizeDosenNama = (nama: string): string => {
  if (!nama) return '';

  return nama
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => {
      // Handle titles like Dr., Prof., etc.
      if (word.endsWith('.')) {
        const base = word.slice(0, -1); // Remove the dot
        return base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() + '.';
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Validate and normalize mata kuliah nama - Title Case
 * @example
 * normalizeMataKuliahNama("praktikum kebidanan") → "Praktikum Kebidanan"
 */
export const normalizeMataKuliahNama = (nama: string): string => {
  if (!nama) return '';

  return nama
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

/**
 * Collection of all normalization functions for easy access
 */
export const normalize = {
  fullName: normalizeFullName,
  nim: normalizeNIM,
  email: normalizeEmail,
  kelasNama: normalizeKelasNama,
  kodeKelas: normalizeKodeKelas,
  phone: normalizePhone,
  programStudi: normalizeProgramStudi,
  dosenNama: normalizeDosenNama,
  mataKuliahNama: normalizeMataKuliahNama,
};
