/**
 * Storage Helper Functions Unit Tests
 * Tests pure logic functions for file handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateUniqueFileName,
  getFileExtension,
  getFileTypeCategory,
  formatFileSize,
} from '@/lib/supabase/storage';

describe('Storage Helper Functions', () => {
  describe('generateUniqueFileName()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should generate unique filename with timestamp and random string', () => {
      const result = generateUniqueFileName('document.pdf');

      // Should contain original name (cleaned)
      expect(result).toContain('document');
      // Should contain a timestamp (13 digits)
      expect(result).toMatch(/_\d{13}_/);
      // Should have .pdf extension
      expect(result).toMatch(/\.pdf$/);
      // Should match pattern: name_timestamp_random.extension
      expect(result).toMatch(/^[a-zA-Z0-9_-]+_\d+_[a-z0-9]+\.pdf$/);
    });

    it('should clean special characters from filename', () => {
      const result = generateUniqueFileName('my file!@#$%^&*().txt');

      // Special characters should be replaced with underscores
      expect(result).toContain('my_file_________');
      expect(result).not.toContain('!');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
      expect(result).toMatch(/\.txt$/);
    });

    it('should handle filenames with multiple dots', () => {
      const result = generateUniqueFileName('archive.tar.gz');

      // Should use last extension only
      expect(result).toMatch(/\.gz$/);
      expect(result).toContain('archive_tar');
    });

    it('should truncate long filenames to 50 characters', () => {
      const longName = 'a'.repeat(100) + '.pdf';
      const result = generateUniqueFileName(longName);

      // Extract the cleaned name part (before timestamp)
      const namePart = result.split('_')[0];
      expect(namePart.length).toBeLessThanOrEqual(50);
    });

    it('should preserve valid characters (alphanumeric, dash, underscore)', () => {
      const result = generateUniqueFileName('valid-file_name123.jpg');

      expect(result).toContain('valid-file_name123');
    });

    it('should handle files with no extension', () => {
      const result = generateUniqueFileName('noextension');

      // When no extension, .pop() returns the filename itself
      // So extension becomes 'noextension'
      expect(result).toMatch(/_\d+_[a-z0-9]+\.noextension$/);
    });

    it('should handle empty filename', () => {
      const result = generateUniqueFileName('');

      // Should create filename with just timestamp and random
      expect(result).toMatch(/^_\d+_[a-z0-9]+\.$/);
    });

    it('should generate different random strings for same filename', () => {
      // Mock Math.random to return different values
      const random1 = 0.123456;
      const random2 = 0.654321;

      vi.spyOn(Math, 'random').mockReturnValueOnce(random1);
      const result1 = generateUniqueFileName('test.txt');

      vi.spyOn(Math, 'random').mockReturnValueOnce(random2);
      const result2 = generateUniqueFileName('test.txt');

      // Results should be different due to different random strings
      expect(result1).not.toBe(result2);
    });
  });

  describe('getFileExtension()', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return lowercase extension', () => {
      expect(getFileExtension('Document.PDF')).toBe('pdf');
      expect(getFileExtension('Image.JPG')).toBe('jpg');
      expect(getFileExtension('File.TXT')).toBe('txt');
    });

    it('should handle files with no extension', () => {
      // .split('.').pop() returns the whole filename if no dot
      expect(getFileExtension('noextension')).toBe('noextension');
    });

    it('should handle files with multiple dots', () => {
      expect(getFileExtension('my.file.name.txt')).toBe('txt');
    });

    it('should handle empty string', () => {
      expect(getFileExtension('')).toBe('');
    });

    it('should handle filename ending with dot', () => {
      expect(getFileExtension('filename.')).toBe('');
    });

    it('should handle hidden files (starting with dot)', () => {
      expect(getFileExtension('.gitignore')).toBe('gitignore');
      expect(getFileExtension('.env')).toBe('env');
    });
  });

  describe('getFileTypeCategory()', () => {
    it('should categorize image types', () => {
      expect(getFileTypeCategory('image/jpeg')).toBe('image');
      expect(getFileTypeCategory('image/png')).toBe('image');
      expect(getFileTypeCategory('image/gif')).toBe('image');
      expect(getFileTypeCategory('image/webp')).toBe('image');
    });

    it('should categorize video types', () => {
      expect(getFileTypeCategory('video/mp4')).toBe('video');
      expect(getFileTypeCategory('video/webm')).toBe('video');
      expect(getFileTypeCategory('video/quicktime')).toBe('video');
    });

    it('should categorize audio types', () => {
      expect(getFileTypeCategory('audio/mpeg')).toBe('audio');
      expect(getFileTypeCategory('audio/wav')).toBe('audio');
      expect(getFileTypeCategory('audio/ogg')).toBe('audio');
    });

    it('should categorize PDF', () => {
      expect(getFileTypeCategory('application/pdf')).toBe('pdf');
    });

    it('should categorize document types', () => {
      expect(getFileTypeCategory('application/msword')).toBe('document');
      expect(
        getFileTypeCategory(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe('document');
    });

    it('should categorize spreadsheet types', () => {
      expect(getFileTypeCategory('application/vnd.ms-excel')).toBe('spreadsheet');
      // Note: The code checks for 'document' before 'spreadsheet',
      // so .spreadsheetml.sheet gets categorized as 'document'
      expect(
        getFileTypeCategory(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
      ).toBe('document');
    });

    it('should categorize presentation types', () => {
      expect(getFileTypeCategory('application/vnd.ms-powerpoint')).toBe('presentation');
      // Note: The code checks for 'document' before 'presentation',
      // so .presentationml.presentation gets categorized as 'document'
      expect(
        getFileTypeCategory(
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
      ).toBe('document');
    });

    it('should categorize archive types', () => {
      expect(getFileTypeCategory('application/zip')).toBe('archive');
      expect(getFileTypeCategory('application/x-rar-compressed')).toBe('archive');
    });

    it('should categorize text types', () => {
      expect(getFileTypeCategory('text/plain')).toBe('text');
      expect(getFileTypeCategory('text/html')).toBe('text');
      expect(getFileTypeCategory('text/css')).toBe('text');
    });

    it('should return "other" for unknown types', () => {
      expect(getFileTypeCategory('application/octet-stream')).toBe('other');
      expect(getFileTypeCategory('unknown/type')).toBe('other');
      expect(getFileTypeCategory('')).toBe('other');
    });

    it('should be case sensitive (no toLowerCase in code)', () => {
      // The code doesn't convert to lowercase, so uppercase won't match
      expect(getFileTypeCategory('IMAGE/JPEG')).toBe('other');
      expect(getFileTypeCategory('VIDEO/MP4')).toBe('other');
      // Lowercase works
      expect(getFileTypeCategory('image/jpeg')).toBe('image');
      expect(getFileTypeCategory('video/mp4')).toBe('video');
    });
  });

  describe('formatFileSize()', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes (< 1024)', () => {
      expect(formatFileSize(100)).toBe('100 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB'); // 1024 * 1024
      expect(formatFileSize(2097152)).toBe('2 MB'); // 2 * 1024 * 1024
      expect(formatFileSize(5242880)).toBe('5 MB'); // 5 * 1024 * 1024
      expect(formatFileSize(1572864)).toBe('1.5 MB'); // 1.5 * 1024 * 1024
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB'); // 1024 * 1024 * 1024
      expect(formatFileSize(2147483648)).toBe('2 GB'); // 2 * 1024 * 1024 * 1024
      expect(formatFileSize(5368709120)).toBe('5 GB'); // 5 * 1024 * 1024 * 1024
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1234567)).toBe('1.18 MB');
      expect(formatFileSize(123456789)).toBe('117.74 MB');
    });

    it('should handle very small sizes', () => {
      expect(formatFileSize(1)).toBe('1 Bytes');
      expect(formatFileSize(10)).toBe('10 Bytes');
    });

    it('should handle very large sizes', () => {
      const largeSize = 10 * 1024 * 1024 * 1024; // 10 GB
      expect(formatFileSize(largeSize)).toBe('10 GB');
    });

    it('should not show unnecessary decimal zeros', () => {
      const result = formatFileSize(1024);
      expect(result).toBe('1 KB'); // Not "1.00 KB"
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete file upload flow', () => {
      const originalFile = 'My Document (2024).pdf';
      const extension = getFileExtension(originalFile);
      const uniqueName = generateUniqueFileName(originalFile);
      const category = getFileTypeCategory('application/pdf');
      const size = formatFileSize(2048576); // ~2MB

      expect(extension).toBe('pdf');
      expect(uniqueName).toContain('My_Document__2024_');
      expect(uniqueName).toMatch(/\.pdf$/);
      expect(category).toBe('pdf');
      expect(size).toBe('1.95 MB');
    });

    it('should handle image file scenario', () => {
      const fileName = 'vacation-photo.jpg';
      const extension = getFileExtension(fileName);
      const category = getFileTypeCategory('image/jpeg');
      const size = formatFileSize(1536000); // ~1.5MB

      expect(extension).toBe('jpg');
      expect(category).toBe('image');
      expect(size).toBe('1.46 MB');
    });
  });
});
