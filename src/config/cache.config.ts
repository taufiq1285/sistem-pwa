/**
 * Cache Configuration
 *
 * Defines caching strategies, rules, and settings for PWA
 *
 * Strategy Types:
 * - CacheFirst: Cache � Network � Fallback (best for static assets)
 * - NetworkFirst: Network � Cache � Fallback (best for API calls)
 * - StaleWhileRevalidate: Cache (immediate) + Network (background) (best for frequent updates)
 * - NetworkOnly: Always fetch from network
 * - CacheOnly: Always use cache
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Cache strategy types
 */
export type CacheStrategy =
  | "CacheFirst"
  | "NetworkFirst"
  | "StaleWhileRevalidate"
  | "NetworkOnly"
  | "CacheOnly";

/**
 * Cache rule configuration
 */
export interface CacheRule {
  /** Unique identifier for the rule */
  name: string;
  /** URL pattern to match (string or RegExp) */
  urlPattern: string | RegExp;
  /** Cache strategy to use */
  strategy: CacheStrategy;
  /** Cache name */
  cacheName: string;
  /** Maximum age in milliseconds */
  maxAge?: number;
  /** Maximum number of entries */
  maxEntries?: number;
  /** Network timeout in milliseconds (for NetworkFirst) */
  networkTimeout?: number;
  /** Custom options */
  options?: CacheRuleOptions;
}

/**
 * Cache rule options
 */
export interface CacheRuleOptions {
  /** Cache opaque responses (cross-origin) */
  cacheOpaqueResponses?: boolean;
  /** Background sync tag for failed requests */
  backgroundSyncTag?: string;
  /** Range request support */
  rangeRequests?: boolean;
  /** Broadcast cache updates */
  broadcastUpdate?: boolean;
  /** Precache on install */
  precache?: boolean;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache version - increment to force cache refresh */
  version: string;
  /** Cache prefix */
  prefix: string;
  /** Cache rules */
  rules: CacheRule[];
  /** Static assets to precache on install */
  precacheUrls: string[];
  /** Global cache settings */
  global: {
    /** Default max age for cached items */
    defaultMaxAge: number;
    /** Default max entries per cache */
    defaultMaxEntries: number;
    /** Enable debug logging */
    debug: boolean;
  };
}

// ============================================================================
// CACHE NAMES
// ============================================================================

export const CACHE_VERSION = "v1.0.0";
export const CACHE_PREFIX = "praktikum-pwa";

/**
 * Cache names by type
 */
export const CACHE_NAMES = {
  /** Static assets (HTML, CSS, JS, fonts) */
  static: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  /** Dynamic pages and content */
  dynamic: `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`,
  /** API responses */
  api: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  /** Images and media */
  images: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  /** Fonts */
  fonts: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`,
  /** Documents (PDF, DOCX, etc.) */
  documents: `${CACHE_PREFIX}-documents-${CACHE_VERSION}`,
  /** Runtime cache for misc requests */
  runtime: `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`,
} as const;

// ============================================================================
// PRECACHE URLS
// ============================================================================

/**
 * URLs to precache on service worker installation
 * These will be available offline immediately
 */
export const PRECACHE_URLS = [
  // Core app shell
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",

  // Add critical assets here
  // '/assets/logo.png',
  // '/assets/icon-192.png',
  // '/assets/icon-512.png',
];

// ============================================================================
// CACHE RULES
// ============================================================================

/**
 * Cache rules define how different types of requests are cached
 * Rules are evaluated in order - first match wins
 */
export const CACHE_RULES: CacheRule[] = [
  // ========================================
  // API CALLS - Network First
  // ========================================
  {
    name: "supabase-api",
    urlPattern: /https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
    strategy: "NetworkFirst",
    cacheName: CACHE_NAMES.api,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50,
    networkTimeout: 5000, // 5 seconds
    options: {
      backgroundSyncTag: "supabase-sync",
    },
  },
  {
    name: "api-calls",
    urlPattern: /\/api\/.*/,
    strategy: "NetworkFirst",
    cacheName: CACHE_NAMES.api,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 50,
    networkTimeout: 3000,
  },

  // ========================================
  // IMAGES - Cache First
  // ========================================
  {
    name: "images",
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
    strategy: "CacheFirst",
    cacheName: CACHE_NAMES.images,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 60,
    options: {
      cacheOpaqueResponses: true,
    },
  },

  // ========================================
  // FONTS - Cache First
  // ========================================
  {
    name: "fonts",
    urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
    strategy: "CacheFirst",
    cacheName: CACHE_NAMES.fonts,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 30,
  },
  {
    name: "google-fonts-webfonts",
    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
    strategy: "CacheFirst",
    cacheName: CACHE_NAMES.fonts,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 30,
    options: {
      cacheOpaqueResponses: true,
    },
  },
  {
    name: "google-fonts-stylesheets",
    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
    strategy: "StaleWhileRevalidate",
    cacheName: CACHE_NAMES.fonts,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  },

  // ========================================
  // DOCUMENTS - Cache First
  // ========================================
  {
    name: "documents",
    urlPattern: /\.(?:pdf|doc|docx|xls|xlsx|ppt|pptx)$/i,
    strategy: "CacheFirst",
    cacheName: CACHE_NAMES.documents,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 20,
    options: {
      rangeRequests: true,
    },
  },

  // ========================================
  // STATIC ASSETS - Cache First
  // ========================================
  {
    name: "static-js",
    urlPattern: /\.js$/i,
    strategy: "CacheFirst",
    cacheName: CACHE_NAMES.static,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50,
  },
  {
    name: "static-css",
    urlPattern: /\.css$/i,
    strategy: "CacheFirst",
    cacheName: CACHE_NAMES.static,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 30,
  },
  {
    name: "static-html",
    urlPattern: /\.html$/i,
    strategy: "NetworkFirst",
    cacheName: CACHE_NAMES.static,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    networkTimeout: 3000,
  },

  // ========================================
  // ASSETS - Stale While Revalidate
  // ========================================
  {
    name: "assets",
    urlPattern: /\/assets\/.*/,
    strategy: "StaleWhileRevalidate",
    cacheName: CACHE_NAMES.static,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 100,
  },

  // ========================================
  // DYNAMIC PAGES - Stale While Revalidate
  // ========================================
  {
    name: "pages",
    urlPattern: /^https?:\/\/[^/]+\/(?!api\/).*/,
    strategy: "StaleWhileRevalidate",
    cacheName: CACHE_NAMES.dynamic,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50,
  },
];

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * Main cache configuration
 */
export const cacheConfig: CacheConfig = {
  version: CACHE_VERSION,
  prefix: CACHE_PREFIX,
  rules: CACHE_RULES,
  precacheUrls: PRECACHE_URLS,
  global: {
    defaultMaxAge: 24 * 60 * 60 * 1000, // 24 hours
    defaultMaxEntries: 50,
    debug: import.meta.env.MODE === "development",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find matching cache rule for a URL
 */
export function findCacheRule(url: string): CacheRule | undefined {
  return CACHE_RULES.find((rule) => {
    if (typeof rule.urlPattern === "string") {
      return url.includes(rule.urlPattern);
    }
    return rule.urlPattern.test(url);
  });
}

/**
 * Get all cache names
 */
export function getAllCacheNames(): string[] {
  return Object.values(CACHE_NAMES);
}

/**
 * Check if cache name is valid (current version)
 */
export function isCurrentCache(cacheName: string): boolean {
  return getAllCacheNames().includes(cacheName);
}

/**
 * Get cache name by type
 */
export function getCacheName(type: keyof typeof CACHE_NAMES): string {
  return CACHE_NAMES[type];
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default cacheConfig;
