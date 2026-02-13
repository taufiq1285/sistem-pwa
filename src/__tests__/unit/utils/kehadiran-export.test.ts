/**
 * White-box Tests for Kehadiran Export Utility
 *
 * Coverage Goals:
 * - Statement Coverage: 100%
 * - Branch Coverage: 100%
 * - Path Coverage: 100%
 * - Condition Coverage: 100%
 * - Data Flow Coverage: 100%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportKehadiranToCSV,
  formatExportFilename,
  type KehadiranExportData,
} from "@/lib/utils/kehadiran-export";

describe("kehadiran-export", () => {
  // Mock DOM elements and APIs
  let mockLink: HTMLAnchorElement;
  let mockCreateElement: ReturnType<typeof vi.spyOn>;
  let mockCreateObjectURL: ReturnType<typeof vi.spyOn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.spyOn>;
  let mockAppendChild: ReturnType<typeof vi.spyOn>;
  let mockRemoveChild: ReturnType<typeof vi.spyOn>;
  let mockClick: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock anchor element
    mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: { visibility: "" },
    } as unknown as HTMLAnchorElement;

    mockClick = mockLink.click;

    // Mock document.createElement
    mockCreateElement = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockLink);

    // Mock document.body.appendChild and removeChild
    mockAppendChild = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => mockLink);
    mockRemoveChild = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => mockLink);

    // Mock URL.createObjectURL and revokeObjectURL
    mockCreateObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    mockRevokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("SECTION 1: exportKehadiranToCSV - Basic Functionality", () => {
    it("should create CSV with valid data", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123456789",
          nama_mahasiswa: "John Doe",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data, "test-export.csv");

      // Verify blob creation
      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;

      // Verify MIME type
      expect(blob.type).toBe("text/csv;charset=utf-8;");

      // Verify download was triggered
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "href",
        "blob:mock-url",
      );
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        "test-export.csv",
      );
      expect(mockLink.style.visibility).toBe("hidden");
      expect(mockClick).toHaveBeenCalled();

      // Verify cleanup
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should use default filename if not provided", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123456789",
          nama_mahasiswa: "John Doe",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        "kehadiran-export.csv",
      );
    });

    it("should handle multiple records", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123456789",
          nama_mahasiswa: "John Doe",
          status: "Hadir",
          keterangan: "",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123456790",
          nama_mahasiswa: "Jane Smith",
          status: "Izin",
          keterangan: "Sakit",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123456791",
          nama_mahasiswa: "Bob Wilson",
          status: "Alpa",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data, "multi-record.csv");

      // Verify blob was created
      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;

      // Read blob content
      const text = await blob.text();

      // Verify headers
      expect(text).toContain(
        "Tanggal,Kelas,Mata Kuliah,NIM,Nama Mahasiswa,Status,Keterangan",
      );

      // Verify all records are present
      expect(text).toContain("John Doe");
      expect(text).toContain("Jane Smith");
      expect(text).toContain("Bob Wilson");
    });
  });

  describe("SECTION 2: CSV Formatting - Headers", () => {
    it("should include all required headers in correct order", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "Test User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      const lines = text.split("\n");
      // Remove BOM from first line
      const headerLine = lines[0].replace(/^\uFEFF/, "");

      expect(headerLine).toBe(
        "Tanggal,Kelas,Mata Kuliah,NIM,Nama Mahasiswa,Status,Keterangan",
      );
    });

    it("should include BOM for UTF-8 compatibility", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "Test User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // BOM should be present at the start
      expect(text.charCodeAt(0)).toBe(0xfeff); // BOM character
    });
  });

  describe("SECTION 3: CSV Escaping - Special Characters", () => {
    it("should escape quotes by doubling them", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: 'Pemrograman "Web"',
          nim: "123",
          nama_mahasiswa: 'John "The Boss" Doe',
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Quotes should be escaped
      expect(text).toContain('""Web""');
      expect(text).toContain('""The Boss""');
    });

    it("should wrap cells containing commas in quotes", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web, Lanjutan",
          nim: "123",
          nama_mahasiswa: "Doe, John",
          status: "Hadir",
          keterangan: "Telat, tapi hadir",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Cells with commas should be wrapped in quotes
      expect(text).toContain('"Pemrograman Web, Lanjutan"');
      expect(text).toContain('"Doe, John"');
      expect(text).toContain('"Telat, tapi hadir"');
    });

    it("should wrap cells containing newlines in quotes", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "John Doe",
          status: "Hadir",
          keterangan: "Line 1\nLine 2",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Cells with newlines should be wrapped in quotes
      expect(text).toContain('"Line 1\nLine 2"');
    });

    it("should handle combination of quotes and commas", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: 'Course "A", Section B',
          nim: "123",
          nama_mahasiswa: 'Doe, "Johnny" Jr.',
          status: "Hadir",
          keterangan: "Note: important, see \"doc\"",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should handle both quotes and commas properly
      expect(text).toContain('"Course ""A"", Section B"');
      expect(text).toContain('"Doe, ""Johnny"" Jr."');
      expect(text).toContain('"Note: important, see ""doc"""');
    });

    it("should NOT wrap cells without special characters", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123456789",
          nama_mahasiswa: "John Doe",
          status: "Hadir",
          keterangan: "Normal text",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Normal cells should NOT be wrapped in quotes
      expect(text).not.toMatch(/"Pemrograman Web"/);
      expect(text).not.toMatch(/"John Doe"/);
      expect(text).not.toMatch(/"Normal text"/);
    });
  });

  describe("SECTION 4: Empty/Keterangan Handling", () => {
    it("should replace empty keterangan with dash", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "John Doe",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Empty keterangan should be replaced with "-"
      const lines = text.split("\n");
      const dataLine = lines[1];
      expect(dataLine).toMatch(/Hadir,-$/);
    });

    it("should replace null/undefined keterangan with dash", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "John Doe",
          status: "Hadir",
          keterangan: null as any,
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      const lines = text.split("\n");
      const dataLine = lines[1];
      expect(dataLine).toMatch(/Hadir,-$/);
    });

    it("should preserve non-empty keterangan", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "John Doe",
          status: "Izin",
          keterangan: "Sakit flu",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      expect(text).toContain("Sakit flu");
      expect(text).not.toContain("Izin,-");
    });
  });

  describe("SECTION 5: Branch Coverage - CSV Escaping Logic", () => {
    it("should test regex pattern for special characters - matches comma", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test, Course",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should match regex /[,"\n]/ and wrap in quotes
      expect(text).toContain('"Test, Course"');
    });

    it("should test regex pattern for special characters - matches quote", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: 'Test "Course"',
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should match regex /[,"\n]/ and wrap in quotes
      expect(text).toContain('"Test ""Course"""');
    });

    it("should test regex pattern for special characters - matches newline", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test\nCourse",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should match regex /[,"\n]/ and wrap in quotes
      expect(text).toContain('"Test\nCourse"');
    });

    it("should test regex pattern for special characters - no match", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test Course",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should NOT match regex /[,"\n]/ - no wrapping
      expect(text).not.toContain('"Test Course"');
    });
  });

  describe("SECTION 6: DOM Manipulation", () => {
    it("should create anchor element and set attributes", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data, "custom.csv");

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "href",
        "blob:mock-url",
      );
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        "custom.csv",
      );
    });

    it("should hide link with visibility hidden", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      expect(mockLink.style.visibility).toBe("hidden");
    });

    it("should append link to document body", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
    });

    it("should trigger click event on link", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      expect(mockClick).toHaveBeenCalled();
    });

    it("should remove link from document body after click", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });

    it("should revoke object URL after download", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("SECTION 7: formatExportFilename - Basic", () => {
    it("should format filename with normal inputs", () => {
      const filename = formatExportFilename(
        "Pemrograman Web",
        "Kelas A",
        "2024-01-15",
      );

      expect(filename).toBe("kehadiran_Pemrograman_Web_Kelas_A_20240115.csv");
    });

    it("should replace hyphens in date with empty string", () => {
      const filename = formatExportFilename("Test", "A", "2024-12-31");

      expect(filename).toContain("20241231");
      expect(filename).not.toContain("2024-12-31");
    });

    it("should include csv extension", () => {
      const filename = formatExportFilename("Test", "A", "2024-01-15");

      expect(filename).toMatch(/\.csv$/);
    });
  });

  describe("SECTION 8: formatExportFilename - Special Character Sanitization", () => {
    it("should replace spaces in mata kuliah with underscores", () => {
      const filename = formatExportFilename(
        "Pemrograman Web Lanjutan",
        "A",
        "2024-01-15",
      );

      expect(filename).toContain("Pemrograman_Web_Lanjutan");
      expect(filename).not.toContain("Pemrograman Web Lanjutan");
    });

    it("should replace spaces in kelas with underscores", () => {
      const filename = formatExportFilename(
        "Test",
        "Kelas A Pagi",
        "2024-01-15",
      );

      expect(filename).toContain("Kelas_A_Pagi");
      expect(filename).not.toContain("Kelas A Pagi");
    });

    it("should remove special characters from mata kuliah", () => {
      const filename = formatExportFilename(
        "Pemrograman@Web#2024!",
        "A",
        "2024-01-15",
      );

      expect(filename).toContain("Pemrograman_Web_2024_");
      expect(filename).not.toContain("@");
      expect(filename).not.toContain("#");
      expect(filename).not.toContain("!");
    });

    it("should remove special characters from kelas", () => {
      const filename = formatExportFilename(
        "Test",
        "Kelas (A) - Pagi",
        "2024-01-15",
      );

      // "Kelas (A) - Pagi" → "Kelas__A____Pagi" (2 underscores after Kelas, 4 after A)
      expect(filename).toMatch(/Kelas__A____Pagi/);
      expect(filename).not.toContain("(");
      expect(filename).not.toContain(")");
      expect(filename).not.toContain("-");
    });

    it("should preserve alphanumeric characters", () => {
      const filename = formatExportFilename(
        "CS101",
        "Room123",
        "2024-01-15",
      );

      expect(filename).toContain("CS101");
      expect(filename).toContain("Room123");
    });

    it("should handle combination of special characters", () => {
      const filename = formatExportFilename(
        "Course @#$% Name!",
        "Kelas (A/B)",
        "2024-01-15",
      );

      // Should only keep alphanumeric and underscores
      expect(filename).toMatch(/^kehadiran_[A-Za-z0-9_]+_[A-Za-z0-9_]+_\d{8}\.csv$/);
    });
  });

  describe("SECTION 9: Path Coverage - Export Flow", () => {
    it("should execute complete export path: data → CSV → blob → download", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data, "test.csv");

      // Step 1: Data transformation to CSV rows
      expect(mockCreateObjectURL).toHaveBeenCalled();

      // Step 2: Blob creation
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("text/csv;charset=utf-8;");

      // Step 3: URL creation
      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);

      // Step 4: DOM manipulation and download
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockClick).toHaveBeenCalled();

      // Step 5: Cleanup
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it("should handle empty data array", async () => {
      const data: KehadiranExportData[] = [];

      exportKehadiranToCSV(data, "empty.csv");

      // Should still create blob (with only headers)
      expect(mockCreateObjectURL).toHaveBeenCalled();
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should have headers but no data rows
      const lines = text.split("\n").filter((l) => l.trim());
      expect(lines.length).toBe(1); // Header only
      expect(lines[0]).toContain("Tanggal,Kelas");
    });
  });

  describe("SECTION 10: Data Flow Coverage", () => {
    it("should trace data flow: input → CSV transformation → blob → download", async () => {
      const inputData: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123456789",
          nama_mahasiswa: "John Doe",
          status: "Hadir",
          keterangan: "On time",
        },
      ];

      exportKehadiranToCSV(inputData);

      // Verify data flow through CSV transformation
      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Verify each field is preserved in output
      expect(text).toContain("2024-01-15"); // tanggal
      expect(text).toContain("A"); // kelas
      expect(text).toContain("Pemrograman Web"); // mata_kuliah
      expect(text).toContain("123456789"); // nim
      expect(text).toContain("John Doe"); // nama_mahasiswa
      expect(text).toContain("Hadir"); // status
      expect(text).toContain("On time"); // keterangan
    });

    it("should trace filename flow: inputs → sanitization → final filename", () => {
      const mataKuliah = "Pemrograman Web 2024";
      const kelas = "Kelas A";
      const tanggal = "2024-01-15";

      const filename = formatExportFilename(mataKuliah, kelas, tanggal);

      // Verify sanitization applied
      expect(filename).toContain("Pemrograman_Web_2024");
      expect(filename).toContain("Kelas_A");
      expect(filename).toContain("20240115");

      // Verify final format
      expect(filename).toBe(
        "kehadiran_Pemrograman_Web_2024_Kelas_A_20240115.csv",
      );
    });
  });

  describe("SECTION 11: Real-World Scenarios", () => {
    it("should export attendance data for entire class", async () => {
      const classData: KehadiranExportData[] = Array.from(
        { length: 30 },
        (_, i) => ({
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: `12345678${i.toString().padStart(2, "0")}`,
          nama_mahasiswa: `Student ${i + 1}`,
          status: i % 5 === 0 ? "Izin" : "Hadir",
          keterangan: i % 5 === 0 ? "Keperluan pribadi" : "",
        }),
      );

      exportKehadiranToCSV(classData, "class-attendance.csv");

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Verify all 30 students are in export
      const lines = text.split("\n").filter((l) => l.trim());
      expect(lines.length).toBe(31); // 1 header + 30 data

      // Verify headers present
      expect(text).toContain("Tanggal,Kelas,Mata Kuliah");

      // Verify some students present
      expect(text).toContain("Student 1");
      expect(text).toContain("Student 30");
    });

    it("should handle export with Indonesian characters", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123456789",
          nama_mahasiswa: "Budi Santoso",
          status: "Hadir",
          keterangan: "Terlambat 5 menit",
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should handle Indonesian characters properly
      expect(text).toContain("Budi Santoso");
      expect(text).toContain("Terlambat 5 menit");

      // BOM should ensure UTF-8 compatibility
      expect(text.charCodeAt(0)).toBe(0xfeff);
    });

    it("should handle mixed statuses in single export", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "1",
          nama_mahasiswa: "Student 1",
          status: "Hadir",
          keterangan: "",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "2",
          nama_mahasiswa: "Student 2",
          status: "Izin",
          keterangan: "Sakit",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "3",
          nama_mahasiswa: "Student 3",
          status: "Sakit",
          keterangan: "Demam",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "4",
          nama_mahasiswa: "Student 4",
          status: "Alpa",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Verify all statuses present
      expect(text).toContain("Hadir");
      expect(text).toContain("Izin");
      expect(text).toContain("Sakit");
      expect(text).toContain("Alpa");
    });

    it("should generate filename with special characters sanitized", () => {
      const filename = formatExportFilename(
        "Basis Data (Praktikum)",
        "Kelas A & B",
        "2024-12-31",
      );

      // Should remove all special characters
      expect(filename).toMatch(/^kehadiran_[A-Za-z0-9_]+_[A-Za-z0-9_]+_\d{8}\.csv$/);

      // Should not contain problematic characters
      expect(filename).not.toContain("(");
      expect(filename).not.toContain(")");
      expect(filename).not.toContain("&");
    });
  });

  describe("SECTION 12: Edge Cases", () => {
    it("should handle very long names", async () => {
      const longName = "A".repeat(200);
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: longName,
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should include the long name
      expect(text).toContain(longName);
    });

    it("should handle unicode characters in data", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test 测试",
          nim: "123",
          nama_mahasiswa: "John Doe 你好",
          status: "Hadir",
          keterangan: "Note 📝",
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should preserve unicode characters
      expect(text).toContain("测试");
      expect(text).toContain("你好");
      expect(text).toContain("📝");

      // BOM should be present
      expect(text.charCodeAt(0)).toBe(0xfeff);
    });

    it("should handle filename with consecutive special characters", () => {
      const filename = formatExportFilename(
        "Course@@@###!!!Name",
        "Kelas(((A)))",
        "2024-01-15",
      );

      // Course@@@###!!!Name → Course_________Name (9 underscores)
      // Kelas(((A))) → Kelas___A___ (3 underscores on each side of A)
      expect(filename).toMatch(/Course_________Name/);
      expect(filename).toMatch(/Kelas___A___/);
    });

    it("should handle empty strings in filename inputs", () => {
      const filename = formatExportFilename("", "", "2024-01-15");

      // Should still generate valid filename
      expect(filename).toMatch(/^kehadiran___\d{8}\.csv$/);
    });
  });

  describe("SECTION 13: Blob Creation Verification", () => {
    it("should create blob with correct content", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;

      // Verify blob properties
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe("text/csv;charset=utf-8;");
    });

    it("should create blob with BOM prefix", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // BOM should be first character
      expect(text.charCodeAt(0)).toBe(0xfeff);

      // Content should follow BOM
      expect(text.substring(1)).toContain("Tanggal,Kelas");
    });
  });

  describe("SECTION 14: Integration Tests", () => {
    it("should integrate formatExportFilename with exportKehadiranToCSV", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      const filename = formatExportFilename(
        "Pemrograman Web",
        "A",
        "2024-01-15",
      );

      exportKehadiranToCSV(data, filename);

      // Verify filename was used
      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        filename,
      );

      // Verify CSV was created
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it("should generate and export realistic attendance report", async () => {
      // Generate realistic attendance data
      const attendanceData: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "1234567890",
          nama_mahasiswa: "Ahmad Fauzi",
          status: "Hadir",
          keterangan: "",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "1234567891",
          nama_mahasiswa: "Siti Rahayu",
          status: "Hadir",
          keterangan: "",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "1234567892",
          nama_mahasiswa: "Budi Prakoso",
          status: "Izin",
          keterangan: "Keperluan keluarga",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Pemrograman Web",
          nim: "1234567893",
          nama_mahasiswa: "Dewi Lestari",
          status: "Sakit",
          keterangan: "Demam",
        },
      ];

      const filename = formatExportFilename(
        "Pemrograman Web",
        "A",
        "2024-01-15",
      );

      exportKehadiranToCSV(attendanceData, filename);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Verify realistic data
      expect(text).toContain("Ahmad Fauzi");
      expect(text).toContain("Siti Rahayu");
      expect(text).toContain("Budi Prakoso");
      expect(text).toContain("Dewi Lestari");
      expect(text).toContain("Keperluan keluarga");
      expect(text).toContain("Demam");

      // Verify filename
      expect(filename).toBe("kehadiran_Pemrograman_Web_A_20240115.csv");
    });
  });

  describe("SECTION 15: Complete Path Coverage", () => {
    it("Path 1: Normal data export with all fields filled", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "Normal export",
        },
      ];

      exportKehadiranToCSV(data);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it("Path 2: Data with special characters requiring escaping", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: 'Test, "Course"',
          nim: "123",
          nama_mahasiswa: "User\nName",
          status: "Hadir",
          keterangan: "Special chars",
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Verify escaping applied
      expect(text).toContain('"Test, ""Course""');
      expect(text).toContain('"User\nName"');
    });

    it("Path 3: Empty data array (only headers)", async () => {
      const data: KehadiranExportData[] = [];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Should have headers only
      expect(text).toContain("Tanggal,Kelas");
      const lines = text.split("\n").filter((l) => l.trim());
      expect(lines.length).toBe(1);
    });

    it("Path 4: Data with null/undefined keterangan", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: null as any,
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      // Null keterangan should be replaced with dash
      expect(text).toMatch(/Hadir,-$/);
    });

    it("Path 5: Filename with no special characters", () => {
      const filename = formatExportFilename("Test123", "A1", "2024-01-15");

      expect(filename).toBe("kehadiran_Test123_A1_20240115.csv");
    });

    it("Path 6: Filename with special characters requiring sanitization", () => {
      const filename = formatExportFilename(
        "Test@Course!",
        "Kelas (A)",
        "2024-01-15",
      );

      expect(filename).not.toContain("@");
      expect(filename).not.toContain("!");
      expect(filename).not.toContain("(");
      expect(filename).not.toContain(")");
    });

    it("Path 7: Multiple records with mixed data", async () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "1",
          nama_mahasiswa: "User 1",
          status: "Hadir",
          keterangan: "",
        },
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "2",
          nama_mahasiswa: "User 2",
          status: "Izin",
          keterangan: "Sakit",
        },
      ];

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      expect(text).toContain("User 1");
      expect(text).toContain("User 2");
    });

    it("Path 8: Large dataset export", async () => {
      const data: KehadiranExportData[] = Array.from(
        { length: 100 },
        (_, i) => ({
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: `${i}`,
          nama_mahasiswa: `User ${i}`,
          status: "Hadir",
          keterangan: "",
        }),
      );

      exportKehadiranToCSV(data);

      const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
      const text = await blob.text();

      const lines = text.split("\n").filter((l) => l.trim());
      expect(lines.length).toBe(101); // 1 header + 100 data
    });

    it("Path 9: Export with custom filename", () => {
      const data: KehadiranExportData[] = [
        {
          tanggal: "2024-01-15",
          kelas: "A",
          mata_kuliah: "Test",
          nim: "123",
          nama_mahasiswa: "User",
          status: "Hadir",
          keterangan: "",
        },
      ];

      exportKehadiranToCSV(data, "custom-export-2024.csv");

      expect(mockLink.setAttribute).toHaveBeenCalledWith(
        "download",
        "custom-export-2024.csv",
      );
    });
  });
});
