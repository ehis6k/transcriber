/**
 * Development configuration for the Transcriber app
 */

export const DEV_CONFIG = {
  // App metadata
  APP_NAME: 'Transcriber',
  APP_VERSION: '0.1.0',

  // Debug settings
  DEBUG_MODE: true,
  LOG_LEVEL: 'info' as const,

  // Audio processing settings
  MAX_FILE_SIZE_MB: 100,
  SUPPORTED_FORMATS: ['wav', 'mp3', 'm4a', 'flac', 'ogg'] as const,

  // Storage settings
  STORAGE_PATH: './transcriber-data',
  AUTO_SAVE: true,

  // Performance settings
  CHUNK_SIZE_KB: 1024,
  PROCESSING_TIMEOUT_MS: 300000, // 5 minutes

  // Development server
  DEV_PORT: 1420,
  HMR_PORT: 1421,
} as const;

export const isProd = () => import.meta.env.PROD;
export const isDev = () => import.meta.env.DEV;

// Simple logger for development
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (DEV_CONFIG.DEBUG_MODE && DEV_CONFIG.LOG_LEVEL === 'info') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (DEV_CONFIG.DEBUG_MODE) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};
