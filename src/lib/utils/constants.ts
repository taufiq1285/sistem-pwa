/**
 * Application Constants
 *
 * Purpose: Application-wide constant values
 * Priority: Medium
 * Dependencies: None
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  /** Default request timeout in milliseconds */
  TIMEOUT: 30000,
  /** Maximum number of retry attempts for failed requests */
  RETRY_ATTEMPTS: 3,
  /** Initial delay between retries in milliseconds */
  RETRY_DELAY: 1000,
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_PAGE_SIZE: 10,
  /** Maximum number of items per page */
  MAX_PAGE_SIZE: 100,
  /** Available page size options */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * File Upload Configuration
 */
export const FILE_UPLOAD = {
  /** Maximum file size in bytes (10MB) */
  MAX_SIZE: 10 * 1024 * 1024,
  /** Allowed image MIME types */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  /** Allowed document MIME types */
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ],
} as const;

/**
 * Quiz Configuration
 */
export const QUIZ = {
  /** Minimum number of questions in a quiz */
  MIN_QUESTIONS: 1,
  /** Maximum number of questions in a quiz */
  MAX_QUESTIONS: 100,
  /** Minimum number of options for multiple choice */
  MIN_OPTIONS: 2,
  /** Maximum number of options for multiple choice */
  MAX_OPTIONS: 6,
  /** Default time limit in minutes */
  DEFAULT_TIME_LIMIT: 60,
  /** Auto-save interval in milliseconds (30 seconds) */
  AUTO_SAVE_INTERVAL: 30000,
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  /** Authentication token */
  AUTH_TOKEN: 'auth_token',
  /** User data */
  USER: 'user_data',
  /** Theme preference */
  THEME: 'theme',
  /** Offline data cache */
  OFFLINE_DATA: 'offline_data',
  /** Sync queue */
  SYNC_QUEUE: 'sync_queue',
  /** Last sync timestamp */
  LAST_SYNC: 'last_sync',
} as const;

/**
 * User Roles
 */
export const ROLES = {
  /** Administrator role */
  ADMIN: 'admin',
  /** Dosen (Lecturer) role */
  DOSEN: 'dosen',
  /** Laboran (Lab Assistant) role */
  LABORAN: 'laboran',
  /** Mahasiswa (Student) role */
  MAHASISWA: 'mahasiswa',
} as const;

/**
 * Sync Configuration
 */
export const SYNC = {
  /** Maximum retry attempts for failed sync operations */
  RETRY_LIMIT: 3,
  /** Number of items to sync in a single batch */
  BATCH_SIZE: 10,
  /** Conflict resolution strategy */
  CONFLICT_RESOLUTION: {
    /** Server data takes precedence */
    SERVER_WINS: 'server-wins',
    /** Client data takes precedence */
    CLIENT_WINS: 'client-wins',
    /** Most recent update wins */
    LAST_WRITE_WINS: 'last-write-wins',
    /** Require manual resolution */
    MANUAL: 'manual',
  },
} as const;

/**
 * Network Status
 */
export const NETWORK = {
  /** Interval to check network status in milliseconds */
  CHECK_INTERVAL: 5000,
  /** Timeout for network requests in milliseconds */
  REQUEST_TIMEOUT: 10000,
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum password length */
  MAX_PASSWORD_LENGTH: 128,
  /** Minimum username length */
  MIN_USERNAME_LENGTH: 3,
  /** Maximum username length */
  MAX_USERNAME_LENGTH: 50,
  /** Email regex pattern */
  EMAIL_PATTERN: /^[^s@]+@[^s@]+.[^s@]+$/,
} as const;

/**
 * Date/Time Formats
 */
export const DATE_FORMATS = {
  /** Display format: DD/MM/YYYY */
  DISPLAY: 'DD/MM/YYYY',
  /** Display with time: DD/MM/YYYY HH:mm */
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  /** ISO format for API: YYYY-MM-DDTHH:mm:ss */
  ISO: 'YYYY-MM-DDTHH:mm:ss',
  /** Time only: HH:mm */
  TIME_ONLY: 'HH:mm',
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
