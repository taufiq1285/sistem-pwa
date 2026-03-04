/**
 * app.config Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  APP_CONFIG,
  FEATURES,
  API_CONFIG,
  STORAGE_CONFIG,
} from "@/config/app.config";

describe("APP_CONFIG", () => {
  it("memiliki nama aplikasi yang benar", () => {
    expect(APP_CONFIG.name).toBe("Sistem Praktikum PWA");
  });

  it("memiliki version string", () => {
    expect(typeof APP_CONFIG.version).toBe("string");
    expect(APP_CONFIG.version.length).toBeGreaterThan(0);
  });

  it("memiliki description", () => {
    expect(typeof APP_CONFIG.description).toBe("string");
  });

  it("memiliki urls object dengan key yang benar", () => {
    expect(APP_CONFIG.urls).toHaveProperty("base");
    expect(APP_CONFIG.urls).toHaveProperty("api");
    expect(APP_CONFIG.urls).toHaveProperty("cdn");
  });
});

describe("FEATURES", () => {
  it("offlineMode aktif", () => {
    expect(FEATURES.offlineMode).toBe(true);
  });

  it("backgroundSync aktif", () => {
    expect(FEATURES.backgroundSync).toBe(true);
  });

  it("quiz feature dikonfigurasi dengan benar", () => {
    expect(FEATURES.quiz.enabled).toBe(true);
    expect(FEATURES.quiz.offlineAttempts).toBe(true);
    expect(FEATURES.quiz.autoSave).toBe(true);
    expect(typeof FEATURES.quiz.maxAttemptsPerQuiz).toBe("number");
    expect(FEATURES.quiz.maxAttemptsPerQuiz).toBeGreaterThan(0);
  });

  it("materi feature dikonfigurasi dengan benar", () => {
    expect(FEATURES.materi.enabled).toBe(true);
    expect(FEATURES.materi.fileUpload).toBe(true);
    expect(FEATURES.materi.maxFileSize).toBeGreaterThan(0);
  });

  it("reports feature dikonfigurasi dengan benar", () => {
    expect(FEATURES.reports.enabled).toBe(true);
  });
});

describe("API_CONFIG", () => {
  it("memiliki supabase config", () => {
    expect(API_CONFIG.supabase).toHaveProperty("url");
    expect(API_CONFIG.supabase).toHaveProperty("anonKey");
  });

  it("timeout bernilai positif", () => {
    expect(API_CONFIG.timeout).toBeGreaterThan(0);
  });

  it("retryAttempts bernilai positif", () => {
    expect(API_CONFIG.retryAttempts).toBeGreaterThan(0);
  });

  it("supabase auth config dikonfigurasi dengan benar", () => {
    expect(API_CONFIG.supabase.auth.persistSession).toBe(true);
    expect(API_CONFIG.supabase.auth.autoRefreshToken).toBe(true);
  });
});

describe("STORAGE_CONFIG", () => {
  it("localStorage memiliki key yang diperlukan", () => {
    expect(STORAGE_CONFIG.localStorage).toHaveProperty("theme");
    expect(STORAGE_CONFIG.localStorage).toHaveProperty("authToken");
    expect(STORAGE_CONFIG.localStorage).toHaveProperty("lastSync");
  });

  it("indexedDB memiliki konfigurasi yang valid", () => {
    expect(STORAGE_CONFIG.indexedDB.name).toBeTruthy();
    expect(STORAGE_CONFIG.indexedDB.version).toBeGreaterThan(0);
    expect(STORAGE_CONFIG.indexedDB.quota).toBeGreaterThan(0);
  });

  it("cacheStorage memiliki konfigurasi yang valid", () => {
    expect(STORAGE_CONFIG.cacheStorage.name).toBeTruthy();
    expect(STORAGE_CONFIG.cacheStorage.maxAge).toBeGreaterThan(0);
  });
});
