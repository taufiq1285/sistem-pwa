import type { FileUploadSettings } from "./FileUploadQuestion";

export function getDefaultFileUploadSettings(): FileUploadSettings {
  return {
    instructions:
      "Upload file laporan praktikum Anda dalam format PDF atau Word.",
    acceptedTypes: {
      pdf: true,
      word: true,
      image: false,
      zip: false,
    },
    maxSizeMB: 10,
    allowMultiple: false,
    rubric: "",
  };
}

export function validateFileUploadSettings(settings: FileUploadSettings): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!settings.instructions.trim()) {
    errors.push("Instruksi harus diisi");
  }

  const hasAcceptedType = Object.values(settings.acceptedTypes).some(Boolean);
  if (!hasAcceptedType) {
    errors.push("Pilih minimal satu tipe file yang diterima");
  }

  if (settings.maxSizeMB < 1) {
    errors.push("Ukuran maksimal minimal 1 MB");
  }
  if (settings.maxSizeMB > 20) {
    errors.push("Ukuran maksimal tidak boleh lebih dari 20 MB");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getAcceptString(
  types: FileUploadSettings["acceptedTypes"],
): string {
  const accepts: string[] = [];

  if (types.pdf) {
    accepts.push(".pdf", "application/pdf");
  }
  if (types.word) {
    accepts.push(
      ".doc",
      ".docx",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  }
  if (types.image) {
    accepts.push(".jpg", ".jpeg", ".png", "image/jpeg", "image/png");
  }
  if (types.zip) {
    accepts.push(".zip", "application/zip");
  }

  return accepts.join(",");
}
