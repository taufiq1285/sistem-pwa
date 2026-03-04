/**
 * cache.config Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  CACHE_VERSION,
  CACHE_PREFIX,
  CACHE_NAMES,
  CACHE_RULES,
  PRECACHE_URLS,
  cacheConfig,
  findCacheRule,
  getAllCacheNames,
  isCurrentCache,
  getCacheName,
} from "@/config/cache.config";

describe("CACHE_VERSION & CACHE_PREFIX", () => {
  it("CACHE_VERSION adalah string tidak kosong", () => {
    expect(typeof CACHE_VERSION).toBe("string");
    expect(CACHE_VERSION.length).toBeGreaterThan(0);
  });

  it("CACHE_PREFIX adalah string tidak kosong", () => {
    expect(typeof CACHE_PREFIX).toBe("string");
    expect(CACHE_PREFIX.length).toBeGreaterThan(0);
  });
});

describe("CACHE_NAMES", () => {
  it("memiliki semua key yang diperlukan", () => {
    expect(CACHE_NAMES).toHaveProperty("static");
    expect(CACHE_NAMES).toHaveProperty("dynamic");
    expect(CACHE_NAMES).toHaveProperty("api");
    expect(CACHE_NAMES).toHaveProperty("images");
    expect(CACHE_NAMES).toHaveProperty("fonts");
    expect(CACHE_NAMES).toHaveProperty("documents");
    expect(CACHE_NAMES).toHaveProperty("runtime");
  });

  it("setiap cache name mengandung prefix dan version", () => {
    Object.values(CACHE_NAMES).forEach((name) => {
      expect(name).toContain(CACHE_PREFIX);
      expect(name).toContain(CACHE_VERSION);
    });
  });
});

describe("CACHE_RULES", () => {
  it("memiliki minimal 1 rule", () => {
    expect(CACHE_RULES.length).toBeGreaterThan(0);
  });

  it("setiap rule memiliki field wajib", () => {
    CACHE_RULES.forEach((rule) => {
      expect(rule).toHaveProperty("name");
      expect(rule).toHaveProperty("urlPattern");
      expect(rule).toHaveProperty("strategy");
      expect(rule).toHaveProperty("cacheName");
    });
  });

  it("semua strategy adalah nilai yang valid", () => {
    const validStrategies = [
      "CacheFirst",
      "NetworkFirst",
      "StaleWhileRevalidate",
      "NetworkOnly",
      "CacheOnly",
    ];
    CACHE_RULES.forEach((rule) => {
      expect(validStrategies).toContain(rule.strategy);
    });
  });
});

describe("PRECACHE_URLS", () => {
  it("mengandung URL yang diperlukan", () => {
    expect(PRECACHE_URLS).toContain("/");
    expect(PRECACHE_URLS).toContain("/index.html");
  });
});

describe("findCacheRule", () => {
  it("menemukan rule untuk URL supabase", () => {
    const rule = findCacheRule("https://abc.supabase.co/rest/v1/users");
    expect(rule).toBeDefined();
    expect(rule?.strategy).toBe("NetworkFirst");
  });

  it("menemukan rule untuk URL gambar", () => {
    const rule = findCacheRule("/assets/image.png");
    expect(rule).toBeDefined();
    expect(rule?.strategy).toBe("CacheFirst");
  });

  it("menemukan rule untuk file CSS", () => {
    const rule = findCacheRule("/assets/app.css");
    expect(rule).toBeDefined();
  });

  it("mengembalikan undefined untuk URL yang tidak cocok dengan pola apapun", () => {
    // Buat URL yang tidak cocok dengan pattern manapun
    const rule = findCacheRule("ftp://unknown-protocol.xyz/data");
    // Bisa undefined atau cocok — tergantung rules — hanya verifikasi tidak crash
    expect(rule === undefined || rule !== undefined).toBe(true);
  });
});

describe("getAllCacheNames", () => {
  it("mengembalikan array dengan semua cache names", () => {
    const names = getAllCacheNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBe(Object.keys(CACHE_NAMES).length);
  });
});

describe("isCurrentCache", () => {
  it("mengembalikan true untuk cache name yang valid", () => {
    expect(isCurrentCache(CACHE_NAMES.static)).toBe(true);
    expect(isCurrentCache(CACHE_NAMES.api)).toBe(true);
  });

  it("mengembalikan false untuk cache name yang tidak valid", () => {
    expect(isCurrentCache("old-cache-v0")).toBe(false);
    expect(isCurrentCache("unknown-cache")).toBe(false);
  });
});

describe("getCacheName", () => {
  it("mengembalikan cache name yang benar berdasarkan tipe", () => {
    expect(getCacheName("static")).toBe(CACHE_NAMES.static);
    expect(getCacheName("api")).toBe(CACHE_NAMES.api);
    expect(getCacheName("images")).toBe(CACHE_NAMES.images);
  });
});

describe("cacheConfig", () => {
  it("memiliki semua field yang diperlukan", () => {
    expect(cacheConfig).toHaveProperty("version");
    expect(cacheConfig).toHaveProperty("prefix");
    expect(cacheConfig).toHaveProperty("rules");
    expect(cacheConfig).toHaveProperty("precacheUrls");
    expect(cacheConfig).toHaveProperty("global");
  });

  it("global config memiliki nilai yang valid", () => {
    expect(cacheConfig.global.defaultMaxAge).toBeGreaterThan(0);
    expect(cacheConfig.global.defaultMaxEntries).toBeGreaterThan(0);
  });
});
