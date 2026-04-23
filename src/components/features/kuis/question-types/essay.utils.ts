import type { EssaySettings } from "./Essay";

const DEFAULT_MIN_WORDS = 50;
const DEFAULT_MAX_WORDS = 500;
const DEFAULT_CHARACTER_LIMIT = 5000;

export function validateEssay(settings: EssaySettings): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (
    settings.maxWords &&
    settings.minWords &&
    settings.minWords > settings.maxWords
  ) {
    errors.push("Maksimal kata harus lebih besar dari minimal kata");
  }

  if (settings.minWords && settings.minWords > 5000) {
    errors.push("Minimal kata terlalu besar (maksimal 5000 kata)");
  }

  if (settings.maxWords && settings.maxWords > 10000) {
    errors.push("Maksimal kata terlalu besar (maksimal 10000 kata)");
  }

  if (settings.characterLimit && settings.characterLimit > 50000) {
    errors.push("Batas karakter terlalu besar (maksimal 50000 karakter)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getDefaultEssaySettings(): EssaySettings {
  return {
    minWords: DEFAULT_MIN_WORDS,
    maxWords: DEFAULT_MAX_WORDS,
    characterLimit: DEFAULT_CHARACTER_LIMIT,
    rubric: "",
  };
}

export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function validateEssayAnswer(
  answer: string,
  settings: EssaySettings,
): {
  isValid: boolean;
  wordCount: number;
  characterCount: number;
  errors: string[];
} {
  const wordCount = countWords(answer);
  const characterCount = countCharacters(answer);
  const errors: string[] = [];

  if (settings.minWords && wordCount < settings.minWords) {
    errors.push(
      `Minimal ${settings.minWords} kata (saat ini: ${wordCount} kata)`,
    );
  }

  if (settings.maxWords && wordCount > settings.maxWords) {
    errors.push(
      `Maksimal ${settings.maxWords} kata (saat ini: ${wordCount} kata)`,
    );
  }

  if (settings.characterLimit && characterCount > settings.characterLimit) {
    errors.push(
      `Maksimal ${settings.characterLimit} karakter (saat ini: ${characterCount} karakter)`,
    );
  }

  return {
    isValid: errors.length === 0,
    wordCount,
    characterCount,
    errors,
  };
}
