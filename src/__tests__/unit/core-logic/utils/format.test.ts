/**
 * Format Utilities Unit Tests
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatFileSize,
  formatDuration,
  formatRelativeTime,
  formatPhoneNumber,
} from "@/lib/utils/format";

describe("Format Utilities", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  describe("date formatting", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const formatted = formatDate(date);

      // Should return Indonesian date format
      expect(formatted).toContain("2024");
      expect(formatted).toBeTruthy();
    });

    it("should handle invalid dates", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
      expect(formatDate("")).toBe("");
    });
  });

  describe("number formatting", () => {
    it("should format numbers with separator", () => {
      expect(formatNumber(1000)).toBe("1.000");
      expect(formatNumber(1000000)).toBe("1.000.000");
      expect(formatNumber(null)).toBe("0");
      expect(formatNumber(undefined)).toBe("0");
    });

    it("should format currency", () => {
      const formatted = formatCurrency(50000);
      expect(formatted).toContain("50.000");
      expect(formatted).toContain("Rp");

      expect(formatCurrency(null)).toBe("Rp 0");
      expect(formatCurrency(undefined)).toBe("Rp 0");
    });
  });

  describe("text formatting", () => {
    it("should format percentage", () => {
      expect(formatPercentage(75)).toBe("75%");
      expect(formatPercentage(0)).toBe("0%");
      expect(formatPercentage(null)).toBe("0%");
    });

    it("should format file size", () => {
      expect(formatFileSize(1024)).toBe("1 KB");
      expect(formatFileSize(1048576)).toBe("1 MB");
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(null)).toBe("0 Bytes");
    });
  });

  describe("time and combined formatting", () => {
    it("should format time and date-time from string input", () => {
      const input = "2024-01-15T10:30:00";

      expect(formatTime(input)).toBe("10:30");
      expect(formatDateTime(input)).toContain("2024");
      expect(formatDateTime(null)).toBe("");
    });
  });

  describe("duration formatting", () => {
    it("should format durations for hours, minutes, and seconds", () => {
      expect(formatDuration(3665)).toBe("1 jam 1 menit");
      expect(formatDuration(125)).toBe("2 menit 5 detik");
      expect(formatDuration(45)).toBe("45 detik");
      expect(formatDuration(null)).toBe("0 detik");
    });
  });

  describe("relative time formatting", () => {
    it("should format recent, minute, hour, day, and older dates", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-10T12:00:00Z"));

      expect(formatRelativeTime("2024-01-10T11:59:45Z")).toBe("Baru saja");
      expect(formatRelativeTime("2024-01-10T11:30:00Z")).toBe(
        "30 menit yang lalu",
      );
      expect(formatRelativeTime("2024-01-10T10:00:00Z")).toBe(
        "2 jam yang lalu",
      );
      expect(formatRelativeTime("2024-01-08T12:00:00Z")).toBe(
        "2 hari yang lalu",
      );
      expect(formatRelativeTime("2024-01-01T12:00:00Z")).toContain("2024");
      expect(formatRelativeTime(undefined)).toBe("");
    });
  });

  describe("phone formatting", () => {
    it("should format Indonesian phone numbers and preserve unsupported values", () => {
      expect(formatPhoneNumber("081234567890")).toBe("0812-3456-7890");
      expect(formatPhoneNumber("0812-345-678")).toBe("0812-345-678");
      expect(formatPhoneNumber(null)).toBe("");
    });
  });
});
