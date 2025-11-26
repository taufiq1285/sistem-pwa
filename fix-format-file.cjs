const fs = require('fs');
const path = require('path');

console.log('Fixing format.ts...\n');

const formatPath = path.join(__dirname, 'src/lib/utils/format.ts');
const formatContent = `/**
 * Format Utilities
 * Common formatting functions for dates, currency, file sizes, etc.
 */

/**
 * Format date to Indonesian format
 */
export function formatDate(date?: Date | string | null): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = dateObj.toLocaleString('id-ID', { month: 'short' });
  const year = dateObj.getFullYear();

  return \`\${day} \${month} \${year}\`;
}

/**
 * Format time to HH:MM format
 */
export function formatTime(date?: Date | string | null): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return \`\${hours}:\${minutes}\`;
}

/**
 * Format date and time
 */
export function formatDateTime(date?: Date | string | null): string {
  if (!date) return '';
  return \`\${formatDate(date)} \${formatTime(date)}\`;
}

/**
 * Format currency to IDR
 */
export function formatCurrency(amount?: number | null, currency = 'IDR'): string {
  if (amount === null || amount === undefined) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num?: number | null): string {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value?: number | null): string {
  if (value === null || value === undefined) return '0%';
  return \`\${Math.round(value * 100) / 100}%\`;
}

/**
 * Format file size in bytes to human readable
 */
export function formatFileSize(bytes?: number | null): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds?: number | null): string {
  if (seconds === null || seconds === undefined) return '0 detik';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return \`\${hours} jam \${minutes} menit\`;
  } else if (minutes > 0) {
    return \`\${minutes} menit \${secs} detik\`;
  }
  return \`\${secs} detik\`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date?: Date | string | null): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return \`\${diffMins} menit yang lalu\`;
  if (diffHours < 24) return \`\${diffHours} jam yang lalu\`;
  if (diffDays < 7) return \`\${diffDays} hari yang lalu\`;

  return formatDate(date);
}

/**
 * Format phone number to Indonesian format
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '';

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\\D/g, '');

  // Format based on length
  if (cleaned.length === 11 || cleaned.length === 12) {
    // Format: 0812-3456-7890
    return cleaned.replace(/(\\d{4})(\\d{4})(\\d+)/, '$1-$2-$3');
  }

  return phone;
}
`;

fs.writeFileSync(formatPath, formatContent, 'utf8');
console.log('✓ Fixed: format.ts');
